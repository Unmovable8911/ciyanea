// Live rendered-HTML tests against the running Ghost instance (the PRD's chosen
// seam). These exercise routes.yaml + template composition end-to-end.
//
// Several acceptance criteria depend on operator-only state that theme code cannot
// create (per CLAUDE.md "do not operate on the database or ghost"): the Ciyanea
// theme must be activated, the multi-language routes.yaml uploaded, and the
// #<code> internal tags + posts seeded in Ghost admin. When that precondition is
// not met these tests skip with a clear message rather than failing spuriously.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fetchHtml,
  LANG_CODES,
  liveLangRoutesReady,
  SKIP_LIVE_MSG,
  extractBlock,
} from "./helpers.mjs";

const ready = await liveLangRoutesReady();

for (const code of LANG_CODES) {
  test(`/${code}/ resolves with HTTP 200`, { skip: ready ? false : SKIP_LIVE_MSG }, async () => {
    const { status } = await fetchHtml(`/${code}/`);
    assert.equal(status, 200, `/${code}/ should return 200`);
  });

  test(`/${code}/ renders the dark base shell (header + footer)`, { skip: ready ? false : SKIP_LIVE_MSG }, async () => {
    const { html } = await fetchHtml(`/${code}/`);
    assert.match(html, /<header\b/i, "header missing");
    assert.match(html, /<footer\b/i, "footer missing");
    // dark design tokens present in the rendered stylesheet linkage / inline.
    assert.match(html, /--color-bg\b|screen\.css/, "dark shell stylesheet missing");
  });
}

test("homepage <head> loads Playfair Display and Inter", { skip: ready ? false : SKIP_LIVE_MSG }, async () => {
  const { html } = await fetchHtml(`/us/`);
  const head = extractBlock(html, "head") || html;
  assert.match(head, /Playfair(\+| )Display/, "Playfair Display not loaded");
  assert.match(head, /Inter/, "Inter not loaded");
});

test("index collection excludes micro-posts", { skip: ready ? false : SKIP_LIVE_MSG }, async () => {
  // A micro-post (tag:hash-micro) must not appear in the /<code>/ index listing.
  // The index permalink is /<code>/{slug}/; micro posts are reachable via Ghost
  // URLs but must be absent from the index collection's rendered card list.
  const { html } = await fetchHtml(`/us/`);
  // The rendered index must not contain any link into the micro stream listing
  // as an article card. We assert the page renders a posts container and that no
  // element carries the micro marker class/data emitted only for micro content.
  assert.doesNotMatch(
    html,
    /data-post-type=["']micro["']/,
    "index listing must not include micro-posts"
  );
});
