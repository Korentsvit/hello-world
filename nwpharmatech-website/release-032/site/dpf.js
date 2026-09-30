/*! NWPharmaTech — NWPT-055 /funding/digital-programme-finance.
 * - Motion (only when prefers-reduced-motion is not set): scroll-linked capital-flow track, reveal of cards below the
 *   fold, gentle hero parallax, and hero animations paused while the hero is off screen. Transform/opacity only.
 * - Architecture tabs: without JavaScript all three layers are shown; with it they become an ARIA tablist.
 * - Analytics: first-party event layer only. Events are pushed to window.nwptAnalytics and dispatched as a DOM
 *   "nwpt:analytics" event; nothing is sent over the network. An owner-approved sink can be attached later as
 *   window.nwptAnalyticsSink(event). No wallet, health or identity data is read or recorded. UTM tags are the only
 *   cohort data: kept for this tab's session and carried onto this page's internal links.
 */
(function () {
  var root = document.querySelector("[data-dpf]");
  if (!root) return;
  var PAGE = "/funding/digital-programme-finance";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var motion = !reduce.matches;

  // ---- analytics
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var KEY = "nwpt-utm";
  var clean = function (v) { return String(v).slice(0, 100).replace(/[^\w .\-]/g, ""); };
  var cohort = (function () {
    var out = {}, found = false, q = new URLSearchParams(window.location.search);
    UTM.forEach(function (k) { var v = q.get(k); if (v && clean(v)) { out[k] = clean(v); found = true; } });
    try {
      if (found) window.sessionStorage.setItem(KEY, JSON.stringify(out));
      else {
        var s = JSON.parse(window.sessionStorage.getItem(KEY) || "null");
        if (s && typeof s === "object") UTM.forEach(function (k) { if (typeof s[k] === "string" && clean(s[k])) out[k] = clean(s[k]); });
      }
    } catch (e) { /* storage unavailable: cohort from the URL only */ }
    return out;
  })();
  var queue = window.nwptAnalytics = window.nwptAnalytics || [];
  function track(name, props) {
    var evt = { event: name, page: PAGE, ts: Date.now() };
    Object.keys(cohort).forEach(function (k) { evt[k] = cohort[k]; });
    Object.keys(props || {}).forEach(function (k) { evt[k] = props[k]; });
    queue.push(evt);
    try { window.dispatchEvent(new CustomEvent("nwpt:analytics", { detail: evt })); } catch (e) { /* old browsers */ }
    if (typeof window.nwptAnalyticsSink === "function") { try { window.nwptAnalyticsSink(evt); } catch (e) { /* sink errors never break the page */ } }
  }
  if (Object.keys(cohort).length) {
    root.querySelectorAll("a[data-track]").forEach(function (a) {
      var u = new URL(a.getAttribute("href"), window.location.href);
      if (u.origin !== window.location.origin) return;
      Object.keys(cohort).forEach(function (k) { u.searchParams.set(k, cohort[k]); });
      a.setAttribute("href", u.pathname + u.search + u.hash);
    });
  }
  root.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-track]");
    if (!a) return;
    var u = new URL(a.href, window.location.href);
    track(a.getAttribute("data-track"), { cta: a.getAttribute("data-cta") || "", target: u.pathname + u.hash });
  });
  root.querySelectorAll("details[data-faq]").forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) track("faq_expand", { faq: d.getAttribute("data-faq") }); });
  });
  track("funding_digital_page_view", {});
  var arch = root.querySelector("[data-dpf-architecture]");
  if (arch && "IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { track("architecture_section_view", { section: "architecture" }); seen.disconnect(); }
    }, { threshold: 0.3 });
    seen.observe(arch);
  }

  // ---- architecture tabs
  var tablist = root.querySelector(".dpf-tabs");
  var rings = root.querySelector(".dpf-rings");
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role=tab]"));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab, panel = document.getElementById(t.getAttribute("aria-controls"));
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (panel) panel.hidden = !on;
      });
      if (rings) rings.setAttribute("data-active", tab.getAttribute("data-layer"));
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) { panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", t.id); panel.tabIndex = 0; }
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (n === undefined) return;
        e.preventDefault();
        select(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
    tablist.hidden = false;
    select(tabs[0], false);
  }

  // ---- capital flow: scroll-linked track (drawn in full without motion)
  var flow = root.querySelector(".dpf-flow");
  var steps = flow ? Array.prototype.slice.call(flow.querySelectorAll(".dpf-flow__step")) : [];
  function drawFlow() {
    if (!flow) return;
    var r = flow.getBoundingClientRect(), line = window.innerHeight * 0.6;
    var p = motion ? Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height))) : 1;
    flow.style.setProperty("--dpf-p", p.toFixed(3));
    steps.forEach(function (s) {
      var b = s.getBoundingClientRect();
      s.classList.toggle("is-on", !motion || b.top + b.height * 0.4 < line);
    });
  }

  // ---- hero: pause off screen, gentle parallax
  var hero = root.querySelector(".dpf-hero");
  var visual = root.querySelector(".dpf-hero__visual");
  var heroOn = true;
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      heroOn = entries[0].isIntersecting;
      hero.classList.toggle("is-paused", !heroOn);
    }).observe(hero);
  }
  function parallax() {
    if (!visual) return;
    visual.style.transform = motion && heroOn ? "translate3d(0," + Math.min(60, window.scrollY * 0.08).toFixed(1) + "px,0)" : "";
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; drawFlow(); parallax(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  drawFlow();

  // ---- reveal cards that start below the fold (nothing already on screen is hidden, so nothing flashes)
  if (motion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    var sel = ".dpf-flow__step, .dpf-layer-cards, .dpf-rings, .dpf-split__col, .dpf-steps__list li, .dpf-uses li, .dpf-rails__grid li, .dpf-status, .dpf-explore__grid li, .dpf-figure";
    root.querySelectorAll(sel).forEach(function (el, i) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.setAttribute("data-reveal", "");
      el.style.transitionDelay = (i % 3) * 70 + "ms";
      io.observe(el);
    });
  }

  if (reduce.addEventListener) {
    reduce.addEventListener("change", function () {
      motion = !reduce.matches;
      if (!motion) root.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });
      drawFlow(); parallax();
    });
  }
})();
