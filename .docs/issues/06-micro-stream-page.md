# Micro stream page

## What to build

A dedicated per-language micro-post stream at `/<code>/micro/`: a single centered, tweet-style feed
that loads more posts as the visitor scrolls.

Scope:

- Add the `/<code>/micro/` collection for all 7 languages to `routes.yaml`:
  `template: micro`, `filter: "tag:hash-<code>+tag:hash-micro"`, `permalink: /<code>/micro/{slug}/`,
  `data: tag.hash-<code>`.
- `micro.hbs`: a localized page title at the top and a single centered column (max-width ~640px)
  containing the micro stream; loads `micro-feed.js`.
- `micro-card.hbs`: tweet-style card (rounded border or left bar), body HTML clamped to 5 lines with
  click-to-expand, an optional full-width `feature_image` below the body, and a relative timestamp
  (e.g. "3 hours ago") in the bottom-right. No title, no profile link.
- `micro-feed.js`: requests the Content API
  (`/ghost/api/content/posts/?filter=tag:hash-<code>+tag:hash-micro&fields=html,published_at,feature_image&limit=20&page=<n>&key=<KEY>`,
  `+` URL-encoded as `%2B`, key from `{{@custom.content_api_key}}`) and appends pages on infinite
  scroll. The expand/collapse logic here is written so it can be reused by the homepage sidebar
  preview (slice 7).

External prerequisite: the Content API key is set in theme custom settings; micro posts exist per
language in admin.

## Acceptance criteria

- [ ] `routes.yaml` defines a `/<code>/micro/` collection for all 7 languages with the
      micro-inclusive filter.
- [ ] `/<code>/micro/` returns HTTP 200, renders the localized page title, and renders a centered
      micro-stream container.
- [ ] The micro collection includes only micro-posts (and the index collection still excludes them).
- [ ] Each micro card renders body, optional full-width image, and a relative timestamp, with no
      title or profile link.
- [ ] Infinite scroll appends further pages, and body expand/collapse works (verified manually per
      PRD).

## Blocked by

- Slice 1 (Walking skeleton + rendered-HTML test harness)
