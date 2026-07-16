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
    description:
      "En fellesgave barna og familien kan ha glede av i mange år. 7,9\" FHD-skjerm med HDR10 og VRR (opptil 120 bilder/sek), og opptil 4K når den er koblet til TV.",
    tags: ["Jonas", "Sofie", "Fellesgave", "Spleisegave"],
    priceLabel: "Ca. 6 090 kr – stor spleisegave",
    priority: "high",
    mode: "group",
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
    id: "hobby-og-tegnesaker",
    title: "Hobby- og tegnesaker",
    description: "Tusjer, fargeblyanter, klistremerker og annet kreativt.",
    tags: ["Sofie", "Kreativt"],
    priceLabel: "Under 500 kr",
    mode: "single",
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
];

export function getGiftById(id: string): Gift | undefined {
  return gifts.find((gift) => gift.id === id);
}
