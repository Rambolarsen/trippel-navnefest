import type { D1Database } from "@cloudflare/workers-types";
import { env } from "cloudflare:workers";

export function getDb(): D1Database {
  if (!env.DB) {
    throw new Error(
      "D1-bindingen DB er ikke konfigurert – kjør `npm run db:migrate` lokalt eller sett opp databasen i Cloudflare",
    );
  }
  return env.DB;
}
