// Delte krypto-hjelpere for sesjoner og reservasjonstokens.
// Bruker Web Crypto, som er tilgjengelig i workerd.

const encoder = new TextEncoder();

export function encodeText(value: string): Uint8Array {
  return encoder.encode(value);
}

export async function sha256(message: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(message)));
}

export async function sha256Hex(message: string): Promise<string> {
  const bytes = await sha256(message);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacSign(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

export function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

// Sammenligner via SHA-256-digester slik at sammenligningen tar like
// lang tid uavhengig av inputlengde og -innhold (MVP.md §15).
export async function constantTimeStringEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([sha256(a), sha256(b)]);
  return timingSafeEqual(da, db);
}
