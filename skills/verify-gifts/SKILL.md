---
name: verify-gifts
description: Audit existing gift entries in the Trippel navnefest wishlist against recipient, sizing, Norwegian-source, link, image, tagging, and reservation-mode rules. Use when a user asks to check, review, validate, or find issues in already-created gifts.
---

# Verify Gifts

Audit the static catalog in `src/data/gifts.ts`. Do not edit gifts during an audit unless the user explicitly asks for fixes.

## Workflow

1. Read `src/data/gifts.ts`, the `Gift` type, and `src/components/GiftFilters.tsx`. Read the relevant parts of `MVP.md` when checking tags, gift modes, or reservation behavior.
2. Check every gift has a clear recipient: at least one of `Edvin`, `Jonas`, and `Sofie` in `tags`. Require `"Fellesgave"` for a shared gift. Flag gifts whose recipient is missing, unclear, or inconsistent with the title or description.
3. Identify gifts likely to require a size, age, fit, or compatible model (such as clothing, shoes, helmets, skis, or accessories). Require the exact size or specification in the title or description. Flag a missing or vague requirement as needing user confirmation; never infer it from a child’s age or the catalog.
4. Check each `id` is unique, lowercase, and hyphenated. Check all required `Gift` fields are populated, descriptions are concise Norwegian, and tags match the available filters.
5. Check reservation semantics: `"group"` gifts must include both `"Fellesgave"` and `"Spleisegave"`; do not flag normal `"single"` gifts merely because they lack those tags. Treat `priority: "high"` as intentional only when there is supporting context.
6. For every `link`, verify the source is reachable and is Norwegian when a suitable Norwegian retailer or manufacturer exists. Prefer Norwegian sources for prices, specifications, and imagery; flag a non-Norwegian source only when no suitable Norwegian alternative is evident.
7. Require every gift to have a local image at `public/images/<gift-id>.<ext>` and an `image` value that matches it. Flag missing image fields, missing files, remote-image URLs, and filenames that do not use the gift id. Check that the image depicts the requested gift itself—not a related product, accessory, category banner, or a different colour, model, size, or variant. When research is needed, try a Norwegian source first and report the best candidate image and product page without downloading or editing it.
8. Report results grouped as `Pass`, `Needs clarification`, and `Needs correction`. For each issue, include the gift id, the rule, and a concrete recommended fix. State explicitly when no changes were made.
9. Run `npm run check` after any fix. For a report-only audit, run it only if the user asks to validate the repository as well.

## Guardrails

Keep gift definitions in `src/data/gifts.ts`; do not create database records or an admin editing flow. Do not guess a recipient, size, product URL, price, or image. Do not hotlink images.
