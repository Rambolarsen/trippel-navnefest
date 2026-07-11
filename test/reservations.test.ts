import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addGroupInterest,
  countReservationsByGift,
  deleteAllReservationsForGift,
  deleteMyReservation,
  getGiftIdsReservedBy,
  getGiftReservationStatus,
  getOrCreateReservationTokenHash,
  getReservationTokenHash,
  reserveSingleGift,
} from "../src/lib/reservations";
import { fakeCookies } from "./helpers";

const db = env.DB;

beforeEach(async () => {
  await db.prepare("DELETE FROM reservations").run();
});

describe("reservasjonstoken (MVP.md §9)", () => {
  it("utsteder token og gjenkjenner det etterpå", async () => {
    const cookies = fakeCookies();
    const hash = await getOrCreateReservationTokenHash(cookies);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await getReservationTokenHash(cookies)).toBe(hash);
    // Idempotent: samme cookie gir samme hash
    expect(await getOrCreateReservationTokenHash(cookies)).toBe(hash);
  });

  it("avviser token med tuklet signatur", async () => {
    const cookies = fakeCookies();
    await getOrCreateReservationTokenHash(cookies);
    const raw = cookies.raw.get("reservasjon")!;
    cookies.raw.set("reservasjon", raw.slice(0, -2) + "xx");
    expect(await getReservationTokenHash(cookies)).toBeNull();
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
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-a")).toBe("created");
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-b")).toBe("created");
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-c")).toBe("created");
    const { reservationCount } = await getGiftReservationStatus(
      db,
      "nintendo-switch-2",
      null,
    );
    expect(reservationCount).toBe(3);
  });

  it("maks én interesse per nettleser", async () => {
    await addGroupInterest(db, "nintendo-switch-2", "hash-a");
    expect(await addGroupInterest(db, "nintendo-switch-2", "hash-a")).toBe(
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
    await addGroupInterest(db, "nintendo-switch-2", "hash-a");
    await addGroupInterest(db, "nintendo-switch-2", "hash-b");
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
    await addGroupInterest(db, "nintendo-switch-2", "hash-a");
    await addGroupInterest(db, "nintendo-switch-2", "hash-b");

    const counts = await countReservationsByGift(db);
    expect(counts.get("duplo")).toBe(1);
    expect(counts.get("nintendo-switch-2")).toBe(2);

    const mine = await getGiftIdsReservedBy(db, "hash-a");
    expect(mine).toEqual(new Set(["duplo", "nintendo-switch-2"]));
  });
});
