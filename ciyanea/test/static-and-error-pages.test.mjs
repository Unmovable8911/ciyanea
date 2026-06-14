// Slice 10 — Static page + error pages.
//
// Two test layers, matching the harness established in slice 1:
//
//  1. Static template-artifact assertions on the authored templates (the
//     canonical source). These prove page.hbs is a full-width single column with
//     no sidebar, and that error-404.hbs / error.hbs render a localized message
//     plus a return-to-homepage link — all chrome strings routed through {{t}}.
//
//  2. Live rendered-HTML assertions against the running Ghost instance (the PRD's
//     chosen seam). These skip when the operator precondition (activated theme +
//     routes + seeded content) is not met, per CLAUDE.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readThemeFile,
  themeFileExists,
  fetchHtml,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
} from "./helpers.mjs";

// --- 1a. page.hbs: full-width centered single column, no sidebar ---

test("page.hbs exists", () => {
  assert.ok(themeFileExists("page.hbs"), "page.hbs must exist");
});

const pageHbs = themeFileExists("page.hbs") ? readThemeFile("page.hbs") : "";

test("page.hbs extends the default layout", () => {
  assert.match(pageHbs, /\{\{!<\s*default\}\}/, "page.hbs must extend default");
});

test("page.hbs renders the page title and content", () => {
  assert.match(pageHbs, /\{\{title\}\}/, "page must render {{title}}");
  assert.match(pageHbs, /\{\{content\}\}/, "page must render {{content}}");
});

test("page.hbs is a single column with no sidebar", () => {
  // The full-width reading layout carries a hook class for the CSS, and must not
  // include any aside/sidebar element.
  assert.match(
    pageHbs,
    /class="[^"]*page[^"]*"/,
    "page must carry a page layout class hook"
  );
  assert.doesNotMatch(
    pageHbs,
    /<aside\b/i,
    "static page must not render a sidebar/aside"
  );
});

// --- 1b. error-404.hbs: localized not-found + return-home link ---

test("error-404.hbs exists", () => {
  assert.ok(themeFileExists("error-404.hbs"), "error-404.hbs must exist");
});

const error404 = themeFileExists("error-404.hbs")
  ? readThemeFile("error-404.hbs")
  : "";

test("error-404.hbs renders a localized not-found message via {{t}}", () => {
  assert.match(
    error404,
    /\{\{t\s+["'][^"']*["']/,
    "404 message must be routed through {{t}}"
  );
});

test("error-404.hbs renders a return-to-homepage link", () => {
  assert.match(
    error404,
    /href="\{\{@site\.url\}\}"/,
    "404 page must link back to the site homepage"
  );
});

test("error-404.hbs return-home label is localizable via {{t}}", () => {
  assert.match(
    error404,
    /\{\{t\s+["']Back to home["']/,
    "the return-home label must be emitted through {{t}}"
  );
});

// --- 1c. error.hbs: localized generic error + return-home link ---

test("error.hbs exists", () => {
  assert.ok(themeFileExists("error.hbs"), "error.hbs must exist");
});

const errorHbs = themeFileExists("error.hbs")
  ? readThemeFile("error.hbs")
  : "";

test("error.hbs renders a localized generic-error message via {{t}}", () => {
  assert.match(
    errorHbs,
    /\{\{t\s+["'][^"']*["']/,
    "generic error message must be routed through {{t}}"
  );
});

test("error.hbs renders a return-to-homepage link", () => {
  assert.match(
    errorHbs,
    /href="\{\{@site\.url\}\}"/,
    "error page must link back to the site homepage"
  );
});

// --- 1d. locale strings for the new chrome ---

test("locales/en.json defines the static/error chrome strings", () => {
  const en = JSON.parse(readThemeFile("locales/en.json"));
  for (const key of [
    "Back to home",
    "Page not found",
    "Something went wrong",
  ]) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(en, key),
      `locales/en.json must define the "${key}" string`
    );
  }
});

// --- 1e. screen.css: centered minimal error layout + full-width page ---

const screenCss = readThemeFile("assets/css/screen.css");

test("screen.css styles the full-width single-column static page", () => {
  assert.match(
    screenCss,
    /\.page-content\b|\.page\b/,
    "a page layout style block is required"
  );
});

test("screen.css styles the centered minimal error layout", () => {
  assert.match(
    screenCss,
    /\.error\b/,
    "an .error style block is required for the centered error layout"
  );
});

// --- 2. Live rendered-HTML assertions (skip when precondition not met) ---

const ready = await liveLangRoutesReady();

test(
  "a missing URL returns the localized 404 page with a return-home link",
  { skip: ready ? false : SKIP_LIVE_MSG },
  async () => {
    const { status, html } = await fetchHtml(
      `/this-url-definitely-does-not-exist-${Date.now()}/`
    );
    assert.equal(status, 404, "missing URL must return HTTP 404");
    assert.match(
      html,
      /href="[^"]*"/,
      "404 page must contain a return-home link"
    );
    assert.match(
      html,
      /class="[^"]*error[^"]*"/,
      "404 page must use the error layout"
    );
  }
);
