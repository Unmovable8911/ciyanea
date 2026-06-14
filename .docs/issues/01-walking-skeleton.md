# Walking skeleton + rendered-HTML test harness

## What to build

The walking skeleton for the Ciyanea theme: the smallest end-to-end path that proves the
multi-language routing spine, the base layout, the visual system, and the test seam all work
together. After this slice, every supported language has a working homepage URL that returns a
dark-themed shell with a basic list of that language's articles, and there is a test harness that
asserts on the rendered HTML of the running Ghost instance.

**Partition code convention:** each language is identified by a single short **code** that is the
country/flag code, stored as the language internal tag's slug (`hash-<code>`). This one code drives
the content filter, the URL prefix, and the flag image. The 7 codes are `cn, us, de, fr, ru, it, es`
(Chinese → `#cn`/`hash-cn` → `/cn/`; English → `#us`/`hash-us` → `/us/`; the rest unchanged). The
theme never hard-codes this list — it derives codes from the tag slugs (strip the `hash-` prefix).

Scope:

- Rewrite `routes.yaml` from the stock single-collection file to the URL-prefixed multi-language
  form: one `index` collection per language at `/<code>/` for all 7 codes, each with
  `filter: "tag:hash-<code>+tag:-hash-micro"`, `permalink: /<code>/{slug}/`, and
  `data: tag.hash-<code>` so the language's internal tag is bound into the template. Keep the
  `tag`/`author` taxonomies. (The `/` root route and `/<code>/micro/` collections are added in
  later slices.)
- `package.json` with valid Ghost theme metadata and a `config.custom` entry declaring
  `content_api_key` (consumed later via `{{@custom.content_api_key}}`).
- `default.hbs` base layout: `<head>` with Google Fonts (Playfair Display + Inter), `screen.css`,
  and the standard Ghost head/foot helpers; a header with logo/nav placeholder; a footer.
- `screen.css` establishing the dark design tokens as CSS custom properties
  (`--color-bg`, `--color-bg-card`, `--color-text`, `--color-text-muted`, `--color-accent`,
  `--color-border`), base typography, and the responsive two-column → single-column scaffold at the
  defined breakpoints.
- `index.hbs` rendering a basic list of the bound language's posts (full card fidelity comes in
  slice 2).
- `locales/en.json` scaffold and Ghost `{{t}}` wired in `default.hbs` for at least one chrome string.
- The first rendered-HTML test harness: dependency-light (HTTP fetch + an HTML/DOM assertion helper)
  pointed at `http://localhost:53368`, with the first routing/shell tests.

## Acceptance criteria

- [ ] `routes.yaml` defines a `/<code>/` index collection for all 7 codes (`cn, us, de, fr, ru, it,
      es`) with the correct internal-tag filter, permalink, and `data: tag.hash-<code>` binding.
- [ ] Each `/<code>/` URL returns HTTP 200 and renders the dark-themed base shell (header + footer).
- [ ] The homepage response lists posts belonging to that language and excludes micro-posts.
- [ ] The page `<head>` loads Playfair Display and Inter and applies the documented color custom
      properties.
- [ ] `package.json` is a valid Ghost theme manifest and declares `content_api_key` under
      `config.custom`.
- [ ] A rendered-HTML test harness exists, runs against `http://localhost:53368`, and contains
      passing tests for: each language prefix resolving, the dark shell being present, and the index
      collection excluding micro-posts.

## Blocked by

None - can start immediately.
