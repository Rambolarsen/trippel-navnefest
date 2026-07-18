---
name: add-gifts
description: Add or update gift entries in the Trippel navnefest wishlist. Every new or replaced gift entry must include a local product image. Use when a user asks to add, remove, revise, research, categorize, price, link, or attach an image to a wishlist gift in this repository.
---

# Add Gifts

Edit the static catalog in `src/data/gifts.ts`; do not create database records or admin UI. Preserve the Norwegian wording and the existing order unless the user asks otherwise.

## Workflow

1. Read `src/data/gifts.ts` before editing. For questions about list behavior, reservation modes, filtering, or privacy, read the relevant parts of `MVP.md` first.
2. Confirm who the gift is for before researching or editing: one or more of `Edvin`, `Jonas`, and `Sofie`, or all three as a shared gift. If the recipient is missing or ambiguous, ask a concise question and wait; never infer it.
3. If the gift has a size, age, fit, or compatible model requirement (for example clothing, shoes, helmets, skis, or accessories), confirm the exact size or specification before researching or editing. Ask the user when it is missing; never guess from a child’s age or the existing catalog. Include the confirmed size in the title or description so the buyer can act on it.
4. Convert the requested gift into one `Gift` object and give it a unique, stable lowercase hyphenated `id`. Do not derive an id from the list position.
5. Research requested products on Norwegian websites first. Prefer Norwegian retailers and manufacturers for product links, prices, specifications, and product imagery; only use non-Norwegian sources when a suitable Norwegian source is unavailable. Supply `title`, a concise Norwegian `description`, `tags`, and `mode`. Do not invent a shopping URL, price, or image.
6. Use `mode: "single"` for a gift normally bought by one guest. Use `mode: "group"` only for a spleisegave and include both `"Fellesgave"` and `"Spleisegave"` in its tags. Use `priority: "high"` only when explicitly requested.
7. Tag gifts for the confirmed recipient or recipients using exactly `Edvin`, `Jonas`, and/or `Sofie`. Use `"Fellesgave"` for shared gifts. Add a useful category tag such as `Leker`, `Bøker`, `Lego`, or `Opplevelse` where appropriate. Keep tags compatible with the filters in `src/components/GiftFilters.tsx`.
8. An image is required for every new or replaced gift entry—do not finish the change without one. First use a suitable image supplied by the user; otherwise find a representative product image from the preferred Norwegian source. Confirm that it depicts the requested gift itself—not a related product, accessory, category banner, or a different colour, model, size, or variant. Save it as `public/images/<gift-id>.<ext>` and reference it as `/images/<gift-id>.<ext>`; for example, `lego-sofie.jpg` for `id: "lego-sofie"`. Do not hotlink remote images. If no suitable image can be obtained, continue researching appropriate sources; if it remains unavailable, stop and tell the user rather than adding the gift without an image.
9. Add the source product page as `link` when it is useful and available. Prefer the same Norwegian source used for the image.
10. Check the edited object against the `Gift` type and run `npm run check`. Run `npm test` when the change affects modes, tags, or several entries. Report the entry added or changed, the intended recipient, any confirmed size, the Norwegian source used, and any intentionally omitted optional details.

## Catalog Shape

```ts
{
  id: "lowercase-hyphenated-id",
  title: "Norsk gavetittel",
  description: "Kort norsk beskrivelse.",
  tags: ["Edvin", "Leker"],
  priceLabel: "300–700 kr",
  mode: "single",
  image: "/images/lowercase-hyphenated-id.jpg",
  link: "https://…",
}
```

Do not add fields outside the `Gift` type. Keep the catalog static: reservation state belongs in D1, but gift definitions do not.
