import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInvitationToken,
  hasActiveInvitationToken,
  verifyInvitationToken,
} from "../src/lib/invitations";

const db = env.DB;

beforeEach(async () => {
  await db.prepare("DELETE FROM invitation_tokens").run();
});

describe("invitasjonslenker", () => {
  it("oppretter en tilfeldig token som kun verifiseres via hash", async () => {
    const { token } = await createInvitationToken(db);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await hasActiveInvitationToken(db)).toBe(true);
    expect(await verifyInvitationToken(db, token)).toBe(true);
    expect(await verifyInvitationToken(db, "feil-token")).toBe(false);

    const stored = await db
      .prepare("SELECT token_hash FROM invitation_tokens WHERE id = 1")
      .first<{ token_hash: string }>();
    expect(stored?.token_hash).not.toBe(token);
  });

  it("tilbakekaller den gamle lenken når admin lager en ny", async () => {
    const first = await createInvitationToken(db);
    const second = await createInvitationToken(db);
    expect(await verifyInvitationToken(db, first.token)).toBe(false);
    expect(await verifyInvitationToken(db, second.token)).toBe(true);
  });
});
