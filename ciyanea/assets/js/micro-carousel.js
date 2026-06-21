/*
 * Ciyanea — micro-post image carousel.
 *
 * Detects Ghost gallery cards (.kg-gallery-card) inside micro-card bodies and
 * transforms them into Instagram-style carousels with:
 *   - Horizontal scroll-snap for touch/swipe
 *   - Left/right arrow buttons
 *   - Dot indicators
 *   - Adjacent-image peek effect (edges of neighboring images visible)
 */
(function () {
  "use strict";

  var TRACK_PAD = 20; // matches CSS padding-inline on .mc-carousel-track

  function buildCarousel(galleryEl) {
    var imgs = galleryEl.querySelectorAll("img");
    if (!imgs.length) return;

    var body = galleryEl.closest("[data-micro-body]");
    var card = galleryEl.closest("[data-micro-card]");
    if (!card) return;

    var wrap = document.createElement("div");
    wrap.className = "mc-carousel";

    var track = document.createElement("div");
    track.className = "mc-carousel-track";

    var slides = [];
    for (var i = 0; i < imgs.length; i++) {
      var slide = document.createElement("div");
      slide.className = "mc-carousel-slide";
      var img = document.createElement("img");
      img.src = imgs[i].src;
      img.alt = imgs[i].alt || "";
      img.loading = "lazy";
      img.draggable = false;
      slide.appendChild(img);
      track.appendChild(slide);
      slides.push(slide);
    }
    wrap.appendChild(track);

    var current = 0;

    // --- arrows (only if multiple images) ---
    var btnPrev, btnNext;
    if (slides.length > 1) {
      btnPrev = document.createElement("button");
      btnPrev.type = "button";
      btnPrev.className = "mc-carousel-arrow mc-carousel-prev";
      btnPrev.setAttribute("aria-label", "Previous");
      btnPrev.innerHTML = "<svg viewBox='0 0 24 24' width='20' height='20'><polyline points='15 18 9 12 15 6' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg>";
      wrap.appendChild(btnPrev);

      btnNext = document.createElement("button");
      btnNext.type = "button";
      btnNext.className = "mc-carousel-arrow mc-carousel-next";
      btnNext.setAttribute("aria-label", "Next");
      btnNext.innerHTML = "<svg viewBox='0 0 24 24' width='20' height='20'><polyline points='9 6 15 12 9 18' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg>";
      wrap.appendChild(btnNext);
    }

    // --- dots ---
    var dots = [];
    if (slides.length > 1) {
      var dotRow = document.createElement("div");
      dotRow.className = "mc-carousel-dots";
      for (var d = 0; d < slides.length; d++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "mc-carousel-dot";
        dot.setAttribute("aria-label", "Image " + (d + 1));
        dot.setAttribute("data-index", d);
        dotRow.appendChild(dot);
        dots.push(dot);
      }
      wrap.appendChild(dotRow);
    }

    function goTo(idx) {
      if (idx < 0 || idx >= slides.length) return;
      current = idx;
      var target = slides[idx].offsetLeft - TRACK_PAD;
      track.scrollTo({ left: target, behavior: "smooth" });
      syncUI();
    }

    function syncUI() {
      for (var j = 0; j < dots.length; j++) {
        dots[j].classList.toggle("is-active", j === current);
      }
      if (btnPrev) btnPrev.classList.toggle("is-hidden", current === 0);
      if (btnNext) btnNext.classList.toggle("is-hidden", current === slides.length - 1);
    }

    if (btnPrev) btnPrev.addEventListener("click", function () { goTo(current - 1); });
    if (btnNext) btnNext.addEventListener("click", function () { goTo(current + 1); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        goTo(parseInt(this.getAttribute("data-index"), 10));
      });
    });

    // Sync current index on native scroll (touch swipe / scroll-snap)
    var scrollTimer;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var best = 0;
        var bestDist = Infinity;
        var scrollLeft = track.scrollLeft + TRACK_PAD;
        for (var k = 0; k < slides.length; k++) {
          var dist = Math.abs(slides[k].offsetLeft - scrollLeft);
          if (dist < bestDist) { bestDist = dist; best = k; }
        }
        if (best !== current) {
          current = best;
          syncUI();
        }
      }, 60);
    });

    syncUI();

    // Remove the gallery from the body and insert carousel before the body
    galleryEl.remove();
    if (body) {
      card.insertBefore(wrap, body);
    } else {
      card.insertBefore(wrap, card.firstChild);
    }
  }

  function initCarousels(root) {
    var scope = root || document;
    var galleries = scope.querySelectorAll(".micro-card-body .kg-gallery-card");
    Array.prototype.forEach.call(galleries, buildCarousel);
  }

  window.Ciyanea = window.Ciyanea || {};
  window.Ciyanea.carousel = { init: initCarousels };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initCarousels(); });
  } else {
    initCarousels();
  }
})();
