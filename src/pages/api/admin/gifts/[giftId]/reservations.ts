import type { APIRoute } from "astro";
import { findGift } from "../../../../../data/wishlists";
import { getDb } from "../../../../../lib/database";
import { deleteAllReservationsForGift } from "../../../../../lib/reservations";

// Nullstill alle reservasjoner på en gave (MVP.md §12).
// Adminsesjonen kontrolleres i middleware.
export const DELETE: APIRoute = async ({ params }) => {
  const gift = findGift(params.giftId ?? "")?.gift;
  if (!gift) {
    return Response.json({ error: "Ukjent gave" }, { status: 404 });
  }

  const deleted = await deleteAllReservationsForGift(getDb(), gift.id);
  return Response.json({ giftId: gift.id, deleted });
};
