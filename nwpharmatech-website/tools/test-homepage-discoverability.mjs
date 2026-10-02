// Homepage entry points (NWPT-046, restructured in NWPT-047): the Programme Room is the primary hero action and the
// programme brief the secondary one; Work with us and Funding stay one click away (hero quick links and the single
// "Start here" section, which also holds the brief); the background section no longer repeats the study card.
// Wording reuses approved page text; nothing implies an investment action or online enquiries.
// Cloudflare Pages runtime, 390x844 and 1363x936:
//   node test-homepage-discoverability.mjs [site-dir]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs";
const dir = process.argv[2] || "../release-032/site";
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 300)}`); };
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const WANT = ["programme-room.html", "work-with-us.html", "programme-financing.html"];   // NWPT-057: "Funding overview" → /programme-financing
for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1363", { width: 1363, height: 936 }]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: "reduce" }); await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
  const pg = await ctx.newPage(); const errs = [], reqs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("request", (r) => reqs.push(r.url()));
  await pg.goto(srv.base + "/", { waitUntil: "load" });
  const cta = await pg.$$eval(".cine-hero .cta-row a", (as) => as.map((a) => [a.getAttribute("href"), a.textContent.trim(), a.classList.contains("btn-primary")]));
  check(`@${label} hero: Programme Room is the primary action, the brief the secondary`, JSON.stringify(cta) === JSON.stringify([["programme-room.html", "Explore the Programme Room", true], ["resources/programme-brief.html", "Read programme brief", false]]), JSON.stringify(cta));
  const quick = await pg.$$eval(".cine-hero .hero-quick a", (as) => as.map((a) => [a.getAttribute("href"), a.textContent.trim()]));
  check(`@${label} hero quick links: research collaboration and funding overview`, JSON.stringify(quick) === JSON.stringify([["work-with-us.html", "Research collaboration"], ["programme-financing.html", "Funding overview"]]), JSON.stringify(quick));
  const eyebrows = await pg.$$eval("main .eyebrow", (xs) => xs.map((x) => x.textContent.trim()));
  check(`@${label} one "Start here" section only; no competing introductions`, eyebrows.filter((e) => /^start here$/i.test(e)).length === 1 && !eyebrows.includes("Explore online") && !/programme in three steps/i.test(await pg.textContent("main")) && (await pg.locator(".home-brief-band").count()) === 0, JSON.stringify(eyebrows));
  const brief = await pg.$$eval(".home-explore .home-start__brief a.btn", (as) => as.map((a) => a.getAttribute("href")));
  check(`@${label} the programme brief (read and PDF) sits inside "Start here"`, brief.length === 2 && brief[0] === "resources/programme-brief.html" && /\.pdf$/.test(brief[1]), JSON.stringify(brief));
  const bg = await pg.$$eval(".home-routes:not(.home-explore) .route-card", (as) => as.map((a) => a.getAttribute("href")));
  check(`@${label} background section: clinical need and science only (study covered once, below)`, JSON.stringify(bg) === JSON.stringify(["updates/why-early-intervention-matters.html", "science.html"]) && (await pg.locator('main a[href="programme.html#design-title"]').count()) === 0, JSON.stringify(bg));
  const main = (await pg.textContent("main")).replace(/\s+/g, " ");
  check(`@${label} limitations kept: investigational, effectiveness, not recruiting, prevention aim, planning target`, /Investigational — effectiveness in this population has not been established\./.test(main) && /Effectiveness has not been established\./.test(main) && /not recruiting/.test(await pg.textContent(".status-chip")) && /Prevention is not the current primary aim/.test(main) && /planning target/.test(main) && /not a locked protocol/.test(main));
  const cards = await pg.$$eval(".home-explore .route-card", (as) => as.map((a) => ({ href: a.getAttribute("href"), text: a.textContent.replace(/\s+/g, " ").trim(), img: a.querySelector("img").complete })));
  check(`@${label} explore band: three cards to the same pages`, JSON.stringify(cards.map((c) => c.href)) === JSON.stringify(WANT), JSON.stringify(cards.map((c) => c.href)));
  check(`@${label} Programme Room card uses the room's own wording`, cards[0].text.includes("What the programme has done, what it plans and what is still unknown, with the source behind each statement."));
  check(`@${label} Work with us card: no account needed; no enquiry promise`, cards[1].text.includes("No account is needed to explore the information or prepare a brief.") && !/enquir|send|contact/i.test(cards[1].text));
  check(`@${label} funding card: informational, not an offer; no investment action`, /not an offer to invest, a prospectus, or open subscription/.test(cards[2].text) && !/\b(invest now|buy|wallet|mint|subscribe now|pay)\b/i.test(cards[2].text));
  if (label === "1363") {
    const r = await pg.evaluate(() => [...document.querySelectorAll(".hero-quick a")].map((a) => a.getBoundingClientRect()).map((x) => ({ top: Math.round(x.top), bottom: Math.round(x.bottom) })));
    check("@1363 hero quick links on one line within the first screen", new Set(r.map((x) => x.top)).size === 1 && Math.max(...r.map((x) => x.bottom)) <= 936, JSON.stringify(r));
    const p = await pg.evaluate(() => Math.round(document.querySelector('.cine-hero .cta-row a[href="programme-room.html"]').getBoundingClientRect().bottom));
    check("@1363 the primary action is within the first screen", p <= 936, String(p));
  }
  const heights = await pg.$$eval(".hero-quick a", (as) => as.map((a) => a.getBoundingClientRect().height));
  check(`@${label} quick-link targets at least 24px tall`, heights.every((h) => h >= 24), JSON.stringify(heights));
  await pg.evaluate(async () => { for (const i of document.querySelectorAll(".home-explore img")) { i.loading = "eager"; i.scrollIntoView(); await i.decode().catch(() => {}); } });
  check(`@${label} explore images load`, await pg.$$eval(".home-explore img", (is) => is.every((i) => i.complete && i.naturalWidth > 0)));
  check(`@${label} no horizontal scroll`, (await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  await pg.evaluate(() => window.scrollTo(0, 0)); await pg.evaluate(axe);
  const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
  check(`@${label} axe automated checks (WCAG 2.2 A/AA rules)`, !v.length, v.join("; "));
  // keyboard: the quick links follow the hero buttons in tab order
  await pg.focus('.cine-hero .cta-row a[href="resources/programme-brief.html"]'); await pg.keyboard.press("Tab");
  check(`@${label} Tab moves from the hero buttons to the first quick link`, (await pg.evaluate(() => document.activeElement.getAttribute("href"))) === "work-with-us.html");
  // keyboard focus, with smooth scrolling settled, must not leave a new link or card heading under the sticky header (forwards and back)
  {
    const settle = () => pg.evaluate(() => new Promise((res) => { let last = -1, same = 0; const t = () => { same = scrollY === last ? same + 1 : 0; last = scrollY; same >= 8 ? res() : requestAnimationFrame(t); }; t(); }));
    const SEL = ".cine-hero .cta-row a, .hero-quick a, .home-routes .route-card, .home-start__brief a.btn"; const bad = [];
    const total = await pg.locator(SEL).count();
    const look = async (dir) => { await settle(); const r = await pg.evaluate((SEL) => { const a = document.activeElement; if (!a.matches(SEL)) return null; const hb = document.querySelector(".site-header").getBoundingClientRect().bottom; const hd = (a.querySelector("h3") || a).getBoundingClientRect(); const b = a.getBoundingClientRect(); return { el: a.getAttribute("href"), ok: b.top >= hb - 1 || hd.top >= hb }; }, SEL); if (r && !r.ok) bad.push(dir + ":" + r.el); return r; };
    await pg.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); }); let n = 0;
    for (let i = 0; i < 120 && n < total; i++) { await pg.keyboard.press("Tab"); if (await look("fwd")) n++; }
    for (let i = 0; i < 120 && n < 2 * total; i++) { await pg.keyboard.press("Shift+Tab"); if (await look("back")) n++; }
    check(`@${label} every entry-point link, card and brief button stays clear of the sticky header (Tab and Shift+Tab)`, total === 11 && n === 2 * total && !bad.length, `${total} ${n} ${bad.join(" ")}`);
  }
  check(`@${label} the funding film is not loaded on the homepage (poster image only)`, !reqs.some((u) => /funding-hero-refined-(21x9|4x3)\.(webm|mp4)/.test(u)));
  check(`@${label} no page errors`, !errs.length, errs.join(" | "));
  await ctx.close();
}
for (const p of ["/programme-room", "/work-with-us", "/funding-use"]) { const r = await fetch(srv.base + p); check(`${p} answers 200`, r.status === 200); }
await b.close(); srv.stop();
console.log(`homepage discoverability: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
