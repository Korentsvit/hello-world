// NWPT-055 /funding/digital-programme-finance: content locks, isolation, routes, analytics, layout, motion and
// accessibility. Cloudflare Pages runtime (wrangler pages dev) and Chromium.
//   node test-digital-finance.mjs [site-dir] [base-sha]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs";
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process"; import { pathToFileURL } from "node:url";
const dir = path.resolve(process.argv[2] || "../release-032/site");
const BASE = process.argv[3] || "1406893";
const PAGE = "/funding/digital-programme-finance";
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 500)}`); };
const ELIG = "Eligibility criteria remain within the sponsor-approved protocol. Individual participant eligibility is determined by investigators/sites under the protocol and applicable oversight.";
const flat = (h) => h.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&mdash;/g, "—").replace(/\s+/g, " ").replace(/ ([.,;:])/g, "$1");
const html = fs.readFileSync(path.join(dir, "funding/digital-programme-finance.html"), "utf8");
const main = html.match(/<main[\s\S]*?<\/main>/)[0];
const text = flat(main);

// ---- content locks (brief hard locks, Security/Money locks, CHR-P science locks)
const LOCKS = [
  "NWPT-SM32300 is investigational.", "Effectiveness in CHR-P is not established.", "The proposed next study is not recruiting.",
  "Prevention is not the current primary aim of the proposed next study.",
  "Current planning target for catalytic preparation and start-up toward the proposed Phase 2B programme.",
  "Not presented as the full cost of global Phase 2B. A bottoms-up RFQ and use-of-proceeds exercise is being developed.",
  "Instrument, economic rights, jurisdictions and digital-record architecture remain under evaluation. Conventional register-first private placement remains available as the fallback.",
  "no live public offering, no public token sale, no token allocation, no payment rail, no minting and no staking",
  "You cannot invest, pay or connect a wallet here.",
  "Any economic rights, if ultimately offered, would arise only under definitive private documentation, applicable eligibility requirements and applicable law.",
  "There is no tokenholder clinical governance.", "No yield, liquidity or appreciation is promised.",
  "Eligibility criteria remain within the sponsor-approved protocol. Individual participant eligibility is determined by investigators/sites under the protocol and applicable oversight.",
  "The instrument, economics, jurisdictions and structure remain under evaluation; nothing is final.",
  "Digital infrastructure could support five potential capabilities. None of them is operating today. Subject to legal, technical and operating diligence.",
  "Exploratory programme architecture. Not an offer or solicitation.",
  "Exploratory information only. No investment, token or allocation is being offered through this website.",
  "Transparent financing does not mean decentralised clinical governance.",
  "A permissioned digital record at close is being evaluated where it is legally and operationally useful",
];
const missing = LOCKS.filter((l) => !text.includes(l));
check("every hard lock is stated on the page", !missing.length, missing.join(" | "));
check("~US$10m is never called a raise, a fully funded trial or a token sale",
  !/\$10m raise|fully[- ]funded|funds? (the )?(complete|full|whole) phase|token sale of/i.test(text) && /not presented as the full cost/i.test(text));
const headings = [html.match(/<title>(.*?)<\/title>/)[1], html.match(/<meta name="description" content="([^"]*)"/)[1], ...[...main.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g)].map((m) => flat(m[1]))].join(" | ");
check("title, description and headings avoid token-sale / crypto / ICO / presale / coin / yield positioning", !/token sale|crypto|\bICO\b|presale|\bcoins?\b|yield|APY/i.test(headings), headings.match(/token sale|crypto|\bICO\b|presale|\bcoins?\b|yield|APY/gi));
check("SEO title and description as specified",
  html.includes("<title>Digital Programme Finance | NWPharmaTech CHR-P Programme</title>") &&
  html.includes('content="How NWPharmaTech is evaluating regulated private programme finance, milestone accountability and digital transparency for its investigational CHR-P development programme."') &&
  html.includes('<link rel="canonical" href="https://www.nwpharmatech.org/funding/digital-programme-finance" />'));
const controls = [...main.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => flat(m[2]).trim());
const bad = controls.filter((t) => /\b(invest|buy|purchase|mint|stake|staking|wallet|pay|subscribe|allocat)/i.test(t));
check("no control invests, buys, pays, mints, stakes, subscribes or connects a wallet", !bad.length, bad.join(" | "));
check("no form, input, external script or payment/wallet integration", !/<form|<input|<select|<textarea/i.test(main) && ![...html.matchAll(/<script[^>]*src="([^"]+)"/g)].some((m) => /^https?:/.test(m[1])) && !/ethereum|web3|walletconnect|metamask|stripe/i.test(html + fs.readFileSync(path.join(dir, "dpf.js"), "utf8")));
check("no fabricated figures: the only money figure is ~US$10m; no percentages, investor counts, prices or transaction data",
  (text.match(/US\$\s?[\d.,]+\s?m/gi) || []).every((x) => /10\s?m/i.test(x)) && !/%|\binvestors? (joined|committed)|\b\d+ (investors|holders|wallets)|\bprice(?! chart| movements)|0x[0-9a-f]{6,}/i.test(text), (text.match(/%|\bprice(?! chart| movements)|\b\d+ (investors|holders|wallets)/gi) || []).join(","));
check("safety oversight is not attributed to a sponsor DSMB; independent bodies stay independent", !/DSMB/.test(text) && /Independent committees and ethics bodies stay independent/.test(text) && /Investigators, ethics committees and regulators remain independent/.test(text));
check("all six use-of-capital categories are shown without amounts", ["Clinical start-up", "Site activation", "CMC / supply", "Regulatory execution", "Programme operations", "Evidence infrastructure"].every((c) => main.includes(`<h3>${c}</h3>`)) && !/US\$|\$\d/.test(flat(main.match(/<ul class="dpf-uses"[\s\S]*?<\/ul>/)[0])));
check("status panel carries only statements already on this website (no live data claims)", ["Proposed next clinical study", "Not established", "Private conversations", "Under evaluation", "Not enabled", "NWPharmaTech"].every((v) => text.includes(v)) && /As stated on this website · last reviewed 30 September 2026/.test(text));
check("no public data room", /No public data room/.test(text) && !/data-room|dataroom/i.test(main.replace('data-faq="data-room"', "")));
check("one h1", (main.match(/<h1\b/g) || []).length === 1);
check("individual patient eligibility is never attributed to NWPharmaTech", !/patient eligibility/i.test(text) && (text.split(ELIG).length - 1) >= 2, "");
check("sponsor control position: authority, protocol, CMC/manufacturing, safety, regulatory, IP, counterparties, licensing and commercial decisions", ["Sponsor authority", "Protocol, dose and endpoints", "Safety", "CMC and manufacturing", "Regulatory submissions", "Counterparties", "Licensing and commercial decisions"].every((x) => main.includes(`<li>${x}</li>`)));
{
  const rails = [...main.match(/<ul class="dpf-rails__grid">[\s\S]*?<\/ul>/)[0].matchAll(/<h3>([^<]*)<\/h3><p>([^<]*)<\/p>/g)];
  check("digital rails: five potential capabilities, each worded as 'Could …', diligence qualifier stated exactly once",
    rails.length === 5 && rails.every((m) => /^Could /.test(m[2])) && JSON.stringify(rails.map((m) => m[1])) === JSON.stringify(["Provenance", "Accountability", "Coordination", "Transparency", "Administrative programmability"]) && text.split("Subject to legal, technical and operating diligence.").length === 2,
    rails.map((m) => m[1] + ": " + m[2]).join(" | "));
}

// ---- isolation: every other change since the base is additive (menu entry, cross-links, sitemap)
const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: dir, encoding: "utf8" }).trim(); const rel = path.relative(repo, dir);
const numstat = execFileSync("git", ["diff", "--numstat", BASE, "--", rel], { cwd: repo, encoding: "utf8" }).trim().split("\n").filter(Boolean).map((l) => l.split("\t"));
const removed = numstat.filter(([, d, f]) => d !== "0" && d !== "-" && !f.endsWith("/_headers") && !f.endsWith("/privacy.html") && !f.endsWith("/sitemap.xml")).map((x) => x[2]);
{ // privacy notice: corrected to the live forms (NWPT-054) and the NWPT-055 analytics; nothing else in it changes
  const priv = flat(fs.readFileSync(path.join(dir, "privacy.html"), "utf8"));
  const must = ["Two online forms are open on this website", "Research-collaboration enquiries are made by email", "There is no advertising tracking on this website.", "Cloudflare Web Analytics",
    "this website’s own event endpoint, run on Cloudflare", "Each record holds only the interaction name, the page path, the time, any campaign tags (UTM) in the link you arrived by, and which link or section was used.",
    "does not record your name, email address, IP address, browser or device details, investor identity, wallet details or any health information", "A campaign tag that contains an email address is discarded",
    "deleted automatically when that service’s retention period ends; this website does not set a longer period", "If that storage is not configured, nothing is recorded.", "Global Privacy Control or Do Not Track", "Last updated: 1 October 2026."];
  const miss = must.filter((m) => !priv.includes(m));
  check("privacy notice: live forms, both analytics layers, the limited fields, no advertising/investor/wallet/health data, retention by the Cloudflare product (no invented period)", !miss.length && !/Online enquiries are not active|preview deployment can switch|Final mailbox routing|\b\d+ (days|months|weeks)\b/.test(priv), miss.join(" | "));
}
{ // _headers: the only change is the NWPT-055 comment and the two Cloudflare Web Analytics hosts in every CSP
  const was = execFileSync("git", ["show", `${BASE}:${rel}/_headers`], { cwd: repo, encoding: "utf8" });
  const now = fs.readFileSync(path.join(dir, "_headers"), "utf8");
  const back = now.split("\n").filter((l) => !l.startsWith("# NWPT-055:")).join("\n")
    .replaceAll("; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com", "")
    .replaceAll(" https://static.cloudflareinsights.com", "").replaceAll(" https://cloudflareinsights.com", "");
  check("_headers: only Cloudflare Web Analytics hosts added to each CSP (script-src static.cloudflareinsights.com, connect-src cloudflareinsights.com)", back === was && now.split("\n").filter((l) => /Content-Security-Policy:/.test(l)).every((l) => /script-src [^;]*https:\/\/static\.cloudflareinsights\.com/.test(l) && /connect-src [^;]*https:\/\/cloudflareinsights\.com/.test(l)));
}
check("existing site files only gain lines (nothing removed or rewritten)", !removed.length, removed.join(" "));
const NEW = ["dpf.css", "dpf.js", "funding", "functions/api/event.js", "_headers", "privacy.html", "sitemap.xml"].map((f) => `:(exclude)${rel}/${f}`);   // the page's own new files
const added = execFileSync("git", ["diff", "-U0", BASE, "--", rel, ...NEW], { cwd: repo, encoding: "utf8" }).split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
const unexpected = added.filter((l) => !/digital-programme-finance|^\+\s*·\s*$|Cloudflare Web Analytics/.test(l));
check("every added line is the menu entry, a cross-link or the sitemap entry", !unexpected.length, unexpected.slice(0, 5).join(" || "));
{ // sitemap (reconciled with production 15e38f1): adds the new page; privacy lastmod follows the 1 October notice
  const sm = execFileSync("git", ["diff", "-U0", BASE, "--", `${rel}/sitemap.xml`], { cwd: repo, encoding: "utf8" }).split("\n");
  const smAdded = sm.filter((l) => l.startsWith("+") && !l.startsWith("+++")), smRemoved = sm.filter((l) => l.startsWith("-") && !l.startsWith("---"));
  check("sitemap adds digital programme finance and moves only the privacy lastmod (to 2026-10-01)",
    smAdded.length === 2 && smAdded.some((l) => l.includes("/funding/digital-programme-finance")) && smAdded.some((l) => l.includes("privacy.html") && l.includes("2026-10-01")) && smRemoved.length === 1 && /privacy\.html<\/loc><lastmod>2026-09-26/.test(smRemoved[0]),
    smAdded.concat(smRemoved).join(" || "));
}
{ // carried from production 15e38f1, adapted to the approved first-party endpoint
  const priv = fs.readFileSync(path.join(dir, "privacy.html"), "utf8");
  check("privacy notice names no third-party analytics vendor or advertising sink (only Cloudflare, the host)", !/Google Analytics|googletagmanager|gtag\(|Zaraz|Meta Pixel|Segment|Mixpanel|Plausible|PostHog|facebook\.net/i.test(priv));
  check("privacy notice no longer says events are never sent (superseded by the approved /api/event)", !/No sink is attached|not sent to NWPharmaTech and they are not sent to any other party/.test(priv));
  const js = fs.readFileSync(path.join(dir, "dpf.js"), "utf8");
  const targets = [...js.matchAll(/(?:sendBeacon|fetch)\(\s*"([^"]+)"/g)].map((m) => m[1]);
  check("dpf.js sends only to the same-origin /api/event (no third-party host, no XMLHttpRequest)", targets.length >= 2 && targets.every((t) => t === "/api/event") && !/XMLHttpRequest|google-analytics|googletagmanager|zaraz|plausible|segment\.com|mixpanel|posthog|https?:\/\//i.test(js.replace(/\/\*![\s\S]*?\*\//, "")), targets.join(","));
}
const pages = execFileSync("git", ["ls-files", "--", rel], { cwd: repo, encoding: "utf8" }).split("\n").filter((f) => f.endsWith(".html"));
const noEntry = pages.filter((f) => { const s = fs.readFileSync(path.join(repo, f), "utf8"); return s.includes(">Programme financing</a></li>") && !s.includes(">Digital programme finance</a></li>"); });
check("every page with the Funding menu lists Digital programme finance", !noEntry.length, noEntry.join(" "));
for (const [f, re] of [["programme-financing.html", /href="funding\/digital-programme-finance\.html">See the proposed structure visually/], ["funding-use.html", /href="funding\/digital-programme-finance\.html">Digital programme finance<\/a>\.<\/p>/], ["desci.html", /href="funding\/digital-programme-finance\.html">Digital programme finance<\/a>\.<\/p>/]])
  check(`cross-link from ${f}`, re.test(fs.readFileSync(path.join(dir, f), "utf8")));

// ---- /api/event endpoint (the Worker), called directly with a mock Analytics Engine binding
{
  const { onRequestPost, onRequest } = await import(pathToFileURL(path.join(dir, "functions/api/event.js")).href);
  const points = []; const env = { NWPT_EVENTS: { writeDataPoint: (p) => points.push(p) } };
  const req = (body, headers = {}) => new Request("https://preview.example/api/event", { method: "POST", headers: { "content-type": "application/json", origin: "https://preview.example", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
  const ok = { event: "conversation_cta_click", path: PAGE, link: "hero:/contact#financing", utm_source: "linkedin", utm_campaign: "chrp-q4", utm_content: "me@example.org", email: "a@b.org", ip: "1.2.3.4", wallet: "0xabc", name: "Jane" };
  let r = await onRequestPost({ request: req(ok), env });
  check("endpoint stores one data point: event, path, link id and UTM tags only, plus the time", r.status === 204 && points.length === 1 &&
    JSON.stringify(points[0].blobs) === JSON.stringify(["conversation_cta_click", PAGE, "hero:/contact#financing", "linkedin", "", "chrp-q4", "", ""]) &&
    JSON.stringify(points[0].indexes) === '["conversation_cta_click"]' && points[0].doubles.length === 1 && Math.abs(points[0].doubles[0] - Date.now()) < 5000,
    JSON.stringify(points));
  check("endpoint never persists an email address, IP, wallet or name (a UTM tag containing @ is dropped whole)", !JSON.stringify(points).match(/@|example|1\.2\.3\.4|0xabc|Jane/));
  const before = points.length;
  const cases = [
    ["an unknown event", req({ ...ok, event: "invest_click" }), 400], ["another page", req({ ...ok, path: "/contact" }), 400],
    ["a cross-origin post", req(ok, { origin: "https://evil.example" }), 403], ["a form post", req("event=x", { "content-type": "application/x-www-form-urlencoded" }), 415],
    ["an oversized body", req({ ...ok, pad: "x".repeat(3000) }), 413], ["invalid JSON", req("{"), 400],
  ];
  for (const [label, request, want] of cases) { r = await onRequestPost({ request, env }); check(`endpoint refuses ${label} (${want}) and stores nothing`, r.status === want && points.length === before, String(r.status)); }
  r = await onRequestPost({ request: req({ ...ok, link: "hero:mailto:someone" }), env });
  check("endpoint drops a link identifier that is not a plain path/placement", r.status === 204 && points[points.length - 1].blobs[2] === "", JSON.stringify(points[points.length - 1]));
  r = await onRequestPost({ request: req(ok), env: {} });
  check("endpoint without the NWPT_EVENTS binding answers 503 and stores nothing", r.status === 503);
  check("endpoint answers 405 to other methods", (await onRequest()).status === 405);
}

// ---- served
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const stub = (ctx) => ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
try {
  const st = async (p) => (await fetch(srv.base + p, { redirect: "manual" }));
  const r1 = await st(PAGE), r2 = await st(PAGE + ".html"), r3 = await st("/funding"), r4 = await st("/funding/");
  check("route: /funding/digital-programme-finance 200; .html redirects to it; /funding and /funding/ still go to /funding-use",
    r1.status === 200 && [301, 308].includes(r2.status) && /\/funding\/digital-programme-finance$/.test(r2.headers.get("location")) && /\/funding-use$/.test(r3.headers.get("location") || "") && /\/funding-use$/.test(r4.headers.get("location") || ""),
    `${r1.status} ${r2.status} ${r2.headers.get("location")} ${r3.status} ${r3.headers.get("location")} ${r4.status} ${r4.headers.get("location")}`);
  for (const p of ["/programme-financing", "/funding-use", "/desci", "/contact"]) check(`route kept: ${p} 200`, (await st(p)).status === 200);
  const hrefs = [...new Set([...main.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map((m) => m[1]).filter((h) => !/^https?:|^mailto:/.test(h)))];
  const broken = [];
  for (const h of hrefs) { const u = new URL(h, srv.base + PAGE); const r = await fetch(u, { redirect: "follow" }); if (r.status !== 200) broken.push(`${h} ${r.status}`); }
  check(`all ${hrefs.length} internal links on the page resolve`, !broken.length, broken.join(" "));
  const contact = await (await fetch(srv.base + "/contact")).text();
  check("conversation CTAs go to the existing Contact financing route (#financing exists)", /id="financing"/.test(contact) && (main.match(/href="\.\.\/contact\.html#financing"/g) || []).length >= 3);

  // ---- analytics
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await stub(ctx);
    const pg = await ctx.newPage(); const offsite = [], beacons = [];
    pg.on("request", (r) => { if (r.url() === srv.base + "/api/event" && r.method() === "POST") beacons.push(r.postData() || ""); });
    pg.on("request", (r) => { if (!r.url().startsWith(srv.base) && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) offsite.push(r.url()); });
    await pg.goto(srv.base + PAGE + "?utm_source=linkedin&utm_medium=social&utm_campaign=chrp-q4&utm_content=me%40example.org&email=a%40b.org&wallet=0xabc", { waitUntil: "load" });
    await pg.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest("a")) e.preventDefault(); }));
    const ev = () => pg.evaluate(() => (window.nwptAnalytics || []).map((e) => ({ ...e })));
    let e = await ev();
    check("funding_digital_page_view fires once with the UTM cohort and without other query data",
      e.length === 1 && e[0].event === "funding_digital_page_view" && e[0].utm_source === "linkedin" && e[0].utm_campaign === "chrp-q4" && !e[0].utm_content && !JSON.stringify(e).includes("a@b") && !JSON.stringify(e).includes("example") && !JSON.stringify(e).includes("0xabc"), JSON.stringify(e));
    const cta = await pg.getAttribute('.dpf-hero a[data-track="conversation_cta_click"]', "href");
    check("UTM cohort is carried onto the page's internal CTA links (and nothing else from the query)", /utm_source=linkedin/.test(cta) && /#financing$/.test(cta) && !/email|wallet/.test(cta), cta);
    for (const [sel, name] of [['.dpf-hero a[data-track="conversation_cta_click"]', "conversation_cta_click"], ['.dpf-objective a[data-track="funding_use_click"]', "funding_use_click"],
      ['.dpf-explore a[data-track="evidence_click"]', "evidence_click"], ['.dpf-explore a[data-track="desci_click"]', "desci_click"], ['.dpf-explore a[data-track="programme_financing_cta_click"]', "programme_financing_cta_click"]]) {
      await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.locator(sel).click();
      e = await ev(); const last = e[e.length - 1];
      check(`${name} fires on click with placement and target only`, last.event === name && last.cta && last.target && !/utm|\?/.test(last.target), JSON.stringify(last));
    }
    await pg.locator("#architecture").scrollIntoViewIfNeeded(); await pg.waitForTimeout(400);
    await pg.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await pg.locator("#architecture").scrollIntoViewIfNeeded(); await pg.waitForTimeout(400);
    e = await ev();
    check("architecture_section_view fires once", e.filter((x) => x.event === "architecture_section_view").length === 1);
    await pg.locator('details[data-faq="ten-million"] summary').click(); await pg.waitForTimeout(100);
    e = await ev();
    check("faq_expand fires when an answer is opened", e.some((x) => x.event === "faq_expand" && x.faq === "ten-million"));
    const keys = [...new Set(e.flatMap((x) => Object.keys(x)))].sort();
    check("events carry only event, page, time, UTM tags and placement fields (no identity, wallet or health data)", keys.every((k) => ["event", "page", "ts", "cta", "target", "faq", "section", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].includes(k)), keys.join(","));
    const names = [...new Set(e.map((x) => x.event))].sort();
    check("all eight specified events are implemented", JSON.stringify(names) === JSON.stringify(["architecture_section_view", "conversation_cta_click", "desci_click", "evidence_click", "faq_expand", "funding_digital_page_view", "funding_use_click", "programme_financing_cta_click"]), names.join(","));
    await pg.waitForTimeout(400);
    const posts = beacons.map((x) => { try { return JSON.parse(x); } catch { return { bad: x }; } });
    check("every event is sent to the first-party /api/event with only event, path, link identifier and UTM tags (no email, even from a tagged link)",
      posts.length === e.length && posts.every((x) => Object.keys(x).every((k) => ["event", "path", "link", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].includes(k)) && x.path === PAGE) && !beacons.join(" ").includes("@") && posts.some((x) => /^hero:\/contact(\.html)?#financing$/.test(x.link)) && posts.some((x) => x.link === "faq:ten-million"),
      `${posts.length} vs ${e.length}: ${beacons.slice(0, 3).join(" ")}`);
    check("custom analytics never leave the site (only the site-wide Google Fonts stylesheet leaves the origin)", !offsite.length, offsite.join(" "));
    await pg.goto(srv.base + PAGE, { waitUntil: "load" }); e = await ev();
    check("UTM cohort persists for the tab session after navigation without tags", e[0].utm_source === "linkedin", JSON.stringify(e[0]));
    await ctx.close();
  }
  for (const [label, init] of [["Global Privacy Control", () => Object.defineProperty(Navigator.prototype, "globalPrivacyControl", { get: () => true })], ["Do Not Track", () => Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1" })]]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await stub(ctx); await ctx.addInitScript(init);
    const pg = await ctx.newPage(); const sent = [];
    pg.on("request", (r) => { if (r.url() === srv.base + "/api/event") sent.push(r.url()); });
    await pg.goto(srv.base + PAGE, { waitUntil: "load" });
    await pg.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest("a")) e.preventDefault(); }));
    await pg.locator('.dpf-hero a[data-track="conversation_cta_click"]').click(); await pg.waitForTimeout(300);
    const q = await pg.evaluate(() => window.nwptAnalytics.length);
    check(`${label}: nothing is sent to /api/event (events stay in the page only)`, !sent.length && q === 2, `${sent.length} ${q}`);
    await ctx.close();
  }
  {
    const r = await fetch(srv.base + "/api/event", { method: "POST", headers: { "content-type": "application/json", origin: srv.base }, body: JSON.stringify({ event: "funding_digital_page_view", path: PAGE }) });
    const g = await fetch(srv.base + "/api/event");
    check("served /api/event: without its Analytics Engine binding it stores nothing and answers 503; GET is 405", r.status === 503 && g.status === 405, `${r.status} ${g.status}`);
  }

  // ---- layout, CLS, accessibility at desktop, phone, landscape and 200% text
  const SIZES = [["1440x900", 1440, 900, false], ["1366x768", 1366, 768, false], ["1024x768", 1024, 768, false], ["390x844", 390, 844, true], ["360x740", 360, 740, true], ["320x640", 320, 640, true], ["844x390 landscape", 844, 390, true], ["390 at 200% text", 390, 844, true, "200%"]];
  for (const [label, w, h, mob, scale] of SIZES) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); await stub(ctx);
    const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (x) => errs.push(String(x)));
    await pg.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const x of l.getEntries()) if (!x.hadRecentInput) window.__cls += x.value; }).observe({ type: "layout-shift", buffered: true }); });
    await pg.goto(srv.base + PAGE, { waitUntil: "load" });
    if (scale) await pg.evaluate((s) => { document.documentElement.style.fontSize = s; }, scale);
    if (w === 1440 || w === 1366) {
      const cta = await pg.locator(".dpf-hero .dpf-btn--primary").boundingBox();
      check(`@${label} primary CTA visible without scrolling`, cta && cta.y + cta.height <= h, JSON.stringify(cta));
    }
    const H = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += Math.round(h * 0.8)) { await pg.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y); await pg.waitForTimeout(40); }
    await pg.waitForTimeout(900);
    const lay = await pg.evaluate((w) => {
      const out = []; const skip = (el) => el.closest("[aria-hidden=true], .dpf-grid-bg");
      for (const el of document.querySelectorAll("main *")) { if (skip(el)) continue; const r = el.getBoundingClientRect(); if (r.width && (r.right > w + 1 || r.left < -1)) out.push(`${el.tagName}.${String(el.className).slice(0, 24)} ${Math.round(r.left)}-${Math.round(r.right)}`); }
      return { sw: document.documentElement.scrollWidth, out: out.slice(0, 5), cls: window.__cls, hidden: [...document.querySelectorAll("[data-reveal]:not(.is-in)")].length };
    }, w);
    check(`@${label} no horizontal overflow and no clipped content`, lay.sw <= w && !lay.out.length, JSON.stringify(lay));
    check(`@${label} layout shift ${lay.cls.toFixed(4)} < 0.01; every revealed card shown after scrolling`, lay.cls < 0.01 && lay.hidden === 0, JSON.stringify(lay));
    if (["1440x900", "390x844", "390 at 200% text"].includes(label)) {
      await pg.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await pg.evaluate(axe);
      const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes.slice(0, 2).map((n) => n.target).join(", ")}`));
      check(`@${label} axe WCAG 2.2 A/AA`, !v.length, v.join("; "));
    }
    check(`@${label} no page errors`, !errs.length, errs.join(" | "));
    await ctx.close();
  }

  // ---- motion: scroll-linked flow, tabs, reduced motion, no JavaScript
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await stub(ctx); const pg = await ctx.newPage();
    await pg.goto(srv.base + PAGE, { waitUntil: "load" });
    const p0 = await pg.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".dpf-flow")).getPropertyValue("--dpf-p")));
    await pg.evaluate(() => { const f = document.querySelector(".dpf-flow"); window.scrollTo({ top: f.getBoundingClientRect().bottom + scrollY - 200, behavior: "instant" }); }); await pg.waitForTimeout(300);
    const p1 = await pg.evaluate(() => ({ p: parseFloat(getComputedStyle(document.querySelector(".dpf-flow")).getPropertyValue("--dpf-p")), on: document.querySelectorAll(".dpf-flow__step.is-on").length }));
    check("capital-flow track is scroll-linked (empty at the top, full after the flow)", p0 === 0 && p1.p === 1 && p1.on === 7, `${p0} ${JSON.stringify(p1)}`);
    const running = await pg.evaluate(() => { window.scrollTo({ top: 0, behavior: "instant" }); return document.getAnimations().filter((a) => a.playState === "running").length; });
    check("hero network animates when motion is allowed", running > 5, String(running));
    const t = pg.locator('.dpf-tabs [role="tab"]').first(); await t.focus(); await pg.keyboard.press("ArrowRight");
    const tabs = await pg.evaluate(() => ({ sel: document.activeElement.id, vis: [...document.querySelectorAll(".dpf-layer")].filter((x) => !x.hidden).map((x) => x.id), ring: document.querySelector(".dpf-rings").dataset.active }));
    check("architecture tabs: arrow keys move selection, one panel shown, rings follow", tabs.sel === "tab-transparency" && JSON.stringify(tabs.vis) === '["layer-transparency"]' && tabs.ring === "transparency", JSON.stringify(tabs));
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" }); await stub(ctx); const pg = await ctx.newPage();
    await pg.goto(srv.base + PAGE, { waitUntil: "load" }); await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => ({ running: document.getAnimations().filter((a) => a.playState === "running").length, reveal: document.querySelectorAll("[data-reveal]").length, p: getComputedStyle(document.querySelector(".dpf-flow")).getPropertyValue("--dpf-p").trim(), on: document.querySelectorAll(".dpf-flow__step.is-on").length, tf: document.querySelector(".dpf-hero__visual").style.transform }));
    check("reduced motion: no animations, no reveal, no parallax, flow drawn in full", r.running === 0 && r.reveal === 0 && parseFloat(r.p) === 1 && r.on === 7 && !r.tf, JSON.stringify(r));
    await pg.evaluate(axe);
    const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => x.id));
    check("reduced motion: axe WCAG 2.2 A/AA", !v.length, v.join(" "));
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }); await stub(ctx); const pg = await ctx.newPage();
    await pg.goto(srv.base + PAGE, { waitUntil: "load" });
    const r = await pg.evaluate(() => ({ layers: [...document.querySelectorAll(".dpf-layer")].filter((x) => !x.hidden && x.offsetHeight).length, tabs: document.querySelector(".dpf-tabs").hidden, hidden: [...document.querySelectorAll(".dpf main *, main.dpf *")].filter((x) => getComputedStyle(x).opacity === "0").length, p: getComputedStyle(document.querySelector(".dpf-flow")).getPropertyValue("--dpf-p").trim() }));
    check("without JavaScript: all three layers shown, tabs hidden, nothing invisible, flow drawn in full", r.layers === 3 && r.tabs && r.hidden === 0 && r.p === "1", JSON.stringify(r));
    await ctx.close();
  }
} finally { await b.close(); srv.stop(); }
console.log(`digital-finance: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
