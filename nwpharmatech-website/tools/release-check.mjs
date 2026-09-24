// Release checks for the integrated website, run against the built site directory Grok deploys.
//   node release-check.mjs <site-dir> <out-dir> [--modules study-hub,phase-1,...] [--max-pages 200]
// Serves <site-dir> with Cloudflare's Pages runtime (wrangler pages dev) and crawls it from "/". Checks:
//   routing   every crawled page answers 200 directly; internal links reach a page in at most one redirect;
//             no redirect chains; unknown paths answer 404
//   links     every internal href, src and srcset target resolves; downloads (pdf, ris, bib, docx) answer 200
//             with a non-HTML type; mailto: and tel: links are well formed; #fragments exist on their page
//   pages     at 390 and 1280 px: no horizontal scroll, every <img> loads, has alt, and has width/height set;
//             no console errors or CSP violations; axe WCAG 2.2 A/AA; one <h1>; a <nav> on every page
//   modules   with --modules: each named module is on some page, its styles apply and its script runs
// External links are listed but not fetched (the build environment has no general internet access).
// Writes <out-dir>/release-report.json and a desktop and mobile screenshot of every page.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { serve } from "./lib/cf-serve.mjs";

const args = process.argv.slice(2);
const [siteDir, outDir] = args;
if (!siteDir || !outDir) { console.error("usage: node release-check.mjs <site-dir> <out-dir> [--modules a,b] [--max-pages N]"); process.exit(2); }
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const modules = (opt("--modules", "") || "").split(",").filter(Boolean);
const maxPages = Number(opt("--max-pages", 200));
const shots = path.join(outDir, "screenshots");
fs.mkdirSync(shots, { recursive: true });
const axeSource = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "node_modules/axe-core/axe.min.js"), "utf8");

const results = [];
const check = (area, name, ok, detail = "") => {
  results.push({ area, name, ok: !!ok, detail: ok ? "" : String(detail).slice(0, 600) });
  if (!ok) console.log(`FAIL  [${area}] ${name}  --  ${String(detail).slice(0, 300)}`);
};

const srv = await serve(siteDir);
const base = srv.base;
const hop = async (p) => {
  const r = await fetch(base + p, { redirect: "manual" });
  return { status: r.status, location: r.headers.get("location"), type: r.headers.get("content-type") || "", text: r.status === 200 && /html/.test(r.headers.get("content-type") || "") ? await r.text() : "" };
};
const resolve = async (p) => {   // follow redirects hop by hop; returns the final response and the hop count
  let cur = p, hops = 0, r;
  for (;;) {
    r = await hop(cur);
    if (![301, 302, 307, 308].includes(r.status) || hops > 5) break;
    cur = new URL(r.location, base + cur).pathname + new URL(r.location, base + cur).search;
    hops++;
  }
  return { ...r, hops, final: cur };
};
const external = new Set(), mailto = new Set(), tel = new Set();
const pageIds = new Map();
const internalRefs = [];   // [from, target, kind]

// ---- crawl ----
const queue = ["/"], seen = new Set();
while (queue.length && seen.size < maxPages) {
  const p = queue.shift();
  if (seen.has(p)) continue;
  seen.add(p);
  const r = await resolve(p);
  if (r.hops) { internalRefs.push(["(crawl)", p, "page"]); }
  if (r.status !== 200 || !/html/.test(r.type)) continue;
  const html = r.text;
  pageIds.set(r.final, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  if (r.final !== p) { seen.add(r.final); }
  const refs = [...html.matchAll(/\s(href|src)="([^"]+)"/g)].map((m) => [m[1], m[2]])
    .concat([...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((x) => ["src", x.trim().split(/\s+/)[0]])));
  for (const [kind, raw] of refs) {
    if (/^mailto:/i.test(raw)) { mailto.add(raw); continue; }
    if (/^tel:/i.test(raw)) { tel.add(raw); continue; }
    if (/^(data:|javascript:)/i.test(raw)) continue;
    let u;
    try { u = new URL(raw, base + r.final); } catch { check("links", `${r.final}: parsable link ${raw}`, false, raw); continue; }
    if (u.origin !== base) { external.add(u.href); continue; }
    internalRefs.push([r.final, u.pathname + u.hash, kind]);
    const isPage = kind === "href" && !/\.[a-z0-9]{2,5}$/i.test(u.pathname);
    if (isPage && !seen.has(u.pathname)) queue.push(u.pathname);
  }
}
check("routing", `crawl found pages (${seen.size})`, pageIds.size > 0, "no HTML page at /");
if (seen.size >= maxPages) check("routing", `crawl stopped at --max-pages ${maxPages}`, false, "raise --max-pages");

// ---- targets ----
const cache = new Map();
for (const [from, target, kind] of internalRefs) {
  const [pathOnly, frag] = target.split("#");
  if (!cache.has(pathOnly)) cache.set(pathOnly, await resolve(pathOnly));
  const r = cache.get(pathOnly);
  const label = `${from} -> ${target}`;
  if (from === "(crawl)") { check("routing", `${target} is reached in at most one redirect`, r.hops <= 1, `${r.hops} hops`); continue; }
  check("links", `${label} resolves`, r.status === 200, `${r.status}${r.hops ? ` after ${r.hops} redirect(s)` : ""}`);
  if (r.status === 200) check("routing", `${label}: at most one redirect`, r.hops <= 1, `${r.hops} hops to ${r.final}`);
  if (/\.(pdf|ris|bib|docx|zip)$/i.test(pathOnly)) check("downloads", `${pathOnly} is a file, not an HTML page`, r.status === 200 && !/html/.test(r.type), r.type);
  if (frag && r.status === 200 && pageIds.has(r.final)) {
    let id; try { id = decodeURIComponent(frag); } catch { id = frag; }
    check("links", `${label}: #${id} exists on ${r.final}`, pageIds.get(r.final).has(id));
  }
}
const nf = await hop("/__release-check-no-such-page");
check("routing", "an unknown path answers 404", nf.status === 404,
  `${nf.status}: without a 404.html Cloudflare Pages serves the home page for every unknown path, so broken links cannot be detected either`);
for (const m of mailto) check("contact", `mailto well formed: ${m}`, /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}(\?.*)?$/i.test(m));
for (const t of tel) check("contact", `tel well formed: ${t}`, /^tel:\+?[0-9]{3,15}$/.test(t.replace(/[\s-]/g, "")));

// ---- pages in the browser ----
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const found = new Map();
const pages = [...pageIds.keys()].sort();
for (const [label, vp] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport: vp });
  for (const p of pages) {
    const page = await ctx.newPage();
    const errors = [];
    await page.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + p, { waitUntil: "load" });
    await page.evaluate(async () => {   // open expandable sections, bring each lazy image into view, give it up to 5 s
      document.querySelectorAll("details").forEach((d) => { d.open = true; });
      for (const i of document.images) {
        i.scrollIntoView({ block: "center" });
        const t0 = performance.now();
        while (!(i.complete && i.naturalWidth > 0) && performance.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(300);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 10000 }).catch(() => {});
    const st = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      imgs: [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.hasAttribute("alt"), dims: i.hasAttribute("width") && i.hasAttribute("height") })),
      h1: document.querySelectorAll("h1").length, nav: !!document.querySelector("nav"), csp: window.__csp,
      modules: [...document.querySelectorAll("[data-nwpt-module]")].map((m) => ({ id: m.dataset.nwptModule,
        styled: getComputedStyle(m.querySelector("*") || m).boxSizing === "border-box", ready: m.hasAttribute("data-nwpt-ready") })),
    }));
    check("layout", `${p} @${vp.width}px: no horizontal scroll`, st.overflow <= 1, `${st.overflow}px too wide`);
    const broken = st.imgs.filter((i) => !i.ok), noAlt = st.imgs.filter((i) => !i.alt), noDims = st.imgs.filter((i) => !i.dims);
    check("images", `${p} @${vp.width}px: every image loads (${st.imgs.length})`, !broken.length, broken.map((i) => i.src).join(", "));
    if (label === "desktop") {
      check("images", `${p}: every image has alt`, !noAlt.length, noAlt.map((i) => i.src).join(", "));
      check("images", `${p}: every image has width and height (no layout shift)`, !noDims.length, noDims.map((i) => i.src).join(", "));
      check("pages", `${p}: exactly one h1`, st.h1 === 1, String(st.h1));
      check("navigation", `${p}: has a nav landmark`, st.nav);
      for (const m of st.modules) found.set(m.id, { page: p, ...m });
    }
    check("pages", `${p} @${vp.width}px: no console errors or CSP violations`, !errors.length && !st.csp.length, errors.concat(st.csp).join("; "));
    await page.evaluate(axeSource);
    const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }))
      .violations.map((x) => `${x.id} x${x.nodes.length}: ${x.nodes[0]?.target}`));
    check("accessibility", `${p} @${vp.width}px: axe WCAG 2.2 AA`, !v.length, v.join("; "));
    const name = (p === "/" ? "home" : p.replace(/^\/|\/$/g, "").replace(/\//g, "_")) + `-${label}.png`;
    await page.screenshot({ path: path.join(shots, name), fullPage: true });
    await page.close();
  }
  await ctx.close();
}
for (const id of modules) {
  const m = found.get(id);
  check("modules", `module ${id} is on a page, styled${m && m.ready ? " and scripted" : ""}`, !!m && m.styled, m ? JSON.stringify(m) : "not found on any crawled page");
}
await browser.close();
srv.stop();

const byArea = {};
for (const r of results) { byArea[r.area] ??= { passed: 0, failed: 0 }; byArea[r.area][r.ok ? "passed" : "failed"]++; }
const report = { site: path.resolve(siteDir), server: "wrangler pages dev (Cloudflare workerd)", pages, byArea,
  not_checked: { external_links: [...external].sort(), reason: "the build environment has no general internet access; check these after deploy" },
  mailto: [...mailto], tel: [...tel], results };
fs.writeFileSync(path.join(outDir, "release-report.json"), JSON.stringify(report, null, 1) + "\n");
const passed = results.filter((r) => r.ok).length;
console.log(Object.entries(byArea).map(([a, c]) => `${a} ${c.passed}/${c.passed + c.failed}`).join(" · "));
console.log(`release checks: ${passed} passed, ${results.length - passed} failed; ${pages.length} pages; ${external.size} external links not fetched`);
process.exit(results.length - passed ? 1 : 0);
