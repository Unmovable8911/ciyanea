// Dependency-light rendered-HTML test harness for the Ciyanea Ghost theme.
//
// Per the PRD, the chosen test seam is "rendered-HTML assertions against the
// running local Ghost instance". This helper provides:
//   - fetchHtml(path): HTTP GET against the live Ghost URL, returning { status, html, headers }
//   - a tiny DOM-lite query layer (tag/attribute extraction by regex) so tests can
//     assert on externally observable rendered output without pulling a DOM library.
//
// It is intentionally free of external npm dependencies; it relies only on Node's
// built-in global fetch (Node >= 18).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BASE_URL = process.env.GHOST_URL || "http://localhost:53368";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Theme root is the parent of the test/ directory.
export const THEME_DIR = path.resolve(__dirname, "..");

// The seven language partition codes (country/flag codes). These are the
// expected codes; the theme itself derives them from tag slugs, but the test
// suite asserts the routes file covers exactly this set.
export const LANG_CODES = ["cn", "us", "de", "fr", "ru", "it", "es"];

export function readThemeFile(relPath) {
  return fs.readFileSync(path.join(THEME_DIR, relPath), "utf8");
}

export function themeFileExists(relPath) {
  return fs.existsSync(path.join(THEME_DIR, relPath));
}

// The repo-root routes.yaml (the file Ghost ultimately loads) lives one level
// above the theme directory.
export function readRepoFile(relPath) {
  return fs.readFileSync(path.resolve(THEME_DIR, "..", relPath), "utf8");
}

export async function fetchHtml(p) {
  const url = p.startsWith("http") ? p : BASE_URL + p;
  const res = await fetch(url, { redirect: "manual" });
  const html = await res.text();
  return { status: res.status, html, headers: res.headers, url };
}

// --- tiny DOM-lite helpers (regex based) ---

// Return true if the document contains an element matching the given tag with
// all of the provided attribute substrings present somewhere in its opening tag.
export function hasTagWithAttrs(html, tag, attrSubstrings = []) {
  const re = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  const matches = html.match(re) || [];
  return matches.some((openTag) =>
    attrSubstrings.every((s) => openTag.includes(s))
  );
}

export function countTags(html, tag) {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) || []).length;
}

// Extract the contents of the first matching block element (non-nested-safe for
// simple uses like <head>...</head> or <footer>...</footer>).
export function extractBlock(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = html.match(re);
  return m ? m[1] : null;
}

export function hasText(html, text) {
  return html.includes(text);
}

// Determine whether the live Ghost instance is currently serving the Ciyanea
// theme with the multi-language routes activated and language content seeded.
// Several acceptance criteria require activated routes + seeded internal tags +
// posts in Ghost, which (per CLAUDE.md) the theme code cannot create — that is an
// admin/operator step. When the precondition is not met, live rendered-HTML
// tests skip with a clear message instead of failing spuriously.
let _livePreconditionCache;
export async function liveLangRoutesReady() {
  if (_livePreconditionCache !== undefined) return _livePreconditionCache;
  try {
    const probe = await fetchHtml(`/${LANG_CODES[1]}/`); // /us/
    _livePreconditionCache = probe.status === 200;
  } catch {
    _livePreconditionCache = false;
  }
  return _livePreconditionCache;
}

export const SKIP_LIVE_MSG =
  "live precondition not met: Ciyanea theme + multi-language routes.yaml must be " +
  "activated in Ghost and the #<code> internal tags + posts seeded (operator step, " +
  "outside theme code per CLAUDE.md). Static theme-artifact tests still run.";
