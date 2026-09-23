// Mobile menu (accordion groups use native <details>), footer year.
// Without JavaScript the mobile menu is shown expanded below the header (see site.css).
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("mobile-nav");
  if (toggle && panel) {
    var setOpen = function (open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      if (open) {
        var first = panel.querySelector("a, summary");
        if (first) first.focus();
      } else if (returnFocus) {
        toggle.focus();
      }
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true", false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false, true);
    });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false, false);
    });
  }
  // Open a collapsed Q&A item when a link targets it (e.g. faq.html#not-medical-advice).
  var openTarget = function () {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = id && document.getElementById(id);
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      var s = el.querySelector("summary");
      if (s) s.focus();
    }
  };
  openTarget();
  window.addEventListener("hashchange", openTarget);
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
});

// Evidence library filters. Without JavaScript every section is shown, grouped by topic.
document.addEventListener("DOMContentLoaded", function () {
  var bar = document.querySelector(".filters");
  if (!bar) return;
  bar.hidden = false;
  var status = document.querySelector(".filter-status");
  var sections = document.querySelectorAll(".lib-section");
  bar.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    var f = btn.getAttribute("data-filter");
    bar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    var shown = 0;
    sections.forEach(function (s) {
      var on = f === "all" || s.getAttribute("data-section") === f;
      s.hidden = !on;
      if (on) shown += s.querySelectorAll(".study-card").length;
    });
    if (status) status.textContent = "Showing " + shown + (shown === 1 ? " source" : " sources") + (f === "all" ? "" : " in " + btn.firstChild.textContent.trim());
  });
});
