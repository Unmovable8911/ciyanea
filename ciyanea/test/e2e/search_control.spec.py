"""E2E checks for the header search control (slice 05 — sodo-search).

These assert externally-observable behavior of the search affordance:
  - a search button renders in the header's right group, to the LEFT of the
    language switcher, on a normal page,
  - the button is keyboard-focusable and exposes a non-empty accessible label,
  - the button carries Ghost's `data-ghost-search` trigger attribute (so the
    theme delegates to sodo-search instead of implementing its own search),
  - clicking the button opens Ghost's search overlay.

The slice does not implement custom search logic; search is delegated entirely
to Ghost's built-in sodo-search bundle. To verify the click→overlay behavior
offline (without redeploying the theme to Ghost), the test loads a fixture that
renders the real header markup together with a minimal sodo-search stub that
listens for `data-ghost-search` clicks and mounts an overlay — exactly what the
real bundle does.

Run against the fixture (offline, default):
    python test/e2e/search_control.spec.py

Run against a live Ghost page (once the theme is deployed):
    BASE_URL=http://localhost:53368 TARGET_URL=http://localhost:53368/us/ \
        python test/e2e/search_control.spec.py

Exits non-zero on the first failed assertion.
"""

import os
import sys

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE = "file://" + os.path.join(HERE, "fixtures", "search_control.html")


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def assert_button_left_of_switcher(page):
    """The search button sits in the right group, left of the switcher."""
    btn = page.locator(".site-header-right [data-ghost-search]").first
    switcher = page.locator(".site-header-right .lang-switcher").first
    _check(btn.count() == 1, "expected one search button in the right group")
    _check(switcher.count() == 1, "expected the language switcher in the right group")

    btn_box = btn.bounding_box()
    switcher_box = switcher.bounding_box()
    _check(
        btn_box is not None and switcher_box is not None,
        "search button and switcher must be rendered with a box",
    )
    _check(
        btn_box["x"] < switcher_box["x"],
        "search button must sit to the LEFT of the language switcher",
    )


def assert_accessible_and_focusable(page):
    """The button is keyboard-focusable and carries a non-empty aria-label."""
    btn = page.locator("[data-ghost-search]").first
    label = (btn.get_attribute("aria-label") or "").strip()
    _check(label != "", "search button must carry a non-empty accessible label")

    # It is a real, focusable control (a <button>, not a decorative span).
    tag = btn.evaluate("el => el.tagName.toLowerCase()")
    _check(tag == "button", f"search control should be a <button>, was <{tag}>")

    btn.focus()
    is_focused = btn.evaluate("el => el === document.activeElement")
    _check(is_focused, "search button must be keyboard-focusable")


def assert_opens_overlay(page):
    """Clicking the button opens Ghost's search overlay."""
    # No overlay before interaction.
    _check(
        page.locator("#sodo-search-root *").count() == 0,
        "search overlay must not be present before clicking",
    )
    page.locator("[data-ghost-search]").first.click()
    page.wait_for_selector("#sodo-search-root [data-search-overlay]", timeout=2000)
    _check(
        page.locator("#sodo-search-root [data-search-overlay]").count() == 1,
        "clicking the search button must open Ghost's search overlay",
    )


def run():
    url = os.environ.get("TARGET_URL") or FIXTURE
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            page.goto(url, wait_until="networkidle")
            for name, fn in (
                ("button left of switcher", assert_button_left_of_switcher),
                ("accessible + focusable", assert_accessible_and_focusable),
                ("click opens overlay", assert_opens_overlay),
            ):
                try:
                    fn(page)
                    print(f"[PASS] {name}")
                except AssertionError as exc:
                    failures.append(f"{name}: {exc}")
                    print(f"[FAIL] {name}: {exc}")
        finally:
            browser.close()

    if failures:
        print(f"\n{len(failures)} failure(s).")
        sys.exit(1)
    print("\nAll search-control checks passed.")


if __name__ == "__main__":
    run()
