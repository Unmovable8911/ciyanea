## What to build

Fill the header's navigation region with two **built-in, language-aware** items rendered by the theme itself: **Home** (resolves to `/<code>/`) and **Micro** (resolves to `/<code>/micro/`), where `<code>` is the active language. A dedicated navigation partial holds these items and is included by the main layout in place of the current empty `<nav>` placeholder.

The links reuse the existing `data-lang-href` client-side rewrite already implemented in `lang-switcher.js` (`data-lang-href="…"` → `/<active>/…`). No new prefixing mechanism is introduced:
- Home carries an empty relative `data-lang-href` value so it resolves to the bare language root `/<code>/`.
- Micro carries `data-lang-href="micro/"` so it resolves to `/<code>/micro/`.

Because the rewrite only fires once an active language code is known, each built-in item carries a sensible **static `href` fallback** (Home → site root `/`) for the pre-rewrite state and for the root redirect shell, so the visitor is never given a broken link before a language is determined.

The built-in labels are **localized** via `{{t}}`: add the "Home" key (and reuse/confirm the existing "Micro" key) across all seven locale files (en, zh, de, fr, ru, it, es), following the existing `{{t "Main navigation"}}` usage. Navigation links show a clear hover state matching the theme's green accent.

Factor the prefixed-href logic as a pure function — given a `data-lang-href` value and an active language code, return the resolved path — importable and testable without a DOM, mirroring how the existing client logic parses the URL. (The active-language-code derivation already exists in `lang-switcher.js`; expose/reuse it for testing.)

## Acceptance criteria

- [ ] The header shows Home and Micro items immediately to the right of the logo.
- [ ] On a `/us/…` page the Home link resolves to `/us/` and Micro to `/us/micro/`; on a `/cn/…` page they resolve to `/cn/` and `/cn/micro/` — verified by E2E across at least two language collections.
- [ ] After switching language, the Home and Micro links point at the new language's pages.
- [ ] Built-in labels render in the page's current language (e.g. "Startseite"/localized form on the German site) via `{{t}}`; the "Home" key exists in all seven locale files.
- [ ] On the root path `/` (redirect shell) the Home link still resolves to a sensible destination (site root) and is not broken.
- [ ] Navigation links show a green-accent hover state.
- [ ] A `node --test` unit test covers the pure function that builds a language-prefixed href from a `data-lang-href` value + active code (including the empty-value → bare root case).

## Blocked by

- Slice 1 (Header two-group layout + sticky).
