import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addGroupInterest,
  countReservationsByGift,
  deleteAllReservationsForGift,
  deleteMyReservation,
  getGiftIdsReservedBy,
  getGiftReservationStatus,
  getCurrentRecoveryCode,
  getGroupParticipants,
  getOrCreateReservationToken,
  getReservationTokenHash,
  normalizeDisplayName,
  normalizeRecoveryCode,
  reserveSingleGift,
  restoreReservationToken,
} from "../src/lib/reservations";
import { hmacSign, sha256Hex, toBase64Url } from "../src/lib/crypto";
import { fakeCookies } from "./helpers";

const db = env.DB;

beforeEach(async () => {
  await db.prepare("DELETE FROM reservations").run();
});

describe("reservasjonstoken (MVP.md §9)", () => {
  it("utsteder token og gjenkjenner det etterpå", async () => {
    const cookies = fakeCookies();
    const { tokenHash: hash, recoveryCode } = await getOrCreateReservationToken(cookies);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(recoveryCode).toMatch(/^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){3}$/);
    expect(await getReservationTokenHash(cookies)).toBe(hash);
    // Idempotent: samme cookie gir samme hash
    expect(await getOrCreateReservationToken(cookies)).toEqual({
      tokenHash: hash,
      recoveryCode,
    });
  });

  it("avviser token med tuklet signatur", async () => {
    const cookies = fakeCookies();
    await getOrCreateReservationToken(cookies);
    const raw = cookies.raw.get("reservasjon")!;
    cookies.raw.set("reservasjon", raw.slice(0, -2) + "xx");
    expect(await getReservationTokenHash(cookies)).toBeNull();
  });

  it("gjenoppretter samme token fra en kode, uavhengig av store bokstaver og bindestreker", async () => {
    const original = fakeCookies();
    const { tokenHash, recoveryCode } = await getOrCreateReservationToken(original);
    const restored = fakeCookies();
    expect(await restoreReservationToken(restored, recoveryCode!.toLowerCase().replaceAll("-", " "))).toBe(
      tokenHash,
    );
    expect(await getReservationTokenHash(restored)).toBe(tokenHash);
  });

  it("avviser ugyldige gjenopprettingskoder", () => {
    expect(normalizeRecoveryCode("ikke-en-kode")).toBeNull();
    expect(normalizeRecoveryCode("ABCDE-ABCDE-ABCDE-ABCDE")).not.toBeNull();
    expect(normalizeRecoveryCode("123e4567-e89b-12d3-a456-426614174000")).toBeNull();
  });

  it("erstatter en eldre UUID-cookie med en lesbar kode", async () => {
    const legacyToken = "123e4567-e89b-12d3-a456-426614174000";
    const signature = toBase64Url(await hmacSign("test-reservation-secret", legacyToken));
    const cookies = fakeCookies({ reservasjon: `${legacyToken}.${signature}` });

    const recoveryCode = await getCurrentRecoveryCode(cookies);
    expect(recoveryCode).toMatch(/^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){3}$/);
    expect(await getReservationTokenHash(cookies)).not.toBe(await sha256Hex(legacyToken));
  });
});

describe("enkeltgaver (MVP.md §22)", () => {
  it("reserverer ledig enkeltgave", async () => {
    expect(await reserveSingleGift(db, "duplo", "hash-a")).toBe("created");
    const status = await getGiftReservationStatus(db, "duplo", "hash-a");
    expect(status).toEqual({ reservationCount: 1, reservedByCurrentVisitor: true });
  });

  it("avviser når enkeltgave allerede er reservert av en annen", async () => {
    await reserveSingleGift(db, "duplo", "hash-a");
    expect(await reserveSingleGift(db, "duplo", "hash-b")).toBe("conflict");
    const status = await getGiftReservationStatus(db, "duplo", "hash-b");
    expect(status).toEqual({ reservationCount: 1, reservedByCurrentVisitor: false });
  });

  it("er idempotent for samme nettleser", async () => {
    await reserveSingleGift(db, "duplo", "hash-a");
    expect(await reserveSingleGift(db, "duplo", "hash-a")).toBe("already-mine");
    const { reservationCount } = await getGiftReservationStatus(db, "duplo", "hash-a");
    expect(reservationCount).toBe(1);
  });

  it("samtidige reservasjoner gir nøyaktig én vinner", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        reserveSingleGift(db, "duplo", `hash-${i}`),
      ),
    );
    expect(results.filter((r) => r === "created")).toHaveLength(1);
    expect(results.filter((r) => r === "conflict")).toHaveLength(7);
    const { reservationCount } = await getGiftReservationStatus(db, "duplo", null);
    expect(reservationCount).toBe(1);
  });
});

describe("spleisegaver (MVP.md §22)", () => {
  it("tillater flere interessenter", async () => {
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna")).toBe(
      "created",
    );
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-b", "Ole")).toBe(
      "created",
    );
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-c", "Kari")).toBe(
      "created",
    );
    const { reservationCount } = await getGiftReservationStatus(
      db,
      "nintendo-switch-2",
      null,
    );
    expect(reservationCount).toBe(3);
  });

  it("maks én interesse per nettleser", async () => {
    await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna");
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna")).toBe(
      "already-mine",
    );
    const { reservationCount } = await getGiftReservationStatus(
      db,
      "nintendo-switch-2",
      null,
    );
    expect(reservationCount).toBe(1);
  });
});

describe("spleisedeltakere (MVP.md §8)", () => {
  it("lagrer navn og lister deltakerne i påmeldingsrekkefølge", async () => {
    await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna");
    await addGroupInterest(db, "nintendo-switch-2", "hash-b", "Ole");
    expect(await getGroupParticipants(db, "nintendo-switch-2")).toEqual([
      "Anna",
      "Ole",
    ]);
  });

  it("re-påmelding oppdaterer eget navn uten å trekke interessen", async () => {
    await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna");
    expect(
      await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna og Ole"),
    ).toBe("already-mine");
    expect(await getGroupParticipants(db, "nintendo-switch-2")).toEqual([
      "Anna og Ole",
    ]);
    const { reservationCount } = await getGiftReservationStatus(
      db,
      "nintendo-switch-2",
      null,
    );
    expect(reservationCount).toBe(1);
  });

  it("navnet slettes sammen med reservasjonen", async () => {
    await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna");
    await deleteMyReservation(db, "nintendo-switch-2", "hash-a");
    expect(await getGroupParticipants(db, "nintendo-switch-2")).toEqual([]);
  });

  it("enkeltgaver får aldri deltakernavn", async () => {
    await reserveSingleGift(db, "duplo", "hash-a");
    expect(await getGroupParticipants(db, "duplo")).toEqual([]);
  });
});

describe("normalizeDisplayName (MVP.md §8)", () => {
  it("trimmer og godtar vanlige navn", () => {
    expect(normalizeDisplayName("  Anna og Ole  ")).toBe("Anna og Ole");
  });

  it("avviser tomt, manglende og ikke-streng", () => {
    expect(normalizeDisplayName("")).toBeNull();
    expect(normalizeDisplayName("   ")).toBeNull();
    expect(normalizeDisplayName(undefined)).toBeNull();
    expect(normalizeDisplayName(42)).toBeNull();
  });

  it("fjerner kontrolltegn og kapper til 20 tegn", () => {
    expect(normalizeDisplayName("An\tna\r\n")).toBe("Anna");
    const langt = "a".repeat(80);
    expect(normalizeDisplayName(langt)).toHaveLength(20);
  });
});

describe("sletting (MVP.md §22)", () => {
  it("sletter egen reservasjon", async () => {
    await reserveSingleGift(db, "duplo", "hash-a");
    expect(await deleteMyReservation(db, "duplo", "hash-a")).toBe(true);
    const { reservationCount } = await getGiftReservationStatus(db, "duplo", null);
    expect(reservationCount).toBe(0);
  });

  it("avviser sletting med feil token", async () => {
    await reserveSingleGift(db, "duplo", "hash-a");
    expect(await deleteMyReservation(db, "duplo", "hash-b")).toBe(false);
    const { reservationCount } = await getGiftReservationStatus(db, "duplo", null);
    expect(reservationCount).toBe(1);
  });

  it("admin-nullstilling fjerner alle rader for gaven", async () => {
    await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna");
    await addGroupInterest(db, "nintendo-switch-2", "hash-b", "Ole");
    await reserveSingleGift(db, "duplo", "hash-c");
    expect(await deleteAllReservationsForGift(db, "nintendo-switch-2")).toBe(2);
    const counts = await countReservationsByGift(db);
    expect(counts.get("nintendo-switch-2")).toBeUndefined();
    expect(counts.get("duplo")).toBe(1);
  });
});

describe("statuslesing", () => {
  it("teller per gave og flagger gjeldende gjest", async () => {
    await reserveSingleGift(db, "duplo", "hash-a");
    await addGroupInterest(db, "nintendo-switch-2", "hash-a", "Anna");
    await addGroupInterest(db, "nintendo-switch-2", "hash-b", "Ole");

    const counts = await countReservationsByGift(db);
    expect(counts.get("duplo")).toBe(1);
    expect(counts.get("nintendo-switch-2")).toBe(2);

    const mine = await getGiftIdsReservedBy(db, "hash-a");
    expect(mine).toEqual(new Set(["duplo", "nintendo-switch-2"]));
  });
});
