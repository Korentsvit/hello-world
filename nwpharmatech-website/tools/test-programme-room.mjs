// Programme Room (/programme-room) behaviour checks, Cloudflare Pages runtime:
//   node test-programme-room.mjs <site-dir>
// Tabs and keyboard (arrows, Home, End), Previous/Next, deep links, "What supports this?" by keyboard, every stage's
// image and axe per stage, the page without JavaScript, reduced motion, and no Phase 2B dose/size/sponsor claims.
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs";
const dir = process.argv[2] || "../release-032/site";
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + d}`); };
const IDS = ["need", "formulation", "phase-1", "protocol", "phase-2b", "later"].map((s) => "stage-" + s);
// expected image per stage, from the content source (a stage without an image in the source must show none)
const DATA = JSON.parse(fs.readFileSync(new URL("../release-032/source/programme-room.json", import.meta.url), "utf8"));
const EXPECT = Object.fromEntries(DATA.stages.map((s) => ["stage-" + s.id, s.image ? s.image.src.split("/").slice(-2).join("/") : null]));
const offsite = (ctx) => ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "", contentType: "text/css" }));
const runAxe = async (pg) => { await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(200); await pg.evaluate(axe); return pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`)); };
const visible = (pg) => pg.evaluate(() => [...document.querySelectorAll("[data-stage]")].filter((s) => !s.hidden && s.getClientRects().length).map((s) => s.id));
const imagesLoad = (pg, sel) => pg.evaluate(async (sel) => { const out = []; for (const i of document.querySelectorAll(sel)) { if (!i.getClientRects().length) continue; i.scrollIntoView({ block: "center" });
  const t0 = performance.now(); while (!(i.complete && i.naturalWidth > 0) && performance.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 50)); if (!(i.complete && i.naturalWidth > 0)) out.push(i.currentSrc); } return out; }, sel);

for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1280", { width: 1280, height: 900 }]]) {
  // With JavaScript
  const ctx = await b.newContext({ viewport: vp, reducedMotion: "reduce" }); await offsite(ctx);
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await pg.goto(srv.base + "/programme-room", { waitUntil: "load" });
  const tabs = pg.locator('[role="tab"]');
  check(`@${label} six tabs in a tablist`, (await tabs.count()) === 6 && (await pg.locator('[role="tablist"]').count()) === 1);
  check(`@${label} first stage selected, one panel shown`, JSON.stringify(await visible(pg)) === JSON.stringify([IDS[0]]) && (await tabs.nth(0).getAttribute("aria-selected")) === "true");
  await tabs.nth(0).focus(); await pg.keyboard.press("ArrowRight");
  check(`@${label} ArrowRight selects and focuses stage 2`, (await visible(pg))[0] === IDS[1] && (await pg.evaluate(() => document.activeElement.id)) === "tab-" + IDS[1]);
  check(`@${label} URL fragment follows the stage`, (await pg.evaluate(() => location.hash)) === "#" + IDS[1]);
  await pg.keyboard.press("End"); check(`@${label} End selects the last stage`, (await visible(pg))[0] === IDS[5]);
  await pg.keyboard.press("Home"); check(`@${label} Home selects the first stage`, (await visible(pg))[0] === IDS[0]);
  await pg.keyboard.press("ArrowLeft"); check(`@${label} ArrowLeft wraps to the last stage`, (await visible(pg))[0] === IDS[5]);
  check(`@${label} only the selected tab is in the tab order`, (await pg.evaluate(() => [...document.querySelectorAll('[role="tab"]')].filter((t) => t.tabIndex === 0).length)) === 1);
  await pg.keyboard.press("Home");
  await pg.locator(`#${IDS[0]} .room-stage-nav__btn--next`).click();
  check(`@${label} Next button moves on and focuses the panel`, (await visible(pg))[0] === IDS[1] && (await pg.evaluate(() => document.activeElement.id)) === IDS[1]);
  await pg.locator(`#${IDS[1]} .room-stage-nav__btn--prev`).click();
  check(`@${label} Previous button moves back`, (await visible(pg))[0] === IDS[0]);
  const errsBeforeAxe = errs.slice(); // axe's own stylesheet fetches are refused by the page's CSP; not page errors
  const sum = pg.locator(`#${IDS[0]} .room-support summary`); await sum.focus(); await pg.keyboard.press("Enter");
  const meta = await pg.evaluate((id) => { const d = document.querySelector(`#${id} .room-support`); return { open: d.open, items: [...d.querySelectorAll(".room-source")].map((s) => [...s.querySelectorAll("dt")].map((t) => t.textContent).join("|")) }; }, IDS[0]);
  check(`@${label} "What supports this?" opens by keyboard`, meta.open);
  check(`@${label} every source shows status, date and limitations`, meta.items.length > 0 && meta.items.every((x) => x === "Evidence status|Date|Limitations"), JSON.stringify(meta.items));
  for (let i = 0; i < 6; i++) {
    await tabs.nth(i).click();
    // every image in the opened panel must be rendered (none skipped), be the expected one, and load
    const im = await pg.evaluate(async (id) => { const out = []; for (const i of document.querySelectorAll(`#${id} img`)) { const shown = i.getClientRects().length > 0;
      if (shown) { i.scrollIntoView({ block: "center" }); const t0 = performance.now(); while (!(i.complete && i.naturalWidth > 0) && performance.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 50)); }
      out.push({ src: i.getAttribute("src"), shown, loaded: i.complete && i.naturalWidth > 0 }); } return out; }, IDS[i]);
    const want = EXPECT[IDS[i]];
    check(`@${label} ${IDS[i]}: opened (only this panel shown)`, JSON.stringify(await visible(pg)) === JSON.stringify([IDS[i]]));
    if (want) {
      check(`@${label} ${IDS[i]}: one image, ${want}, rendered and loaded`, im.length === 1 && im[0].src.includes(want) && im[0].shown && im[0].loaded, JSON.stringify(im));
    } else {
      check(`@${label} ${IDS[i]}: no image, as in the content source`, im.length === 0, JSON.stringify(im));
    }
    const v = await runAxe(pg); check(`@${label} ${IDS[i]}: axe automated checks (WCAG 2.2 A/AA rules)`, !v.length, v.join("; "));
    check(`@${label} ${IDS[i]}: no horizontal scroll`, (await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  }
  check(`@${label} reduced motion: no panel animation`, (await pg.evaluate(() => getComputedStyle(document.querySelector("[data-stage]:not([hidden]) .room-panel")).animationName)) === "none");
  await pg.goto(srv.base + "/programme-room#stage-phase-2b", { waitUntil: "load" });
  check(`@${label} deep link opens the named stage`, (await visible(pg))[0] === "stage-phase-2b" && (await tabs.nth(4).getAttribute("aria-selected")) === "true");
  await pg.evaluate(() => { location.hash = "#stage-protocol"; }); await pg.waitForTimeout(100);
  check(`@${label} hash change switches stage`, (await visible(pg))[0] === "stage-protocol");
  check(`@${label} no console errors`, !errsBeforeAxe.length, errsBeforeAxe.join(" | "));
  await ctx.close();

  // Motion allowed: the panel eases in
  const ctxM = await b.newContext({ viewport: vp, reducedMotion: "no-preference" }); await offsite(ctxM);
  const pm = await ctxM.newPage(); await pm.goto(srv.base + "/programme-room", { waitUntil: "load" });
  check(`@${label} motion allowed: panel eases in`, (await pm.evaluate(() => getComputedStyle(document.querySelector("[data-stage]:not([hidden]) .room-panel")).animationName)) === "room-in");
  await ctxM.close();

  // Without JavaScript
  const ctxN = await b.newContext({ viewport: vp, javaScriptEnabled: false }); await offsite(ctxN);
  const pn = await ctxN.newPage(); await pn.goto(srv.base + "/programme-room", { waitUntil: "load" });
  check(`@${label} no JS: all six stages readable`, JSON.stringify(await visible(pn)) === JSON.stringify(IDS));
  check(`@${label} no JS: stage links are in-page anchors`, JSON.stringify(await pn.$$eval("[data-stage-link]", (as) => as.map((a) => a.getAttribute("href").slice(1)))) === JSON.stringify(IDS));
  check(`@${label} no JS: no tab roles`, (await pn.locator('[role="tab"]').count()) === 0);
  await pn.goto(srv.base + "/programme-room#stage-phase-1", { waitUntil: "load" });
  check(`@${label} no JS: stage fragment targets the stage`, (await pn.evaluate(() => document.querySelector(":target")?.id)) === "stage-phase-1");
  const brokenN = await imagesLoad(pn, "main img"); check(`@${label} no JS: all images load`, !brokenN.length, brokenN.join(", "));
  // axe needs scripting, so the no-JS layout is audited with programme-room.js blocked (same DOM as with scripting off)
  const ctxA = await b.newContext({ viewport: vp }); await offsite(ctxA); await ctxA.route(/programme-room\.js/, (r) => r.abort());
  const pa = await ctxA.newPage(); await pa.goto(srv.base + "/programme-room", { waitUntil: "load" }); await imagesLoad(pa, "main img");
  check(`@${label} without the enhancement: all six stages shown`, (await visible(pa)).length === 6);
  const vN = await runAxe(pa); await ctxA.close(); check(`@${label} no JS: axe automated checks (WCAG 2.2 A/AA rules)`, !vN.length, vN.join("; "));
  check(`@${label} no JS: no horizontal scroll`, (await pn.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  if (label === "390") {
    const text = await pn.evaluate(() => document.querySelector("main").innerText);
    check("content: no Phase 2B participant number or doses", !/\b328\b|\b600\s*mg|\b900\s*mg|\b12 weeks|\bweek 16\b/i.test(text));
    check("content: sponsor named only for the registered Phase 1 study", (text.match(/sponsor/gi) || []).length === 1 && /Sponsor of the Phase\s1 study: NWPharmaTech Ltd/.test(text));
    check("content: no investment or payment calls to action", !/\b(invest now|buy|wallet|mint|pay now)\b/i.test(text));
    const links = await pn.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href")));
    for (const p of ["evidence.html", "study.html", "phase-1.html", "science.html"]) check(`links into ${p}`, links.some((h) => h.startsWith(p)));
  }
  await ctxN.close();
}
await b.close(); await srv.close?.();
console.log(`programme room: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
