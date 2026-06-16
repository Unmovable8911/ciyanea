/*
 * Ciyanea — pure open/close state machine for the mobile hamburger menu
 * (issue 06).
 *
 * On narrow screens the nav list collapses behind a hamburger toggle. The menu
 * follows the exact interaction conventions of the language-switcher dropdown:
 * a toggle click flips it, an outside interaction closes it, and Escape closes
 * it. This controller owns that logic with no DOM dependency so it can be
 * unit-tested; nav-menu.js wires real events/elements to these methods and
 * reflects the emitted state into the DOM.
 *
 * `onChange(open)` is called only on an actual state transition, so the wiring
 * never redundantly re-renders (e.g. an outside click while already closed is a
 * no-op).
 */
export function createMenuController({ onChange } = {}) {
  let open = false;

  function set(next) {
    if (next === open) return;
    open = next;
    if (typeof onChange === "function") onChange(open);
  }

  return {
    isOpen() {
      return open;
    },
    toggle() {
      set(!open);
    },
    closeFromOutside() {
      set(false);
    },
    escape() {
      set(false);
    },
  };
}
