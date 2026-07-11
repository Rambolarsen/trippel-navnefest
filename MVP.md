# Navnefest – ønskeliste (MVP-spesifikasjon)

## 1. Formål

Lag en enkel, mobilvennlig ønskeliste til navnefest for tre barn:

- **Edvin** – 1 år
- **Jonas** – 4 år
- **Sofie** – 7 år

Gjester skal kunne:

- åpne ønskelisten med en felles passphrase
- filtrere gaver etter barn
- se hvilke gaver som fortsatt er ledige
- anonymt markere at de vurderer å kjøpe en gave
- melde interesse for å spleise på større gaver

Det skal ikke opprettes brukerkontoer eller lagres personopplysninger.

---

## 2. Mål for MVP

MVP-en skal være liten nok til å utvikles og driftes enkelt, men robust nok til at flere gjester kan bruke den samtidig.

Første versjon skal støtte:

1. Felles passphrase for tilgang
2. Signert innloggingssesjon
3. Gaveliste med bilder, beskrivelser og tags
4. Filtrering etter barn og gavetype
5. Anonyme reservasjoner
6. Spleisegaver med flere interessenter
7. Mulighet for å angre egen reservasjon
8. Enkel beskyttet adminside
9. Mobilvennlig utforming
10. Ingen søkemotorindeksering

---

## 3. Ikke en del av MVP

Følgende skal ikke implementeres i første versjon:

- individuelle brukerkontoer
- innlogging med Google, Facebook eller e-post
- betaling eller Vipps-integrasjon
- chat mellom gjester
- automatiske e-poster
- visning av hvem som reserverte en gave
- avansert lagerstyring
- produktimport fra nettbutikker
- redigering av gaver gjennom admin-grensesnittet

Gavene kan i første versjon administreres gjennom en TypeScript- eller JSON-fil i repoet.

---

## 4. Anbefalt stack

### Applikasjon

- Astro
- TypeScript
- React-komponenter for interaktive deler
- Server-side rendering for beskyttede sider

React skal kun brukes der interaktivitet er nødvendig, for eksempel:

- gavefiltrering
- reservasjonsknapper
- spleiseinteresse
- statusoppdatering uten full sidelasting

### Hosting

Anbefalt løsning:

- Cloudflare Pages eller Workers
- Cloudflare D1 for database
- Cloudflare-miljøvariabler for hemmeligheter

Alternative plattformer kan brukes så lenge de støtter:

- server-side API-endepunkter
- sikre cookies
- vedvarende database
- miljøvariabler

---

## 5. Brukerflyt

### Første besøk

1. Gjesten åpner nettsiden.
2. Gjesten ser en enkel innloggingsside.
3. Gjesten skriver inn passphrasen fra invitasjonen.
4. Serveren validerer passphrasen.
5. Ved riktig passphrase opprettes en signert HttpOnly-cookie.
6. Gjesten sendes videre til ønskelisten.

### Senere besøk

Dersom sesjonen fortsatt er gyldig, skal gjesten gå direkte til ønskelisten.

### Feil passphrase

Vis en generell melding:

> Det passordet stemte ikke. Prøv gjerne igjen.

Ikke oppgi detaljer om forventet passphrase.

---

## 6. Sider

### `/`

Innloggingsside.

Innhold:

- tittel
- kort introduksjon
- passphrase-felt
- knapp for å åpne ønskelisten
- feilmelding ved ugyldig passphrase

Eksempeltekst:

> Skriv inn passordet fra invitasjonen for å åpne ønskelisten.

### `/onskeliste`

Hovedside med:

- introduksjon
- filterknapper
- gavekort
- status for reservasjoner
- knapp for å reservere eller melde spleiseinteresse

Introduksjon:

> Flere har spurt hva barna ønsker seg til navnefesten. Gaver er selvfølgelig ikke nødvendig, men her er noen forslag dersom du ønsker å gi noe.

### `/admin`

Enkel administrasjonsside beskyttet med separat admin-passphrase.

Admin skal kunne:

- se alle gaver
- se antall reservasjoner
- se antall spleiseinteressenter
- oppheve reservasjoner
- nullstille alle reservasjoner på en gave

Admin skal **ikke** kunne se hvem som har reservert.

---

## 7. Filtre

Ønskelisten skal minst ha følgende filtre:

- Alle
- Edvin
- Jonas
- Sofie
- Fellesgaver
- Spleisegaver
- Ledige

Filtrering skal skje uten full sidelasting.

En gave kan være tagget med flere barn.

Eksempel:

```ts
tags: ["Jonas", "Sofie", "Fellesgave", "Spleisegave"]
```

---

## 8. Gavetyper

Det skal finnes to reservasjonsmoduser.

### Enkeltgave

En gave som normalt kjøpes av én gjest.

Eksempler:

- Lego-sett
- bok
- balansesykkel
- hobbysett

Når en gjest reserverer:

> Du har markert at du tenker å kjøpe denne.

Andre gjester skal se:

> Noen har allerede tenkt å kjøpe denne.

Gaven skal ikke kunne reserveres av flere samtidig.

### Spleisegave

En gave flere gjester kan melde interesse for.

Eksempel:

- Nintendo Switch 2
- sykkel
- større leke
- opplevelse

Gjesten ser:

> Jeg vil være med og spleise

Etter registrering:

> Du har meldt interesse for å spleise.

Andre gjester kan se antall interessenter:

> 3 personer har meldt interesse for å spleise.

MVP-en skal ikke håndtere betaling eller koordinering av selve spleisen.

---

## 9. Anonyme reservasjoner

Det skal ikke lagres:

- navn
- e-postadresse
- telefonnummer
- IP-adresse som del av reservasjonsdata
- andre identifiserende opplysninger

Når en gjest reserverer en gave, skal nettleseren få en tilfeldig reservasjonsidentifikator.

Denne skal brukes til å avgjøre om gjesten kan angre sin egen reservasjon.

Anbefalt løsning:

- tilfeldig generert UUID eller kryptografisk token
- lagres i en signert cookie
- tokenet lagres sammen med reservasjonen i databasen

Andre gjester skal ikke kunne se tokenet.

---

## 10. Datamodell

### Gift

```ts
export type GiftMode = "single" | "group";
export type Gift = {
  id: string;
  title: string;
  description: string;
  image?: string;
  tags: string[];
  priceLabel?: string;
  priority?: "normal" | "high";
  mode: GiftMode;
  link?: string;
};
```

Eksempelgave:

```ts
{
  id: "nintendo-switch-2",
  title: "Nintendo Switch 2",
  description:
    "En fellesgave barna og familien kan ha glede av i mange år.",
  image: "/images/nintendo-switch-2.jpg",
  tags: ["Jonas", "Sofie", "Fellesgave", "Spleisegave"],
  priceLabel: "Stor spleisegave",
  priority: "high",
  mode: "group"
}
```

### Reservation

```ts
export type Reservation = {
  id: string;
  giftId: string;
  reservationTokenHash: string;
  createdAt: string;
};
```

For spleisegaver kan hver interessent ha én egen reservasjonsrad.

---

## 11. Database

### Tabell: `reservations`

Foreslått databaseskjema:

```sql
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  gift_id TEXT NOT NULL,
  reservation_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_reservations_gift_id
ON reservations(gift_id);
CREATE UNIQUE INDEX idx_unique_reservation
ON reservations(gift_id, reservation_token_hash);
```

For enkeltgaver skal API-et kontrollere at det ikke allerede finnes en reservasjon før en ny opprettes.

Dette må håndteres atomisk eller i en transaksjon for å unngå at to personer reserverer samme gave samtidig.

---

## 12. API-endepunkter

### `POST /api/login`

Input:

```json
{
  "passphrase": "tekst fra gjesten"
}
```

Ved riktig passphrase:

- opprett signert sesjonscookie
- returner 200

Ved feil:

- returner 401

### `POST /api/logout`

- slett sesjonscookie
- returner 204

### `GET /api/gifts/status`

Returner reservasjonsstatus for gavene.

Eksempel:

```json
{
  "nintendo-switch-2": {
    "mode": "group",
    "reservationCount": 3,
    "reservedByCurrentVisitor": true
  },
  "lego-sett": {
    "mode": "single",
    "reservationCount": 1,
    "reservedByCurrentVisitor": false
  }
}
```

### `POST /api/gifts/:giftId/reservations`

Opprett reservasjon eller spleiseinteresse.

Serveren skal:

1. kontrollere innloggingssesjonen
2. kontrollere at gaven finnes
3. kontrollere gavens modus
4. kontrollere om brukeren allerede har registrert seg
5. opprette reservasjonen
6. returnere oppdatert status

For enkeltgaver skal forespørselen avvises med `409 Conflict` dersom gaven allerede er reservert.

### `DELETE /api/gifts/:giftId/reservations/mine`

Opphev reservasjonen som tilhører gjeldende nettleser.

Serveren skal kun slette reservasjoner som samsvarer med gjestens reservasjonstoken.

### `DELETE /api/admin/gifts/:giftId/reservations`

Admin-endepunkt som fjerner alle reservasjoner for en gave.

Krever gyldig adminsesjon.

---

## 13. Cookies og sesjoner

### Gjestesesjon

Cookien skal være:

- HttpOnly
- Secure i produksjon
- SameSite=Lax
- signert
- utilgjengelig for JavaScript

Foreslått varighet: 30 dager.

### Reservasjonstoken

Reservasjonstokenet kan lagres i en egen signert cookie.

Det bør genereres tilfeldig og aldri baseres på:

- IP-adresse
- user-agent
- navn
- tidspunkt alene

### Adminsesjon

Admin skal bruke en separat cookie og separat passphrase.

---

## 14. Miljøvariabler

```
GUEST_PASSPHRASE=
ADMIN_PASSPHRASE=
SESSION_SECRET=
RESERVATION_SECRET=
```

Ingen hemmeligheter skal lagres i repoet.

Legg til `.env` i `.gitignore`.

Opprett en `.env.example` uten faktiske verdier.

---

## 15. Sikkerhet

MVP-en skal minst ha:

- server-side validering av passphrase
- sikker sammenligning av passphrase
- signerte cookies
- rate limiting på innlogging
- CSRF-beskyttelse eller streng kontroll av Origin
- inputvalidering
- ingen hemmeligheter i frontend
- ingen personopplysninger i databasen
- separate gjeste- og adminpassphrases

Dette er en privat ønskeliste, ikke et system for sensitive data. Løsningen trenger derfor ikke avansert identitetsstyring.

---

## 16. Søkemotorer og personvern

Alle sider skal ha:

```html
<meta name="robots" content="noindex, nofollow" />
```

Opprett også `robots.txt`:

```
User-agent: *
Disallow: /
```

Ikke bruk analyseverktøy eller tredjepartssporing i MVP-en.

---

## 17. Design

Uttrykket skal være:

- varmt
- enkelt
- barnevennlig
- ryddig
- ikke for barnslig
- godt tilpasset mobil

### Gavekort

Hvert kort skal inneholde:

- bilde
- navn på gaven
- kort beskrivelse
- tags
- prisnivå dersom oppgitt
- reservasjonsstatus
- handlingsknapp

Eksempel:

> **Nintendo Switch 2**
> En fellesgave barna og familien kan ha glede av i mange år.
> Jonas · Sofie · Fellesgave · Spleisegave
> 3 personer har meldt interesse
> [ Jeg vil være med og spleise ]

### Statusfarger

Status skal ikke kommuniseres kun med farge. Bruk alltid tekst og eventuelt ikon.

Eksempler:

- Ledig
- Noen tenker å kjøpe denne
- Du har reservert denne
- 3 personer vil være med og spleise

---

## 18. Tilgjengelighet

Løsningen skal:

- kunne brukes med tastatur
- ha synlig fokusmarkering
- ha labels på alle skjemaelementer
- ha alternativ tekst på bilder
- bruke tilstrekkelig kontrast
- ha minst 44 × 44 pikslers trykkflate på knapper
- støtte redusert animasjon
- ikke være avhengig av hover

---

## 19. Foreslått prosjektstruktur

```
/
├── public/
│   ├── images/
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── GiftCard.astro
│   │   ├── GiftFilters.tsx
│   │   ├── GiftReservationButton.tsx
│   │   └── Tag.astro
│   ├── data/
│   │   └── gifts.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── cookies.ts
│   │   ├── database.ts
│   │   ├── gifts.ts
│   │   └── reservations.ts
│   ├── middleware.ts
│   └── pages/
│       ├── index.astro
│       ├── onskeliste.astro
│       ├── admin.astro
│       └── api/
│           ├── login.ts
│           ├── logout.ts
│           ├── gifts/
│           │   └── status.ts
│           └── admin/
├── migrations/
│   └── 0001_create_reservations.sql
├── .env.example
├── astro.config.mjs
├── package.json
└── README.md
```

---

## 20. Første gaver

Start med et lite representativt utvalg.

### Fellesgaver

**Nintendo Switch 2**

- Tags: Jonas, Sofie, Fellesgave, Spleisegave
- Modus: group
- Prioritet: high
- Prisnivå: Stor spleisegave

### Edvin

**Duplo**

- Tags: Edvin, Leker
- Modus: single
- Prisnivå: 300–700 kr

**Balansesykkel med fire hjul**

- Tags: Edvin, Utelek
- Modus: single
- Prisnivå: 500–1000 kr

**Bøker for små barn**

- Tags: Edvin, Bøker
- Modus: single
- Prisnivå: Under 300 kr

### Jonas

**Lego 4+**

- Tags: Jonas, Lego
- Modus: single
- Prisnivå: 300–700 kr

**Magnetiske byggeklosser**

- Tags: Jonas, Byggeleker
- Modus: single
- Prisnivå: 500–1000 kr

**Brettspill for barn**

- Tags: Jonas, Spill
- Modus: single
- Prisnivå: Under 500 kr

### Sofie

**Hobby- og tegnesaker**

- Tags: Sofie, Kreativt
- Modus: single
- Prisnivå: Under 500 kr

**Lego**

- Tags: Sofie, Lego
- Modus: single
- Prisnivå: 300–700 kr

**Opplevelse**

- Tags: Sofie, Opplevelse
- Modus: single
- Prisnivå: Valgfritt

---

## 21. Akseptansekriterier

### Autentisering

- En gjest med korrekt passphrase får tilgang.
- En gjest med feil passphrase får ikke tilgang.
- Passphrasen finnes ikke i frontend-koden.
- En gyldig sesjon varer på tvers av sideoppdateringer.

### Gaveliste

- Alle gaver vises som kort.
- Gavene kan filtreres etter hvert barn.
- Fellesgaver kan filtreres separat.
- Ledige gaver kan filtreres separat.

### Enkeltgaver

- En ledig gave kan reserveres.
- Når den er reservert, kan ikke andre reservere den.
- Gjesten som reserverte kan angre fra samme nettleser.
- Andre gjester ser ikke hvem som reserverte.

### Spleisegaver

- Flere gjester kan melde interesse.
- Antall interessenter vises.
- Hver nettleser kan kun registrere én interesse per gave.
- Gjesten kan trekke sin egen interesse.

### Admin

- Adminsiden krever separat autentisering.
- Admin kan se reservasjonsstatus.
- Admin kan oppheve reservasjoner.
- Admin kan ikke se identiteten til gjestene.

### Mobil

- Siden fungerer fra 320 piksler bredde.
- Ingen horisontal scrolling.
- Knapper er enkle å bruke på berøringsskjerm.

---

## 22. Testing

### Enhetstester

Test minst:

- validering av passphrase
- opprettelse og validering av sesjon
- reservasjon av enkeltgave
- avvisning når enkeltgave allerede er reservert
- flere reservasjoner på spleisegave
- sletting av egen reservasjon
- avvisning av sletting med feil token

### Integrasjonstester

Test:

- innlogging
- åpning av beskyttet side
- full reservasjonsflyt
- admin-nullstilling

### Manuell test

Test i:

- Safari på iPhone
- Chrome på Android
- vanlig desktop-nettleser
- privat nettleservindu
- to nettlesere samtidig

---

## 23. Foreslått implementeringsrekkefølge

### Fase 1 – Grunnstruktur

1. Opprett Astro-prosjekt.
2. Sett opp TypeScript.
3. Opprett layout og grunnleggende design.
4. Opprett statisk gavedata.
5. Vis gavekort og filtre.

### Fase 2 – Autentisering

1. Lag innloggingsside.
2. Implementer passphrase-validering.
3. Implementer signert cookie.
4. Beskytt ønskeliste og admin med middleware.

### Fase 3 – Database

1. Opprett D1-database.
2. Kjør migrasjon.
3. Implementer repository for reservasjoner.
4. Implementer status-endepunkt.

### Fase 4 – Reservasjoner

1. Implementer reservasjon av enkeltgaver.
2. Implementer spleiseinteresse.
3. Implementer angre-funksjon.
4. Oppdater grensesnittet optimistisk, med feiltilbakestilling.

### Fase 5 – Admin og ferdigstilling

1. Lag adminside.
2. Implementer nullstilling.
3. Legg til rate limiting.
4. Legg til robots-regler.
5. Test mobil og tilgjengelighet.
6. Deploy.

---

## 24. Definisjon av ferdig

MVP-en regnes som ferdig når:

- nettsiden er publisert på en stabil URL
- gjester kan logge inn med passphrase
- gaver kan filtreres etter barn
- enkeltgaver kan reserveres anonymt
- spleisegaver støtter flere interessenter
- gjesten kan angre egen handling
- admin kan nullstille reservasjoner
- ingen personopplysninger lagres
- løsningen fungerer godt på mobil
- passphrases og secrets kun finnes som miljøvariabler

> Første versjon startes uten produktlenker og uten mulighet til å redigere gavene i admin. Det holder første versjon liten, mens reservasjonene – den viktigste dynamiske funksjonen – blir skikkelig implementert.
