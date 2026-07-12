import { useStore } from "@nanostores/react";
import { useState } from "react";
import {
  $displayName,
  MAX_DISPLAY_NAME_LENGTH,
  setDisplayName,
} from "../stores/displayName";

// Lar gjesten sette navnet sitt rett etter innlogging (MVP.md §8).
// Navnet lagres kun i nettleseren og brukes – og kreves – når man
// melder spleiseinteresse. Monteres med client:only fordi
// localStorage-verdien ikke finnes ved SSR.
export default function NameForm() {
  const saved = useStore($displayName);
  // null = ikke redigert; da følger feltet lagret verdi
  const [draft, setDraft] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const value = draft ?? saved;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setDisplayName(value);
    setDraft(null);
    setJustSaved(true);
  }

  return (
    <form className="name-form" onSubmit={submit}>
      <label htmlFor="visningsnavn">
        Navnet ditt <span className="muted">(vises kun for andre du spleiser med)</span>
      </label>
      <div className="name-form-row">
        <input
          id="visningsnavn"
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          placeholder="F.eks. Anna og Ole"
          value={value}
          onChange={(event) => {
            setDraft(event.target.value);
            setJustSaved(false);
          }}
        />
        <button type="submit" disabled={draft === null || draft.trim() === saved}>
          Lagre
        </button>
      </div>
      <p className="name-form-status muted" aria-live="polite">
        {justSaved
          ? "Navnet er lagret i denne nettleseren."
          : saved
            ? `Lagret navn: ${saved}`
            : "Du blir bedt om navn når du melder deg på en spleis."}
      </p>
    </form>
  );
}
