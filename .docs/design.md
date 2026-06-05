# Ghost Theme: Multi-language + Micro-posts Design

**Date:** 2026-06-05
**Ghost version:** 6.43.1
**Design reference:** https://enova.labs.enova.studio/
**Design fidelity:** Style reference (similar color palette, typography, and layout approach), not a pixel-perfect clone. The reference site is itself a Ghost theme, so all visual effects are achievable within Ghost templates.

---

## 1. Supported Languages

| Language | Internal Tag | URL Prefix |
|----------|-------------|------------|
| Chinese  | `#zh`       | `/zh/`     |
| English  | `#en`       | `/en/`     |
| German   | `#de`       | `/de/`     |
| French   | `#fr`       | `/fr/`     |
| Russian  | `#ru`       | `/ru/`     |
| Italian  | `#it`       | `/it/`     |
| Spanish  | `#es`       | `/es/`     |

All languages have a URL prefix; there is no unprefixed default language. Adding a new language in the future only requires extending `routes.yaml` and the language constants list.

Each language's internal tag is configured in the Ghost admin with:
- `feature_image`: a circular SVG flag icon for the corresponding country
- `description`: the language's native name (e.g. German → `Deutsch`, Russian → `Русский`)

---

## 2. Routes Architecture

```yaml
routes:
  /:
    template: lang-redirect

collections:
  /zh/:
    permalink: /zh/{slug}/
    template: index
    filter: "tag:hash-zh+tag:-hash-micro"
  /zh/micro/:
    permalink: /zh/micro/{slug}/
    template: micro
    filter: "tag:hash-zh+tag:hash-micro"

  /en/:
    permalink: /en/{slug}/
    template: index
    filter: "tag:hash-en+tag:-hash-micro"
  /en/micro/:
    permalink: /en/micro/{slug}/
    template: micro
    filter: "tag:hash-en+tag:hash-micro"

  # de, fr, ru, it, es follow the same pattern

taxonomies:
  tag: /tag/{slug}/
  author: /author/{slug}/
```

**Filter syntax note:** Ghost internal tag `#zh` is written as `hash-zh` in filter expressions. `+` means AND; a `-` prefix means NOT.

---

## 3. Language System

### 3.1 Language Detection and Redirect (`lang-redirect.hbs`)

The root path `/` renders no visible content (blank page) and immediately runs JS:

```
1. Read localStorage["preferred-lang"]
2. If present and valid → redirect to /<lang>/
3. Otherwise → read navigator.language, extract primary language code (e.g. "zh-CN" → "zh")
4. If it matches a supported language → write to localStorage, redirect to /<lang>/
5. No match → redirect to /en/ (fallback)
```

Supported language codes: `["zh", "en", "de", "fr", "ru", "it", "es"]`

### 3.2 Language Switcher

- **Position:** Far right of the header
- **Appearance:** Flag icon of the current language (`feature_image`, set dynamically by reading localStorage or the URL prefix to determine the current language)
- **Expanded:** Click to open a dropdown listing all 7 languages
- **Each option:** tag `feature_image` (circular flag SVG) + tag `description` (native name)
- **Data source:** `{{#get "tags" filter="slug:[hash-zh,hash-en,hash-de,hash-fr,hash-ru,hash-it,hash-es]" fields="slug,description,feature_image"}}` — adding a new language requires no theme code changes
- **On selection:**
  1. Write `localStorage["preferred-lang"] = "<lang>"`
  2. Redirect to `/<lang>/` (always goes to the language homepage; no cross-language article mapping)

### 3.3 Current Language Detection (theme side)

- Pages with a language prefix (`/zh/`, `/en/`, etc.): parse the URL path prefix
- Pages without a language prefix (`/tag/{slug}/`, etc.): read `localStorage["preferred-lang"]`; if no match, no language is highlighted

---

## 4. Visual Design

### 4.1 Color Scheme

Dark theme, managed via CSS custom properties for easy future extension to light or other themes:

```css
:root {
  --color-bg:         #0f0f0f;   /* main background */
  --color-bg-card:    #1a1a1a;   /* card / secondary background */
  --color-text:       #f0f0f0;   /* primary text */
  --color-text-muted: #888888;   /* secondary text */
  --color-accent:     #4ade80;   /* accent color (green) */
  --color-border:     #2a2a2a;   /* borders / dividers */
}
```

### 4.2 Typography

- **Heading font:** Playfair Display (Google Fonts, serif, elegant and strong)
- **Body font:** Inter (Google Fonts, sans-serif, highly readable)

### 4.3 Layout & Breakpoints

- `> 1024px`: two-column (main content + right sidebar)
- `768px–1024px`: two-column (narrower sidebar)
- `< 768px`: single column; sidebar content collapses below main content

---

## 5. Template Structure

```
theme/
├── default.hbs             # Base layout: head, header (with language switcher), footer
├── index.hbs               # Language homepage: Hero carousel + article list + right sidebar
├── post.hbs                # Article detail: content + right sidebar (ToC + featured posts) + bottom (author bio + related posts)
├── page.hbs                # Static page (e.g. About): full-width centered, no sidebar
├── tag.hbs                 # Tag page: tag header + article list + right sidebar
├── error.hbs               # Generic error page: minimal centered layout, no sidebar
├── error-404.hbs           # 404 page: minimal centered layout, no sidebar
├── micro.hbs               # Micro-post page (/zh/micro/): single centered column, infinite scroll, page title at top
├── lang-redirect.hbs       # Root path: blank page + JS language detection and redirect
├── partials/
│   ├── post-card.hbs           # Article card: cover image, first public tag, title, 4-line excerpt, author, date, reading time
│   ├── micro-card.hbs          # Micro-post card: body (5-line truncated, expandable), timestamp, image (if any)
│   ├── language-switcher.hbs   # Language switcher dropdown component
│   ├── navigation.hbs          # Navigation bar
│   ├── sidebar.hbs             # Sidebar: recent micro-post card + popular tags (homepage) / ToC + featured posts (article page)
│   └── hero.hbs                # Hero carousel component (featured posts, up to 5; hidden when none)
├── assets/
│   ├── css/
│   │   └── screen.css
│   └── js/
│       ├── lang-detect.js      # Language detection, localStorage, redirect (lang-redirect.hbs only)
│       ├── micro-feed.js       # Content API requests + infinite scroll (micro.hbs) + micro-post expand (global)
│       ├── lang-switcher.js    # Language switcher interaction (global, loaded in default.hbs)
│       ├── hero.js             # Hero carousel auto/manual switching (index.hbs)
│       └── toc.js              # Article table of contents generation (post.hbs)
├── locales/
│   ├── zh.json
│   ├── en.json
│   ├── de.json
│   ├── fr.json
│   ├── ru.json
│   ├── it.json
│   └── es.json
└── package.json
```

### JS Responsibility Split

| File | Loaded in | Responsibility |
|------|-----------|----------------|
| `lang-detect.js` | `lang-redirect.hbs` only | One-time language detection and redirect |
| `micro-feed.js` | `micro.hbs` | Content API requests, infinite scroll; expand/collapse logic reused in sidebar |
| `lang-switcher.js` | `default.hbs` (global) | Dropdown interaction, localStorage write, redirect |
| `hero.js` | `index.hbs` | Hero carousel auto-play (5-second interval) + manual switching + dot indicators |
| `toc.js` | `post.hbs` | Extract h2/h3 from article HTML to generate table of contents |

---

## 6. Page Layouts

### 6.1 Homepage (`index.hbs`)

```
[Header: Logo | Navigation | Search | Language Switcher]
[Hero: carousel, up to 5 featured posts, hidden when none]
[Main]
  [Article List]          [Sidebar]
  article card grid         recent micro-post card (1)
  Ghost native pagination   "View all micro-posts" → /zh/micro/
  format: current / total   popular tags
[Footer]
```

### 6.2 Article Detail (`post.hbs`)

```
[Header]
[Article Content]         [Sidebar]
  title, cover image,       table of contents (ToC, JS-generated)
  body text                 featured posts (3, excluding current)
[Author Bio]
[Related Articles (3, same language, excluding current)]
[Footer]
```

### 6.3 Tag Page (`tag.hbs`)

```
[Header]
[Tag Header: tag name, description, post count]
[Article List]            [Sidebar]
  article cards             popular tags
  pagination
[Footer]
```

### 6.4 Micro Page (`micro.hbs`)

```
[Header]
[Page Title: localized]
[Micro Post Stream (single centered column, max-width 640px)]
  micro-post cards (5-line truncated, expandable)
  infinite scroll loading
[Footer]
```

### 6.5 Static Page (`page.hbs`)

Full-width centered single column, no sidebar. Suitable for long-form content such as the About page.

### 6.6 Error Pages (`error.hbs` / `error-404.hbs`)

Minimal centered layout, no sidebar: error message (localized) + return-to-homepage button.

---

## 7. Components

### 7.1 Hero Carousel (`hero.hbs` + `hero.js`)

- Data: `{{#get "posts" filter="featured:true+tag:hash-<lang>" limit="5"}}`
- When no featured posts: the entire Hero section is hidden (`{{#if}}`)
- Auto-play interval: 5 seconds
- Manual switching: left/right arrows + dot indicators
- Card content: large image, category tag, title, excerpt, author

### 7.2 Article Card (`post-card.hbs`)

- Cover image
- First public tag (internal tags filtered out; hidden if no public tag)
- Title
- Excerpt (`line-clamp: 4`)
- Author avatar + name + date + reading time

### 7.3 Micro Card (`micro-card.hbs`)

- Twitter/tweet style (rounded border or left vertical bar)
- Body HTML (`line-clamp: 5`, click to expand, JS toggle)
- Image (`feature_image`, if present, displayed full-width below body)
- Relative timestamp in bottom-right (e.g. "3 hours ago")
- No title, no profile link

### 7.4 Sidebar (`sidebar.hbs`)

**Homepage / Tag page:**
- Recent micro-post card (1 post, Content API request, with "View all micro-posts" link)
- Popular tags

**Article detail page:**
- Table of contents (ToC, dynamically injected by `toc.js`)
- Featured posts (3 posts, `{{#get "posts" filter="featured:true+id:-{{id}}" limit="3"}}`)

### 7.5 Pagination

Custom format using variables provided by Ghost `{{pagination}}`:

```handlebars
<span>{{page}} / {{pages}}</span>
{{#if next}}<a href="{{next}}">Older →</a>{{/if}}
{{#if prev}}<a href="{{prev}}">← Newer</a>{{/if}}
```

Pagination text is localized via `{{t}}`.

---

## 8. Content API

### 8.1 Key Configuration

The Content API key is configured via Ghost custom theme settings (`{{@custom.content_api_key}}`), declared in `package.json` under `config.custom`. Read-only; safe for client-side use.

### 8.2 Micro Feed Request

Micro-post page (infinite scroll):

```
GET /ghost/api/content/posts/
  ?filter=tag:hash-<lang>%2Btag:hash-micro
  &fields=html,published_at,feature_image
  &limit=20
  &page=<n>
  &key=<CONTENT_API_KEY>
```

Sidebar recent micro-post (1 post): same as above with `limit=1&page=1`

---

## 9. Locales

Each language has a corresponding `locales/<lang>.json`, with UI strings translated via `{{t "..."}}`, including: navigation labels, "View all micro-posts", "reading time", "Table of Contents", "Related posts", "Author", "Page not found", "Something went wrong", "Return to homepage", pagination text, etc.

---

## 10. Out of Scope

- Cross-language article linking (the language switcher always goes to the language homepage)
- Micro-post individual detail pages (no links provided at the theme level; Ghost URLs exist but are unused)
- Member subscriptions / Ghost Members feature
- Comments
- Author page (`author.hbs`, handled by Ghost fallback)
- Micro-post creation UI (managed via Ghost admin)
