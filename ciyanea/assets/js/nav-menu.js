(function () {
  "use strict";

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

    panel.removeAttribute("hidden");
    panel.setAttribute("aria-hidden", "true");
    root.classList.add("is-drawer");

    var backdrop = document.createElement("div");
    backdrop.className = "site-nav-backdrop";
    root.appendChild(backdrop);

    var controller = createMenuController(function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      root.classList.toggle("is-open", open);
      document.documentElement.classList.toggle("has-nav-drawer", open);
    });

    toggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      controller.toggle();
    });

    var closeBtn = root.querySelector("[data-nav-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        controller.close();
      });
    }

    backdrop.addEventListener("click", function () {
      controller.close();
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
