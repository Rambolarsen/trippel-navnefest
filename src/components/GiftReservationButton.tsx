import { useStore } from "@nanostores/react";
import { useState } from "react";
import {
  $giftStatus,
  refreshGiftStatus,
  type GiftStatusEntry,
} from "../stores/giftStatus";
import {
  $displayName,
  MAX_DISPLAY_NAME_LENGTH,
  setDisplayName,
} from "../stores/displayName";

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
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  // Spleis krever navn (MVP.md §8): mangler det, spør vi her i kortet.
  // Skjemaet brukes også til å endre navn når man allerede er påmeldt.
  const [askName, setAskName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const known = status !== undefined;
  const mine = status?.reservedByCurrentVisitor ?? false;
  const count = status?.reservationCount ?? 0;
  const participants = status?.participants;
  const takenByOther = mode === "single" && !mine && count > 0;

  async function act(method: "POST" | "DELETE", displayName?: string) {
    const previous = status;
    setError(null);
    setBusy(true);

    // Optimistisk oppdatering – tilbakestilles ved feil, og overskrives
    // alltid av serverens fasit når svaret kommer. Navneendring for en
    // som allerede er påmeldt endrer verken antall eller eget flagg,
    // så da hopper vi over den.
    if (!(method === "POST" && mine)) {
      $giftStatus.setKey(
        giftId,
        method === "POST"
          ? {
              mode,
              reservationCount: count + 1,
              reservedByCurrentVisitor: true,
              ...(displayName && {
                participants: [...(participants ?? []), displayName],
              }),
            }
          : {
              mode,
              reservationCount: Math.max(0, count - 1),
              reservedByCurrentVisitor: false,
            },
      );
    }

    try {
      const url =
        method === "POST"
          ? `/api/gifts/${giftId}/reservations`
          : `/api/gifts/${giftId}/reservations/mine`;
      const response = await fetch(url, {
        method,
        ...(method === "POST" &&
          displayName && {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName }),
          }),
      });

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      // Kun 2xx og 409 bærer en status-body; andre feilsvar er bare
      // { error } og skal ikke inn i storen.
      if (response.ok || response.status === 409) {
        const body = (await response.json()) as GiftStatusEntry & {
          giftId: string;
          recoveryCode?: string;
        };
        if (body.recoveryCode) setRecoveryCode(body.recoveryCode);
        $giftStatus.setKey(giftId, {
          mode: body.mode,
          reservationCount: body.reservationCount,
          reservedByCurrentVisitor: body.reservedByCurrentVisitor,
          ...(body.participants && { participants: body.participants }),
        });
        if (response.status === 409) {
          setError("Oi – noen andre rakk denne rett før deg.");
        }
      } else {
        if (previous) {
          $giftStatus.setKey(giftId, previous);
        } else {
          void refreshGiftStatus();
        }
        setError(
          response.status === 400
            ? "Skriv inn navnet ditt for å bli med på spleisen."
            : "Noe gikk galt. Prøv gjerne igjen.",
        );
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

  // Spleisepåmelding: bruk lagret navn, ellers be om det først
  function joinGroup() {
    const name = $displayName.get().trim();
    if (!name) {
      setNameInput("");
      setAskName(true);
      return;
    }
    void act("POST", name);
  }

  // Åpner skjemaet for å endre navnet på en eksisterende påmelding –
  // også for påmeldinger fra før navn ble innført (uten lagret navn).
  function editName() {
    setNameInput($displayName.get());
    setAskName(true);
  }

  function submitName(event: React.FormEvent) {
    event.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    setDisplayName(name); // huskes til neste spleis
    setAskName(false);
    void act("POST", name);
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
        {mine && participants && participants.length > 0 && (
          <p className="reservation-participants">
            Med på spleisen: {participants.join(", ")}
          </p>
        )}
        {error && <p className="reservation-error">{error}</p>}
        {recoveryCode && (
          <div className="reservation-recovery-code" role="alert">
            <strong>Lagre gjenopprettingskoden din:</strong>
            <code>{recoveryCode}</code>
            <span>Du trenger den hvis du bytter enhet eller sletter nettleserdata.</span>
          </div>
        )}
      </div>
      {askName ? (
        <form className="reservation-name-form" onSubmit={submitName}>
          <label htmlFor={`spleisenavn-${giftId}`}>
            Navnet ditt (vises for de andre på spleisen)
          </label>
          <input
            id={`spleisenavn-${giftId}`}
            type="text"
            required
            autoFocus
            autoComplete="name"
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            placeholder="F.eks. Anna og Ole"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
          />
          <div className="reservation-name-actions">
            <button type="submit" disabled={busy || nameInput.trim() === ""}>
              {mine ? "Lagre navn" : "Bli med på spleisen"}
            </button>
            <button type="button" onClick={() => setAskName(false)}>
              Avbryt
            </button>
          </div>
        </form>
      ) : mine ? (
        <>
          <div className="reservation-name-actions">
            <button type="button" disabled={busy} onClick={() => act("DELETE")}>
              {mode === "single" ? "Angre reservasjonen" : "Trekk spleiseinteressen"}
            </button>
            {mode === "group" && (
              <button type="button" disabled={busy} onClick={editName}>
                Endre navn
              </button>
            )}
          </div>
          {mode === "group" && (
            <p className="reservation-hint muted">
              Trekker du interessen, slettes navnet ditt fra spleisen.
            </p>
          )}
        </>
      ) : takenByOther ? null : (
        <button
          type="button"
          disabled={!known || busy}
          onClick={() => (mode === "single" ? void act("POST") : joinGroup())}
        >
          {mode === "single" ? "Jeg tenker å kjøpe denne" : "Jeg vil være med og spleise"}
        </button>
      )}
    </div>
  );
}
