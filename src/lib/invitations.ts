import type { D1Database } from "@cloudflare/workers-types";
import { constantTimeStringEqual, sha256Hex, toBase64Url } from "./crypto";

type InvitationTokenRow = {
  token_hash: string;
};

export async function createInvitationToken(
  db: D1Database,
): Promise<{ token: string }> {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256Hex(token);

  await db
    .prepare(
      `INSERT INTO invitation_tokens (id, token_hash, created_at)
       VALUES (1, ?1, ?2)
       ON CONFLICT(id) DO UPDATE SET token_hash = excluded.token_hash, created_at = excluded.created_at`,
    )
    .bind(tokenHash, new Date().toISOString())
    .run();

  return { token };
}

export async function hasActiveInvitationToken(db: D1Database): Promise<boolean> {
  return (await db.prepare("SELECT 1 FROM invitation_tokens WHERE id = 1").first()) !== null;
}

export async function verifyInvitationToken(
  db: D1Database,
  token: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT token_hash FROM invitation_tokens WHERE id = 1")
    .first<InvitationTokenRow>();
  if (!row) return false;

  // Hashen er fast lang og sammenlignes via den sentrale, konstante
  // tidsfunksjonen. Selve tokenet ligger aldri i D1.
  return constantTimeStringEqual(await sha256Hex(token), row.token_hash);
}
