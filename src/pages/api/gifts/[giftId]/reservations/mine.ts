import type { APIRoute } from "astro";
import { findGift } from "../../../../../data/wishlists";
import { getDb } from "../../../../../lib/database";
import {
  deleteMyReservation,
  getGiftReservationStatus,
  getReservationTokenHash,
} from "../../../../../lib/reservations";

// Opphev gjeldende nettlesers reservasjon (MVP.md §12). Sletter kun
// rader som samsvarer med gjestens eget signerte token.
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  // Gaver på lister gjesten ikke har tilgang til, behandles som ukjente
  const found = findGift(params.giftId ?? "");
  const gift = found && locals.wishlists.includes(found.wishlist.id) ? found.gift : null;
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
