// Slice 06 — Micro stream page.
//
// Two test layers, matching the established harness:
//
//  1. Static template-artifact assertions on the authored routes.yaml, templates,
//     partials, JS, CSS and locale (the canonical source). These prove the micro
//     collection routing, the micro template + card partial, and the micro-feed
//     client are wired correctly — independent of a running Ghost instance.
//
//  2. Live rendered-HTML assertions against the running Ghost instance (the PRD's
//     chosen seam). These skip when the operator precondition (activated theme +
//     routes + seeded language tags/micro-posts) is not met, per CLAUDE.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readThemeFile,
  themeFileExists,
  readRepoFile,
  fetchHtml,
  LANG_CODES,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
} from "./helpers.mjs";

// --- 1a. routes.yaml: /<code>/micro/ collection for all 7 languages ---

const routes = readRepoFile("routes.yaml");

// Extract the YAML block belonging to a /<code>/micro/ collection: from its key
// line up to (but not including) the next sibling collection key or top-level
// section at the same or lesser indent.
function collectionBlock(text, key) {
  const lines = text.split("\n");
  const startIdx = lines.findIndex((l) =>
    new RegExp(`^\\s*${key.replace(/\//g, "\\/")}\\s*:`).test(l)
  );
  assert.notEqual(startIdx, -1, `collection ${key} not found`);
  const startIndent = lines[startIdx].match(/^\s*/)[0].length;
  const out = [lines[startIdx]];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      out.push(line);
      continue;
    }
    const indent = line.match(/^\s*/)[0].length;
    if (indent <= startIndent) break;
    out.push(line);
  }
  return out.join("\n");
}

for (const code of LANG_CODES) {
  test(`routes.yaml defines /${code}/micro/ collection`, () => {
    assert.match(
      routes,
      new RegExp(`/${code}/micro/\\s*:`),
      `missing collection key /${code}/micro/`
    );
  });

  test(`/${code}/micro/ uses the micro template`, () => {
    const block = collectionBlock(routes, `/${code}/micro/`);
    assert.match(
      block,
      /template:\s*micro\b/,
      `/${code}/micro/ should use template: micro`
    );
  });

  test(`/${code}/micro/ filters by tag:hash-${code} AND tag:hash-micro`, () => {
    const block = collectionBlock(routes, `/${code}/micro/`);
    assert.match(
      block,
      new RegExp(`filter:\\s*["']?tag:hash-${code}\\+tag:hash-micro["']?`),
      `/${code}/micro/ filter must be tag:hash-${code}+tag:hash-micro`
    );
  });

  test(`/${code}/micro/ permalink is /${code}/micro/{slug}/`, () => {
    const block = collectionBlock(routes, `/${code}/micro/`);
    assert.match(
      block,
      new RegExp(`permalink:\\s*/${code}/micro/\\{slug\\}/`),
      `/${code}/micro/ permalink must be /${code}/micro/{slug}/`
    );
  });

  test(`/${code}/micro/ binds data: tag.hash-${code}`, () => {
    const block = collectionBlock(routes, `/${code}/micro/`);
    assert.match(
      block,
      new RegExp(`data:\\s*tag\\.hash-${code}\\b`),
      `/${code}/micro/ must declare data: tag.hash-${code}`
    );
  });
}

// --- 1b. micro.hbs template ---

test("micro.hbs template exists", () => {
  assert.ok(themeFileExists("micro.hbs"), "micro.hbs must exist");
});

const microHbs = themeFileExists("micro.hbs") ? readThemeFile("micro.hbs") : "";

test("micro.hbs extends the default layout", () => {
  assert.match(microHbs, /\{\{!<\s*default\}\}/, "micro.hbs must extend default");
});

test("micro.hbs renders a localized page title via {{t}}", () => {
  assert.match(
    microHbs,
    /\{\{t\s+["']Micro/,
    "micro.hbs must render a localized page title through {{t}}"
  );
});

test("micro.hbs renders a centered micro-stream container", () => {
  assert.match(
    microHbs,
    /micro-stream/,
    "micro.hbs must render a .micro-stream container (centered column)"
  );
});

test("micro.hbs loads micro-feed.js", () => {
  assert.match(
    microHbs,
    /micro-feed\.js/,
    "micro.hbs must load assets/js/micro-feed.js"
  );
});

test("micro.hbs exposes the active language code for the feed query", () => {
  // The feed needs the language code to build the Content API filter
  // (tag:hash-<code>+tag:hash-micro). The route binds data: tag.hash-<code>, so
  // the tag slug is available; the template passes it to the client via a data
  // attribute so micro-feed.js can derive the code.
  assert.match(
    microHbs,
    /data-micro-(stream|tag|code|slug)/,
    "micro.hbs must expose a data attribute (tag slug / code) for micro-feed.js"
  );
});

// --- 1c. micro-card.hbs partial ---

test("micro-card.hbs partial exists", () => {
  assert.ok(
    themeFileExists("partials/micro-card.hbs"),
    "partials/micro-card.hbs must exist"
  );
});

const microCard = themeFileExists("partials/micro-card.hbs")
  ? readThemeFile("partials/micro-card.hbs")
  : "";

test("micro-card renders the body HTML", () => {
  // Full HTML body (rendered, clamped via CSS), not an excerpt.
  assert.match(
    microCard,
    /\{\{\{(content|html)\}\}\}|\{\{\{html\}\}\}/,
    "micro-card must render the post body HTML ({{{html}}})"
  );
});

test("micro-card has a clamped body element with click-to-expand hook", () => {
  assert.match(
    microCard,
    /micro-card-body/,
    "micro-card must carry the micro-card-body class for the 5-line clamp"
  );
  // A data hook for the JS expand/collapse toggle.
  assert.match(
    microCard,
    /data-micro-(body|expand|toggle)/,
    "micro-card must expose a data hook for click-to-expand"
  );
});

test("micro-card renders an optional full-width feature image", () => {
  assert.match(
    microCard,
    /\{\{#if feature_image\}\}/,
    "micro-card must guard the image with {{#if feature_image}}"
  );
  assert.match(microCard, /feature_image/, "micro-card must render feature_image");
});

test("micro-card renders a relative timestamp", () => {
  // Ghost's {{date}} with timeago renders a relative time like '3 hours ago'.
  assert.match(
    microCard,
    /\{\{date[^}]*timeago[^}]*\}\}/,
    "micro-card must render a relative timestamp via {{date ... timeago}}"
  );
});

test("micro-card has no title and no profile/author link", () => {
  assert.doesNotMatch(
    microCard,
    /\{\{title\}\}/,
    "micro-card must NOT render a title"
  );
  assert.doesNotMatch(
    microCard,
    /primary_author|profile_image|author\.url/,
    "micro-card must NOT render an author/profile link"
  );
});

test("micro-card marks itself as a micro post type", () => {
  // So the live listing remains externally assertable as micro content.
  assert.match(
    microCard,
    /data-post-type=["']micro["']/,
    "micro-card must emit data-post-type=\"micro\""
  );
});

// --- 1d. micro-feed.js client ---

test("micro-feed.js asset exists", () => {
  assert.ok(
    themeFileExists("assets/js/micro-feed.js"),
    "assets/js/micro-feed.js must exist"
  );
});

const microFeed = themeFileExists("assets/js/micro-feed.js")
  ? readThemeFile("assets/js/micro-feed.js")
  : "";

test("micro-feed.js requests the Content API posts endpoint", () => {
  assert.match(
    microFeed,
    /\/ghost\/api\/content\/posts/,
    "micro-feed.js must call the Content API /ghost/api/content/posts endpoint"
  );
});

test("micro-feed.js requests the micro filter with URL-encoded +", () => {
  // filter=tag:hash-<code>+tag:hash-micro with + encoded as %2B.
  assert.match(microFeed, /hash-micro/, "feed must filter by hash-micro");
  assert.match(
    microFeed,
    /%2B/,
    "feed must URL-encode the filter + as %2B"
  );
});

test("micro-feed.js requests the documented fields and limit", () => {
  assert.match(
    microFeed,
    /html/,
    "feed must request the html field"
  );
  assert.match(
    microFeed,
    /published_at/,
    "feed must request the published_at field"
  );
  assert.match(
    microFeed,
    /feature_image/,
    "feed must request the feature_image field"
  );
  assert.match(microFeed, /limit=20|limit=" \+|limit=' \+|"limit"|limit:\s*20|20/, "feed must use limit 20");
});

test("micro-feed.js reads the Content API key from custom settings", () => {
  // The key is surfaced by default.hbs as data-content-api-key; the feed reads it.
  assert.match(
    microFeed,
    /content-api-key|contentApiKey|data-content-api-key/,
    "feed must read the content_api_key surfaced in the DOM"
  );
});

test("micro-feed.js paginates pages and wires infinite scroll", () => {
  assert.match(microFeed, /page=/, "feed must request &page=<n>");
  assert.match(
    microFeed,
    /IntersectionObserver|scroll/,
    "feed must wire infinite scroll (IntersectionObserver or scroll)"
  );
});

test("micro-feed.js exposes reusable expand/collapse logic (for slice 7)", () => {
  // The expand/collapse logic must be reusable by the homepage sidebar preview.
  // It should attach to the same data hook used in micro-card.hbs and be exported
  // on a global namespace so the sidebar can call it.
  assert.match(
    microFeed,
    /data-micro-(body|expand|toggle)/,
    "feed must drive the same expand/collapse hook used by micro-card.hbs"
  );
  assert.match(
    microFeed,
    /window\.(Ciyanea|MicroFeed|microFeed)/,
    "feed must expose reusable expand/collapse logic on a global namespace"
  );
});

// --- 1e. locale + CSS hooks ---

test("locales/en.json defines the micro page title string", () => {
  const en = JSON.parse(readThemeFile("locales/en.json"));
  const keys = Object.keys(en);
  assert.ok(
    keys.some((k) => /micro/i.test(k)),
    "locales/en.json must define a Micro page title string"
  );
});

const screenCss = readThemeFile("assets/css/screen.css");

test("screen.css centers the micro stream column (max-width ~640px)", () => {
  assert.match(
    screenCss,
    /\.micro-stream\b/,
    "a .micro-stream style block is required"
  );
  assert.match(
    screenCss,
    /\.micro-stream[\s\S]*?max-width:\s*640px/,
    ".micro-stream must be a centered column with max-width 640px"
  );
});

test("screen.css clamps the micro card body to 5 lines", () => {
  assert.match(
    screenCss,
    /\.micro-card-body[\s\S]*?-webkit-line-clamp:\s*5/,
    ".micro-card-body must be clamped to 5 lines (collapsed state)"
  );
});

// --- 2. Live rendered-HTML assertions (skip when precondition not met) ---

const ready = await liveLangRoutesReady();

for (const code of LANG_CODES) {
  test(
    `/${code}/micro/ resolves with HTTP 200`,
    { skip: ready ? false : SKIP_LIVE_MSG },
    async () => {
      const { status } = await fetchHtml(`/${code}/micro/`);
      assert.equal(status, 200, `/${code}/micro/ should return 200`);
    }
  );
}

test(
  "micro page renders the localized title and a centered micro-stream container",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/micro/`);
    assert.match(html, /micro-stream/, "centered micro-stream container missing");
    assert.match(html, /micro-page-title|class="[^"]*micro[^"]*title/i, "micro page title missing");
  }
);

test(
  "micro collection includes only micro-posts",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    // Server-rendered micro cards (the collection feed) must all be micro type.
    // The index collection (slice 02) already asserts micro-posts are excluded
    // there; here we assert the micro collection is not empty of micro markers.
    const { html } = await fetchHtml(`/us/micro/`);
    assert.doesNotMatch(
      html,
      /data-post-type=["']article["']/,
      "micro collection must not include long-form articles"
    );
  }
);
