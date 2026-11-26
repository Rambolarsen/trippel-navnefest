import { describe, expect, it } from "vitest";
import { findGift, isWishlistId, WISHLIST_IDS, wishlists } from "../src/data/wishlists";

describe("ønskelister", () => {
  it("gave-id-er er unike på tvers av alle lister", () => {
    // Reservasjonene i D1 er knyttet til gave-id, så en id som går igjen
    // på to lister ville delt reservasjoner mellom dem.
    const ids = wishlists.flatMap((list) => list.gifts.map((gift) => gift.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hver liste-id er definert nøyaktig én gang", () => {
    expect(wishlists.map((list) => list.id).sort()).toEqual([...WISHLIST_IDS].sort());
  });

  it("hver liste har sin egen passphrase-variabel", () => {
    const secrets = wishlists.map((list) => list.passphraseSecret);
    expect(new Set(secrets).size).toBe(secrets.length);
  });

  it("findGift returnerer listen gaven hører til", () => {
    expect(findGift("nintendo-switch-2")?.wishlist.id).toBe("navnefest");
    expect(findGift("finnes-ikke")).toBeUndefined();
  });

  it("isWishlistId godtar bare kjente lister", () => {
    expect(isWishlistId("jul")).toBe(true);
    expect(isWishlistId("påske")).toBe(false);
    expect(isWishlistId(undefined)).toBe(false);
  });
});
