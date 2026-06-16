/*
 * Ciyanea — pure active-section resolver.
 *
 * Given a pathname, determine which built-in navigation item is current. The
 * decision is driven by the path's language-relative segment — the same prefix
 * parsing the language switcher uses (first path segment = language code):
 *
 *   - "/<code>/"            -> "home"   (the bare language root)
 *   - "/<code>/<post>/"     -> "home"   (regular content lives under Home)
 *   - "/<code>/micro/…"     -> "micro"  (the micro stream and its posts)
 *   - "/" or ""             -> null     (root redirect shell: nothing is active)
 *
 * Returns "home", "micro", or null. Exported so it can be unit-tested without a
 * DOM and reused by the client-side highlighter (active-section.js).
 */
export function activeSection(pathname) {
  var segments = (pathname || "").split("/").filter(Boolean);
  if (segments.length === 0) return null; // root redirect shell
  // segments[0] is the language code; segments[1] selects the section.
  if (segments[1] === "micro") return "micro";
  return "home";
}
