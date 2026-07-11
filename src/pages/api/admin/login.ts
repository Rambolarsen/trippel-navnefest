import type { APIRoute } from "astro";
import { createAdminSession, verifyAdminPassphrase } from "../../../lib/auth";

// Admin-innlogging med separat passphrase (MVP.md §6). Tar imot både
// JSON og vanlig skjema-POST, som gjesteinnloggingen.
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
      : redirect("/admin?feil=1", 303);
  }

  if (!passphrase || !(await verifyAdminPassphrase(passphrase))) {
    return isJson
      ? Response.json({ error: "Feil passord" }, { status: 401 })
      : redirect("/admin?feil=1", 303);
  }

  await createAdminSession(cookies);
  return isJson ? new Response(null, { status: 200 }) : redirect("/admin", 303);
};
