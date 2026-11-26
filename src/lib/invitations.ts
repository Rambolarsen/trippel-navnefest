import type { D1Database } from "@cloudflare/workers-types";
import { isWishlistId, type WishlistId } from "../data/wishlists";
import { constantTimeStringEqual, sha256Hex, toBase64Url } from "./crypto";

// Én aktiv invitasjonslenke per ønskeliste. Kun hash av den tilfeldige
// tokenen lagres, slik at lenken ikke kan hentes ut igjen fra databasen.

type InvitationTokenRow = {
  wishlist_id: string;
  token_hash: string;
};

export async function createInvitationToken(
  db: D1Database,
  wishlistId: WishlistId,
): Promise<{ token: string }> {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256Hex(token);

  await db
    .prepare(
      `INSERT INTO invitation_tokens (wishlist_id, token_hash, created_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(wishlist_id) DO UPDATE SET token_hash = excluded.token_hash, created_at = excluded.created_at`,
    )
    .bind(wishlistId, tokenHash, new Date().toISOString())
    .run();

  return { token };
}

export async function getWishlistsWithInvitationToken(
  db: D1Database,
): Promise<Set<WishlistId>> {
  const { results } = await db
    .prepare("SELECT wishlist_id FROM invitation_tokens")
    .all<{ wishlist_id: string }>();
  return new Set(results.map((row) => row.wishlist_id).filter(isWishlistId));
}

// Returnerer listen lenken gir tilgang til, eller null.
export async function verifyInvitationToken(
  db: D1Database,
  token: string,
): Promise<WishlistId | null> {
  const { results } = await db
    .prepare("SELECT wishlist_id, token_hash FROM invitation_tokens")
    .all<InvitationTokenRow>();
  const tokenHash = await sha256Hex(token);

  // Hashene er fast lange og sammenlignes via den sentrale, konstante
  // tidsfunksjonen – alle rader sjekkes, uansett treff. Selve tokenet
  // ligger aldri i D1.
  let match: WishlistId | null = null;
  for (const row of results) {
    if (
      (await constantTimeStringEqual(tokenHash, row.token_hash)) &&
      match === null &&
      isWishlistId(row.wishlist_id)
    ) {
      match = row.wishlist_id;
    }
  }
  return match;
}
