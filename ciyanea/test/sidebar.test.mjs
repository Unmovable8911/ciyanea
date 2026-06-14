// Slice 07 — Homepage sidebar (recent micro preview + popular tags).
//
// Two test layers, matching the established harness:
//
//  1. Static template-artifact assertions on the authored sidebar.hbs partial,
//     index.hbs, the locale strings, and the CSS. These prove the sidebar's
//     homepage branch (recent micro preview + "view all micro-posts" link +
//     popular tags), its reuse of the slice-6 expand/collapse behavior, and the
//     responsive collapse — independent of a running Ghost instance.
//
//  2. Live rendered-HTML assertions against the running Ghost instance (the PRD's
//     chosen seam). These skip when the operator precondition (activated theme +
//     routes + seeded language tags/micro-posts) is not met, per CLAUDE.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readThemeFile,
  themeFileExists,
  fetchHtml,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
} from "./helpers.mjs";

// --- 1a. sidebar.hbs partial exists and has a homepage branch ---

test("sidebar.hbs partial exists", () => {
  assert.ok(
    themeFileExists("partials/sidebar.hbs"),
    "partials/sidebar.hbs must exist"
  );
});

const sidebar = themeFileExists("partials/sidebar.hbs")
  ? readThemeFile("partials/sidebar.hbs")
  : "";

// --- 1b. Recent micro-post preview ---

test("sidebar fetches the most recent micro-post via the Content API helper", () => {
  // Same query as the micro feed, limited to the single most recent post:
  // filter tag:<lang>+tag:hash-micro, limit=1, page=1.
  assert.match(
    sidebar,
    /\{\{#get\s+"posts"/,
    "sidebar must {{#get \"posts\"}} the recent micro-post"
  );
  assert.match(
    sidebar,
    /tag:\{\{tag\.slug\}\}\+tag:hash-micro|tag:hash-micro\+tag:\{\{tag\.slug\}\}/,
    "sidebar micro query must filter by the language tag AND hash-micro"
  );
  assert.match(
    sidebar,
    /limit=("1"|1|'1')/,
    "sidebar micro query must use limit=1"
  );
});

test("sidebar renders the recent micro-post through the micro-card presentation", () => {
  assert.match(
    sidebar,
    /\{\{>\s*"?micro-card"?\}\}/,
    "sidebar must render the recent micro-post via the micro-card partial"
  );
});

// --- 1c. "view all micro-posts" link, language-relative ---

test("sidebar has a language-relative 'view all micro-posts' link", () => {
  // Declared as data-lang-href="micro/" so lang-switcher.js rewrites it to
  // /<code>/micro/ for the active language.
  assert.match(
    sidebar,
    /data-lang-href=["']micro\/["']/,
    "sidebar must declare data-lang-href=\"micro/\" for the view-all link"
  );
});

test("sidebar view-all link label is localizable via {{t}}", () => {
  assert.match(
    sidebar,
    /\{\{t\s+["'][^"']*[Mm]icro/,
    "the view-all label must route through {{t}}"
  );
});

// --- 1d. popular-tags block ---

test("sidebar renders a popular-tags block linking to tag pages", () => {
  // The popular tags are queried live; entries link to their tag pages.
  assert.match(
    sidebar,
    /\{\{#get\s+"tags"/,
    "sidebar must {{#get \"tags\"}} for the popular-tags block"
  );
  assert.match(
    sidebar,
    /popular-tags|sidebar-tags/,
    "sidebar must mark up a popular-tags block"
  );
  // Each entry links to the tag page (Ghost tag {{url}} -> /tag/<slug>/).
  assert.match(
    sidebar,
    /href=["']\{\{url\}\}["']/,
    "popular-tags entries must link to their tag page via {{url}}"
  );
});

test("popular-tags excludes internal tags", () => {
  // Internal (hash-) tags are not topics; the popular list shows public tags only.
  assert.match(
    sidebar,
    /visibility:public/,
    "popular-tags query must restrict to public tags"
  );
});

// --- 1e. index.hbs wires the sidebar into the two-column layout ---

const indexHbs = readThemeFile("index.hbs");

test("index.hbs renders the sidebar partial", () => {
  assert.match(
    indexHbs,
    /\{\{>\s*"?sidebar"?\}\}/,
    "index.hbs must include the sidebar partial"
  );
});

test("index.hbs places the sidebar inside the two-column home layout", () => {
  // The sidebar must live within the .home-layout grid alongside .post-feed so it
  // sits in the second column on wide screens and collapses below on narrow ones.
  const layout = indexHbs.match(/home-layout[\s\S]*?<\/div>\s*$/m) || [indexHbs];
  assert.match(
    indexHbs,
    /home-layout[\s\S]*\{\{>\s*"?sidebar"?\}\}/,
    "the sidebar must be rendered within the .home-layout container"
  );
});

// --- 1e-bis. micro-feed.js wires expand/collapse on the homepage (no stream) ---

const microFeed = readThemeFile("assets/js/micro-feed.js");

test("micro-feed.js wires expand/collapse even without a micro-stream (homepage sidebar)", () => {
  // On the homepage there is no [data-micro-stream] (that lives only on micro.hbs),
  // but the sidebar preview is a [data-micro-card] that must still get the shared
  // expand/collapse. The init path must therefore set up expand on the document
  // before any early return that depends on the stream container.
  const init = microFeed.match(/function init\(\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(init, "micro-feed.js must define init()");
  const body = init[0];
  const setupIdx = body.indexOf("setupExpandAll");
  const streamGuardIdx = body.search(/if\s*\(\s*!\s*stream\s*\)\s*return/);
  assert.notEqual(setupIdx, -1, "init() must call setupExpandAll");
  // setupExpandAll(document) must run regardless of whether a stream exists.
  assert.ok(
    streamGuardIdx === -1 || setupIdx < streamGuardIdx,
    "expand/collapse setup must not be skipped when there is no [data-micro-stream]"
  );
});

// --- 1f. locale strings ---

test("locales/en.json defines the sidebar chrome strings", () => {
  const en = JSON.parse(readThemeFile("locales/en.json"));
  const keys = Object.keys(en);
  assert.ok(
    keys.some((k) => /micro/i.test(k) && /(all|view|recent|latest)/i.test(k)),
    "locales/en.json should define a view-all / recent-micro label"
  );
  assert.ok(
    keys.some((k) => /tag/i.test(k)),
    "locales/en.json should define a popular-tags heading"
  );
});

// --- 1g. CSS: sidebar styling + responsive collapse ---

const screenCss = readThemeFile("assets/css/screen.css");

test("screen.css styles the sidebar in the dark system", () => {
  assert.match(
    screenCss,
    /\.(home-)?sidebar\b/,
    "a .sidebar (or .home-sidebar) style block is required"
  );
});

test("screen.css collapses the sidebar below the main column under 768px", () => {
  // The .home-layout grid drops to a single column at <=768px, stacking the
  // sidebar below .post-feed.
  const mq = screenCss.match(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?\n\}/);
  assert.ok(mq, "a max-width:768px media query block must exist");
  assert.match(
    mq[0],
    /\.home-layout\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
    ".home-layout must become a single 1fr column under 768px"
  );
});

// --- 2. Live rendered-HTML assertions (skip when precondition not met) ---

const ready = await liveLangRoutesReady();

test(
  "homepage renders a sidebar with a recent micro preview and a view-all micro link",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    assert.match(html, /home-sidebar|class="[^"]*sidebar/i, "sidebar missing on homepage");
    assert.match(
      html,
      /data-lang-href=["']micro\/["']/,
      "view-all micro link (data-lang-href) missing"
    );
  }
);

test(
  "homepage sidebar renders a popular-tags block linking to tag pages",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    assert.match(html, /popular-tags|sidebar-tags/, "popular-tags block missing");
    assert.match(html, /href="[^"]*\/tag\//, "popular-tags entries must link to /tag/ pages");
  }
);
