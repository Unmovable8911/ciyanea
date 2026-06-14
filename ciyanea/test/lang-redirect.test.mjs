// Slice 04 — Root language detection & redirect.
//
// Per the PRD test seam, the redirect *outcome* is verified manually (it is a
// purely client-side localStorage/navigator.language behavior with no
// distinguishing server-rendered HTML). The automated tests here assert the
// theme artifacts that produce that behavior:
//   - routes.yaml maps `/` to the lang-redirect template,
//   - lang-redirect.hbs renders a no-content shell (no article/body content),
//     includes the lang-detect.js script tag, and injects the Ghost-derived
//     supported code list (no hard-coded list in the JS),
//   - lang-detect.js implements the localStorage -> navigator.language -> /us/
//     precedence reading the injected (not hard-coded) supported set.
//
// These are static assertions on the authored theme files (the canonical
// source), consistent with the other static suites in this harness.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readRepoFile,
  readThemeFile,
  themeFileExists,
  hasTagWithAttrs,
  fetchHtml,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
} from "./helpers.mjs";

// --- routes.yaml ---

const routes = readRepoFile("routes.yaml");

test("routes.yaml maps / to the lang-redirect template", () => {
  // A root route `/` rendering the lang-redirect template, declared under
  // `routes:` (not `collections:`). Inline flow-mapping form is used —
  // `/: {template: lang-redirect}` — so the root route is a single static
  // route, not a collection.
  assert.match(
    routes,
    /\n {2}\/:\s*\{[^}]*template:\s*lang-redirect[^}]*\}/,
    "routes.yaml must declare a `/` route rendering template: lang-redirect"
  );
});

test("routes.yaml root route is a static route, not a collection", () => {
  // The `/` route must live under the `routes:` section, above `collections:`.
  const routesSection = routes.split(/\ncollections:/)[0];
  assert.match(
    routesSection,
    /\n {2}\/:\s*\{[^}]*template:\s*lang-redirect/,
    "the `/` lang-redirect route must be declared under `routes:`"
  );
});

// --- lang-redirect.hbs (no-content shell + script tag) ---

test("lang-redirect.hbs exists", () => {
  assert.ok(
    themeFileExists("lang-redirect.hbs"),
    "lang-redirect.hbs template must exist"
  );
});

const langRedirect = themeFileExists("lang-redirect.hbs")
  ? readThemeFile("lang-redirect.hbs")
  : "";

test("lang-redirect.hbs includes the lang-detect.js script tag", () => {
  assert.ok(
    hasTagWithAttrs(langRedirect, "script", ["lang-detect.js"]),
    "lang-redirect.hbs must include a <script> tag loading lang-detect.js"
  );
});

test("lang-redirect.hbs is a no-content shell (no article/body content)", () => {
  // No visible body content / article markup that would flash before redirect.
  assert.doesNotMatch(
    langRedirect,
    /<article\b/i,
    "the redirect shell must render no <article> content"
  );
  assert.doesNotMatch(
    langRedirect,
    /\{\{\{?body\}?\}\}/,
    "the redirect shell must not render Ghost body content"
  );
  assert.doesNotMatch(
    langRedirect,
    /\{\{#foreach\s+posts\b/,
    "the redirect shell must not loop/list any posts"
  );
});

test("lang-redirect.hbs derives the supported codes live from Ghost language tags", () => {
  // The supported set is queried from Ghost: internal tags excluding #micro.
  assert.match(
    langRedirect,
    /\{\{#get\s+["']tags["'][^}]*filter=["']visibility:internal\+slug:-hash-micro["']/,
    "lang-redirect.hbs must query the language tags via {{#get \"tags\" filter=\"visibility:internal+slug:-hash-micro\"}}"
  );
  // and iterate them, emitting each slug for the JS variable.
  assert.match(
    langRedirect,
    /\{\{slug\}\}/,
    "lang-redirect.hbs must inject each tag slug into the supported-codes JS variable"
  );
});

test("lang-redirect.hbs injects the derived codes into a JS variable lang-detect.js reads", () => {
  // A JS global is populated from the Ghost query (between the {{#get}} block and
  // the script that consumes it). The variable name is the contract with
  // lang-detect.js.
  assert.match(
    langRedirect,
    /window\.CIYANEA_SUPPORTED_LANGS\s*=/,
    "lang-redirect.hbs must set window.CIYANEA_SUPPORTED_LANGS from the Ghost-derived codes"
  );
});

test("lang-redirect.hbs hard-codes no language code list", () => {
  // The codes (cn/us/de/fr/ru/it/es) must not appear as a literal list in the
  // template — they come only from the live {{#get}}.
  const codeLiterals = (langRedirect.match(/["'](cn|us|de|fr|ru|it|es)["']/g) || []);
  assert.equal(
    codeLiterals.length,
    0,
    `lang-redirect.hbs must not hard-code language codes; found ${JSON.stringify(codeLiterals)}`
  );
});

// --- lang-detect.js (detection precedence; codes not hard-coded) ---

test("lang-detect.js exists", () => {
  assert.ok(
    themeFileExists("assets/js/lang-detect.js"),
    "assets/js/lang-detect.js must exist"
  );
});

const langDetect = themeFileExists("assets/js/lang-detect.js")
  ? readThemeFile("assets/js/lang-detect.js")
  : "";

// Code (comments stripped) so assertions about hard-coded literals only inspect
// executable source, not explanatory comments/examples.
const langDetectCode = langDetect
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

test("lang-detect.js reads the Ghost-injected supported set, not a hard-coded list", () => {
  assert.match(
    langDetectCode,
    /CIYANEA_SUPPORTED_LANGS/,
    "lang-detect.js must read window.CIYANEA_SUPPORTED_LANGS injected by lang-redirect.hbs"
  );
  // No hard-coded language-code list in the executable JS. The documented /us/
  // default fallback is the only permitted code literal.
  const codeLiterals = langDetectCode.match(/["'](cn|us|de|fr|ru|it|es)["']/g) || [];
  const nonDefault = codeLiterals.filter((lit) => !/["']us["']/.test(lit));
  assert.equal(
    nonDefault.length,
    0,
    `lang-detect.js must not hard-code a language-code list (only the /us/ default is allowed); found ${JSON.stringify(nonDefault)}`
  );
});

test("lang-detect.js follows localStorage -> navigator.language -> /us/ precedence", () => {
  assert.match(
    langDetect,
    /localStorage\b[\s\S]*["']preferred-lang["']/,
    "lang-detect.js must read localStorage['preferred-lang'] first"
  );
  assert.match(
    langDetect,
    /navigator\.language/,
    "lang-detect.js must consider navigator.language when no stored preference"
  );
  assert.match(
    langDetect,
    /\/us\//,
    "lang-detect.js must fall back to /us/ when nothing matches"
  );
});

test("lang-detect.js considers both region and primary subtag of navigator.language", () => {
  // e.g. zh-CN -> cn (region) and en-US -> us (region); also fall back to the
  // primary subtag. A split on "-" (and lowercasing) demonstrates this.
  assert.match(
    langDetect,
    /\.split\(\s*["']-["']\s*\)|\.toLowerCase\(\)/,
    "lang-detect.js must parse navigator.language into subtags (split on '-')"
  );
});

test("lang-detect.js writes the chosen code to localStorage and redirects", () => {
  // The key may be referenced directly or via a constant; assert both a
  // localStorage.setItem call and that the 'preferred-lang' key is used for it.
  assert.match(
    langDetectCode,
    /localStorage\.setItem\s*\(/,
    "lang-detect.js must persist the chosen code via localStorage.setItem"
  );
  assert.match(
    langDetectCode,
    /["']preferred-lang["']/,
    "lang-detect.js must use the 'preferred-lang' localStorage key"
  );
  assert.match(
    langDetectCode,
    /location\.(replace|assign|href)/,
    "lang-detect.js must redirect via window.location"
  );
});

// --- live rendered-HTML (gated; routes-activation is an operator step) ---
//
// When the Ciyanea multi-language routes are activated in Ghost, a request to `/`
// renders the lang-redirect shell. The redirect outcome itself is client-side and
// verified manually; here we assert the *server-rendered* shell that drives it:
// no article/body content + the lang-detect.js script tag + the injected codes.

const ready = await liveLangRoutesReady();

test("GET / renders the no-content shell with the detection script", { skip: ready ? false : SKIP_LIVE_MSG }, async () => {
  const { status, html } = await fetchHtml("/");
  assert.equal(status, 200, "GET / should render (200) the lang-redirect shell");
  assert.doesNotMatch(html, /<article\b/i, "the root shell must render no article content");
  assert.match(html, /lang-detect\.js/, "the root shell must load lang-detect.js");
  assert.match(
    html,
    /CIYANEA_SUPPORTED_LANGS\s*=/,
    "the root shell must inject the Ghost-derived supported code list"
  );
});
