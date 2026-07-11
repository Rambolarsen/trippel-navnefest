import { defineMiddleware } from "astro:middleware";
import { hasValidAdminSession, hasValidGuestSession } from "./lib/auth";

// Tilgangsregler (MVP.md §5, §6):
// - /, /api/login: åpne
// - /admin, /api/admin/login: egen admin-flyt, krever ikke gjestesesjon
//   (siden viser selv innloggingsskjema uten gyldig adminsesjon)
// - øvrige /api/admin/*: krever gyldig adminsesjon
// - alt annet: krever gyldig gjestesesjon
const PUBLIC_PATHS = new Set(["/", "/api/login"]);
const ADMIN_FLOW_PATHS = new Set(["/admin", "/api/admin/login"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  let response: Response;
  if (path.startsWith("/api/admin/") && !ADMIN_FLOW_PATHS.has(path)) {
    response = (await hasValidAdminSession(context.cookies))
      ? await next()
      : Response.json({ error: "Krever admin-innlogging" }, { status: 401 });
  } else if (ADMIN_FLOW_PATHS.has(path)) {
    response = await next();
  } else if (path === "/" && (await hasValidGuestSession(context.cookies))) {
    // Gyldig sesjon: rett til ønskelisten (MVP.md §5, «Senere besøk»)
    response = context.redirect("/onskeliste");
  } else if (!PUBLIC_PATHS.has(path) && !(await hasValidGuestSession(context.cookies))) {
    response = path.startsWith("/api/")
      ? Response.json({ error: "Ikke innlogget" }, { status: 401 })
      : context.redirect("/");
  } else {
    response = await next();
  }

  // Dekker også API-svar og redirects, i motsetning til meta-taggen
  // i BaseLayout som bare dekker HTML (MVP.md §16).
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
});
