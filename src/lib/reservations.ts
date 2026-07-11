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

// Anonyme reservasjoner (MVP.md §9): nettleseren får et tilfeldig token
// i en signert cookie. Bare SHA-256-hashen av tokenet lagres i databasen,
// og hashen brukes til å avgjøre hva gjeldende gjest har reservert.
// Cookieformat: "<token>.<base64url(HMAC-SHA256(token))>"

export const RESERVATION_COOKIE = "reservasjon";

// Lengre enn gjestesesjonen (30 d), slik at angre-muligheten ikke
// utløper før selve navnefesten.
const RESERVATION_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;

function getReservationSecret(): string {
  const secret = env.RESERVATION_SECRET;
  if (!secret) {
    throw new Error("Miljøvariabelen RESERVATION_SECRET er ikke satt");
  }
  return secret;
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
export async function getOrCreateReservationTokenHash(
  cookies: AstroCookies,
): Promise<string> {
  const existing = await getReservationTokenHash(cookies);
  if (existing) return existing;

  const token = crypto.randomUUID();
  const signature = toBase64Url(await hmacSign(getReservationSecret(), token));
  cookies.set(RESERVATION_COOKIE, `${token}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    maxAge: RESERVATION_TOKEN_TTL_SECONDS,
  });
  return sha256Hex(token);
}

export type ReserveResult = "created" | "already-mine" | "conflict";

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
export async function addGroupInterest(
  db: D1Database,
  giftId: string,
  tokenHash: string,
): Promise<ReserveResult> {
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO reservations (id, gift_id, reservation_token_hash, created_at)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(crypto.randomUUID(), giftId, tokenHash, new Date().toISOString())
    .run();
  return result.meta.changes > 0 ? "created" : "already-mine";
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
