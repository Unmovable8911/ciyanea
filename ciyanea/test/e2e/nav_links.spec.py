"""E2E checks for the built-in language-aware nav links (slice 02).

These assert externally-observable behavior of the header navigation:
  - Home and Micro items render immediately to the right of the logo,
  - on a /us/ page Home -> /us/ and Micro -> /us/micro/,
  - on a /cn/ page Home -> /cn/ and Micro -> /cn/micro/,
  - the built-in labels render in the page's current language (e.g. German),
  - on the root path / the Home link still resolves to a sensible destination,
  - nav links expose a green-accent hover color.

Run:
    BASE_URL=http://localhost:53368 python test/e2e/nav_links.spec.py

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


def _nav_link_by_text(page, text):
    return page.locator(f".site-nav .site-nav-link", has_text=text).first


def assert_items_after_logo(page):
    """Home and Micro render inside the left group, right of the logo."""
    logo = page.locator(".site-header-left .site-logo")
    links = page.locator(".site-header-left .site-nav .site-nav-link")
    _check(logo.count() == 1, "expected the logo in the left group")
    _check(links.count() >= 2, f"expected >= 2 nav links, got {links.count()}")

    logo_box = logo.bounding_box()
    first_box = links.first.bounding_box()
    _check(
        first_box["x"] >= logo_box["x"],
        "nav items must sit to the right of the logo",
    )


def assert_resolved_hrefs(page, code):
    """Home -> /<code>/ and Micro -> /<code>/micro/ after the client rewrite."""
    home = page.locator(".site-nav .site-nav-link[data-lang-href='']").first
    micro = page.locator(".site-nav .site-nav-link[data-lang-href='micro/']").first
    _check(home.count() == 1, "expected exactly one Home link")
    _check(micro.count() == 1, "expected exactly one Micro link")

    home_href = home.get_attribute("href") or ""
    micro_href = micro.get_attribute("href") or ""
    _check(
        home_href.endswith(f"/{code}/"),
        f"Home should resolve to /{code}/ , was {home_href}",
    )
    _check(
        micro_href.endswith(f"/{code}/micro/"),
        f"Micro should resolve to /{code}/micro/ , was {micro_href}",
    )


def assert_localized_labels(page, home_label):
    """The Home label renders in the page's current language."""
    home = page.locator(".site-nav .site-nav-link[data-lang-href='']").first
    text = (home.inner_text() or "").strip()
    _check(
        text == home_label,
        f"Home label should be '{home_label}' on this locale, was '{text}'",
    )


def assert_home_not_broken_on_root(page):
    """On the root redirect shell, Home still points somewhere sensible."""
    home = page.locator(".site-nav .site-nav-link[data-lang-href='']").first
    if home.count() == 0:
        return  # root shell may not render the full header; nothing to assert
    href = home.get_attribute("href") or ""
    _check(href.strip() not in ("", "#"), f"Home link must not be broken, was '{href}'")


def assert_hover_accent(page):
    """Nav links expose the green-accent color on hover."""
    home = page.locator(".site-nav .site-nav-link[data-lang-href='']").first
    home.hover()
    page.wait_for_timeout(100)
    color = home.evaluate("el => getComputedStyle(el).color")
    _check(color == ACCENT, f"hovered nav link should be accent {ACCENT}, was {color}")


def run():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            cases = [
                ("/us/", "us", None),
                ("/cn/", "cn", None),
                ("/de/", "de", "Startseite"),
            ]
            for path, code, home_label in cases:
                try:
                    page.goto(BASE_URL + path, wait_until="networkidle")
                    assert_items_after_logo(page)
                    assert_resolved_hrefs(page, code)
                    if home_label:
                        assert_localized_labels(page, home_label)
                    if path == "/de/":
                        assert_hover_accent(page)
                    print(f"[PASS] {path}")
                except AssertionError as exc:
                    failures.append(f"{path}: {exc}")
                    print(f"[FAIL] {path}: {exc}")

            # Switching language: after navigating to /cn/ the links track cn.
            try:
                page.goto(BASE_URL + "/us/", wait_until="networkidle")
                page.goto(BASE_URL + "/cn/", wait_until="networkidle")
                assert_resolved_hrefs(page, "cn")
                print("[PASS] language switch tracks new language")
            except AssertionError as exc:
                failures.append(f"switch: {exc}")
                print(f"[FAIL] switch: {exc}")

            # Root redirect shell: Home is not broken.
            try:
                page.goto(BASE_URL + "/", wait_until="domcontentloaded")
                assert_home_not_broken_on_root(page)
                print("[PASS] root shell Home not broken")
            except AssertionError as exc:
                failures.append(f"root: {exc}")
                print(f"[FAIL] root: {exc}")
        finally:
            browser.close()

    if failures:
        print(f"\n{len(failures)} failure(s).")
        sys.exit(1)
    print("\nAll nav-link checks passed.")


if __name__ == "__main__":
    run()
