import type { APIRoute } from "astro";
import { getGiftById } from "../../../../../data/gifts";
import { getDb } from "../../../../../lib/database";
import {
  deleteMyReservation,
  getGiftReservationStatus,
  getReservationTokenHash,
} from "../../../../../lib/reservations";

// Opphev gjeldende nettlesers reservasjon (MVP.md §12). Sletter kun
// rader som samsvarer med gjestens eget signerte token.
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const gift = getGiftById(params.giftId ?? "");
  if (!gift) {
    return Response.json({ error: "Ukjent gave" }, { status: 404 });
  }

  const db = getDb();
  const tokenHash = await getReservationTokenHash(cookies);
  if (tokenHash) {
    await deleteMyReservation(db, gift.id, tokenHash);
  }

  const status = await getGiftReservationStatus(db, gift.id, tokenHash);
  return Response.json({ giftId: gift.id, mode: gift.mode, ...status });
};
