import type { APIRoute } from "astro";
import { createGuestSession, verifyGuestPassphrase } from "../../lib/auth";
import { isRateLimited } from "../../lib/rate-limit";

const MAX_PASSPHRASE_LENGTH = 256;

// Tar imot både JSON (fetch) og vanlig skjema-POST, slik at
// innloggingen fungerer uten JavaScript.
export const POST: APIRoute = async (context) => {
  const { request, cookies, redirect } = context;
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let clientKey = "ukjent";
  try {
    clientKey = context.clientAddress;
  } catch {
    // clientAddress er ikke tilgjengelig i alle miljøer
  }
  if (isRateLimited(`login:${clientKey}`)) {
    return isJson
      ? Response.json({ error: "For mange forsøk" }, { status: 429 })
      : redirect("/?feil=mange", 303);
  }

  let passphrase: string;
  try {
    if (isJson) {
      const body = (await request.json()) as { passphrase?: unknown };
      passphrase = typeof body.passphrase === "string" ? body.passphrase : "";
    } else {
      const form = await request.formData();
      const value = form.get("passphrase");
      passphrase = typeof value === "string" ? value : "";
    }
  } catch {
    return isJson
      ? Response.json({ error: "Ugyldig forespørsel" }, { status: 400 })
      : redirect("/?feil=1", 303);
  }

  if (
    !passphrase ||
    passphrase.length > MAX_PASSPHRASE_LENGTH ||
    !(await verifyGuestPassphrase(passphrase))
  ) {
    return isJson
      ? Response.json({ error: "Feil passord" }, { status: 401 })
      : redirect("/?feil=1", 303);
  }

  await createGuestSession(cookies);
  return isJson ? new Response(null, { status: 200 }) : redirect("/onskeliste", 303);
};
