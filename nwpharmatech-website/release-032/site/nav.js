/*! NWPharmaTech — NWPT-026 nav (NWPT-034 fix; NWPT-050 phone panel): click+keyboard primary, hover supplement, one-open accordion */
(function () {
  var btn = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!btn || !nav) return;

  var closeBtn = document.getElementById("nav-close");
  var mq = window.matchMedia("(max-width: 960px)");
  var header = btn.closest(".site-header") || nav.parentNode;
  var savedY = 0, locked = false, inerted = [];

  /* NWPT-050: on phones the open menu is a fixed panel starting at the header's bottom edge (styles.css). */
  function place() {
    var top = header.getBoundingClientRect().bottom, vv = window.visualViewport;
    nav.style.setProperty("--nav-top", Math.round(top) + "px");
    /* Height from the visible screen area, so the end of the menu stays reachable even when the page is zoomed or wider
       than the screen (the fixed panel would otherwise follow the larger layout area). */
    if (vv) nav.style.setProperty("--nav-avail", Math.max(0, Math.round(vv.height + vv.offsetTop - top)) + "px");
  }

  /* While the phone menu is open, the page behind it cannot be scrolled or reached with the keyboard, and its scroll
     position is restored when the menu closes. */
  function lockPage(lock) {
    if (lock === locked) return;
    locked = lock;
    if (lock) {
      savedY = window.scrollY;
      inerted = [].filter.call(document.body.children, function (el) {
        return el !== header && !el.contains(header) && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName) && !el.inert;
      });
      inerted.forEach(function (el) { el.inert = true; });
    } else {
      inerted.forEach(function (el) { el.inert = false; });
      inerted = [];
      if (Math.abs(window.scrollY - savedY) > 1) window.scrollTo({ top: savedY, behavior: "instant" });
    }
  }

  /* Pages that keep focused content clear of the sticky header with scroll-padding-top (Science, Programme Room,
     Work with us, homepage) also "reveal" a focused header control by scrolling the page, although the header never
     moves. Undo that jump: focusing Menu, Close, the logo or a menu item must not move the page. */
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () { lastY = window.scrollY; }, { passive: true });
  header.addEventListener("focusin", function () {
    if (Math.abs(window.scrollY - lastY) > 1) window.scrollTo({ top: lastY, behavior: "instant" });
  });
  function focusNoScroll(el) {
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function setMenuOpen(open) {
    var mobile = open && mq.matches;
    nav.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    btn.textContent = open ? "Close" : "Menu";
    if (mobile) { lockPage(true); place(); }
    document.documentElement.classList.toggle("nav-menu-open", mobile);
    closeAllGroups();
    if (mobile) nav.scrollTop = 0;
    else lockPage(false);
  }

  /* After a group opens in the phone panel, scroll the panel (never the page) just enough to show the group's heading
     and as many of its links as fit, heading first. */
  function reveal(group) {
    if (!mq.matches || !nav.classList.contains("is-open")) return;
    var gap = 8, n = nav.getBoundingClientRect(), g = group.getBoundingClientRect();
    var b = (group.querySelector(".nav-group__btn") || group).getBoundingClientRect();
    var d = 0;
    if (b.top < n.top + gap) d = b.top - n.top - gap;
    else if (g.bottom > n.bottom - gap) d = Math.min(g.bottom - n.bottom + gap, b.top - n.top - gap);
    if (d) nav.scrollTop += d;
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
      reveal(group);
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
      focusNoScroll(btn);
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
      if (t) focusNoScroll(t);
      return;
    }
    if (nav.classList.contains("is-open")) {
      closeMenu();
      focusNoScroll(btn);
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
  function onResize() {
    if (mq.matches && nav.classList.contains("is-open")) place();
  }
  window.addEventListener("resize", onResize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
  if (mq.addEventListener) mq.addEventListener("change", onMq);
  else if (mq.addListener) mq.addListener(onMq);

  closeAllGroups();
})();
