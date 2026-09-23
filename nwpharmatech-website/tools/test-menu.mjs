// Mobile menu tests under Cloudflare-compatible hosting: serves ../public with Cloudflare's own Pages runtime
// (`wrangler pages dev`, so the site's routes, headers and CSP apply), then drives the menu in Chromium.
//   cd tools && npm install && node test-menu.mjs
// Covers phone and tablet widths (320-768 px) and the 1099/1100 px breakpoint, short viewports (a landscape phone,
// 400% zoom on a laptop), touch, reduced motion and forced colours (Chromium's emulation of Windows contrast themes,
// light and dark), and the header's translatable labels and citation link names. Saves screenshots of the open menu
// to ../docs/qa/screenshots/menu-open-320.png and menu-open-390.png, and of the open menu in forced colours (dark)
// at 320 px to menu-forced-colors-320.png.
// Prints one PASS/FAIL line per check (aggregated over pages and widths). Exits non-zero on any failure.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { serve } from "./lib/cf-serve.mjs";

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(process.env.PUBLIC_DIR || path.join(here, "../public"));
const shots = path.resolve(here, "../docs/qa/screenshots");
fs.mkdirSync(shots, { recursive: true });

const PAGES = ["/", "/study", "/evidence", "/faq", "/people"];
const WIDTHS = [[320, 568], [360, 740], [375, 667], [390, 844], [414, 896], [768, 1024]];
// Where the menu has failed before: leaving it backwards and using the skip link; short and zoomed screens.
const ESCAPES = [["/study", 375, 667], ["/faq", 390, 600], ["/faq", 320, 568], ["/people", 768, 1024], ["/people", 1099, 700]];
const SHORT = [[568, 320], [341, 162], [320, 180]];
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

// check(name, pass, where, detail): results are aggregated by name so each check prints once.
const results = new Map();
const check = (name, pass, where = "", detail = "") => {
  const r = results.get(name) || { runs: 0, fails: [] };
  r.runs++;
  if (!pass) r.fails.push(`${where}${detail ? ` ${detail}` : ""}`.trim());
  results.set(name, r);
};

// ---- page probes ----
const state = (page) => page.evaluate(() => {
  const t = document.querySelector(".nav-toggle"), p = document.getElementById("mobile-nav"), a = document.activeElement;
  return {
    expanded: t.getAttribute("aria-expanded"), hidden: p.hidden, bodyOpen: document.body.classList.contains("menu-open"),
    path: location.pathname, hash: location.hash, y: Math.round(scrollY), activeInPanel: p.contains(a),
    active: a === t ? "toggle" : a.id ? "#" + a.id : a.tagName.toLowerCase() + ":" + a.textContent.trim().slice(0, 40),
    open: [...p.querySelectorAll("details[open] > summary")].map((s) => s.textContent.trim()),
  };
});
const closed = (s) => s.expanded === "false" && s.hidden && !s.bodyOpen;
const overflow = (page) => page.evaluate(() => {
  const p = document.getElementById("mobile-nav");
  return { page: document.documentElement.scrollWidth - innerWidth, panel: p.scrollWidth - p.clientWidth };
});
const focusVisible = (page) => page.evaluate(() => {
  const el = document.activeElement, cs = getComputedStyle(el);
  return el.matches(":focus-visible") && cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2;
});
// The focused element is in the viewport and not covered (e.g. by the sticky header or the menu panel).
// A link that wraps has one box per line: probe its first line box, not the bounding box (which covers other text).
const unobscured = (page) => page.evaluate(() => {
  const el = document.activeElement, r = el.getClientRects()[0] || el.getBoundingClientRect();
  const x = r.left + Math.min(r.width, 40) / 2, y = r.top + Math.min(r.height, 40) / 2;
  if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
  const hit = document.elementFromPoint(x, y);
  return !!hit && (el === hit || el.contains(hit));
});
// The focused element is outside the menu panel and not covered by it: the centre and two corners of each of its
// (first three) line boxes are checked.
const coveredByMenu = (page) => page.evaluate(() => {
  const el = document.activeElement, p = document.getElementById("mobile-nav");
  if (p.contains(el)) return false;
  return [...el.getClientRects()].slice(0, 3).some((r) => [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.bottom - 2]].some(([x, y]) => {
    const hit = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight && document.elementFromPoint(x, y);
    return !!hit && p.contains(hit);
  }));
});
// Screenshot a region and count, per pixel row, the pixels that stand out from its most common colour (the
// background). The PNG is decoded in a blank page of the same context, so no image library is needed.
const inkRows = async (page, clip) => {
  const png = (await page.screenshot({ clip })).toString("base64");
  const helper = await page.context().newPage();
  try {
    return await helper.evaluate(async (src) => {
      const img = new Image();
      img.src = "data:image/png;base64," + src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data, n = new Map();
      for (let i = 0; i < d.length; i += 4) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; n.set(k, (n.get(k) || 0) + 1); }
      const bg = [...n.entries()].sort((a, b) => b[1] - a[1])[0][0], rgb = [bg >> 16, (bg >> 8) & 255, bg & 255];
      const rows = [];
      for (let y = 0; y < c.height; y++) {
        let k = 0;
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          if (Math.abs(d[i] - rgb[0]) + Math.abs(d[i + 1] - rgb[1]) + Math.abs(d[i + 2] - rgb[2]) > 150) k++;
        }
        rows.push(k);
      }
      return rows;
    }, png);
  } finally {
    await helper.close();
  }
};
const sum = (a) => a.reduce((x, y) => x + y, 0);
const briefPosition = (page) => page.evaluate(() => ({
  top: Math.round(document.getElementById("programme-brief").getBoundingClientRect().top),
  header: Math.round(document.querySelector(".site-header").getBoundingClientRect().bottom),
}));
// Records the most groups ever open at once (checked after each change is delivered).
const watchOpenGroups = (page) => page.evaluate(() => {
  const count = () => document.querySelectorAll("#mobile-nav details[open]").length;
  window.__maxOpen = count();
  new MutationObserver(() => { window.__maxOpen = Math.max(window.__maxOpen, count()); })
    .observe(document.getElementById("mobile-nav"), { attributes: true, subtree: true, attributeFilter: ["open"] });
});
const settle = (page) => page.waitForTimeout(80);
// The site scrolls smoothly: wait until the scroll position has stopped changing.
const scrollSettled = (page) => page.evaluate(() => new Promise((done) => {
  let y = scrollY, still = 0;
  const tick = () => {
    if (scrollY === y) still++; else { y = scrollY; still = 0; }
    if (still > 8) done(); else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));
const openMenu = async (page) => {
  await page.locator(".nav-toggle").click();
  await settle(page);
};

// One browser context per scenario; an exception fails the scenario instead of ending the run.
const session = async (browser, where, options, fn) => {
  const ctx = await browser.newContext(options);
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  try {
    await fn(page, errors);
  } catch (e) {
    check("scenario completed without an exception", false, where, e.message.split("\n")[0]);
  } finally {
    await ctx.close();
  }
};

// ---- scenarios ----
async function narrow(page, errors, b, p, w, h) {
  const where = `${p}@${w}`;
  await page.goto(b + (p === "/study" ? "/study#milestones" : p));
  await scrollSettled(page);
  await watchOpenGroups(page);

  const homes = await page.$$eval("#mobile-nav a", (as) => as.filter((a) => a.textContent.trim() === "Home")
    .map((a) => ({ href: a.getAttribute("href"), cur: a.getAttribute("aria-current") })));
  check("exactly one Home link in the mobile menu", homes.length === 1 && homes[0].href === "/", where, JSON.stringify(homes));
  check("Home link has aria-current=page only on the home page", homes.length === 1 && (homes[0].cur === "page") === (p === "/"), where, JSON.stringify(homes));
  const brief = await page.$$eval('#mobile-nav a[href="/#programme-brief"]', (as) => as.map((a) => a.textContent.trim()));
  check("menu has one 'Programme brief' link to /#programme-brief", brief.length === 1 && brief[0] === "Programme brief", where, JSON.stringify(brief));
  const t = await page.evaluate(() => { const t = document.querySelector(".nav-toggle"); return { c: t.getAttribute("aria-controls"), e: t.getAttribute("aria-expanded"), v: t.checkVisibility() }; });
  check("toggle visible, aria-controls=mobile-nav, aria-expanded=false", t.v && t.c === "mobile-nav" && t.e === "false", where, JSON.stringify(t));
  let s = await state(page);
  check("menu starts closed with JavaScript", closed(s), where, JSON.stringify(s));
  let o = await overflow(page);
  check("no horizontal scroll with the menu closed", o.page <= 0, where, `scrollWidth-innerWidth=${o.page}`);

  // Open from the keyboard: focus goes to the first link.
  await page.locator(".nav-toggle").focus();
  await page.keyboard.press("Enter");
  await settle(page);
  s = await state(page);
  check("toggle opens the menu (aria-expanded=true, panel shown, body.menu-open)", s.expanded === "true" && !s.hidden && s.bodyOpen, where, JSON.stringify(s));
  check("opening moves focus to the first link (Home), visibly", s.active === "a:Home" && (await focusVisible(page)), where, s.active);
  const cur = await page.$$eval('#mobile-nav details a[aria-current="page"]', (as) => as.map((a) => a.closest("details").querySelector("summary").textContent.trim()));
  check("only the group holding the current page starts open", JSON.stringify(s.open) === JSON.stringify(cur) && s.open.length === (p === "/" ? 0 : 1), where, `open=${JSON.stringify(s.open)} current=${JSON.stringify(cur)}`);
  const names = await page.$$eval("#mobile-nav details", (ds) => ds.map((d) => d.getAttribute("name")));
  check("groups share one details name (native exclusive accordion)", names.length === 3 && names.every((n) => n === "mobile-nav-group"), where, JSON.stringify(names));
  const r = await page.evaluate(() => Math.round(document.getElementById("mobile-nav").getBoundingClientRect().bottom));
  check("open panel ends within the viewport", r <= h + 1, where, `bottom=${r} viewport=${h}`);
  o = await overflow(page);
  check("no horizontal scroll with the menu open", o.page <= 0 && o.panel <= 0, where, JSON.stringify(o));
  if (p === "/study" && (w === 320 || w === 390)) await page.screenshot({ path: path.join(shots, `menu-open-${w}.png`) });

  await page.evaluate(axeSource);   // through DevTools: an injected inline <script> would be refused by the CSP
  const axe = await page.evaluate(async (values) => {
    const res = await window.axe.run(document, { runOnly: { type: "tag", values } });
    return res.violations.map((v) => `${v.id}(${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(", ")}`);
  }, AXE_TAGS);
  check("axe (WCAG 2.2 AA + best practice): no violations with the menu open", axe.length === 0, where, axe.join("; "));

  // One group at a time, pointer: click each closed group in turn (the one already open last).
  const summaries = page.locator("#mobile-nav summary");
  const titles = await summaries.allTextContents();
  const order = [...titles.keys()].sort((a, c) => s.open.includes(titles[a]) - s.open.includes(titles[c]));
  const seen = [];
  for (const i of order) {
    await summaries.nth(i).click();
    await settle(page);
    seen.push((await state(page)).open);
  }
  check("clicking a group opens it and closes the others", order.every((i, n) => JSON.stringify(seen[n]) === JSON.stringify([titles[i]])), where, JSON.stringify(seen));
  if (!(await state(page)).open.includes("About")) await page.locator("#mobile-nav summary", { hasText: "About" }).click();
  o = await overflow(page);
  check("no horizontal scroll with the longest group open", o.page <= 0 && o.panel <= 0, where, JSON.stringify(o));

  // One group at a time, keyboard: Enter and Space on the group headings, with visible focus.
  await summaries.nth(0).focus();
  await page.keyboard.press("Enter");
  await settle(page);
  const k1 = (await state(page)).open;
  const fv = await focusVisible(page);
  await summaries.nth(1).focus();
  await page.keyboard.press(" ");
  await settle(page);
  const k2 = (await state(page)).open;
  await page.keyboard.press("Enter");
  await settle(page);
  const k3 = (await state(page)).open;
  check("Enter/Space on a group heading opens it, closes the others, and closes it again",
    JSON.stringify(k1) === JSON.stringify([titles[0]]) && JSON.stringify(k2) === JSON.stringify([titles[1]]) && k3.length === 0, where, JSON.stringify([k1, k2, k3]));
  check("focus is visible on a group heading", fv, where);
  check("never more than one group open at once", (await page.evaluate(() => window.__maxOpen)) <= 1, where);
  const sizes = await page.$$eval("#mobile-nav a, #mobile-nav summary, .nav-toggle", (els) => els.filter((e) => e.checkVisibility())
    .map((e) => { const q = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 20), w: Math.round(q.width), h: Math.round(q.height) }; }));
  const small = sizes.filter((x) => x.w < 24 || x.h < 24);
  check("menu targets at least 24x24 CSS px (WCAG 2.5.8)", sizes.length > 4 && small.length === 0, where, JSON.stringify(small));

  // Escape closes and returns focus to the toggle.
  await page.keyboard.press("Escape");
  await settle(page);
  s = await state(page);
  check("Escape closes the menu and returns focus to the toggle", closed(s) && s.active === "toggle", where, JSON.stringify(s));

  // Tabbing past the last item closes the menu; the newly focused element is not hidden behind it.
  await openMenu(page);
  await page.evaluate(() => { const els = [...document.querySelectorAll("#mobile-nav a, #mobile-nav summary")].filter((e) => e.checkVisibility()); els[els.length - 1].focus(); });
  await page.keyboard.press("Tab");
  await settle(page);
  await scrollSettled(page);
  s = await state(page);
  check("tabbing out of the menu closes it", closed(s) && !s.activeInPanel && s.active !== "toggle", where, JSON.stringify(s));
  check("focus after leaving the menu is visible and not obscured", (await unobscured(page)) && (await focusVisible(page)), where, s.active);

  // Opening and closing the menu part-way down the page keeps the reader's place.
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
  const mainTop = () => page.evaluate(() => Math.round(document.getElementById("main").getBoundingClientRect().top));
  const m0 = await mainTop();
  await page.evaluate(() => document.querySelector(".nav-toggle").focus());
  await page.keyboard.press("Enter");
  await settle(page);
  const m1 = await mainTop();
  await page.keyboard.press("Escape");
  await settle(page);
  const m2 = await mainTop();
  s = await state(page);
  check("opening and closing the menu part-way down keeps the page in place", Math.abs(m1 - m0) <= 1 && m2 === m0 && s.y === 300, where, JSON.stringify({ m0, m1, m2, y: s.y }));

  // The current page's own link: the menu closes, focus goes to the main content, back at the top.
  await openMenu(page);
  const own = page.locator('#mobile-nav a[aria-current="page"]');
  if (!(await own.isVisible())) await page.locator("#mobile-nav details", { has: page.locator('a[aria-current="page"]') }).locator("summary").click();
  await own.click();
  await settle(page);
  await scrollSettled(page);
  s = await state(page);
  check("selecting the current page link closes the menu (aria-expanded=false)", closed(s), where, JSON.stringify(s));
  check("current page link: focus on the main content at the top, URL without fragment", s.active === "#main" && s.path === p && s.hash === "" && s.y === 0, where, JSON.stringify(s));

  // In-page destination (home page): Tab from Home to 'Programme brief', then Enter; then the same by pointer.
  if (p === "/") {
    await page.locator(".nav-toggle").focus();
    await page.keyboard.press("Enter");
    await settle(page);
    await page.keyboard.press("Tab");
    const on = (await state(page)).active;
    await page.keyboard.press("Enter");
    await settle(page);
    await scrollSettled(page);
    s = await state(page);
    check("in-page link (keyboard): menu closes, aria-expanded=false", on === "a:Programme brief" && closed(s), where, JSON.stringify(s));
    check("in-page link (keyboard): focus at the destination, hash updated", s.active === "#programme-brief" && s.hash === "#programme-brief", where, JSON.stringify(s));
    const pos = await briefPosition(page);
    check("in-page destination scrolled into view, clear of the sticky header", pos.top >= pos.header - 1 && pos.top < h / 2, where, JSON.stringify(pos));
    await page.evaluate(() => { history.replaceState(null, "", "/"); window.scrollTo({ top: 0, behavior: "instant" }); });
    await openMenu(page);
    await page.locator('#mobile-nav a[href="/#programme-brief"]').click();
    await settle(page);
    await scrollSettled(page);
    s = await state(page);
    check("in-page link (pointer): menu closes, focus at the destination, hash updated", closed(s) && s.active === "#programme-brief" && s.hash === "#programme-brief", where, JSON.stringify(s));
  }
  check("no console errors (including CSP reports)", errors.length === 0, where, errors.join("; "));
}

// An open menu taller than the viewport scrolls inside the viewport, at the top of the page and further down.
async function tall(page, b, scrolled) {
  const where = `/faq@320x480${scrolled ? " scrolled" : ""}`;
  await page.goto(b + "/faq");
  if (scrolled) await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
  await openMenu(page);
  const m = await page.evaluate(() => {
    const p = document.getElementById("mobile-nav"), r = p.getBoundingClientRect();
    p.scrollTop = p.scrollHeight;
    const links = [...p.querySelectorAll("a")].filter((a) => a.checkVisibility()), last = links[links.length - 1].getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, scrollable: p.scrollHeight > p.clientHeight, lastTop: Math.round(last.top), lastBottom: Math.round(last.bottom) };
  });
  check("an open menu taller than the viewport scrolls to its last link", m.scrollable && m.bottom <= m.vh + 1 && m.lastBottom <= m.vh && m.lastTop >= m.top, where, JSON.stringify(m));
}

// Browsers without <details name>: the script keeps one group open. Then the brief link from another page.
async function fallback(page, b) {
  const where = "/study@390";
  await page.goto(b + "/study");
  await page.evaluate(() => document.querySelectorAll("#mobile-nav details").forEach((d) => d.removeAttribute("name")));
  await openMenu(page);
  await page.locator("#mobile-nav summary", { hasText: "The research" }).click();
  await settle(page);
  const a = (await state(page)).open;
  await page.locator("#mobile-nav summary", { hasText: "About" }).focus();
  await page.keyboard.press(" ");
  await settle(page);
  const c = (await state(page)).open;
  check("without <details name> support: still one group open at a time (click and keyboard)", JSON.stringify(a) === '["The research"]' && JSON.stringify(c) === '["About"]', where, JSON.stringify([a, c]));
  await page.locator('#mobile-nav a[href="/#programme-brief"]').click();
  await page.waitForURL(/\/#programme-brief$/);
  await scrollSettled(page);
  const s = await state(page);
  const pos = await briefPosition(page);
  check("'Programme brief' from another page opens the home page at the brief, clear of the sticky header",
    s.path === "/" && s.hash === "#programme-brief" && pos.top >= pos.header - 1 && pos.top < 844 / 2, where, JSON.stringify({ ...s, ...pos }));
}

// Breakpoint: the toggle below 1100 px, the desktop navigation from 1100 px.
async function breakpoint(page, b, w) {
  for (const p of PAGES) {
    const where = `${p}@${w}`;
    await page.goto(b + p);
    const v = await page.evaluate(() => ({ toggle: document.querySelector(".nav-toggle").checkVisibility(), desktop: document.querySelector(".site-nav").checkVisibility() }));
    let o = await overflow(page);
    if (w >= 1100) {
      check("at >= 1100 px the toggle is hidden and the desktop navigation shown", !v.toggle && v.desktop, where, JSON.stringify(v));
    } else {
      check("at 1099 px the toggle is shown and the desktop navigation hidden", v.toggle && !v.desktop, where, JSON.stringify(v));
      await openMenu(page);
      const open = await overflow(page);
      o = { page: Math.max(o.page, open.page), panel: open.panel };
    }
    check("no horizontal scroll at the 1099/1100 px breakpoint (menu open and closed)", o.page <= 0 && !(o.panel > 0), where, JSON.stringify(o));
  }
  if (w === 1099) {
    await page.setViewportSize({ width: 1100, height: 900 });
    await settle(page);
    const s = await state(page);
    check("widening to 1100 px with the menu open closes it", closed(s), `@${w}`, JSON.stringify(s));
  }
}

// Without JavaScript the menu stays visible and usable.
async function noScript(page, b) {
  const where = "/study@390 no-JS";
  await page.goto(b + "/study");
  const v = await page.evaluate(() => ({
    toggle: document.querySelector(".nav-toggle").checkVisibility(),
    links: [...document.querySelectorAll("#mobile-nav a")].filter((a) => a.checkVisibility()).map((a) => a.textContent.trim()),
  }));
  check("no JavaScript: menu links visible, toggle hidden", !v.toggle && ["Home", "Programme brief", "The study: progress and evidence"].every((l) => v.links.includes(l)), where, JSON.stringify(v));
  await page.locator("#mobile-nav summary", { hasText: "About" }).click();
  const n = await page.evaluate(() => ({
    open: [...document.querySelectorAll("#mobile-nav details[open] > summary")].map((s) => s.textContent.trim()),
    contact: [...document.querySelectorAll("#mobile-nav a")].some((a) => a.textContent.trim() === "Contact" && a.checkVisibility()),
  }));
  check("no JavaScript: groups open natively, one at a time", n.contact && JSON.stringify(n.open) === '["About"]', where, JSON.stringify(n));
}

// Leaving the open menu backwards (Shift+Tab past the toggle, up to the skip link), then using the skip link: the
// menu closes at the first focus stop outside it and the toggle, and no focus stop is hidden behind the panel.
// Then the skip link activated while the menu is open without focusing it first, as a screen reader may do.
async function escapes(page, errors, b, p, w, h) {
  const where = `${p}@${w}x${h}`;
  await page.goto(b + p);
  await page.locator(".nav-toggle").focus();
  await page.keyboard.press("Enter");
  await settle(page);
  const back = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Shift+Tab");
    await settle(page);
    back.push({ ...(await state(page)), covered: await coveredByMenu(page) });
    if (back[i].active === "a:Skip to main content") break;
  }
  const trail = JSON.stringify(back.map((s) => [s.active, s.expanded]));
  check("Shift+Tab from the open menu reaches the skip link", back[back.length - 1].active === "a:Skip to main content", where, trail);
  const out = back.filter((s) => !s.activeInPanel && s.active !== "toggle");
  check("Shift+Tab: the menu stays open on the toggle, and closes at the first focus stop outside it",
    back[0].active === "toggle" && back[0].expanded === "true" && out.length > 0 && out.every(closed), where, trail);
  await page.keyboard.press("Enter");   // the skip link
  await settle(page);
  await scrollSettled(page);
  let s = await state(page);
  check("skip link after leaving the menu: focus on the main content, menu closed", s.active === "#main" && closed(s), where, JSON.stringify(s));
  const stops = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    await settle(page);
    await scrollSettled(page);
    stops.push({ active: (await state(page)).active, covered: await coveredByMenu(page), seen: (await unobscured(page)) && (await focusVisible(page)) });
  }
  check("Shift+Tab and skip link: no focus stop is covered by #mobile-nav", back.concat(stops).every((x) => !x.covered), where,
    JSON.stringify(back.concat(stops).filter((x) => x.covered).map((x) => x.active)));
  check("the focus stops after the skip link are visible and not obscured", stops.every((x) => x.seen), where, JSON.stringify(stops));

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.locator(".nav-toggle").focus();
  await page.keyboard.press("Enter");
  await settle(page);
  await page.evaluate(() => document.querySelector(".skip-link").click());
  await settle(page);
  await scrollSettled(page);
  s = await state(page);
  const covered = await coveredByMenu(page);
  await page.keyboard.press("Tab");
  await settle(page);
  await scrollSettled(page);
  const next = { active: (await state(page)).active, covered: await coveredByMenu(page) };
  check("skip link activated with the menu open (without focus): menu closes, focus on the main content, not covered by #mobile-nav",
    closed(s) && s.active === "#main" && !covered && !next.covered, where, JSON.stringify({ ...s, covered, next }));
  check("no console errors (including CSP reports)", errors.length === 0, where, errors.join("; "));
}

// Short or zoomed viewports (a landscape phone; 400% zoom on a 1366x768 laptop, 341x162 or so): the open panel lies
// within the viewport, every item can be reached from the keyboard and is fully in view when focused, the last link
// can be scrolled to, and closing the menu puts the page back where it was.
async function short(page, errors, b, p, w, h) {
  const where = `${p}@${w}x${h}`;
  await page.goto(b + p);
  await page.locator(".nav-toggle").focus();   // scrolls the toggle into view, as tabbing to it would
  await scrollSettled(page);
  const y0 = await page.evaluate(() => Math.round(scrollY));
  await page.keyboard.press("Enter");
  await settle(page);
  const g = await page.evaluate(() => {
    const r = document.getElementById("mobile-nav").getBoundingClientRect();
    return { header: Math.round(document.querySelector(".site-header").getBoundingClientRect().top), top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight };
  });
  check("short viewport: the open panel lies within the viewport, below a header moved to the top", g.header === 0 && g.top >= 0 && g.bottom <= g.vh + 1 && g.bottom - g.top >= 60, where, JSON.stringify(g));
  const all = await page.$$eval("#mobile-nav a", (as) => as.map((a) => a.textContent.trim()));
  const seen = new Set(), hidden = [];
  for (let i = 0; i < 40; i++) {   // Tab through the menu, opening each group from the keyboard
    const f = await page.evaluate(() => {
      const el = document.activeElement, p = document.getElementById("mobile-nav");
      if (!p.contains(el)) return null;
      const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + Math.min(r.width, 40) / 2, r.top + r.height / 2);
      return { t: el.textContent.trim(), link: el.tagName === "A", closedGroup: el.tagName === "SUMMARY" && !el.parentElement.open,
        seen: r.top >= -1 && r.bottom <= innerHeight + 1 && !!hit && (hit === el || el.contains(hit)) };   // 1 px: sub-pixel layout
    });
    if (!f) break;
    if (f.link) seen.add(f.t);
    if (!f.seen) hidden.push(f.t);
    if (f.closedGroup) {
      await page.keyboard.press("Enter");
      await settle(page);
    }
    await page.keyboard.press("Tab");
    await settle(page);
  }
  check("short viewport: every menu item can be reached from the keyboard", all.length > 10 && all.every((t) => seen.has(t)), where, JSON.stringify(all.filter((t) => !seen.has(t))));
  check("short viewport: each focused menu item is fully in view", hidden.length === 0, where, JSON.stringify(hidden));

  // Pointer: open, scroll the panel to its end, close with the toggle. Then the keyboard: open, Escape.
  await scrollSettled(page);   // the walk ended with focus leaving the menu for the page
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y0);
  await page.locator(".nav-toggle").scrollIntoViewIfNeeded();
  await scrollSettled(page);
  const y1 = await page.evaluate(() => Math.round(scrollY));
  await page.locator(".nav-toggle").click();
  await settle(page);
  const m = await page.evaluate(() => {
    const p = document.getElementById("mobile-nav");
    p.scrollTop = p.scrollHeight;
    const links = [...p.querySelectorAll("a")].filter((a) => a.checkVisibility()), last = links[links.length - 1].getBoundingClientRect();
    return { top: Math.round(p.getBoundingClientRect().top), vh: innerHeight, lastTop: Math.round(last.top), lastBottom: Math.round(last.bottom) };
  });
  check("short viewport: the panel scrolls to its last link", m.lastBottom <= m.vh && m.lastTop >= m.top, where, JSON.stringify(m));
  await page.locator(".nav-toggle").click();
  await settle(page);
  const pointer = await state(page);
  await page.locator(".nav-toggle").focus();
  await scrollSettled(page);
  const y2 = await page.evaluate(() => Math.round(scrollY));
  await page.keyboard.press("Enter");
  await settle(page);
  const moved = (await state(page)).y !== y2;
  await page.keyboard.press("Escape");
  await settle(page);
  const s = await state(page);
  check("short viewport: closing the menu (toggle or Escape) puts the page back where it was, focus on the toggle",
    moved && closed(pointer) && pointer.y === y1 && closed(s) && s.active === "toggle" && s.y === y2, where, JSON.stringify({ y1, pointer: pointer.y, y2, moved, ...s }));
  check("no console errors (including CSP reports)", errors.length === 0, where, errors.join("; "));
}

// Forced colours (Windows contrast themes; Chromium's emulation), light and dark, at 320 px (the "Menu" label is
// hidden) and 390 px: the toggle's icon is drawn, closed and open, and the current page stays marked in the menu.
async function forced(page, errors, b, w, scheme) {
  const where = `/people@${w} ${scheme}`;
  await page.goto(b + "/people");
  check("forced colours emulation is active", await page.evaluate(() => matchMedia("(forced-colors: active)").matches), where);
  const icon = async () => {
    const r = await page.locator(".nav-toggle-bar").boundingBox();   // the middle bar; the others sit 6 px above and below
    return sum(await inkRows(page, { x: r.x - 3, y: r.y - 10, width: r.width + 6, height: r.height + 20 }));
  };
  const shut = await icon();
  await openMenu(page);
  const open = await icon();
  check("forced colours: the menu toggle shows its icon, closed and open", shut >= 30 && open >= 30, where, JSON.stringify({ shut, open }));
  const deco = await page.$eval('#mobile-nav a[aria-current="page"]', (a) => getComputedStyle(a).textDecorationLine);
  check("forced colours: the current page is underlined in the open menu", deco.includes("underline"), where, deco);
  if (w === 320 && scheme === "dark") await page.screenshot({ path: path.join(shots, "menu-forced-colors-320.png") });
  check("no console errors (including CSP reports)", errors.length === 0, where, errors.join("; "));
}

// Forced colours, desktop navigation at 1280 px: the current page keeps a visible bar under it (borders survive
// forced colours; the box shadow used before did not), and the current section is underlined.
async function forcedDesktop(page, errors, b, scheme) {
  const where = `/people@1280 ${scheme}`;
  await page.goto(b + "/people");
  const bottom = async (sel) => {
    const r = await page.locator(sel).boundingBox();
    return sum((await inkRows(page, { x: r.x, y: r.y, width: r.width, height: r.height })).slice(-3));
  };
  const cur = await bottom('.site-nav a[aria-current="page"]'), other = await bottom('.site-nav a[href="/contact"]');
  check("forced colours: the desktop navigation marks the current page", cur >= 20 && other === 0, where, JSON.stringify({ cur, other }));
  await page.goto(b + "/science");
  const deco = await page.$eval('.site-nav a[aria-current="true"]', (a) => getComputedStyle(a).textDecorationLine);
  check("forced colours: the desktop navigation marks the current section", deco.includes("underline"), `/science@1280 ${scheme}`, deco);
}

// Touch (a phone): tap to open and close, tap a group, tap the page outside the menu, tap the current page, tap a
// link to another page.
async function touch(page, errors, b) {
  const where = "/people@390 touch";
  await page.goto(b + "/people");
  const tap = async (loc) => { await loc.tap(); await settle(page); };
  await tap(page.locator(".nav-toggle"));
  let s = await state(page);
  check("touch: tapping the toggle opens the menu", s.expanded === "true" && !s.hidden && s.bodyOpen, where, JSON.stringify(s));
  await tap(page.locator("#mobile-nav summary", { hasText: "The research" }));
  s = await state(page);
  check("touch: tapping a group opens it and closes the others", JSON.stringify(s.open) === '["The research"]', where, JSON.stringify(s.open));
  await tap(page.locator(".nav-toggle"));
  s = await state(page);
  check("touch: tapping the toggle again closes the menu", closed(s), where, JSON.stringify(s));
  await tap(page.locator(".nav-toggle"));
  const below = await page.evaluate(() => Math.round(document.getElementById("mobile-nav").getBoundingClientRect().bottom));
  await page.touchscreen.tap(4, Math.min(below + 20, 840));   // the page margin, below the panel
  await settle(page);
  s = await state(page);
  check("touch: tapping the page outside the open menu closes it", below < 820 && closed(s), where, JSON.stringify({ below, ...s }));
  await tap(page.locator(".nav-toggle"));
  if (!(await state(page)).open.includes("About")) await tap(page.locator("#mobile-nav summary", { hasText: "About" }));
  await tap(page.locator('#mobile-nav a[aria-current="page"]'));
  await scrollSettled(page);
  s = await state(page);
  check("touch: tapping the current page closes the menu, focus on the main content at the top", closed(s) && s.active === "#main" && s.y === 0, where, JSON.stringify(s));
  await tap(page.locator(".nav-toggle"));
  if (!(await state(page)).open.includes("About")) await tap(page.locator("#mobile-nav summary", { hasText: "About" }));
  await Promise.all([page.waitForURL(/\/contact$/), page.locator('#mobile-nav a[href="/contact"]').tap()]);
  s = await state(page);
  check("touch: tapping a link to another page opens it, menu closed", s.path === "/contact" && closed(s), where, JSON.stringify(s));
  check("no console errors (including CSP reports)", errors.length === 0, where, errors.join("; "));
}

// The current page's own link from the keyboard (the pointer case is in narrow()).
async function keyboardCurrent(page, errors, b) {
  const where = "/people@390 keyboard";
  await page.goto(b + "/people");
  await page.locator(".nav-toggle").focus();
  await page.keyboard.press("Enter");
  await settle(page);
  for (let i = 0; i < 12 && !(await page.evaluate(() => document.activeElement.getAttribute("aria-current") === "page")); i++) await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await settle(page);
  await scrollSettled(page);
  const s = await state(page);
  check("current page link (keyboard): menu closes, focus on the main content at the top, URL without fragment",
    closed(s) && s.active === "#main" && s.path === "/people" && s.hash === "" && s.y === 0, where, JSON.stringify(s));
}

// Reduced motion: no smooth scrolling, so an in-page destination is reached at once (no wait for a scroll to end).
async function reduced(page, errors, b) {
  const where = "/@390 reduced motion";
  await page.goto(b + "/");
  const behaviour = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  await openMenu(page);
  await page.locator('#mobile-nav a[href="/#programme-brief"]').click();
  await settle(page);
  const s = await state(page), pos = await briefPosition(page);
  check("reduced motion: no smooth scrolling", behaviour === "auto", where, behaviour);
  check("reduced motion: the in-page link lands at the destination at once, clear of the header, menu closed",
    closed(s) && s.active === "#programme-brief" && pos.top >= pos.header - 1 && pos.top < 844 / 2, where, JSON.stringify({ ...s, ...pos }));
}

// Interface labels come from content/ui/en.json (so they can be translated), and a citation link is announced
// with one "Source:" prefix (the page used to add a second one with CSS).
async function labels(page, errors, b) {
  const where = "/@390";
  const ui = JSON.parse(fs.readFileSync(path.join(here, "../content/ui/en.json"), "utf8"));
  await page.goto(b + "/");
  const got = await page.evaluate(() => ({
    notice_region: document.querySelector(".notice-bar").getAttribute("aria-label"),
    brand_home: document.querySelector(".site-header .brand").getAttribute("aria-label"),
    nav_main: document.querySelector(".site-nav").getAttribute("aria-label"),
    nav_mobile: document.getElementById("mobile-nav").getAttribute("aria-label"),
    menu: document.querySelector(".nav-toggle-label").textContent.trim(),
  }));
  check("header labels come from the interface strings", Object.entries(got).every(([k, v]) => v === ui[k]), where, JSON.stringify(got));
  await page.goto(b + "/science");
  const cites = page.locator("a.cite");
  const n = await cites.count(), names = [];
  for (let i = 0; i < n; i++) names.push(((await cites.nth(i).ariaSnapshot()).match(/link "([^"]*)"/) || [])[1]);
  const bad = names.filter((t) => !t || !t.startsWith(`${ui.source}: `) || t.split(`${ui.source}:`).length !== 2);
  check("citation links are announced with one 'Source:' prefix", n > 3 && bad.length === 0, "/science@390", `${n} links; ${JSON.stringify(bad.slice(0, 3))}`);
}

const srv = await serve(pub);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
try {
  const b = srv.base;
  for (const [w, h] of WIDTHS) {
    for (const p of PAGES) await session(browser, `${p}@${w}`, { viewport: { width: w, height: h } }, (page, errors) => narrow(page, errors, b, p, w, h));
  }
  for (const [p, w, h] of ESCAPES) await session(browser, `${p}@${w}x${h}`, { viewport: { width: w, height: h } }, (page, errors) => escapes(page, errors, b, p, w, h));
  for (const scrolled of [false, true]) await session(browser, "/faq@320x480", { viewport: { width: 320, height: 480 } }, (page) => tall(page, b, scrolled));
  for (const [w, h] of SHORT) {
    for (const p of ["/faq", "/study"]) await session(browser, `${p}@${w}x${h}`, { viewport: { width: w, height: h } }, (page, errors) => short(page, errors, b, p, w, h));
  }
  for (const colorScheme of ["light", "dark"]) {
    for (const w of [320, 390]) await session(browser, `/people@${w} ${colorScheme}`, { viewport: { width: w, height: 740 }, forcedColors: "active", colorScheme }, (page, errors) => forced(page, errors, b, w, colorScheme));
    await session(browser, `/people@1280 ${colorScheme}`, { viewport: { width: 1280, height: 800 }, forcedColors: "active", colorScheme }, (page, errors) => forcedDesktop(page, errors, b, colorScheme));
  }
  await session(browser, "/people@390 touch", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, (page, errors) => touch(page, errors, b));
  await session(browser, "/people@390 keyboard", { viewport: { width: 390, height: 844 } }, (page, errors) => keyboardCurrent(page, errors, b));
  await session(browser, "/@390 reduced motion", { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }, (page, errors) => reduced(page, errors, b));
  await session(browser, "/@390", { viewport: { width: 390, height: 844 } }, (page, errors) => labels(page, errors, b));
  await session(browser, "/study@390", { viewport: { width: 390, height: 844 } }, (page) => fallback(page, b));
  for (const w of [1099, 1100, 1280]) await session(browser, `@${w}`, { viewport: { width: w, height: 900 } }, (page) => breakpoint(page, b, w));
  await session(browser, "/study@390 no-JS", { viewport: { width: 390, height: 844 }, javaScriptEnabled: false }, (page) => noScript(page, b));
} finally {
  await browser.close();
  srv.stop();
}

let failed = 0;
for (const [name, r] of results) {
  if (r.fails.length) failed++;
  console.log(`${r.fails.length ? "FAIL" : "PASS"}  ${name} (${r.runs - r.fails.length}/${r.runs})`);
  for (const f of r.fails.slice(0, 6)) console.log(`      ${f}`);
}
console.log(`menu tests: ${results.size - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
