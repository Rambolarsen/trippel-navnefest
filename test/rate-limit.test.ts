import { beforeEach, describe, expect, it } from "vitest";
import { isRateLimited, resetRateLimiter } from "../src/lib/rate-limit";

describe("rate limiting (MVP.md §15)", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("tillater fem forsøk og stopper det sjette", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited("login:1.2.3.4", t + i)).toBe(false);
    }
    expect(isRateLimited("login:1.2.3.4", t + 5)).toBe(true);
  });

  it("skiller mellom nøkler", () => {
    const t = 1_000_000;
    for (let i = 0; i < 6; i++) isRateLimited("login:a", t + i);
    expect(isRateLimited("login:b", t + 10)).toBe(false);
  });

  it("slipper gjennom igjen etter at vinduet har passert", () => {
    const t = 1_000_000;
    for (let i = 0; i < 6; i++) isRateLimited("login:a", t + i);
    expect(isRateLimited("login:a", t + 61_000)).toBe(false);
  });
});
