import type { APIRoute } from "astro";
import { gifts, type GiftMode } from "../../../data/gifts";
import { getDb } from "../../../lib/database";
import {
  countReservationsByGift,
  getGiftIdsReservedBy,
  getGroupParticipants,
  getReservationTokenHash,
} from "../../../lib/reservations";

type GiftStatus = {
  mode: GiftMode;
  reservationCount: number;
  reservedByCurrentVisitor: boolean;
  participants?: string[];
};

// Reservasjonsstatus for alle gaver (MVP.md §12). Krever gyldig
// gjestesesjon via middleware. Tokens lekker aldri – kun tall og
// et flagg for gjeldende nettleser. Deltakernavn på spleisegaver
// returneres bare for gaver gjesten selv er påmeldt (MVP.md §8).
export const GET: APIRoute = async ({ cookies }) => {
  const db = getDb();
  const tokenHash = await getReservationTokenHash(cookies);

  const [counts, mine] = await Promise.all([
    countReservationsByGift(db),
    tokenHash ? getGiftIdsReservedBy(db, tokenHash) : new Set<string>(),
  ]);

  const status: Record<string, GiftStatus> = {};
  for (const gift of gifts) {
    const entry: GiftStatus = {
      mode: gift.mode,
      reservationCount: counts.get(gift.id) ?? 0,
      reservedByCurrentVisitor: mine.has(gift.id),
    };
    if (gift.mode === "group" && entry.reservedByCurrentVisitor) {
      entry.participants = await getGroupParticipants(db, gift.id);
    }
    status[gift.id] = entry;
  }

  return Response.json(status);
};
