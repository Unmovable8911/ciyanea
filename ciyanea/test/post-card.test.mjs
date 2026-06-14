// Slice 02 — Homepage article listing (post-card + grid + pagination).
//
// Two test layers, matching the harness established in slice 1:
//
//  1. Static template-artifact assertions on the authored partials/templates
//     (the canonical source). These prove the post-card partial, the index grid,
//     and the custom pagination markup are wired with the required Ghost helpers
//     and {{t}} localization — independent of a running Ghost instance.
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

// --- 1. Static template-artifact assertions ---

test("post-card.hbs partial exists", () => {
  assert.ok(
    themeFileExists("partials/post-card.hbs"),
    "partials/post-card.hbs must exist"
  );
});

const postCard = themeFileExists("partials/post-card.hbs")
  ? readThemeFile("partials/post-card.hbs")
  : "";

test("post-card renders the cover/feature image", () => {
  assert.match(
    postCard,
    /feature_image/,
    "card must render the post's feature_image (cover)"
  );
});

test("post-card renders the post title and links to the post", () => {
  assert.match(postCard, /\{\{title\}\}/, "card must render {{title}}");
  assert.match(postCard, /\{\{url\}\}/, "card must link to {{url}}");
});

test("post-card renders a clamped excerpt", () => {
  assert.match(
    postCard,
    /excerpt/,
    "card must render an excerpt (custom_excerpt or {{excerpt}})"
  );
  // The 4-line clamp is a styling concern — assert the class hook is present so
  // the CSS can target it.
  assert.match(
    postCard,
    /post-card-excerpt/,
    "card must carry the post-card-excerpt class for the 4-line clamp"
  );
});

test("post-card shows exactly one public tag, internal tags filtered out", () => {
  // {{#primary_tag}} resolves to the first PUBLIC tag (Ghost excludes internal
  // hash- tags from primary_tag), and {{#if}} hides the row when there is none.
  assert.match(
    postCard,
    /primary_tag/,
    "card must use {{primary_tag}} so only the first public tag is shown"
  );
});

test("post-card renders the author row: avatar, name", () => {
  assert.match(
    postCard,
    /profile_image/,
    "author row must render the author profile_image (avatar)"
  );
  // Author name via the {{author}}/{{#primary_author}} helpers.
  assert.match(
    postCard,
    /author/i,
    "author row must render the author name"
  );
});

test("post-card renders publish date and reading time", () => {
  assert.match(
    postCard,
    /\{\{date\b/,
    "card must render the publish {{date}}"
  );
  assert.match(
    postCard,
    /reading_time/,
    "card must render {{reading_time}}"
  );
});

// --- index.hbs: grid + custom pagination ---

const indexHbs = readThemeFile("index.hbs");

test("index.hbs renders cards through the post-card partial", () => {
  assert.match(
    indexHbs,
    /\{\{>\s*"?post-card"?\s*\}\}/,
    "index must include the post-card partial inside the post loop"
  );
});

test("index.hbs iterates posts in a foreach loop", () => {
  assert.match(indexHbs, /\{\{#foreach posts\}\}/, "index must {{#foreach posts}}");
});

test("index.hbs builds custom pagination from {{pagination}} variables", () => {
  // The page / pages indicator.
  assert.match(
    indexHbs,
    /\{\{page\}\}/,
    "pagination must render the current {{page}}"
  );
  assert.match(
    indexHbs,
    /\{\{pages\}\}/,
    "pagination must render total {{pages}}"
  );
});

test("index.hbs shows older/newer links conditionally via {{#if next}}/{{#if prev}}", () => {
  assert.match(
    indexHbs,
    /\{\{#if next\}\}/,
    "older link must be guarded by {{#if next}}"
  );
  assert.match(
    indexHbs,
    /\{\{#if prev\}\}/,
    "newer link must be guarded by {{#if prev}}"
  );
  // The actual page URLs come from the page_url helper.
  assert.match(
    indexHbs,
    /page_url/,
    "pagination links must use the {{page_url}} helper"
  );
});

test("index.hbs pagination labels are localizable via {{t}}", () => {
  // Older/Newer (and/or page-of label) routed through {{t}}.
  assert.match(
    indexHbs,
    /\{\{t\s+["'](Older|Newer|Page)/,
    "pagination labels must be emitted through {{t}}"
  );
});

test("locales/en.json defines the new pagination chrome strings", () => {
  const en = JSON.parse(readThemeFile("locales/en.json"));
  for (const key of ["Older", "Newer"]) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(en, key),
      `locales/en.json must define the "${key}" string`
    );
  }
});

// --- screen.css: grid + pagination styling ---

const screenCss = readThemeFile("assets/css/screen.css");

test("screen.css clamps the card excerpt to 4 lines", () => {
  assert.match(
    screenCss,
    /\.post-card-excerpt[\s\S]*?-webkit-line-clamp:\s*4/,
    "post-card-excerpt must be clamped to 4 lines"
  );
});

test("screen.css styles the pagination block", () => {
  assert.match(
    screenCss,
    /\.pagination\b/,
    "a .pagination style block is required"
  );
});

// --- 2. Live rendered-HTML assertions (skip when precondition not met) ---

const ready = await liveLangRoutesReady();

test(
  "homepage renders article cards exposing title, excerpt, author, date, reading time",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    assert.match(html, /class="[^"]*post-card[^"]*"/, "post cards missing");
    assert.match(html, /post-card-title/, "card title element missing");
    assert.match(html, /post-card-excerpt/, "card excerpt element missing");
    assert.match(html, /post-card-author/, "card author element missing");
    assert.match(html, /post-card-date|datetime=/, "card date element missing");
    assert.match(html, /post-card-reading-time/, "card reading-time element missing");
  }
);

test(
  "micro-posts never appear in the article grid",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    assert.doesNotMatch(
      html,
      /data-post-type=["']micro["']/,
      "the article grid must not include micro-posts"
    );
  }
);

test(
  "pagination renders a page / pages indicator",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    assert.match(
      html,
      /\b\d+\s*\/\s*\d+\b/,
      "pagination must render a 'page / pages' indicator"
    );
  }
);
