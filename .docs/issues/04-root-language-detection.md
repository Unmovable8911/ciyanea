# Root language detection & redirect

## What to build

The root path `/` detects the visitor's preferred language and redirects to it with no flash of
content, remembering the choice across visits.

Scope:

- Add the `/` root route to `routes.yaml` rendering the `lang-redirect` template.
- `lang-redirect.hbs`: a no-content shell (no visible body content, no flash) that loads
  `lang-detect.js`. The supported code list is **not** hard-coded — `lang-redirect.hbs` queries the
  language tags from Ghost (the internal tags excluding `#micro`,
  `{{#get "tags" filter="visibility:internal+slug:-hash-micro" fields="slug"}}`) and injects the
  derived codes (slug minus `hash-`) into a JS variable that `lang-detect.js` reads.
- `lang-detect.js`, loaded only by `lang-redirect.hbs`: one-time detection — read
  `localStorage["preferred-lang"]`; if present and in the supported set redirect to `/<code>/`;
  otherwise derive a candidate code from `navigator.language` (consider both the region subtag and
  the primary subtag, e.g. `zh-CN` → `cn`, `en-US` → `us`); if a candidate is in the supported set
  write it to `localStorage` and redirect to `/<code>/`; on no match redirect to the default `/us/`.
- The codes are the country/flag codes that double as URL prefixes (`cn, us, de, fr, ru, it, es`),
  obtained dynamically from Ghost — adding a language never edits `lang-detect.js`.

Per the PRD test seam, the redirect *outcome* is verified manually; the automated test asserts that
`lang-redirect.hbs` renders the no-content shell and includes the detection script tag.

## Acceptance criteria

- [ ] `routes.yaml` maps `/` to the `lang-redirect` template.
- [ ] A request to `/` renders the no-content shell (no article/body content), includes the
      `lang-detect.js` script tag, and injects the Ghost-derived supported code list (no hard-coded
      list in the JS).
- [ ] Detection precedence is `localStorage` → `navigator.language` → `/us/` fallback, redirecting
      to the correct `/<code>/` (verified manually).
- [ ] A first-time visit with an unsupported browser language lands on `/us/` (verified manually).

## Blocked by

- Slice 1 (Walking skeleton + rendered-HTML test harness)
