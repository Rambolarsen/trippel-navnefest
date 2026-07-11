import { useStore } from "@nanostores/react";
import { useState } from "react";
import { $giftStatus, type GiftStatusEntry } from "../stores/giftStatus";

type Props = {
  giftId: string;
  mode: "single" | "group";
};

function countText(count: number): string {
  return count === 1
    ? "1 person har meldt interesse for å spleise."
    : `${count} personer har meldt interesse for å spleise.`;
}

export default function GiftReservationButton({ giftId, mode }: Props) {
  const statuses = useStore($giftStatus);
  const status: GiftStatusEntry | undefined = statuses[giftId];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const known = status !== undefined;
  const mine = status?.reservedByCurrentVisitor ?? false;
  const count = status?.reservationCount ?? 0;
  const takenByOther = mode === "single" && !mine && count > 0;

  async function act(method: "POST" | "DELETE") {
    const previous = status;
    setError(null);
    setBusy(true);

    // Optimistisk oppdatering – tilbakestilles ved nettverksfeil,
    // og overskrives alltid av serverens fasit når svaret kommer.
    $giftStatus.setKey(
      giftId,
      method === "POST"
        ? { mode, reservationCount: count + 1, reservedByCurrentVisitor: true }
        : {
            mode,
            reservationCount: Math.max(0, count - 1),
            reservedByCurrentVisitor: false,
          },
    );

    try {
      const url =
        method === "POST"
          ? `/api/gifts/${giftId}/reservations`
          : `/api/gifts/${giftId}/reservations/mine`;
      const response = await fetch(url, { method });

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      const body = (await response.json()) as GiftStatusEntry & { giftId: string };
      $giftStatus.setKey(giftId, {
        mode: body.mode,
        reservationCount: body.reservationCount,
        reservedByCurrentVisitor: body.reservedByCurrentVisitor,
      });

      if (response.status === 409) {
        setError("Oi – noen andre rakk denne rett før deg.");
      }
    } catch {
      if (previous) {
        $giftStatus.setKey(giftId, previous);
      }
      setError("Noe gikk galt. Prøv gjerne igjen.");
    } finally {
      setBusy(false);
    }
  }

  let statusLines: string[];
  if (mode === "single") {
    statusLines = mine
      ? ["Du har markert at du tenker å kjøpe denne."]
      : takenByOther
        ? ["Noen har allerede tenkt å kjøpe denne."]
        : ["Ledig"];
  } else {
    statusLines = [];
    if (mine) statusLines.push("Du har meldt interesse for å spleise.");
    if (count > 0) statusLines.push(countText(count));
    if (statusLines.length === 0) statusLines.push("Ledig");
  }

  return (
    <div className="reservation">
      <div className="reservation-status" aria-live="polite">
        {statusLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {error && <p className="reservation-error">{error}</p>}
      </div>
      {mine ? (
        <button type="button" disabled={busy} onClick={() => act("DELETE")}>
          {mode === "single" ? "Angre reservasjonen" : "Trekk spleiseinteressen"}
        </button>
      ) : takenByOther ? null : (
        <button type="button" disabled={!known || busy} onClick={() => act("POST")}>
          {mode === "single" ? "Jeg tenker å kjøpe denne" : "Jeg vil være med og spleise"}
        </button>
      )}
    </div>
  );
}
