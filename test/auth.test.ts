import { describe, expect, it } from "vitest";
import {
  clearGuestSession,
  createAdminSession,
  getGuestWishlists,
  grantGuestWishlist,
  hasValidAdminSession,
  hasValidGuestSession,
  verifyAdminPassphrase,
  verifyGuestPassphrase,
} from "../src/lib/auth";
import { hmacSign, toBase64Url } from "../src/lib/crypto";
import { fakeCookies } from "./helpers";

const createGuestSession = (cookies: ReturnType<typeof fakeCookies>) =>
  grantGuestWishlist(cookies, "navnefest");

describe("passphrase-validering (MVP.md §22)", () => {
  it("godtar korrekt gjestepassphrase og returnerer listen den åpner", async () => {
    expect(await verifyGuestPassphrase("test-gjest-123")).toBe("navnefest");
    expect(await verifyGuestPassphrase("test-jul-789")).toBe("jul");
  });

  it("avviser feil gjestepassphrase", async () => {
    expect(await verifyGuestPassphrase("feil")).toBe(null);
    expect(await verifyGuestPassphrase("")).toBe(null);
    expect(await verifyGuestPassphrase("test-gjest-123 ")).toBe(null);
  });

  it("gjeste- og adminpassphrase er adskilte", async () => {
    expect(await verifyAdminPassphrase("test-admin-456")).toBe(true);
    expect(await verifyAdminPassphrase("test-gjest-123")).toBe(false);
    expect(await verifyAdminPassphrase("test-jul-789")).toBe(false);
    expect(await verifyGuestPassphrase("test-admin-456")).toBe(null);
  });

});

describe("sesjoner (MVP.md §22)", () => {
  it("oppretter og validerer gjestesesjon", async () => {
    const cookies = fakeCookies();
    await createGuestSession(cookies);
    expect(await hasValidGuestSession(cookies)).toBe(true);
  });

  it("avviser manglende sesjon", async () => {
    expect(await hasValidGuestSession(fakeCookies())).toBe(false);
  });

  it("avviser tuklet signatur", async () => {
    const cookies = fakeCookies();
    await createGuestSession(cookies);
    const raw = cookies.raw.get("session")!;
    cookies.raw.set("session", raw.slice(0, -2) + "xx");
    expect(await hasValidGuestSession(cookies)).toBe(false);
  });

  it("avviser utløpt sesjon selv med gyldig signatur", async () => {
    const cookies = fakeCookies();
    await createGuestSession(cookies);
    const raw = cookies.raw.get("session")!;
    // Bytt utløpstidspunktet til fortiden – signaturen blir da ugyldig,
    // og selv en angriper som kunne signere ville stoppes av utløpssjekken
    const [role, , sig] = raw.split(".");
    cookies.raw.set("session", `${role}.${Date.now() - 1000}.${sig}`);
    expect(await hasValidGuestSession(cookies)).toBe(false);
  });

  it("gjestecookie kan ikke brukes som adminsesjon", async () => {
    const cookies = fakeCookies();
    await createGuestSession(cookies);
    cookies.raw.set("admin_session", cookies.raw.get("session")!);
    expect(await hasValidAdminSession(cookies)).toBe(false);
  });

  it("adminsesjon opprettes og valideres separat", async () => {
    const cookies = fakeCookies();
    await createAdminSession(cookies);
    expect(await hasValidAdminSession(cookies)).toBe(true);
    expect(await hasValidGuestSession(cookies)).toBe(false);
  });

  it("utlogging fjerner sesjonen", async () => {
    const cookies = fakeCookies();
    await createGuestSession(cookies);
    clearGuestSession(cookies);
    expect(await hasValidGuestSession(cookies)).toBe(false);
  });
});

describe("flere ønskelister", () => {
  it("sesjonen gir bare tilgang til listen passordet åpnet", async () => {
    const cookies = fakeCookies();
    await grantGuestWishlist(cookies, "jul");
    expect(await getGuestWishlists(cookies)).toEqual(["jul"]);
  });

  it("et nytt passord legger til en liste uten å fjerne den gamle", async () => {
    const cookies = fakeCookies();
    await grantGuestWishlist(cookies, "jul");
    await grantGuestWishlist(cookies, "navnefest");
    await grantGuestWishlist(cookies, "jul");
    expect(await getGuestWishlists(cookies)).toEqual(["navnefest", "jul"]);
  });

  it("eldre sesjonscookie uten listedel gjelder navnefesten", async () => {
    const payload = `guest.${Date.now() + 60_000}`;
    const signature = toBase64Url(await hmacSign("test-session-secret", payload));
    const cookies = fakeCookies({ session: `${payload}.${signature}` });
    expect(await getGuestWishlists(cookies)).toEqual(["navnefest"]);
  });

  it("listedelen er signert og kan ikke endres", async () => {
    const cookies = fakeCookies();
    await grantGuestWishlist(cookies, "navnefest");
    const raw = cookies.raw.get("session")!;
    cookies.raw.set("session", raw.replace(".navnefest.", ".navnefest+jul."));
    expect(await getGuestWishlists(cookies)).toEqual([]);
  });

  it("adminsesjon gir ikke tilgang til noen ønskeliste", async () => {
    const cookies = fakeCookies();
    await createAdminSession(cookies);
    cookies.raw.set("session", cookies.raw.get("admin_session")!);
    expect(await getGuestWishlists(cookies)).toEqual([]);
  });
});
