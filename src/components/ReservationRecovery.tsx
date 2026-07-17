import { useState } from "react";
import { refreshGiftStatus } from "../stores/giftStatus";

export default function ReservationRecovery() {
  const [recoveryCode, setRecoveryCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function restore(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const response = await fetch("/api/reservations/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryCode }),
      });
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }
      if (!response.ok) {
        setMessage(
          response.status === 429
            ? "For mange forsøk. Vent litt og prøv igjen."
            : "Fant ingen reservasjoner med den koden.",
        );
        return;
      }
      await refreshGiftStatus();
      setMessage("Reservasjonene dine er gjenopprettet på denne enheten.");
      setRecoveryCode("");
    } catch {
      setMessage("Noe gikk galt. Prøv gjerne igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="reservation-recovery">
      <summary>Mistet du reservasjonene dine?</summary>
      <form onSubmit={restore}>
        <label htmlFor="recovery-code">Gjenopprettingskode</label>
        <div className="reservation-recovery-row">
          <input
            id="recovery-code"
            value={recoveryCode}
            onChange={(event) => setRecoveryCode(event.target.value)}
            placeholder="ABCDE-FGHJK-MNPQR-STVWX"
            autoComplete="off"
            autoCapitalize="characters"
            required
          />
          <button type="submit" disabled={busy || !recoveryCode.trim()}>
            Gjenopprett
          </button>
        </div>
        {message && <p className="reservation-recovery-message" aria-live="polite">{message}</p>}
      </form>
    </details>
  );
}
