// Slice 11 — Localization completion (7 locales).
//
// This slice completes UI-chrome localization across all seven languages so the
// interface matches the content language everywhere. Per the PRD, locale files
// are named by Ghost's *language* locale code (zh, en, de, fr, ru, it, es),
// which differs from the route/flag code only for Chinese (zh<->cn) and
// English (en<->us).
//
// Two test layers, matching the harness established in earlier slices:
//
//  1. Static artifact assertions on the authored locale files + templates:
//       - a locales/<lang>.json exists for all 7 languages
//       - every {{t}} key used by the theme is present in every locale file
//       - no locale file leaves a chrome key untranslated *for non-English*
//         (i.e. translated value differs from the English source, so the spot
//         check below has something to observe)
//       - the templates route all visible chrome through {{t}} (no hard-coded
//         English chrome strings)
//
//  2. Live rendered-HTML assertions against the running Ghost instance (the
//     PRD's chosen seam). Ghost i18n is site-wide, so a single publication
//     locale is active at a time; these skip when the operator precondition
//     (activated theme + routes + seeded content) is not met, per CLAUDE.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  THEME_DIR,
  readThemeFile,
  themeFileExists,
} from "./helpers.mjs";

// Ghost *language* locale codes (distinct from route/flag codes).
const LOCALE_CODES = ["zh", "en", "de", "fr", "ru", "it", "es"];

// English is the reference locale: the full set of {{t}} keys lives here.
const REFERENCE_LOCALE = "en";

// --- Derive the authoritative key set from the templates themselves ---

function listHbsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHbsFiles(full));
    else if (entry.name.endsWith(".hbs")) out.push(full);
  }
  return out;
}

function collectTranslationKeys() {
  const keys = new Set();
  // Matches both the block form {{t "..."}} and the subexpression form (t "...")
  // used inside helpers like {{plural ... singular=(t "1 post")}}.
  const re = /\(?\bt\s+"((?:[^"\\]|\\.)*)"/g;
  for (const file of listHbsFiles(THEME_DIR)) {
    const src = fs.readFileSync(file, "utf8");
    let m;
    while ((m = re.exec(src)) !== null) {
      keys.add(m[1]);
    }
  }
  return [...keys];
}

const usedKeys = collectTranslationKeys();

test("templates use at least one {{t}} chrome key (sanity)", () => {
  assert.ok(usedKeys.length > 0, "expected the theme to use {{t}} keys");
});

// --- 1a. all 7 locale files exist ---

for (const code of LOCALE_CODES) {
  test(`locales/${code}.json exists`, () => {
    assert.ok(
      themeFileExists(`locales/${code}.json`),
      `locales/${code}.json must exist`
    );
  });
}

// --- 1b. each locale parses as valid JSON ---

function loadLocale(code) {
  return JSON.parse(readThemeFile(`locales/${code}.json`));
}

for (const code of LOCALE_CODES) {
  test(`locales/${code}.json is valid JSON`, () => {
    assert.doesNotThrow(() => loadLocale(code), `locales/${code}.json must parse`);
  });
}

// --- 1c. every used {{t}} key is present in every locale file ---

for (const code of LOCALE_CODES) {
  test(`locales/${code}.json defines every {{t}} key used by the theme`, () => {
    const locale = loadLocale(code);
    const missing = usedKeys.filter(
      (k) => !Object.prototype.hasOwnProperty.call(locale, k)
    );
    assert.deepEqual(
      missing,
      [],
      `locales/${code}.json is missing keys: ${missing.join(", ")}`
    );
  });
}

// --- 1d. no locale file carries keys the theme no longer uses ---
// Keeps the locale files honest and in sync; the reference (en) defines the
// canonical key set and every locale must match it exactly.

const referenceKeys = Object.keys(loadLocale(REFERENCE_LOCALE)).sort();

for (const code of LOCALE_CODES) {
  test(`locales/${code}.json has exactly the reference key set`, () => {
    const keys = Object.keys(loadLocale(code)).sort();
    assert.deepEqual(
      keys,
      referenceKeys,
      `locales/${code}.json keys must match locales/${REFERENCE_LOCALE}.json`
    );
  });
}

// every reference key must itself be a key the theme actually uses, so the
// locale files never drift away from the templates.
test("the reference locale defines no keys absent from the templates", () => {
  const unused = referenceKeys.filter((k) => !usedKeys.includes(k));
  assert.deepEqual(
    unused,
    [],
    `locales/${REFERENCE_LOCALE}.json defines keys not used by any template: ${unused.join(
      ", "
    )}`
  );
});

// --- 1e. non-English locales actually translate the chrome ---
// A locale that just copies the English value provides no localization. Require
// each non-English locale to differ from English on a meaningful majority of
// keys, so the rendered HTML genuinely changes per language. (Proper nouns or
// shared tokens may legitimately match, hence "majority" rather than "all".)

const en = loadLocale(REFERENCE_LOCALE);

for (const code of LOCALE_CODES.filter((c) => c !== REFERENCE_LOCALE)) {
  test(`locales/${code}.json provides genuinely translated values`, () => {
    const locale = loadLocale(code);
    const translated = referenceKeys.filter((k) => locale[k] !== en[k]);
    assert.ok(
      translated.length >= Math.ceil(referenceKeys.length * 0.6),
      `locales/${code}.json appears to mostly copy English (` +
        `${translated.length}/${referenceKeys.length} keys translated)`
    );
  });
}

// --- 1f. no hard-coded English chrome outside {{t}} ---
// Audit the authored templates for visible chrome strings that bypass {{t}}.
// We assert on the specific chrome phrases the issue calls out; if any appears
// as literal template text (not as a {{t "..."}} argument), it is hard-coded.

const HARD_CODED_CHROME_PHRASES = [
  "View all micro-posts",
  "Table of contents",
  "Related posts",
  "Page not found",
  "Something went wrong",
  "Back to home",
  "Popular tags",
  "Featured posts",
  "About the author",
];

// Strip Handlebars comments ({{!-- ... --}} and {{! ... }}) so developer notes
// that happen to mention a chrome phrase don't count as rendered output.
function stripHbsComments(src) {
  return src
    .replace(/\{\{!--[\s\S]*?--\}\}/g, "")
    .replace(/\{\{![\s\S]*?\}\}/g, "");
}

test("no called-out chrome phrase is hard-coded outside {{t}}", () => {
  for (const file of listHbsFiles(THEME_DIR)) {
    const src = stripHbsComments(fs.readFileSync(file, "utf8"));
    for (const phrase of HARD_CODED_CHROME_PHRASES) {
      // Find every occurrence of the literal phrase; each must be immediately
      // preceded by a `t "` (the translation helper opening its argument).
      let idx = src.indexOf(phrase);
      while (idx !== -1) {
        const before = src.slice(Math.max(0, idx - 8), idx);
        assert.match(
          before,
          /t\s+"$/,
          `"${phrase}" appears hard-coded (not via {{t}}) in ${path.basename(
            file
          )}`
        );
        idx = src.indexOf(phrase, idx + phrase.length);
      }
    }
  }
});
