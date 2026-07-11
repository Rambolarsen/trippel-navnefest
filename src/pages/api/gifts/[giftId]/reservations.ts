import type { APIRoute } from "astro";
import { getGiftById } from "../../../../data/gifts";
import { getDb } from "../../../../lib/database";
import {
  addGroupInterest,
  getGiftReservationStatus,
  getOrCreateReservationTokenHash,
  reserveSingleGift,
} from "../../../../lib/reservations";

// Opprett reservasjon (enkeltgave) eller spleiseinteresse (MVP.md §12).
// Sesjonskontrollen skjer i middleware.
export const POST: APIRoute = async ({ params, cookies }) => {
  const gift = getGiftById(params.giftId ?? "");
  if (!gift) {
    return Response.json({ error: "Ukjent gave" }, { status: 404 });
  }

  const db = getDb();
  const tokenHash = await getOrCreateReservationTokenHash(cookies);

  const result =
    gift.mode === "single"
      ? await reserveSingleGift(db, gift.id, tokenHash)
      : await addGroupInterest(db, gift.id, tokenHash);

  const status = await getGiftReservationStatus(db, gift.id, tokenHash);
  const body = { giftId: gift.id, mode: gift.mode, ...status };

  // "already-mine" er idempotent suksess; kun en annen gjests
  // enkeltgave-reservasjon gir 409 (MVP.md §12).
  const httpStatus =
    result === "created" ? 201 : result === "already-mine" ? 200 : 409;
  return Response.json(body, { status: httpStatus });
};
