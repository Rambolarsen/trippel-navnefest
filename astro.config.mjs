// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// SSR på alle sider: innlogging, ønskeliste og admin krever
// server-side sesjonssjekk (se MVP.md §4 og §13).
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
});
