// Asserts package.json is a valid Ghost theme manifest and declares the
// content_api_key under config.custom (consumed later via {{@custom.content_api_key}}).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readThemeFile } from "./helpers.mjs";

const pkg = JSON.parse(readThemeFile("package.json"));

test("package.json has a theme name and version", () => {
  assert.equal(typeof pkg.name, "string");
  assert.ok(pkg.name.length > 0);
  assert.match(pkg.version, /^\d+\.\d+\.\d+/);
});

test("package.json declares Ghost engine compatibility", () => {
  assert.ok(pkg.engines, "engines block required by Ghost themes");
  assert.ok(pkg.engines.ghost, "engines.ghost version range required");
});

test("package.json identifies it as a Ghost theme via config", () => {
  assert.ok(pkg.config, "config block required");
});

test("package.json declares content_api_key under config.custom", () => {
  assert.ok(pkg.config.custom, "config.custom required");
  assert.ok(
    pkg.config.custom.content_api_key,
    "config.custom.content_api_key must be declared"
  );
  // Ghost custom settings are objects with at least a `type`.
  assert.ok(
    pkg.config.custom.content_api_key.type,
    "content_api_key custom setting must declare a type"
  );
});
