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
