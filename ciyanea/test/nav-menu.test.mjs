import { test } from "node:test";
import assert from "node:assert/strict";

import { createMenuController } from "../assets/js/nav-menu.mjs";

/*
 * The mobile hamburger menu reuses the exact open/close conventions of the
 * language switcher: toggle click flips state, outside-click closes, Escape
 * closes. createMenuController is the pure state machine driving that — it owns
 * no DOM, it just calls a sink with the next open state so the browser wiring
 * (nav-menu.js) can mirror it.
 */

function makeController() {
  const states = [];
  const controller = createMenuController({
    onChange(open) {
      states.push(open);
    },
  });
  return { controller, states };
}

test("starts closed and emits no state until acted on", () => {
  const { states } = makeController();
  assert.deepEqual(states, []);
});

test("toggle from closed opens; toggle again closes", () => {
  const { controller, states } = makeController();
  controller.toggle();
  controller.toggle();
  assert.deepEqual(states, [true, false]);
});

test("an outside interaction closes an open menu", () => {
  const { controller, states } = makeController();
  controller.toggle(); // open
  controller.closeFromOutside();
  assert.deepEqual(states, [true, false]);
});

test("an outside interaction on an already-closed menu is a no-op", () => {
  const { controller, states } = makeController();
  controller.closeFromOutside();
  assert.deepEqual(states, []);
});

test("Escape closes an open menu and is a no-op when already closed", () => {
  const { controller, states } = makeController();
  controller.closeFromOutside(); // no-op
  controller.toggle(); // open
  controller.escape(); // close
  controller.escape(); // no-op
  assert.deepEqual(states, [true, false]);
});

test("isOpen reflects the current state", () => {
  const { controller } = makeController();
  assert.equal(controller.isOpen(), false);
  controller.toggle();
  assert.equal(controller.isOpen(), true);
  controller.escape();
  assert.equal(controller.isOpen(), false);
});
