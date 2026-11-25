import { defineMiddleware } from "astro:middleware";
import { getGuestWishlists, hasValidAdminSession } from "./lib/auth";

// Tilgangsregler (MVP.md §5, §6):
// - /, /api/login og /invitasjon/<token>: åpne
// - /admin, /api/admin/login: egen admin-flyt, krever ikke gjestesesjon
//   (siden viser selv innloggingsskjema uten gyldig adminsesjon)
// - øvrige /api/admin/*: krever gyldig adminsesjon
// - alt annet: krever gyldig gjestesesjon for minst én ønskeliste.
//   Hvilke lister gjesten har tilgang til, legges i locals.wishlists, og
//   sider/API-er sjekker selv at gaven eller listen hører til en av dem.
const PUBLIC_PATHS = new Set(["/", "/api/login"]);
const ADMIN_FLOW_PATHS = new Set(["/admin", "/api/admin/login"]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Streng Origin-kontroll på alle muterende kall (MVP.md §15).
  // Utfyller Astros innebygde checkOrigin, som bare dekker
  // skjema-innholdstyper.
  if (MUTATING_METHODS.has(context.request.method)) {
    const origin = context.request.headers.get("origin");
    if (origin && origin !== context.url.origin) {
      const forbidden = Response.json({ error: "Ugyldig origin" }, { status: 403 });
      forbidden.headers.set("X-Robots-Tag", "noindex, nofollow");
      return forbidden;
    }
  }

  context.locals.wishlists = await getGuestWishlists(context.cookies);
  const hasGuestSession = context.locals.wishlists.length > 0;

  let response: Response;
  if (path.startsWith("/api/admin/") && !ADMIN_FLOW_PATHS.has(path)) {
    response = (await hasValidAdminSession(context.cookies))
      ? await next()
      : Response.json({ error: "Krever admin-innlogging" }, { status: 401 });
  } else if (ADMIN_FLOW_PATHS.has(path)) {
    response = await next();
  } else if (
    path === "/" &&
    hasGuestSession &&
    !context.url.searchParams.has("feil") &&
    !context.url.searchParams.has("nytt-passord")
  ) {
    // Gyldig sesjon: rett til ønskelisten (MVP.md §5, «Senere besøk»).
    // Unntak: feilmelding fra innlogging, eller gjesten vil skrive inn
    // passordet til en annen ønskeliste.
    response = context.redirect("/onskeliste");
  } else if (
    !PUBLIC_PATHS.has(path) &&
    !path.startsWith("/invitasjon/") &&
    !hasGuestSession
  ) {
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
