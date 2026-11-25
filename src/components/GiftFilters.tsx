import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { $giftStatus, refreshGiftStatus } from "../stores/giftStatus";

// Filtrene fra MVP.md §7. «Alle» og «Ledige» finnes alltid; filtrene
// mellom dem kommer fra ønskelisten (src/data/wishlists.ts). Filtrering
// skjer uten sidelasting ved å vise/skjule de server-rendrede
// gavekortene ([data-gift-card]). Reservasjonsstatus hentes fra den
// delte storen, slik at «Ledige»-filteret reflekterer faktiske
// reservasjoner.
type TagFilter = { label: string; tag: string };
type Filter = { label: string; matches: (card: HTMLElement) => boolean };

const ALL: Filter = { label: "Alle", matches: () => true };
const AVAILABLE: Filter = {
  label: "Ledige",
  matches: (card) => card.dataset.status === "available",
};

function tagFilter({ label, tag }: TagFilter): Filter {
  return {
    label,
    matches: (card) => (card.dataset.tags ?? "").split("|").includes(tag),
  };
}

export default function GiftFilters({ filters: tagFilters }: { filters: TagFilter[] }) {
  const filters = [ALL, ...tagFilters.map(tagFilter), AVAILABLE];
  const [activeLabel, setActiveLabel] = useState(ALL.label);
  const active = filters.find((filter) => filter.label === activeLabel) ?? ALL;
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

      const show = active.matches(card);
      card.hidden = !show;
      if (show) visible += 1;
    }
    setVisibleCount(visible);
  }, [activeLabel, statuses]);

  return (
    <div className="gift-filters">
      <div className="filter-buttons" role="group" aria-label="Filtrer gaver">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={filter === active ? "filter-btn is-active" : "filter-btn"}
            aria-pressed={filter === active}
            onClick={() => setActiveLabel(filter.label)}
          >
            {filter.label}
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
