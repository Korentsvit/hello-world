// NWPT-050 Science pages on phones: no sideways panning at 100/150/200% text, readable captions (including the
// molecular comparison's explanation in HTML), section navigation and CBD/THC tabs usable by touch, axe clean.
// Chromium (Playwright) under the Cloudflare Pages runtime:
//   node test-science-phone.mjs [site-dir]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path";
const dir = path.resolve(process.argv[2] || "../release-032/site");
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const results = new Map();
const check = (name, ok, where = "", detail = "") => { const r = results.get(name) || { runs: 0, fails: [] }; r.runs++; if (!ok) r.fails.push(`${where} ${detail}`.trim()); results.set(name, r); };
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const PAGES = ["/science", "/science/psychiatry", "/science/cannabinoids", "/science/cbd-thc", "/science/cannabinoid-medicines"];
const FIG = { "/science/psychiatry": "open research questions", "/science/cannabinoids": "signalling between cells", "/science/cbd-thc": "Same molecular formula. Different three-dimensional architecture." };
const touch = async (pg, loc) => { const bb = await loc.boundingBox(); await pg.touchscreen.tap(bb.x + Math.min(bb.width, 60) / 2, bb.y + bb.height / 2); };
const COMBOS = [[360, "100%"], [360, "150%"], [360, "200%"], [375, "200%"], [390, "100%"], [390, "150%"], [390, "200%"], [412, "200%"], [320, "100%"], [320, "150%"], [667, "150%"]];
for (const [w, scale] of COMBOS) {
  const h = w > 600 ? 375 : 780;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
  const pg = await ctx.newPage();
  for (const page of PAGES) {
    const where = `${page}@${w}x${h} text ${scale}`;
    await pg.goto(srv.base + page, { waitUntil: "load" });
    await pg.evaluate(async (s) => { document.documentElement.style.fontSize = s; const im = [...document.images]; im.forEach((x) => { x.loading = "eager"; }); await Promise.all(im.map((x) => x.decode().catch(() => {}))); }, scale);
    await pg.waitForTimeout(150);
    const m = await pg.evaluate((w) => ({ iw: innerWidth, sw: document.documentElement.scrollWidth, wide: [...document.querySelectorAll("main *")].filter((e) => e.getBoundingClientRect().right > w + 1).slice(0, 3).map((e) => e.tagName + "." + String(e.className).slice(0, 30)) }), w);
    check("Science content fits the phone width (no sideways panning)", m.iw === w && m.sw <= w + 1 && !m.wide.length, where, JSON.stringify(m));
    // section navigation: every link fully on screen horizontally and a comfortable target
    const nav = await pg.$$eval(".sci-nav a", (as, w) => as.map((a) => { const r = a.getBoundingClientRect(); return { t: a.textContent.trim(), l: r.left, r: r.right, h: r.height }; }).filter((x) => x.l < -1 || x.r > w + 1 || x.h < 24), w);
    check("Science section navigation: every link on screen and at least 24 px tall", !nav.length, where, JSON.stringify(nav));
    if (FIG[page]) {
      const f = await pg.$eval("figure.sci-figure", (fg) => { const c = fg.querySelector("figcaption"), cs = getComputedStyle(c), r = c.getBoundingClientRect(), i = fg.querySelector("img").getBoundingClientRect(); return { text: c.textContent, fs: parseFloat(cs.fontSize), vis: cs.visibility !== "hidden" && cs.display !== "none" && r.height > 0, cl: r.left, cr: r.right, below: r.top >= i.bottom - 1, iw: i.width }; });
      check("illustration caption is readable HTML directly below its image", f.text.includes(FIG[page]) && f.vis && f.below && f.cl >= 0 && f.cr <= w + 1 && f.fs >= (scale === "100%" ? 13.5 : 13.5 * parseFloat(scale) / 100 * 0.95), where, JSON.stringify(f));
      check("illustration spans the content width (no overflow)", f.iw <= w, where, String(f.iw));
    }
    if (page === "/science/cbd-thc") {
      const tabs = pg.locator(".sci-tab"); check("CBD/THC comparison offers three tabs", (await tabs.count()) === 3, where);
      for (const [i, id] of [[1, "cmp-clinical"], [2, "cmp-interactions"], [0, "cmp-effects"]]) {
        await tabs.nth(i).scrollIntoViewIfNeeded(); await touch(pg, tabs.nth(i)); await pg.waitForTimeout(80);
        const s = await pg.evaluate(() => [...document.querySelectorAll(".sci-panel")].filter((p) => !p.hidden).map((p) => p.id));
        check("each CBD/THC tab opens only its own panel by touch", JSON.stringify(s) === JSON.stringify([id]), where, JSON.stringify(s));
      }
      const t = await pg.$$eval(".sci-tab", (ts, w) => ts.map((x) => { const r = x.getBoundingClientRect(); return { t: x.textContent, l: r.left, r: r.right, h: r.height }; }), w);
      check("CBD/THC tabs on screen and at least 44 px tall", t.every((x) => x.l >= 0 && x.r <= w + 1 && x.h >= 44), where, JSON.stringify(t));
    }
    if (scale === "200%" && w === 390) {
      await pg.evaluate(axe);
      const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
      check("axe (WCAG 2.2 A/AA) at 200% text", !v.length, where, v.join("; "));
    }
  }
  await ctx.close();
}
await b.close(); srv.stop();
let fail = 0;
for (const [n, r] of results) { const ok = !r.fails.length; if (!ok) fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n} (${r.runs} runs)${ok ? "" : "  --  " + r.fails.slice(0, 3).join(" || ").slice(0, 700)}`); }
console.log(`science-phone: ${results.size - fail} checks passed, ${fail} failed`); process.exit(fail ? 1 : 0);
