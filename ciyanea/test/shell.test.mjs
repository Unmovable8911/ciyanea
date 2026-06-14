// Asserts the dark base shell: default.hbs head loads Playfair Display + Inter and
// screen.css, the standard Ghost head/foot helpers are present, there is a header and
// footer, one chrome string is wired via {{t}}, and screen.css defines the documented
// color custom properties.
//
// These are static assertions on the authored theme templates/assets (the canonical
// source). When the live Ciyanea routes are activated, routing.test.mjs additionally
// asserts the same tokens/fonts appear in the actually-rendered HTML.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readThemeFile, extractBlock } from "./helpers.mjs";

const defaultHbs = readThemeFile("default.hbs");
const head = extractBlock(defaultHbs, "head") || defaultHbs;

test("default.hbs includes Ghost head and foot helpers", () => {
  assert.match(defaultHbs, /\{\{ghost_head\}\}/, "{{ghost_head}} required");
  assert.match(defaultHbs, /\{\{ghost_foot\}\}/, "{{ghost_foot}} required");
});

test("default.hbs <head> loads Playfair Display and Inter from Google Fonts", () => {
  assert.match(head, /fonts\.googleapis\.com/, "Google Fonts link required");
  assert.match(head, /Playfair(\+| )Display/, "Playfair Display font required");
  assert.match(head, /Inter/, "Inter font required");
});

test("default.hbs <head> links screen.css", () => {
  assert.match(
    head,
    /screen\.css/,
    "head must link the theme's screen.css stylesheet"
  );
});

test("default.hbs has a header and footer with nav/logo placeholder", () => {
  assert.match(defaultHbs, /<header\b/i, "site header required");
  assert.match(defaultHbs, /<footer\b/i, "site footer required");
});

test("default.hbs wires at least one chrome string via {{t}}", () => {
  assert.match(defaultHbs, /\{\{t\s+["']/, "at least one {{t \"...\"}} chrome string required");
});

// --- screen.css design tokens ---

const screenCss = readThemeFile("assets/css/screen.css");
const REQUIRED_TOKENS = [
  "--color-bg",
  "--color-bg-card",
  "--color-text",
  "--color-text-muted",
  "--color-accent",
  "--color-border",
];

for (const token of REQUIRED_TOKENS) {
  test(`screen.css defines ${token} custom property`, () => {
    assert.match(
      screenCss,
      new RegExp(`${token}\\s*:`),
      `${token} must be defined as a CSS custom property`
    );
  });
}

test("screen.css applies the dark background via --color-bg", () => {
  // body (or :root scope) should consume the background token.
  assert.match(screenCss, /background[^;]*var\(--color-bg\)/);
});

test("screen.css defines a responsive single-column breakpoint", () => {
  assert.match(
    screenCss,
    /@media[^{]*max-width:\s*768px/,
    "a <768px single-column breakpoint is required"
  );
});

test("locales/en.json exists and is valid JSON", () => {
  const en = JSON.parse(readThemeFile("locales/en.json"));
  assert.equal(typeof en, "object");
  assert.ok(en !== null);
});
