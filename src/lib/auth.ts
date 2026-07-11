import type { AstroCookies } from "astro";
import { env } from "cloudflare:workers";
import {
  constantTimeStringEqual,
  encodeText,
  hmacSign,
  timingSafeEqual,
  toBase64Url,
} from "./crypto";

// Signerte, tidsbegrensede sesjonstokens i HttpOnly-cookies
// (MVP.md §13). Stateless – ingen sesjonslagring på serveren.
// Tokenformat: "<rolle>.<utløp-ms>.<base64url(HMAC-SHA256(payload))>"
// Rollen inngår i det signerte payloadet, så en gjestecookie kan ikke
// gjenbrukes som admincookie.

type Role = "guest" | "admin";

const SESSION_COOKIES: Record<Role, string> = {
  guest: "session",
  admin: "admin_session",
};

const SESSION_TTL_SECONDS: Record<Role, number> = {
  guest: 30 * 24 * 60 * 60,
  admin: 7 * 24 * 60 * 60,
};

function getSecret(
  name: "GUEST_PASSPHRASE" | "ADMIN_PASSPHRASE" | "SESSION_SECRET",
): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Miljøvariabelen ${name} er ikke satt`);
  }
  return value;
}

async function createSession(role: Role, cookies: AstroCookies): Promise<void> {
  const ttl = SESSION_TTL_SECONDS[role];
  const payload = `${role}.${Date.now() + ttl * 1000}`;
  const signature = toBase64Url(await hmacSign(getSecret("SESSION_SECRET"), payload));
  cookies.set(SESSION_COOKIES[role], `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    maxAge: ttl,
  });
}

async function hasValidSession(role: Role, cookies: AstroCookies): Promise<boolean> {
  const raw = cookies.get(SESSION_COOKIES[role])?.value;
  if (!raw) return false;

  const sigIndex = raw.lastIndexOf(".");
  if (sigIndex <= 0) return false;
  const payload = raw.slice(0, sigIndex);
  const signature = raw.slice(sigIndex + 1);

  const [tokenRole, expiresPart] = payload.split(".");
  if (tokenRole !== role) return false;
  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = toBase64Url(await hmacSign(getSecret("SESSION_SECRET"), payload));
  return timingSafeEqual(encodeText(signature), encodeText(expected));
}

function clearSession(role: Role, cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIES[role], { path: "/" });
}

// Gjest

export async function verifyGuestPassphrase(input: string): Promise<boolean> {
  return constantTimeStringEqual(input, getSecret("GUEST_PASSPHRASE"));
}

export const createGuestSession = (cookies: AstroCookies) =>
  createSession("guest", cookies);
export const hasValidGuestSession = (cookies: AstroCookies) =>
  hasValidSession("guest", cookies);
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
