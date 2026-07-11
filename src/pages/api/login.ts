import type { APIRoute } from "astro";
import { createGuestSession, verifyGuestPassphrase } from "../../lib/auth";

// Tar imot både JSON (fetch) og vanlig skjema-POST, slik at
// innloggingen fungerer uten JavaScript.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

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

  if (!passphrase || !(await verifyGuestPassphrase(passphrase))) {
    return isJson
      ? Response.json({ error: "Feil passord" }, { status: 401 })
      : redirect("/?feil=1", 303);
  }

  await createGuestSession(cookies);
  return isJson ? new Response(null, { status: 200 }) : redirect("/onskeliste", 303);
};
