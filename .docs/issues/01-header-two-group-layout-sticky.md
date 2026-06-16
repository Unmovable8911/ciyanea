## What to build

Restructure the site header into two horizontal groups that read like the reference design: a **left group** holding the logo and the navigation region, and a **right group** holding the search affordance and the language switcher. This replaces today's three-item `space-between` arrangement (logo / empty nav / switcher). The language switcher stays rightmost.

The navigation region and the search affordance are placeholders in this slice — they are filled by later slices. The point of this slice is the structural skeleton and the sticky behavior, so the header looks like the reference shape and stays usable while scrolling.

Make the header **sticky**: it remains pinned to the top of the viewport as the visitor scrolls any page. Use CSS sticky positioning consistent with the existing stylesheet (existing breakpoints are 1024px and 768px).

The existing localized `aria-label` ("Main navigation") on the nav region is preserved.

## Acceptance criteria

- [ ] The header inner is arranged as two groups: logo + nav on the left, search + language switcher on the right.
- [ ] The language switcher remains the rightmost element and continues to work exactly as before.
- [ ] The header stays pinned to the top of the viewport after the page is scrolled.
- [ ] An E2E test confirms the header is still visible (pinned) after scrolling down a language collection page.
- [ ] No regression: existing pages render without layout errors at desktop, 1024px, and 768px widths.

## Blocked by

- None - can start immediately.
