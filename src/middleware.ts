import { defineMiddleware } from "astro:middleware";
import { hasValidGuestSession } from "./lib/auth";

// Alt utenom innloggingssiden og login-endepunktet krever gyldig
// gjestesesjon (MVP.md §5). /admin får i tillegg egen admin-sjekk i #8.
const PUBLIC_PATHS = new Set(["/", "/api/login"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const loggedIn = await hasValidGuestSession(context.cookies);

  let response: Response;
  if (path === "/" && loggedIn) {
    // Gyldig sesjon: rett til ønskelisten (MVP.md §5, «Senere besøk»)
    response = context.redirect("/onskeliste");
  } else if (!PUBLIC_PATHS.has(path) && !loggedIn) {
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
