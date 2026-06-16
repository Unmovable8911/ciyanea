## What to build

Add a **search control** to the header's right group, positioned to the left of the language switcher: a magnifying-glass icon button that opens Ghost's built-in **sodo-search** overlay. The button carries the `data-ghost-search` attribute that triggers the overlay; the theme does not build a custom search UI or query the Content API for search. Search results are site-wide and not language-scoped (an accepted limitation).

The button must be reachable by keyboard and labelled for assistive technology. Its accessible label is localized via `{{t}}` — add the search-label key across all seven locale files (en, zh, de, fr, ru, it, es).

Confirm the sodo-search bundle actually loads on the page; if it is not auto-injected, opt in via the supported mechanism so clicking the button opens the overlay.

## Acceptance criteria

- [ ] A search icon button appears in the header's right group, to the left of the language switcher, on every page.
- [ ] The button is keyboard-focusable and carries a localized accessible label (key present in all seven locale files).
- [ ] Clicking the button opens Ghost's search overlay — verified by E2E.
- [ ] The theme does not implement its own search query logic; search is delegated entirely to sodo-search.

## Blocked by

- Slice 1 (Header two-group layout + sticky).
- Slice 2 (Built-in language-aware Home/Micro nav links).
