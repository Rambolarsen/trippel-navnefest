// Integrasjonstester (MVP.md §22): innlogging, beskyttet side, full
// reservasjonsflyt og admin-nullstilling – kjørt mot dev-serveren.
// Starter sin egen server på port 4322 og rydder opp etter seg.
// Kjør med: npm run test:e2e

import { execSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const PORT = 4322;
const BASE = `http://localhost:${PORT}`;

// Passphrases leses fra .dev.vars (eller .env) slik dev-serveren gjør
function readSecrets() {
  for (const file of [".dev.vars", ".env"]) {
    try {
      const text = readFileSync(file, "utf8");
      const get = (name) => text.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
      const guest = get("GUEST_PASSPHRASE");
      const admin = get("ADMIN_PASSPHRASE");
      if (guest && admin) return { guest, admin };
    } catch {
      // prøv neste fil
    }
  }
  console.error("Fant ikke GUEST_PASSPHRASE/ADMIN_PASSPHRASE i .dev.vars eller .env");
  process.exit(1);
}

// Minimal cookie-jar så hver "nettleser" har egne cookies
function browser() {
  const cookies = new Map();
  return async function request(path, options = {}) {
    const headers = {
      Origin: BASE,
      ...(cookies.size > 0 && {
        Cookie: [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
      }),
      ...options.headers,
    };
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      redirect: "manual",
    });
    for (const line of response.headers.getSetCookie()) {
      const [pair] = line.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1);
      if (value === "" || line.includes("Max-Age=0")) cookies.delete(name);
      else cookies.set(name, value);
    }
    return response;
  };
}

let failures = 0;
function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${name}`);
  } else {
    failures += 1;
    console.error(`  ❌ ${name} ${detail}`);
  }
}

async function run() {
  const { guest, admin } = readSecrets();
  const A = browser();
  const B = browser();
  const ADMIN = browser();

  console.log("Innlogging:");
  let res = await A("/onskeliste");
  check("beskyttet side uten sesjon redirecter", res.status === 302, `(${res.status})`);

  res = await A("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passphrase: "helt-feil" }),
  });
  check("feil passphrase gir 401", res.status === 401, `(${res.status})`);

  for (const [name, client] of [["A", A], ["B", B]]) {
    res = await client("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase: guest }),
    });
    check(`riktig passphrase logger inn ${name}`, res.status === 200, `(${res.status})`);
  }

  res = await A("/onskeliste");
  const html = await res.text();
  check("beskyttet side åpnes med sesjon", res.status === 200 && html.includes("Ønskeliste"));

  console.log("Reservasjonsflyt:");
  // Rydd eventuelle rester fra tidligere kjøringer via admin
  res = await ADMIN("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passphrase: admin }),
  });
  check("admin logger inn", res.status === 200, `(${res.status})`);
  for (const gift of ["duplo", "nintendo-switch-2"]) {
    await ADMIN(`/api/admin/gifts/${gift}/reservations`, { method: "DELETE" });
  }

  res = await A("/api/gifts/duplo/reservations", { method: "POST" });
  let body = await res.json();
  check("A reserverer enkeltgave (201)", res.status === 201 && body.reservationCount === 1);

  res = await B("/api/gifts/duplo/reservations", { method: "POST" });
  body = await res.json();
  check(
    "B avvises med 409 og ser korrekt status",
    res.status === 409 && body.reservationCount === 1 && !body.reservedByCurrentVisitor,
  );

  res = await A("/api/gifts/status");
  body = await res.json();
  check(
    "status viser A sin reservasjon",
    body["duplo"].reservationCount === 1 && body["duplo"].reservedByCurrentVisitor,
  );

  console.log("Spleisegave:");
  res = await A("/api/gifts/nintendo-switch-2/reservations", { method: "POST" });
  check("spleis uten navn avvises med 400", res.status === 400, `(${res.status})`);

  res = await A("/api/gifts/nintendo-switch-2/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "Anna" }),
  });
  body = await res.json();
  check(
    "A melder spleiseinteresse med navn og ser seg selv",
    res.status === 201 && JSON.stringify(body.participants) === '["Anna"]',
  );

  res = await B("/api/gifts/status");
  body = await res.json();
  check(
    "B (ikke deltaker) ser antall, men ingen navn",
    body["nintendo-switch-2"].reservationCount === 1 &&
      body["nintendo-switch-2"].participants === undefined,
  );

  res = await B("/api/gifts/nintendo-switch-2/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "Ole" }),
  });
  body = await res.json();
  check(
    "spleisegave teller to interessenter",
    res.status === 201 && body.reservationCount === 2,
  );

  res = await B("/api/gifts/status");
  body = await res.json();
  check(
    "B (deltaker) ser begge navnene",
    JSON.stringify(body["nintendo-switch-2"].participants) === '["Anna","Ole"]',
  );

  res = await A("/api/gifts/nintendo-switch-2/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "Anna og Per" }),
  });
  body = await res.json();
  check(
    "re-påmelding oppdaterer navnet uten ny rad",
    res.status === 200 &&
      body.reservationCount === 2 &&
      JSON.stringify(body.participants) === '["Anna og Per","Ole"]',
  );

  res = await B("/api/gifts/duplo/reservations/mine", { method: "DELETE" });
  body = await res.json();
  check("B kan ikke slette A sin reservasjon", body.reservationCount === 1);

  res = await A("/api/gifts/duplo/reservations/mine", { method: "DELETE" });
  body = await res.json();
  check("A angrer egen reservasjon", body.reservationCount === 0);

  console.log("Admin-nullstilling:");
  res = await ADMIN("/api/admin/gifts/nintendo-switch-2/reservations", {
    method: "DELETE",
  });
  body = await res.json();
  check("admin nullstiller spleisegaven", res.status === 200 && body.deleted === 2);

  res = await B("/api/gifts/status");
  body = await res.json();
  check("gaven er ledig igjen", body["nintendo-switch-2"].reservationCount === 0);

  res = await B("/api/admin/gifts/duplo/reservations", { method: "DELETE" });
  check("gjestesesjon får 401 på admin-API", res.status === 401, `(${res.status})`);

  console.log("Utlogging:");
  res = await A("/api/logout", { method: "POST" });
  check("logout gir 204", res.status === 204, `(${res.status})`);
  res = await A("/onskeliste");
  check("sesjonen er borte etterpå", res.status === 302, `(${res.status})`);
}

// Hele kjøringen får maks 3 minutter – uten TTY (CI) kan prosesser
// ellers bli hengende og blokkere jobben til runnerens timeout.
const watchdog = setTimeout(() => {
  console.error("Tidsavbrudd: integrasjonstestene ble ikke ferdige på 3 minutter");
  process.exit(1);
}, 180_000);
watchdog.unref();

console.log(`Starter dev-server på port ${PORT} ...`);
// spawn i stedet for execSync: `astro dev` daemoniserer seg bare når
// den har en TTY, så i CI ville execSync ventet for alltid. Med spawn
// fungerer begge tilfeller – enten avslutter CLI-en selv (daemon),
// eller så eier vi serverprosessen og dreper den i finally.
const server = spawn("npx", ["astro", "dev", "--port", String(PORT)], {
  stdio: "ignore",
});

try {
  // Vent til serveren svarer
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    try {
      await fetch(BASE);
      ready = true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!ready) throw new Error("Dev-serveren ble ikke klar");

  await run();
} finally {
  try {
    execSync("npx astro dev stop", { stdio: "ignore", timeout: 15_000 });
  } catch {
    // daemonen fantes ikke – serveren kjører som vårt eget barn
  }
  server.kill("SIGTERM");
}

if (failures > 0) {
  console.error(`\n${failures} sjekk(er) feilet`);
  process.exit(1);
}
console.log("\nAlle integrasjonstester besto");
process.exit(0);
