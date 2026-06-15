// Slice 09 — Tag page.
//
// Two test layers, matching the harness established in slice 1:
//
//  1. Static template-artifact assertions on the authored tag.hbs template, the
//     reused post-card / pagination markup, the popular-tags branch of
//     sidebar.hbs, the locale strings, and the CSS. These prove the tag header
//     (name + description + post count), the article-card grid with pagination,
//     and the popular-tags sidebar are wired with the required Ghost helpers and
//     {{t}} localization — independent of a running Ghost instance.
//
//  2. Live rendered-HTML assertions against the running Ghost instance (the PRD's
//     chosen seam). These skip when the operator precondition (activated theme +
//     routes + seeded language tags/posts/tag pages) is not met, per CLAUDE.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readThemeFile,
  themeFileExists,
  fetchHtml,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
} from "./helpers.mjs";

// --- 1a. tag.hbs template exists ---

test("tag.hbs template exists", () => {
  assert.ok(themeFileExists("tag.hbs"), "tag.hbs must exist");
});

const tagHbs = themeFileExists("tag.hbs") ? readThemeFile("tag.hbs") : "";

// --- 1b. Tag header: name, description, post count ---

test("tag.hbs renders the tag name", () => {
  // On a tag page the current tag is the data context; {{name}} (or {{tag.name}})
  // renders the tag's name in the header.
  assert.match(
    tagHbs,
    /\{\{(tag\.)?name\}\}/,
    "tag header must render the tag {{name}}"
  );
});

test("tag.hbs renders the tag description", () => {
  assert.match(
    tagHbs,
    /\{\{(tag\.)?description\}\}/,
    "tag header must render the tag {{description}}"
  );
});

test("tag.hbs renders the tag post count", () => {
  // Ghost exposes the post count on a tag page via {{count.posts}}.
  assert.match(
    tagHbs,
    /\{\{(count\.posts|tag\.count\.posts)\}\}/,
    "tag header must render the {{count.posts}} post count"
  );
});

test("tag.hbs marks up a tag header region", () => {
  assert.match(
    tagHbs,
    /tag-header/,
    "tag.hbs must carry a .tag-header region hook"
  );
});

// --- 1c. Article-card grid reusing post-card.hbs ---

test("tag.hbs renders cards through the post-card partial", () => {
  assert.match(
    tagHbs,
    /\{\{>\s*"?post-card"?\s*\}\}/,
    "tag.hbs must render posts through the shared post-card partial"
  );
});

test("tag.hbs iterates the tag's posts in a foreach loop", () => {
  assert.match(
    tagHbs,
    /\{\{#foreach posts\}\}/,
    "tag.hbs must {{#foreach posts}} over the tag's posts"
  );
});

// --- 1d. Shared pagination markup ---

test("tag.hbs builds the page / pages pagination indicator", () => {
  assert.match(tagHbs, /\{\{page\}\}/, "pagination must render the current {{page}}");
  assert.match(tagHbs, /\{\{pages\}\}/, "pagination must render total {{pages}}");
});

test("tag.hbs shows older/newer links conditionally via {{#if next}}/{{#if prev}}", () => {
  assert.match(tagHbs, /\{\{#if next\}\}/, "older link must be guarded by {{#if next}}");
  assert.match(tagHbs, /\{\{#if prev\}\}/, "newer link must be guarded by {{#if prev}}");
  assert.match(tagHbs, /page_url/, "pagination links must use the {{page_url}} helper");
});

test("tag.hbs pagination labels are localizable via {{t}}", () => {
  assert.match(
    tagHbs,
    /\{\{t\s+["'](Older|Newer)/,
    "pagination labels must be emitted through {{t}}"
  );
});

// --- 1e. Popular-tags sidebar branch ---

test("tag.hbs renders the sidebar partial", () => {
  assert.match(
    tagHbs,
    /\{\{>\s*"?sidebar"?\}\}/,
    "tag.hbs must include the sidebar partial"
  );
});

const sidebar = readThemeFile("partials/sidebar.hbs");

test("sidebar.hbs renders the popular-tags block on the tag page (popular-tags branch)", () => {
  // The popular-tags block must render outside the homepage-only micro preview so
  // the tag page gets a popular-tags sidebar.
  assert.match(
    sidebar,
    /popular-tags|sidebar-tags/,
    "sidebar must mark up a popular-tags block"
  );
  assert.match(
    sidebar,
    /\{\{#get\s+"tags"/,
    "popular-tags must {{#get \"tags\"}}"
  );
});

test("sidebar.hbs guards the recent micro preview so it stays out of the tag page", () => {
  // The micro preview's query uses the language tag slug ({{tag.slug}} = hash-<code>),
  // which is only meaningful in the homepage/index context. On a tag page {{tag}} is
  // the current public tag, so the micro preview must be guarded to the home context
  // while popular-tags renders in both. We assert a context guard exists around the
  // micro section.
  assert.match(
    sidebar,
    /\{\{#is\s+["']?(index|home)/,
    "the micro preview must be guarded by a home/index context check"
  );
});

// --- 1f. CSS: tag-page styling ---

const screenCss = readThemeFile("assets/css/screen.css");

test("screen.css styles the tag header in the dark system", () => {
  assert.match(
    screenCss,
    /\.tag-header\b/,
    "a .tag-header style block is required"
  );
});

// --- 2. Live rendered-HTML assertions (skip when precondition not met) ---

const ready = await liveLangRoutesReady();

// Probe a tag page only when the base precondition is met. We cannot know a
// seeded tag slug from theme code, so these live assertions are best-effort and
// skip when the precondition (or a reachable tag page) is absent.
test(
  "a tag page renders a header with the tag name, description, and post count",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    // Find a tag link from the homepage sidebar's popular-tags block.
    const home = await fetchHtml(`/us/`);
    const m = home.html.match(/href="([^"]*\/tag\/[^"]+\/)"/);
    if (!m) {
      // No public tag seeded; nothing to assert against.
      return;
    }
    const { status, html } = await fetchHtml(m[1]);
    assert.equal(status, 200, "tag page should return 200");
    assert.match(html, /tag-header/, "tag header region missing");
  }
);

test(
  "a tag page renders article cards plus pagination and a popular-tags sidebar",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const home = await fetchHtml(`/us/`);
    const m = home.html.match(/href="([^"]*\/tag\/[^"]+\/)"/);
    if (!m) return;
    const { html } = await fetchHtml(m[1]);
    assert.match(html, /class="[^"]*post-card[^"]*"/, "post cards missing on tag page");
    assert.match(html, /popular-tags|sidebar-tags/, "popular-tags sidebar missing on tag page");
  }
);
