// Funding, Programme governance and Updates with the DAO visual tranche, under Cloudflare's runtime and the site CSP.
//   node test-funding.mjs [screenshot-dir]
// "Who does what": buttons, keyboard, one group at a time, static list without JavaScript. The structure diagram:
// legible text sizes, three lanes on desktop and one column on phones, no overflow, no retired routes. Images: load,
// mobile crops on phones, intrinsic sizes, lazy below the fold, alt/caption rules. Performance: image bytes and LCP.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { serve } from "./lib/cf-serve.mjs";

const shots = process.argv[2];
if (shots) fs.mkdirSync(shots, { recursive: true });
const srv = await serve(path.resolve(path.dirname(new URL(import.meta.url).pathname), "../public"));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let pass = 0, fail = 0;
const perf = {};
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  --  " + String(detail).slice(0, 400)}`); };
const settle = async (page) => {
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
  await page.evaluate(async () => {
    for (const i of document.images) {
      i.scrollIntoView({ block: "center" });
      const t0 = performance.now();
      while (!(i.complete && i.naturalWidth > 0) && performance.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 50));
    }
    scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
};

try {
  // ---- "Who does what" with JavaScript ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const csp = [];
    await page.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(e.violatedDirective)); });
    page.on("pageerror", (e) => csp.push(e.message));
    await page.goto(srv.base + "/financing", { waitUntil: "load" });
    const state = () => page.evaluate(() => ({
      picker: !document.querySelector(".layer-picker").hidden,
      pressed: [...document.querySelectorAll(".layer-btn")].map((b) => b.getAttribute("aria-pressed")),
      shown: [...document.querySelectorAll(".layer-panel")].filter((p) => !p.hidden).map((p) => p.id),
    }));
    let s = await state();
    check("explorer: five buttons shown, the first selected, one group visible", s.picker && s.pressed.length === 5 && s.pressed.join() === "true,false,false,false,false" && s.shown.join() === "layer-community", JSON.stringify(s));
    const labels = await page.$$eval(".layer-btn", (bs) => bs.map((b) => b.textContent.replace(/\s+/g, " ").trim()));
    check("explorer: the five layers, in order, each marked 'Exists now' or 'Proposed'",
      /^Exists now Public research community$/.test(labels[0]) && /^Proposed Eligible participants in a potential private financing process$/.test(labels[1])
      && /^Proposed Programme vehicle and legal register$/.test(labels[2]) && /^Proposed Possible permissioned digital representation$/.test(labels[3])
      && /^Exists now Clinical and regulatory responsibilities$/.test(labels[4]), labels.join(" | "));
    await page.click('.layer-btn[data-layer="layer-vehicle"]');
    s = await state();
    check("explorer: a click selects that group only", s.shown.join() === "layer-vehicle" && s.pressed[2] === "true" && s.pressed.filter((x) => x === "true").length === 1, JSON.stringify(s));
    // keyboard: Tab reaches the buttons; arrows move; Enter and Space select; focus is visible
    await page.focus(".layer-btn");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const focused = await page.evaluate(() => document.activeElement.getAttribute("data-layer"));
    await page.keyboard.press("Enter");
    s = await state();
    check("keyboard: arrow keys move between buttons and Enter selects", focused === "layer-digital" && s.shown.join() === "layer-digital", `${focused} ${JSON.stringify(s)}`);
    await page.keyboard.press("End");
    await page.keyboard.press(" ");
    s = await state();
    check("keyboard: End then Space selects the last group", s.shown.join() === "layer-clinical", JSON.stringify(s));
    const ring = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return { style: c.outlineStyle, w: parseFloat(c.outlineWidth) }; });
    check("keyboard: visible focus on the focused button", ring.style !== "none" && ring.w >= 2, JSON.stringify(ring));
    await page.focus("#who-h").catch(() => {});
    const tabbed = await page.evaluate(() => { const b = document.querySelectorAll(".layer-btn"); return [...b].every((x) => x.tabIndex === 0 && x.tagName === "BUTTON"); });
    check("keyboard: every group is a native button in the tab order (no hover-only interaction)", tabbed);
    const panelText = await page.$$eval(".layer-panel p", (ps) => ps.map((p) => p.textContent.split(/(?<=\.)\s/).filter(Boolean).length));
    check("each group is explained in two or three sentences", panelText.every((n) => n >= 2 && n <= 3), panelText.join(","));
    const v = await page.evaluate(() => window.__csp);
    check("no CSP violations or script errors on Funding", !v.length && !csp.length, v.concat(csp).join("; "));
    await ctx.close();
  }
  // ---- reduced motion ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(srv.base + "/financing", { waitUntil: "load" });
    const t = await page.$eval(".layer-btn", (b) => getComputedStyle(b).transitionDuration);
    check("reduced motion: no transitions on the explorer", /^0s(, 0s)*$/.test(t), t);
    await ctx.close();
  }
  // ---- without JavaScript: the static version ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(srv.base + "/financing", { waitUntil: "load" });
    const r = await page.evaluate(() => ({ picker: getComputedStyle(document.querySelector(".layer-picker")).display,
      panels: [...document.querySelectorAll(".layer-panel")].filter((p) => p.offsetParent).length }));
    check("no JavaScript: the buttons are hidden and all five groups are shown as a readable list", r.picker === "none" && r.panels === 5, JSON.stringify(r));
    await ctx.close();
  }
  // ---- pages at phone and desktop widths ----
  for (const [w, h, label] of [[390, 844, "mobile"], [1280, 900, "desktop"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    for (const p of ["/financing", "/programme", "/updates"]) {
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        window.__lcp = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await page.goto(srv.base + p, { waitUntil: "load" });
      const lcp = await page.evaluate(() => new Promise((r) => setTimeout(() => r(window.__lcp), 300)));
      const closedHeight = await page.evaluate(() => Math.round(document.querySelector("main").getBoundingClientRect().height));
      if (p === "/financing") {
        const limit = w === 390 ? 5500 : 3600;   // before the shortening: about 9,500 (390 px) and 4,900 (1280 px)
        check(`/financing @${w}px: content length ${closedHeight}px (main, without site header and footer), under ${limit}px with the expandable sections closed`, closedHeight < limit, String(closedHeight));
        const det = await page.$$eval("details.more", (ds) => ds.map((d) => ({ id: d.id, open: d.open, summary: d.querySelector("summary").textContent.trim() })));
        check("/financing: register mechanics and full structure are expandable sections, closed by default",
          det.map((d) => d.id).join() === "register,full-structure" && det.every((d) => !d.open), JSON.stringify(det));
        const quals = await page.$eval("#enquiries .aside", (a) => ({ visible: !!a.offsetParent && !a.closest("details"), text: a.textContent }));
        check("/financing: essential qualifications visible (not offer, no investment accepted, eligibility, risk)", quals.visible
          && /no investment is being accepted/i.test(quals.text) && /eligibility/i.test(quals.text) && /could be lost/.test(quals.text));
      }
      await settle(page);
      const st = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        imgs: [...document.querySelectorAll("figure.dao-figure img, img.dao-mark")].map((i) => ({ src: i.currentSrc.split("/").pop(), ok: i.complete && i.naturalWidth > 0,
          dims: i.hasAttribute("width") && i.hasAttribute("height"), lazy: i.loading, alt: i.getAttribute("alt"), cap: !!i.closest("figure")?.querySelector("figcaption"),
          top: i.getBoundingClientRect().top + scrollY, mark: i.classList.contains("dao-mark") })),
        bytes: performance.getEntriesByType("resource").filter((e) => e.initiatorType === "img").reduce((n, e) => n + (e.encodedBodySize || e.transferSize || 0), 0),
      }));
      check(`${p} @${w}px: no horizontal scroll`, st.overflow <= 1, `${st.overflow}px`);
      check(`${p} @${w}px: every DAO image loads (${st.imgs.length})`, st.imgs.length > 0 && st.imgs.every((i) => i.ok), JSON.stringify(st.imgs.filter((i) => !i.ok)));
      check(`${p} @${w}px: intrinsic width and height on every image`, st.imgs.every((i) => i.dims));
      if (w === 390) check(`${p} @390px: phones get the 4:3 mobile crops`, st.imgs.filter((i) => !i.mark).every((i) => /-m(480|800)\.webp$/.test(i.src)), st.imgs.map((i) => i.src).join(", "));
      else check(`${p} @1280px: desktop gets the supplied derivatives`, st.imgs.filter((i) => !i.mark).every((i) => /-(768|1200|1920)\.webp$/.test(i.src)), st.imgs.map((i) => i.src).join(", "));
      check(`${p} @${w}px: images below the first screen load lazily`, st.imgs.filter((i) => i.top > h).every((i) => i.lazy === "lazy"), JSON.stringify(st.imgs.map((i) => [i.src, Math.round(i.top), i.lazy])));
      check(`${p}: explanatory images have alt text and a visible caption; the decorative mark has empty alt and no caption`,
        st.imgs.every((i) => (i.mark ? i.alt === "" && !i.cap : i.alt && i.alt.length > 10 && i.cap)));
      perf[`${p} @${w}px`] = { image_kb: Math.round(st.bytes / 1024), lcp_ms: Math.round(lcp) };
      check(`${p} @${w}px: images under 400 KB (${Math.round(st.bytes / 1024)} KB) and LCP under 2.5 s locally (${Math.round(lcp)} ms)`, st.bytes < 400 * 1024 && lcp < 2500);
      if (p === "/financing") {
        const d = await page.evaluate(() => {
          const lanes = [...document.querySelectorAll(".gov-lane")].map((l) => Math.round(l.getBoundingClientRect().top));
          const texts = [...document.querySelectorAll(".gov-map *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
          const sizes = texts.map((e) => parseFloat(getComputedStyle(e).fontSize));
          const clipped = texts.filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== "visible").length;
          const lanesEl = document.querySelector(".gov-lanes");
          return { lanes, min: Math.min(...sizes), minBody: Math.min(...texts.filter((e) => !e.matches(".lane-status")).map((e) => parseFloat(getComputedStyle(e).fontSize))),
            clipped, over: lanesEl.scrollWidth - lanesEl.clientWidth, img: !!document.querySelector('.gov-map img'),
            words: /^In words:/.test(document.querySelector(".gov-map figcaption")?.textContent.trim() || "") ? 1 : 0 };
        });
        if (w === 1280) check("diagram @1280px: three lanes side by side", d.lanes.length === 3 && new Set(d.lanes).size === 1, JSON.stringify(d.lanes));
        else check("diagram @390px: lanes arranged vertically", d.lanes.length === 3 && d.lanes[0] < d.lanes[1] && d.lanes[1] < d.lanes[2], JSON.stringify(d.lanes));
        check(`diagram @${w}px: all labels are real text (no raster), at least 14 px (status pills at least 13 px), nothing clipped or overflowing`,
          !d.img && d.minBody >= 14 && d.min >= 13 && d.clipped === 0 && d.over <= 0, JSON.stringify(d));
        if (w === 1280) check("diagram: a written summary goes with it", d.words === 1, String(d.words));
      }
      if (shots) await page.screenshot({ path: path.join(shots, `${p.slice(1)}-${label}.png`), fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
  // ---- content guards ----
  {
    const html = await (await fetch(srv.base + "/financing")).text();
    const text = html.replace(/<[^>]+>/g, " ");
    check("Funding: no link to a retired or separate DAO, token or community route", !/href="\/(how-it-works|proposed-token|dao|token|community|desci)\b/.test(html));
    const controls = [...html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2].replace(/<[^>]+>/g, " ").trim());
    check("Funding: no investment, wallet, payment or subscribe control", !/<(form|input|select)\b/i.test(html)
      && !controls.some((t) => /(wallet|invest|buy|subscribe|mint|pay|allocation)/i.test(t)), controls.filter((t) => /(wallet|invest|buy|subscribe|mint|pay|allocation)/i.test(t)).join(" | "));
    check("Funding: no patient or family imagery", ![...html.matchAll(/<img[^>]+src="([^"]+)"/g)].some((m) => !/\/assets\/img\/(dao\/|mark\.svg)/.test(m[1])));
    const once = (re) => (text.match(re) || []).length;
    check("Funding: the no-vote and milestone boundaries are each stated at most twice (no repetition in every block)",
      once(/not vote on clinical decisions/g) <= 1 && once(/no funding milestone can authorise|approves nothing clinical/g) <= 2, `${once(/not vote on clinical decisions/g)} ${once(/no funding milestone can authorise|approves nothing clinical/g)}`);
    check("Funding: 'Who does what' says community membership creates no investment entitlement and participants do not vote on clinical decisions",
      /gives no right to invest/.test(text) && /would not vote on clinical decisions/.test(text));
    check("Funding: preferred platform-integrated route and register-first fallback kept", /platform-integrated programme financing/.test(text) && /register-first/i.test(text));
    check("Funding: no statement that capital was raised, custody operates, milestones were achieved or returns are available",
      !/(has|have) (been )?raised|custody is|milestones? (has|have) been (met|achieved)|returns? (are|is) available|expected returns?/i.test(text));
    const pub = fs.readdirSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), "../public/assets/img/dao"));
    check("only web derivatives are published (no brief, prompts, masters, Mermaid source or ZIP)", pub.every((f) => /\.webp$/.test(f)) && !pub.some((f) => /15-dao-governance/.test(f)), pub.join(", "));
  }
} finally {
  await browser.close();
  srv.stop();
}
console.log("performance (local, uncached):", JSON.stringify(perf));
console.log(`funding tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
