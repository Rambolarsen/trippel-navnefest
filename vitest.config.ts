import path from "node:path";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Testene kjører i workerd via @cloudflare/vitest-pool-workers, med
// ekte D1 (miniflare) og testverdier for hemmelighetene – samme
// runtime som produksjon.
export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(import.meta.dirname, "migrations"),
  );

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            GUEST_PASSPHRASE: "test-gjest-123",
            ADMIN_PASSPHRASE: "test-admin-456",
            SESSION_SECRET: "test-session-secret",
            RESERVATION_SECRET: "test-reservation-secret",
            TEST_MIGRATIONS: migrations,
          },
        },
      }),
    ],
    test: {
      include: ["test/**/*.test.ts"],
      setupFiles: ["./test/apply-migrations.ts"],
    },
  };
});
