// Mobile menu (accordion groups use native <details>, one open at a time), in-page targets, footer year.
// Without JavaScript the mobile menu is shown expanded below the header (see site.css).
document.addEventListener("DOMContentLoaded", function () {
  // Open a collapsed Q&A item when a link targets it (e.g. faq.html#not-medical-advice).
  var openTarget = function () {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (err) { return; }
    var el = id && document.getElementById(id);
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      var s = el.querySelector("summary");
      if (s) s.focus();
    }
  };
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("mobile-nav");
  var header = document.querySelector(".site-header");
  if (toggle && panel && header) {
    var isOpen = function () { return toggle.getAttribute("aria-expanded") === "true"; };
    var scrolledFrom = null;   // where the page was before opening the menu scrolled it (see fit)
    // Keep the open panel inside the viewport, so it scrolls within itself and its last item can always be reached.
    // Page scrolling is locked while the menu is open (site.css). When the notice bars above the header leave the
    // panel less than half the viewport (a short or zoomed screen), first scroll the page until the sticky header
    // reaches the top of the viewport, so the panel gets all the height there is.
    var fit = function () {
      var room = window.innerHeight - panel.getBoundingClientRect().top;
      var above = header.getBoundingClientRect().top;
      if (above > 0 && room < Math.min(panel.scrollHeight, window.innerHeight / 2)) {
        if (scrolledFrom === null) scrolledFrom = window.scrollY;
        window.scrollTo({ top: window.scrollY + above, behavior: "instant" });
        room = window.innerHeight - panel.getBoundingClientRect().top;
      }
      panel.style.maxHeight = Math.max(0, room) + "px";
    };
    // returnFocus: the reader dismissed the menu (toggle or Escape). Focus goes back to the toggle and the page
    // goes back to where it was. Otherwise focus has already moved on, or the page is going somewhere else.
    var setOpen = function (open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      if (open) {
        fit();
        var first = panel.querySelector("a, summary");
        if (first) first.focus();
        return;
      }
      if (returnFocus) {
        if (scrolledFrom !== null) window.scrollTo({ top: scrolledFrom, behavior: "instant" });
        toggle.focus();
      }
      scrolledFrom = null;
    };
    toggle.addEventListener("click", function () {
      setOpen(!isOpen(), true);
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
    // Focus moving anywhere outside the open menu and its toggle closes the menu, so focus never sits on content
    // hidden behind the panel: Tab past the last item, Shift+Tab past the toggle to the brand, notice or skip link.
    // Closing as focus leaves (focusout) unlocks the page before the browser scrolls to the new focus, so it lands
    // clear of the sticky header; focusin catches focus that arrives from elsewhere (a script, the address bar).
    // A click outside also closes it: the skip link activated by a screen reader without focusing it first, or a
    // link in a browser that does not focus links on click.
    var outside = function (el) { return el !== toggle && !toggle.contains(el) && !panel.contains(el); };
    var leave = function (e) {
      if (isOpen() && e.relatedTarget && outside(e.relatedTarget)) setOpen(false, false);
    };
    panel.addEventListener("focusout", leave);
    toggle.addEventListener("focusout", leave);
    document.addEventListener("focusin", function (e) {
      if (isOpen() && outside(e.target)) setOpen(false, false);
    });
    document.addEventListener("click", function (e) {
      if (isOpen() && outside(e.target)) setOpen(false, false);
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
      var id;
      try { id = decodeURIComponent(a.hash.slice(1)); } catch (err) { return; }
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
  var apply = function (btn) {
    var f = btn.getAttribute("data-filter");
    bar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    var shown = 0;
    sections.forEach(function (s) {
      var on = f === "all" || s.getAttribute("data-section") === f;
      s.hidden = !on;
      if (on) shown += s.querySelectorAll(".study-card").length;
    });
    if (status) status.textContent = "Showing " + shown + (shown === 1 ? " source" : " sources") + (f === "all" ? "" : " in " + btn.firstChild.textContent.trim());
  };
  bar.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-filter]");
    if (btn) apply(btn);
  });
  // A link to a card in a topic the filter hides shows every topic again, so the page can move to the card.
  var reveal = function (hash) {
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (err) { return null; }
    var el = id && document.getElementById(id);
    var s = el && el.closest(".lib-section");
    var all = bar.querySelector('button[data-filter="all"]');
    if (!s || !s.hidden || !all) return null;
    apply(all);
    return el;
  };
  // Any link on this page to one of its cards, wherever the link is (capture: before the browser follows it).
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && a.hash && a.origin === location.origin && a.pathname === location.pathname) reveal(a.hash);
  }, true);
  window.addEventListener("hashchange", function () {
    var el = reveal(location.hash);   // the address changed some other way: the browser found nothing to show
    if (el) el.scrollIntoView();
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

// "Who does what" (funding-use.html): one group at a time. Without JavaScript every group is shown as a list.
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-layers]").forEach(function (root) {
    var picker = root.querySelector(".layer-picker");
    if (!picker) return;
    var btns = Array.prototype.slice.call(picker.querySelectorAll("button[data-layer]"));
    var panels = btns.map(function (b) { return document.getElementById(b.getAttribute("data-layer")); });
    if (panels.some(function (p) { return !p; })) return;
    var select = function (i) {
      btns.forEach(function (b, j) {
        b.setAttribute("aria-pressed", String(i === j));
        panels[j].hidden = i !== j;
      });
    };
    var start = 0;
    panels.forEach(function (p, i) { if (location.hash === "#" + p.id) start = i; });
    picker.hidden = false;
    root.classList.add("is-interactive");
    select(start);
    btns.forEach(function (b, i) { b.addEventListener("click", function () { select(i); }); });
    // Arrow keys, Home and End move between the buttons; Enter or Space selects (native button behaviour).
    picker.addEventListener("keydown", function (e) {
      var i = btns.indexOf(document.activeElement), n = null;
      if (i < 0) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % btns.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + btns.length) % btns.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = btns.length - 1;
      if (n !== null) { e.preventDefault(); btns[n].focus(); }
    });
  });
});
