# Language switcher (data-driven)

## What to build

An always-visible language control in the far right of the header on every page, sourced live from
the language internal tags so that adding a language never requires theme edits.

The language set is read live from Ghost — no hard-coded code list, no uploaded flag images. Each
language internal tag's slug (`hash-<code>`) yields the code; the flag is the constructed URL
`https://flagcdn.io/flags/1x1/<code>.svg`; the native name is the tag's `description`.

Scope:

- `language-switcher.hbs` partial that queries the language tags dynamically. Language tags are the
  internal tags excluding `#micro` — i.e. `{{#get "tags" filter="visibility:internal+slug:-hash-micro"
  fields="slug,description"}}`. For each tag, derive `<code>` by stripping the `hash-` prefix from
  the slug, render the flag as `<img src="https://flagcdn.io/flags/1x1/<code>.svg">`, and show the
  native name (`description`). The collapsed control shows the current language's flag. Adding a
  language requires no theme edit — only a new `#<code>` internal tag (+ `routes.yaml` pair + locale).
- `lang-switcher.js`, loaded globally from `default.hbs`: opens/closes the dropdown; derives the
  current code from the URL prefix (`/cn/...` → `cn`); on a non-prefixed page falls back to
  `localStorage["preferred-lang"]`, highlighting nothing when there is no stored preference; rewrites
  language-relative links declared as `data-lang-href="micro/"` into `/<code>/micro/`; on selection
  writes `localStorage["preferred-lang"]` and redirects to `/<code>/`.
- Header/dropdown styling in the dark visual system.

External prerequisite: the language internal tags exist in Ghost admin, each named by its
country/flag code (e.g. `#cn`, `#us`) with the native name set as `description`. The user guarantees
the code is a valid flagcdn country code. No `feature_image` upload is needed.

## Acceptance criteria

- [ ] The header renders a language switcher on every page.
- [ ] The expanded switcher renders one option per language tag (7 with current data), each with a
      `flagcdn.io/flags/1x1/<code>.svg` flag image and native-name text, sourced live from Ghost.
- [ ] The switcher contains no hard-coded language-code list and references no uploaded tag image.
- [ ] The collapsed control reflects the current language (URL prefix; or stored preference on
      non-prefixed pages; nothing highlighted when neither is available).
- [ ] Selecting a language writes `localStorage["preferred-lang"]` and navigates to that language's
      `/<code>/` homepage (verified manually per PRD).

## Blocked by

- Slice 1 (Walking skeleton + rendered-HTML test harness)
