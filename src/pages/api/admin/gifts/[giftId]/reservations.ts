import type { APIRoute } from "astro";
import { getGiftById } from "../../../../../data/gifts";
import { getDb } from "../../../../../lib/database";
import { deleteAllReservationsForGift } from "../../../../../lib/reservations";

// Nullstill alle reservasjoner på en gave (MVP.md §12).
// Adminsesjonen kontrolleres i middleware.
export const DELETE: APIRoute = async ({ params }) => {
  const gift = getGiftById(params.giftId ?? "");
  if (!gift) {
    return Response.json({ error: "Ukjent gave" }, { status: 404 });
  }

  const deleted = await deleteAllReservationsForGift(getDb(), gift.id);
  return Response.json({ giftId: gift.id, deleted });
};
