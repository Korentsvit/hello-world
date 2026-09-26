/*! NWPharmaTech Programme Room — timeline enhancement.
 * Without JavaScript every stage is shown in order, with in-page links. With it, the stage links become an
 * ARIA tab list: one stage is shown at a time; Left/Right (or Up/Down), Home and End move between stages;
 * each stage gains Previous/Next buttons; the URL fragment (#stage-...) selects and deep-links a stage.
 */
(function () {
  var root = document.querySelector("[data-room-timeline]");
  if (!root) return;
  var links = Array.prototype.slice.call(root.querySelectorAll("[data-stage-link]"));
  var stages = Array.prototype.slice.call(root.querySelectorAll("[data-stage]"));
  if (!links.length || links.length !== stages.length) return;

  root.classList.add("is-enhanced");
  var list = root.querySelector(".room-steps ol");
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Timeline stages");
  root.querySelector(".room-stages").setAttribute("role", "none"); // its items become tab panels
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
    if (i > 0) nav.appendChild(stepButton("Previous stage: " + tabs[i - 1].querySelector(".room-steps__label").textContent, i - 1, "prev"));
    if (i < stages.length - 1) nav.appendChild(stepButton("Next stage: " + tabs[i + 1].querySelector(".room-steps__label").textContent, i + 1, "next"));
    st.querySelector(".room-panel").appendChild(nav);
  });
  function stepButton(label, target, kind) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "room-stage-nav__btn room-stage-nav__btn--" + kind;
    b.textContent = label;
    b.addEventListener("click", function () { select(target, true); stages[target].focus({ preventScroll: true }); scrollToTimeline(); });
    return b;
  }

  var current = -1;
  function select(i, updateHash) {
    if (i === current) return;
    current = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle("is-current", on);
      stages[k].hidden = !on;
    });
    if (updateHash && window.history && history.replaceState) history.replaceState(null, "", "#" + stages[i].id);
  }
  function scrollToTimeline() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var top = root.getBoundingClientRect().top;
    if (top < 0) root.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
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

  function fromHash() {
    var id = (location.hash || "").slice(1);
    for (var i = 0; i < stages.length; i++) if (stages[i].id === id) return i;
    return -1;
  }
  var start = fromHash();
  select(start >= 0 ? start : 0, false);
  if (start >= 0) root.scrollIntoView({ block: "start" });
  window.addEventListener("hashchange", function () { var i = fromHash(); if (i >= 0) { select(i, false); scrollToTimeline(); } });
})();
