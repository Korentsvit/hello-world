// NWPT-048 Science expansion: two learning routes, four /science/ pages, grouped Science menu, comparisons.
// Cloudflare Pages runtime, 390x844 and 1363x936:  node test-science.mjs [site-dir] [baseline-evidence.html]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs";
const dir = process.argv[2] || "../release-032/site";
const baseEvidence = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8") : null;
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 400)}`); };
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const PAGES = ["/science", "/science/psychiatry", "/science/cannabinoids", "/science/cbd-thc", "/science/cannabinoid-medicines"];
const NEW_IDS = ["health-canada-hcp-2018", "health-canada-about-cannabis", "health-canada-cbd", "laprairie-2015", "englund-2013", "englund-2023", "zamarripa-2023", "chesney-2025", "sativex-smpc", "nabilone-smpc", "mhra-specials", "nhs-cbpm"];
const WITHDRAWN = ["iuphar-cannabinoid-receptors", "fda-cannabis-cbd"]; // unresolved, uncited: kept internally only (public: false)
const MENU = ["Science overview", "Psychiatry & evidence", "Understanding cannabinoids", "CBD and THC", "From cannabis to medicines", "NWPT formulation", "Evidence library", "Glossary"];
const runAxe = async (pg) => { await pg.evaluate(axe); return pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`)); };
const settle = (pg) => pg.evaluate(() => new Promise((res) => { let last = -1, same = 0; const t = () => { same = scrollY === last ? same + 1 : 0; last = scrollY; same >= 8 ? res() : requestAnimationFrame(t); }; t(); }));
const offsite = (ctx) => ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));

// ---------- routes and redirects
for (const p of PAGES) { const r = await fetch(srv.base + p, { redirect: "manual" }); check(`${p} answers 200`, r.status === 200, r.status); }
for (const [from, to] of [["/science.html", "/science"], ["/science/", "/science"], ["/science/cbd-thc.html", "/science/cbd-thc"]]) { const r = await fetch(srv.base + from, { redirect: "manual" }); check(`${from} redirects to ${to}`, [301, 308].includes(r.status) && r.headers.get("location") === to, `${r.status} ${r.headers.get("location")}`); }
{ const r = await fetch(srv.base + "/formulation", { redirect: "manual" }); check("/formulation redirects to the formulation page (NWPT-051)", r.headers.get("location") === "/science/formulation"); }

// ---------- static checks across every page
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = `${d}/${f.name}`; if (f.isDirectory()) { if (f.name !== "functions" && f.name !== "assets") walk(p); } else if (f.name.endsWith(".html")) files.push(p); } }; walk(dir);
const withNav = files.filter((f) => fs.readFileSync(f, "utf8").includes('id="nav-dd-science"'));
const grouped = withNav.filter((f) => { const s = fs.readFileSync(f, "utf8"); const m = s.match(/<ul class="nav-dropdown nav-dropdown--grouped" id="nav-dd-science">([\s\S]*?)<\/ul>/); return m && [...m[1].matchAll(/<a [^>]*>([^<]*)<\/a>/g)].map((x) => x[1].replace("&amp;", "&")).join("|") === MENU.join("|"); });
check(`every page with the site menu has the grouped Science menu (${withNav.length} pages)`, withNav.length >= 38 && grouped.length === withNav.length, withNav.filter((f) => !grouped.includes(f)).join(" "));
check("Study synopsis now in the Programme menu on every page", withNav.every((f) => /programme\.html#design-title">Study design<\/a><\/li>\s*<li><a href="[./]*resources\/public-synopsis\.html">Study synopsis/.test(fs.readFileSync(f, "utf8"))));
const sci = fs.readFileSync(`${dir}/science.html`, "utf8");
// NWPT-051: the formulation and research-question sections moved to /science/formulation; old /science#... links forward
{ const form = fs.readFileSync(`${dir}/science/formulation.html`, "utf8");
  for (const id of ["investigating", "formulation", "chrp-title", "q2-h", "dg-title", "dg-desc", "ar", "conceptual-platform"]) check(`/science/formulation has #${id}`, form.includes(`id="${id}"`));
  check("science.html keeps #investigating and #formulation (no-JavaScript landing on the programme introduction) and loads the anchor forwarder", sci.includes('id="investigating"') && sci.includes('id="formulation"') && /science-forward\.js/.test(sci)); }
const ev = fs.readFileSync(`${dir}/evidence.html`, "utf8");
if (baseEvidence) { const ids = [...baseEvidence.matchAll(/id="(ref-[a-z0-9-]+)"/g)].map((m) => m[1]); check(`all ${ids.length} existing evidence IDs preserved`, ids.every((i) => ev.includes(`id="${i}"`)), ids.filter((i) => !ev.includes(`id="${i}"`)).join(" ")); }
const cardOf = (i) => (ev.match(new RegExp(`id="ref-${i}"[\\s\\S]*?</article>`)) || [""])[0];
check("12 public entries in the new section, none marked 'Source check in progress'; IUPHAR/BPS and FDA withdrawn", NEW_IDS.every((i) => cardOf(i)) && !/nwpt-tag-pending|Source check in progress/.test(ev) && WITHDRAWN.every((i) => !ev.includes(`ref-${i}`)) && /data-filter="cannabinoids">Cannabinoid science and medicines <span class="nwpt-chip-n">12</.test(ev));
{
  const all = JSON.parse(fs.readFileSync(new URL("../content/references.json", import.meta.url), "utf8")).items;
  const refs = all.filter((r) => NEW_IDS.includes(r.id)), gone = all.filter((r) => WITHDRAWN.includes(r.id));
  const dl = ["bib", "ris"].map((x) => fs.readFileSync(`${dir}/downloads/nwpharmatech-references.${x}`, "utf8"));
  check("reference data and citation downloads agree: 12 public entries; withdrawn entries kept internally (public: false) with their history, absent from downloads", refs.length === 12 && refs.every((r) => r.public === true && r.verification !== "brief") && gone.length === 2 && gone.every((r) => r.public === false && /Primary check pending/.test(r.metadata_check) && /Withdrawn/.test(r.finding_check)) && dl.every((t) => !/Source check pending|guidetopharmacology|fda\.gov/.test(t) && /health-?canada/.test(t)));
  check("Health Canada entries: Web Boss's direct inspection reviewed by Claude; earlier ChatGPT history kept; About cannabis date 'not captured'; Spring 2018 for the professional reference", refs.filter((r) => r.id.startsWith("health-canada")).length === 3 && refs.filter((r) => r.id.startsWith("health-canada")).every((r) => /Inspected directly by Web Boss/.test(r.metadata_check) && /reviewed by Claude/.test(r.metadata_check)) && ["health-canada-hcp-2018", "health-canada-about-cannabis"].every((i) => /inspected by ChatGPT, as reported by Filipp/.test(refs.find((r) => r.id === i).metadata_check)) && /Date modified: not captured \(inspected 27 Sep 2026\)/.test(refs.find((r) => r.id === "health-canada-about-cannabis").metadata_check) && /Spring 2018/.test(refs.find((r) => r.id === "health-canada-hcp-2018").metadata_check));
}
const sciNew = (sci.match(/<!-- NWPT-048 routes start -->[\s\S]*?<!-- NWPT-048 routes end -->/) || [""])[0];
const newHtml = PAGES.slice(1).map((p) => fs.readFileSync(`${dir}${p}.html`, "utf8")).join("\n") + sciNew;
const text = newHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
check("no broader Health Canada interaction or entourage content imported", !/entourage|block or lower|may reduce some of the effects/i.test(text + ev));
const banned = [/CBD (?:neutralis|neutraliz|reverses|cancels out) (?:the effects of )?THC/i, /CBD protects against (?:cannabis )?psychosis/i, /\bantagonists?\b/i, /entourage/i, /proven (?:psychiatric )?treatment/i, /THC \(Nabilone\)/, /bad THC|good CBD/i, /natural(?:ly)? (?:means|is) safe/i, /(?:purity|bioequivalen|superior|brain delivery)/i];
check("no overclaiming phrases (CBD/THC opposites, antidote, entourage, proven treatment, nabilone=THC, purity/superiority)", banned.every((r) => !r.test(text)), banned.filter((r) => r.test(text)).join(" "));
check("CBD is never called an antidote except to say the evidence does not support it", [...text.matchAll(/[^.]*antidote[^.]*\./gi)].every((m) => /does not support/.test(m[0])));
check("CBD-cancels-THC appears only as the question, answered 'Not reliably.'", /Does CBD cancel out THC\? Not reliably\./.test(text));
check("review note present on all five pages, no individual reviewer named", PAGES.every((p) => (p === "/science" ? sci : fs.readFileSync(`${dir}${p}.html`, "utf8")).includes("remains under ongoing review by the NWPharmaTech team")) && !/reviewed by (?:Dr|Prof|Professor)/i.test(text));
check("further-reading card: funding and draft-status disclosure, plus About link (overview, cannabinoids, medicines)", ["/science", "/science/cannabinoids", "/science/cannabinoid-medicines"].every((p) => { const s = p === "/science" ? sci : fs.readFileSync(`${dir}${p}.html`, "utf8"); return s.includes("funded by NW PharmaTech Ltd") && s.includes("working draft") && s.includes('href="https://cannabinoidevidence.org/about"') && s.includes('href="https://cannabinoidevidence.org/"'); }));
const citeIds = [...newHtml.matchAll(/evidence\.html#ref-([a-z0-9-]+)/g)].map((m) => m[1]);
check("no Science page cites a withdrawn source", !citeIds.some((i) => WITHDRAWN.includes(i)), citeIds.filter((i) => WITHDRAWN.includes(i)).join(" "));
check("checked wording: Health Canada distinction and endocannabinoid copy; no 'not psychoactive' or 'not another name for THC'; CE.org 'review in progress'", !/not another name for THC|verification pending|not psychoactive/i.test(text) && /CBD does not produce the THC-like high\. Sources: Health Canada: about cannabis Non-intoxicating does not mean inactive or risk-free\. Sources: Health Canada: CBD /.test(text) && /The body produces signalling molecules called endocannabinoids, including anandamide and 2-AG\./.test(text) && /working draft, with independent scientific and regulatory review in progress\./.test(text));
check(`every citation on the Science pages points to an existing Evidence library entry (${new Set(citeIds).size} sources)`, citeIds.every((i) => ev.includes(`id="ref-${i}"`)), [...new Set(citeIds.filter((i) => !ev.includes(`id="ref-${i}"`)))].join(" "));
check("NICE psychological-therapy statement cites CG178 only", /NICE advises against antipsychotics to prevent psychosis in this group\. <span class="sci-cites">Sources: <a class="nwpt-cite" href="\.\.\/evidence\.html#ref-nice-cg178">NICE CG178<\/a><\/span>/.test(newHtml));
check("sitemap lists the four new pages", ["psychiatry", "cannabinoids", "cbd-thc", "cannabinoid-medicines"].every((p) => fs.readFileSync(`${dir}/sitemap.xml`, "utf8").includes(`/science/${p}.html`)));

// ---------- browser checks
for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1363", { width: 1363, height: 936 }]]) {
  const phone = label === "390";
  const ctx = await b.newContext({ viewport: vp }); await offsite(ctx);
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  for (const p of PAGES) {
    await pg.goto(srv.base + p, { waitUntil: "load" });
    const links = await pg.$$eval("main a[href]", (as) => [...new Set(as.map((a) => a.href))].filter((h) => h.startsWith(location.origin)));
    const bad = [];
    for (const h of links) { const u = new URL(h); const r = await fetch(srv.base + u.pathname); if (r.status !== 200) bad.push(`${u.pathname} ${r.status}`); else if (u.hash && u.hash.length > 1) { const html = await r.text(); if (!html.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`)) bad.push(`${u.pathname}${u.hash} (no anchor)`); } }
    check(`@${label} ${p}: every internal link and anchor resolves (${links.length})`, !bad.length, bad.join(", "));
    check(`@${label} ${p}: no horizontal scroll`, (await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
    const v = await runAxe(pg); check(`@${label} ${p}: axe automated checks (WCAG 2.2 A/AA rules)`, !v.length, v.join("; "));
    if (p !== "/science") check(`@${label} ${p}: Science sub-navigation marks the current page`, (await pg.locator('.sci-nav a[aria-current="page"]').count()) === 1);
  }
  // overview: two equally prominent routes, existing video and images intact
  await pg.goto(srv.base + "/science", { waitUntil: "load" });
  const routes = await pg.$$eval(".sci-route", (xs) => xs.map((x) => ({ w: Math.round(x.getBoundingClientRect().width), q: x.querySelectorAll(".sci-route__questions a").length, h: x.querySelector("h3").textContent.trim() })));
  check(`@${label} overview: two routes, three starting questions each, equal width`, routes.length === 2 && routes.every((r) => r.q === 3) && routes[0].w === routes[1].w && routes[0].h === "Psychiatry & evidence" && routes[1].h === "Understanding cannabinoids", JSON.stringify(routes));
  await pg.goto(srv.base + "/science/formulation", { waitUntil: "load" });   // NWPT-051: the images and video moved here
  const media = await pg.evaluate(async () => { for (const i of document.querySelectorAll("main img")) { i.loading = "eager"; i.scrollIntoView(); await i.decode().catch(() => {}); } const v = document.querySelector("main video"); return { imgs: [...document.querySelectorAll("main img")].map((i) => i.complete && i.naturalWidth > 0), video: !!v && v.getAttribute("poster") && v.querySelectorAll("source").length >= 0 }; });
  check(`@${label} formulation page: the moved images load and the Science video is still present`, media.imgs.length >= 5 && media.imgs.every(Boolean) && media.video, JSON.stringify(media));
  // CBD/THC tabs
  await pg.goto(srv.base + "/science/cbd-thc", { waitUntil: "load" });
  const tabs = await pg.$$eval('[role="tab"]', (ts) => ts.map((t) => [t.textContent, t.getAttribute("aria-selected")]));
  check(`@${label} comparison: three tabs, first selected`, JSON.stringify(tabs) === JSON.stringify([["Effects", "true"], ["Clinical evidence", "false"], ["Interactions", "false"]]), JSON.stringify(tabs));
  await pg.focus('[role="tab"][aria-selected="true"]'); await pg.keyboard.press("ArrowRight");
  const after = await pg.evaluate(() => ({ sel: document.activeElement.textContent, visible: [...document.querySelectorAll(".sci-panel")].filter((p) => !p.hidden).map((p) => p.id) }));
  check(`@${label} comparison: ArrowRight moves to Clinical evidence and shows only that panel`, after.sel === "Clinical evidence" && JSON.stringify(after.visible) === '["cmp-clinical"]', JSON.stringify(after));
  const va = await runAxe(pg); check(`@${label} comparison with tabs: axe`, !va.length, va.join("; "));
  const colours = await pg.$$eval(".sci-col", (cs) => cs.map((c) => getComputedStyle(c).borderTopColor));
  check(`@${label} comparison: THC and CBD columns use neutral site colours (no red/green coding)`, colours.every((c) => !/rgb\((2[0-5]\d|1[5-9]\d), (\d{1,2}|1[0-4]\d), (\d{1,2}|1[0-4]\d)\)/.test(c)), colours.join(" "));
  // stacked study cards on phone
  if (phone) { const disp = await pg.$eval(".sci-studies td", (td) => getComputedStyle(td).display); check("@390 study table becomes stacked cards", disp === "block", disp); }
  // keyboard focus clear of the sticky header on each new page (Tab and Shift+Tab, scrolling settled). The focused element's
  // top edge must be below the header and a usable part of it on screen: all of a control, or at least 44px of a focusable
  // content panel (a long panel may continue below the fold and scroll).
  for (const p of PAGES.slice(1)) {
    await pg.goto(srv.base + p, { waitUntil: "load" }); await pg.evaluate(() => document.activeElement?.blur()); const bad = []; let n = 0;
    for (const key of ["Tab", "Shift+Tab"]) for (let i = 0; i < 60; i++) { await pg.keyboard.press(key); await settle(pg);
      const m = await pg.evaluate(() => { const a = document.activeElement; if (!a || !a.closest("main")) return null; const hb = document.querySelector(".site-header").getBoundingClientRect().bottom; const r = a.getBoundingClientRect(); return { el: (a.textContent || a.id).trim().slice(0, 40), ok: r.top >= hb - 1 && Math.min(r.bottom, innerHeight) - r.top >= Math.min(r.height, 44) - 1 }; });
      if (m) { n++; if (!m.ok) bad.push(key + ":" + m.el); } }
    check(`@${label} ${p}: keyboard focus stays clear of the sticky header (${n} stops)`, n > 10 && !bad.length, bad.slice(0, 4).join(" | "));
  }
  // grouped Science menu: keyboard (desktop) and phone menu
  await pg.goto(srv.base + "/science/cannabinoids", { waitUntil: "load" });
  if (phone) { await pg.click(".nav-toggle"); await pg.waitForTimeout(200); }
  const btn = pg.locator('button[aria-controls="nav-dd-science"]'); await btn.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(200);
  const menu = await pg.$$eval("#nav-dd-science a", (as) => as.map((a) => ({ t: a.textContent, vis: a.getClientRects().length > 0, h: a.getBoundingClientRect().height })));
  check(`@${label} Science menu opens by keyboard with 8 visible links, targets ≥ 24px`, menu.length === 8 && menu.every((m) => m.vis && m.h >= 24), JSON.stringify(menu.map((m) => [m.t, m.vis, Math.round(m.h)])));
  const hrefs = await pg.$$eval("#nav-dd-science a", (as) => as.map((a) => a.href));
  const res = await Promise.all(hrefs.map((h) => fetch(h.replace(/#.*/, "")).then((r) => r.status)));
  check(`@${label} Science menu links from a /science/ page all resolve`, res.every((s) => s === 200), JSON.stringify(res));
  // Pre-existing on production (db61de4): with the phone menu open, the panel partly covers .brand and #nav-toggle (axe target-size). Not introduced here; reported separately.
  const vm = (await runAxe(pg)).filter((x) => !(phone && /^target-size: (\.brand|#nav-toggle)$/.test(x))); check(`@${label} Science menu open: axe (excluding the pre-existing phone header target-size finding)`, !vm.length, vm.join("; "));
  check(`@${label} no page errors`, !errs.length, errs.join(" | "));
  await ctx.close();
}
// ---------- without JavaScript
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }); await offsite(ctx);
  const pg = await ctx.newPage(); await pg.goto(srv.base + "/science/cbd-thc", { waitUntil: "load" });
  const nojs = await pg.evaluate(() => ({ tabs: document.querySelectorAll('[role="tab"]').length, panels: [...document.querySelectorAll(".sci-panel")].map((p) => ({ id: p.id, vis: p.getClientRects().length > 0, h: p.querySelector("h3").textContent })) }));
  check("no JavaScript: comparison shows all three panels with headings, no tabs", nojs.tabs === 0 && nojs.panels.length === 3 && nojs.panels.every((p) => p.vis), JSON.stringify(nojs));
  for (const p of PAGES) { await pg.goto(srv.base + p, { waitUntil: "load" }); check(`no JavaScript: ${p} main content readable`, (await pg.evaluate(() => document.querySelector("main h1") && document.querySelector("main").innerText.length > 1500))); }
  await ctx.close();
}
await b.close(); srv.stop();
console.log(`science: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
