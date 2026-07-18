import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { refreshGiftStatus } from "../stores/giftStatus";
import { $recoveryCode, setRecoveryCode } from "../stores/recoveryCode";

type Props = {
  initialRecoveryCode: string | null;
};

export default function ReservationRecovery({ initialRecoveryCode }: Props) {
  const activeRecoveryCode = useStore($recoveryCode);
  const [recoveryCode, setRecoveryCodeInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialRecoveryCode) setRecoveryCode(initialRecoveryCode);
  }, [initialRecoveryCode]);

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
      const body = (await response.json()) as { recoveryCode: string };
      setRecoveryCode(body.recoveryCode);
      await refreshGiftStatus();
      setMessage("Reservasjonene dine er gjenopprettet på denne enheten.");
      setRecoveryCodeInput("");
    } catch {
      setMessage("Noe gikk galt. Prøv gjerne igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="reservation-recovery" aria-label="Gjenoppretting av reservasjoner">
      {activeRecoveryCode && (
        <div className="reservation-recovery-code">
          <strong>Din gjenopprettingskode</strong>
          <p><code>{activeRecoveryCode}</code></p>
          <p className="muted">Lagre den et trygt sted. Den gjelder alle reservasjonene dine.</p>
        </div>
      )}
      <details>
        <summary>Mistet du reservasjonene dine?</summary>
        <form onSubmit={restore}>
          <label htmlFor="recovery-code">Gjenopprettingskode</label>
          <div className="reservation-recovery-row">
            <input
              id="recovery-code"
              value={recoveryCode}
              onChange={(event) => setRecoveryCodeInput(event.target.value)}
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
    </section>
  );
}
