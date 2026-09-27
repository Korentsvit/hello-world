/*! NWPharmaTech — NWPT-048 Science comparison tabs. Without JavaScript every panel is shown in order with its
    heading; with JavaScript the panels become an ARIA tab set (arrow keys, Home/End). No content is added or hidden
    beyond the panel switch. */
(function () {
  "use strict";
  var init = function () {
    document.querySelectorAll("[data-sci-tabs]").forEach(function (root, n) {
      if (root.hasAttribute("data-sci-ready")) return;
      root.setAttribute("data-sci-ready", "");
      var panels = [].slice.call(root.querySelectorAll(":scope > .sci-panel"));
      if (panels.length < 2) return;
      var list = document.createElement("div");
      list.className = "sci-tabs";
      list.setAttribute("role", "tablist");
      list.setAttribute("aria-label", root.getAttribute("data-sci-tabs") || "Comparison");
      var tabs = panels.map(function (p, i) {
        var h = p.querySelector(".sci-panel__title");
        var t = document.createElement("button");
        t.type = "button";
        t.className = "sci-tab";
        t.id = "sci-tab-" + n + "-" + i;
        t.setAttribute("role", "tab");
        t.setAttribute("aria-controls", p.id);
        t.textContent = h ? h.textContent : "Panel " + (i + 1);
        p.setAttribute("role", "tabpanel");
        p.setAttribute("aria-labelledby", t.id);
        p.setAttribute("tabindex", "0");
        if (h) h.classList.add("sci-visually-hidden");
        list.appendChild(t);
        return t;
      });
      root.insertBefore(list, panels[0]);
      root.classList.add("sci-compare--tabbed");
      var select = function (i, focus) {
        tabs.forEach(function (t, j) {
          var on = i === j;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          panels[j].hidden = !on;
        });
        if (focus) tabs[i].focus();
      };
      list.addEventListener("click", function (e) {
        var t = e.target.closest(".sci-tab");
        if (t) select(tabs.indexOf(t), false);
      });
      list.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        var k = e.key, next = null;
        if (k === "ArrowRight") next = (i + 1) % tabs.length;
        else if (k === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (k === "Home") next = 0;
        else if (k === "End") next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
      var start = 0;
      if (location.hash) panels.forEach(function (p, i) { if ("#" + p.id === location.hash || p.querySelector(location.hash.replace(/[^#\w-]/g, ""))) start = i; });
      select(start, false);
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
