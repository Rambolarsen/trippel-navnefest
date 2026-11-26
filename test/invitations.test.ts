import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInvitationToken,
  getWishlistsWithInvitationToken,
  verifyInvitationToken,
} from "../src/lib/invitations";

const db = env.DB;

beforeEach(async () => {
  await db.prepare("DELETE FROM invitation_tokens").run();
});

describe("invitasjonslenker", () => {
  it("oppretter en tilfeldig token som kun verifiseres via hash", async () => {
    const { token } = await createInvitationToken(db, "navnefest");
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await getWishlistsWithInvitationToken(db)).toEqual(new Set(["navnefest"]));
    expect(await verifyInvitationToken(db, token)).toBe("navnefest");
    expect(await verifyInvitationToken(db, "feil-token")).toBe(null);

    const stored = await db
      .prepare("SELECT token_hash FROM invitation_tokens WHERE wishlist_id = 'navnefest'")
      .first<{ token_hash: string }>();
    expect(stored?.token_hash).not.toBe(token);
  });

  it("tilbakekaller den gamle lenken når admin lager en ny", async () => {
    const first = await createInvitationToken(db, "navnefest");
    const second = await createInvitationToken(db, "navnefest");
    expect(await verifyInvitationToken(db, first.token)).toBe(null);
    expect(await verifyInvitationToken(db, second.token)).toBe("navnefest");
  });

  it("hver ønskeliste har sin egen lenke", async () => {
    const navnefest = await createInvitationToken(db, "navnefest");
    const jul = await createInvitationToken(db, "jul");
    expect(await verifyInvitationToken(db, navnefest.token)).toBe("navnefest");
    expect(await verifyInvitationToken(db, jul.token)).toBe("jul");
    expect(await getWishlistsWithInvitationToken(db)).toEqual(new Set(["navnefest", "jul"]));

    // Ny julelenke påvirker ikke navnefestlenken
    await createInvitationToken(db, "jul");
    expect(await verifyInvitationToken(db, jul.token)).toBe(null);
    expect(await verifyInvitationToken(db, navnefest.token)).toBe("navnefest");
  });
});
