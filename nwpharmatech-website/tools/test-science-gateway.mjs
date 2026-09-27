// NWPT-051: /science as a concise gateway; formulation and research-question material moved verbatim to
// /science/formulation; old /science#... deep links reach the same section; enlarged-text overflow (footer, Families,
// homepage people cards). Compares against production af4ab60. Cloudflare Pages runtime, Chromium:
//   node test-science-gateway.mjs [site-dir] [production-sha]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
const dir = path.resolve(process.argv[2] || "../release-032/site"); const BASE = process.argv[3] || "af4ab606a16813252fda4bd6c280afaa1f473974";
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 500)}`); };
const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: dir, encoding: "utf8" }).trim(); const rel = path.relative(repo, dir);
const prodSci = execFileSync("git", ["show", `${BASE}:${rel}/science.html`], { cwd: repo, encoding: "utf8", maxBuffer: 1 << 26 });
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const mainOf = (h) => h.slice(h.indexOf("<main"), h.indexOf("</main>"));
const MOVED = { investigating: "The investigational formulation", formulation: "Why investigate a micellar softgel?", "q2-h": "Why investigate a micellar softgel?", "dg-title": "From capsule to measurement", "dg-desc": "From capsule to measurement", ar: "From capsule to measurement", "conceptual-platform": "Conceptual delivery motif", "chrp-title": "What CHR-P means" };
const LANDS = { "dg-title": "capsule-diagram", "dg-desc": "capsule-diagram", ar: "capsule-diagram" };   // ids inside the SVG go to its figure

// ---- static: moved content is verbatim, nothing lost
const prodMain = mainOf(prodSci);
const moved = prodMain.slice(prodMain.indexOf("<!-- NWPT-048 routes end -->") + "<!-- NWPT-048 routes end -->".length);
const src = fs.readFileSync(path.join(dir, "../source/science-formulation.html"), "utf8").split("\n").slice(1).join("\n");
check("source/science-formulation.html is byte-identical to the section moved from production /science", src.trim() === moved.trim(), `${src.length} vs ${moved.length}`);
const form = fs.readFileSync(path.join(dir, "science/formulation.html"), "utf8"), sci = fs.readFileSync(path.join(dir, "science.html"), "utf8");
check("every sentence of the moved section appears unchanged on /science/formulation", text(mainOf(form)).includes(text(moved)), "");
const prodRoutes = prodMain.slice(prodMain.indexOf("<!-- NWPT-048 routes start -->"), prodMain.indexOf("<!-- NWPT-048 routes end -->"));
const keep = ["Psychiatry & evidence", "Understanding cannabinoids", "Start with a question", "CannabinoidEvidence.org provides an indication-based overview of cannabinoid research.", "Ongoing review.", "Evidence library", "Glossary", "Programme brief"];
check("gateway keeps both routes, their starting questions, further reading and the review note", keep.every((k) => text(sci).includes(k.replace("&", "&amp;")) || text(sci).includes(k)) && (text(prodRoutes).match(/Start with a question/g) || []).length === (text(sci).match(/Start with a question/g) || []).length);
const resolve = (href, base) => { try { const u = new URL(href, "https://x" + base); return u.pathname.replace(/\.html$/, "").replace(/\/index$/, "/") + u.hash; } catch { return href; } };
const hrefs = (h, base) => [...mainOf(h).matchAll(/\b(?:href|src|poster)="([^"]+)"/g)].map((m) => resolve(m[1], base));
const srcsets = (h, base) => [...mainOf(h).matchAll(/\bsrcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((x) => resolve(x.trim().split(/\s+/)[0], base)));
const before = new Set([...hrefs(prodSci, "/science"), ...srcsets(prodSci, "/science")]);
const after = new Set([...hrefs(sci, "/science"), ...srcsets(sci, "/science"), ...hrefs(form, "/science/formulation"), ...srcsets(form, "/science/formulation")]);
const RENAMED = { "/science#investigating": "/science/formulation" };
const lost = [...before].filter((u) => !after.has(u) && !(RENAMED[u] && after.has(RENAMED[u])));
check(`every link, citation, image and video from production /science is kept on /science or /science/formulation (${before.size})`, !lost.length, lost.join(" "));

// ---- browser
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const stub = (c) => c.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
{ const r = await fetch(srv.base + "/formulation", { redirect: "manual" }); check("/formulation redirects to /science/formulation", r.status === 301 && r.headers.get("location") === "/science/formulation", `${r.status} ${r.headers.get("location")}`); }
for (const [label, vp, mobile] of [["390", { width: 390, height: 844 }, true], ["1363", { width: 1363, height: 936 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2, reducedMotion: "reduce" }); await stub(ctx);
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  // old deep links
  for (const [id, want] of Object.entries(MOVED)) {
    await pg.goto(srv.base + "/science#" + id, { waitUntil: "load" }); await pg.waitForURL(/\/science\/formulation/, { timeout: 5000 }).catch(() => {}); await pg.waitForTimeout(250);
    const land = LANDS[id] || id;
    const r = await pg.evaluate((id) => { const e = document.getElementById(id); if (!e) return null; const t = (/^H[1-6]$/.test(e.tagName) ? e : (e.closest(".product-split, figure, section") || e)).textContent; const hb = document.querySelector(".site-header").getBoundingClientRect().bottom; const r = (e.tagName === "title" || e.tagName === "desc" || e.tagName === "marker" ? e.closest("figure") : e).getBoundingClientRect(); return { path: location.pathname, hash: location.hash, top: Math.round(r.top), hb: Math.round(hb), text: t.replace(/\s+/g, " ").slice(0, 4000) }; }, land);
    check(`@${label} old /science#${id} reaches the same section on /science/formulation (“${want}”), below the header`, !!r && r.path === "/science/formulation" && r.hash === "#" + land && r.text.includes(want) && r.top >= r.hb - 2 && r.top < vp.height, JSON.stringify(r && { ...r, text: r.text.slice(0, 80) }));
  }
  // gateway structure and order
  await pg.goto(srv.base + "/science", { waitUntil: "load" });
  const order = await pg.evaluate(() => { const q = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : -1; }; return { routes: q(".sci-routes"), intro: q("#programme-intro-title"), shared: q('.sci-shared[aria-label="Shared resources"]'), further: q(".sci-further"), review: q(".sci-review"), words: document.querySelector("main").innerText.split(/\s+/).length, imgs: document.querySelectorAll("main img, main video").length, links: [...document.querySelectorAll('.sci-shared[aria-label="Shared resources"] a strong')].map((x) => x.textContent), intro2: [...document.querySelectorAll(".sci-intro-links a")].map((a) => a.getAttribute("href")) }; });
  check(`@${label} /science: routes → programme introduction → Evidence library, Glossary, programme brief → further reading → review`, order.routes > 0 && order.routes < order.intro && order.intro < order.shared && order.shared < order.further && order.further < order.review && JSON.stringify(order.links) === JSON.stringify(["Evidence library", "Glossary", "Programme brief"]) && order.intro2[0] === "science/formulation.html", JSON.stringify(order));
  const r2 = await pg.evaluate(() => { const r = [...document.querySelectorAll(".sci-route")].map((x) => x.getBoundingClientRect()); return { first: Math.round(r[0].top), w: r.map((x) => Math.round(x.width)) }; });
  check(`@${label} /science: both routes prominent (first route starts within the first screen on desktop; equal width)`, r2.w[0] === r2.w[1] && (mobile || r2.first < vp.height), JSON.stringify(r2));
  if (label === "1363") { const prodWords = text(mainOf(prodSci)).split(" ").length; check(`/science is a concise gateway (${order.words} words now, ${prodWords} in production)`, order.words < prodWords * 0.55, `${order.words} vs ${prodWords}`); }
  for (const p of ["/science", "/science/formulation"]) {
    await pg.goto(srv.base + p, { waitUntil: "load" });
    const m = await pg.evaluate(async () => { for (const i of document.querySelectorAll("main img")) { i.loading = "eager"; await i.decode().catch(() => {}); } return { imgs: [...document.querySelectorAll("main img")].map((i) => i.complete && i.naturalWidth > 0), video: !!document.querySelector("main video source"), hx: document.documentElement.scrollWidth - innerWidth, nav: document.querySelector('#site-nav a[href$="science/formulation.html"]')?.textContent.trim(), sub: [...document.querySelectorAll(".sci-nav a, .secondary-nav a")].some((a) => /formulation\.html$/.test(a.getAttribute("href"))) }; });
    check(`@${label} ${p}: images load, no horizontal scroll, menu and section navigation link to the formulation page`, m.imgs.every(Boolean) && m.hx <= 1 && m.nav === "NWPT formulation" && m.sub && (p === "/science" || (m.imgs.length >= 5 && m.video)), JSON.stringify(m));
    await pg.evaluate(axe);
    const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
    check(`@${label} ${p}: axe (WCAG 2.2 A/AA)`, !v.length, v.join("; "));
  }
  // homepage Science card
  await pg.goto(srv.base + "/", { waitUntil: "load" });
  const card = await pg.$eval('.home-routes a.route-card[href="science.html"]', (a) => a.textContent.replace(/\s+/g, " "));
  check(`@${label} homepage Science card describes both learning routes`, /Psychiatry & evidence/.test(card) && /Understanding cannabinoids/.test(card), card);
  // Programme Room: explore card and the "what is known" source reach the moved content
  await pg.goto(srv.base + "/programme-room", { waitUntil: "load" });
  const pr = await pg.$$eval('a[href*="formulation"]', (as) => as.map((a) => a.getAttribute("href")));
  check(`@${label} Programme Room links to the formulation page (explore card and source)`, pr.includes("science/formulation.html") && pr.includes("science/formulation.html#investigating"), JSON.stringify(pr));
  check(`@${label} no page errors`, !errs.length, errs.join(" | "));
  await ctx.close();
}
// no JavaScript: old anchors land on relevant gateway content
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, reducedMotion: "reduce" }); await stub(ctx); const pg = await ctx.newPage();
  // every old anchor lands on a visible element on /science with an onward link to the matching content
  const WANT = { investigating: "science/formulation.html", formulation: "science/formulation.html", "chrp-title": "science/formulation.html#chrp-title", "q2-h": "science/formulation.html#q2-h", "dg-title": "science/formulation.html#capsule-diagram", "dg-desc": "science/formulation.html#capsule-diagram", ar: "science/formulation.html#capsule-diagram", "conceptual-platform": "science/formulation.html#conceptual-platform" };
  for (const [id, href] of Object.entries(WANT)) {
    await pg.goto("about:blank"); await pg.goto(srv.base + "/science#" + id, { waitUntil: "load" }); await pg.waitForTimeout(300);
    const r = await pg.evaluate(([id, href]) => { const e = document.getElementById(id); if (!e) return null; const box = e.getBoundingClientRect(); const hb = document.querySelector(".site-header").getBoundingClientRect().bottom; const scope = e.closest("li, section") || e; const a = scope.matches("section") ? scope.querySelector(`a[href="${href}"]`) : (e.closest("a") || scope.querySelector("a")); const ar = a && a.getBoundingClientRect(); return { path: location.pathname, vis: box.width > 0 && box.height > 0, inView: !!ar && ar.top >= hb - 2 && ar.bottom <= innerHeight, href: a && a.getAttribute("href"), text: a && a.textContent.trim().slice(0, 60) }; }, [id, href]);
    check(`without JavaScript, /science#${id} lands on a visible link to the moved content (${href})`, !!r && r.path === "/science" && r.vis && r.inView && r.href === href && r.text.length > 5, JSON.stringify(r));
  }
  await ctx.close();
}
// every page with the shared menu links "NWPT formulation" to the new page
{
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const pages = walk(dir).filter((f) => f.endsWith(".html") && fs.readFileSync(f, "utf8").includes(">NWPT formulation</a>"));
  const bad = pages.filter((f) => !/href="(?:\.\.\/|\/)*science\/formulation\.html">NWPT formulation</.test(fs.readFileSync(f, "utf8")));
  check(`menu “NWPT formulation” points to /science/formulation on all ${pages.length} pages`, pages.length >= 38 && !bad.length, bad.join(" "));
}
// enlarged text: no sideways panning (footer, Families citations, homepage people cards, Science gateway and formulation)
for (const [w, scale] of [[320, "150%"], [320, "200%"], [360, "200%"], [390, "150%"], [390, "200%"]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await stub(ctx); const pg = await ctx.newPage();
  for (const p of ["/", "/families", "/science", "/science/formulation", "/evidence"]) {
    await pg.goto(srv.base + p, { waitUntil: "load" }); await pg.evaluate((s) => { document.documentElement.style.fontSize = s; }, scale); await pg.waitForTimeout(150);
    const m = await pg.evaluate((w) => ({ iw: innerWidth, wide: [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > w + 1).slice(0, 3).map((e) => e.tagName + "." + String(e.className).slice(0, 30)), foot: Math.round(document.querySelector(".site-footer").getBoundingClientRect().right), people: [...document.querySelectorAll(".home-person-card")].map((c) => Math.round(c.getBoundingClientRect().right)) }), w);
    check(`${p}@${w} text ${scale}: fits the screen (footer, cards and citations wrap)`, m.iw === w && !m.wide.length && m.foot <= w && m.people.every((r) => r <= w), JSON.stringify(m));
  }
  await ctx.close();
}
await b.close(); srv.stop();
console.log(`science-gateway: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
