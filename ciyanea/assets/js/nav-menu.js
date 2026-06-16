/*
 * Ciyanea — mobile hamburger menu (client side, issue 06).
 *
 * On narrow screens (CSS hides the inline nav and shows the hamburger below the
 * 768px breakpoint) the nav list collapses behind a toggle button. This wires
 * the toggle to the same open/close conventions as the language switcher:
 *   - clicking the hamburger toggles the menu,
 *   - clicking anywhere outside the menu/toggle closes it,
 *   - pressing Escape closes it.
 *
 * The open/close decision logic is mirrored from assets/js/nav-menu.mjs
 * (unit-tested there without a DOM). The search button and language switcher
 * stay in the bar at all widths — only the nav list is collapsed here.
 */
(function () {
  "use strict";

  // Inlined mirror of createMenuController in nav-menu.mjs: emit only on an
  // actual transition so we never redundantly toggle DOM state.
  function createMenuController(onChange) {
    var open = false;
    function set(next) {
      if (next === open) return;
      open = next;
      onChange(open);
    }
    return {
      isOpen: function () {
        return open;
      },
      toggle: function () {
        set(!open);
      },
      close: function () {
        set(false);
      },
    };
  }

  function init() {
    var root = document.querySelector("[data-nav-menu]");
    if (!root) return;

    var toggle = root.querySelector("[data-nav-toggle]");
    var panel = root.querySelector("[data-nav-panel]");
    if (!toggle || !panel) return;

    var controller = createMenuController(function (open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      root.classList.toggle("is-open", open);
    });

    // Start collapsed: the panel is hidden until the toggle opens it. On desktop
    // CSS reveals the inline nav and hides the hamburger regardless of `hidden`.
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      controller.toggle();
    });

    document.addEventListener("click", function (ev) {
      if (!controller.isOpen()) return;
      if (!root.contains(ev.target)) controller.close();
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") controller.close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
