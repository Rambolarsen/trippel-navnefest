import type { APIRoute } from "astro";
import { grantGuestWishlist } from "../../lib/auth";
import { getDb } from "../../lib/database";
import { verifyInvitationToken } from "../../lib/invitations";

const MAX_TOKEN_LENGTH = 256;

// En gyldig invitasjonslenke gir gjestesesjonen tilgang til listen
// lenken hører til. Selve lenken utløper aldri; admin kan tilbakekalle
// den ved å opprette en ny for samme liste.
// Redirecten sørger for at tokenet ikke blir stående i nettleserens adressefelt.
export const GET: APIRoute = async ({ params, cookies, redirect }) => {
  const token = params.token ?? "";
  const wishlistId =
    token && token.length <= MAX_TOKEN_LENGTH
      ? await verifyInvitationToken(getDb(), token)
      : null;
  if (!wishlistId) {
    return new Response(null, { status: 404 });
  }

  await grantGuestWishlist(cookies, wishlistId);
  return redirect(`/onskeliste/${wishlistId}`, 302);
};
