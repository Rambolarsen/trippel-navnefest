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
    priceLabel: "Fra 5 590 kr – stor spleisegave",
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
    id: "ravensburger-junior-labyrint",
    title: "Ravensburger Junior Labyrint",
    description:
      "Et enkelt labyrintspill for 2–4 spillere, fra 4 år. Spillet varer ca. 15–20 minutter.",
    tags: ["Jonas", "Spill"],
    priceLabel: "Fra 229 kr",
    mode: "single",
    image: "/images/ravensburger-junior-labyrint.jpg",
    link: "https://godpris.no/produkt/1993832",
  },
  {
    id: "lego-minecraft-birokterens-hytte",
    title: "LEGO Minecraft – Birøkterens hytte",
    description:
      "Sett 21241 med bihus, avlinger og zombiekamp. 254 deler.",
    tags: ["Jonas", "Lego", "Minecraft"],
    priceLabel: "280 kr",
    mode: "single",
    image: "/images/lego-minecraft-birokterens-hytte.jpg",
    link: "https://www.norli.no/leker/lego/lego-minecraft/lego-birokterens-hytte-21241",
  },
  {
    id: "lego-minecraft-ulveborgen",
    title: "LEGO Minecraft – Ulveborgen",
    description:
      "Sett 21261 med ulveborg, håndverksstasjoner og figurer som ulvetemmer og skjelett.",
    tags: ["Jonas", "Lego", "Minecraft"],
    priceLabel: "480 kr",
    mode: "single",
    image: "/images/lego-minecraft-ulveborgen.jpg",
    link: "https://www.norli.no/leker/lego/lego-minecraft/lego-ulveborgen-21261",
  },
  {
    id: "lego-minecraft-enderdragen",
    title: "LEGO Minecraft – Enderdragen",
    description:
      "Sett 21595 med bevegelig Enderdrage og vingemekanisme. 710 deler, fra 10 år.",
    tags: ["Jonas", "Lego", "Minecraft"],
    priceLabel: "849,90 kr",
    mode: "single",
    image: "/images/lego-minecraft-enderdrage.jpg",
    link: "https://www.lego.com/nb-no/product/the-ender-dragon-21595",
  },
  {
    id: "hotwheels-track-creator",
    title: "Hot Wheels Track Creator Bil & banepakke",
    description:
      "Enkel startpakke med én bil og ca. 3 meter bane som kan bygges og formes selv.",
    tags: ["Jonas", "Hot Wheels", "Bilbane"],
    priceLabel: "Fra 190 kr",
    mode: "single",
    image: "/images/hotwheels-track-creator.jpg",
    link: "https://www.prisjakt.no/product.php?p=15657260",
  },
  {
    id: "hotwheels-f1-sprint-race-circuit",
    title: "Hot Wheels Bilbane – Racing Formula 1 Sprint Race Circuit",
    description:
      "F1-tema bane med launcher og tre Formel 1-biler i skala 1:64.",
    tags: ["Jonas", "Hot Wheels", "Bilbane"],
    priceLabel: "799 kr",
    mode: "single",
    image: "/images/hotwheels-f1-sprint-race-circuit.jpg",
    link: "https://www.extra-leker.no/leker/lekebiler-og-kjoretoy/bilbaner/hot-wheels-bilbane-racing-formula-1-sprint-race-circuit",
  },
  {
    id: "hotwheels-transforming-stunt-garage",
    title: "Hot Wheels City Transforming Stunt Garage",
    description:
      "2-i-1 garasje og stuntbane med hopp, én bil inkludert og plass til over 15 biler.",
    tags: ["Jonas", "Hot Wheels", "Bilbane"],
    priceLabel: "459 kr",
    mode: "single",
    image: "/images/hotwheels-transforming-stunt-garage.jpg",
    link: "https://www.jollyroom.no/leker/lekebiler-kjoretoy/bilbaner/hot-wheels-city-bilbane-transforming-stunt-garage",
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
    id: "kinoopplevelse-sofie",
    title: "Kinoopplevelse",
    description: "Billetter eller gavekort til en kinotur sammen med familien.",
    tags: ["Sofie", "Opplevelse"],
    priceLabel: "Valgfritt",
    mode: "single",
    image: "/images/kinoopplevelse-sofie.png",
  },
  {
    id: "badelandopplevelse-sofie",
    title: "Badeland-opplevelse",
    description: "Billetter eller gavekort til en dag i badeland sammen med familien.",
    tags: ["Sofie", "Opplevelse"],
    priceLabel: "Valgfritt",
    mode: "single",
    image: "/images/badelandopplevelse-sofie.png",
  },
  {
    id: "klatreparkopplevelse-sofie",
    title: "Klatrepark-opplevelse",
    description:
      "Billetter eller gavekort til en dag med klatring og aktivitet sammen med familien.",
    tags: ["Sofie", "Opplevelse"],
    priceLabel: "Valgfritt",
    mode: "single",
    image: "/images/klatreparkopplevelse-sofie.png",
  },
  {
    id: "kpop-demon-hunters-kostyme-rumi",
    title: "K-pop Demon Hunters™ Rumi barnkostyme",
    description:
      "Offisielt lisensiert barnkostyme med jakke, shorts og benvarmere. Størrelse S.",
    tags: ["Sofie", "Kostyme"],
    priceLabel: "599,90 kr",
    mode: "single",
    image: "/images/kpop-demon-hunters-rumi.jpg",
    link: "https://www.partyking.no/k-pop-demon-hunterstm-rumi-barn-kostyme-112695.html",
  },
  {
    id: "kpop-demon-hunters-kostyme-mira",
    title: "K-pop Demon Hunters™ Mira barnkostyme",
    description:
      "Offisielt lisensiert barnkostyme. Størrelse S.",
    tags: ["Sofie", "Kostyme"],
    priceLabel: "599,90 kr",
    mode: "single",
    image: "/images/kpop-demon-hunters-mira.jpg",
    link: "https://www.partyking.no/k-pop-demon-hunterstm-mira-barn-kostyme-112692.html",
  },
  {
    id: "kpop-demon-hunters-kostyme-zoey",
    title: "K-pop Demon Hunters™ Zoey barnkostyme",
    description:
      "Offisielt lisensiert barnkostyme. Størrelse S.",
    tags: ["Sofie", "Kostyme"],
    priceLabel: "599,90 kr",
    mode: "single",
    image: "/images/kpop-demon-hunters-zoey.jpg",
    link: "https://www.partyking.no/k-pop-demon-hunterstm-zoey-barn-kostyme-112699.html",
  },
  {
    id: "liggeunderlag-edvin",
    title: "Liggeunderlag",
    description: "Kayoba skum-liggeunderlag, 200x50x2 cm.",
    tags: ["Edvin", "Friluft"],
    priceLabel: "199 kr",
    mode: "single",
    image: "/images/kayoba-liggeunderlag.jpg",
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
    image: "/images/kayoba-teppepose.jpg",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/soveposer/teppepose-008707/",
  },
  {
    id: "liggeunderlag-jonas",
    title: "Liggeunderlag",
    description: "Kayoba skum-liggeunderlag, 200x50x2 cm.",
    tags: ["Jonas", "Friluft"],
    priceLabel: "199 kr",
    mode: "single",
    image: "/images/kayoba-liggeunderlag.jpg",
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
    image: "/images/kayoba-teppepose.jpg",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/soveposer/teppepose-008707/",
  },
  {
    id: "liggeunderlag-sofie",
    title: "Liggeunderlag",
    description: "Kayoba skum-liggeunderlag, 200x50x2 cm.",
    tags: ["Sofie", "Friluft"],
    priceLabel: "199 kr",
    mode: "single",
    image: "/images/kayoba-liggeunderlag.jpg",
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
    image: "/images/kayoba-teppepose.jpg",
    link: "https://www.jula.no/catalog/fritid/friluftsliv-og-camping/telting/soveposer/teppepose-008707/",
  },
];

export function getGiftById(id: string): Gift | undefined {
  return gifts.find((gift) => gift.id === id);
}
