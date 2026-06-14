/*
 * Ciyanea — micro-post stream feed (client side).
 *
 * Responsibilities (per PRD / issue 06):
 *   - Read the Content API key from the DOM (data-content-api-key on <body>,
 *     surfaced by default.hbs from {{@custom.content_api_key}}) and the language
 *     tag slug from the stream container (data-micro-tag = hash-<code>).
 *   - Request the Content API posts endpoint for this language's micro-posts:
 *       GET /ghost/api/content/posts/?filter=tag:hash-<code>+tag:hash-micro
 *           &fields=html,published_at,feature_image&limit=20&page=<n>&key=<KEY>
 *     with the filter `+` URL-encoded as %2B.
 *   - Append pages on infinite scroll (IntersectionObserver on a sentinel),
 *     rendering each post as a tweet-style card matching micro-card.hbs.
 *   - Provide reusable expand/collapse logic for clamped card bodies. This is
 *     exposed on window.Ciyanea.micro so the slice-7 homepage sidebar preview can
 *     reuse the exact same behavior.
 *
 * The first page is server-rendered by micro.hbs; this script enhances it by
 * wiring expand/collapse on the existing cards and loading further pages.
 */
(function () {
  "use strict";

  var FIELDS = "html,published_at,feature_image";
  var PAGE_SIZE = 20;

  // --- reusable expand/collapse (shared with the homepage sidebar in slice 7) ---

  // A body is "clampable" when its rendered height exceeds the collapsed 5-line
  // clamp; only then do we reveal the expand control. Toggling adds/removes the
  // .is-expanded class on the card and flips the button's aria-expanded + label.
  function setupExpand(card) {
    if (!card || card.getAttribute("data-micro-expand-ready") === "true") return;
    var body = card.querySelector("[data-micro-body]");
    var btn = card.querySelector("[data-micro-expand]");
    if (!body || !btn) return;

    card.setAttribute("data-micro-expand-ready", "true");

    var overflowing = body.scrollHeight - body.clientHeight > 1;
    if (!overflowing) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;

    btn.addEventListener("click", function () {
      var expanded = card.classList.toggle("is-expanded");
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded
        ? btn.getAttribute("data-label-less") || "Show less"
        : btn.getAttribute("data-label-more") || "Show more";
    });
  }

  // Apply expand/collapse to every card within a root (default: document).
  function setupExpandAll(root) {
    var scope = root || document;
    var cards = scope.querySelectorAll("[data-micro-card]");
    Array.prototype.forEach.call(cards, setupExpand);
  }

  // --- relative timestamp (used for client-appended cards) ---

  function relativeTime(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    var secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    var units = [
      ["year", 31536000],
      ["month", 2592000],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60]
    ];
    for (var i = 0; i < units.length; i++) {
      var n = Math.floor(secs / units[i][1]);
      if (n >= 1) return n + " " + units[i][0] + (n > 1 ? "s" : "") + " ago";
    }
    return "just now";
  }

  // --- card rendering (mirrors micro-card.hbs) ---

  function renderCard(post) {
    var article = document.createElement("article");
    article.className = "micro-card";
    article.setAttribute("data-post-type", "micro");
    article.setAttribute("data-micro-card", "");

    var body = document.createElement("div");
    body.className = "micro-card-body";
    body.setAttribute("data-micro-body", "");
    body.innerHTML = post.html || "";
    article.appendChild(body);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "micro-card-expand";
    btn.setAttribute("data-micro-expand", "");
    btn.setAttribute("aria-expanded", "false");
    btn.hidden = true;
    btn.textContent = "Show more";
    article.appendChild(btn);

    if (post.feature_image) {
      var img = document.createElement("img");
      img.className = "micro-card-image";
      img.src = post.feature_image;
      img.alt = "";
      img.loading = "lazy";
      article.appendChild(img);
    }

    var meta = document.createElement("div");
    meta.className = "micro-card-meta";
    var time = document.createElement("time");
    time.className = "micro-card-time";
    if (post.published_at) {
      time.setAttribute("datetime", post.published_at);
      time.textContent = relativeTime(post.published_at);
    }
    meta.appendChild(time);
    article.appendChild(meta);

    return article;
  }

  // --- Content API request ---

  function buildUrl(tagSlug, key, page) {
    // filter=tag:<lang>+tag:hash-micro, with `+` URL-encoded as %2B.
    var filter = "tag:" + tagSlug + "%2Btag:hash-micro";
    return (
      "/ghost/api/content/posts/?filter=" +
      filter +
      "&fields=" +
      encodeURIComponent(FIELDS) +
      "&limit=" +
      PAGE_SIZE +
      "&page=" +
      page +
      "&key=" +
      encodeURIComponent(key)
    );
  }

  function init() {
    var stream = document.querySelector("[data-micro-stream]");
    if (!stream) return;

    // Wire expand/collapse on the server-rendered first page immediately.
    setupExpandAll(document);

    var key = document.body.getAttribute("data-content-api-key");
    var tagSlug = stream.getAttribute("data-micro-tag");
    var sentinel = document.querySelector("[data-micro-sentinel]");

    // Without a key/tag/sentinel, the server-rendered first page still works;
    // only the infinite-scroll enhancement is unavailable.
    if (!key || !tagSlug || !sentinel) return;

    var page = 2; // page 1 is server-rendered
    var loading = false;
    var done = false;

    function loadNext() {
      if (loading || done) return;
      loading = true;
      fetch(buildUrl(tagSlug, key, page))
        .then(function (res) {
          return res.ok ? res.json() : null;
        })
        .then(function (data) {
          loading = false;
          var posts = (data && data.posts) || [];
          if (!posts.length) {
            done = true;
            return;
          }
          posts.forEach(function (post) {
            var card = renderCard(post);
            stream.appendChild(card);
            setupExpand(card);
          });
          page += 1;
          var pagination = data.meta && data.meta.pagination;
          if (pagination && pagination.next == null) done = true;
        })
        .catch(function () {
          loading = false;
        });
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) loadNext();
        });
      });
      observer.observe(sentinel);
    } else {
      window.addEventListener("scroll", function () {
        var rect = sentinel.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200) loadNext();
      });
    }
  }

  // Expose reusable pieces for slice 7 (homepage sidebar micro-post preview).
  window.Ciyanea = window.Ciyanea || {};
  window.Ciyanea.micro = {
    setupExpand: setupExpand,
    setupExpandAll: setupExpandAll,
    relativeTime: relativeTime,
    renderCard: renderCard
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
