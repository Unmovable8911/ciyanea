# Article detail page

## What to build

The full article reading experience: the post body with a table-of-contents and featured-posts
sidebar, an author bio, and related articles.

Scope:

- `post.hbs`: renders the article title, cover image, and body. Below the body, an author bio block.
  At the bottom, up to 3 related articles in the same language excluding the current post
  (`{{#get "posts" filter="tag:{{tag.slug}}+id:-{{id}}" limit="3"}}` using the route's bound
  language tag).
- Extend `sidebar.hbs` with an article branch containing:
  - A ToC container that `toc.js` populates from the rendered article's h2/h3 headings.
  - A featured-posts block of 3 posts excluding the current one
    (`{{#get "posts" filter="featured:true+id:-{{id}}" limit="3"}}`).
- `toc.js`, loaded by `post.hbs`: extract h2/h3 from the rendered article HTML and inject the ToC
  into the sidebar container.
- Article-page styling in the dark visual system.

## Acceptance criteria

- [ ] An article page renders the title, cover image, and body.
- [ ] An author bio block renders below the article.
- [ ] Up to 3 related articles in the same language (excluding the current post) render at the bottom.
- [ ] The sidebar renders a ToC container and a featured-posts block of up to 3 posts excluding the
      current one.
- [ ] `toc.js` populates the ToC from the article's headings (verified manually per PRD).

## Blocked by

- Slice 2 (Homepage article listing) — for `post-card` reuse
- Slice 7 (Homepage sidebar) — extends the shared `sidebar.hbs`
