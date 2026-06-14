/*
 * lang-detect.js — root-path one-time language detection & redirect.
 *
 * Loaded ONLY by lang-redirect.hbs (the `/` route's no-content shell). It runs
 * once on page load and redirects the visitor to the homepage of their preferred
 * language: /<code>/.
 *
 * The supported language codes are NOT hard-coded here. lang-redirect.hbs queries
 * the language internal tags live from Ghost and injects the derived codes into
 * `window.CIYANEA_SUPPORTED_LANGS`. Adding a language in Ghost admin therefore
 * never requires editing this file.
 *
 * Detection precedence:
 *   1. localStorage["preferred-lang"], if present and supported -> /<code>/
 *   2. navigator.language: try the region subtag (zh-CN -> "cn") then the
 *      primary subtag (zh-CN -> "zh"); first supported match wins, is persisted,
 *      and redirects to /<code>/
 *   3. fallback -> /us/  (English; the documented default)
 *
 * The redirect *outcome* is verified manually per the PRD test seam.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "preferred-lang";
  var DEFAULT_CODE = "us";

  var supported = (window.CIYANEA_SUPPORTED_LANGS || []).map(function (c) {
    return String(c).toLowerCase();
  });

  function isSupported(code) {
    return !!code && supported.indexOf(code) !== -1;
  }

  function go(code) {
    window.location.replace("/" + code + "/");
  }

  // 1) Stored preference.
  var stored;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    stored = null;
  }
  if (stored) {
    stored = String(stored).toLowerCase();
    if (isSupported(stored)) {
      go(stored);
      return;
    }
  }

  // 2) Browser language. Derive candidate codes from both the region subtag and
  //    the primary subtag of navigator.language (e.g. "zh-CN" -> ["cn", "zh"]).
  var lang = (navigator.language || navigator.userLanguage || "").toLowerCase();
  var parts = lang.split("-");
  var candidates = [];
  if (parts.length > 1) {
    candidates.push(parts[parts.length - 1]); // region subtag, e.g. "cn"
  }
  if (parts[0]) {
    candidates.push(parts[0]); // primary subtag, e.g. "zh"
  }

  for (var i = 0; i < candidates.length; i++) {
    if (isSupported(candidates[i])) {
      try {
        window.localStorage.setItem(STORAGE_KEY, candidates[i]);
      } catch (e) {
        /* storage may be unavailable; redirect anyway */
      }
      go(candidates[i]);
      return;
    }
  }

  // 3) Fallback to the default language.
  go(DEFAULT_CODE);
})();
