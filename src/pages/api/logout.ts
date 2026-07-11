import type { APIRoute } from "astro";
import { clearGuestSession } from "../../lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
  clearGuestSession(cookies);
  return new Response(null, { status: 204 });
};
