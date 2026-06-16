"""E2E checks for the mobile hamburger menu (slice 06).

These assert externally-observable behavior of the header on narrow screens:
  - below 768px the nav list is collapsed behind a hamburger toggle button,
  - the search button and language switcher stay visible in the bar,
  - tapping the hamburger reveals the menu; tapping again, tapping outside, or
    pressing Escape dismisses it,
  - at desktop widths the nav is inline and the hamburger is not shown
    (no regression to the inline header from slices 2-5).

The slice's JS (nav-menu.js) needs no Ghost backend, so the test runs against an
offline fixture that renders the real header markup (default.hbs left/right
groups) with the theme's hamburger CSS and loads the real nav-menu.js — exactly
the structure the deployed theme produces.

Run against the fixture (offline, default):
    python test/e2e/mobile_menu.spec.py

Run against a live Ghost page (once the theme is deployed):
    TARGET_URL=http://localhost:53368/us/ python test/e2e/mobile_menu.spec.py

Exits non-zero on the first failed assertion.
"""

import os
import sys

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE = "file://" + os.path.join(HERE, "fixtures", "mobile_menu.html")

MOBILE = {"width": 480, "height": 900}
DESKTOP = {"width": 1440, "height": 900}


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def _visible(page, selector):
    loc = page.locator(selector).first
    if loc.count() == 0:
        return False
    return loc.is_visible()


def assert_collapsed_on_mobile(page):
    """Below 768px the hamburger shows and the nav list is collapsed."""
    _check(_visible(page, "[data-nav-toggle]"), "hamburger must be visible on mobile")
    _check(
        not _visible(page, "[data-nav-panel] .site-nav-list"),
        "nav list must be collapsed (hidden) on mobile before opening",
    )


def assert_search_and_switcher_visible(page):
    """The search button and language switcher stay in the bar on mobile."""
    _check(
        _visible(page, ".site-header-right [data-ghost-search]"),
        "search button must remain visible in the bar at mobile width",
    )
    _check(
        _visible(page, ".site-header-right .lang-switcher"),
        "language switcher must remain visible in the bar at mobile width",
    )


def assert_toggle_reveals_and_hides(page):
    """Tapping the hamburger reveals the menu; tapping again hides it."""
    toggle = page.locator("[data-nav-toggle]").first
    toggle.click()
    _check(
        _visible(page, "[data-nav-panel] .site-nav-list"),
        "tapping the hamburger must reveal the nav list",
    )
    _check(
        (toggle.get_attribute("aria-expanded") or "") == "true",
        "aria-expanded must be true while open",
    )
    toggle.click()
    _check(
        not _visible(page, "[data-nav-panel] .site-nav-list"),
        "tapping the hamburger again must hide the nav list",
    )
    _check(
        (toggle.get_attribute("aria-expanded") or "") == "false",
        "aria-expanded must be false after closing",
    )


def assert_outside_click_closes(page):
    """An outside click closes an open menu."""
    toggle = page.locator("[data-nav-toggle]").first
    toggle.click()
    _check(_visible(page, "[data-nav-panel] .site-nav-list"), "menu should be open")
    # Click far outside the header.
    page.mouse.click(10, 850)
    _check(
        not _visible(page, "[data-nav-panel] .site-nav-list"),
        "clicking outside must close the menu",
    )


def assert_escape_closes(page):
    """Pressing Escape closes an open menu."""
    toggle = page.locator("[data-nav-toggle]").first
    toggle.click()
    _check(_visible(page, "[data-nav-panel] .site-nav-list"), "menu should be open")
    page.keyboard.press("Escape")
    _check(
        not _visible(page, "[data-nav-panel] .site-nav-list"),
        "pressing Escape must close the menu",
    )


def assert_inline_on_desktop(page):
    """At desktop widths the nav is inline and the hamburger is not shown."""
    _check(
        not _visible(page, "[data-nav-toggle]"),
        "hamburger must NOT be shown at desktop width",
    )
    _check(
        _visible(page, "[data-nav-panel] .site-nav-list"),
        "nav list must be inline-visible at desktop width",
    )
    _check(
        _visible(page, ".site-header-right [data-ghost-search]")
        and _visible(page, ".site-header-right .lang-switcher"),
        "search + switcher must remain visible at desktop width",
    )


def run():
    url = os.environ.get("TARGET_URL") or FIXTURE
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            # Mobile viewport: collapsed nav, hamburger interactions.
            page = browser.new_page(viewport=MOBILE)
            page.goto(url, wait_until="networkidle")
            for name, fn in (
                ("collapsed on mobile", assert_collapsed_on_mobile),
                ("search + switcher visible", assert_search_and_switcher_visible),
                ("toggle reveals/hides", assert_toggle_reveals_and_hides),
                ("outside click closes", assert_outside_click_closes),
                ("escape closes", assert_escape_closes),
            ):
                try:
                    fn(page)
                    print(f"[PASS] mobile: {name}")
                except AssertionError as exc:
                    failures.append(f"mobile {name}: {exc}")
                    print(f"[FAIL] mobile {name}: {exc}")
            page.close()

            # Desktop viewport: inline nav, no hamburger.
            page = browser.new_page(viewport=DESKTOP)
            page.goto(url, wait_until="networkidle")
            try:
                assert_inline_on_desktop(page)
                print("[PASS] desktop: inline nav, no hamburger")
            except AssertionError as exc:
                failures.append(f"desktop inline: {exc}")
                print(f"[FAIL] desktop inline: {exc}")
            page.close()
        finally:
            browser.close()

    if failures:
        print(f"\n{len(failures)} failure(s).")
        sys.exit(1)
    print("\nAll mobile-menu checks passed.")


if __name__ == "__main__":
    run()
