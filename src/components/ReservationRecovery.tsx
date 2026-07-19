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
  const [recoveryCodeCopied, setRecoveryCodeCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRecoveryCode) setRecoveryCode(initialRecoveryCode);
  }, [initialRecoveryCode]);

  useEffect(() => {
    setRecoveryCodeCopied(false);
    setCopyError(null);
  }, [activeRecoveryCode]);

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

  async function copyRecoveryCode(code: string) {
    setCopyError(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.append(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Kunne ikke kopiere koden");
      }
      setRecoveryCodeCopied(true);
    } catch {
      setCopyError("Kunne ikke kopiere koden. Marker og kopier den manuelt.");
    }
  }

  return (
    <section className="reservation-recovery" aria-label="Gjenoppretting av reservasjoner">
      {activeRecoveryCode && (
        <div className="reservation-recovery-code">
          <strong>Din gjenopprettingskode</strong>
          <div className="reservation-recovery-code-value">
            <code>{activeRecoveryCode}</code>
            <button
              type="button"
              className="reservation-recovery-copy"
              onClick={() => copyRecoveryCode(activeRecoveryCode)}
              aria-label="Kopier gjenopprettingskoden"
              title={recoveryCodeCopied ? "Kopiert" : "Kopier kode"}
            >
              {recoveryCodeCopied ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></svg>
              )}
            </button>
            <span className="sr-only" aria-live="polite">{recoveryCodeCopied ? "Gjenopprettingskoden er kopiert." : ""}</span>
          </div>
          {copyError && <p className="reservation-recovery-copy-error" role="alert">{copyError}</p>}
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
              name="recoveryCode"
              type="text"
              value={recoveryCode}
              onChange={(event) => setRecoveryCodeInput(event.target.value)}
              placeholder="ABCDE-FGHJK-MNPQR-STVWX"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
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
