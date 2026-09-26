// NWPT-034 interaction checks on the production-source site (release-032/site):
//   node test-nwpt034.mjs <site-dir>
// Navigation by keyboard and by touch (no hover), the programme brief link at both widths,
// the homepage hero video (plays, pauses, resumes by button and keyboard; still only under reduced motion),
// a genuine 404, and PDF downloads served as PDFs.
import { chromium } from "playwright-core";
import { serve } from "./lib/cf-serve.mjs";
const dir = process.argv[2];
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  --  " + detail}`); };
const stub = async (ctx) => ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));

// desktop keyboard
{ const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await stub(ctx); const p = await ctx.newPage();
  await p.goto(srv.base + "/", { waitUntil: "load" });
  const btn = p.locator(".nav-group__btn").first(); await btn.focus(); await p.keyboard.press("Enter");
  check("desktop: Enter on a menu button opens its dropdown", await p.locator(".nav-dropdown").first().isVisible());
  await p.keyboard.press("Tab");
  check("desktop: Tab moves into the open dropdown", await p.evaluate(() => !!document.activeElement.closest(".nav-dropdown")));
  await p.keyboard.press("Escape");
  check("desktop: Escape closes the dropdown and returns focus", !(await p.locator(".nav-dropdown").first().isVisible()) && await p.evaluate(() => document.activeElement.classList.contains("nav-group__btn")));
  const brief = p.locator('header a:has-text("programme brief")').first();
  check("desktop: programme brief link visible in the header", await brief.isVisible());
  await ctx.close(); }
// desktop-width touch (tablet landscape): tap, no hover
{ const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: false }); await stub(ctx); const p = await ctx.newPage();
  await p.goto(srv.base + "/", { waitUntil: "load" });
  await p.locator(".nav-group__btn").nth(2).tap();
  const dd = p.locator(".nav-dropdown").nth(2);
  check("touch 1180px: tapping a menu button opens its dropdown", await dd.isVisible());
  const href = await dd.locator("a").first().getAttribute("href");
  await Promise.all([p.waitForURL((u) => u.pathname !== "/", { timeout: 10000 }).catch(() => {}), dd.locator("a").first().tap()]);
  check("touch 1180px: tapping a dropdown link navigates", p.url().includes(href.split("#")[0].replace(/\.html$/, "")), p.url());
  await ctx.close(); }
// phone touch
{ const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); await stub(ctx); const p = await ctx.newPage();
  await p.goto(srv.base + "/", { waitUntil: "load" });
  await p.locator("#nav-toggle").tap();
  check("phone: Menu opens the navigation panel", await p.locator("#site-nav").evaluate((n) => n.classList.contains("is-open")));
  await p.locator(".nav-group__btn").nth(4).tap();
  const dd = p.locator(".nav-dropdown").nth(4);
  check("phone: tapping a group expands it", await dd.isVisible());
  check("phone: programme brief reachable in the open menu", await p.locator('#site-nav a:has-text("programme brief"), #site-nav a[href*="programme-brief"]').first().isVisible());
  await Promise.all([p.waitForURL((u) => u.pathname !== "/", { timeout: 10000 }).catch(() => {}), dd.locator("a").first().tap()]);
  check("phone: tapping a link navigates", p.url().includes("/updates"), p.url());
  await p.goto(srv.base + "/", { waitUntil: "load" });
  check("phone: programme brief button in the hero", await p.locator('.cine-hero a[href*="programme-brief"]').first().isVisible());
  check("phone: brief panel download link", await p.locator('.brief-panel a[href$=".pdf"]').isVisible());
  await ctx.close(); }
// hero video
for (const [label, vp, expect] of [["desktop", { width: 1280, height: 900 }, "1280"], ["phone", { width: 390, height: 844 }, "540sq"]]) {
  const ctx = await b.newContext({ viewport: vp }); await stub(ctx); const p = await ctx.newPage();
  await p.goto(srv.base + "/", { waitUntil: "load" });
  check(`${label}: headline in the first viewport`, await p.evaluate(() => { const r = document.querySelector("#hero-title").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
  await p.waitForTimeout(2500);
  const st = () => p.evaluate(() => { const v = document.querySelector(".hero-motion__video"); return { src: v.currentSrc, paused: v.paused, t: v.currentTime, muted: v.muted, loop: v.loop, inline: v.playsInline }; });
  let s = await st();
  check(`${label}: hero video plays muted, inline, looping (${s.src.split("/").pop()})`, !s.paused && s.muted && s.loop && s.inline && s.src.includes(expect), JSON.stringify(s));
  const tg = p.locator(".hero-motion__toggle");
  check(`${label}: pause control visible and labelled`, await tg.isVisible() && (await tg.innerText()).includes("Pause"));
  await tg.click(); await p.waitForTimeout(300); s = await st();
  check(`${label}: button pauses the video`, s.paused && (await tg.getAttribute("aria-pressed")) === "true" && (await tg.innerText()).includes("Play"));
  await tg.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(500); s = await st();
  check(`${label}: Enter on the button resumes`, !s.paused);
  await tg.focus(); await p.keyboard.press("Space"); await p.waitForTimeout(300);
  await p.reload({ waitUntil: "load" }); await p.waitForTimeout(2000); s = await st();
  check(`${label}: a paused choice is remembered after reload`, s.paused && await p.locator(".hero-motion__toggle").isVisible());
  await ctx.close();
}
for (const [label, opts] of [["reduced motion", { reducedMotion: "reduce" }]]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ...opts }); await stub(ctx); const p = await ctx.newPage();
  let videoRequests = 0; p.on("request", (r) => { if (/brain-ecs-loop/.test(r.url())) videoRequests++; });
  await p.goto(srv.base + "/", { waitUntil: "load" }); await p.waitForTimeout(2000);
  check(`${label}: no video fetched, still shown, no control`, videoRequests === 0 && await p.locator(".cine-hero__img").isVisible() && !(await p.locator(".hero-motion__toggle").isVisible()), `${videoRequests} requests`);
  await ctx.close();
}
{ // Save-Data
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await stub(ctx);
  await ctx.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }));
  const p = await ctx.newPage(); let n = 0; p.on("request", (r) => { if (/brain-ecs-loop/.test(r.url())) n++; });
  await p.goto(srv.base + "/", { waitUntil: "load" }); await p.waitForTimeout(2000);
  check("Save-Data: no video fetched; the still panel is shown", n === 0 && await p.locator(".hero-motion__still").isVisible(), `${n} requests`);
  await ctx.close();
}
{ // video does not block first paint: nothing requested before the load event
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await stub(ctx); const p = await ctx.newPage();
  const order = []; p.on("request", (r) => { if (/brain-ecs-loop/.test(r.url())) order.push("video"); });
  p.on("load", () => order.push("load"));
  await p.goto(srv.base + "/", { waitUntil: "load" }); await p.waitForTimeout(1500);
  check("video requested only after the page's load event", order[0] === "load" && order.includes("video"), order.join(","));
  await ctx.close();
}
// 404 and PDFs
for (const [path, status, type] of [["/no-such-page-nwpt", 404, "text/html"], ["/downloads/nwpharmatech-programme-brief.pdf", 200, "application/pdf"],
  ["/resources/NWPharmaTech-CHRP-programme-brief-v2026-09-22.pdf", 200, "application/pdf"], ["/downloads/appointment-preparation-sheet.pdf", 200, "application/pdf"],
  ["/updates/register", 301, ""]]) {
  const r = await fetch(srv.base + path, { redirect: "manual" });
  check(`${path} answers ${status}${type ? " " + type : ""}`, r.status === status && (r.headers.get("content-type") || "").startsWith(type), `${r.status} ${r.headers.get("content-type")}`);
}
await b.close(); srv.stop();
console.log(`nwpt-034 tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
