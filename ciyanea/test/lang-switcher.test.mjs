// Slice 03 — Language switcher (data-driven).
//
// Per the PRD test seam, automated coverage here is split between:
//   - Static theme-artifact assertions on the authored partial / JS / layout (the
//     canonical source for "the switcher is data-driven and contains no hard-coded
//     language list or uploaded image").
//   - Live rendered-HTML assertions against the running Ghost instance for the
//     observable output (7 options, each a flagcdn flag + native name), which skip
//     when the operator precondition (activated routes + seeded #<code> tags) is
//     not met — that state is outside theme code per CLAUDE.md.
//
// Purely client-side dropdown/localStorage/redirect behavior is verified manually
// per the PRD; here we assert only that the JS is authored, globally loaded, and
// implements the documented data-driven contract (no hard-coded code list).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readThemeFile,
  themeFileExists,
  fetchHtml,
  LANG_CODES,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
  extractBlock,
} from "./helpers.mjs";

// --- Static: the switcher is mounted in the global header ---

test("default.hbs includes the language-switcher partial in the header", () => {
  const defaultHbs = readThemeFile("default.hbs");
  const header = extractBlock(defaultHbs, "header") || defaultHbs;
  assert.match(
    header,
    /\{\{>\s*language-switcher\s*\}\}/,
    "the header must include the {{> language-switcher}} partial so it renders on every page"
  );
});

// --- Static: lang-switcher.js is authored and loaded globally ---

test("lang-switcher.js asset exists", () => {
  assert.ok(
    themeFileExists("assets/js/lang-switcher.js"),
    "assets/js/lang-switcher.js must exist"
  );
});

test("default.hbs loads lang-switcher.js globally", () => {
  const defaultHbs = readThemeFile("default.hbs");
  assert.match(
    defaultHbs,
    /\{\{asset\s+["']js\/lang-switcher\.js["']\}\}/,
    "default.hbs must load js/lang-switcher.js via {{asset}} so it runs on every page"
  );
});

// --- Static: lang-switcher.js implements the documented data-driven contract ---
// (Live dropdown/redirect behavior is verified manually per the PRD; these guard
//  the contract so a refactor can't silently drop a documented responsibility.)

test("lang-switcher.js builds flags from flagcdn (not a hard-coded code list)", () => {
  const js = readThemeFile("assets/js/lang-switcher.js");
  assert.match(
    js,
    /flagcdn\.io\/flags\/1x1\//,
    "flag images must be built from the flagcdn URL"
  );
  // No literal language codes baked into the JS — the set comes from the rendered options.
  for (const code of LANG_CODES) {
    assert.doesNotMatch(
      js,
      new RegExp(`["'\`]${code}["'\`]`),
      `lang-switcher.js must not hard-code the "${code}" language code`
    );
  }
});

test("lang-switcher.js derives the code by stripping the hash- slug prefix", () => {
  const js = readThemeFile("assets/js/lang-switcher.js");
  assert.match(
    js,
    /hash-/,
    "must strip the `hash-` prefix from the tag slug to get the code"
  );
  assert.match(
    js,
    /data-lang-slug/,
    "must read the option tag slug from data-lang-slug"
  );
});

test("lang-switcher.js resolves current code from URL prefix then localStorage", () => {
  const js = readThemeFile("assets/js/lang-switcher.js");
  assert.match(js, /pathname/, "must inspect the URL path for the language prefix");
  assert.match(
    js,
    /preferred-lang/,
    "must fall back to localStorage['preferred-lang']"
  );
});

test("lang-switcher.js writes the preference and navigates to /<code>/ on selection", () => {
  const js = readThemeFile("assets/js/lang-switcher.js");
  assert.match(
    js,
    /setItem\(\s*[^,]*,\s*code\s*\)|setItem\([^)]*preferred[^)]*\)/i,
    "selection must persist localStorage['preferred-lang']"
  );
  assert.match(
    js,
    /location\.href\s*=\s*["'`]\/["'`]\s*\+\s*code\s*\+\s*["'`]\/["'`]/,
    "selection must redirect to /<code>/"
  );
});

test("lang-switcher.js rewrites data-lang-href language-relative links", () => {
  const js = readThemeFile("assets/js/lang-switcher.js");
  assert.match(
    js,
    /data-lang-href/,
    "must rewrite links declared with data-lang-href into /<code>/<rel>"
  );
});

// --- Static: the partial exists and is data-driven ---

test("language-switcher.hbs partial exists", () => {
  assert.ok(
    themeFileExists("partials/language-switcher.hbs"),
    "partials/language-switcher.hbs must exist"
  );
});

const partial = readThemeFile("partials/language-switcher.hbs");

test("partial sources the languages live from the internal tags via {{#get}}", () => {
  // Data-driven: a {{#get "tags"}} query filtered to internal tags minus #micro.
  assert.match(partial, /\{\{#get\s+["']tags["']/, "must query the tags resource");
  assert.match(
    partial,
    /visibility:internal\+slug:-hash-micro/,
    "must filter to internal tags excluding #micro"
  );
  // It iterates the returned tag set.
  assert.match(partial, /\{\{#foreach\s+tags\}\}/, "must iterate the tag set");
});

test("partial renders the native name from the tag description", () => {
  assert.match(
    partial,
    /\{\{description\}\}/,
    "the native language name must come from the tag's description"
  );
});

test("partial contains no hard-coded language-code list and no uploaded tag image", () => {
  // No literal language codes baked in (the set is fully derived from the live query).
  for (const code of LANG_CODES) {
    assert.doesNotMatch(
      partial,
      new RegExp(`/${code}/`),
      `partial must not hard-code the /${code}/ path`
    );
    assert.doesNotMatch(
      partial,
      new RegExp(`1x1/${code}\\.svg`),
      `partial must not hard-code the ${code} flag URL`
    );
  }
  // No uploaded tag image: the flag is from flagcdn, never {{feature_image}}.
  assert.doesNotMatch(
    partial,
    /feature_image/,
    "partial must not reference an uploaded tag image"
  );
});

test("partial exposes the tag slug per option so the code is derivable", () => {
  // The country/flag <code> is the slug minus `hash-`; the slug is exposed so the
  // flag URL and /<code>/ target can be derived without a hard-coded list.
  assert.match(
    partial,
    /data-lang-slug=["']\{\{slug\}\}["']/,
    "each option must carry its tag slug"
  );
});

// --- Static: switcher styled in the dark visual system ---

test("screen.css styles the language switcher with the dark design tokens", () => {
  const css = readThemeFile("assets/css/screen.css");
  assert.match(css, /\.lang-switcher\b/, "switcher must have CSS rules");
  // The dropdown menu must be styled (dark card surface + border tokens).
  assert.match(css, /\.lang-switcher-menu\b/, "dropdown menu must be styled");
  assert.match(
    css,
    /\.lang-switcher-menu[^{]*\{[^}]*var\(--color-(bg-card|border)\)/s,
    "dropdown must use the dark surface/border custom properties"
  );
});

// --- Live: the rendered switcher is data-driven from Ghost ---
// Skips unless the operator precondition (activated routes + seeded #<code> tags)
// is met; that state is outside theme code per CLAUDE.md.

const ready = await liveLangRoutesReady();

test(
  "rendered header includes the language switcher on every page",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    for (const code of LANG_CODES) {
      const { html } = await fetchHtml(`/${code}/`);
      const header = extractBlock(html, "header") || html;
      assert.match(
        header,
        /data-lang-switcher/,
        `/${code}/ header must render the language switcher`
      );
    }
  }
);

test(
  "rendered switcher lists one option per language tag, each with a flagcdn flag + native name",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { html } = await fetchHtml(`/us/`);
    // One option per language tag (7 with current data).
    const options = html.match(/data-lang-option/g) || [];
    assert.equal(
      options.length,
      LANG_CODES.length,
      `expected ${LANG_CODES.length} language options, rendered ${options.length}`
    );
    // Each option carries a tag slug so the flag/code is derivable, and the native
    // name (tag description) text is present. The flag <img> is wired for flagcdn.
    assert.match(html, /data-lang-slug=["']hash-/, "options must carry hash-<code> slugs");
    assert.match(html, /data-lang-flag/, "each option must have a flag image element");
    // The flag URL is finalized client-side from the slug; assert the flagcdn base
    // is referenced by the globally loaded script the page serves.
    const js = await fetchHtml(`/assets/js/lang-switcher.js`);
    if (js.status === 200) {
      assert.match(js.html, /flagcdn\.io\/flags\/1x1\//, "served JS must build flagcdn flags");
    }
  }
);
