import type { APIRoute } from "astro";
import { gifts, type GiftMode } from "../../../data/gifts";
import { getDb } from "../../../lib/database";
import {
  countReservationsByGift,
  getGiftIdsReservedBy,
  getReservationTokenHash,
} from "../../../lib/reservations";

type GiftStatus = {
  mode: GiftMode;
  reservationCount: number;
  reservedByCurrentVisitor: boolean;
};

// Reservasjonsstatus for alle gaver (MVP.md §12). Krever gyldig
// gjestesesjon via middleware. Tokens lekker aldri – kun tall og
// et flagg for gjeldende nettleser.
export const GET: APIRoute = async ({ cookies }) => {
  const db = getDb();
  const tokenHash = await getReservationTokenHash(cookies);

  const [counts, mine] = await Promise.all([
    countReservationsByGift(db),
    tokenHash ? getGiftIdsReservedBy(db, tokenHash) : new Set<string>(),
  ]);

  const status: Record<string, GiftStatus> = Object.fromEntries(
    gifts.map((gift) => [
      gift.id,
      {
        mode: gift.mode,
        reservationCount: counts.get(gift.id) ?? 0,
        reservedByCurrentVisitor: mine.has(gift.id),
      },
    ]),
  );

  return Response.json(status);
};
