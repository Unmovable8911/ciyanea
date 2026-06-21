# Hero Carousel — Refinement Design

**Date:** 2026-06-21
**Status:** Approved
**Scope:** Hero carousel component + homepage first-screen layout restructure

---

## 1. Layout Change

The hero section shifts from full-width to a two-column first-screen block:

```
Desktop (>768px):
[Hero Carousel ~70%]  [Sidebar ~30%]
                        recent micro post (1)
                        "View all micro-posts" link
                        popular tags

Mobile (<768px):
[Hero Carousel 100%]
[Article List]
[Sidebar]              ← stays below article list, not below hero
```

- Sidebar height: auto (content-driven), not forced to match hero height.
- Mobile sidebar position unchanged from current behavior (below article list).

---

## 2. Hero Carousel

### 2.1 Dimensions

- Height: `70vh` on all breakpoints (desktop and mobile).
- Border radius: `12px` with `1px solid var(--color-border)` — unchanged.

### 2.2 Overlay Content

Bottom-up stacked inside gradient overlay:

1. **Tag** — first public tag, accent color, uppercase
2. **Title** — large heading
3. **Excerpt** — 2-line clamped

Author information is removed.

### 2.3 Gradient Overlay

Unchanged from current implementation:

```css
background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.35) 45%,
    rgba(0, 0, 0, 0) 75%
);
```

### 2.4 Navigation

- **Arrows: removed.** No left/right arrow buttons.
- **Dot indicators: only manual control.**
  - Position: bottom-right corner of the carousel.
  - Style: horizontal dash (short line), not circles.
  - Active state: brighter/longer dash.
- **Auto-advance:** 5-second interval, pause on hover — unchanged.

### 2.5 Data

- Query: `{{#get "posts" filter="featured:true+tag:{{langtag}}" limit="5" include="tags"}}`
- `include="authors"` can be dropped since author info is removed.
- When no featured posts exist, the entire hero section is hidden.

---

## 3. Files Affected

| File | Change |
|------|--------|
| `partials/hero.hbs` | Remove arrows, remove author block, update dot markup |
| `partials/home.hbs` | Restructure layout: hero + sidebar side-by-side |
| `assets/js/hero.js` | Remove arrow event listeners and related code |
| `assets/css/screen.css` | Hero height to `70vh`, remove arrow styles, dash dot styles, two-column hero+sidebar layout, responsive rules |

---

## 4. Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hero + sidebar layout | Side-by-side (~70/30) | Match reference site first-screen structure |
| Sidebar height | Auto (content-driven) | Simpler, no forced fill needed |
| Mobile sidebar position | Below article list | Consistent with current behavior |
| Arrows | Removed | Not in reference design; dots suffice |
| Dot style | Right-bottom dash | Matches reference; less content obstruction |
| Height | `70vh` all breakpoints | Viewport-relative for consistent visual impact |
| Overlay content | Tag + title + excerpt | Author removed for cleaner look |
| Gradient overlay | Unchanged | Current gradient already adequate |
| Border radius + border | `12px` + border kept | Matches reference; clear visual layer separation |
| Auto-advance | 5s interval | Unchanged, standard carousel timing |
