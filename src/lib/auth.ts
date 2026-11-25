import type { AstroCookies } from "astro";
import { env } from "cloudflare:workers";
import {
  constantTimeStringEqual,
  encodeText,
  hmacSign,
  timingSafeEqual,
  toBase64Url,
} from "./crypto";
import {
  isWishlistId,
  wishlists,
  type GuestPassphraseSecret,
  type WishlistId,
} from "../data/wishlists";

// Signerte, tidsbegrensede sesjonstokens i HttpOnly-cookies
// (MVP.md §13). Stateless – ingen sesjonslagring på serveren.
// Tokenformat: "<rolle>.<utløp-ms>[.<lister>].<base64url(HMAC-SHA256(payload))>"
// Rollen inngår i det signerte payloadet, så en gjestecookie kan ikke
// gjenbrukes som admincookie. For gjester inneholder payloadet også
// hvilke ønskelister sesjonen gir tilgang til, skilt med «+». Eldre
// gjestecookies uten listedel gjelder navnefestlisten.

type Role = "guest" | "admin";

const SESSION_COOKIES: Record<Role, string> = {
  guest: "session",
  admin: "admin_session",
};

const SESSION_TTL_SECONDS: Record<Role, number> = {
  guest: 30 * 24 * 60 * 60,
  admin: 7 * 24 * 60 * 60,
};

const LEGACY_GUEST_WISHLISTS: WishlistId[] = ["navnefest"];

function getSecret(name: "ADMIN_PASSPHRASE" | "SESSION_SECRET"): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Miljøvariabelen ${name} er ikke satt`);
  }
  return value;
}

async function createSession(
  role: Role,
  cookies: AstroCookies,
  extra?: string,
): Promise<void> {
  const ttl = SESSION_TTL_SECONDS[role];
  const payload = [role, Date.now() + ttl * 1000, extra].filter(Boolean).join(".");
  const signature = toBase64Url(await hmacSign(getSecret("SESSION_SECRET"), payload));
  cookies.set(SESSION_COOKIES[role], `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    maxAge: ttl,
  });
}

// Returnerer payloadets ekstradel (tom streng om den mangler) for en
// gyldig sesjon, ellers null.
async function readSession(role: Role, cookies: AstroCookies): Promise<string | null> {
  const raw = cookies.get(SESSION_COOKIES[role])?.value;
  if (!raw) return null;

  const sigIndex = raw.lastIndexOf(".");
  if (sigIndex <= 0) return null;
  const payload = raw.slice(0, sigIndex);
  const signature = raw.slice(sigIndex + 1);

  const [tokenRole, expiresPart, extra = "", ...rest] = payload.split(".");
  if (tokenRole !== role || rest.length > 0) return null;
  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const expected = toBase64Url(await hmacSign(getSecret("SESSION_SECRET"), payload));
  return timingSafeEqual(encodeText(signature), encodeText(expected)) ? extra : null;
}

async function hasValidSession(role: Role, cookies: AstroCookies): Promise<boolean> {
  return (await readSession(role, cookies)) !== null;
}

function clearSession(role: Role, cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIES[role], { path: "/" });
}

// Gjest

// Sjekker passordet mot alle ønskelister med satt passphrase og
// returnerer listen det åpner. Alle listene sammenlignes uansett, så
// svartiden avslører ikke hvilken liste som traff.
export async function verifyGuestPassphrase(input: string): Promise<WishlistId | null> {
  let match: WishlistId | null = null;
  for (const wishlist of wishlists) {
    const expected = getGuestPassphrase(wishlist.passphraseSecret);
    if (!expected) continue;
    if ((await constantTimeStringEqual(input, expected)) && match === null) {
      match = wishlist.id;
    }
  }
  return match;
}

function getGuestPassphrase(name: GuestPassphraseSecret): string | undefined {
  return env[name] || undefined;
}

// Ønskelistene gjeldende gjestesesjon gir tilgang til (tom ved ugyldig
// eller manglende sesjon).
export async function getGuestWishlists(cookies: AstroCookies): Promise<WishlistId[]> {
  const extra = await readSession("guest", cookies);
  if (extra === null) return [];
  if (extra === "") return LEGACY_GUEST_WISHLISTS;
  return extra.split("+").filter(isWishlistId);
}

// Gir sesjonen tilgang til en liste i tillegg til dem den allerede
// har, slik at én nettleser kan åpne både navnefest- og julelisten.
export async function grantGuestWishlist(
  cookies: AstroCookies,
  wishlistId: WishlistId,
): Promise<void> {
  const current = await getGuestWishlists(cookies);
  const granted = new Set([...current, wishlistId]);
  // Fast rekkefølge, så cookien blir lik uansett innloggingsrekkefølge
  const ordered = wishlists.map((list) => list.id).filter((id) => granted.has(id));
  await createSession("guest", cookies, ordered.join("+"));
}

export const hasValidGuestSession = async (cookies: AstroCookies) =>
  (await getGuestWishlists(cookies)).length > 0;
export const clearGuestSession = (cookies: AstroCookies) =>
  clearSession("guest", cookies);

// Admin (MVP.md §6 og §13: separat passphrase og egen cookie)

export async function verifyAdminPassphrase(input: string): Promise<boolean> {
  return constantTimeStringEqual(input, getSecret("ADMIN_PASSPHRASE"));
}

export const createAdminSession = (cookies: AstroCookies) =>
  createSession("admin", cookies);
export const hasValidAdminSession = (cookies: AstroCookies) =>
  hasValidSession("admin", cookies);
