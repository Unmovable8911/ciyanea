# Hero carousel

## What to build

A hero carousel of up to five featured posts in the current language at the top of the homepage,
which disappears entirely when there are no featured posts.

Scope:

- `hero.hbs` partial: query featured posts for the bound language via
  `{{#get "posts" filter="featured:true+tag:{{tag.slug}}" limit="5"}}` (the language tag comes from
  the route's `data: tag.hash-<lang>` binding). The whole section is wrapped in `{{#if}}` so it
  renders nothing when there are no featured posts. Each slide shows the large cover image, a
  category tag, title, excerpt, and author.
- `hero.js`, loaded by `index.hbs`: 5-second auto-advance, previous/next arrows, and clickable dot
  indicators.
- Hero styling in the dark visual system.

## Acceptance criteria

- [ ] The homepage renders a hero region only when at least one featured post exists in that
      language; the region is absent otherwise.
- [ ] The hero shows at most 5 featured posts from the current language.
- [ ] Each slide exposes image, title, excerpt, and author.
- [ ] Auto-advance (5s), arrows, and dot indicators work (verified manually per PRD).

## Blocked by

- Slice 2 (Homepage article listing)
