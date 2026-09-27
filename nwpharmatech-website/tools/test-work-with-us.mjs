// "Explore a research collaboration" (/work-with-us) checks, Cloudflare Pages runtime (wrangler), at 390x844 and 1363x936:
//   node test-work-with-us.mjs [site-dir]
// 1. Unconfigured (as deployed today): the page says online enquiries are unavailable and sends nothing.
// 2. The journey: focus questions, card sources and actions, agenda edit/reorder/remove (sidebar and phone drawer),
//    dated brief with company text and visitor text kept apart, print view, share link (ids and version only),
//    tab-only storage, keyboard, axe automated checks (WCAG 2.2 A/AA rules), reduced motion, no-JavaScript content.
// 3. Submission with test settings against a local mock email service and Turnstile verifier: validation, provider
//    failure, duplicate clicks, a dropped connection retried with the same idempotency key, server-derived company
//    text, and direct API checks. "Enquiry submitted" may appear only after the function reports acceptance.
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import http from "node:http";
const dir = process.argv[2] || "../release-032/site";
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const WWU = JSON.parse(fs.readFileSync(new URL("../release-032/source/work-with-us.json", import.meta.url), "utf8"));
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 400)}`); };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const runAxe = async (pg) => { await pg.evaluate(axe); return pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`)); };
const SECRET = "Confidential-looking visitor text 7731 <img src=x onerror=window.__xss=1>";
const EMAIL = "investigator.test@example.org";
const TS_STUB = `window.turnstile={_cb:null,render:function(sel,o){this._cb=o.callback;var p=document.createElement('p');p.textContent='[security check: test stub]';document.querySelector(sel).appendChild(p);setTimeout(function(){o.callback('tok-ok')},10);return 'w1'},reset:function(){var cb=this._cb;setTimeout(function(){cb&&cb('tok-ok')},10)}};`;
async function context(srv, vp, extra = {}) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: "reduce", ...extra });
  const urls = [];
  ctx.on("request", (r) => urls.push(r.url()));
  await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.request().url().startsWith("https://challenges.cloudflare.com/turnstile/")
    ? r.fulfill({ status: 200, body: TS_STUB, contentType: "text/javascript" }) : r.fulfill({ status: 200, body: "", contentType: "text/css" }));
  return { ctx, urls };
}
const cardAction = (id) => `.wwu-act[data-card="${id}"]`;

// ---------------------------------------------------------------- 1 + 2: as deployed (no enquiry settings)
{
  const srv = await serve(dir);
  // navigation: every page with the Programme menu lists Work with us after Programme Room, and in the footer before Contact
  const pathMod = await import("node:path"); const root = pathMod.resolve(dir); const pages = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = pathMod.join(d, e.name); if (e.isDirectory() && e.name !== "functions" && e.name !== "assets") walk(f); else if (e.name.endsWith(".html")) pages.push(f); } })(root);
  const navBad = [], linkTargets = new Set();
  for (const f of pages) {
    const s = fs.readFileSync(f, "utf8"); if (!s.includes("programme-room.html\">Programme Room</a>")) continue;
    const nav = s.match(/<li><a href="([^"]*)programme-room\.html">Programme Room<\/a><\/li>\s*<li><a href="([^"]*)work-with-us\.html">Work with us<\/a><\/li>/);
    const foot = s.slice(s.indexOf("<footer")).match(/<a href="([^"]*)work-with-us\.html">Work with us<\/a>\s*<a href="[^"]*contact\.html">Contact<\/a>/);
    if (!nav || !foot || nav[1] !== nav[2]) navBad.push(pathMod.relative(root, f));
    else linkTargets.add(new URL(nav[2] + "work-with-us.html", "http://x/" + pathMod.relative(root, f)).pathname);
  }
  check(`navigation and footer list Work with us on every page with the menu (${pages.length} pages scanned)`, !navBad.length && linkTargets.size >= 1, navBad.join(", "));
  for (const t of linkTargets) { const r = await fetch(srv.base + t, { redirect: "manual" }); const r2 = r.status >= 300 && r.status < 400 ? await fetch(srv.base + r.headers.get("location")) : r;
    check(`nav link ${t} reaches the page in at most one redirect`, r2.status === 200); }
  // privacy notice: Part A (browser-only workspace) applied; Part B (enquiry form) not applied
  const priv = (await (await fetch(srv.base + "/privacy")).text()).replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
  for (const t of ["We do not run an account system or payment system. The “Explore a research collaboration” page keeps your planning notes in your browser only, as described below. Online enquiries are not active; contact is by email.",
    "Your optional answers, agenda and questions are stored in your browser for this tab’s session. Browser session-restoration features may preserve them. You can clear your answers and remove agenda items using the page controls. These planning contents are not sent to NWPharmaTech.",
    "To show whether online enquiries are available, the page makes one extra request to this website. That request contains none of your answers, agenda items or questions.",
    "Links you copy from the page contain only the page’s content version and the identifiers of the public topics and cards you selected. They never include your answers, your questions or any contact details.",
    "Discussion briefs are created in your browser. Printing a brief or saving it as a PDF does not send it to us.",
    "Last updated: 26 September 2026."]) check(`privacy notice contains: ${t.slice(0, 60)}…`, priv.includes(t));
  check("privacy notice: no static-site claim, no deletion guarantee, no enquiry-form (Part B) text", !/These pages are static|removed when you close the tab|Research collaboration enquiries|Resend|to be confirmed|\[[A-Z ]+/i.test(priv));
  const contact = await (await fetch(srv.base + "/contact")).text();
  check("Contact page keeps its research link to Work with us", /<a class="card-link" href="work-with-us\.html">Explore a research collaboration<\/a>/.test(contact) && contact.includes('href="mailto:team@nwpharmatech.com?subject=Research%20collaboration"'));
  const h = await fetch(srv.base + "/work-with-us");
  check("route /work-with-us answers 200", h.status === 200);
  check("page CSP allows only the Turnstile origin beyond the site", /script-src 'self' https:\/\/challenges\.cloudflare\.com/.test(h.headers.get("content-security-policy") || "") && (h.headers.get("content-security-policy") || "").split(",").length === 1);
  const other = await fetch(srv.base + "/programme");
  check("other pages keep the site CSP", !(other.headers.get("content-security-policy") || "").includes("challenges.cloudflare.com"));
  const g = await (await fetch(srv.base + "/api/enquiry")).json();
  check("GET /api/enquiry reports not configured", g.configured === false && g.turnstileSiteKey === null);
  const p0 = await fetch(srv.base + "/api/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ version: WWU.version }) });
  check("POST without settings answers 503 not_configured", p0.status === 503 && (await p0.json()).code === "not_configured");

  for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1363", { width: 1363, height: 936 }]]) {
    const phone = label === "390";
    const { ctx, urls } = await context(srv, vp);
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: srv.base });
    const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    await pg.goto(srv.base + "/work-with-us", { waitUntil: "load" });
    check(`@${label} title and heading`, (await pg.title()).startsWith("Explore a research collaboration") && (await pg.textContent("h1")) === "Explore a research collaboration");
    check(`@${label} no "Run a study" wording`, !/run a study/i.test(await pg.textContent("main")));
    check(`@${label} introduction: no account needed`, (await pg.textContent(".wwu-hero .lede")).includes("No account is needed to explore the information or prepare a brief.") && !/registration/i.test(await pg.textContent(".wwu-hero")));
    // a card's own status is never the related stage's status
    const st = await pg.$$eval(".wwu-card", (xs) => xs.map((x) => ({ id: x.dataset.cardId, chips: [...x.querySelectorAll(".wwu-card__kind .room-status")].map((c) => c.textContent), stage: x.querySelector(".wwu-card__stage")?.textContent || "" })));
    const open = st.filter((c) => c.id.startsWith("oq-"));
    check(`@${label} open questions show "Unresolved", never a stage status`, open.length === 5 && open.every((c) => JSON.stringify(c.chips) === '["Unresolved"]'), JSON.stringify(open));
    check(`@${label} no card shows a stage work status as its own badge`, st.every((c) => c.chips.every((t) => t === "Unresolved")), JSON.stringify(st.filter((c) => c.chips.some((t) => t !== "Unresolved"))));
    const brain = st.find((c) => c.id === "oq-brain");
    check(`@${label} "How much reaches the brain?": unresolved, related stage labelled separately`, JSON.stringify(brain.chips) === '["Unresolved"]' && /^Related stage: Stage 2 · Formulation — stage work status: Completed$/.test(brain.stage), JSON.stringify(brain));
    // unconfigured enquiry
    await pg.waitForSelector("#wwu-enquiry .wwu-callout");
    const enqText = await pg.textContent("#wwu-enquiry");
    check(`@${label} unconfigured: says unavailable and nothing sent`, /not available yet/.test(enqText) && /Nothing has been sent/.test(enqText));
    check(`@${label} unconfigured: no contact fields requested`, (await pg.locator("#wwu-enquiry input, #wwu-enquiry textarea").count()) === 0);
    check(`@${label} unconfigured: heading and step say "Contact about collaboration"`, (await pg.textContent("[data-enquiry-heading]")) === "Contact about collaboration" && (await pg.textContent("[data-enquiry-step]")) === "Contact");
    check(`@${label} unconfigured: no "Send enquiry" wording anywhere`, !/send (an |a non-confidential )?enquiry/i.test(await pg.textContent("main")));
    check(`@${label} unconfigured: explains nothing was sent`, /Nothing has been sent from this page/.test(enqText));
    // NWPT-047 email handoff: the approved research-collaboration link, subject only; print/save, attach manually; nothing sent or attached by the link
    const MAILTO = "mailto:team@nwpharmatech.com?subject=Research%20collaboration";
    check(`@${label} handoff: one direct email link, the approved subject-only address`, JSON.stringify(await pg.$$eval("#wwu-enquiry a[href^='mailto:']", (as) => as.map((a) => a.getAttribute("href")))) === JSON.stringify([MAILTO]));
    const steps = await pg.$$eval("#wwu-enquiry .wwu-handoff li", (xs) => xs.map((x) => x.textContent.replace(/\s+/g, " ")));
    check(`@${label} handoff: print/save, write, attach yourself`, steps.length === 3 && /Print your brief or save it as a PDF/.test(steps[0]) && /team@nwpharmatech\.com/.test(steps[1]) && /Attach the saved PDF to your email yourself/.test(steps[2]), JSON.stringify(steps));
    check(`@${label} handoff: says the link sends and attaches nothing`, /does not send anything, and it does not add your brief, questions or answers/.test(steps[1]) && !/(will|we) (send|attach)|sends? your|attached automatically/i.test(enqText.replace(/does not send anything/, "")));
    check(`@${label} handoff: explains a topic link excludes private questions`, /contains only the selected topics and cards\. Your own questions, focus answers and contact details are not in it/.test(enqText));
    check(`@${label} useful content before any contact request`, (await pg.locator(".wwu-card").count()) === WWU.cards.length && (await pg.locator("#focus").evaluate((n) => !n.hidden)));
    // cards: sources and actions
    const cards = await pg.$$eval(".wwu-card", (xs) => xs.map((x) => ({ id: x.dataset.cardId, kind: [...x.classList].find((c) => c.startsWith("wwu-card--")).slice(10), acts: [...x.querySelectorAll(".wwu-act")].map((b) => b.textContent), src: x.querySelectorAll(".wwu-card__sources li").length, lib: x.querySelectorAll('.wwu-card__sources a[href^="evidence.html#"], .wwu-card__sources a[href$=".html"], .wwu-card__sources a[href*=".html#"]').length, ext: x.querySelectorAll('.wwu-card__sources a[href^="https://"]').length, dates: x.querySelectorAll(".wwu-src__meta dt").length })));
    const want = { finding: ["Discuss this finding"], limitation: ["Clarify this limitation"], open: ["Ask about collaboration"], discussion: ["Ask about collaboration"], scope: [] };
    check(`@${label} each card offers the action for its kind`, cards.every((c) => JSON.stringify(c.acts) === JSON.stringify(want[c.kind])), JSON.stringify(cards.filter((c) => JSON.stringify(c.acts) !== JSON.stringify(want[c.kind]))));
    check(`@${label} every information card lists sources with type, dates and limitations`, cards.filter((c) => ["finding", "limitation", "open"].includes(c.kind)).every((c) => c.src > 0 && c.lib >= c.src && c.dates >= c.src * 4));
    // focus questions
    await pg.check('input[name="objective"][value="pharmacology"]');
    const m1 = await pg.locator(".wwu-card.is-match").count();
    check(`@${label} answering highlights matching cards`, m1 > 0 && m1 < WWU.cards.length && /match your answers/.test(await pg.textContent("#wwu-count")));
    await pg.check("#wwu-only");
    const visible = await pg.$$eval(".wwu-card", (xs) => xs.filter((x) => !x.hidden && x.closest(".wwu-topic").hidden === false).length);
    check(`@${label} "only matching" filter`, visible === m1 + 1, `${visible} vs ${m1}+scope`);
    await pg.check('input[name="population"][value="other"]');
    check(`@${label} other population: plain note that no programme information exists`, /no public programme information about other populations/.test(await pg.textContent("#wwu-notes")));
    await pg.click("#wwu-clear-answers");
    check(`@${label} clear answers restores all cards`, (await pg.$$eval(".wwu-card", (xs) => xs.filter((x) => !x.hidden).length)) === WWU.cards.length);
    await pg.uncheck('input[name="topic"][value="need"]');
    check(`@${label} topic can be hidden`, await pg.locator("#topic-need").evaluate((n) => n.hidden));
    await pg.check('input[name="topic"][value="need"]');
    // agenda: add via keyboard and pointer, no duplicates
    await pg.locator(cardAction("need-risk")).focus(); await pg.keyboard.press("Enter");
    await pg.click(cardAction("p1-results")); await pg.click(cardAction("d-fit")); await pg.click(cardAction("oq-dose"));
    await pg.click(cardAction("oq-brain"));
    await pg.click(cardAction("need-risk")); // already added: goes to the item instead of duplicating
    if (phone) { check(`@${label} going to an added item opens the drawer`, await pg.locator("#wwu-drawer").evaluate((d) => d.open)); await pg.keyboard.press("Escape"); }
    const host = phone ? "drawer" : "side";
    check(`@${label} five items, no duplicate`, (await pg.textContent("[data-agenda-count]")) === "5");
    check(`@${label} agenda links say "Contact about collaboration" while unconfigured`, (await pg.$$eval('.wwu-agenda__links a[href="#enquiry"]', (as) => as.map((a) => a.textContent))).every((t) => t === "Contact about collaboration"));
    await pg.waitForTimeout(300);
    const oqBrief = await pg.evaluate(() => { const li = [...document.querySelectorAll(".wwu-brief__items > li")].find((l) => l.textContent.includes("How much reaches the brain?")); return li ? { tag: li.querySelector(".wwu-brief__tag").textContent, stage: li.querySelector(".wwu-brief__stage")?.textContent || "" } : null; });
    check(`@${label} brief: open question marked unresolved, related stage separate`, oqBrief && /Open question · Status: unresolved/.test(oqBrief.tag) && !/Completed/.test(oqBrief.tag) && /^Related stage: Stage 2 · Formulation — stage work status: Completed\. The question itself remains unresolved\.$/.test(oqBrief.stage), JSON.stringify(oqBrief));
    await pg.locator(`[data-agenda-target="${phone ? "drawer" : "side"}"] [data-index="4"] [data-tool="remove"]`).evaluate((b) => b.click());
    check(`@${label} added button shows state`, /In your agenda: go to item 1/.test(await pg.textContent(cardAction("need-risk"))));
    check(`@${label} discussion item starts with the suggested wording`, (await pg.inputValue(`#${host}-q-2`)) === WWU.cards.find((c) => c.id === "d-fit").text);
    if (phone) {
      check(`@${label} phone: sidebar hidden, drawer button shown`, !(await pg.isVisible("#agenda")) && (await pg.isVisible("#wwu-drawer-open")));
      await pg.click("#wwu-drawer-open");
      check(`@${label} drawer opens as a modal dialog with focus inside`, await pg.evaluate(() => document.getElementById("wwu-drawer").open && document.getElementById("wwu-drawer").contains(document.activeElement)));
      check(`@${label} reduced motion: drawer not animated`, (await pg.locator("#wwu-drawer").evaluate((d) => getComputedStyle(d).animationName)) === "none");
      const va = await runAxe(pg); check(`@${label} drawer open: axe automated checks (WCAG 2.2 A/AA rules)`, !va.length, va.join("; "));
    } else {
      check(`@${label} desktop: agenda visible beside the content`, (await pg.isVisible("#agenda")) && !(await pg.isVisible("#wwu-drawer-open")));
    }
    await pg.fill(`#${host}-q-0`, SECRET);
    await pg.locator(`[data-agenda-target="${host}"] [data-index="0"] [data-tool="down"]`).click();
    const order = await pg.$$eval(`[data-agenda-target="${host}"] .wwu-item__action`, (xs) => xs.map((x) => x.textContent));
    check(`@${label} move down reorders and keeps focus on the moved item`, /Clarify this limitation/.test(order[0]) && /Discuss this finding/.test(order[1]) && (await pg.evaluate(() => document.activeElement.closest("[data-index]")?.dataset.index)) === "1", JSON.stringify(order));
    await pg.keyboard.press("Shift+Tab"); await pg.keyboard.press("Enter"); // Move up on the same item, by keyboard
    check(`@${label} move up by keyboard`, /Discuss this finding/.test((await pg.$$eval(`[data-agenda-target="${host}"] .wwu-item__action`, (xs) => xs.map((x) => x.textContent)))[0]));
    await pg.locator(`[data-agenda-target="${host}"] [data-index="3"] [data-tool="remove"]`).click();
    check(`@${label} remove deletes the item and keeps focus in the agenda`, (await pg.textContent("[data-agenda-count]")) === "3" && (await pg.evaluate((h) => !!document.activeElement.closest(`[data-agenda-target="${h}"]`), host)));
    check(`@${label} visitor text kept after reorder`, (await pg.inputValue(`#${host}-q-0`)) === SECRET);
    if (phone) { await pg.keyboard.press("Escape"); check(`@${label} Escape closes the drawer and returns focus`, (await pg.evaluate(() => !document.getElementById("wwu-drawer").open && document.activeElement.id === "wwu-drawer-open"))); }
    // brief
    await pg.waitForTimeout(350);
    const brief = await pg.evaluate(() => { const a = document.querySelector(".wwu-brief"); return { title: a.querySelector("h3").textContent, meta: a.querySelector(".wwu-brief__meta").textContent, items: a.querySelectorAll(".wwu-brief__items > li").length, company: a.querySelectorAll(".wwu-brief__company blockquote").length, visitor: [...a.querySelectorAll(".wwu-brief__visitor")].map((v) => v.textContent), refs: [...a.querySelectorAll(".wwu-brief__refs li")].map((l) => l.textContent), notice: a.querySelector(".wwu-brief__notice").textContent, xss: !!a.querySelector(".wwu-brief__visitor img") || !!window.__xss }; });
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    check(`@${label} brief title`, brief.title === "Discussion brief — prepared from selected NWPT public information");
    check(`@${label} brief is dated and versioned`, brief.meta.includes("Prepared on " + today) && brief.meta.includes(WWU.version));
    check(`@${label} brief separates company statements and visitor questions`, brief.items === 3 && brief.company === 2 && brief.visitor.length === 3 && brief.visitor.every((v) => v.startsWith("Visitor question")));
    check(`@${label} brief keeps visitor text as text (no markup injection)`, brief.visitor[0].includes(SECRET) && !brief.xss);
    check(`@${label} brief has numbered references with URLs`, brief.refs.length >= 2 && brief.refs.every((r) => /https:\/\/www\.nwpharmatech\.org\//.test(r)));
    check(`@${label} brief states it is not a protocol, offer or access`, /not a protocol, an offer or an agreement/.test(brief.notice) && /unpublished data/.test(brief.notice));
    // print view shows only the brief
    await pg.emulateMedia({ media: "print" });
    const pr = await pg.evaluate(() => ({ brief: getComputedStyle(document.getElementById("wwu-brief")).display !== "none" && !!document.getElementById("wwu-brief").offsetHeight, info: getComputedStyle(document.getElementById("information")).display, header: getComputedStyle(document.querySelector(".site-header")).display, agenda: getComputedStyle(document.getElementById("agenda")).display }));
    check(`@${label} print shows only the brief`, pr.brief && pr.info === "none" && pr.header === "none" && pr.agenda === "none", JSON.stringify(pr));
    await pg.emulateMedia({ media: "screen" });
    // share link
    await pg.uncheck('input[name="topic"][value="formulation"]');
    await pg.check('input[name="objective"][value="clinical"]');
    await pg.click("#wwu-share"); await pg.waitForTimeout(150);
    const link = await pg.evaluate(() => navigator.clipboard.readText());
    const frag = new URL(link).hash.slice(1), params = [...new URLSearchParams(frag).keys()];
    check(`@${label} share link holds only version, topics and card ids`, JSON.stringify(params) === JSON.stringify(["v", "t", "c"]) && /^v=wwu-1&t=[a-z0-9,-]+&c=[a-z0-9.,-]+$/.test(frag), link);
    check(`@${label} share link excludes answers and visitor text`, !/clinical|objective|7731|Confidential/i.test(frag), frag);
    // with questions and focus answers entered, every email link on the page is still the approved subject-only address
    const mails = await pg.$$eval("a[href^='mailto:']", (as) => as.map((a) => a.getAttribute("href")));
    check(`@${label} handoff: no visitor questions, answers or contact details in any mailto`, mails.length >= 1 && mails.every((h) => !/7731|Confidential|clinical|body=|cc=|bcc=/i.test(h)) && mails.filter((h) => h.includes("Research%20collaboration")).every((h) => h === MAILTO), JSON.stringify(mails));
    await pg.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await pg.click("#wwu-handoff-print");
    check(`@${label} handoff: its print button prints the current brief`, (await pg.evaluate(() => window.__printed)) === 1 && (await pg.locator("#wwu-brief .wwu-brief").count()) + (await pg.locator("#wwu-brief article").count()) > 0);
    check(`@${label} share status names what a link excludes`, /not your questions, focus answers or contact details/.test(await pg.textContent("#wwu-share-status")));
    check(`@${label} visitor text never in the address bar`, !/7731|Confidential/.test(await pg.evaluate(() => location.href)));
    // reload keeps the tab's agenda
    await pg.reload({ waitUntil: "load" });
    check(`@${label} reload keeps agenda and text in this tab`, (await pg.textContent("[data-agenda-count]")) === "3" && (await pg.evaluate(() => sessionStorage.getItem("nwpt-wwu") || "")).includes("7731"));
    check(`@${label} nothing stored beyond this tab`, (await pg.evaluate(() => { try { return localStorage.length; } catch (e) { return 0; } })) === 0);
    // open the shared link elsewhere
    const { ctx: ctx2 } = await context(srv, vp);
    const p2 = await ctx2.newPage(); await p2.goto(link, { waitUntil: "load" });
    const rec = await p2.evaluate(() => ({ n: document.querySelector("[data-agenda-count]").textContent, hash: location.hash, notice: document.querySelector("#information .wwu-callout")?.textContent || "", formulation: document.getElementById("topic-formulation").hidden, answers: [...document.querySelectorAll('#wwu-focus input[type="radio"]:checked')].length, texts: [...document.querySelectorAll('[data-agenda-target="side"] textarea')].map((t) => t.value) }));
    check(`@${label} shared link recreates cards and topics, not answers or text`, rec.n === "3" && rec.formulation === true && rec.answers === 0 && !rec.texts.some((t) => t.includes("7731")) && /Opened a shared link: 3 cards/.test(rec.notice), JSON.stringify(rec));
    check(`@${label} shared link is removed from the address bar after opening`, rec.hash === "");
    await ctx2.close();
    // keyboard focus never hidden under the sticky header or the phone agenda bar
    await pg.evaluate(() => window.scrollTo(0, 0)); const hid = [];
    for (const key of ["Tab", "Shift+Tab"]) for (let i = 0; i < 110; i++) { await pg.keyboard.press(key);
      const m = await pg.evaluate(() => { const a = document.activeElement; if (!a || a === document.body || a.closest(".site-header, .wwu-drawer-bar, dialog") || a.classList.contains("skip-link")) return null;
        const r = a.getBoundingClientRect(), top = document.querySelector(".site-header").getBoundingClientRect().bottom, bar = document.querySelector(".wwu-drawer-bar"), bb = bar && bar.getClientRects().length ? bar.getBoundingClientRect().top : innerHeight;
        return r.height && (r.top < top - 1 || r.bottom > bb + 1) ? `${a.tagName}.${a.className} ${Math.round(r.top)}-${Math.round(r.bottom)} (header ${Math.round(top)}, bar ${Math.round(bb)})` : null; });
      if (m) hid.push(m); }
    check(`@${label} keyboard focus never under the header or agenda bar`, !hid.length, hid.slice(0, 4).join("; "));
    // accessibility, overflow, no-JS
    const v = await runAxe(pg); check(`@${label} axe automated checks (WCAG 2.2 A/AA rules)`, !v.length, v.join("; "));
    check(`@${label} no horizontal scroll`, (await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
    check(`@${label} no page errors`, !errs.filter((e) => !/Content Security Policy/.test(e)).length, errs.join(" | "));
    check(`@${label} no request URL carries visitor text or answers`, !urls.some((u) => /7731|Confidential|investigator\.test/.test(decodeURIComponent(u))));
    await ctx.close();

    const ctxN = await b.newContext({ viewport: vp, javaScriptEnabled: false });
    await ctxN.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
    const pn = await ctxN.newPage(); await pn.goto(srv.base + "/work-with-us", { waitUntil: "load" });
    const nj = await pn.evaluate(() => ({ cards: [...document.querySelectorAll(".wwu-card")].filter((c) => c.getClientRects().length).length, acts: [...document.querySelectorAll(".wwu-act")].filter((c) => c.getClientRects().length).length, jsOnly: [...document.querySelectorAll("[data-js-only]")].filter((c) => c.getClientRects().length).length, contact: document.querySelectorAll('[data-nojs] a[href="contact.html#research"]').length, sources: document.querySelectorAll(".wwu-card__sources").length }));
    check(`@${label} no JS: every card and its sources readable, contact route given, no dead controls`, nj.cards === WWU.cards.length && nj.acts === 0 && nj.jsOnly === 0 && nj.contact === 2 && nj.sources > 15, JSON.stringify(nj));
    check(`@${label} no JS: no horizontal scroll`, (await pn.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
    await ctxN.close();
  }
  srv.stop();
}

// ---------------------------------------------------------------- 3: submission with test settings and mocks
{
  const mock = { mode: "ok", posts: [], keys: new Map(), verify: 0 };
  const server = http.createServer(async (req, res) => {
    let body = ""; for await (const c of req) body += c;
    if (req.url === "/verify") { mock.verify++; const p = new URLSearchParams(body); res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ success: p.get("response") !== "bad" })); }
    const key = req.headers["idempotency-key"]; mock.posts.push({ key, auth: req.headers.authorization, body: JSON.parse(body) });
    if (mock.mode === "drop") { mock.keys.set(key, mock.keys.get(key) || "em_" + mock.keys.size); return req.socket.destroy(); }
    if (mock.mode === "fail") { res.writeHead(500, { "content-type": "application/json" }); return res.end("{}"); }
    if (mock.mode === "slow") await new Promise((r) => setTimeout(r, 1500));
    if (!mock.keys.has(key)) mock.keys.set(key, "em_" + mock.keys.size); // idempotent replay returns the original id
    res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ id: mock.keys.get(key) }));
  }).listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  const M = `http://127.0.0.1:${server.address().port}`;
  const srv = await serve(dir, ["ENQUIRY_TO=research-inbox@example.org", "ENQUIRY_FROM=Website <website@example.org>", "RESEND_API_KEY=test-key", "TURNSTILE_SITE_KEY=test-site-key",
    "TURNSTILE_SECRET_KEY=test-secret", "ENQUIRY_TEST_MODE=1", `ENQUIRY_PROVIDER_URL=${M}/emails`, `TURNSTILE_VERIFY_URL=${M}/verify`]);
  const g = await (await fetch(srv.base + "/api/enquiry")).json();
  check("configured: GET reports configured, site key and test mode", g.configured === true && g.turnstileSiteKey === "test-site-key" && g.testMode === true);
  // direct API checks
  const base = { version: WWU.version, name: "A. Researcher", email: EMAIL, organisation: "Example University", confirm: true, agenda: [{ card: "need-risk", action: "d", text: "Q" }], idempotencyKey: "abcdef0123456789abcdef", turnstileToken: "tok-ok" };
  const post = (o) => fetch(srv.base + "/api/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, ...o }) });
  let r = await post({ website: "bot" }); check("API: honeypot rejected", r.status === 400);
  r = await post({ version: "wwu-0" }); check("API: stale content version answers 409", r.status === 409);
  r = await post({ agenda: [{ card: "made-up", action: "d", text: "" }] }); check("API: unknown card rejected", r.status === 400);
  r = await post({ agenda: [{ card: "need-risk", action: "a", text: "" }] }); check("API: action not offered for that card rejected", r.status === 400);
  r = await post({ confirm: false }); check("API: confirmation required", r.status === 400);
  r = await post({ agenda: [{ card: "need-risk", action: "d", text: "x".repeat(1001) }] }); check("API: over-long question rejected", r.status === 400);
  r = await post({ turnstileToken: "bad" }); check("API: failed security check rejected", r.status === 400 && /security check/.test((await r.json()).error));
  check("API: nothing reached the email service for rejected requests", mock.posts.length === 0);
  mock.mode = "fail"; r = await post({ idempotencyKey: "fail0123456789abcdef" }); const rf = await r.json();
  check("API: provider failure is reported, not accepted", r.status === 502 && rf.ok !== true && !rf.accepted);
  mock.mode = "ok"; mock.posts = [];

  for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1363", { width: 1363, height: 936 }]]) {
    const { ctx, urls } = await context(srv, vp);
    const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.goto(srv.base + "/work-with-us", { waitUntil: "load" });
    await pg.waitForSelector("#wwu-form");
    check(`@${label} configured: heading switches to "Send a non-confidential enquiry"`, (await pg.textContent("[data-enquiry-heading]")) === "Send a non-confidential enquiry" && (await pg.$$eval('.wwu-agenda__links a[href="#enquiry"]', (as) => as.every((a) => a.textContent === "Send enquiry"))));
    check(`@${label} configured: form shown with test-mode notice and security check`, /Test mode/.test(await pg.textContent("#wwu-form")) && /security check: test stub/.test(await pg.textContent("#wwu-turnstile")));
    check(`@${label} review appears before details are requested`, await pg.evaluate(() => { const f = document.getElementById("wwu-form"); return f.querySelector("#wwu-review").compareDocumentPosition(f.querySelector("#wwu-name")) & Node.DOCUMENT_POSITION_FOLLOWING; }) > 0);
    await pg.click(cardAction("p2-aims")); await pg.click(cardAction("need-risk-lim")); await pg.click(cardAction("oq-brain"));
    // validation
    mock.posts = [];
    await pg.click("#wwu-submit");
    check(`@${label} empty submit: error summary focused, nothing sent`, (await pg.evaluate(() => document.activeElement.id)) === "wwu-errors" && /Nothing has been sent/.test(await pg.textContent("#wwu-errors")) && mock.posts.length === 0);
    check(`@${label} errors linked to fields`, (await pg.getAttribute("#wwu-email", "aria-invalid")) === "true");
    await pg.fill("#wwu-name", "A. Researcher"); await pg.fill("#wwu-email", EMAIL); await pg.fill("#wwu-organisation", "Example University");
    await pg.fill("#wwu-message", SECRET); await pg.check("#wwu-confirm");
    const host = label === "390" ? "drawer" : "side";
    if (label === "390") await pg.click("#wwu-drawer-open");
    await pg.fill(`#${host}-q-0`, "Is the planned dose response analysis pre-specified?");
    if (label === "390") await pg.keyboard.press("Escape");
    await pg.waitForTimeout(300);
    check(`@${label} review lists items and visitor questions`, /Is the planned dose response analysis/.test(await pg.textContent("#wwu-review")));
    // provider failure
    mock.mode = "fail";
    await pg.click("#wwu-submit");
    await pg.waitForFunction(() => /Nothing has been confirmed as sent/.test(document.getElementById("wwu-submit-status")?.textContent || ""), null, { timeout: 15000 });
    check(`@${label} provider failure: error shown, never "submitted"`, !/Enquiry submitted/.test(await pg.textContent("#wwu-enquiry")) && !(await pg.isDisabled("#wwu-submit")));
    // dropped connection, then retry with the same payload -> same idempotency key -> one delivery
    mock.mode = "drop"; mock.posts = []; mock.keys = new Map();
    await pg.click("#wwu-submit");
    await pg.waitForFunction(() => /Nothing has been confirmed as sent/.test(document.getElementById("wwu-submit-status")?.textContent || "") && !document.getElementById("wwu-submit").disabled, null, { timeout: 20000 });
    check(`@${label} dropped connection: not reported as sent`, !/Enquiry submitted/.test(await pg.textContent("#wwu-enquiry")));
    // success, with a slow provider and repeated clicks
    mock.mode = "slow";
    await pg.click("#wwu-submit"); await pg.click("#wwu-submit", { force: true }).catch(() => {}); await pg.keyboard.press("Enter").catch(() => {});
    check(`@${label} while submitting: button disabled and busy`, (await pg.isDisabled("#wwu-submit")) && (await pg.getAttribute("#wwu-submit", "aria-busy")) === "true");
    await pg.waitForSelector(".wwu-callout--ok", { timeout: 20000 });
    const keys = mock.posts.map((p) => p.key);
    check(`@${label} retry reuses the idempotency key; one delivery in total`, keys.length === 2 && keys[0] === keys[1] && mock.keys.size === 1, JSON.stringify(keys));
    const ok = await pg.textContent(".wwu-callout--ok");
    check(`@${label} success only after acceptance, with reference and acceptance wording`, /Enquiry submitted/.test(ok) && /Reference WWU-[0-9A-F]{8}/.test(ok) && /accepted your enquiry for delivery/.test(ok) && /not that it has reached an inbox/.test(ok));
    check(`@${label} focus moves to the confirmation`, (await pg.evaluate(() => document.activeElement.textContent)) === "Enquiry submitted");
    const mail = mock.posts[mock.posts.length - 1].body;
    check(`@${label} email: accountable recipient, reply-to visitor, key sent as bearer`, JSON.stringify(mail.to) === '["research-inbox@example.org"]' && mail.reply_to === EMAIL && mock.posts[0].auth === "Bearer test-key");
    const text = mail.text;
    const aims = WWU.cards.find((c) => c.id === "p2-aims");
    check(`@${label} email quotes company text from the site, labelled`, /NWPharmaTech public information \(Finding\): "If it goes ahead: whether NWPT-SM32300 shows a dose response/.test(text) && /Source: Study progress/.test(text));
    check(`@${label} email: open question marked unresolved, related stage on its own line`, /NWPharmaTech public information \(Open question; status: unresolved\): "How much reaches the brain\? No study has measured it\."\n   Related stage: Stage 2 · Formulation — stage work status: Completed/.test(text), text.slice(0, 1500));
    check(`@${label} email labels visitor text separately`, /Visitor question: Is the planned dose response analysis pre-specified\?/.test(text) && /MESSAGE \(written by the visitor\)\n.*7731/.test(text));
    check(`@${label} contact details never stored in the tab`, !(await pg.evaluate(() => JSON.stringify(sessionStorage))).includes(EMAIL));
    check(`@${label} no request URL carries contact details or visitor text`, !urls.some((u) => /7731|Confidential|investigator\.test|Researcher/.test(decodeURIComponent(u))));
    check(`@${label} no page errors`, !errs.length, errs.join(" | "));
    const v = await runAxe(pg); check(`@${label} after submission: axe automated checks (WCAG 2.2 A/AA rules)`, !v.length, v.join("; "));
    await ctx.close();
    mock.mode = "ok";
  }
  srv.stop(); server.close();
}
await b.close();
console.log(`work with us: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
