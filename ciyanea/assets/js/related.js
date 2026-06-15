/*
 * Ciyanea — related posts (client side).
 *
 * On an article detail page (/<code>/<slug>/) Ghost strips the internal language
 * tag from the post context and cannot bind it through a route `data:` property,
 * so the article's language is only knowable from the URL prefix. This script:
 *   - Derives the language code from the path (first segment) -> tag hash-<code>,
 *     the same way lang-switcher.js does.
 *   - Reads the Content API key from <body data-content-api-key> and the current
 *     post id from the [data-related-posts] container.
 *   - Requests up to 3 posts in this language, excluding the current one:
 *       GET /ghost/api/content/posts/?filter=tag:hash-<code>+id:-<id>
 *           &include=authors,tags&limit=3&key=<KEY>   (`+` encoded as %2B)
 *   - Renders each as a card matching post-card.hbs and reveals the section.
 *
 * Graceful degradation: the section starts `hidden`; without a key, language, or
 * results it simply stays hidden, so no-JS visitors see nothing out of place.
 */
(function () {
  "use strict";

  var LIMIT = 3;

  // First path segment, e.g. "/cn/my-post/" -> "cn". Mirrors lang-switcher.js.
  function currentCode() {
    return window.location.pathname.split("/").filter(Boolean)[0] || "";
  }

  function buildUrl(tagSlug, excludeId, key) {
    // filter=tag:<lang>+id:-<id>, with `+` URL-encoded as %2B.
    var filter = "tag:" + tagSlug + "%2Bid:-" + excludeId;
    return (
      "/ghost/api/content/posts/?filter=" +
      filter +
      "&include=authors,tags&limit=" +
      LIMIT +
      "&key=" +
      encodeURIComponent(key)
    );
  }

  // Build one card mirroring partials/post-card.hbs (article-type card).
  function renderCard(post) {
    var article = document.createElement("article");
    article.className = "post-card";
    article.setAttribute("data-post-type", "article");

    if (post.feature_image) {
      var link = document.createElement("a");
      link.className = "post-card-image-link";
      link.href = post.url;
      link.setAttribute("aria-hidden", "true");
      link.tabIndex = -1;
      var img = document.createElement("img");
      img.className = "post-card-image";
      img.src = post.feature_image;
      img.alt = post.title || "";
      img.loading = "lazy";
      link.appendChild(img);
      article.appendChild(link);
    }

    var body = document.createElement("div");
    body.className = "post-card-body";

    // First PUBLIC tag only (primary_tag from the API already excludes internal).
    if (post.primary_tag) {
      var tag = document.createElement("a");
      tag.className = "post-card-tag";
      tag.href = post.primary_tag.url || "#";
      tag.textContent = post.primary_tag.name;
      body.appendChild(tag);
    }

    var h2 = document.createElement("h2");
    h2.className = "post-card-title";
    var titleLink = document.createElement("a");
    titleLink.className = "post-card-link";
    titleLink.href = post.url;
    titleLink.textContent = post.title || "";
    h2.appendChild(titleLink);
    body.appendChild(h2);

    var excerpt = post.custom_excerpt || post.excerpt;
    if (excerpt) {
      var p = document.createElement("p");
      p.className = "post-card-excerpt";
      p.textContent = excerpt;
      body.appendChild(p);
    }

    if (post.primary_author) {
      var author = document.createElement("div");
      author.className = "post-card-author";
      if (post.primary_author.profile_image) {
        var avatar = document.createElement("img");
        avatar.className = "post-card-author-avatar";
        avatar.src = post.primary_author.profile_image;
        avatar.alt = post.primary_author.name || "";
        avatar.loading = "lazy";
        author.appendChild(avatar);
      }
      var name = document.createElement("span");
      name.className = "post-card-author-name";
      name.textContent = post.primary_author.name || "";
      author.appendChild(name);
      body.appendChild(author);
    }

    var meta = document.createElement("div");
    meta.className = "post-card-meta";
    if (post.published_at) {
      var time = document.createElement("time");
      time.className = "post-card-date";
      time.setAttribute("datetime", post.published_at.slice(0, 10));
      time.textContent = new Date(post.published_at).toLocaleDateString();
      meta.appendChild(time);
    }
    if (post.reading_time) {
      var rt = document.createElement("span");
      rt.className = "post-card-reading-time";
      rt.textContent = post.reading_time + " min read";
      meta.appendChild(rt);
    }
    body.appendChild(meta);

    article.appendChild(body);
    return article;
  }

  function init() {
    var section = document.querySelector("[data-related-posts]");
    if (!section) return;

    var list = section.querySelector("[data-related-posts-list]");
    var key = document.body.getAttribute("data-content-api-key");
    var postId = section.getAttribute("data-post-id");
    var code = currentCode();
    if (!list || !key || !postId || !code) return;

    fetch(buildUrl("hash-" + code, postId, key))
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        var posts = (data && data.posts) || [];
        if (!posts.length) return;
        posts.forEach(function (post) {
          list.appendChild(renderCard(post));
        });
        section.hidden = false;
      })
      .catch(function () {
        /* leave the section hidden on any failure */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
