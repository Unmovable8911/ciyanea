## What to build

Append the author's Ghost **primary navigation** links to the header, rendered **after** the built-in Home and Micro items. These come from Ghost's navigation helper and are rendered as ordinary anchors using the URLs Ghost resolves — **no language prefix is applied**. Pages and tags remain global (not partitioned by language) in this iteration, so a page link (e.g. About) must reach the single global page directly and never hit a 404 from a language prefix being added.

The header must render correctly when the author has configured **zero** primary-navigation links — no empty or broken menu region.

## Acceptance criteria

- [ ] Links configured in Ghost admin primary navigation appear in the header after Home and Micro, in admin order.
- [ ] An admin-configured page link is rendered **without** a language prefix and reaches the global page (no 404) — verified by E2E.
- [ ] Tag links and external links placed in admin navigation render with their normal URLs (no language prefix).
- [ ] The header renders without error and shows no empty/broken menu region when no admin navigation is configured — verified by E2E.

## Blocked by

- Slice 2 (Built-in language-aware Home/Micro nav links).
