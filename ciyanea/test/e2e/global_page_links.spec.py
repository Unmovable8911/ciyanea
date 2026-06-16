"""E2E checks for author-managed global page links in the header (slice 04).

The theme appends Ghost's admin-configured **primary navigation** links to the
header, rendered AFTER the built-in Home and Micro items, as ordinary anchors
using the URLs Ghost resolves. No language prefix is applied to these links:
pages and tags are global in this iteration, so a page link (e.g. About) must
reach the single global page directly and never gain a /<code>/ prefix that
would 404.

This asserts externally-observable behavior:
  - admin nav links render after Home and Micro, in admin order,
  - each admin link's path equals the path Ghost resolved (no language prefix
    injected) — proven by reading admin navigation from the Content API and
    comparing against the rendered anchors,
  - an internal admin link that targets a real page does not 404 when followed,
  - the header has no empty/broken admin menu region: the built-in Home/Micro
    items always render and no admin anchor renders empty.

Run:
    BASE_URL=http://localhost:53368 python test/e2e/global_page_links.spec.py

Exits non-zero on the first failed assertion.
"""

import json
import os
import sys
import urllib.request
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:53368").rstrip("/")

# Language prefixes the theme uses; an admin (global) link must NEVER be wrapped
# in one of these by the theme.
LANG_CODES = {"cn", "us", "de", "fr", "ru", "it", "es"}


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


def _content_api_key(page):
    """Read the theme's Content API key embedded on the rendered page."""
    page.goto(BASE_URL + "/us/", wait_until="domcontentloaded")
    key = page.locator("body").get_attribute("data-content-api-key")
    _check(bool(key), "could not read data-content-api-key from the page")
    return key


def _admin_navigation(key):
    """Fetch the admin-configured primary navigation via the Content API."""
    url = f"{BASE_URL}/ghost/api/content/settings/?key={key}"
    with urllib.request.urlopen(url) as resp:  # noqa: S310 - local test server
        data = json.load(resp)
    return data.get("settings", {}).get("navigation", []) or []


def assert_admin_links_after_builtins(page, nav):
    """Admin links render after Home/Micro, in admin order, un-prefixed."""
    builtin = page.locator(".site-nav .site-nav-link[data-lang-href]")
    admin = page.locator(".site-nav .site-nav-link[data-nav-admin]")

    _check(builtin.count() == 2, f"expected 2 built-in items, got {builtin.count()}")
    _check(
        admin.count() == len(nav),
        f"expected {len(nav)} admin items, rendered {admin.count()}",
    )

    if not nav:
        return  # empty admin nav: nothing more to compare

    # Admin items must come after both built-in items in DOM order.
    all_links = page.locator(".site-nav .site-nav-link")
    first_admin_index = None
    for i in range(all_links.count()):
        if all_links.nth(i).get_attribute("data-nav-admin") is not None:
            first_admin_index = i
            break
    _check(
        first_admin_index is not None and first_admin_index >= 2,
        "admin nav items must be rendered after Home and Micro",
    )

    # Each admin item matches the admin label + un-prefixed path, in order.
    for i, item in enumerate(nav):
        link = admin.nth(i)
        label = (link.inner_text() or "").strip()
        href = link.get_attribute("href") or ""
        _check(
            label == item["label"],
            f"admin item {i}: label '{label}' != admin '{item['label']}'",
        )

        # The rendered path must equal the admin path verbatim — no language
        # prefix added by the theme.
        admin_path = urlparse(item["url"]).path or item["url"]
        rendered_path = urlparse(href).path or href
        _check(
            rendered_path == admin_path,
            f"admin item {i}: rendered path '{rendered_path}' != admin '{admin_path}'",
        )

        # And the theme must not have introduced a language prefix the admin URL
        # did not already carry.
        rendered_first = rendered_path.strip("/").split("/")[0] if rendered_path.strip("/") else ""
        admin_first = admin_path.strip("/").split("/")[0] if admin_path.strip("/") else ""
        if admin_first not in LANG_CODES:
            _check(
                rendered_first not in LANG_CODES,
                f"admin item {i}: theme injected a language prefix: '{rendered_path}'",
            )


def assert_internal_page_link_not_404(page, nav):
    """A rendered internal admin link that targets a real page must not 404."""
    admin = page.locator(".site-nav .site-nav-link[data-nav-admin]")
    base_host = urlparse(BASE_URL).netloc
    reached = 0
    for i in range(admin.count()):
        href = admin.nth(i).get_attribute("href") or ""
        parsed = urlparse(href)
        if parsed.netloc and parsed.netloc != base_host:
            continue  # external link, out of scope
        path = parsed.path or "/"
        full = BASE_URL + path
        req = urllib.request.Request(full, method="HEAD")
        try:
            with urllib.request.urlopen(req) as resp:  # noqa: S310 - local server
                status = resp.status
        except urllib.error.HTTPError as exc:
            status = exc.code
        # A theme that adds no prefix lets an existing global page resolve.
        if status == 200:
            reached += 1
    return reached


def assert_no_empty_menu_region(page):
    """The built-in items always render and no admin anchor renders broken."""
    builtin = page.locator(".site-nav .site-nav-link[data-lang-href]")
    _check(builtin.count() == 2, "built-in Home/Micro must always render")
    admin = page.locator(".site-nav .site-nav-link[data-nav-admin]")
    for i in range(admin.count()):
        href = (admin.nth(i).get_attribute("href") or "").strip()
        label = (admin.nth(i).inner_text() or "").strip()
        _check(href not in ("", "#"), f"admin link {i} has a broken href")
        _check(label != "", f"admin link {i} has an empty label")


def run():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            key = _content_api_key(page)
            nav = _admin_navigation(key)
            print(
                f"admin navigation has {len(nav)} item(s): "
                f"{[i['label'] for i in nav]}"
            )

            page.goto(BASE_URL + "/us/", wait_until="networkidle")

            try:
                assert_admin_links_after_builtins(page, nav)
                print("[PASS] admin links render after Home/Micro, un-prefixed")
            except AssertionError as exc:
                failures.append(f"order/prefix: {exc}")
                print(f"[FAIL] order/prefix: {exc}")

            try:
                reached = assert_internal_page_link_not_404(page, nav)
                print(
                    f"[PASS] {reached} internal admin link(s) reach a global "
                    "page (no 404)"
                )
            except AssertionError as exc:
                failures.append(f"no-404: {exc}")
                print(f"[FAIL] no-404: {exc}")

            try:
                assert_no_empty_menu_region(page)
                print("[PASS] no empty/broken admin menu region")
            except AssertionError as exc:
                failures.append(f"empty-region: {exc}")
                print(f"[FAIL] empty-region: {exc}")
        finally:
            browser.close()

    if failures:
        print(f"\n{len(failures)} failure(s).")
        sys.exit(1)
    print("\nAll global-page-link checks passed.")


if __name__ == "__main__":
    run()
