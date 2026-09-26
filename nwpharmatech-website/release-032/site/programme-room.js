/*! NWPharmaTech Programme Room — explorer enhancement.
 * Without JavaScript every stage is shown in order, with in-page links, and each stage has a plain
 * "Link to this topic" anchor. With it:
 *  - the stage links become an ARIA tab list showing one stage at a time; Left/Right (or Up/Down), Home and End
 *    move between stages; each stage gains Previous/Next buttons;
 *  - #stage-… selects a stage and #stage-…-sources also opens its "What supports this?" disclosure, on load, on
 *    hash change and when a link to the current hash is followed again; focus moves to the stage, the disclosure
 *    summary, or a focusable section (#now, #milestones, #open-questions);
 *  - "Link to this topic" becomes a "Copy link to this topic" button with a spoken confirmation.
 * Scrolling is instant when the visitor prefers reduced motion.
 */
(function () {
  var root = document.querySelector("[data-room-timeline]");
  if (!root) return;
  var links = Array.prototype.slice.call(root.querySelectorAll("[data-stage-link]"));
  var stages = Array.prototype.slice.call(root.querySelectorAll("[data-stage]"));
  if (!links.length || links.length !== stages.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var behavior = reduce ? "auto" : "smooth";

  root.classList.add("is-enhanced");
  root.querySelector(".room-stages").setAttribute("role", "none"); // its items become tab panels
  var list = root.querySelector(".room-steps ol");
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Programme stages");
  var tabs = links.map(function (a, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = a.className + " room-steps__tab";
    b.innerHTML = a.innerHTML;
    b.id = "tab-" + stages[i].id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", stages[i].id);
    a.parentNode.setAttribute("role", "presentation");
    a.parentNode.replaceChild(b, a);
    stages[i].setAttribute("role", "tabpanel");
    stages[i].setAttribute("aria-labelledby", b.id);
    stages[i].setAttribute("tabindex", "-1");
    return b;
  });

  // Previous / Next inside each stage
  stages.forEach(function (st, i) {
    var nav = document.createElement("div");
    nav.className = "room-stage-nav";
    if (i > 0) nav.appendChild(stepButton("Previous stage: " + label(i - 1), i - 1, "prev"));
    if (i < stages.length - 1) nav.appendChild(stepButton("Next stage: " + label(i + 1), i + 1, "next"));
    st.querySelector(".room-panel").appendChild(nav);
  });
  function label(i) { return tabs[i].querySelector(".room-steps__label").textContent; }
  function stepButton(text, target, kind) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "room-stage-nav__btn room-stage-nav__btn--" + kind;
    b.textContent = text;
    b.addEventListener("click", function () { select(target, true); stages[target].focus({ preventScroll: true }); scrollToTimeline(false); });
    return b;
  }

  // "Link to this topic" -> "Copy link to this topic"
  Array.prototype.forEach.call(root.querySelectorAll("a[data-copy-link]"), function (a) {
    var id = a.getAttribute("href").slice(1);
    var wrap = document.createElement("span");
    wrap.className = "room-copy-wrap";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "room-copy";
    b.textContent = "Copy link to this topic";
    var status = document.createElement("span");
    status.className = "room-copy__status";
    status.setAttribute("role", "status");
    wrap.appendChild(b); wrap.appendChild(status);
    a.parentNode.replaceChild(wrap, a);
    b.addEventListener("click", function () {
      var url = location.origin + location.pathname + "#" + id;
      var done = function () { status.textContent = "Link copied"; };
      var fail = function () { status.textContent = "Copy this link: " + url; };
      try { navigator.clipboard.writeText(url).then(done, fail); } catch (e) { fail(); }
      setTimeout(function () { if (status.textContent === "Link copied") status.textContent = ""; }, 4000);
    });
  });

  var current = -1;
  function select(i, updateHash) {
    if (i !== current) {
      current = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle("is-current", on);
        stages[k].hidden = !on;
      });
    }
    if (updateHash && window.history && history.replaceState) history.replaceState(null, "", "#" + stages[i].id);
  }
  // bring the stage strip into view (below the sticky header); force: also when it is below the viewport
  function scrollToTimeline(force) {
    var r = root.getBoundingClientRect();
    if (r.top < 0 || (force && r.top > window.innerHeight * 0.4)) root.scrollIntoView({ behavior: behavior, block: "start" });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(i, true); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, n = tabs.length, to = null;
      if (k === "ArrowRight" || k === "ArrowDown") to = (i + 1) % n;
      else if (k === "ArrowLeft" || k === "ArrowUp") to = (i - 1 + n) % n;
      else if (k === "Home") to = 0;
      else if (k === "End") to = n - 1;
      if (to === null) return;
      e.preventDefault();
      select(to, true);
      tabs[to].focus();
    });
  });

  // #stage-x, #stage-x-sources, or another focusable target on the page
  function go(hash, focus) {
    var id = (hash || "").replace(/^#/, "");
    if (!id) return false;
    var sources = /-sources$/.test(id), stageId = id.replace(/-sources$/, "");
    for (var i = 0; i < stages.length; i++) {
      if (stages[i].id !== stageId) continue;
      select(i, false);
      if (sources) {
        var d = document.getElementById(id);
        d.open = true;
        d.scrollIntoView({ behavior: behavior, block: "start" });
        if (focus) d.querySelector("summary").focus({ preventScroll: true });
      } else {
        scrollToTimeline(true);
        if (focus) stages[i].focus({ preventScroll: true });
      }
      return true;
    }
    var el = document.getElementById(id);
    if (el && focus && el.getAttribute("tabindex") === "-1") el.focus({ preventScroll: true });
    return false;
  }

  if (!go(location.hash, true)) select(0, false);
  window.addEventListener("hashchange", function () { go(location.hash, true); });
  // following a link to the hash that is already current fires no hashchange
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); go(location.hash, true); }
  });
})();
