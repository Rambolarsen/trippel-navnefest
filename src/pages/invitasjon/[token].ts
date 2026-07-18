import type { APIRoute } from "astro";
import { createGuestSession } from "../../lib/auth";
import { getDb } from "../../lib/database";
import { verifyInvitationToken } from "../../lib/invitations";

const MAX_TOKEN_LENGTH = 256;

// En gyldig invitasjonslenke oppretter den vanlige gjestesesjonen. Selve
// lenken utløper aldri; admin kan tilbakekalle den ved å opprette en ny.
// Redirecten sørger for at tokenet ikke blir stående i nettleserens adressefelt.
export const GET: APIRoute = async ({ params, cookies, redirect }) => {
  const token = params.token ?? "";
  if (
    !token ||
    token.length > MAX_TOKEN_LENGTH ||
    !(await verifyInvitationToken(getDb(), token))
  ) {
    return new Response(null, { status: 404 });
  }

  await createGuestSession(cookies);
  return redirect("/onskeliste", 302);
};
