import { atom } from "nanostores";

// Koden holdes bare i minnet. Den varige kilden er den signerte,
// HTTP-only reservasjons-cookien; dette unngår en ekstra kopi i localStorage.
export const $recoveryCode = atom<string | null>(null);

export function setRecoveryCode(recoveryCode: string | null): void {
  $recoveryCode.set(recoveryCode);
}
