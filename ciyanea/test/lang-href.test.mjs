import { test } from "node:test";
import assert from "node:assert/strict";

import { buildLangHref } from "../assets/js/lang-href.mjs";

test("empty data-lang-href resolves to the bare language root", () => {
  assert.equal(buildLangHref("", "us"), "/us/");
});

test("relative micro/ value resolves to the language's micro stream", () => {
  assert.equal(buildLangHref("micro/", "us"), "/us/micro/");
  assert.equal(buildLangHref("micro/", "cn"), "/cn/micro/");
});

test("a leading slash on the relative value is not doubled", () => {
  assert.equal(buildLangHref("/micro/", "de"), "/de/micro/");
});

test("a missing relative value behaves like the empty bare-root case", () => {
  assert.equal(buildLangHref(undefined, "fr"), "/fr/");
  assert.equal(buildLangHref(null, "fr"), "/fr/");
});
