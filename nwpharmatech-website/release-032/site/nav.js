/*! NWPharmaTech — NWPT-026 nav (NWPT-034 fix): click+keyboard primary, hover supplement, one-open accordion */
(function () {
  var btn = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!btn || !nav) return;

  var closeBtn = document.getElementById("nav-close");
  var mq = window.matchMedia("(max-width: 960px)");

  function setMenuOpen(open) {
    nav.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    btn.textContent = open ? "Close" : "Menu";
    document.documentElement.classList.toggle("nav-menu-open", open && mq.matches);
    closeAllGroups();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function setExpanded(group, open) {
    group.classList.toggle("is-open", open);
    if (!open) group.classList.remove("is-pinned");
    var t = group.querySelector(".nav-group__btn");
    if (t) t.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeAllGroups(except) {
    nav.querySelectorAll(".nav-group.is-open").forEach(function (g) {
      if (except && g === except) return;
      setExpanded(g, false);
    });
  }

  /** Click/keyboard: pin open so mouseleave does not immediately collapse. */
  function toggleGroup(group, pin) {
    var willOpen = !group.classList.contains("is-open") || (pin && !group.classList.contains("is-pinned"));
    closeAllGroups(willOpen ? group : null);
    if (willOpen) {
      setExpanded(group, true);
      if (pin) group.classList.add("is-pinned");
    } else {
      setExpanded(group, false);
    }
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setMenuOpen(!nav.classList.contains("is-open"));
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeMenu();
      btn.focus();
    });
  }

  nav.addEventListener("click", function (e) {
    var groupBtn = e.target.closest(".nav-group__btn");
    if (groupBtn && nav.contains(groupBtn)) {
      e.preventDefault();
      e.stopPropagation();
      /* Desktop: if already open from hover, pin it instead of toggling shut */
      var group = groupBtn.closest(".nav-group");
      if (!mq.matches && group.classList.contains("is-open") && !group.classList.contains("is-pinned")) {
        group.classList.add("is-pinned");
        groupBtn.setAttribute("aria-expanded", "true");
        return;
      }
      toggleGroup(group, true);
      return;
    }
    var link = e.target.closest("a");
    if (link && nav.contains(link) && mq.matches) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openGroup = nav.querySelector(".nav-group.is-open");
    if (openGroup) {
      closeAllGroups();
      var t = openGroup.querySelector(".nav-group__btn");
      if (t) t.focus();
      return;
    }
    if (nav.classList.contains("is-open")) {
      closeMenu();
      btn.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (nav.contains(e.target) || btn.contains(e.target)) return;
    closeAllGroups();
    if (mq.matches && nav.classList.contains("is-open")) {
      closeMenu();
    }
  });

  /* Desktop: hover opens ONE group (supplement); pinned groups ignore mouseleave */
  nav.querySelectorAll(".nav-group").forEach(function (group) {
    group.addEventListener("mouseenter", function () {
      if (mq.matches) return;
      if (group.classList.contains("is-pinned")) return;
      closeAllGroups(group);
      setExpanded(group, true);
    });
    group.addEventListener("mouseleave", function () {
      if (mq.matches) return;
      if (group.classList.contains("is-pinned")) return;
      setExpanded(group, false);
    });
    /* NWPT-034: focus alone no longer opens a group. Opening on focus made the following click, tap or
       Enter toggle the group shut again, so the menus only worked by hover. Click, tap and Enter/Space
       now open and close; moving focus to another group closes this one. */
    group.addEventListener("focusin", function () {
      if (mq.matches) return;
      closeAllGroups(group);
    });
    group.addEventListener("focusout", function (e) {
      if (mq.matches) return;
      if (group.contains(e.relatedTarget)) return;
      setExpanded(group, false);
    });
  });

  function onMq() {
    if (!mq.matches) {
      closeMenu();
      document.documentElement.classList.remove("nav-menu-open");
    }
    closeAllGroups();
  }
  if (mq.addEventListener) mq.addEventListener("change", onMq);
  else if (mq.addListener) mq.addListener(onMq);

  closeAllGroups();
})();
