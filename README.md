# trippel-navnefest

Ønskeliste til navnefest for Edvin (1), Jonas (4) og Sofie (7). Gjester
åpner listen med en felles passphrase fra invitasjonen, filtrerer gaver
per barn og reserverer anonymt – uten brukerkontoer og uten at noen
personopplysninger lagres. Full spesifikasjon: [MVP.md](MVP.md).

Bygget med [Astro](https://astro.build) + TypeScript, React-øyer for de
interaktive delene, og Cloudflare Workers med D1 som database.

## Kom i gang lokalt

```bash
npm install
cp .env.example .dev.vars   # fyll inn testverdier for de fire hemmelighetene
npm run db:migrate          # oppretter reservations-tabellen i lokal D1
npm run dev                 # http://localhost:4321
```

Dev-serveren kjører i workerd (samme runtime som produksjon) og leser
hemmelighetene fra `.dev.vars`. Merk at `astro dev` kjører som daemon:
stopp den med `npx astro dev stop`.

## Tester

```bash
npm test          # 25 enhetstester i ekte workerd med ekte D1
npm run test:e2e  # 17 integrasjonssjekker mot en egen dev-server
```

Integrasjonstestene leser passphrasene fra `.dev.vars` og rydder opp
etter seg via admin-API-et.

## Gavene

Gavene administreres i [`src/data/gifts.ts`](src/data/gifts.ts) (ikke i
admin-grensesnittet, jf. MVP.md §3). Bilder legges i `public/images/`
og refereres med `image: "/images/filnavn.jpg"`. Endringer deployes som
vanlig kode.

## Deploy til Cloudflare

### Førstegangsoppsett

1. **Opprett produksjonsdatabasen:**

   ```bash
   npx wrangler d1 create trippel-navnefest
   ```

   Kommandoen skriver ut en `database_id` – lim den inn i
   [`wrangler.jsonc`](wrangler.jsonc) i stedet for plassholderen
   (`00000000-...`), og commit endringen.

2. **Kjør migrasjonen mot produksjon:**

   ```bash
   npm run db:migrate:remote
   ```

3. **Sett hemmelighetene** (velg sterke, ulike verdier – f.eks.
   `openssl rand -base64 32` for de to secret-ene):

   ```bash
   npx wrangler secret put GUEST_PASSPHRASE
   npx wrangler secret put ADMIN_PASSPHRASE
   npx wrangler secret put SESSION_SECRET
   npx wrangler secret put RESERVATION_SECRET
   ```

   Administrer invitasjonslenken fra adminsiden etter deploy. Lenken utløper
   ikke og kan tilbakekalles ved å lage en ny der.

4. **Deploy:**

   ```bash
   npm run build
   npx wrangler deploy
   ```

   Wrangler bruker automatisk den genererte konfigurasjonen i
   `dist/server/wrangler.json` (via `.wrangler/deploy/config.json`).

### Automatisk deploy fra GitHub

Workflowen [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
kjører typesjekk, tester og bygg på hver push til `main`, og deployer
deretter til Cloudflare. Den trenger to repository secrets
(Settings → Secrets and variables → Actions):

| Secret | Verdi |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API-token med malen «Edit Cloudflare Workers» pluss D1-tilgang (`Account → D1 → Edit`) |
| `CLOUDFLARE_ACCOUNT_ID` | Konto-ID-en fra Cloudflare-dashbordet |

Hemmelighetene fra punkt 3 settes fortsatt manuelt med
`wrangler secret put` – de ligger aldri i repoet eller i workflowen.

## Kommandoer

| Kommando | Gjør |
| --- | --- |
| `npm run dev` | Dev-server (workerd) på port 4321 |
| `npm run build` | Produksjonsbygg til `dist/` |
| `npm run preview` | Kjør produksjonsbygget lokalt i workerd |
| `npm run check` | TypeScript/Astro-typesjekk |
| `npm test` | Enhetstester |
| `npm run test:e2e` | Integrasjonstester |
| `npm run db:migrate` | Migrasjoner mot lokal D1 |
| `npm run db:migrate:remote` | Migrasjoner mot produksjons-D1 |
