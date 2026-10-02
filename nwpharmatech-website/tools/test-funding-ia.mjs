// NWPT-057 funding information architecture: three-item Funding menu, funding sub-navigation, /desci retired.
// Cloudflare Pages runtime (wrangler pages dev) and Chromium:  node test-funding-ia.mjs [site-dir]
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path";
const dir = path.resolve(process.argv[2] || "../release-032/site");
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 400)}`); };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === "functions" ? [] : walk(path.join(d, e.name))) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
const pages = walk(dir);
const MENU = [["programme-financing.html", "Funding overview"], ["funding-use.html", "Use of funds"], ["funding/digital-programme-finance.html", "Digital finance &amp; DeSci"]];
const FUNDING = { "/programme-financing": "programme-financing.html", "/funding-use": "funding-use.html", "/funding/digital-programme-finance": "funding/digital-programme-finance.html" };
const flat = (h) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

// ---- static
const bad = [];
let withMenu = 0;
for (const f of pages) {
  const s = fs.readFileSync(f, "utf8"); const m = s.match(/<ul class="nav-dropdown" id="nav-dd-funding">([\s\S]*?)<\/ul>/);
  if (!m) continue; withMenu++;
  const items = [...m[1].matchAll(/<li><a href="([^"]+)"( aria-current="page")?>([^<]+)<\/a><\/li>/g)];
  const rel = path.relative(dir, f).split(path.sep).join("/");
  const ok = items.length === 3 && items.every((it, i) => it[3] === MENU[i][1] && path.posix.normalize(path.posix.join(path.posix.dirname(rel), it[1].replace(/^\//, "/"))).replace(/^\.?\//, "").endsWith(MENU[i][0]) && (!!it[2]) === (rel === MENU[i][0]));
  if (!ok) bad.push(rel);
}
check(`Funding menu on all ${withMenu} pages is exactly Funding overview · Use of funds · Digital finance & DeSci (links resolve; current page marked)`, withMenu >= 40 && !bad.length, bad.join(" "));
check("no page shows the old labels Programme financing / Digital programme finance / How funding could work / Questions in the Funding menu",
  !pages.some((f) => { const m = fs.readFileSync(f, "utf8").match(/id="nav-dd-funding">([\s\S]*?)<\/ul>/); return m && />(Programme financing|Digital programme finance|How funding could work|Questions)<\/a>/.test(m[1]); }));
for (const [route, file] of Object.entries(FUNDING)) {
  const s = fs.readFileSync(path.join(dir, file), "utf8"); const n = s.match(/<nav class="funding-subnav[^"]*" aria-label="Funding sections">([\s\S]*?)<\/nav>/);
  const links = n ? [...n[1].matchAll(/<a href="([^"]+)"( aria-current="page")?>([^<]+)<\/a>/g)] : [];
  check(`${route}: sub-navigation Overview | Use of funds | Digital finance & DeSci, current page marked, at the top of main`,
    n && s.indexOf(n[0]) - s.indexOf('<main id="main"') < 120 && links.map((l) => l[3]).join("|") === "Overview|Use of funds|Digital finance &amp; DeSci" && links.filter((l) => l[2]).length === 1 && links.find((l) => l[2])[1].endsWith(file.split("/").pop()),
    links.map((l) => l[0]).join(" "));
}
check("desci.html is removed and no page links to it", !fs.existsSync(path.join(dir, "desci.html")) && !pages.some((f) => /href="[^"]*desci\.html"/.test(fs.readFileSync(f, "utf8"))));
const sitemap = fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8");
check("sitemap lists the three funding pages and no /desci", ["/programme-financing", "/funding-use", "/funding/digital-programme-finance"].every((p) => sitemap.includes(`nwpharmatech.org${p}`)) && !/nwpharmatech\.org\/desci/.test(sitemap));
const dpf = flat(fs.readFileSync(path.join(dir, "funding/digital-programme-finance.html"), "utf8"));
for (const t of ["Early-intervention CHR-P research often needs careful, long studies that conventional venture timelines struggle to match.",
  "including crypto-native family offices and mission-aligned DeSci supporters", "separate from NWPharmaTech parent equity",
  "The legal investor register is the record of truth: any permissioned digital representation, if used, would only mirror it.",
  "Investors would not own the medicine or patient data.", "Most visitors are not investors, and should not need to be.",
  "Community follow or membership is not an investment entitlement, and community updates and discussion are separate from any regulated investment process."])
  check(`migrated from /desci: “${t.slice(0, 70)}…”`, dpf.includes(t));
{ // every link labelled "Funding overview" (homepage hero quick link, route card) goes to /programme-financing
  const home = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const hrefs = [...home.matchAll(/<a [^>]*href="([^"]+)"[^>]*>(?:(?!<\/a>)[\s\S])*?Funding overview(?:(?!<\/a>)[\s\S])*?<\/a>/g)].map((m) => m[1]);
  check("homepage: every “Funding overview” link goes to /programme-financing", hrefs.length >= 3 && hrefs.every((h) => /(^|\/)programme-financing\.html$/.test(h)), hrefs.join(" "));
}
const pf = fs.readFileSync(path.join(dir, "programme-financing.html"), "utf8");
check("general-investor landing stays /programme-financing (first menu item; its own hero unchanged)", /id="nav-dd-funding">\s*<li><a href="programme-financing\.html" aria-current="page">Funding overview/.test(pf) && /Programme financing for an investigational CHR-P programme/.test(pf));

// ---- served
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const stub = (ctx) => ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
try {
  for (const p of ["/desci", "/desci/", "/desci.html"]) {
    const r = await fetch(srv.base + p + "?utm_source=x&utm_campaign=y", { redirect: "manual" });
    check(`${p} → 301 /funding/digital-programme-finance, UTM tags preserved`, r.status === 301 && r.headers.get("location") === "/funding/digital-programme-finance?utm_source=x&utm_campaign=y", `${r.status} ${r.headers.get("location")}`);
  }
  const fin = await fetch(srv.base + "/desci", { redirect: "follow" });
  check("old /desci link ends on the Digital finance & DeSci page (200)", fin.status === 200 && new URL(fin.url).pathname === "/funding/digital-programme-finance");
  for (const [route, file] of Object.entries(FUNDING)) {
    const r = await fetch(srv.base + route); check(`${route} 200`, r.status === 200);
    const html = fs.readFileSync(path.join(dir, file), "utf8"); const broken = [];
    for (const h of new Set([...html.matchAll(/href="([^"#]+)/g)].map((m) => m[1]).filter((h) => !/^(https?:|mailto:)/.test(h)))) {
      const x = await fetch(new URL(h, srv.base + "/" + file), { redirect: "follow" }); if (x.status !== 200) broken.push(`${h} ${x.status}`);
    }
    check(`${route}: every internal link resolves`, !broken.length, broken.join(" "));
  }
  // desktop navigation
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await stub(ctx); const pg = await ctx.newPage();
    await pg.goto(srv.base + "/programme-financing", { waitUntil: "load" });
    await pg.click('button[aria-controls="nav-dd-funding"]');
    const items = await pg.$$eval("#nav-dd-funding a", (as) => as.filter((a) => a.offsetParent).map((a) => [a.textContent, a.getAttribute("aria-current")]));
    check("desktop: Funding dropdown shows the three items with Funding overview current", JSON.stringify(items) === JSON.stringify([["Funding overview", "page"], ["Use of funds", null], ["Digital finance & DeSci", null]]), JSON.stringify(items));
    await Promise.all([pg.waitForURL(/\/funding\/digital-programme-finance/, { timeout: 10000 }).catch(() => {}), pg.click('#nav-dd-funding a:has-text("Digital finance & DeSci")')]);
    check("desktop: choosing Digital finance & DeSci opens the page", new URL(pg.url()).pathname.startsWith("/funding/digital-programme-finance"), pg.url());
    await Promise.all([pg.waitForURL(/\/funding-use/, { timeout: 10000 }).catch(() => {}), pg.click('.funding-subnav a:has-text("Use of funds")')]);
    check("sub-navigation moves between funding pages", new URL(pg.url()).pathname.startsWith("/funding-use"), pg.url());
    await ctx.close();
  }
  // mobile navigation
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await stub(ctx); const pg = await ctx.newPage();
    await pg.goto(srv.base + "/funding/digital-programme-finance", { waitUntil: "load" });
    await pg.tap("#nav-toggle"); await pg.tap('button[aria-controls="nav-dd-funding"]'); await pg.waitForTimeout(250);
    const items = await pg.$$eval("#nav-dd-funding a", (as) => as.map((a) => { const r = a.getBoundingClientRect(); return [a.textContent, a.getAttribute("aria-current"), r.height > 0 && r.right <= innerWidth + 1]; }));
    check("mobile: Funding group lists the three items, on screen, Digital finance & DeSci current", JSON.stringify(items) === JSON.stringify([["Funding overview", null, true], ["Use of funds", null, true], ["Digital finance & DeSci", "page", true]]), JSON.stringify(items));
    await Promise.all([pg.waitForURL(/\/programme-financing/, { timeout: 10000 }).catch(() => {}), pg.tap('#nav-dd-funding a:has-text("Funding overview")')]);
    check("mobile: Funding overview opens /programme-financing", new URL(pg.url()).pathname.startsWith("/programme-financing"), pg.url());
    await ctx.close();
  }
  // layout and accessibility on the three pages
  for (const [w, h, mob, scale] of [[1440, 900, false], [390, 844, true], [320, 640, true], [390, 844, true, "200%"]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }); await stub(ctx); const pg = await ctx.newPage();
    for (const route of Object.keys(FUNDING)) {
      await pg.goto(srv.base + route, { waitUntil: "load" }); if (scale) await pg.evaluate((s) => { document.documentElement.style.fontSize = s; }, scale);
      await pg.waitForTimeout(1000);   // let the DPF page's tab and reveal transitions settle before measuring contrast
      const m = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, sub: [...document.querySelectorAll(".funding-subnav a")].map((a) => { const r = a.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.height >= 24; }) }));
      check(`${route} @${w}${scale ? " " + scale : ""}: no horizontal overflow; sub-navigation fully on screen`, m.sw <= m.iw && m.sub.length === 3 && m.sub.every(Boolean), JSON.stringify(m));
      if (w === 1440 || scale) {
        await pg.evaluate(axe);
        const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
        check(`${route} @${w}${scale ? " " + scale : ""}: axe WCAG 2.2 A/AA`, !v.length, v.join("; "));
      }
    }
    await ctx.close();
  }
} finally { await b.close(); srv.stop(); }
console.log(`funding-ia: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
