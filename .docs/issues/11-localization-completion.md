# Localization completion (7 locales)

## What to build

Complete the UI-chrome localization across all seven languages so the interface matches the content
language everywhere.

Scope:

- Provide `locales/<lang>.json` for all 7 languages (`zh, en, de, fr, ru, it, es`), covering every
  `{{t}}` key introduced by the templates: navigation labels, "view all micro-posts", "reading
  time", "Table of Contents", "Related posts", "Author", pagination text, "Page not found",
  "Something went wrong", "Return to homepage", and any others added along the way.
- Audit the templates/partials to ensure all visible chrome strings go through `{{t}}` (no
  hard-coded English).

Note: Ghost `{{t}}` i18n is site-wide; this slice localizes UI chrome only. Multilingual *content*
is driven by routes + internal tags, not by `{{t}}`.

Note: locale files are named by Ghost's **language** locale code (`zh, en, de, fr, ru, it, es`),
which is distinct from the **route/flag code** stored on the partition tag (`cn, us, de, fr, ru, it,
es`). They differ only for Chinese (`zh` ↔ `cn`) and English (`en` ↔ `us`).

## Acceptance criteria

- [ ] A `locales/<lang>.json` exists for all 7 languages and includes every `{{t}}` key used by the
      theme.
- [ ] No visible UI chrome string is hard-coded outside `{{t}}`.
- [ ] Spot-checking at least two non-English languages shows translated chrome in the rendered HTML.

## Blocked by

- Slices 2, 3, 4, 5, 6, 7, 8, 9, 10 (every slice that introduces `{{t}}` chrome strings)
