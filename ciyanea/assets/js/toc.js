/*
 * Ciyanea — table of contents (client side).
 *
 * Responsibilities (per PRD / issue 08):
 *   - Read the rendered article body ([data-post-content], emitted by post.hbs).
 *   - Extract its h2/h3 headings, assigning each a stable id (slug or fallback)
 *     so the ToC entries can anchor-link to the corresponding section.
 *   - Build a nested list of links and inject it into the sidebar's ToC container
 *     ([data-toc], rendered by the article branch of sidebar.hbs).
 *   - Hide the ToC container entirely when the article has no h2/h3 headings, so
 *     the sidebar never shows an empty "Table of contents" block.
 *
 * This is a progressive enhancement: the article reads fine without JS; the ToC
 * is the only thing this script adds.
 */
(function () {
  "use strict";

  function slugify(text, index) {
    var base = (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return base ? "toc-" + base : "toc-heading-" + index;
  }

  function init() {
    var content = document.querySelector("[data-post-content]");
    var container = document.querySelector("[data-toc]");
    if (!content || !container) return;

    var headings = content.querySelectorAll("h2, h3");
    if (!headings.length) {
      container.hidden = true;
      return;
    }

    var list = document.createElement("ul");
    list.className = "sidebar-toc-list";

    Array.prototype.forEach.call(headings, function (heading, i) {
      if (!heading.id) {
        heading.id = slugify(heading.textContent, i);
      }
      var item = document.createElement("li");
      item.className =
        "sidebar-toc-item sidebar-toc-item--" + heading.tagName.toLowerCase();

      var link = document.createElement("a");
      link.className = "sidebar-toc-link";
      link.href = "#" + heading.id;
      link.textContent = heading.textContent;

      item.appendChild(link);
      list.appendChild(item);
    });

    container.hidden = false;
    container.appendChild(list);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
