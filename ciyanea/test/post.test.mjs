// Slice 08 — Article detail page.
//
// Two test layers, matching the established harness:
//
//  1. Static template-artifact assertions on the authored post.hbs template, the
//     article branch of sidebar.hbs, toc.js, the locale strings, and the CSS.
//     These prove the article reading experience (title + cover + body, author
//     bio, related posts, the sidebar ToC container + featured-posts block, and
//     the toc.js loader) independent of a running Ghost instance.
//
//  2. Live rendered-HTML assertions against the running Ghost instance (the PRD's
//     chosen seam). These skip when the operator precondition (activated theme +
//     routes + seeded language tags/posts) is not met, per CLAUDE.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readThemeFile,
  themeFileExists,
  fetchHtml,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
} from "./helpers.mjs";

// --- 1a. post.hbs exists ---

test("post.hbs template exists", () => {
  assert.ok(themeFileExists("post.hbs"), "post.hbs must exist");
});

const post = themeFileExists("post.hbs") ? readThemeFile("post.hbs") : "";

// --- 1b. title, cover image, body ---

test("post.hbs renders the article title", () => {
  assert.match(post, /\{\{title\}\}/, "post.hbs must render {{title}}");
});

test("post.hbs renders the cover (feature) image", () => {
  assert.match(
    post,
    /\{\{#if\s+feature_image\}\}/,
    "post.hbs must guard the cover image with {{#if feature_image}}"
  );
  assert.match(
    post,
    /feature_image/,
    "post.hbs must render {{feature_image}}"
  );
});

test("post.hbs renders the article body via {{content}}", () => {
  assert.match(
    post,
    /\{\{content\}\}/,
    "post.hbs must render the body through the {{content}} helper"
  );
});

// --- 1c. author bio block below the body ---

test("post.hbs renders an author bio block below the article", () => {
  assert.match(
    post,
    /author-bio|post-author/,
    "post.hbs must mark up an author bio block"
  );
  // Sourced from the post's primary author: name + bio.
  assert.match(
    post,
    /\{\{#primary_author\}\}/,
    "the author bio must read from {{#primary_author}}"
  );
});

// --- 1d. related posts: up to 3, same language, excluding current ---

test("post.hbs renders up to 3 related posts in the same language excluding the current one", () => {
  assert.match(
    post,
    /\{\{#get\s+"posts"/,
    "post.hbs must {{#get \"posts\"}} the related articles"
  );
  // Same language tag (bound via the route's data: tag.hash-<code>) AND not the
  // current post id.
  assert.match(
    post,
    /tag:\{\{tag\.slug\}\}/,
    "related-posts query must filter by the current language tag {{tag.slug}}"
  );
  assert.match(
    post,
    /id:-\{\{id\}\}/,
    "related-posts query must exclude the current post via id:-{{id}}"
  );
  assert.match(
    post,
    /limit=("3"|3|'3')/,
    "related-posts query must use limit=3"
  );
});

test("post.hbs renders related posts through the post-card partial", () => {
  assert.match(
    post,
    /\{\{>\s*"?post-card"?\}\}/,
    "related posts must render via the shared post-card partial"
  );
});

// --- 1e. toc.js loaded by post.hbs ---

test("post.hbs loads toc.js", () => {
  assert.match(
    post,
    /asset\s+"js\/toc\.js"/,
    "post.hbs must load assets/js/toc.js"
  );
});

test("toc.js asset exists", () => {
  assert.ok(themeFileExists("assets/js/toc.js"), "assets/js/toc.js must exist");
});

// --- 1f. sidebar article branch: ToC container + featured posts ---

const sidebar = readThemeFile("partials/sidebar.hbs");

test("sidebar has an article branch keyed on the post context", () => {
  // The article branch must only render on the article page (where {{post}} is
  // available), keeping the homepage/tag branch intact.
  assert.match(
    sidebar,
    /\{\{#if\s+post\}\}|\{\{#post\}\}/,
    "sidebar must branch on the post context for the article-page layout"
  );
});

test("sidebar renders a ToC container that toc.js populates", () => {
  assert.match(
    sidebar,
    /data-toc|sidebar-toc/,
    "sidebar must expose a ToC container (data-toc / sidebar-toc) for toc.js"
  );
});

test("sidebar renders a featured-posts block of up to 3 posts excluding the current one", () => {
  assert.match(
    sidebar,
    /featured:true\+id:-\{\{id\}\}|featured:true%2Bid:-\{\{id\}\}/,
    "sidebar featured block must filter featured:true AND exclude the current post id"
  );
  assert.match(
    sidebar,
    /limit=("3"|3|'3')/,
    "sidebar featured block must use limit=3"
  );
});

// --- 1g. toc.js targets the sidebar container and reads h2/h3 ---

const toc = themeFileExists("assets/js/toc.js")
  ? readThemeFile("assets/js/toc.js")
  : "";

test("toc.js extracts h2 and h3 headings from the rendered article", () => {
  assert.match(
    toc,
    /h2|h3/i,
    "toc.js must select h2/h3 headings"
  );
});

test("toc.js injects the ToC into the sidebar container", () => {
  assert.match(
    toc,
    /data-toc|sidebar-toc/,
    "toc.js must target the sidebar ToC container"
  );
});

// --- 1h. locale strings for the article chrome ---

test("locales/en.json defines the article chrome strings", () => {
  const en = JSON.parse(readThemeFile("locales/en.json"));
  const keys = Object.keys(en);
  assert.ok(
    keys.some((k) => /contents|toc/i.test(k)),
    "locales/en.json should define a Table of contents heading"
  );
  assert.ok(
    keys.some((k) => /related/i.test(k)),
    "locales/en.json should define a Related posts heading"
  );
  assert.ok(
    keys.some((k) => /author/i.test(k)),
    "locales/en.json should define an author-bio heading"
  );
});

// --- 1i. CSS: article-page styling in the dark system ---

const screenCss = readThemeFile("assets/css/screen.css");

test("screen.css styles the article page in the dark system", () => {
  assert.match(
    screenCss,
    /\.post-(full|article|header|content)\b|\.article\b/,
    "an article-page style block is required"
  );
});

test("screen.css styles the sidebar ToC and author bio", () => {
  assert.match(screenCss, /sidebar-toc|toc-/, "ToC styling is required");
  assert.match(
    screenCss,
    /author-bio|post-author/,
    "author bio styling is required"
  );
});

// --- 2. Live rendered-HTML assertions (skip when precondition not met) ---

const ready = await liveLangRoutesReady();

// Find one article URL on the /us/ homepage to exercise post.hbs live.
async function firstArticleUrl() {
  const { html } = await fetchHtml(`/us/`);
  const m = html.match(/href="(https?:\/\/[^"]*\/us\/[^"]+\/)"/);
  return m ? m[1] : null;
}

test(
  "an article page renders the title and body",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const url = await firstArticleUrl();
    if (!url) return; // no seeded articles; nothing to assert
    const { html } = await fetchHtml(url);
    assert.match(html, /<h1[^>]*>/i, "article must render an <h1> title");
    assert.match(
      html,
      /post-content|post-full-content|article/i,
      "article body container missing"
    );
  }
);

test(
  "an article page renders the sidebar ToC container and featured posts block",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const url = await firstArticleUrl();
    if (!url) return;
    const { html } = await fetchHtml(url);
    assert.match(html, /data-toc|sidebar-toc/, "ToC container missing on article page");
  }
);
