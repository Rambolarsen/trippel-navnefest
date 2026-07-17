---
name: fix-gifts
description: Resolve missing or incorrect information in existing Trippel navnefest wishlist gifts. Use when a user asks to fix, complete, enrich, or add missing recipient, size, product source, link, or image details to catalog entries.
---

# Fix Gifts

Fix entries in the static catalog at `src/data/gifts.ts`. Use `verify-gifts` findings when available; otherwise inspect the catalog and identify the missing information first.

## Workflow

1. Read `src/data/gifts.ts`, `src/components/GiftFilters.tsx`, and the relevant parts of `MVP.md`. Identify the exact gift ids to change and preserve unrelated catalog entries.
2. Confirm every gift’s recipient before editing. Use one or more of `Edvin`, `Jonas`, and `Sofie`; use `"Fellesgave"` only for a shared gift. If the recipient is missing or ambiguous, ask the user and wait. Never infer it.
3. For a gift that needs a size, age, fit, or compatible model (such as clothing, shoes, helmets, skis, or accessories), ask for the exact requirement when it is absent. Never infer it from age or another gift. Put the confirmed detail in the title or description.
4. When a gift is too broad to identify a single product, ask the user to select a product, brand, model, or acceptable alternative before adding a link or image. Do not choose one merely because it fits the price range.
5. Research selected products on Norwegian retailers and manufacturer websites first. Use a non-Norwegian source only when no suitable Norwegian source exists. Add a useful verified product page as `link`; do not invent a URL, price, product detail, or availability.
6. Always try to add a local image for each fixed gift. Use a user-supplied image first; otherwise use an image that clearly depicts the selected gift itself—not a related product, accessory, category banner, or a different colour, model, size, or variant. Save it as `public/images/<gift-id>.<ext>` and set `image` to `/images/<gift-id>.<ext>`. Do not hotlink remote images.
7. Preserve catalog rules: `"group"` gifts require both `"Fellesgave"` and `"Spleisegave"`; normal gifts use `"single"`. Keep ids lowercase, hyphenated, unique, and stable. Do not add fields outside the `Gift` type.
8. Re-run the relevant `verify-gifts` checks after editing, then run `npm run check`. Run `npm test` when changing modes, tags, or multiple gifts. Report the changed ids, confirmed recipients and sizes, Norwegian sources, image filenames, and remaining unanswered questions.

## Guardrails

Do not create database records, modify reservations, or add admin editing UI. Do not change a gift’s intended recipient, size, product, price, or image without verified information or the user’s explicit decision.
