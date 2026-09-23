// Mobile menu (accordion groups use native <details>, one open at a time), in-page targets, footer year.
// Without JavaScript the mobile menu is shown expanded below the header (see site.css).
document.addEventListener("DOMContentLoaded", function () {
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
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("mobile-nav");
  if (toggle && panel) {
    var isOpen = function () { return toggle.getAttribute("aria-expanded") === "true"; };
    // Keep the open panel inside the viewport (the header may sit below the notice bars), so it scrolls.
    var fit = function () {
      panel.style.maxHeight = Math.max(160, window.innerHeight - panel.getBoundingClientRect().top) + "px";
    };
    var setOpen = function (open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      if (open) {
        fit();
        var first = panel.querySelector("a, summary");
        if (first) first.focus();
      } else if (returnFocus) {
        toggle.focus();
      }
    };
    toggle.addEventListener("click", function () {
      setOpen(!isOpen(), false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) setOpen(false, true);
    });
    var refit = function () {
      if (isOpen()) fit();
    };
    window.addEventListener("resize", refit);
    window.addEventListener("scroll", refit, { passive: true });
    // Returning through the browser's history cache: show the page with the menu closed.
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) setOpen(false, false);
    });
    // Tabbing out of the open menu closes it, so focus never lands on content hidden behind the panel.
    panel.addEventListener("focusout", function (e) {
      var to = e.relatedTarget;
      if (isOpen() && to && to !== toggle && !panel.contains(to)) setOpen(false, false);
    });
    // One group open at a time where <details name> is not supported. "toggle" does not bubble: capture it.
    panel.addEventListener("toggle", function (e) {
      if (!e.target.open || !e.target.classList.contains("nav-group")) return;
      panel.querySelectorAll("details.nav-group[open]").forEach(function (d) {
        if (d !== e.target) d.open = false;
      });
    }, true);
    // A destination on this page (the page's own link, or one of its #sections): close the menu, let the
    // browser go to the fragment, then put keyboard focus on the destination instead of the toggle.
    panel.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (a.origin !== location.origin || a.pathname !== location.pathname || a.search !== location.search) return;
      var id = decodeURIComponent(a.hash.slice(1));
      var dest = document.getElementById(id || "main");
      if (!dest) return;
      a.blur();   // focus leaves the header first, so the page scrolls clear of it (site.css)
      setOpen(false, false);
      if (!id) {   // the current page itself: stay, back at the top
        e.preventDefault();
        if (location.hash) history.pushState(null, "", a.href);
        window.scrollTo(0, 0);
      }
      setTimeout(function () {
        if (dest.tagName === "DETAILS") return openTarget();
        if (!dest.matches("a[href], button, input, select, textarea, summary, [tabindex]")) dest.setAttribute("tabindex", "-1");
        dest.focus({ preventScroll: true });
      }, 0);
    });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false, false);
    });
  }
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

// Optional email sign-up (present only in builds made with --with-signup). Works without JS as a normal POST.
// Only the server's answer is shown. Without one we cannot know whether the sign-up was recorded (the request
// may have arrived before the connection failed), so we say so in the server's own words (subscribe.js).
document.addEventListener("DOMContentLoaded", function () {
  var form = document.querySelector("form.signup");
  if (!form || !window.fetch) return;
  var msg = document.getElementById("su-msg");
  var unconfirmed = "We could not get confirmation that your sign-up was received, so it may or may not have been recorded. If an email arrives asking you to confirm your address, please follow the link in it. If none arrives, please try again later.";
  var pending = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (pending) return;
    var email = form.querySelector("#su-email");
    if (!email.value || !email.checkValidity()) {
      msg.textContent = "Please enter a valid email address.";
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return;
    }
    email.removeAttribute("aria-invalid");
    pending = true;
    msg.textContent = "Sending…";
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 20000);   // the server gives up on the provider after 8 s
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || typeof d.message !== "string" || !d.message) throw new Error("unreadable reply");
        msg.textContent = d.message;
      })
      .catch(function () { msg.textContent = unconfirmed; })   // offline, dropped connection, no answer, unreadable reply
      .then(function () {
        clearTimeout(timer);
        pending = false;
      });
  });
});
