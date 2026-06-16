"""E2E checks for the header two-group layout + sticky behavior (slice 01).

These assert externally-observable behavior of the header:
  - the header inner is a two-group layout with the language switcher rightmost,
  - the header stays pinned to the top of the viewport after the page is scrolled.

Run:
    BASE_URL=http://localhost:53368 python test/e2e/header_layout.spec.py

Exits non-zero on the first failed assertion.
"""

import os
import sys

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:53368")
# A language collection page (per routes.yaml the /<code>/ collections).
COLLECTION_PATH = os.environ.get("COLLECTION_PATH", "/us/")

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "1024": {"width": 1024, "height": 900},
    "768": {"width": 768, "height": 900},
}


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def assert_two_group_layout(page):
    """The header inner holds two groups; the language switcher is rightmost."""
    header = page.locator(".site-header-inner")
    _check(header.count() == 1, "expected exactly one .site-header-inner")

    # Two groups: a left group (logo + nav) and a right group (search + switcher).
    left_group = page.locator(".site-header-inner .site-header-left")
    right_group = page.locator(".site-header-inner .site-header-right")
    _check(left_group.count() == 1, "expected a left group (.site-header-left)")
    _check(right_group.count() == 1, "expected a right group (.site-header-right)")

    # Logo + nav read on the left; the switcher reads on the right.
    logo = page.locator(".site-header-left .site-logo")
    nav = page.locator(".site-header-left .site-nav")
    switcher = page.locator(".site-header-right .lang-switcher")
    _check(logo.count() == 1, "expected the logo inside the left group")
    _check(nav.count() == 1, "expected the nav region inside the left group")
    _check(switcher.count() == 1, "expected the language switcher inside the right group")

    # The existing localized aria-label on the nav region is preserved.
    _check(
        (nav.get_attribute("aria-label") or "").strip() != "",
        "nav region must keep its aria-label",
    )

    # The language switcher must be the rightmost element in the header.
    header_box = header.bounding_box()
    switcher_box = switcher.bounding_box()
    logo_box = logo.bounding_box()
    _check(header_box is not None and switcher_box is not None and logo_box is not None,
           "header, switcher and logo must be rendered with a box")

    switcher_right = switcher_box["x"] + switcher_box["width"]
    header_right = header_box["x"] + header_box["width"]
    # The switcher's right edge hugs the header's right edge (within padding).
    _check(
        header_right - switcher_right < 60,
        f"language switcher should be rightmost (gap {header_right - switcher_right}px)",
    )
    # Logo is left of the switcher (two distinct groups, switcher on the right).
    _check(
        logo_box["x"] < switcher_box["x"],
        "logo (left group) must sit left of the switcher (right group)",
    )


def assert_sticky_after_scroll(page):
    """After scrolling the page, the header stays pinned to the top."""
    header = page.locator(".site-header")
    top_before = header.bounding_box()["y"]
    _check(abs(top_before) < 5, f"header should start at viewport top, was {top_before}")

    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(200)

    scroll_y = page.evaluate("window.scrollY")
    _check(scroll_y > 100, f"page did not scroll enough to test stickiness (scrollY={scroll_y})")

    top_after = header.bounding_box()["y"]
    _check(
        abs(top_after) < 5,
        f"header must stay pinned to viewport top after scroll, top was {top_after}",
    )


def run():
    # TARGET_URL overrides BASE_URL+COLLECTION_PATH (e.g. a file:// fixture).
    url = os.environ.get("TARGET_URL") or (BASE_URL.rstrip("/") + COLLECTION_PATH)
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            for name, vp in VIEWPORTS.items():
                page = browser.new_page(viewport=vp)
                page.goto(url, wait_until="networkidle")
                try:
                    assert_two_group_layout(page)
                    if name == "desktop":
                        assert_sticky_after_scroll(page)
                    print(f"[PASS] {name} ({vp['width']}px)")
                except AssertionError as exc:
                    failures.append(f"{name} ({vp['width']}px): {exc}")
                    print(f"[FAIL] {name} ({vp['width']}px): {exc}")
                finally:
                    page.close()
        finally:
            browser.close()

    if failures:
        print(f"\n{len(failures)} failure(s).")
        sys.exit(1)
    print("\nAll header layout checks passed.")


if __name__ == "__main__":
    run()
