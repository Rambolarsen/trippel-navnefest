import type { APIRoute } from "astro";
import { getGiftById } from "../../../../data/gifts";
import { getDb } from "../../../../lib/database";
import {
  addGroupInterest,
  getGiftReservationStatus,
  getGroupParticipants,
  getOrCreateReservationToken,
  normalizeDisplayName,
  reserveSingleGift,
} from "../../../../lib/reservations";

// Leser visningsnavnet fra JSON- eller skjema-body (samme tosidige
// mønster som /api/login). Body er valgfri – enkeltgaver sender ingen.
async function readDisplayName(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { displayName?: unknown };
      return normalizeDisplayName(body.displayName);
    }
    if (contentType.includes("form")) {
      return normalizeDisplayName((await request.formData()).get("displayName"));
    }
  } catch {
    // ugyldig/tom body behandles som manglende navn
  }
  return null;
}

// Opprett reservasjon (enkeltgave) eller spleiseinteresse (MVP.md §12).
// Sesjonskontrollen skjer i middleware.
export const POST: APIRoute = async ({ params, request, cookies }) => {
  const gift = getGiftById(params.giftId ?? "");
  if (!gift) {
    return Response.json({ error: "Ukjent gave" }, { status: 404 });
  }

  // Valider navn før vi eventuelt utsteder en ny gjenopprettingskode.
  const displayName = gift.mode === "group" ? await readDisplayName(request) : null;
  if (gift.mode === "group" && !displayName) {
    return Response.json({ error: "Navn er påkrevd for spleis" }, { status: 400 });
  }

  const db = getDb();
  const { tokenHash, recoveryCode } = await getOrCreateReservationToken(cookies);

  let result;
  if (gift.mode === "single") {
    result = await reserveSingleGift(db, gift.id, tokenHash);
  } else {
    result = await addGroupInterest(db, gift.id, tokenHash, displayName!);
  }

  const status = await getGiftReservationStatus(db, gift.id, tokenHash);
  const body: Record<string, unknown> = {
    giftId: gift.id,
    mode: gift.mode,
    ...status,
    ...(recoveryCode && { recoveryCode }),
  };

  // Gjesten er nå selv deltaker og får se hvem de spleiser med.
  if (gift.mode === "group" && status.reservedByCurrentVisitor) {
    body.participants = await getGroupParticipants(db, gift.id);
  }

  // "already-mine" er idempotent suksess; kun en annen gjests
  // enkeltgave-reservasjon gir 409 (MVP.md §12).
  const httpStatus =
    result === "created" ? 201 : result === "already-mine" ? 200 : 409;
  return Response.json(body, { status: httpStatus });
};
