# Tag page

## What to build

A tag page presenting the tag's identity and all of its posts with pagination and a popular-tags
sidebar.

Scope:

- `tag.hbs`: a tag header showing the tag name, description, and post count; the article-card grid
  (reusing `post-card.hbs`) with the shared pagination markup; and a sidebar using the popular-tags
  branch of `sidebar.hbs`.
- Tag-page styling in the dark visual system.

## Acceptance criteria

- [ ] A tag page renders a header with the tag name, description, and post count.
- [ ] The page renders article cards for the tag's posts plus the `page / pages` pagination with
      older/newer links.
- [ ] The page renders a popular-tags sidebar.

## Blocked by

- Slice 2 (Homepage article listing) — for `post-card` + pagination reuse
- Slice 7 (Homepage sidebar) — for the popular-tags sidebar branch
