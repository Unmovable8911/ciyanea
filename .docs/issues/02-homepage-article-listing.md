# Homepage article listing (post-card + grid + pagination)

## What to build

Turn the basic homepage list from the skeleton into the full long-form article browsing experience:
a grid of richly-detailed article cards with working pagination. This delivers the "browse recent
articles" path end to end.

Scope:

- `post-card.hbs` partial rendering, for each post: cover image, the first **public** tag only
  (internal/`hash-*` tags filtered out; the tag row hidden entirely when there is no public tag),
  title, a 4-line clamped excerpt, and an author row with avatar + name, publish date, and reading
  time.
- `index.hbs` renders the cards in a responsive grid, excluding micro-posts (already enforced by the
  collection filter).
- Custom pagination markup built from `{{pagination}}` variables: a `{{page}} / {{pages}}` indicator
  plus older/newer links shown conditionally via `{{#if next}}` / `{{#if prev}}`, with labels routed
  through `{{t}}`.
- CSS for the card grid and pagination consistent with the dark visual system.

## Acceptance criteria

- [ ] The homepage renders article cards exposing title, excerpt, author name, date, and reading
      time elements.
- [ ] A card shows exactly one public tag, and the tag row is absent when the post has no public tag.
- [ ] Micro-posts never appear in the article grid.
- [ ] Pagination renders a `page / pages` indicator and shows older/newer links only when a
      next/previous page exists.
- [ ] Pagination labels are emitted through `{{t}}` (localizable).

## Blocked by

- Slice 1 (Walking skeleton + rendered-HTML test harness)
