import type { Gift } from "./gifts";

// Gavene til juleønskelisten. Samme format som navnefestgavene i
// ./gifts.ts. Gave-id-ene må være unike på tvers av alle ønskelister,
// fordi reservasjonene i D1 er knyttet til gave-id (bruk gjerne
// prefikset «jul-»).
export const julGifts: Gift[] = [];
