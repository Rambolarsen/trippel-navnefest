import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { $giftStatus, refreshGiftStatus } from "../stores/giftStatus";

// Filtrene fra MVP.md §7. Filtrering skjer uten sidelasting ved å
// vise/skjule de server-rendrede gavekortene ([data-gift-card]).
// Reservasjonsstatus hentes fra den delte storen, slik at
// «Ledige»-filteret reflekterer faktiske reservasjoner.
const FILTERS = [
  "Alle",
  "Edvin",
  "Jonas",
  "Sofie",
  "Fellesgaver",
  "Spleisegaver",
  "Ledige",
] as const;

type Filter = (typeof FILTERS)[number];

function matchesFilter(card: HTMLElement, filter: Filter): boolean {
  const tags = (card.dataset.tags ?? "").split("|");
  switch (filter) {
    case "Alle":
      return true;
    case "Fellesgaver":
      return tags.includes("Fellesgave");
    case "Spleisegaver":
      return tags.includes("Spleisegave");
    case "Ledige":
      return card.dataset.status === "available";
    default:
      return tags.includes(filter);
  }
}

export default function GiftFilters() {
  const [active, setActive] = useState<Filter>("Alle");
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const statuses = useStore($giftStatus);

  useEffect(() => {
    refreshGiftStatus();
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-gift-card]");
    let visible = 0;
    for (const card of cards) {
      // En spleisegave kan alltid få flere interessenter og regnes
      // som ledig; en enkeltgave er ledig til noen har reservert den.
      const status = statuses[card.dataset.giftId ?? ""];
      const available =
        !status || status.mode === "group" || status.reservationCount === 0;
      card.dataset.status = available ? "available" : "reserved";

      const show = matchesFilter(card, active);
      card.hidden = !show;
      if (show) visible += 1;
    }
    setVisibleCount(visible);
  }, [active, statuses]);

  return (
    <div className="gift-filters">
      <div className="filter-buttons" role="group" aria-label="Filtrer gaver">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={filter === active ? "filter-btn is-active" : "filter-btn"}
            aria-pressed={filter === active}
            onClick={() => setActive(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <p className="filter-status" aria-live="polite">
        {visibleCount === null
          ? ""
          : visibleCount === 1
            ? "Viser 1 gave"
            : `Viser ${visibleCount} gaver`}
      </p>
    </div>
  );
}
