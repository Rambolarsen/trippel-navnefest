import { atom } from "nanostores";

// Gjestens eget visningsnavn, lagret kun i denne nettleseren
// (localStorage). Sendes til serveren først når gjesten faktisk
// melder spleiseinteresse (MVP.md §8) – navnet er påkrevd der.
// Grensen speiler MAX_DISPLAY_NAME_LENGTH i src/lib/reservations.ts
// (kan ikke importeres her fordi den fila drar inn "cloudflare:workers").

export const MAX_DISPLAY_NAME_LENGTH = 60;

const STORAGE_KEY = "visningsnavn";

function readStoredName(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export const $displayName = atom<string>(readStoredName());

export function setDisplayName(name: string): void {
  const trimmed = name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH).trim();
  $displayName.set(trimmed);
  if (typeof localStorage === "undefined") return;
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
