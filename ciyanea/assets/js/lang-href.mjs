/*
 * Ciyanea — pure language-prefix href builder.
 *
 * Given a `data-lang-href` value (a language-relative path such as "" or
 * "micro/") and an active language code (e.g. "us"), return the resolved
 * absolute path "/<code>/<rel>". An empty value resolves to the bare language
 * root "/<code>/". A leading slash on the relative value is ignored so the
 * result never doubles the separator.
 *
 * This is the same algorithm the client-side rewrite in lang-switcher.js uses;
 * it is exported here so it can be unit-tested without a DOM.
 */
export function buildLangHref(relValue, activeCode) {
  var rel = (relValue || "").replace(/^\//, "");
  return "/" + activeCode + "/" + rel;
}
