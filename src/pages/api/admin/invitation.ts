import type { APIRoute } from "astro";
import { isWishlistId } from "../../../data/wishlists";
import { getDb } from "../../../lib/database";
import { createInvitationToken } from "../../../lib/invitations";

// Adminsesjonen kontrolleres i middleware. Tokenet returneres kun nå – D1
// inneholder bare hash, så en glemt lenke må erstattes med en ny.
// Hver ønskeliste har sin egen lenke; body: { "wishlist": "jul" }.
export const POST: APIRoute = async ({ request, url }) => {
  let wishlist: unknown;
  try {
    wishlist = ((await request.json()) as { wishlist?: unknown }).wishlist;
  } catch {
    wishlist = undefined;
  }
  if (!isWishlistId(wishlist)) {
    return Response.json({ error: "Ukjent ønskeliste" }, { status: 400 });
  }

  const { token } = await createInvitationToken(getDb(), wishlist);
  return Response.json({ invitationUrl: new URL(`/invitasjon/${token}`, url).href });
};
