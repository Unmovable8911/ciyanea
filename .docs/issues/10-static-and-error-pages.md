# Static page + error pages

## What to build

A clean full-width reading layout for static pages, and localized recovery pages for missing URLs
and generic errors.

Scope:

- `page.hbs`: a full-width centered single column with no sidebar, suited to long-form static
  content such as an About page.
- `error-404.hbs`: a minimal centered layout with a localized "page not found" message and a
  return-to-homepage button.
- `error.hbs`: a minimal centered layout with a localized generic error message and a
  return-to-homepage button.
- Styling consistent with the dark visual system; all chrome strings via `{{t}}`.

## Acceptance criteria

- [ ] A static page renders as a full-width centered single column with no sidebar.
- [ ] Requesting a missing URL returns the localized 404 page with a return-to-homepage link.
- [ ] The generic error page renders the localized message with a return-to-homepage link.

## Blocked by

- Slice 1 (Walking skeleton + rendered-HTML test harness)
