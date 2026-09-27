// NWPT-049 visual integration: focused loading, layout and accessibility checks for the three new Science illustrations,
// plus a guard that nothing else in the deployable site changed except the stylesheet cache key.
// Cloudflare Pages runtime, 390x844 and 1363x936:
//   node test-visuals.mjs [site-dir] [base-sha]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
const dir = path.resolve(process.argv[2] || "../release-032/site"); const BASE = process.argv[3] || "09492775653cda7bca4681b71103ef714eecad36";
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 400)}`); };
const PAGES = { "/science/psychiatry": { file: "17-uncertainty-map", lcp: true }, "/science/cannabinoids": { file: "07-synaptic-cleft-observatory", lcp: false }, "/science/cbd-thc": { file: "01-cbd-thc-molecular-architecture", lcp: false } };
const SELECTED = Object.values(PAGES).flatMap((p) => [`${p.file}-1600w.webp`, `${p.file}-640w.webp`]).sort();

// ---- static: deployed files and unchanged content
const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: dir, encoding: "utf8" }).trim(); const rel = path.relative(repo, dir);
const vdir = path.join(dir, "assets/visuals-049");
check("only the six selected web-ready files are deployed in assets/visuals-049", JSON.stringify(fs.readdirSync(vdir).sort()) === JSON.stringify(SELECTED), fs.readdirSync(vdir).join(" "));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const all = walk(dir).map((f) => path.relative(dir, f));
check("no master archive, contact sheet, manifest or handoff document in the deployable site", !all.some((f) => /ASSET-MANIFEST|ROUTE-MAP|CONTACT-SHEET|DELIVERY-CHECKSUMS|INTEGRATION-HANDOFF|AGENT-INSTRUCTIONS|NWPT-CLAUDE-GROQ|WEB-READY-ASSETS|\.zip$/i.test(f)), all.filter((f) => /manifest|\.zip$/i.test(f)).join(" "));
const changed = execFileSync("git", ["diff", "--name-only", BASE, "--", rel], { cwd: repo, encoding: "utf8" }).trim().split("\n").filter(Boolean).map((f) => path.relative(rel, f));
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "--", rel], { cwd: repo, encoding: "utf8" }).trim().split("\n").filter(Boolean).map((f) => path.relative(rel, f));
const FIGS = new Set(["science/psychiatry.html", "science/cannabinoids.html", "science/cbd-thc.html"]);
const bad = [];
for (const f of [...changed, ...untracked]) {
  if (f.startsWith("assets/visuals-049/")) continue;
  if (f === "styles.css") { const d = execFileSync("git", ["diff", "-U0", BASE, "--", path.join(rel, f)], { cwd: repo, encoding: "utf8" }); if (/^-(?!--)/m.test(d)) bad.push(f + " (lines removed)"); continue; }
  if (!f.endsWith(".html")) { bad.push(f); continue; }
  let old = execFileSync("git", ["show", `${BASE}:${path.join(rel, f)}`], { cwd: repo, encoding: "utf8", maxBuffer: 1 << 26 }).replace(/\?v=nwpt049/g, "?v=nwpt050");
  let now = fs.readFileSync(path.join(dir, f), "utf8");
  if (FIGS.has(f)) { const strip = (s) => s.replace(/<figure class="sci-figure[\s\S]*?<\/figure>/g, "").replace(/\s+/g, " "); if (strip(old) !== strip(now)) bad.push(f); }
  else if (old !== now) bad.push(f);
}
check("deployable site otherwise identical to production (cache key nwpt049→nwpt050 and appended CSS only)", !bad.length, bad.join(" "));

// ---- browser checks
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [label, vp, dpr] of [["390", { width: 390, height: 844 }, 3], ["1363", { width: 1363, height: 936 }, 1]]) {
  for (const [route, p] of Object.entries(PAGES)) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, reducedMotion: "reduce" }); await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
    await ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    const pg = await ctx.newPage(); const errs = [], reqs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("requestfinished", async (r) => { const s = await r.sizes().catch(() => null); reqs.push({ url: r.url(), bytes: s ? s.responseBodySize : 0 }); });
    await pg.goto(srv.base + route, { waitUntil: "load" });
    const early = reqs.filter((r) => r.url.includes("/visuals-049/")).map((r) => path.basename(new URL(r.url).pathname));
    const img = pg.locator("figure.sci-figure img"); check(`@${label} ${route}: one illustration`, (await img.count()) === 1);
    const a = await img.evaluate((i) => ({ w: i.getAttribute("width"), h: i.getAttribute("height"), alt: i.alt, loading: i.getAttribute("loading"), fp: i.getAttribute("fetchpriority"), dec: i.getAttribute("decoding"), cap: i.closest("figure").querySelector("figcaption")?.textContent || "" }));
    check(`@${label} ${route}: intrinsic size, alt text, async decoding and a caption stating what the image does not show`, a.w === "1600" && a.h === "686" && a.alt.length > 40 && a.dec === "async" && /\b(not|nothing)\b/.test(a.cap), JSON.stringify(a));
    check(`@${label} ${route}: ${p.lcp ? "LCP image eager with fetchpriority=high" : "below-the-fold image lazy, not prioritised"}`, p.lcp ? a.loading === "eager" && a.fp === "high" : a.loading === "lazy" && a.fp === null, JSON.stringify(a));
    if (!p.lcp) check(`@${label} ${route}: lazy image not requested before it nears the viewport`, (await img.evaluate((i) => i.getBoundingClientRect().top)) < 1250 || !early.length, early.join(" "));
    await img.scrollIntoViewIfNeeded(); await pg.waitForFunction((s) => { const i = document.querySelector(s); return i.complete && i.naturalWidth > 0; }, "figure.sci-figure img", { timeout: 10000 }).catch(() => {});
    const got = await img.evaluate((i) => ({ ok: i.complete && i.naturalWidth > 0, src: i.currentSrc.split("/").pop(), rw: Math.round(i.getBoundingClientRect().width), rh: Math.round(i.getBoundingClientRect().height) }));
    check(`@${label} ${route}: image loads (${got.src}, ${got.rw}x${got.rh})`, got.ok && got.src.startsWith(p.file), JSON.stringify(got));
    if (label === "390") check(`@${label} ${route}: phone layout (${/molecular/.test(p.file) ? "full diagram, uncropped" : "3:2 crop on the focal side"})`, /molecular/.test(p.file) ? Math.abs(got.rw / got.rh - 1600 / 686) < 0.05 : Math.abs(got.rw / got.rh - 1.5) < 0.05, JSON.stringify(got));
    await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(400); await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(200);
    const vis = [...new Set(reqs.filter((r) => r.url.includes("/visuals-049/")).map((r) => path.basename(new URL(r.url).pathname)))];
    check(`@${label} ${route}: only this page's selected asset is requested (${vis.join(", ")}; ${Math.round(reqs.filter((r) => r.url.includes("/visuals-049/")).reduce((s, r) => s + r.bytes, 0) / 1024)} KB)`, vis.length === 1 && vis[0].startsWith(p.file) && !reqs.some((r) => /\.(webm|mp4)(\?|$)/.test(r.url)), vis.join(" "));
    const cls = await pg.evaluate(() => window.__cls); check(`@${label} ${route}: no layout shift from the illustration (CLS ${cls.toFixed(4)})`, cls < 0.01, String(cls));
    check(`@${label} ${route}: no horizontal scroll`, (await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
    await pg.evaluate(axe);
    const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
    check(`@${label} ${route}: axe automated checks (WCAG 2.2 A/AA rules)`, !v.length, v.join("; "));
    check(`@${label} ${route}: no page errors`, !errs.length, errs.join(" | "));
    await ctx.close();
  }
}
await b.close(); srv.stop();
console.log(`visuals: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
