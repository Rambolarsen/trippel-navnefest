import { atom } from "nanostores";
import {
  MAX_DISPLAY_NAME_LENGTH,
  normalizeDisplayName,
} from "../lib/display-name";

// Gjestens eget visningsnavn, lagret kun i denne nettleseren
// (localStorage). Sendes til serveren først når gjesten faktisk
// melder spleiseinteresse (MVP.md §8) – navnet er påkrevd der.
// Normaliseringen deles med serveren (src/lib/display-name.ts),
// så et lagret navn aldri kan avvises som tomt av API-et.

export { MAX_DISPLAY_NAME_LENGTH };

const STORAGE_KEY = "visningsnavn";

function readStoredName(): string {
  if (typeof localStorage === "undefined") return "";
  return normalizeDisplayName(localStorage.getItem(STORAGE_KEY)) ?? "";
}

export const $displayName = atom<string>(readStoredName());

export function setDisplayName(name: string): void {
  const normalized = normalizeDisplayName(name) ?? "";
  $displayName.set(normalized);
  if (typeof localStorage === "undefined") return;
  if (normalized) {
    localStorage.setItem(STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
