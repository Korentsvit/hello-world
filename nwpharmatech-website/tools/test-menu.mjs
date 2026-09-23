// Mobile menu tests under Cloudflare-compatible hosting: serves ../public with Cloudflare's own Pages runtime
// (`wrangler pages dev`, so the site's routes, headers and CSP apply), then drives the menu in Chromium.
//   cd tools && npm install && node test-menu.mjs
// Saves screenshots of the open menu to ../docs/qa/screenshots/menu-open-320.png and menu-open-390.png.
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

const PAGES = ["/", "/study", "/evidence", "/faq"];
const WIDTHS = [[320, 568], [360, 740], [375, 667], [390, 844], [414, 896]];
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
const unobscured = (page) => page.evaluate(() => {
  const el = document.activeElement, r = el.getBoundingClientRect();
  const x = r.left + Math.min(r.width, 40) / 2, y = r.top + Math.min(r.height, 40) / 2;
  if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
  const hit = document.elementFromPoint(x, y);
  return !!hit && (el === hit || el.contains(hit));
});
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
    const pos = await page.evaluate(() => ({ top: Math.round(document.getElementById("programme-brief").getBoundingClientRect().top), header: Math.round(document.querySelector(".site-header").getBoundingClientRect().bottom) }));
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
  const top = await page.evaluate(() => document.getElementById("programme-brief").getBoundingClientRect().top);
  check("'Programme brief' from another page opens the home page at the brief, menu closed", closed(s) && s.path === "/" && top >= 0 && top < 844 / 2, where, JSON.stringify({ ...s, top }));
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

const srv = await serve(pub);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
try {
  const b = srv.base;
  for (const [w, h] of WIDTHS) {
    for (const p of PAGES) await session(browser, `${p}@${w}`, { viewport: { width: w, height: h } }, (page, errors) => narrow(page, errors, b, p, w, h));
  }
  for (const scrolled of [false, true]) await session(browser, "/faq@320x480", { viewport: { width: 320, height: 480 } }, (page) => tall(page, b, scrolled));
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
