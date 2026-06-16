"""E2E checks for the active-section highlight (slice 03).

Asserts externally-observable behavior of the header navigation:
  - On a language homepage (/<code>/), Home is marked current and Micro is not.
  - On a micro-stream page (/<code>/micro/), Micro is marked current and Home is not.
  - The highlight tracks the section across at least two languages (us, cn).

"Current" is observed via aria-current="page" + the .is-current class and the
accent color the .is-current rule applies.

Run:
    BASE_URL=http://localhost:53368 python test/e2e/active_section.spec.py

Exits non-zero on the first failed assertion.
"""

import os
import sys

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:53368").rstrip("/")
ACCENT = "rgb(74, 222, 128)"  # --color-accent #4ade80


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def _nav_item(page, section):
    return page.locator(f".site-nav .site-nav-link[data-nav-section='{section}']").first


def assert_current(page, section):
    """The given section's nav item is marked current (and the other is not)."""
    other = "micro" if section == "home" else "home"

    current = _nav_item(page, section)
    not_current = _nav_item(page, other)
    _check(current.count() == 1, f"expected exactly one '{section}' nav item")
    _check(not_current.count() == 1, f"expected exactly one '{other}' nav item")

    _check(
        current.get_attribute("aria-current") == "page",
        f"'{section}' item should have aria-current=page",
    )
    _check(
        "is-current" in (current.get_attribute("class") or ""),
        f"'{section}' item should carry the .is-current class",
    )
    color = current.evaluate("el => getComputedStyle(el).color")
    _check(
        color == ACCENT,
        f"current '{section}' item should be accent {ACCENT}, was {color}",
    )

    _check(
        not_current.get_attribute("aria-current") in (None, ""),
        f"'{other}' item must not have aria-current when '{section}' is current",
    )
    _check(
        "is-current" not in (not_current.get_attribute("class") or ""),
        f"'{other}' item must not carry .is-current when '{section}' is current",
    )


def run():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            # (path, expected active section). Tracks two languages each section.
            cases = [
                ("/us/", "home"),
                ("/us/micro/", "micro"),
                ("/cn/", "home"),
                ("/cn/micro/", "micro"),
            ]
            for path, section in cases:
                try:
                    page.goto(BASE_URL + path, wait_until="networkidle")
                    assert_current(page, section)
                    print(f"[PASS] {path} -> {section} current")
                except AssertionError as exc:
                    failures.append(f"{path}: {exc}")
                    print(f"[FAIL] {path}: {exc}")
        finally:
            browser.close()

    if failures:
        print(f"\n{len(failures)} failure(s).")
        sys.exit(1)
    print("\nAll active-section checks passed.")


if __name__ == "__main__":
    run()
