// Enkel glidende-vindu-begrensning i minnet for innloggingsforsøk
// (MVP.md §15). Per workerd-isolat, som er tilstrekkelig for å bremse
// brute force mot en privat ønskeliste. IP-adressen brukes kun
// flyktig i minnet her og lagres aldri (MVP.md §9).

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_KEYS = 5_000;

const attempts = new Map<string, number[]>();

export function isRateLimited(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(key, recent);
    return true;
  }

  recent.push(now);
  attempts.set(key, recent);

  // Hindre ubegrenset vekst: kast utgåtte nøkler ved behov
  if (attempts.size > MAX_TRACKED_KEYS) {
    for (const [k, list] of attempts) {
      if (list.every((t) => now - t >= WINDOW_MS)) attempts.delete(k);
    }
  }

  return false;
}

// Kun for tester
export function resetRateLimiter(): void {
  attempts.clear();
}
