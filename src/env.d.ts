// Miljøvariabler tilgjengelige i workerd-runtimen (MVP.md §14).
// Settes lokalt i .dev.vars/.env og i produksjon som Cloudflare-variabler.
declare module "cloudflare:workers" {
  export const env: {
    GUEST_PASSPHRASE?: string;
    // Gjestepassord for juleønskelisten (valgfri – uten den kan listen
    // ikke åpnes med passord)
    GUEST_PASSPHRASE_JUL?: string;
    ADMIN_PASSPHRASE?: string;
    SESSION_SECRET?: string;
    RESERVATION_SECRET?: string;
    DB?: import("@cloudflare/workers-types").D1Database;
  };
}

declare namespace App {
  interface Locals {
    // Ønskelistene gjestesesjonen gir tilgang til (settes i middleware)
    wishlists: import("./data/wishlists").WishlistId[];
  }
}
