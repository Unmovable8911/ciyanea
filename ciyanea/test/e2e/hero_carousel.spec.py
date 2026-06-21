"""E2E checks for the hero carousel refinement.

Verifies the externally-observable structure, styling, and behavior of the
hero carousel after the refinement described in .docs/hero-design.md:
  - no arrow buttons,
  - no author information,
  - slide content (tag, title, excerpt) present,
  - 70vh height,
  - dash-style dot indicators positioned bottom-right,
  - hero + sidebar side-by-side on desktop,
  - mobile single-column layout.

Run against the fixture (offline, default):
    python test/e2e/hero_carousel.spec.py

Run against a live Ghost page:
    TARGET_URL=http://localhost:53368/us/ python test/e2e/hero_carousel.spec.py

Exits non-zero on the first failed assertion.
"""

import os
import sys

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE = "file://" + os.path.join(HERE, "fixtures", "hero_carousel.html")


def _check(condition, message):
    if not condition:
        raise AssertionError(message)


# --- Slice 1: no arrow buttons ---

def assert_no_arrows(page):
    """No arrow buttons exist inside the hero region."""
    arrows = page.locator("[data-hero] .hero-arrow")
    _check(arrows.count() == 0, f"expected 0 arrow buttons, found {arrows.count()}")

    arrow_prev = page.locator("[data-hero] [data-hero-prev]")
    arrow_next = page.locator("[data-hero] [data-hero-next]")
    _check(arrow_prev.count() == 0, "prev arrow button still present")
    _check(arrow_next.count() == 0, "next arrow button still present")


# --- Slice 2: no author information ---

def assert_no_author(page):
    """No author avatar or name elements exist inside the hero region."""
    avatars = page.locator("[data-hero] .hero-slide-author-avatar")
    _check(avatars.count() == 0, f"expected 0 author avatars, found {avatars.count()}")

    names = page.locator("[data-hero] .hero-slide-author-name")
    _check(names.count() == 0, f"expected 0 author names, found {names.count()}")

    author_blocks = page.locator("[data-hero] .hero-slide-author")
    _check(author_blocks.count() == 0, f"expected 0 author blocks, found {author_blocks.count()}")


# --- Slice 3: slide content (tag, title, excerpt) ---

def assert_slide_content(page):
    """Each slide contains a tag, title, and excerpt element."""
    slides = page.locator("[data-hero] [data-hero-slide]")
    count = slides.count()
    _check(count >= 1, "expected at least one hero slide")

    for i in range(count):
        slide = slides.nth(i)
        _check(slide.locator(".hero-slide-tag").count() == 1,
               f"slide {i+1}: missing .hero-slide-tag")
        _check(slide.locator(".hero-slide-title").count() == 1,
               f"slide {i+1}: missing .hero-slide-title")
        _check(slide.locator(".hero-slide-excerpt").count() == 1,
               f"slide {i+1}: missing .hero-slide-excerpt")


# --- Slice 4: 70vh height ---

def assert_hero_height(page):
    """Hero slide image uses viewport-relative height (70vh), not fixed pixels."""
    img = page.locator("[data-hero] .hero-slide-image").first
    viewport_h = page.viewport_size["height"]
    expected_h = viewport_h * 0.7
    actual_h = img.bounding_box()["height"]
    tolerance = 5
    _check(
        abs(actual_h - expected_h) < tolerance,
        f"expected hero image height ~{expected_h}px (70vh), got {actual_h}px",
    )


# --- Slice 5: dash-style dot indicators, bottom-right ---

def assert_dash_dots(page):
    """Dot indicators are dashes positioned in the bottom-right, not centered circles."""
    dots_container = page.locator("[data-hero] .hero-dots")
    _check(dots_container.count() == 1, "expected one .hero-dots container")

    hero_box = page.locator("[data-hero]").bounding_box()
    dots_box = dots_container.bounding_box()
    _check(hero_box is not None and dots_box is not None, "hero and dots must have bounding boxes")

    hero_right = hero_box["x"] + hero_box["width"]
    dots_right = dots_box["x"] + dots_box["width"]
    hero_center_x = hero_box["x"] + hero_box["width"] / 2
    dots_center_x = dots_box["x"] + dots_box["width"] / 2
    _check(
        dots_center_x > hero_center_x,
        f"dots should be right-aligned, not centered (dots center={dots_center_x:.0f}, hero center={hero_center_x:.0f})",
    )

    dot = page.locator("[data-hero] .hero-dot").first
    dot_box = dot.bounding_box()
    _check(dot_box is not None, "dot must have a bounding box")
    _check(
        dot_box["width"] > dot_box["height"] * 2,
        f"dot should be a horizontal dash (w={dot_box['width']:.1f}, h={dot_box['height']:.1f})",
    )


# --- Slice 6: desktop layout — hero + sidebar side-by-side ---

def assert_desktop_side_by_side(page):
    """On desktop, the hero and sidebar sit side-by-side in a two-column layout."""
    hero = page.locator("[data-hero]")
    sidebar = page.locator(".home-sidebar")
    _check(hero.count() == 1, "expected one hero element")
    _check(sidebar.count() == 1, "expected one sidebar element")

    hero_box = hero.bounding_box()
    sidebar_box = sidebar.bounding_box()
    _check(hero_box is not None and sidebar_box is not None,
           "hero and sidebar must be rendered")

    _check(
        abs(hero_box["y"] - sidebar_box["y"]) < 10,
        f"hero and sidebar should share the same row (hero y={hero_box['y']:.0f}, sidebar y={sidebar_box['y']:.0f})",
    )

    _check(
        hero_box["x"] + hero_box["width"] < sidebar_box["x"] + 20,
        "hero should be to the left of sidebar",
    )

    total_width = hero_box["width"] + sidebar_box["width"]
    hero_ratio = hero_box["width"] / total_width
    _check(
        0.6 < hero_ratio < 0.85,
        f"hero should be ~70% of the row width (actual ratio={hero_ratio:.2f})",
    )


# --- Slice 7: mobile single-column layout ---

def assert_mobile_layout(page):
    """On mobile, hero spans the full grid column and the hero-row sidebar is hidden."""
    page.set_viewport_size({"width": 375, "height": 812})
    page.wait_for_timeout(200)

    hero = page.locator("[data-hero]")
    hero_row = page.locator(".hero-row")
    hero_box = hero.bounding_box()
    _check(hero_box is not None, "hero must be rendered on mobile")

    row_content_width = hero_row.evaluate(
        "el => el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight)"
    )
    _check(
        abs(hero_box["width"] - row_content_width) < 5,
        f"hero should fill the hero-row content area on mobile (hero={hero_box['width']:.0f}, content={row_content_width:.0f})",
    )

    hero_row_sidebar = page.locator(".hero-row .home-sidebar")
    if hero_row_sidebar.count() > 0:
        is_hidden = hero_row_sidebar.evaluate(
            "el => window.getComputedStyle(el).display === 'none'"
        )
        _check(is_hidden, "hero-row sidebar should be hidden on mobile")

    page.set_viewport_size({"width": 1440, "height": 900})


def run():
    url = os.environ.get("TARGET_URL") or FIXTURE
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            page.goto(url, wait_until="networkidle")
            for name, fn in (
                ("no arrow buttons", assert_no_arrows),
                ("no author info", assert_no_author),
                ("slide content", assert_slide_content),
                ("70vh height", assert_hero_height),
                ("dash-style dots", assert_dash_dots),
                ("desktop side-by-side", assert_desktop_side_by_side),
                ("mobile layout", assert_mobile_layout),
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
    print("\nAll hero-carousel checks passed.")


if __name__ == "__main__":
    run()
