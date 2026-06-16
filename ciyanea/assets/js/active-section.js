/*
 * Ciyanea — active-section highlighter (client side, issue 03).
 *
 * Marks the built-in nav item for the section the visitor is currently in so
 * they always know where they are. The section is derived from the URL using the
 * same language-prefix parsing as the language switcher: the language root marks
 * Home, a `…/micro/…` path marks Micro.
 *
 * The decision lives in a pure function mirrored from assets/js/active-section.mjs
 * (unit-tested there without a DOM). Each nav item declares its section via
 * data-nav-section ("home" / "micro"); the matching item gets aria-current="page"
 * and the .is-current class.
 */
(function () {
  "use strict";

  // Pure: pathname -> "home" | "micro" | null. Mirrors active-section.mjs.
  function activeSection(pathname) {
    var segments = (pathname || "").split("/").filter(Boolean);
    if (segments.length === 0) return null; // root redirect shell
    if (segments[1] === "micro") return "micro";
    return "home";
  }

  function init() {
    var items = document.querySelectorAll("[data-nav-section]");
    if (!items.length) return;

    var section = activeSection(window.location.pathname);

    Array.prototype.forEach.call(items, function (el) {
      var isCurrent = section !== null && el.getAttribute("data-nav-section") === section;
      if (isCurrent) {
        el.setAttribute("aria-current", "page");
        el.classList.add("is-current");
      } else {
        el.removeAttribute("aria-current");
        el.classList.remove("is-current");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
