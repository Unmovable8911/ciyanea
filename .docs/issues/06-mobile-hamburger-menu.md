## What to build

On narrow screens (below the existing 768px breakpoint), collapse the navigation list behind a **hamburger** toggle button so the header stays uncluttered. The **search button and language switcher remain visible** in the bar alongside the hamburger.

Tapping the hamburger reveals the menu; tapping again, tapping outside, or pressing Escape dismisses it — following the same interaction conventions already used by the language switcher dropdown (toggle click, outside-click to close, Escape to close). Implement the toggle in small vanilla JS consistent with the existing per-feature script files.

## Acceptance criteria

- [ ] At a mobile viewport (below 768px), the navigation list is collapsed behind a hamburger toggle button.
- [ ] The search button and language switcher remain visible in the bar at the mobile viewport.
- [ ] Tapping the hamburger reveals the menu; tapping it again, tapping outside, or pressing Escape dismisses it — verified by E2E.
- [ ] At desktop widths the navigation remains inline (hamburger not shown), with no regression to slices 2–5.

## Blocked by

- Slice 2 (Built-in language-aware Home/Micro nav links).
- Slice 5 (Search control).
