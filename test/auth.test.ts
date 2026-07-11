import { describe, expect, it } from "vitest";
import {
  clearGuestSession,
  createAdminSession,
  createGuestSession,
  hasValidAdminSession,
  hasValidGuestSession,
  verifyAdminPassphrase,
  verifyGuestPassphrase,
} from "../src/lib/auth";
import { fakeCookies } from "./helpers";

describe("passphrase-validering (MVP.md §22)", () => {
  it("godtar korrekt gjestepassphrase", async () => {
    expect(await verifyGuestPassphrase("test-gjest-123")).toBe(true);
  });

  it("avviser feil gjestepassphrase", async () => {
    expect(await verifyGuestPassphrase("feil")).toBe(false);
    expect(await verifyGuestPassphrase("")).toBe(false);
    expect(await verifyGuestPassphrase("test-gjest-123 ")).toBe(false);
  });

  it("gjeste- og adminpassphrase er adskilte", async () => {
    expect(await verifyAdminPassphrase("test-admin-456")).toBe(true);
    expect(await verifyAdminPassphrase("test-gjest-123")).toBe(false);
    expect(await verifyGuestPassphrase("test-admin-456")).toBe(false);
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
