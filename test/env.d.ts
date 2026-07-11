/// <reference types="@cloudflare/vitest-pool-workers/types" />
import type { D1Database, D1Migration } from "@cloudflare/workers-types";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    DB: D1Database;
    TEST_MIGRATIONS: D1Migration[];
    GUEST_PASSPHRASE: string;
    ADMIN_PASSPHRASE: string;
    SESSION_SECRET: string;
    RESERVATION_SECRET: string;
  }
}
