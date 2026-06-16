## What to build

Highlight the navigation item for the section the visitor is currently in, so they always know where they are. The active section is determined from the current path's language-relative segment: the root of a language (`/<code>/`) marks **Home** as current; a `…/micro/…` path marks **Micro** as current.

Reuse the same current-language / path parsing already present for the language switcher rather than introducing a separate scheme. Factor the active-section determination as a **pure function** — given a path, return which built-in item (Home or Micro) is active — importable and testable without a DOM. The highlight itself is applied client-side in small vanilla JS consistent with the existing per-feature script files.

## Acceptance criteria

- [ ] On a language homepage (`/<code>/`), the Home item is visually marked as current and Micro is not.
- [ ] On a micro-stream page (`/<code>/micro/…`), the Micro item is visually marked as current and Home is not.
- [ ] The highlight tracks the section correctly across at least two languages — verified by E2E.
- [ ] A `node --test` unit test covers the pure function that determines whether a given path marks Home or Micro as the active section.

## Blocked by

- Slice 2 (Built-in language-aware Home/Micro nav links).
