// NWPT-050 phone menu: the open menu is a bounded panel below the header; every Science destination is reachable by
// touch and keyboard from any page position; the page behind is locked and restored; desktop is unchanged.
// Chromium (Playwright) under the Cloudflare Pages runtime:
//   node test-mobile-nav.mjs [site-dir]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path";
const dir = path.resolve(process.argv[2] || "../release-032/site");
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const results = new Map();
const check = (name, ok, where = "", detail = "") => { const r = results.get(name) || { runs: 0, fails: [] }; r.runs++; if (!ok) r.fails.push(`${where} ${detail}`.trim()); results.set(name, r); };
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctxFor = async (vp, extra = {}) => { const c = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce", ...extra }); await c.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" })); return c; };

// geometry of the open menu, the Science group and a given element
const probe = (pg) => pg.evaluate(() => {
  const nav = document.getElementById("site-nav"), hdr = document.querySelector(".site-header"), tog = document.getElementById("nav-toggle");
  const sci = [...nav.querySelectorAll(".nav-group__btn")].find((x) => /Science/.test(x.textContent));
  const r = (e) => { const x = e.getBoundingClientRect(); return { t: x.top, b: x.bottom, l: x.left, h: x.height }; };
  const hit = (e) => { const x = e.getBoundingClientRect(); const h = document.elementFromPoint(x.left + Math.min(x.width, 60) / 2, x.top + x.height / 2); return !!h && (h === e || e.contains(h)); };
  const links = [...sci.closest(".nav-group").querySelectorAll(".nav-dropdown a")];
  return { y: scrollY, vh: innerHeight, vvh: visualViewport.height + visualViewport.offsetTop, vw: innerWidth, hdr: r(hdr), nav: r(nav), navScroll: nav.scrollTop, open: nav.classList.contains("is-open"),
    toggle: { ...r(tog), hit: hit(tog), text: tog.textContent.trim(), exp: tog.getAttribute("aria-expanded") },
    sci: { ...r(sci), hit: hit(sci), exp: sci.getAttribute("aria-expanded") }, openGroups: nav.querySelectorAll(".nav-group.is-open").length,
    links: links.map((a) => { const g = document.createRange(); g.selectNodeContents(a); return { ...r(a), tx: g.getBoundingClientRect().left, hit: hit(a), text: a.textContent.trim(), href: a.getAttribute("href"), cls: a.parentElement.className }; }),
    inert: [...document.body.children].filter((e) => e.inert).length, mainInert: !!document.querySelector("main")?.closest("[inert]"),
    htmlLocked: document.documentElement.classList.contains("nav-menu-open"), hx: document.documentElement.scrollWidth - innerWidth, nx: nav.scrollWidth - nav.clientWidth };
});
const within = (e, p) => e.t >= p.hdr.b - 1 && e.b <= p.vvh + 1;
// A real finger tap at the element's position. (Playwright's locator.tap first scrolls the element "into view", which on
// pages with scroll-padding-top moves the page even for the always-visible sticky header; a person's tap does not.)
// Items inside the open menu are first brought into view by scrolling the menu itself, as a swipe would.
const touch = async (pg, loc) => {
  await loc.evaluate((el) => { const n = document.getElementById("site-nav"); if (n && n.contains(el) && n.classList.contains("is-open")) { const r = el.getBoundingClientRect(), nr = n.getBoundingClientRect(); if (r.top < nr.top) n.scrollTop -= nr.top - r.top + 8; else if (r.bottom > nr.bottom) n.scrollTop += r.bottom - nr.bottom + 8; } });
  const bb = await loc.boundingBox(); await pg.touchscreen.tap(bb.x + Math.min(bb.width, 60) / 2, bb.y + bb.height / 2);
};
const click = async (pg, loc) => { const bb = await loc.boundingBox(); await pg.mouse.click(bb.x + Math.min(bb.width, 60) / 2, bb.y + bb.height / 2); };
const settle = (pg, ms = 120) => pg.waitForTimeout(ms);
// Load every lazy image first, so images arriving later cannot shift the page while the menu is being measured.
const prime = (pg) => pg.evaluate(async () => { const im = [...document.images]; im.forEach((i) => { i.loading = "eager"; }); await Promise.all(im.map((i) => i.decode().catch(() => {}))); await new Promise((r) => setTimeout(r, 250)); });
const scrollTo = (pg, f) => pg.evaluate((f) => { window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) * f), behavior: "instant" }); }, f);

async function scenario(where, pg, pos, opts = {}) {
  await scrollTo(pg, pos); await settle(pg);
  const y0 = await pg.evaluate(() => scrollY);
  if (opts.keyboard) { await pg.focus("#nav-toggle"); await pg.keyboard.press("Enter"); } else await touch(pg, pg.locator("#nav-toggle"));
  await settle(pg);
  let p = await probe(pg);
  check("menu opens as a panel directly below the header, bounded by the screen", p.open && Math.abs(p.nav.t - p.hdr.b) <= 1 && p.nav.b <= p.vvh + 1 && p.hdr.b < p.vh * 0.5, where, JSON.stringify({ nav: p.nav, hdr: p.hdr, vh: p.vh }));
  check("header Close stays visible and operable while open", p.toggle.hit && p.toggle.text === "Close" && p.toggle.exp === "true" && p.toggle.t >= 0, where, JSON.stringify(p.toggle));
  check("page behind is locked (scroll class, inert) and has not moved", p.htmlLocked && p.mainInert && Math.abs(p.y - y0) <= 1, where, `y0=${y0} y=${p.y} inert=${p.inert}`);
  // expand Science
  if (opts.keyboard) { const s = pg.locator("#site-nav .nav-group__btn", { hasText: "Science" }); await s.focus(); await pg.keyboard.press("Enter"); }
  else await touch(pg, pg.locator("#site-nav .nav-group__btn", { hasText: "Science" }));
  await settle(pg);
  p = await probe(pg);
  check("Science expands with aria-expanded=true; only one group open", p.sci.exp === "true" && p.openGroups === 1, where, `${p.sci.exp} ${p.openGroups}`);
  check("Science heading and first link visible below the header without page movement", within(p.sci, p) && p.sci.hit && within(p.links[0], p) && p.links[0].hit && Math.abs(p.y - y0) <= 1, where, JSON.stringify({ sci: p.sci, first: p.links[0], hdr: p.hdr.b, y0, y: p.y }));
  check("eight Science links, sub-pages indented", p.links.length === 8 && p.links.filter((l) => /__sub/.test(l.cls)).length === 2 && p.links.filter((l) => /__sub/.test(l.cls)).every((l) => l.tx > p.links[1].tx + 8), where, JSON.stringify(p.links.map((l) => [l.text, Math.round(l.tx)])));
  check("comfortable tap targets (links and group buttons ≥ 44 px tall)", p.links.every((l) => l.h >= 44) && p.sci.h >= 44, where, JSON.stringify(p.links.map((l) => l.h)));
  check("no horizontal overflow in the page or the menu", p.hx <= 1 && p.nx <= 1, where, `${p.hx} ${p.nx}`);
  // keyboard: Tab from the Science button through all eight links; each focused link is visible and uncovered
  await pg.locator("#site-nav .nav-group__btn", { hasText: "Science" }).focus();
  const seen = [];
  for (let i = 0; i < 8; i++) {
    await pg.keyboard.press("Tab"); await settle(pg, 60);
    const f = await pg.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(), hb = document.querySelector(".site-header").getBoundingClientRect().bottom; const h = document.elementFromPoint(r.left + Math.min(r.width, 60) / 2, r.top + r.height / 2); return { text: a.textContent.trim(), ok: r.top >= hb - 1 && r.bottom <= innerHeight + 1 && !!h && (h === a || a.contains(h)) }; });
    seen.push(f);
  }
  check("keyboard reaches all eight Science links in order, each visible and uncovered", seen.length === 8 && seen.every((f) => f.ok) && seen[0].text === p.links[0].text && seen[7].text === p.links[7].text, where, JSON.stringify(seen));
  // touch: swipe the menu to its end; the last link can be tapped; the page does not scroll
  await pg.evaluate(() => { const n = document.getElementById("site-nav"); n.scrollTop = n.scrollHeight; }); await settle(pg);
  const box = await pg.locator("#site-nav").boundingBox(); await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await pg.mouse.wheel(0, 800); await settle(pg);
  const endY = (await probe(pg)).y;
  await pg.evaluate(() => { const g = document.querySelector("#site-nav .nav-group.is-open .nav-dropdown"); const a = [...g.querySelectorAll("a")].pop(); const n = document.getElementById("site-nav"); const d = a.getBoundingClientRect().bottom - n.getBoundingClientRect().bottom + 8; if (d > 0) n.scrollTop += d; const u = n.getBoundingClientRect().top + 8 - a.getBoundingClientRect().top; if (u > 0) n.scrollTop -= u; }); await settle(pg);
  p = await probe(pg);
  check("last Science link reachable by touch (visible and uncovered at the end of the menu)", within(p.links[7], p) && p.links[7].hit, where, JSON.stringify(p.links[7]));
  check("scrolling inside the menu does not scroll the page", Math.abs(endY - y0) <= 1 && Math.abs(p.y - y0) <= 1, where, `y0=${y0} end=${endY} y=${p.y}`);
  // back to the top of the menu: first link reachable again
  await pg.evaluate(() => { document.getElementById("site-nav").scrollTop = 0; }); await settle(pg);
  await pg.evaluate(() => { const a = document.querySelector("#site-nav .nav-group.is-open .nav-dropdown a"); const n = document.getElementById("site-nav"); const d = a.getBoundingClientRect().bottom - n.getBoundingClientRect().bottom + 8; if (d > 0) n.scrollTop += d; }); await settle(pg);
  p = await probe(pg);
  check("first Science link reachable again after swiping back up", within(p.links[0], p) && p.links[0].hit, where, JSON.stringify(p.links[0]));
  // Escape: first closes the group (focus to its button), then the menu (focus to Menu); page position restored
  await pg.locator("#site-nav .nav-group__btn", { hasText: "Science" }).focus();
  await pg.keyboard.press("Escape"); await settle(pg);
  const e1 = await pg.evaluate(() => ({ exp: document.activeElement.getAttribute("aria-expanded"), sci: /Science/.test(document.activeElement.textContent), open: document.getElementById("site-nav").classList.contains("is-open") }));
  check("Escape closes the Science group first and keeps focus on its button", e1.exp === "false" && e1.sci && e1.open, where, JSON.stringify(e1));
  if (opts.closeBy === "escape") { await pg.keyboard.press("Escape"); }
  else await touch(pg, pg.locator("#nav-toggle"));
  await settle(pg);
  p = await probe(pg);
  const fid = await pg.evaluate(() => document.activeElement.id);
  check("Close/Escape closes the menu, restores the page position and unlocks the page", !p.open && p.toggle.exp === "false" && p.toggle.text === "Menu" && !p.htmlLocked && p.inert === 0 && Math.abs(p.y - y0) <= 1, where, JSON.stringify({ y0, y: p.y, inert: p.inert, open: p.open }));
  if (opts.closeBy === "escape") check("Escape returns focus to the Menu button", fid === "nav-toggle", where, fid);
}

// ---- matrix: short and tall phones, portrait and landscape, tablet; top/middle/bottom; touch and keyboard; larger text
const VPS = [["320x568", { width: 320, height: 568 }], ["375x667", { width: 375, height: 667 }], ["390x844", { width: 390, height: 844 }], ["412x915", { width: 412, height: 915 }],
  ["667x375 landscape", { width: 667, height: 375 }], ["915x412 landscape", { width: 915, height: 412 }], ["768x1024 tablet", { width: 768, height: 1024 }]];
const PAGES = ["/families", "/", "/science", "/science/cbd-thc", "/programme-room", "/work-with-us", "/evidence"];
for (const [vl, vp] of VPS) for (const page of PAGES.slice(0, vl.startsWith("390") || vl.startsWith("375") ? PAGES.length : 2)) {
  for (const [pl, pos] of [["top", 0], ["middle", 0.5], ["bottom", 1]]) {
    const ctx = await ctxFor(vp); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.goto(srv.base + page, { waitUntil: "load" }); await prime(pg);
    await scenario(`${page}@${vl}/${pl}`, pg, pos, { keyboard: pl === "middle", closeBy: pl === "bottom" ? "escape" : "tap" });
    check("no page errors", !errs.length, `${page}@${vl}/${pl}`, errs.join(" | "));
    await ctx.close();
  }
}
// larger text: 150% and 200% root text size (Android font scaling / browser text zoom)
for (const scale of ["150%", "200%"]) for (const [vl, vp] of [["320x568", { width: 320, height: 568 }], ["390x844", { width: 390, height: 844 }], ["844x390 landscape", { width: 844, height: 390 }]]) {
  const ctx = await ctxFor(vp); const pg = await ctx.newPage();
  await pg.goto(srv.base + "/families", { waitUntil: "load" }); await pg.evaluate((s) => { document.documentElement.style.fontSize = s; }, scale); await prime(pg);
  await scenario(`/families@${vl} text ${scale}`, pg, 0.6, { closeBy: "tap" });
  await ctx.close();
}
// every Science destination reached from the phone menu (from a scrolled page)
{
  const ctx = await ctxFor({ width: 390, height: 844 }); const pg = await ctx.newPage();
  await pg.goto(srv.base + "/families", { waitUntil: "load" });
  const hrefs = await pg.$$eval("#site-nav .nav-group", (gs) => [...gs.find((g) => /Science/.test(g.querySelector(".nav-group__btn").textContent)).querySelectorAll(".nav-dropdown a")].map((a) => a.getAttribute("href")));
  for (let i = 0; i < hrefs.length; i++) {
    await pg.goto(srv.base + "/families", { waitUntil: "load" }); await scrollTo(pg, 0.5); await settle(pg);
    await touch(pg, pg.locator("#nav-toggle")); await settle(pg); await touch(pg, pg.locator("#site-nav .nav-group__btn", { hasText: "Science" })); await settle(pg);
    const a = pg.locator("#site-nav .nav-group.is-open .nav-dropdown a").nth(i); await Promise.all([pg.waitForURL((u) => true, { waitUntil: "load" }).catch(() => {}), touch(pg, a)]); await settle(pg, 300);
    const u = new URL(pg.url()); const want = new URL(hrefs[i], srv.base + "/families");
    const norm = (p) => p.replace(/\.html$/, "").replace(/\/index$/, "/");
    const ok = norm(u.pathname) === norm(want.pathname) && u.hash === want.hash && (await pg.evaluate(() => !document.getElementById("site-nav").classList.contains("is-open")));
    check("every Science destination opens from the phone menu", ok, hrefs[i], u.pathname + u.hash);
    if (want.hash) check("anchored Science destinations land below the header", await pg.evaluate((h) => { const t = document.querySelector(h); return !!t && t.getBoundingClientRect().top >= document.querySelector(".site-header").getBoundingClientRect().bottom - 2; }, want.hash), hrefs[i]);
  }
  await ctx.close();
}
// every page with the shared menu: the panel opens below the header and Science's first and last links are reachable
{
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const pages = walk(dir).filter((f) => f.endsWith(".html") && fs.readFileSync(f, "utf8").includes('id="nav-toggle"')).map((f) => "/" + path.relative(dir, f).replace(/\.html$/, "").replace(/(^|\/)index$/, "$1"));
  check(`shared menu found on ${pages.length} pages`, pages.length >= 40, "", String(pages.length));
  const ctx = await ctxFor({ width: 375, height: 667 }); const pg = await ctx.newPage();
  for (const page of pages) {
    const r = await pg.goto(srv.base + page, { waitUntil: "load" }); await prime(pg); if (!r || r.status() >= 400) { check("all shared-menu pages: open, Science first/last reachable, Close", false, page, `status ${r && r.status()}`); continue; }
    if (!(await pg.locator("#site-nav .nav-group__btn", { hasText: "Science" }).count())) {   // sandbox pages: their own menu, same shared script and panel
      await scrollTo(pg, 0.5); await settle(pg, 60); const y0 = await pg.evaluate(() => scrollY);
      await touch(pg, pg.locator("#nav-toggle")); await settle(pg, 60);
      const g = await pg.evaluate(() => { const n = document.getElementById("site-nav"), h = document.querySelector(".site-header"); n.scrollTop = n.scrollHeight; const items = [...n.querySelectorAll("a, button")].filter((e) => e.offsetParent); const last = items[items.length - 1], r = last.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + Math.min(r.width, 60) / 2, r.top + r.height / 2); return { top: n.getBoundingClientRect().top, hb: h.getBoundingClientRect().bottom, lastOk: r.bottom <= innerHeight + 1 && !!hit && (hit === last || last.contains(hit)) }; });
      await touch(pg, pg.locator("#nav-toggle")); await settle(pg, 60); const p3 = await pg.evaluate(() => ({ open: document.getElementById("site-nav").classList.contains("is-open"), y: scrollY }));
      check("sandbox pages (no Science group): panel below the header, last item reachable, Close restores", Math.abs(g.top - g.hb) <= 1 && g.lastOk && !p3.open && Math.abs(p3.y - y0) <= 1, page, JSON.stringify({ ...g, y0, y: p3.y }));
      continue;
    }
    await scrollTo(pg, 0.5); await settle(pg, 60); const y0 = await pg.evaluate(() => scrollY);
    await touch(pg, pg.locator("#nav-toggle")); await settle(pg, 60); await touch(pg, pg.locator("#site-nav .nav-group__btn", { hasText: "Science" })); await settle(pg, 60);
    const p1 = await probe(pg);
    await pg.evaluate(() => { const n = document.getElementById("site-nav"); n.scrollTop = n.scrollHeight; }); await settle(pg, 60);
    const p2 = await probe(pg);
    await touch(pg, pg.locator("#nav-toggle")); await settle(pg, 60); const p3 = await probe(pg);
    check("all shared-menu pages: open, Science first/last reachable, Close", Math.abs(p1.nav.t - p1.hdr.b) <= 1 && within(p1.sci, p1) && p1.links[0].hit && within(p2.links[7], p2) && p2.links[7].hit && !p3.open && Math.abs(p3.y - y0) <= 1, page, JSON.stringify({ nav: p1.nav.t, hdr: p1.hdr.b, first: p1.links[0].hit, last: p2.links[7].hit, y0, y: p3.y }));
  }
  await ctx.close();
}
// axe with the menu open and Science expanded (phone), and desktop unchanged
{
  const ctx = await ctxFor({ width: 390, height: 844 }); const pg = await ctx.newPage();
  await pg.goto(srv.base + "/science/cbd-thc", { waitUntil: "load" }); await scrollTo(pg, 0.4); await touch(pg, pg.locator("#nav-toggle")); await touch(pg, pg.locator("#site-nav .nav-group__btn", { hasText: "Science" })); await settle(pg);
  await pg.evaluate(axe);
  const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
  check("axe (WCAG 2.2 A/AA) with the phone menu open and Science expanded", !v.length, "", v.join("; "));
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1363, height: 936 } }); await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
  const pg = await ctx.newPage(); await pg.goto(srv.base + "/science", { waitUntil: "load" }); await prime(pg); await scrollTo(pg, 0.5); await settle(pg); const y0 = await pg.evaluate(() => scrollY);
  const d = await pg.evaluate(() => ({ pos: getComputedStyle(document.getElementById("site-nav")).position, toggle: getComputedStyle(document.getElementById("nav-toggle")).display }));
  check("desktop: menu stays inline in the header (not a fixed panel); Menu button hidden", d.pos !== "fixed" && d.toggle === "none", "", JSON.stringify(d));
  await click(pg, pg.locator("#site-nav .nav-group__btn", { hasText: "Science" })); await settle(pg);
  const s = await pg.evaluate(() => ({ exp: [...document.querySelectorAll("#site-nav .nav-group__btn")].find((x) => /Science/.test(x.textContent)).getAttribute("aria-expanded"), locked: document.documentElement.classList.contains("nav-menu-open"), inert: [...document.body.children].filter((e) => e.inert).length, y: scrollY }));
  check("desktop: Science dropdown opens by click; page not locked or moved", s.exp === "true" && !s.locked && s.inert === 0 && Math.abs(s.y - y0) <= 1, "", JSON.stringify(s));
  await ctx.close();
}
await b.close(); srv.stop();
let fail = 0;
for (const [n, r] of results) { const ok = !r.fails.length; if (!ok) fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n} (${r.runs} runs)${ok ? "" : "  --  " + r.fails.slice(0, 3).join(" || ").slice(0, 700)}`); }
console.log(`mobile-nav: ${results.size - fail} checks passed, ${fail} failed (${[...results.values()].reduce((s, r) => s + r.runs, 0)} runs)`); process.exit(fail ? 1 : 0);
