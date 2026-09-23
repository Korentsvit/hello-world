// Browser QA for the built site. Usage (from tools/):
//   npm install && node qa.mjs
// Serves ../public on a local port, then checks every page at desktop and mobile widths.
// Writes ../docs/qa/report.json and screenshots to ../docs/qa/screenshots/.
import { chromium } from "playwright-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../public");
const outDir = path.resolve(here, "../docs/qa");
const shots = path.join(outDir, "screenshots");
fs.mkdirSync(shots, { recursive: true });

const PAGES = fs.readdirSync(root).filter((f) => f.endsWith(".html") && f !== "404.html").map((f) => f.replace(/\.html$/, "")).sort();
const VIEWPORTS = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".jpg": "image/jpeg", ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/html" });
    return res.end(fs.readFileSync(path.join(root, "404.html")));
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const report = { base, generated: new Date().toISOString(), pages: {}, checks: [] };
const check = (name, pass, detail = "") => report.checks.push({ name, pass: !!pass, detail });

// ---- Per page, per viewport ----
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  for (const name of PAGES) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
    const resp = await page.goto(base + name + ".html", { waitUntil: "load" });
    const r = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      title: document.title,
      h1: document.querySelectorAll("h1").length,
      robots: document.querySelector('meta[name="robots"]')?.content,
      imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
      tables: [...document.querySelectorAll("table")].map((t) => ({ caption: !!t.querySelector("caption"), rowHeaders: t.querySelectorAll("th[scope]").length, overflow: t.scrollWidth > t.parentElement.clientWidth + 1 })),
    }));
    await page.addScriptTag({ content: axeSource });
    const axe = await page.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
      return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
    });
    await page.screenshot({ path: path.join(shots, `${name}-${vpName}.png`), fullPage: true });
    report.pages[`${name}@${vpName}`] = { status: resp.status(), errors, axe, ...r };
    check(`${name}@${vpName}: HTTP 200`, resp.status() === 200);
    check(`${name}@${vpName}: no console/request errors`, errors.length === 0, errors.join("; "));
    check(`${name}@${vpName}: no horizontal scroll`, !r.overflow);
    check(`${name}@${vpName}: exactly one h1`, r.h1 === 1, `h1=${r.h1}`);
    check(`${name}@${vpName}: axe (WCAG 2.2 AA + best practice) no violations`, axe.length === 0, axe.map((v) => `${v.id}(${v.impact}) x${v.nodes}`).join(", "));
    for (const [i, t] of r.tables.entries()) {
      check(`${name}@${vpName}: table ${i + 1} has caption and scoped headers`, t.caption && t.rowHeaders > 0);
      check(`${name}@${vpName}: table ${i + 1} fits its container`, !t.overflow);
    }
    await ctx.close();
  }
}

// ---- Intermediate widths: no horizontal scroll, header fits ----
{
  const bad = [];
  for (const w of [320, 360, 768, 1024, 1100, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    const page = await ctx.newPage();
    for (const name of PAGES) {
      await page.goto(base + name + ".html");
      const o = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.querySelector(".header-inner").scrollWidth > document.querySelector(".header-inner").clientWidth + 1);
      if (o) bad.push(`${name}@${w}`);
    }
    await ctx.close();
  }
  check("widths 320-1440px: no horizontal scroll or header overflow on any page", bad.length === 0, bad.join(", "));
}

// ---- Links and anchors (every internal href on every page) ----
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const bad = [];
  let count = 0;
  for (const name of PAGES) {
    await page.goto(base + name + ".html");
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
    for (const h of hrefs) {
      if (/^(mailto:|tel:|sms:|https?:)/.test(h)) continue;
      count++;
      const u = new URL(h, base + name + ".html");
      const res = await fetch(u.href.split("#")[0]);
      if (res.status !== 200) { bad.push(`${name}: ${h} -> ${res.status}`); continue; }
      if (u.hash) {
        const html = await res.text();
        if (!html.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`)) bad.push(`${name}: ${h} -> missing anchor`);
      }
    }
  }
  check(`internal links and anchors resolve (${count} checked)`, bad.length === 0, bad.join("; "));
  await ctx.close();
}

// ---- Mobile accordion menu ----
{
  const ctx = await browser.newContext({ viewport: VIEWPORTS.mobile });
  const page = await ctx.newPage();
  await page.goto(base + "science.html");
  const toggle = page.locator(".nav-toggle");
  check("menu: toggle visible on mobile", await toggle.isVisible());
  check("menu: starts collapsed (aria-expanded=false, panel hidden)", (await toggle.getAttribute("aria-expanded")) === "false" && !(await page.locator("#mobile-nav").isVisible()));
  await toggle.click();
  check("menu: opens (aria-expanded=true, panel visible)", (await toggle.getAttribute("aria-expanded")) === "true" && (await page.locator("#mobile-nav").isVisible()));
  const groups = await page.$$eval("#mobile-nav details", (ds) => ds.map((d) => ({ t: d.querySelector("summary").textContent, open: d.open })));
  check("menu: current page's group open, others closed", groups.filter((g) => g.open).map((g) => g.t).join() === "The research", JSON.stringify(groups));
  check("menu: focus moves into panel on open", await page.evaluate(() => document.getElementById("mobile-nav").contains(document.activeElement)));
  await page.locator("#mobile-nav summary", { hasText: "About" }).click();
  check("menu: tapping a closed group expands it", await page.$eval("#mobile-nav details:nth-of-type(3)", (d) => d.open));
  check("menu: current page marked aria-current", (await page.locator('#mobile-nav a[aria-current="page"]').textContent()) === "Science and formulation");
  await page.keyboard.press("Escape");
  check("menu: Escape closes and returns focus to toggle", (await toggle.getAttribute("aria-expanded")) === "false" && (await page.evaluate(() => document.activeElement.classList.contains("nav-toggle"))));
  const tap = await page.$$eval("#mobile-nav a, #mobile-nav summary, .nav-toggle", (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, t: e.textContent.trim() }; }));
  await toggle.click();
  const tap2 = await page.$$eval("#mobile-nav a, #mobile-nav summary", (els) => els.filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().height)));
  check("menu: visible touch targets at least 44px tall", tap2.every((h) => h >= 44), tap2.join(","));
  await page.screenshot({ path: path.join(shots, "menu-open-mobile.png") });
  await page.locator("#mobile-nav a", { hasText: "Programme updates" }).isVisible().then(async (v) => { if (!v) await page.locator("#mobile-nav summary", { hasText: "The programme" }).click(); });
  await page.locator("#mobile-nav a", { hasText: "Programme updates" }).click();
  check("menu: link navigates", page.url().endsWith("updates.html"));
  await ctx.close();
}

// ---- Desktop: menu toggle hidden, primary nav visible ----
{
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await ctx.newPage();
  await page.goto(base + "index.html");
  check("desktop: primary nav visible, toggle hidden", (await page.locator(".site-nav").isVisible()) && !(await page.locator(".nav-toggle").isVisible()));
  // Keyboard: skip link first, then focus lands on main
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => ({ cls: document.activeElement.className, visible: document.activeElement.getBoundingClientRect().top >= 0 }));
  check("keyboard: first Tab reaches visible skip link", first.cls === "skip-link" && first.visible);
  await page.keyboard.press("Enter");
  check("keyboard: skip link moves focus to main", await page.evaluate(() => document.activeElement.id === "main" || location.hash === "#main"));
  // Walk the whole tab order and check every stop shows a focus indicator
  await page.goto(base + "index.html");
  const stops = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, text: (el.textContent || "").trim().slice(0, 30), outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2, inView: r.width > 0 && r.height > 0 };
    });
    if (!s) break;
    stops.push(s);
  }
  const noFocus = stops.filter((s) => !s.outline || !s.inView);
  check(`keyboard: all ${stops.length} tab stops on home show a visible focus outline`, noFocus.length === 0, JSON.stringify(noFocus.slice(0, 5)));
  await page.keyboard.press("Tab");
  await ctx.close();
}

// ---- FAQ accordion states and deep link ----
{
  const ctx = await browser.newContext({ viewport: VIEWPORTS.mobile });
  const page = await ctx.newPage();
  await page.goto(base + "faq.html");
  const closed = await page.$$eval(".faq details", (ds) => ds.every((d) => !d.open));
  check("faq: all answers start collapsed", closed);
  await page.locator(".faq summary").first().focus();
  await page.keyboard.press("Enter");
  check("faq: Enter on a question opens it", await page.$eval(".faq details", (d) => d.open));
  await page.keyboard.press("Enter");
  check("faq: Enter again closes it", await page.$eval(".faq details", (d) => !d.open));
  await page.goto(base + "faq.html#not-medical-advice");
  check("faq: deep link (#not-medical-advice) opens the target answer", await page.$eval("#not-medical-advice", (d) => d.open));
  await page.goto(base + "index.html");
  await page.locator('.notice-bar a[href="faq.html#not-medical-advice"]').click();
  await page.waitForURL(/not-medical-advice/);
  check("faq: notice-bar link opens the answer", await page.$eval("#not-medical-advice", (d) => d.open));
  await ctx.close();
}

// ---- Increment B: evidence library, study hub, Phase 1, explainer ----
if (PAGES.includes("evidence")) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS.mobile });
  const page = await ctx.newPage();
  await page.goto(base + "evidence.html");
  const total = await page.locator(".study-card").count();
  check("evidence: filters visible with JS", await page.locator(".filters").isVisible());
  await page.locator('.chip[data-filter="cbd"]').click();
  const vis = await page.$$eval(".lib-section", (ss) => ss.filter((s) => !s.hidden).map((s) => s.dataset.section));
  check("evidence: filter shows only chosen topic", vis.join() === "cbd", vis.join());
  check("evidence: pressed state and live status update", (await page.getAttribute('.chip[data-filter="cbd"]', "aria-pressed")) === "true" && /Showing \d+ sources in CBD research/.test(await page.textContent(".filter-status")));
  await page.locator('.chip[data-filter="all"]').click();
  check("evidence: 'All' restores every section", (await page.$$eval(".lib-section", (ss) => ss.every((s) => !s.hidden))));
  const cards = await page.$$eval(".study-card", (cs) => cs.map((c) => ({ id: c.id, dts: [...c.querySelectorAll("dt")].map((d) => d.textContent), src: !!c.querySelector(".source-line") })));
  check(`evidence: all ${total} cards have population, product, design, finding, limitations and source`, cards.every((c) => ["Population", "Product", "Design", "Finding", "Limitations"].every((k) => c.dts.includes(k)) && c.src));
  check("evidence: negative finding flagged (Boggs 2018)", (await page.textContent("#ref-boggs-2018")).includes("Negative finding"));
  check("evidence: programme record labelled 'Programme information', not an evidence grade", (await page.textContent("#ref-nct07186283")).includes("Programme information") && !(await page.textContent("#ref-nct07186283")).includes("Established"));
  await ctx.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const p2 = await nojs.newPage();
  await p2.goto(base + "evidence.html");
  check("evidence (no JS): filter bar hidden and all sections shown", !(await p2.locator(".filters").isVisible()) && (await p2.locator(".lib-section:visible").count()) === (await p2.locator(".lib-section").count()));
  await nojs.close();
  for (const [f, head] of [["nwpharmatech-references.ris", "TY  - "], ["nwpharmatech-references.bib", "@"]]) {
    const res = await fetch(base + "downloads/" + f);
    const t = await res.text();
    const n = (t.match(f.endsWith(".ris") ? /^TY  - /gm : /^@/gm) || []).length;
    check(`download: ${f} valid with ${n} records (= ${total} cards)`, res.status === 200 && t.startsWith(head) && n === total);
  }
}
if (PAGES.includes("phase-1")) {
  const html = fs.readFileSync(path.join(root, "phase-1.html"), "utf8");
  check("phase 1: both registry entries linked", html.includes("https://clinicaltrials.gov/study/NCT07186283") && html.includes("https://www.isrctn.com/ISRCTN25163383"));
  check("phase 1: no numerical results or bioequivalence/superiority wording", !/Cmax|AUC|91\.2|92\.4|bioequivalen[a-z]* (was|is) (shown|demonstrated)|superior tolerab/i.test(html.replace(/cannot establish[\s\S]*?<\/ul>/, "")));
}
if (PAGES.includes("science")) {
  const html = fs.readFileSync(path.join(root, "science.html"), "utf8");
  check("science: diagram has accessible title and description", /<svg[^>]*role="img"[^>]*aria-labelledby="dg-title dg-desc"/.test(html) && html.includes('<desc id="dg-desc">'));
  check("science: no animation in public build", !/@keyframes|<animate|animation:/.test(html + fs.readFileSync(path.join(root, "assets/css/site.css"), "utf8")));
}
check("public build: no 'image pending' or placeholder panels", PAGES.every((p) => !/image pending|render pending|portrait pending|placeholder/i.test(fs.readFileSync(path.join(root, p + ".html"), "utf8"))));
check("public build: evidence graphics preview not published", !fs.existsSync(path.join(root, "graphics-preview")) && !PAGES.some((p) => fs.readFileSync(path.join(root, p + ".html"), "utf8").includes("graphics-preview")));
check("public build: unpublished fact values absent (Phase 2B regions, funding figures)", PAGES.every((p) => { const h = fs.readFileSync(path.join(root, p + ".html"), "utf8"); return !/US\$35|US\$5 million|\$35M|UK and Europe/.test(h); }));

// ---- Downloads ----
{
  const res = await fetch(base + "downloads/nwpharmatech-programme-brief.pdf");
  const buf = Buffer.from(await res.arrayBuffer());
  check("download: programme brief PDF served (200, application/pdf, valid header, >10 KB)", res.status === 200 && res.headers.get("content-type") === "application/pdf" && buf.subarray(0, 5).toString() === "%PDF-" && buf.length > 10000, `${res.status} ${res.headers.get("content-type")} ${buf.length} bytes`);
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(base + "index.html");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator(".brief-actions a[download]").click()]);
  check("download: homepage 'Download the brief' triggers a file download", dl.suggestedFilename() === "nwpharmatech-programme-brief.pdf", dl.suggestedFilename());
  await ctx.close();
}

// ---- Contact routes ----
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const routes = {};
  for (const name of PAGES) {
    await page.goto(base + name + ".html");
    for (const h of await page.$$eval('a[href^="tel:"], a[href^="mailto:"], a[href^="sms:"]', (as) => as.map((a) => a.getAttribute("href")))) routes[h] = (routes[h] || 0) + 1;
  }
  const badTel = Object.keys(routes).filter((h) => h.startsWith("tel:") && !/^tel:\+?\d{3,15}$/.test(h));
  const mailtos = Object.keys(routes).filter((h) => h.startsWith("mailto:"));
  check("contact: all tel: links are well-formed digit strings", badTel.length === 0, badTel.join(","));
  check("contact: head office tel link present (+442036933791)", "tel:+442036933791" in routes);
  check("contact: no email address published until a monitored mailbox is confirmed", mailtos.length === 0, mailtos.join(","));
  await page.goto(base + "contact.html");
  check("contact: postal address rendered", (await page.locator("address").textContent()).includes("SW3 1PW"));
  report.contactRoutes = routes;
  await ctx.close();
}

// ---- No JavaScript ----
{
  const ctx = await browser.newContext({ viewport: VIEWPORTS.mobile, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + "programme.html");
  check("no-JS (mobile): menu shown expanded", await page.locator("#mobile-nav").isVisible());
  await page.locator("#mobile-nav summary", { hasText: "About" }).click();
  check("no-JS (mobile): accordion groups open natively and links are reachable", await page.locator("#mobile-nav a", { hasText: "Contact" }).isVisible());
  await page.screenshot({ path: path.join(shots, "programme-mobile-nojs.png") });
  await ctx.close();
}

// ---- Staging safeguards ----
{
  const idx = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
  check("staging: every page noindex", PAGES.every((p) => fs.readFileSync(path.join(root, p + ".html"), "utf8").includes('content="noindex, nofollow"')));
  check("staging: robots.txt disallows all", robots.includes("Disallow: /"));
  check("staging: banner shown", idx.includes("Staging draft"));
  check("restricted material absent from public build", !fs.existsSync(path.join(root, "financing-structure.html")) && !fs.existsSync(path.join(root, "interest-registration.html")));
  check("public build contains no <form> elements", PAGES.every((p) => !fs.readFileSync(path.join(root, p + ".html"), "utf8").includes("<form")));
}

await browser.close();
server.close();

// ---- Restricted middleware (fail-closed behaviour) ----
{
  const mw = await import(path.resolve(here, "../restricted/functions/_middleware.js"));
  const next = async () => new Response("ok", { status: 200 });
  const run = (env, init = {}) => mw.onRequest({ request: new Request("https://staging.example/", init), env, next });
  check("restricted: unconfigured environment returns 503", (await run({})).status === 503);
  check("restricted: missing Access token returns 403", (await run({ ACCESS_TEAM_DOMAIN: "t.cloudflareaccess.com", ACCESS_AUD: "aud" })).status === 403);
  const forged = "eyJhbGciOiJSUzI1NiIsImtpZCI6IngifQ.eyJhdWQiOiJhdWQifQ.c2ln";
  const f = await run({ ACCESS_TEAM_DOMAIN: "t.invalid", ACCESS_AUD: "aud" }, { headers: { "cf-access-jwt-assertion": forged } });
  check("restricted: unverifiable token is refused (403/503)", f.status === 403 || f.status === 503, String(f.status));
}

const failed = report.checks.filter((c) => !c.pass);
report.summary = { total: report.checks.length, passed: report.checks.length - failed.length, failed: failed.length };
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(`QA: ${report.summary.passed}/${report.summary.total} checks passed`);
for (const c of failed) console.log(`FAIL  ${c.name}${c.detail ? "  --  " + c.detail : ""}`);
