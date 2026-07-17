import type { AstroCookies } from "astro";
import type { D1Database } from "@cloudflare/workers-types";
import { env } from "cloudflare:workers";
import {
  encodeText,
  hmacSign,
  sha256Hex,
  timingSafeEqual,
  toBase64Url,
} from "./crypto";

// Anonyme reservasjoner (MVP.md §9): nettleseren får en tilfeldig
// gjenopprettingskode i en signert cookie. Bare SHA-256-hashen av koden
// lagres i databasen, og hashen brukes til å avgjøre hva gjeldende gjest
// har reservert.
// Cookieformat: "<token>.<base64url(HMAC-SHA256(token))>"

export const RESERVATION_COOKIE = "reservasjon";

// Lengre enn gjestesesjonen (30 d), slik at angre-muligheten ikke
// utløper før selve navnefesten.
const RESERVATION_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;
const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ234567890";
const RECOVERY_CODE_LENGTH = 20;

function getReservationSecret(): string {
  const secret = env.RESERVATION_SECRET;
  if (!secret) {
    throw new Error("Miljøvariabelen RESERVATION_SECRET er ikke satt");
  }
  return secret;
}

// 100 tilfeldige biter, delt inn i fire korte grupper. Tegn som lett
// forveksles (I, L, O og 1) er utelatt, så koden er enkel å skrive ned.
export function createRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_CODE_LENGTH));
  const characters = Array.from(bytes, (byte) => RECOVERY_ALPHABET[byte & 31]).join("");
  return characters.match(/.{1,5}/g)!.join("-");
}

export function normalizeRecoveryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const compact = value.toUpperCase().replace(/[\s-]/g, "");
  if (
    compact.length !== RECOVERY_CODE_LENGTH ||
    !new RegExp(`^[${RECOVERY_ALPHABET}]+$`).test(compact)
  ) {
    return null;
  }
  return compact.match(/.{1,5}/g)!.join("-");
}

function setReservationToken(cookies: AstroCookies, token: string): Promise<void> {
  return hmacSign(getReservationSecret(), token).then((signature) => {
    cookies.set(RESERVATION_COOKIE, `${token}.${toBase64Url(signature)}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: import.meta.env.PROD,
      path: "/",
      maxAge: RESERVATION_TOKEN_TTL_SECONDS,
    });
  });
}

// Returnerer hashen av gjestens reservasjonstoken, eller null dersom
// cookien mangler eller signaturen ikke stemmer.
export async function getReservationTokenHash(
  cookies: AstroCookies,
): Promise<string | null> {
  const raw = cookies.get(RESERVATION_COOKIE)?.value;
  if (!raw) return null;

  const sigIndex = raw.lastIndexOf(".");
  if (sigIndex <= 0) return null;
  const token = raw.slice(0, sigIndex);
  const signature = raw.slice(sigIndex + 1);

  const expected = toBase64Url(await hmacSign(getReservationSecret(), token));
  if (!timingSafeEqual(encodeText(signature), encodeText(expected))) return null;

  return sha256Hex(token);
}

// Gjenbruker gyldig token fra cookien, ellers utstedes et nytt
// kryptografisk tilfeldig token (MVP.md §9). Returnerer hashen som
// brukes i databasen.
export async function getOrCreateReservationToken(
  cookies: AstroCookies,
): Promise<{ tokenHash: string; recoveryCode?: string }> {
  const existing = await getReservationTokenHash(cookies);
  if (existing) return { tokenHash: existing };

  const recoveryCode = createRecoveryCode();
  await setReservationToken(cookies, recoveryCode);
  return { tokenHash: await sha256Hex(recoveryCode), recoveryCode };
}

// API-laget må i tillegg sjekke at hashen faktisk har reservasjoner før
// denne brukes, slik at en feilstavet kode aldri blir en aktiv identitet.
export async function restoreReservationToken(
  cookies: AstroCookies,
  recoveryCode: unknown,
): Promise<string | null> {
  const token = normalizeRecoveryCode(recoveryCode);
  if (!token) return null;
  await setReservationToken(cookies, token);
  return sha256Hex(token);
}

export type ReserveResult = "created" | "already-mine" | "conflict";

// Delt med klientkoden via ./display-name (denne filen kan ikke
// importeres i nettleseren fordi den drar inn "cloudflare:workers").
export { MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from "./display-name";

// Enkeltgave: den betingede INSERT-en er ett SQL-statement og dermed
// atomisk – to samtidige forespørsler kan ikke begge få changes > 0
// (MVP.md §11).
export async function reserveSingleGift(
  db: D1Database,
  giftId: string,
  tokenHash: string,
): Promise<ReserveResult> {
  const result = await db
    .prepare(
      `INSERT INTO reservations (id, gift_id, reservation_token_hash, created_at)
       SELECT ?1, ?2, ?3, ?4
       WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE gift_id = ?2)`,
    )
    .bind(crypto.randomUUID(), giftId, tokenHash, new Date().toISOString())
    .run();

  if (result.meta.changes > 0) return "created";

  const existing = await db
    .prepare("SELECT reservation_token_hash FROM reservations WHERE gift_id = ?")
    .bind(giftId)
    .first<{ reservation_token_hash: string }>();
  return existing?.reservation_token_hash === tokenHash ? "already-mine" : "conflict";
}

// Spleisegave: flere interessenter tillatt; den unike indeksen
// (gift_id, reservation_token_hash) sørger for maks én per nettleser.
// Visningsnavnet er påkrevd (MVP.md §8) og valideres i API-laget med
// normalizeDisplayName før dette kalles.
export async function addGroupInterest(
  db: D1Database,
  giftId: string,
  tokenHash: string,
  displayName: string,
): Promise<ReserveResult> {
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO reservations (id, gift_id, reservation_token_hash, display_name, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(crypto.randomUUID(), giftId, tokenHash, displayName, new Date().toISOString())
    .run();
  if (result.meta.changes > 0) return "created";

  // Allerede påmeldt: en ny innsending oppdaterer navnet på egen rad,
  // slik at man kan rette det uten å trekke interessen først.
  await db
    .prepare(
      `UPDATE reservations SET display_name = ?1
       WHERE gift_id = ?2 AND reservation_token_hash = ?3`,
    )
    .bind(displayName, giftId, tokenHash)
    .run();
  return "already-mine";
}

// Navnene på spleisedeltakerne, i påmeldingsrekkefølge. Skal kun
// eksponeres til gjester som selv deltar på gaven (MVP.md §8) –
// tilgangskontrollen ligger i API-laget. Returnerer aldri hasher.
export async function getGroupParticipants(
  db: D1Database,
  giftId: string,
): Promise<string[]> {
  const { results } = await db
    .prepare(
      `SELECT display_name FROM reservations
       WHERE gift_id = ?1 AND display_name IS NOT NULL
       ORDER BY created_at, rowid`,
    )
    .bind(giftId)
    .all<{ display_name: string }>();
  return results.map((row) => row.display_name);
}

// Sletter kun raden som samsvarer med gjestens eget token (MVP.md §12).
export async function deleteMyReservation(
  db: D1Database,
  giftId: string,
  tokenHash: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      "DELETE FROM reservations WHERE gift_id = ? AND reservation_token_hash = ?",
    )
    .bind(giftId, tokenHash)
    .run();
  return result.meta.changes > 0;
}

// Admin-nullstilling: fjerner alle reservasjoner på en gave (MVP.md §12).
export async function deleteAllReservationsForGift(
  db: D1Database,
  giftId: string,
): Promise<number> {
  const result = await db
    .prepare("DELETE FROM reservations WHERE gift_id = ?")
    .bind(giftId)
    .run();
  return result.meta.changes;
}

export async function getGiftReservationStatus(
  db: D1Database,
  giftId: string,
  tokenHash: string | null,
): Promise<{ reservationCount: number; reservedByCurrentVisitor: boolean }> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN reservation_token_hash = ?2 THEN 1 ELSE 0 END), 0) AS mine
       FROM reservations WHERE gift_id = ?1`,
    )
    .bind(giftId, tokenHash ?? "")
    .first<{ total: number; mine: number }>();
  return {
    reservationCount: row?.total ?? 0,
    reservedByCurrentVisitor: (row?.mine ?? 0) > 0,
  };
}

export async function countReservationsByGift(
  db: D1Database,
): Promise<Map<string, number>> {
  const { results } = await db
    .prepare(
      "SELECT gift_id, COUNT(*) AS reservation_count FROM reservations GROUP BY gift_id",
    )
    .all<{ gift_id: string; reservation_count: number }>();
  return new Map(results.map((row) => [row.gift_id, row.reservation_count]));
}

export async function getGiftIdsReservedBy(
  db: D1Database,
  tokenHash: string,
): Promise<Set<string>> {
  const { results } = await db
    .prepare("SELECT gift_id FROM reservations WHERE reservation_token_hash = ?")
    .bind(tokenHash)
    .all<{ gift_id: string }>();
  return new Set(results.map((row) => row.gift_id));
}
