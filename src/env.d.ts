// Miljøvariabler tilgjengelige i workerd-runtimen (MVP.md §14).
// Settes lokalt i .dev.vars/.env og i produksjon som Cloudflare-variabler.
declare module "cloudflare:workers" {
  export const env: {
    GUEST_PASSPHRASE?: string;
    ADMIN_PASSPHRASE?: string;
    SESSION_SECRET?: string;
    RESERVATION_SECRET?: string;
  };
}
