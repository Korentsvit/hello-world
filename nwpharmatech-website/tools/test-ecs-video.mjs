// NWPT-052: labelled endocannabinoid-system animation on /science/cannabinoids — focused media, layout and accessibility
// checks, and a guard that nothing else in the deployable site changed except the stylesheet cache key.
// Cloudflare Pages runtime, Chromium: node test-ecs-video.mjs [site-dir] [production-sha]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
const dir = path.resolve(process.argv[2] || "../release-032/site"); const BASE = process.argv[3] || "cfee45bdbe80701f98230dced8ec9953988d9ffb";
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 400)}`); };
const PAGE = "/science/cannabinoids";

// ---- static: only the intended files changed
const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: dir, encoding: "utf8" }).trim(); const rel = path.relative(repo, dir);
const changed = execFileSync("git", ["diff", "--name-only", BASE, "--", rel], { cwd: repo, encoding: "utf8" }).trim().split("\n").filter(Boolean).map((f) => path.relative(rel, f));
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "--", rel], { cwd: repo, encoding: "utf8" }).trim().split("\n").filter(Boolean).map((f) => path.relative(rel, f));
const bad = [];
for (const f of [...changed, ...untracked]) {
  if (["science/cannabinoids.html", "ecs-video.js"].includes(f) || f.startsWith("assets/ecs-video/")) continue;
  if (f === "styles.css") { if (/^-(?!--)/m.test(execFileSync("git", ["diff", "-U0", BASE, "--", path.join(rel, f)], { cwd: repo, encoding: "utf8" }))) bad.push("styles.css (lines removed)"); continue; }
  if (!f.endsWith(".html")) { bad.push(f); continue; }
  const old = execFileSync("git", ["show", `${BASE}:${path.join(rel, f)}`], { cwd: repo, encoding: "utf8", maxBuffer: 1 << 26 }).replace(/\?v=nwpt052/g, "?v=nwpt053");
  if (old !== fs.readFileSync(path.join(dir, f), "utf8")) bad.push(f);
}
check("everything else identical to production (homepage hero, funding film, formulation clip, portraits, navigation; only the cache key)", !bad.length, bad.join(" "));
const assets = fs.readdirSync(path.join(dir, "assets/ecs-video")).sort();
check("only the video, its MP4 fallback and its poster are added", JSON.stringify(assets) === JSON.stringify(["NWPT-dynamic-ECS-hero-labeled-poster.webp", "NWPT-dynamic-ECS-hero-labeled-web.mp4", "NWPT-dynamic-ECS-hero-labeled-web.webm"]), assets.join(" "));
const prod = execFileSync("git", ["show", `${BASE}:${rel}/science/cannabinoids.html`], { cwd: repo, encoding: "utf8" });
const now = fs.readFileSync(path.join(dir, "science/cannabinoids.html"), "utf8");
const strip = (h) => h.replace(/<figure class="ecs-video"[\s\S]*?<\/figure>/, "").replace(/<script src="\.\.\/ecs-video\.js[^>]*><\/script>\s*/, "").replace(/\?v=nwpt05[23]/g, "").replace(/\s+/g, " ");
check("the rest of /science/cannabinoids is unchanged (scientific text, citations, Synaptic Cleft illustration)", strip(prod) === strip(now));

// ---- browser
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const stub = (c) => c.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
for (const [label, vp, mobile] of [["390x844", { width: 390, height: 844 }, true], ["1363x936", { width: 1363, height: 936 }, false], ["844x390 landscape", { width: 844, height: 390 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 }); await stub(ctx);
  await ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  const pg = await ctx.newPage(); const errs = [], reqs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("request", (r) => reqs.push(r.url()));
  await pg.goto(srv.base + PAGE, { waitUntil: "load" });
  const g = await pg.evaluate(() => { const f = document.querySelector("[data-ecs-video]"), m = f.querySelector(".ecs-video__media").getBoundingClientRect(), p = f.querySelector(".ecs-video__poster"); const hero = document.querySelector(".sci-hero"), nav = hero.querySelector(".sci-nav"); return { inHero: hero.contains(f), afterNav: !!(nav.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING), w: m.width, h: m.height, fit: getComputedStyle(p).objectFit, pw: p.getAttribute("width"), ph: p.getAttribute("height"), fp: p.getAttribute("fetchpriority"), alt: p.alt, right: m.right, synapse: !!document.querySelector('figure.sci-figure img[src*="07-synaptic-cleft-observatory"]') }; });
  check(`@${label} placed in the page introduction, below the Science navigation; Synaptic Cleft illustration kept further down`, g.inHero && g.afterNav && g.synapse, JSON.stringify(g));
  check(`@${label} full 16:9 composition, uncropped (object-fit: contain), within the screen`, Math.abs(g.w / g.h - 16 / 9) < 0.02 && g.fit === "contain" && g.right <= vp.width, JSON.stringify(g));
  check(`@${label} poster reserves 1280x720, is the prioritised image, and has alt text`, g.pw === "1280" && g.ph === "720" && g.fp === "high" && g.alt.length > 40, JSON.stringify(g));
  // playback
  await pg.locator(".ecs-video__toggle").waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
  const below = await pg.evaluate(() => { const r = document.querySelector(".ecs-video__media").getBoundingClientRect(); return r.top > innerHeight - 0.25 * r.height; });
  if (below) {   // off screen: the animation must wait, then start once it is scrolled into view
    await pg.waitForTimeout(800);
    check(`@${label} does not play while off screen`, await pg.evaluate(() => document.querySelector(".ecs-video__video").paused));
    await pg.evaluate(() => { const m = document.querySelector(".ecs-video__media"); window.scrollTo({ top: m.getBoundingClientRect().top + scrollY - 60, behavior: "instant" }); });
  }
  await pg.waitForFunction(() => { const v = document.querySelector(".ecs-video__video"); return v.currentTime > 0.5; }, null, { timeout: 8000 }).catch(() => {});
  const v1 = await pg.evaluate(() => { const v = document.querySelector(".ecs-video__video"); return { t: v.currentTime, muted: v.muted, loop: v.loop, src: v.currentSrc.split("/").pop(), audio: v.webkitAudioDecodedByteCount, playing: document.querySelector("[data-ecs-video]").classList.contains("is-playing"), btn: document.querySelector(".ecs-video__toggle").textContent.trim(), pressed: document.querySelector(".ecs-video__toggle").getAttribute("aria-pressed") }; });
  check(`@${label} plays silently and loops (WebM chosen; muted; no audio decoded)`, v1.t > 0.5 && v1.muted && v1.loop && /\.webm/.test(v1.src) && v1.audio === 0 && v1.playing, JSON.stringify(v1));
  check(`@${label} only the WebM is downloaded (MP4 kept as fallback)`, reqs.some((u) => /labeled-web\.webm/.test(u)) && !reqs.some((u) => /labeled-web\.mp4/.test(u)), reqs.filter((u) => /labeled/.test(u)).join(" "));
  check(`@${label} visible Pause control`, v1.btn === "Pause animation" && v1.pressed === "false", JSON.stringify(v1));
  const btn = pg.locator(".ecs-video__toggle"); await btn.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(300);
  const t1 = await pg.evaluate(() => document.querySelector(".ecs-video__video").currentTime); await pg.waitForTimeout(600);
  const v2 = await pg.evaluate(() => ({ t: document.querySelector(".ecs-video__video").currentTime, paused: document.querySelector(".ecs-video__video").paused, btn: document.querySelector(".ecs-video__toggle").textContent.trim(), pressed: document.querySelector(".ecs-video__toggle").getAttribute("aria-pressed") }));
  check(`@${label} keyboard: Pause stops the animation (aria-pressed=true, label "Play animation")`, v2.paused && Math.abs(v2.t - t1) < 0.05 && v2.btn === "Play animation" && v2.pressed === "true", JSON.stringify({ t1, ...v2 }));
  await btn.click(); await pg.waitForTimeout(700);
  const v3 = await pg.evaluate(() => ({ paused: document.querySelector(".ecs-video__video").paused, btn: document.querySelector(".ecs-video__toggle").textContent.trim() }));
  check(`@${label} Play resumes`, !v3.paused && v3.btn === "Pause animation", JSON.stringify(v3));
  // text alternatives
  const t = await pg.evaluate(() => { const f = document.querySelector("[data-ecs-video]"); return { cap: f.querySelector("figcaption").textContent, items: [...f.querySelectorAll(".ecs-labels li")].map((li) => ({ t: li.querySelector("strong").textContent, cite: li.querySelectorAll(".nwpt-cite").length })), note: f.querySelector(".sci-preview-note")?.textContent || "", aria: f.querySelector(".ecs-video__video").getAttribute("aria-hidden"), fs: parseFloat(getComputedStyle(f.querySelector(".ecs-labels li")).fontSize) }; });
  check(`@${label} caption: conceptual illustration, no demonstrated NWPT-SM32300 mechanism`, /Conceptual illustration/.test(t.cap) && /does not show a demonstrated mechanism of NWPT-SM32300/.test(t.cap), t.cap);
  check(`@${label} readable HTML explanation of every label, each with its source`, t.items.length === 4 && t.items.every((i) => i.cite >= 1) && t.fs >= 14, JSON.stringify(t.items));
  check(`@${label} draft sub-labels flagged by a visible preview-only note`, /Preview only/.test(t.note) && /central region/.test(t.note), t.note);
  await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(300);
  const cls = await pg.evaluate(() => window.__cls);
  check(`@${label} no layout shift (CLS ${cls.toFixed(4)}); no horizontal scroll`, cls < 0.01 && (await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, String(cls));
  await pg.evaluate(() => window.scrollTo(0, 0)); await pg.evaluate(axe);
  const ax = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
  check(`@${label} axe (WCAG 2.2 A/AA)`, !ax.length, ax.join("; "));
  check(`@${label} no page errors`, !errs.length, errs.join(" | "));
  await ctx.close();
}
// reduced motion: poster only, no video download, no control
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" }); await stub(ctx);
  const pg = await ctx.newPage(); const reqs = []; pg.on("request", (r) => reqs.push(r.url()));
  await pg.goto(srv.base + PAGE, { waitUntil: "load" }); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => ({ poster: document.querySelector(".ecs-video__poster").complete && document.querySelector(".ecs-video__poster").naturalWidth === 1280, btnHidden: document.querySelector(".ecs-video__toggle").hidden, sources: document.querySelectorAll(".ecs-video__video source").length }));
  check("reduced motion: poster shown, no video requested, no control", r.poster && r.btnHidden && r.sources === 0 && !reqs.some((u) => /\.(webm|mp4)(\?|$)/.test(u)), JSON.stringify(r) + " " + reqs.filter((u) => /\.(webm|mp4)/.test(u)).join(" "));
  await ctx.close();
}
// no JavaScript: poster and explanation, no download
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }); await stub(ctx);
  const pg = await ctx.newPage(); const reqs = []; pg.on("request", (r) => reqs.push(r.url()));
  await pg.goto(srv.base + PAGE, { waitUntil: "load" }); await pg.waitForTimeout(800);
  const r = await pg.evaluate(() => ({ poster: document.querySelector(".ecs-video__poster").complete, labels: document.querySelectorAll(".ecs-labels li").length }));
  check("without JavaScript: poster and label explanation, no video requested", r.poster && r.labels === 4 && !reqs.some((u) => /\.(webm|mp4)(\?|$)/.test(u)), JSON.stringify(r));
  await ctx.close();
}
// enlarged text on a phone
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" }); await stub(ctx);
  const pg = await ctx.newPage(); await pg.goto(srv.base + PAGE, { waitUntil: "load" }); await pg.evaluate(() => { document.documentElement.style.fontSize = "200%"; }); await pg.waitForTimeout(200);
  const r = await pg.evaluate(() => { const m = document.querySelector(".ecs-video__media").getBoundingClientRect(); return { iw: innerWidth, ratio: m.width / m.height, right: m.right }; });
  check("200% text on a 390 px phone: fits the screen, composition still whole", r.iw === 390 && Math.abs(r.ratio - 16 / 9) < 0.02 && r.right <= 390, JSON.stringify(r));
  await pg.evaluate(axe);
  const ax = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
  check("200% text: axe (WCAG 2.2 A/AA)", !ax.length, ax.join("; "));
  await ctx.close();
}
await b.close(); srv.stop();
console.log(`ecs-video: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
