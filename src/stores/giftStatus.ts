import { map } from "nanostores";

// Delt klient-tilstand for reservasjonsstatus. Én kilde til sannhet
// som både GiftFilters (data-status + «Ledige»-filteret) og
// GiftReservationButton-øyene abonnerer på, slik at en reservasjon
// umiddelbart oppdaterer både kortet og filtreringen.

export type GiftStatusEntry = {
  mode: "single" | "group";
  reservationCount: number;
  reservedByCurrentVisitor: boolean;
};

export const $giftStatus = map<Record<string, GiftStatusEntry>>({});

export async function refreshGiftStatus(): Promise<void> {
  try {
    const response = await fetch("/api/gifts/status");
    if (!response.ok) return;
    $giftStatus.set((await response.json()) as Record<string, GiftStatusEntry>);
  } catch {
    // Nettverksfeil ignoreres – SSR-innholdet står til neste forsøk
  }
}
