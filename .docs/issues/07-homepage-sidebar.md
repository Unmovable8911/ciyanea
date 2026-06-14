# Homepage sidebar (recent micro preview + popular tags)

## What to build

The homepage right-hand sidebar: a preview of the most recent micro-post (with a link to the full
stream) and a popular-tags block, collapsing below the main content on narrow screens.

Scope:

- `sidebar.hbs` partial with a context-aware homepage branch containing:
  - The most recent micro-post for the current language, fetched via the Content API
    (same query as the micro feed with `limit=1&page=1`), rendered with the `micro-card`
    presentation and reusing the slice-6 expand/collapse behavior.
  - A "view all micro-posts" link to `/<code>/micro/` (declared as `data-lang-href="micro/"` so the
    switcher's link-rewriting keeps it language-correct).
  - A popular-tags block linking to tag pages.
- `index.hbs` renders the sidebar alongside the article grid in the two-column layout; the sidebar
  collapses below the main column under 768px.
- Sidebar styling in the dark visual system.

## Acceptance criteria

- [ ] The homepage renders a sidebar containing a recent micro-post preview and a "view all
      micro-posts" link pointing at the current language's `/<code>/micro/`.
- [ ] The sidebar renders a popular-tags block whose entries link to tag pages.
- [ ] The recent micro-post preview supports the same expand/collapse interaction as the micro
      stream (verified manually per PRD).
- [ ] On viewports under 768px the sidebar collapses below the main content.

## Blocked by

- Slice 6 (Micro stream page)
