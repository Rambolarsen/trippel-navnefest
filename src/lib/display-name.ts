// Normalisering av visningsnavn for spleisegaver (MVP.md §8).
// Delt mellom server (src/lib/reservations.ts) og klient
// (src/stores/displayName.ts), slik at et navn aldri kan se gyldig
// ut i nettleseren men avvises av serveren.

export const MAX_DISPLAY_NAME_LENGTH = 20;

// Fjerner kontrolltegn, trimmer og kapper til makslengden.
// Tomt/ugyldig → null.
export function normalizeDisplayName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_DISPLAY_NAME_LENGTH)
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}
