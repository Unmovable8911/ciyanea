import { test } from "node:test";
import assert from "node:assert/strict";

import { activeSection } from "../assets/js/active-section.mjs";

test("a language root path marks Home as the active section", () => {
  assert.equal(activeSection("/us/"), "home");
  assert.equal(activeSection("/cn/"), "home");
  assert.equal(activeSection("/de/"), "home");
});

test("a language root path without a trailing slash still marks Home", () => {
  assert.equal(activeSection("/us"), "home");
});

test("a micro-stream path marks Micro as the active section", () => {
  assert.equal(activeSection("/us/micro/"), "micro");
  assert.equal(activeSection("/cn/micro/"), "micro");
});

test("an individual micro post path still marks Micro", () => {
  assert.equal(activeSection("/us/micro/some-slug/"), "micro");
});

test("a regular post under a language marks Home, not Micro", () => {
  assert.equal(activeSection("/us/some-post/"), "home");
});

test("the root redirect shell marks no section", () => {
  assert.equal(activeSection("/"), null);
  assert.equal(activeSection(""), null);
});
