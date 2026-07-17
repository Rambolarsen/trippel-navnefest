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

export const CHILDREN = ["Edvin", "Jonas", "Sofie"] as const;

// Startutvalget fra MVP.md §20. Gavene administreres i denne filen
// i første versjon – ingen admin-redigering (MVP.md §3).
export const gifts: Gift[] = [
  {
    id: "nintendo-switch-2",
    title: "Nintendo Switch 2",
    description: "Med eller uten spill",
    tags: ["Jonas", "Sofie", "Fellesgave", "Spleisegave"],
    priceLabel: "6 090 kr – stor spleisegave",
    priority: "high",
    mode: "group",
    image: "/images/nintendo-switch-2.webp",
    link: "https://www.power.no/gaming/nintendo/nintendo-konsoll/nintendo-switch-2-spillkonsoll/p-4089807/",
  },
  {
    id: "duplo",
    title: "Duplo",
    description: "Store byggeklosser som tåler små hender.",
    tags: ["Edvin", "Leker"],
    priceLabel: "300–700 kr",
    mode: "single",
  },
  {
    id: "balansesykkel",
    title: "Balansesykkel med fire hjul",
    description: "Trygg førstesykkel for den minste.",
    tags: ["Edvin", "Utelek"],
    priceLabel: "500–1000 kr",
    mode: "single",
  },
  {
    id: "boker-for-sma-barn",
    title: "Bøker for små barn",
    description: "Pekebøker og tykke pappbøker er alltid populært.",
    tags: ["Edvin", "Bøker"],
    priceLabel: "Under 300 kr",
    mode: "single",
  },
  {
    id: "kid-pop-up-benk",
    title: "KID Pop-Up Benk",
    description:
      "Aktivitetsleke der dyr spretter opp når man trykker på knappene. Fra 12 måneder.",
    tags: ["Edvin", "Leker"],
    priceLabel: "Ca. 300 kr",
    mode: "single",
    image: "/images/kid-pop-up-benk.jpg",
    link: "https://www.lekia.no/leketoy/babyleker/aktivitetsleker/barne-pengeboks-med-oppbevaring",
  },
  {
    id: "brio-trekkleke-elg",
    title: "BRIO Trekkleke Elg",
    description:
      "Trekkdyr i tre med svaierende horn som oppmuntrer til bevegelse. Fra 12 måneder.",
    tags: ["Edvin", "Leker"],
    priceLabel: "Ca. 400 kr",
    mode: "single",
    image: "/images/brio-trekkleke-elg.jpg",
    link: "https://www.lekia.no/brio-elg-trekkeleke",
  },
  {
    id: "trepuslespill-klokke",
    title: "Trepuslespill med klokke",
    description:
      "Trepuslespill med 12 fargerike brikker og bevegelige visere. Fra 12 måneder.",
    tags: ["Edvin", "Leker"],
    priceLabel: "Ca. 130 kr",
    mode: "single",
    image: "/images/trepuslespill-klokke.jpg",
    link: "https://www.extra-leker.no/trepuslespill-12-brikker-klokke",
  },
  {
    id: "smartrike-mini-ride-bla",
    title: "SmarTrike 3-i-1 Xtend Mini-Ride, blå",
    description:
      "Sitte-leke som kan bygges om til sparkesykkel og vokser med barnet. Fra 12 måneder.",
    tags: ["Edvin", "Utelek"],
    priceLabel: "Ca. 1 300 kr",
    mode: "single",
    image: "/images/smartrike-mini-ride-bla.png",
    link: "https://www.extra-leker.no/smartrike-sparkesykkel-3-i-1-xtend-mini-ride-bla",
  },
  {
    id: "lego-4-pluss",
    title: "Lego 4+",
    description: "Lego-sett tilpasset de yngste byggerne.",
    tags: ["Jonas", "Lego"],
    priceLabel: "300–700 kr",
    mode: "single",
  },
  {
    id: "magnetiske-byggeklosser",
    title: "Magnetiske byggeklosser",
    description: "Byggeklosser med magneter som gir uendelige muligheter.",
    tags: ["Jonas", "Byggeleker"],
    priceLabel: "500–1000 kr",
    mode: "single",
  },
  {
    id: "brettspill-for-barn",
    title: "Brettspill for barn",
    description: "Enkle brettspill hele familien kan spille sammen.",
    tags: ["Jonas", "Spill"],
    priceLabel: "Under 500 kr",
    mode: "single",
  },
  {
    id: "lego-minecraft-birokterens-hytte",
    title: "LEGO Minecraft – Birøkterens hytte",
    description:
      "Sett 21241 med bihus, avlinger og zombiekamp. 254 deler.",
    tags: ["Jonas", "Lego", "Minecraft"],
    priceLabel: "Ca. 250–300 kr",
    mode: "single",
    image: "/images/lego-minecraft-birokterens-hytte.jpg",
    link: "https://www.lego.com/nb-no/product/the-bee-cottage-21241",
  },
  {
    id: "lego-minecraft-ulveborgen",
    title: "LEGO Minecraft – Ulveborgen",
    description:
      "Sett 21261 med ulveborg, håndverksstasjoner og figurer som ulvetemmer og skjelett.",
    tags: ["Jonas", "Lego", "Minecraft"],
    priceLabel: "Ca. 400–480 kr",
    mode: "single",
    image: "/images/lego-minecraft-ulveborgen.jpg",
    link: "https://www.lego.com/nb-no/product/the-wolf-stronghold-21261",
  },
  {
    id: "lego-minecraft-enderdrage",
    title: "LEGO Minecraft – Enderdrage og End Ship",
    description:
      "Sett 21264 med enderdrage og endeskip – det største og mest avanserte av settene, for en erfaren bygger.",
    tags: ["Jonas", "Lego", "Minecraft"],
    priceLabel: "Ca. 800–980 kr",
    mode: "single",
    image: "/images/lego-minecraft-enderdrage.jpg",
    link: "https://www.lego.com/nb-no/product/the-ender-dragon-and-end-ship-21264",
  },
  {
    id: "hotwheels-track-creator",
    title: "Hot Wheels Track Creator Bil & banepakke",
    description:
      "Enkel startpakke med én bil og ca. 3 meter bane som kan bygges og formes selv.",
    tags: ["Jonas", "Hot Wheels", "Bilbane"],
    priceLabel: "Ca. 260–300 kr",
    mode: "single",
    link: "https://www.prisjakt.no/product.php?p=15657260",
  },
  {
    id: "hotwheels-f1-sprint-race-circuit",
    title: "Hot Wheels Bilbane – Racing Formula 1 Sprint Race Circuit",
    description:
      "F1-tema bane med launcher og tre Formel 1-biler i skala 1:64.",
    tags: ["Jonas", "Hot Wheels", "Bilbane"],
    priceLabel: "Ca. 580 kr",
    mode: "single",
    image: "/images/hotwheels-f1-sprint-race-circuit.jpg",
    link: "https://www.extra-leker.no/leker/lekebiler-og-kjoretoy/bilbaner/hot-wheels-bilbane-racing-formula-1-sprint-race-circuit",
  },
  {
    id: "hotwheels-ultimate-garage",
    title: "Hot Wheels Ultimate Garage",
    description:
      "Stor garasje og bilbane med plass til over 100 biler, lyd- og lyseffekter.",
    tags: ["Jonas", "Hot Wheels", "Bilbane"],
    priceLabel: "Ca. 2 299 kr",
    mode: "single",
    link: "https://www.avxperten.no/legetoejsbiler-og-bilbaner/hot-wheels-ultimate-garage-5aar.asp",
  },
  {
    id: "panduro-hobbysett-refill-basic",
    title: "Panduro Startsett for hobbyaktiviteter",
    description:
      "Pastellfarget startsett med piperensere, pomponger, bevegelige øyne, maling, glitterlim, paljetter og perler.",
    tags: ["Sofie", "Kreativt"],
    priceLabel: "Ca. 200 kr",
    mode: "single",
    link: "https://panduro.com/nb-no/products/barn-junior/diy-kit/hobbybokser/startsett-for-hobbyaktiviteter-pastellfargede-hobbytilbehor-for-morsom-kreativitet%21-807254",
    image: "/images/panduro-startsett-hobbyaktiviteter.webp",
  },
  {
    id: "panduro-tusjer-magic",
    title: "Panduro Tusjer Magic, 10 stk",
    description:
      "Magiske tusjer som bytter farge når man tegner over med den hvite pennen.",
    tags: ["Sofie", "Kreativt"],
    priceLabel: "Ca. 90 kr",
    mode: "single",
    link: "https://panduro.com/nb-no/products/barn-junior/mal-tegn/barneblyanter/tusjer-panduro-magic-10-stk-805004",
    image: "/images/panduro-tusjer-magic.webp",
  },
  {
    id: "panduro-hama-midi-havdyr",
    title: "Panduro Rørperler Midi kit Ocean Life",
    description:
      "2000 Midi-perler, fem havdyr-perleplater, strykepapir og mønster. Fra 5 år.",
    tags: ["Sofie", "Kreativt"],
    priceLabel: "Ca. 150 kr",
    mode: "single",
    link: "https://panduro.com/nb-no/products/barn-junior/roerperler/roerperler-midi/rorperler-midi-kit-dypt-under-havoverflaten-2000-perler-med-diameter-5-mm-og-5-perleplater-807222",
    image: "/images/panduro-rorperler-havdyr.webp",
  },
  {
    id: "lego-sofie",
    title: "Lego",
    description: "Lego-sett for en erfaren bygger på sju år.",
    tags: ["Sofie", "Lego"],
    priceLabel: "300–700 kr",
    mode: "single",
  },
  {
    id: "opplevelse",
    title: "Opplevelse",
    description: "En tur i badeland, kino eller noe annet gøy sammen.",
    tags: ["Sofie", "Opplevelse"],
    priceLabel: "Valgfritt",
    mode: "single",
  },
  {
    id: "kpop-demon-hunters-kostyme-rumi",
    title: "K-pop Demon Hunters™ Rumi-kostyme (selges som «Nova»)",
    description:
      "Kostyme av Rumi fra K-pop Demon Hunters, solgt under navnet «K-pop Star Nova» hos Partyking. Størrelse S.",
    tags: ["Sofie", "Kostyme"],
    priceLabel: "479 kr",
    mode: "single",
    link: "https://www.partyking.no/k-pop-star-nova-kostyme-111976.html",
  },
  {
    id: "kpop-demon-hunters-kostyme-mira",
    title: "K-pop Demon Hunters™ Mira-kostyme (selges som «Hunter»)",
    description:
      "Kostyme av Mira fra K-pop Demon Hunters, solgt under navnet «K-pop Star Hunter» hos Partyking. Størrelse S.",
    tags: ["Sofie", "Kostyme"],
    priceLabel: "479 kr",
    mode: "single",
    link: "https://www.partyking.no/k-pop-star-hunter-kostyme-111970.html",
  },
  {
    id: "kpop-demon-hunters-kostyme-zoey",
    title: "K-pop Demon Hunters™ Zoey-kostyme (selges som «Lotus»)",
    description:
      "Kostyme av Zoey fra K-pop Demon Hunters, solgt under navnet «K-pop Star Lotus» hos Partyking. Størrelse S.",
    tags: ["Sofie", "Kostyme"],
    priceLabel: "479 kr",
    mode: "single",
    link: "https://www.partyking.no/k-pop-star-lotus-kostyme-111966.html",
  },
  {
    id: "liggeunderlag-edvin",
    title: "Liggeunderlag",
    description: "Kayoba skum-liggeunderlag, 200x50x2 cm.",
    tags: ["Edvin", "Friluft"],
    priceLabel: "Ca. 160 kr",
    mode: "single",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/liggeunderlag/liggeunderlag-030842/",
  },
  {
    id: "sovepose-edvin",
    title: "Sovepose / teppepose",
    description:
      "Kayoba teppepose, 190x75 cm. Kan lynes igjen til sovepose eller brukes åpen som teppe.",
    tags: ["Edvin", "Friluft"],
    priceLabel: "Ca. 180 kr",
    mode: "single",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/soveposer/teppepose-008707/",
  },
  {
    id: "liggeunderlag-jonas",
    title: "Liggeunderlag",
    description: "Kayoba skum-liggeunderlag, 200x50x2 cm.",
    tags: ["Jonas", "Friluft"],
    priceLabel: "Ca. 160 kr",
    mode: "single",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/liggeunderlag/liggeunderlag-030842/",
  },
  {
    id: "sovepose-jonas",
    title: "Sovepose / teppepose",
    description:
      "Kayoba teppepose, 190x75 cm. Kan lynes igjen til sovepose eller brukes åpen som teppe.",
    tags: ["Jonas", "Friluft"],
    priceLabel: "Ca. 180 kr",
    mode: "single",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/soveposer/teppepose-008707/",
  },
  {
    id: "liggeunderlag-sofie",
    title: "Liggeunderlag",
    description: "Kayoba skum-liggeunderlag, 200x50x2 cm.",
    tags: ["Sofie", "Friluft"],
    priceLabel: "Ca. 160 kr",
    mode: "single",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/liggeunderlag/liggeunderlag-030842/",
  },
  {
    id: "sovepose-sofie",
    title: "Sovepose / teppepose",
    description:
      "Kayoba teppepose, 190x75 cm. Kan lynes igjen til sovepose eller brukes åpen som teppe.",
    tags: ["Sofie", "Friluft"],
    priceLabel: "Ca. 180 kr",
    mode: "single",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/soveposer/teppepose-008707/",
  },
];

export function getGiftById(id: string): Gift | undefined {
  return gifts.find((gift) => gift.id === id);
}
