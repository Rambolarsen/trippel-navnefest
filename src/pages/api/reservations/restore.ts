import type { APIRoute } from "astro";
import { sha256Hex } from "../../../lib/crypto";
import { getDb } from "../../../lib/database";
import { isRateLimited } from "../../../lib/rate-limit";
import {
  getGiftIdsReservedBy,
  normalizeRecoveryCode,
  restoreReservationToken,
} from "../../../lib/reservations";

const MAX_RECOVERY_CODE_LENGTH = 128;

// Gjenopprett reservasjoner i en ny nettleser. Gjesten må allerede ha
// tilgang til ønskelisten, og en liten begrensning bremser kodegjetting.
export const POST: APIRoute = async (context) => {
  let clientKey = "ukjent";
  try {
    clientKey = context.clientAddress;
  } catch {
    // clientAddress er ikke tilgjengelig i alle miljøer
  }
  if (isRateLimited(`reservation-restore:${clientKey}`)) {
    return Response.json({ error: "For mange forsøk" }, { status: 429 });
  }

  let input: unknown;
  try {
    const contentType = context.request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      input = ((await context.request.json()) as { recoveryCode?: unknown }).recoveryCode;
    } else {
      input = (await context.request.formData()).get("recoveryCode");
    }
  } catch {
    return Response.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  if (typeof input === "string" && input.length > MAX_RECOVERY_CODE_LENGTH) {
    return Response.json({ error: "Ugyldig gjenopprettingskode" }, { status: 400 });
  }
  const recoveryCode = normalizeRecoveryCode(input);
  if (!recoveryCode) {
    return Response.json({ error: "Ugyldig gjenopprettingskode" }, { status: 400 });
  }

  const tokenHash = await sha256Hex(recoveryCode);
  const reservedGiftIds = await getGiftIdsReservedBy(getDb(), tokenHash);
  if (reservedGiftIds.size === 0) {
    return Response.json({ error: "Fant ingen reservasjoner" }, { status: 404 });
  }

  await restoreReservationToken(context.cookies, recoveryCode);
  return Response.json({ restored: true, recoveryCode });
};
