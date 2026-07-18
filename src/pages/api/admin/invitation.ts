import type { APIRoute } from "astro";
import { getDb } from "../../../lib/database";
import { createInvitationToken } from "../../../lib/invitations";

// Adminsesjonen kontrolleres i middleware. Tokenet returneres kun nå – D1
// inneholder bare hash, så en glemt lenke må erstattes med en ny.
export const POST: APIRoute = async ({ url }) => {
  const { token } = await createInvitationToken(getDb());
  return Response.json({ invitationUrl: new URL(`/invitasjon/${token}`, url).href });
};
