// Slice 05 — Hero carousel.
//
// Two test layers, matching the harness established in earlier slices:
//
//  1. Static template-artifact assertions on the authored hero partial, the
//     index template wiring, hero.js, and the hero CSS. These prove the carousel
//     is wired with the required Ghost helpers ({{#get}} featured query bound to
//     the route's language tag, the {{#if}} empty-guard, slide content, arrows,
//     dots) and the auto-advance JS — independent of a running Ghost instance.
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

test("hero.hbs partial exists", () => {
  assert.ok(
    themeFileExists("partials/hero.hbs"),
    "partials/hero.hbs must exist"
  );
});

const hero = themeFileExists("partials/hero.hbs")
  ? readThemeFile("partials/hero.hbs")
  : "";

test("hero queries featured posts for the bound language via {{#get}}", () => {
  // The featured query, scoped to the route-bound language tag ({{tag.slug}})
  // and filtered to featured posts.
  assert.match(
    hero,
    /\{\{#get\s+"posts"/,
    "hero must query posts with {{#get \"posts\"}}"
  );
  assert.match(
    hero,
    /featured:true/,
    "hero query must filter featured:true"
  );
  assert.match(
    hero,
    /tag:\{\{tag\.slug\}\}/,
    "hero query must scope to the route-bound language tag via tag:{{tag.slug}}"
  );
});

test("hero limits to at most 5 featured posts", () => {
  assert.match(
    hero,
    /limit="5"/,
    "hero query must use limit=\"5\""
  );
});

test("hero wraps the whole section in an {{#if}} so it vanishes when empty", () => {
  // When there are no featured posts the section renders nothing. The PRD wraps
  // the region in {{#if}} keyed on the get result (e.g. {{#if posts}}).
  assert.match(
    hero,
    /\{\{#if\s+posts\}\}/,
    "hero must guard the region with {{#if posts}} so it is absent when empty"
  );
});

test("hero renders each featured post as a slide", () => {
  assert.match(
    hero,
    /\{\{#foreach\s+posts\}\}/,
    "hero must iterate featured posts with {{#foreach posts}}"
  );
  assert.match(
    hero,
    /hero-slide/,
    "each post must render a .hero-slide element"
  );
});

test("each hero slide exposes image, tag, title, excerpt and author", () => {
  assert.match(hero, /feature_image/, "slide must render the cover feature_image");
  assert.match(hero, /primary_tag/, "slide must render the first public tag");
  assert.match(hero, /\{\{title\}\}/, "slide must render {{title}}");
  assert.match(hero, /excerpt/, "slide must render an excerpt");
  assert.match(
    hero,
    /primary_author/,
    "slide must render the author via {{primary_author}}"
  );
});

test("hero slides link to their post url", () => {
  assert.match(hero, /\{\{url\}\}/, "slide must link to {{url}}");
});

test("hero renders previous/next arrows and a dots container", () => {
  assert.match(
    hero,
    /data-hero-prev/,
    "hero must expose a previous arrow (data-hero-prev)"
  );
  assert.match(
    hero,
    /data-hero-next/,
    "hero must expose a next arrow (data-hero-next)"
  );
  assert.match(
    hero,
    /data-hero-dots/,
    "hero must expose a dots indicator container (data-hero-dots)"
  );
});

// --- index.hbs: includes the hero partial above the grid + loads hero.js ---

const indexHbs = readThemeFile("index.hbs");

test("index.hbs includes the hero partial", () => {
  assert.match(
    indexHbs,
    /\{\{>\s*"?hero"?\s*\}\}/,
    "index must include the hero partial"
  );
});

test("index.hbs loads hero.js", () => {
  assert.match(
    indexHbs,
    /js\/hero\.js/,
    "index must load assets/js/hero.js"
  );
});

// --- hero.js: auto-advance, arrows, dots ---

test("hero.js asset exists", () => {
  assert.ok(
    themeFileExists("assets/js/hero.js"),
    "assets/js/hero.js must exist"
  );
});

const heroJs = themeFileExists("assets/js/hero.js")
  ? readThemeFile("assets/js/hero.js")
  : "";

test("hero.js auto-advances every 5 seconds", () => {
  // 5000ms interval for the 5-second auto-advance.
  assert.match(
    heroJs,
    /5000/,
    "hero.js must use a 5000ms (5s) auto-advance interval"
  );
  assert.match(
    heroJs,
    /setInterval/,
    "hero.js must schedule auto-advance with setInterval"
  );
});

test("hero.js wires previous/next arrows and dot indicators", () => {
  assert.match(heroJs, /data-hero-prev/, "hero.js must wire the previous arrow");
  assert.match(heroJs, /data-hero-next/, "hero.js must wire the next arrow");
  assert.match(heroJs, /data-hero-dots/, "hero.js must wire the dot indicators");
});

// --- screen.css: hero styling ---

const screenCss = readThemeFile("assets/css/screen.css");

test("screen.css styles the hero region", () => {
  assert.match(
    screenCss,
    /\.hero\b/,
    "a .hero style block is required"
  );
});

// --- 2. Live rendered-HTML assertions (skip when precondition not met) ---

const ready = await liveLangRoutesReady();

test(
  "homepage hero region is either absent or exposes slide image/title/excerpt/author",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    // The hero is conditional: it renders only when at least one featured post
    // exists. When present it must expose the required slide content; when absent
    // there is simply no hero region. Either state is acceptable here.
    if (/class="[^"]*hero\b[^"]*"/.test(html)) {
      assert.match(html, /hero-slide/, "hero present but no slides rendered");
      assert.match(html, /hero-slide-title/, "hero slide title element missing");
      assert.match(
        html,
        /hero-slide-excerpt/,
        "hero slide excerpt element missing"
      );
      assert.match(
        html,
        /hero-slide-author/,
        "hero slide author element missing"
      );
      assert.match(html, /data-hero-prev/, "hero prev arrow missing");
      assert.match(html, /data-hero-next/, "hero next arrow missing");
      assert.match(html, /data-hero-dots/, "hero dots container missing");
    }
  }
);

test(
  "homepage hero shows at most 5 slides when present",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    if (/class="[^"]*hero\b[^"]*"/.test(html)) {
      const slides = (html.match(/class="[^"]*hero-slide\b[^"]*"/g) || []).length;
      assert.ok(slides >= 1, "hero present must render at least one slide");
      assert.ok(slides <= 5, "hero must render at most 5 featured slides");
    }
  }
);
