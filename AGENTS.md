# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

A private wishlist ("ønskeliste") app for a joint naming ceremony ("navnefest") for three children (Edvin, Jonas, Sofie). Guests unlock the list with a shared passphrase from the invitation, filter gifts per child, and reserve gifts anonymously — no accounts, no personal data stored. Full spec in [MVP.md](MVP.md) (Norwegian); code comments reference it by section (e.g. `MVP.md §12`) — check the relevant section there before changing behavior around auth, reservations, or privacy.

Astro + TypeScript SSR app on Cloudflare Workers with a D1 (SQLite) database, React islands for interactive parts. Code comments and commit messages are in Norwegian.

## Commands

```bash
npm run dev                  # dev server (workerd runtime) on :4321 — runs as a daemon; stop with `npx astro dev stop`
npm run build                # production build to dist/
npm run preview              # run the production build locally in workerd
npm run check                # Astro/TypeScript type check
npm test                     # unit tests (vitest, real workerd + real D1 via miniflare)
npm run test:e2e             # integration tests against a separate dev server (test/e2e.mjs)
npm run db:migrate           # apply migrations to local D1
npm run db:migrate:remote    # apply migrations to production D1
```

Run a single unit test file: `npx vitest run test/reservations.test.ts`. Unit tests require `.dev.vars` values matching those hardcoded as `bindings` in [vitest.config.ts](vitest.config.ts) — that config injects test secrets and migrations automatically, no `.dev.vars` needed for `npm test`. `npm run test:e2e` does read secrets from `.dev.vars` and talks to a real running dev server; it cleans up via the admin API afterward.

Local setup: `cp .env.example .dev.vars` and fill in the four secrets before `npm run dev`.

## Architecture

**Two independent auth flows**, both stateless HMAC-signed cookies (no server-side session storage), enforced centrally in [src/middleware.ts](src/middleware.ts):
- **Guest**: shared `GUEST_PASSPHRASE` or an admin-created invitation link → `session` cookie → gates everything except `/`, `/api/login`, and `/invitasjon/<token>`. The invitation token is stored only as a D1 hash and a new link revokes the old one.
- **Admin**: separate `ADMIN_PASSPHRASE` → `admin_session` cookie → gates everything under `/api/admin/*` except `/api/admin/login`. Completely separate secret and cookie from guest; a guest session cannot be reused as an admin session because the role is baked into the signed payload.

Session token format: `<role>.<expiry-ms>.<base64url(HMAC-SHA256(payload))>`, implemented in [src/lib/auth.ts](src/lib/auth.ts). Passphrase comparisons and signature checks are constant-time via SHA-256 digest comparison in [src/lib/crypto.ts](src/lib/crypto.ts) — reuse those helpers (`constantTimeStringEqual`, `timingSafeEqual`) rather than `===` for any secret comparison.

**Anonymous reservations** ([src/lib/reservations.ts](src/lib/reservations.ts)): the browser gets a random UUID token in a separate signed `reservasjon` cookie. Only a SHA-256 hash of that token is ever stored in D1 (`reservations` table) — the app never persists an identifiable session-to-person mapping. Two reservation modes per gift:
- `single` — first reservation wins, enforced atomically by a conditional `INSERT ... WHERE NOT EXISTS` (one SQL statement, race-safe under D1).
- `group` (spleisegave / pooled gift) — multiple guests can register interest; a unique index on `(gift_id, reservation_token_hash)` caps it at one registration per browser.

Guests can delete only their own reservation (token hash must match); admins can wipe all reservations for a gift (reset). See `reserveSingleGift`, `addGroupInterest`, `deleteMyReservation`, `deleteAllReservationsForGift`.

**Gift catalog is static, not database-backed**: gifts live in [src/data/gifts.ts](src/data/gifts.ts) as a hardcoded array (by design — MVP.md §3, no admin editing UI). Only reservation *state* is in D1. Adding/editing gifts means editing this file and deploying; images go in `public/images/` referenced as `/images/filename.jpg`.

**Client/server sync for reservation status**: [src/pages/api/gifts/status.ts](src/pages/api/gifts/status.ts) returns counts + "reserved by me" flags for all gifts (never leaks tokens). The client-side nanostore [src/stores/giftStatus.ts](src/stores/giftStatus.ts) (`$giftStatus`) is the single source of truth that both `GiftFilters` (the "available only" filter) and `GiftReservationButton` islands subscribe to, so a reservation immediately updates both the card and the filter without a full page reload.

**Security hardening in middleware** ([src/middleware.ts](src/middleware.ts)): strict Origin check on all mutating methods (POST/PUT/PATCH/DELETE) beyond Astro's built-in check (which only covers form content-types); `X-Robots-Tag: noindex, nofollow` set on every response including API/redirects (a meta tag alone wouldn't cover those). Login rate limiting is a per-isolate in-memory sliding window in [src/lib/rate-limit.ts](src/lib/rate-limit.ts) — acceptable because it only needs to slow brute force against a private list, not survive isolate restarts.

**D1 access**: always through `getDb()` in [src/lib/database.ts](src/lib/database.ts), which reads the `DB` binding from `cloudflare:workers` env — don't access `env.DB` directly elsewhere.

## Required environment / secrets

Four secrets (see [.env.example](.env.example)), never committed: `GUEST_PASSPHRASE`, `ADMIN_PASSPHRASE`, `SESSION_SECRET`, `RESERVATION_SECRET`. Locally these go in `.dev.vars`; in production they're set via `wrangler secret put`. `wrangler.jsonc`'s `database_id` is a placeholder until `wrangler d1 create` is run for the real deployment.

## CI/CD

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs typecheck, tests, and build on every push to `main`, then deploys to Cloudflare. Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets; the four app secrets above are set manually via `wrangler secret put` and are not part of the workflow.
