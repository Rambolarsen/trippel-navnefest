import type { APIRoute } from "astro";
import { createAdminSession, verifyAdminPassphrase } from "../../../lib/auth";
import { isRateLimited } from "../../../lib/rate-limit";

const MAX_PASSPHRASE_LENGTH = 256;

// Admin-innlogging med separat passphrase (MVP.md §6). Tar imot både
// JSON og vanlig skjema-POST, som gjesteinnloggingen.
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
  if (isRateLimited(`admin-login:${clientKey}`)) {
    return isJson
      ? Response.json({ error: "For mange forsøk" }, { status: 429 })
      : redirect("/admin?feil=mange", 303);
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
      : redirect("/admin?feil=1", 303);
  }

  if (
    !passphrase ||
    passphrase.length > MAX_PASSPHRASE_LENGTH ||
    !(await verifyAdminPassphrase(passphrase))
  ) {
    return isJson
      ? Response.json({ error: "Feil passord" }, { status: 401 })
      : redirect("/admin?feil=1", 303);
  }

  await createAdminSession(cookies);
  return isJson ? new Response(null, { status: 200 }) : redirect("/admin", 303);
};
