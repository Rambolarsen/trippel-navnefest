import { navnefestGifts, type Gift } from "./gifts";
import { julGifts } from "./jul-gifts";

// Ønskeboks kan ha flere ønskelister samtidig, f.eks. navnefest og jul.
// Hver liste har egen passphrase, egne tekster, filtre, tema og gaver.
// Passordet gjesten skriver inn avgjør hvilken liste som åpnes, og en
// gjest som har flere passord kan bytte mellom listene sine.

export const WISHLIST_IDS = ["navnefest", "jul"] as const;
export type WishlistId = (typeof WISHLIST_IDS)[number];

// Navnet på miljøvariabelen som holder listens gjestepassphrase. En
// liste uten satt passphrase kan ikke åpnes med passord.
export type GuestPassphraseSecret = "GUEST_PASSPHRASE" | "GUEST_PASSPHRASE_JUL";

export type WishlistFilter = {
  label: string;
  // Gaven vises når den har denne taggen
  tag: string;
};

export type WishlistTheme = "standard" | "jul";

export type Wishlist = {
  id: WishlistId;
  // Kort navn i listevelgeren og adminsiden
  name: string;
  heading: string;
  pageTitle: string;
  intro: string;
  passphraseSecret: GuestPassphraseSecret;
  theme: WishlistTheme;
  // Filtre mellom «Alle» og «Ledige» (MVP.md §7)
  filters: WishlistFilter[];
  gifts: Gift[];
};

const CHILD_FILTERS: WishlistFilter[] = [
  { label: "Edvin", tag: "Edvin" },
  { label: "Jonas", tag: "Jonas" },
  { label: "Sofie", tag: "Sofie" },
];

export const wishlists: Wishlist[] = [
  {
    id: "navnefest",
    name: "Navnefest",
    heading: "Ønskeliste",
    pageTitle: "Ønskeliste – navnefest for Edvin, Jonas og Sofie",
    intro:
      "Flere har spurt hva barna ønsker seg til navnefesten. Gaver er selvfølgelig ikke nødvendig, men her er noen forslag dersom du ønsker å gi noe.",
    passphraseSecret: "GUEST_PASSPHRASE",
    theme: "standard",
    filters: [
      ...CHILD_FILTERS,
      { label: "Fellesgaver", tag: "Fellesgave" },
      { label: "Spleisegaver", tag: "Spleisegave" },
    ],
    gifts: navnefestGifts,
  },
  {
    id: "jul",
    name: "Jul",
    heading: "Juleønskeliste",
    pageTitle: "Juleønskeliste",
    intro:
      "Her er noen juleønsker fra barna og oss voksne. Gaver er selvfølgelig ikke nødvendig, men listen gjør det enklere å unngå at flere kjøper det samme.",
    passphraseSecret: "GUEST_PASSPHRASE_JUL",
    theme: "jul",
    filters: [
      ...CHILD_FILTERS,
      { label: "Lars-Erik", tag: "Lars-Erik" },
      { label: "Mona", tag: "Mona" },
      { label: "Fellesgaver", tag: "Fellesgave" },
      { label: "Spleisegaver", tag: "Spleisegave" },
    ],
    gifts: julGifts,
  },
];

export function isWishlistId(value: unknown): value is WishlistId {
  return typeof value === "string" && (WISHLIST_IDS as readonly string[]).includes(value);
}

export function getWishlist(id: WishlistId): Wishlist {
  return wishlists.find((list) => list.id === id)!;
}

// Gave-id-er er unike på tvers av listene (sjekkes i testene), så en
// gave peker alltid til nøyaktig én liste.
export function findGift(id: string): { gift: Gift; wishlist: Wishlist } | undefined {
  for (const wishlist of wishlists) {
    const gift = wishlist.gifts.find((candidate) => candidate.id === id);
    if (gift) return { gift, wishlist };
  }
  return undefined;
}

// Høyt prioriterte gaver først (MVP.md §7)
export function sortGifts(gifts: Gift[]): Gift[] {
  return [...gifts].sort(
    (a, b) => (b.priority === "high" ? 1 : 0) - (a.priority === "high" ? 1 : 0),
  );
}
