/*
 * Ciyanea — hero carousel (client side).
 *
 * Responsibilities:
 *   - 5-second auto-advance through the featured slides.
 *   - Clickable dash-style dot indicators (one per slide) that jump to a slide.
 *   - Pause on hover so readers aren't rushed.
 *
 * The markup is rendered server-side by partials/hero.hbs. This module is loaded
 * only by index.hbs and is a no-op when the hero region is absent (no featured
 * posts) or has a single slide.
 */
(function () {
  "use strict";

  var AUTO_ADVANCE_MS = 5000;

  function init() {
    var root = document.querySelector("[data-hero]");
    if (!root) return;

    var track = root.querySelector("[data-hero-track]");
    var slides = Array.prototype.slice.call(
      root.querySelectorAll("[data-hero-slide]")
    );
    if (slides.length === 0) return;

    var dotsContainer = root.querySelector("[data-hero-dots]");

    var index = 0;
    var timer = null;

    // Build one dot per slide.
    var dots = [];
    if (dotsContainer) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero-dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        dot.addEventListener("click", function () {
          goTo(i);
          restart();
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    function render() {
      if (track) {
        track.style.transform = "translateX(" + -index * 100 + "%)";
      }
      slides.forEach(function (slide, i) {
        var current = i === index;
        slide.classList.toggle("is-active", current);
        slide.setAttribute("aria-hidden", current ? "false" : "true");
      });
      dots.forEach(function (dot, i) {
        var current = i === index;
        dot.classList.toggle("is-active", current);
        dot.setAttribute("aria-selected", current ? "true" : "false");
      });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    function next() {
      goTo(index + 1);
    }

    function start() {
      if (slides.length <= 1) return;
      timer = window.setInterval(next, AUTO_ADVANCE_MS);
    }

    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function restart() {
      stop();
      start();
    }

    // Pause on hover so readers aren't rushed.
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);

    render();
    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
