// Asserts routes.yaml defines a /<code>/ index collection for all 7 codes with
// the correct internal-tag filter, permalink, and data: tag.hash-<code> binding.
//
// routes.yaml is the file Ghost loads; it lives at the repo root (one level above
// the theme directory). These are static assertions on the authored file because
// activating it inside Ghost is an operator step outside theme code.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readRepoFile, LANG_CODES } from "./helpers.mjs";

const routes = readRepoFile("routes.yaml");

test("routes.yaml keeps tag and author taxonomies", () => {
  assert.match(routes, /tag:\s*\/tag\/\{slug\}\//);
  assert.match(routes, /author:\s*\/author\/\{slug\}\//);
});

for (const code of LANG_CODES) {
  test(`routes.yaml defines /${code}/ index collection`, () => {
    // collection key
    assert.match(
      routes,
      new RegExp(`/${code}/\\s*:`),
      `missing collection key /${code}/`
    );
  });

  test(`/${code}/ uses index template`, () => {
    const block = collectionBlock(routes, code);
    assert.match(block, /template:\s*index/, `/${code}/ should use template: index`);
  });

  test(`/${code}/ filters by tag:hash-${code} and excludes hash-micro`, () => {
    const block = collectionBlock(routes, code);
    // filter contains tag:hash-<code> AND -hash-micro
    assert.match(
      block,
      new RegExp(`filter:\\s*["']?tag:hash-${code}\\+tag:-hash-micro["']?`),
      `/${code}/ filter must be tag:hash-${code}+tag:-hash-micro`
    );
  });

  test(`/${code}/ permalink is /${code}/{slug}/`, () => {
    const block = collectionBlock(routes, code);
    assert.match(
      block,
      new RegExp(`permalink:\\s*/${code}/\\{slug\\}/`),
      `/${code}/ permalink must be /${code}/{slug}/`
    );
  });

  test(`/${code}/ binds data: tag.hash-${code}`, () => {
    const block = collectionBlock(routes, code);
    assert.match(
      block,
      new RegExp(`data:\\s*tag\\.hash-${code}\\b`),
      `/${code}/ must declare data: tag.hash-${code}`
    );
  });
}

test("routes.yaml does not define an unprefixed default index collection", () => {
  // No bare "/:" collection (the root route is added in a later slice).
  // Guard against a top-level "/:" under collections.
  const collectionsSection = routes.split(/\ntaxonomies:/)[0];
  assert.doesNotMatch(
    collectionsSection,
    /\n {2}\/:\s*\n/,
    "there must be no unprefixed `/` index collection in this slice"
  );
});

// Extract the YAML block belonging to a /<code>/ collection: from its key line up
// to (but not including) the next collection key at the same indent or a new
// top-level section.
function collectionBlock(text, code) {
  const lines = text.split("\n");
  const startIdx = lines.findIndex((l) => new RegExp(`^\\s*/${code}/\\s*:`).test(l));
  assert.notEqual(startIdx, -1, `collection /${code}/ not found`);
  const startIndent = lines[startIdx].match(/^\s*/)[0].length;
  const out = [lines[startIdx]];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      out.push(line);
      continue;
    }
    const indent = line.match(/^\s*/)[0].length;
    if (indent <= startIndent) break; // next sibling collection or section
    out.push(line);
  }
  return out.join("\n");
}
