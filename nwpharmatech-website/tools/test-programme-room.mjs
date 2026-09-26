// Programme Room (/programme-room) behaviour checks, Cloudflare Pages runtime:
//   node test-programme-room.mjs <site-dir>
// Opening screen (explorer controls on the first screen), shortcuts with focus and history, tabs and keyboard (arrows,
// Home, End), Previous/Next, deep links to stages and to their "What supports this?" disclosures, open-question
// links, "Copy link to this topic", panel structure, work-status and source-type labels, source dates, dated
// milestones kept apart, every stage's image and axe per stage, the page without JavaScript, reduced motion, and
// no Phase 2B dose/size/sponsor claims or inferred approval status.
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

const DATE_LABELS = ["Source date", "Record date", "Record dates", "Website page reviewed"];
for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1363", { width: 1363, height: 936 }]]) {
  // With JavaScript
  const ctx = await b.newContext({ viewport: vp, reducedMotion: "reduce" }); await offsite(ctx);
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await pg.goto(srv.base + "/programme-room", { waitUntil: "load" });
  const tabs = pg.locator('[role="tab"]');
  // opening screen: the explorer's stage controls start on the first screen
  const firstTab = await pg.evaluate(() => { const r = document.querySelector('[role="tab"]').getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
  check(`@${label} first stage control on the first screen`, label === "390" ? firstTab.top < vp.height : firstTab.bottom <= vp.height, JSON.stringify(firstTab));
  check(`@${label} explorer heading is "Explore the programme"`, (await pg.textContent("#room-explore-heading")) === "Explore the programme" && !(await pg.evaluate(() => document.body.innerText.includes("Study timeline"))));
  check(`@${label} no large introductory figure`, (await pg.locator(".room-hero img, .room-hero figure").count()) === 0);
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
  check(`@${label} every source shows scope, source type, date and limitations`, meta.items.length > 0 && meta.items.every((x) => { const d = x.split("|"); return d[0] === "Relates to" && d[1] === "Source type" && d.at(-1) === "Limitations" && d.some((k) => DATE_LABELS.includes(k)); }), JSON.stringify(meta.items));
  // each stage shows its progress (completed, in progress, planned...) in the strip
  const progress = await pg.$$eval('[role="tab"] .room-steps__progress', (xs) => xs.map((x) => x.textContent));
  check(`@${label} strip shows each stage's progress`, JSON.stringify(progress) === JSON.stringify(DATA.stages.map((s) => s.strip)), JSON.stringify(progress));
  // sources about other CBD products say so; none of them is labelled as NWPT-SM32300
  const scope = await pg.$$eval(".room-source", (xs) => xs.map((x) => [x.querySelector("a").getAttribute("href"), x.querySelector(".room-source__about dd").textContent]));
  const OTHER = ["#ref-perucca-2020", "#ref-taylor-2018", "#ref-cantop", "#ref-bhattacharyya-2024"];
  check(`@${label} other-CBD sources labelled "not NWPT-SM32300"`, scope.filter(([h]) => OTHER.some((o) => h.endsWith(o))).every(([, t]) => /Other CBD products — not NWPT-SM32300/.test(t))
    && scope.filter(([h]) => OTHER.some((o) => h.endsWith(o))).length === 4, JSON.stringify(scope));
  // labels: work status and source type are separate sets; no approval status inferred
  const key = await pg.evaluate(() => ({ work: [...document.querySelectorAll(".room-key .room-status")].map((x) => x.textContent), types: [...document.querySelectorAll(".room-key .room-type")].map((x) => x.textContent) }));
  check(`@${label} work-status key: 5 statuses`, JSON.stringify(key.work) === JSON.stringify(["Background", "Completed", "In progress (reported)", "Proposed", "Open question"]), JSON.stringify(key.work));
  check(`@${label} source-type key: published research, guidance, registry, company records`, JSON.stringify(key.types) === JSON.stringify(["Published research", "Published guidance", "Registry information", "Company records"]), JSON.stringify(key.types));
  const whole = await pg.evaluate(() => document.querySelector("main").textContent);
  check(`@${label} no approval status inferred from missing documentation`, !/not started, not approved|approvals? (are |is )?not confirmed|not confirmed in public|before any approvals/i.test(whole));
  // panels: question, what is known, what further research would establish
  const h4s = await pg.$$eval("[data-stage]", (xs) => xs.map((x) => [...x.querySelectorAll(".room-panel__text h4")].map((h) => h.textContent).join("|")));
  check(`@${label} every panel: question, known, further research`, h4s.length === 6 && h4s.every((x) => x === "The question|What is known|What further research would establish"), JSON.stringify(h4s));
  // source dates: a date or an explicit "not available"; website review dates labelled apart
  const dates = await pg.$$eval(".room-source__date", (xs) => xs.map((x) => [x.querySelector("dt").textContent, x.querySelector("dd").textContent]));
  check(`@${label} every source date is a date or explicitly unavailable`, dates.length >= 15 && dates.every(([, v]) => /\b20\d\d\b/.test(v) || /^Not available$|^Not shown on the page$/.test(v)), JSON.stringify(dates.filter(([, v]) => !/\b20\d\d\b/.test(v))));
  check(`@${label} no non-date values in date fields`, !dates.some(([, v]) => /Study report|Current page|Current version|Last reviewed with/i.test(v)));
  // library-backed sources offer both the library explanation and the original source
  const both = await pg.$$eval(".room-source", (xs) => xs.filter((x) => x.querySelector('a[href^="evidence.html#"]')).map((x) => [x.querySelector('a[href^="evidence.html#"]').getAttribute("href"), !!x.querySelector('a[href^="https://"]')]));
  check(`@${label} library sources link to the library entry and the original source`, both.length >= 10 && both.every(([, ext]) => ext), JSON.stringify(both.filter(([, e]) => !e)));
  // dated milestones sit outside the explorer
  check(`@${label} dated milestones table outside the explorer (6 rows)`, (await pg.locator("#now .room-milestones tbody tr").count()) === 6 && (await pg.locator("[data-room-timeline] .room-milestones, [data-room-timeline] .room-dates").count()) === 0);
  // shortcuts: navigate, move focus, keep history
  const sc = await pg.$$eval(".room-shortcut", (xs) => xs.map((x) => x.textContent));
  check(`@${label} three opening shortcuts`, JSON.stringify(sc) === JSON.stringify(["Where are we now?", "What has been studied?", "What would Phase 2B investigate?"]), JSON.stringify(sc));
  const followShortcut = async (i) => { await pg.evaluate(() => window.scrollTo(0, 0)); await pg.locator(".room-shortcut").nth(i).click(); await pg.waitForTimeout(250);
    return pg.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(); return { hash: location.hash, active: a.id, inView: r.top < innerHeight && r.bottom > 0, shown: [...document.querySelectorAll("[data-stage]")].filter((s) => !s.hidden).map((s) => s.id) }; }); };
  let r = await followShortcut(0); check(`@${label} "Where are we now?" goes to #now with focus`, r.hash === "#now" && r.active === "now" && r.inView, JSON.stringify(r));
  r = await followShortcut(1); check(`@${label} "What has been studied?" opens Phase 1 with focus`, r.hash === "#stage-phase-1" && r.active === "stage-phase-1" && r.inView && r.shown[0] === "stage-phase-1", JSON.stringify(r));
  r = await followShortcut(2); check(`@${label} "What would Phase 2B investigate?" opens Phase 2B with focus`, r.hash === "#stage-phase-2b" && r.active === "stage-phase-2b" && r.inView && r.shown[0] === "stage-phase-2b", JSON.stringify(r));
  await pg.goBack(); await pg.waitForTimeout(250);
  check(`@${label} Back returns to the previous topic`, (await pg.evaluate(() => location.hash)) === "#stage-phase-1" && (await visible(pg))[0] === "stage-phase-1");
  r = await followShortcut(1); check(`@${label} following the current topic's link again still focuses it`, r.active === "stage-phase-1" && r.inView, JSON.stringify(r));
  // open questions link to the relevant panel and opens its disclosure
  const oq = await pg.$$eval(".room-open__link", (xs) => xs.map((x) => x.getAttribute("href")));
  check(`@${label} six open questions, each a link to a stage's sources`, oq.length === 6 && oq.every((h) => /^#stage-[a-z0-9-]+-sources$/.test(h)), JSON.stringify(oq));
  for (let i = 0; i < oq.length; i++) {
    await pg.locator(".room-open__link").nth(i).scrollIntoViewIfNeeded(); await pg.locator(".room-open__link").nth(i).click(); await pg.waitForTimeout(250);
    const o = await pg.evaluate((h) => { const d = document.getElementById(h.slice(1)); const s = d.querySelector("summary"); const r = s.getBoundingClientRect();
      return { open: d.open, focus: document.activeElement === s, inView: r.top >= 0 && r.bottom <= innerHeight, stage: d.closest("[data-stage]").hidden === false }; }, oq[i]);
    check(`@${label} open question ${i + 1} opens ${oq[i]} with focus`, o.open && o.focus && o.inView && o.stage, JSON.stringify(o));
    await pg.evaluate((h) => { document.getElementById(h.slice(1)).open = false; }, oq[i]);
  }
  // copy link to this topic
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: srv.base });
  await tabs.nth(2).click();
  const copyBtn = pg.locator("#stage-phase-1 .room-copy");
  check(`@${label} "Copy link to this topic" button`, (await copyBtn.textContent()) === "Copy link to this topic" && (await copyBtn.evaluate((b) => b.tagName)) === "BUTTON");
  await copyBtn.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(200);
  const clip = await pg.evaluate(() => navigator.clipboard.readText());
  check(`@${label} copied link is the stage URL`, clip === srv.base + "/programme-room#stage-phase-1", clip);
  check(`@${label} copy is confirmed in a status message`, (await pg.textContent("#stage-phase-1 .room-copy__status")) === "Link copied");
  // after Previous/Next, the stage strip is fully below the sticky header
  await tabs.nth(0).click();
  await pg.locator(`#${IDS[0]} .room-stage-nav__btn--next`).scrollIntoViewIfNeeded(); await pg.locator(`#${IDS[0]} .room-stage-nav__btn--next`).click(); await pg.waitForTimeout(200);
  const gap = await pg.evaluate(() => document.querySelector(".room-steps").getBoundingClientRect().top - document.querySelector(".site-header").getBoundingClientRect().bottom);
  check(`@${label} after Next, the stage strip is not under the sticky header`, gap >= 0, `${gap}px`);
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
  await pg.goto(srv.base + "/programme-room#stage-formulation-sources", { waitUntil: "load" }); await pg.waitForTimeout(200);
  check(`@${label} deep link to a disclosure opens the stage and the disclosure`, (await visible(pg))[0] === "stage-formulation" && (await pg.evaluate(() => document.getElementById("stage-formulation-sources").open)));
  await pg.evaluate(() => { location.hash = "#stage-protocol"; }); await pg.waitForTimeout(100);
  check(`@${label} hash change switches stage`, (await visible(pg))[0] === "stage-protocol");
  check(`@${label} no console errors`, !errsBeforeAxe.length, errsBeforeAxe.join(" | "));
  // the sticky header never covers keyboard focus, tabbing backwards and forwards through the page
  await pg.goto(srv.base + "/programme-room#stage-phase-2b-sources", { waitUntil: "load" }); await pg.waitForTimeout(200);
  const hidden = [];
  for (const key of ["Shift+Tab", "Tab"]) for (let i = 0; i < 90; i++) { await pg.keyboard.press(key);
    const m = await pg.evaluate(() => { const a = document.activeElement; if (!a || a === document.body || a.closest(".site-header") || a.classList.contains("skip-link")) return null;
      const hb = document.querySelector(".site-header").getBoundingClientRect().bottom, t = a.getBoundingClientRect().top; return t < hb - 1 ? `${a.tagName}.${a.className} ${Math.round(t)}<${Math.round(hb)}` : null; });
    if (m) hidden.push(m); }
  check(`@${label} keyboard focus never under the sticky header`, !hidden.length, hidden.slice(0, 5).join("; "));
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
  check(`@${label} no JS: plain "Link to this topic" anchors`, JSON.stringify(await pn.$$eval("a[data-copy-link]", (as) => as.map((a) => a.getAttribute("href").slice(1)))) === JSON.stringify(IDS));
  check(`@${label} no JS: every in-page link has a target`, await pn.evaluate(() => [...document.querySelectorAll('main a[href^="#"]')].every((a) => document.getElementById(a.getAttribute("href").slice(1)))));
  check(`@${label} no JS: shortcuts, milestones and open questions present`, (await pn.locator(".room-shortcut").count()) === 3 && (await pn.locator(".room-milestones tbody tr").count()) === 6 && (await pn.locator(".room-open__link").count()) === 6);
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
