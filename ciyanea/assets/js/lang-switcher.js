/*
 * Ciyanea — data-driven language switcher (client side).
 *
 * Responsibilities (per PRD / issue 03):
 *   - Open/close the header language dropdown.
 *   - Derive the current language code from the URL prefix (first path segment);
 *     on a non-prefixed page, fall back to localStorage["preferred-lang"].
 *     Highlight nothing when neither is available.
 *   - Build each option's flag image from flagcdn using the code derived from the
 *     option's tag slug (slug minus the `hash-` prefix) — no hard-coded code list.
 *   - Reflect the current language's flag in the collapsed control.
 *   - Rewrite language-relative links declared as `data-lang-href="micro/"` into
 *     `/<code>/micro/` for the active language.
 *   - On selection: write localStorage["preferred-lang"] = <code> and redirect to
 *     `/<code>/`.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "preferred-lang";
  var FLAG_BASE = "https://flagcdn.io/flags/1x1/";

  // slug like hash-XX -> code XX (strip the leading hash- prefix).
  function codeFromSlug(slug) {
    if (!slug) return "";
    return slug.replace(/^hash-/, "");
  }

  function flagUrl(code) {
    return FLAG_BASE + code + ".svg";
  }

  // The current language code: first path segment if it is a known language code,
  // else the stored preference, else "" (nothing highlighted).
  function currentCode(knownCodes) {
    var seg = window.location.pathname.split("/").filter(Boolean)[0] || "";
    if (knownCodes.indexOf(seg) !== -1) return seg;
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && knownCodes.indexOf(stored) !== -1) return stored;
    } catch (e) {
      /* localStorage unavailable */
    }
    return "";
  }

  function storePreference(code) {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      /* ignore */
    }
  }

  function init() {
    var root = document.querySelector("[data-lang-switcher]");
    if (!root) return;

    var toggle = root.querySelector("[data-lang-toggle]");
    var menu = root.querySelector("[data-lang-menu]");
    var options = Array.prototype.slice.call(
      root.querySelectorAll("[data-lang-option]")
    );

    // Build the live code set from the rendered options (data-driven, no hard-coded list).
    var codes = options.map(function (opt) {
      return codeFromSlug(opt.getAttribute("data-lang-slug"));
    });

    // Populate each option's flag from flagcdn and wire selection.
    options.forEach(function (opt) {
      var code = codeFromSlug(opt.getAttribute("data-lang-slug"));
      var flag = opt.querySelector("[data-lang-flag]");
      if (flag) flag.src = flagUrl(code);

      var link = opt.querySelector("[data-lang-select]");
      if (link) {
        link.setAttribute("href", "/" + code + "/");
        link.addEventListener("click", function (ev) {
          ev.preventDefault();
          storePreference(code);
          window.location.href = "/" + code + "/";
        });
      }
    });

    // Reflect the current language in the collapsed control.
    var active = currentCode(codes);
    var currentFlag = root.querySelector("[data-lang-current-flag]");
    var currentGlyph = root.querySelector("[data-lang-current-glyph]");
    if (active) {
      if (currentFlag) {
        currentFlag.src = flagUrl(active);
        currentFlag.hidden = false;
      }
      if (currentGlyph) currentGlyph.hidden = true;
      options.forEach(function (opt) {
        var code = codeFromSlug(opt.getAttribute("data-lang-slug"));
        if (code === active) {
          opt.setAttribute("aria-selected", "true");
          opt.classList.add("is-current");
        } else {
          opt.removeAttribute("aria-selected");
          opt.classList.remove("is-current");
        }
      });
    }

    // Rewrite language-relative links (e.g. data-lang-href="micro/") to the active
    // language: /<code>/micro/. Done across the whole document, not just the switcher.
    if (active) {
      var relLinks = document.querySelectorAll("[data-lang-href]");
      Array.prototype.forEach.call(relLinks, function (el) {
        var rel = el.getAttribute("data-lang-href") || "";
        rel = rel.replace(/^\//, "");
        el.setAttribute("href", "/" + active + "/" + rel);
      });
    }

    // Dropdown open/close.
    function setOpen(open) {
      if (menu) menu.hidden = !open;
      if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
      root.classList.toggle("is-open", open);
    }

    if (toggle) {
      toggle.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        setOpen(!isOpen);
      });
    }

    document.addEventListener("click", function (ev) {
      if (!root.contains(ev.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
