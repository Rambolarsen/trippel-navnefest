import type { AstroCookies } from "astro";
import { env } from "cloudflare:workers";

// Gjestesesjon: signert, tidsbegrenset token i en HttpOnly-cookie
// (MVP.md §13). Stateless – ingen sesjonslagring på serveren.
// Tokenformat: "guest.<utløp-ms>.<base64url(HMAC-SHA256(payload))>"

export const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const encoder = new TextEncoder();

function getSecret(name: "GUEST_PASSPHRASE" | "ADMIN_PASSPHRASE" | "SESSION_SECRET"): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Miljøvariabelen ${name} er ikke satt`);
  }
  return value;
}

async function sha256(message: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(message)));
}

async function hmacSign(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

// Sammenligner via SHA-256-digester slik at sammenligningen tar like
// lang tid uavhengig av inputlengde og -innhold (MVP.md §15).
async function constantTimeStringEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([sha256(a), sha256(b)]);
  return timingSafeEqual(da, db);
}

export async function verifyGuestPassphrase(input: string): Promise<boolean> {
  return constantTimeStringEqual(input, getSecret("GUEST_PASSPHRASE"));
}

export async function createGuestSession(cookies: AstroCookies): Promise<void> {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `guest.${expiresAt}`;
  const signature = toBase64Url(await hmacSign(getSecret("SESSION_SECRET"), payload));
  cookies.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function hasValidGuestSession(cookies: AstroCookies): Promise<boolean> {
  const raw = cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return false;

  const sigIndex = raw.lastIndexOf(".");
  if (sigIndex <= 0) return false;
  const payload = raw.slice(0, sigIndex);
  const signature = raw.slice(sigIndex + 1);

  const [role, expiresPart] = payload.split(".");
  if (role !== "guest") return false;
  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = toBase64Url(await hmacSign(getSecret("SESSION_SECRET"), payload));
  return timingSafeEqual(encoder.encode(signature), encoder.encode(expected));
}

export function clearGuestSession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}
