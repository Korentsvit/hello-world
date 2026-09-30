// Funding page hero motion (/funding-use), Cloudflare Pages runtime:
//   node test-funding-hero.mjs [site-dir] [--record <dir>]
// Loading (only the matching composition; none with reduced motion, Save-Data or without JavaScript), playback over
// three loops, Pause/Play by keyboard and its remembered choice, pause off screen and in a hidden tab, breakpoint swap,
// composition (film box has the film's own aspect ratio, never cropped; copy inside the protected dark field), measured
// text contrast against real frames, axe automated checks (WCAG 2.2 A/AA rules) and the homepage/Science videos intact.
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs";
const args = process.argv.slice(2);
const dir = args[0] && !args[0].startsWith("--") ? args[0] : "../release-032/site";
const rec = args.includes("--record") ? args[args.indexOf("--record") + 1] : null;
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + String(d).slice(0, 400)}`); };
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
const DESK = { width: 1363, height: 936 }, PHONE = { width: 390, height: 844 };
async function open(vp, opts = {}) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: opts.reduce ? "reduce" : "no-preference", javaScriptEnabled: opts.js !== false, ...(opts.ctx || {}) });
  await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
  if (opts.saveData) await ctx.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }));
  const reqs = []; ctx.on("request", (r) => reqs.push(r.url()));
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  await pg.goto(srv.base + (opts.path || "/funding-use"), { waitUntil: "load" });
  return { ctx, pg, reqs, errs };
}
const vids = (reqs) => reqs.filter((u) => /funding-hero-refined-(21x9|4x3)\.(webm|mp4)/.test(u)).map((u) => u.match(/(21x9|4x3)\.(webm|mp4)/)[0]);
const posters = (reqs) => reqs.filter((u) => /-poster\.webp/.test(u)).map((u) => u.match(/(21x9|4x3)-poster/)[1]);
const state = (pg) => pg.evaluate(() => { const v = document.querySelector(".funding-hero__video"), b = document.querySelector(".funding-hero__toggle");
  return { src: v.currentSrc.split("/").pop(), paused: v.paused, t: v.currentTime, muted: v.muted, loop: v.loop, inline: v.playsInline, playing: document.querySelector("[data-funding-hero]").classList.contains("is-playing"),
    btnHidden: b.hidden, label: b.textContent.trim(), pressed: b.getAttribute("aria-pressed") }; });

// ---- loading: only the matching composition
for (const [label, vp, want, wantPoster] of [["1363", DESK, "21x9", "21x9"], ["390", PHONE, "4x3", "4x3"]]) {
  const { ctx, pg, reqs, errs } = await open(vp);
  await pg.waitForFunction(() => document.querySelector("[data-funding-hero]").classList.contains("is-playing"), null, { timeout: 15000 }).catch(() => {});
  const s = await state(pg);
  check(`@${label} plays the ${want} film (muted, looping, inline)`, s.playing && !s.paused && s.src.includes(want) && s.muted && s.loop && s.inline, JSON.stringify(s));
  check(`@${label} requests only the ${want} film and poster`, vids(reqs).length > 0 && vids(reqs).every((v) => v.startsWith(want)) && posters(reqs).every((p) => p === wantPoster), JSON.stringify([vids(reqs), posters(reqs)]));
  check(`@${label} visible Pause control`, !s.btnHidden && s.label === "Pause animation" && s.pressed === "false");
  // composition: the film box keeps the film's aspect ratio; contain, never cover
  const box = await pg.evaluate(() => { const m = document.querySelector(".funding-hero__media").getBoundingClientRect(), v = document.querySelector(".funding-hero__video"), cs = getComputedStyle(v);
    return { ratio: m.width / m.height, fit: cs.objectFit, posterFit: getComputedStyle(document.querySelector(".funding-hero__poster")).objectFit, left: m.left, right: m.right, vw: innerWidth }; });
  const ratio = want === "21x9" ? 1280 / 548 : 4 / 3;
  check(`@${label} film box ratio matches the film, object-fit contain (no crop)`, Math.abs(box.ratio - ratio) / ratio < 0.01 && box.fit === "contain" && box.posterFit === "contain" && box.left >= 0 && box.right <= box.vw + 0.5, JSON.stringify(box));
  check(`@${label} control does not cover the film`, await pg.evaluate(() => { const b = document.querySelector(".funding-hero__toggle").getBoundingClientRect(), m = document.querySelector(".funding-hero__media").getBoundingClientRect(), f = document.querySelector("[data-funding-hero]").getBoundingClientRect();
    return innerWidth >= 1200 ? b.right <= f.left + f.width * 0.37 : b.top >= m.bottom; }));
  check(`@${label} no page errors`, !errs.length, errs.join(" | "));
  await ctx.close();
}

// ---- three loops, pause control, remembered choice, off screen, hidden tab
{
  const recDir = rec ? { recordVideo: { dir: rec, size: { width: 1363, height: 936 } } } : {};
  const { ctx, pg } = await open(DESK, { ctx: recDir });
  await pg.waitForFunction(() => document.querySelector("[data-funding-hero]").classList.contains("is-playing"), null, { timeout: 15000 });
  const dur = await pg.evaluate(() => document.querySelector(".funding-hero__video").duration);
  check("film duration 3.25 s", Math.abs(dur - 3.25) < 0.06, String(dur));
  const loops = await pg.evaluate(async () => { const v = document.querySelector(".funding-hero__video"); let wraps = 0, last = v.currentTime, stalls = 0, prev = v.currentTime; const t0 = performance.now();
    while (performance.now() - t0 < 10500) { await new Promise((r) => setTimeout(r, 50)); const t = v.currentTime; if (t + 1 < last) wraps++; if (t === prev && !v.paused) stalls++; else stalls = 0; prev = t; last = t; if (stalls > 20) return { wraps, stalled: true }; }
    return { wraps, ended: v.ended, paused: v.paused, stalled: false }; });
  check("plays through three loop boundaries without stopping", loops.wraps >= 3 && !loops.ended && !loops.paused && !loops.stalled, JSON.stringify(loops));
  await pg.focus(".funding-hero__toggle"); await pg.keyboard.press("Enter"); await pg.waitForTimeout(200);
  let s = await state(pg);
  check("keyboard Enter pauses; label and state update", s.paused && s.label === "Play animation" && s.pressed === "true", JSON.stringify(s));
  check("pause choice remembered on this device", (await pg.evaluate(() => localStorage.getItem("nwpt-funding-hero"))) === "paused");
  await pg.reload({ waitUntil: "load" }); await pg.waitForTimeout(2000);
  s = await state(pg);
  check("after reload the film stays paused (choice kept)", s.paused && s.label === "Play animation" && !s.btnHidden, JSON.stringify(s));
  await pg.focus(".funding-hero__toggle"); await pg.keyboard.press("Space"); await pg.waitForTimeout(600);
  s = await state(pg);
  check("keyboard Space plays again", !s.paused && s.label === "Pause animation", JSON.stringify(s));
  await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(600);
  check("pauses when scrolled off screen", (await state(pg)).paused);
  await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(800);
  check("resumes when back on screen", !(await state(pg)).paused);
  await pg.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); }); await pg.waitForTimeout(200);
  check("pauses when the tab is hidden", (await state(pg)).paused);
  await pg.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); }); await pg.waitForTimeout(600);
  check("resumes when the tab is visible again", !(await state(pg)).paused);
  // breakpoint swap keeps the state
  await pg.setViewportSize(PHONE); await pg.waitForTimeout(1500);
  s = await state(pg);
  check("crossing to phone width swaps to the 4:3 film and keeps playing", s.src.includes("4x3") && !s.paused, JSON.stringify(s));
  await pg.focus(".funding-hero__toggle"); await pg.keyboard.press("Enter"); await pg.waitForTimeout(200);
  await pg.setViewportSize(DESK); await pg.waitForTimeout(1500);
  s = await state(pg);
  check("crossing back to desktop swaps to 21:9 and keeps the pause", s.src.includes("21x9") && s.paused && s.label === "Play animation", JSON.stringify(s));
  await pg.evaluate(() => localStorage.removeItem("nwpt-funding-hero"));
  await ctx.close();
  if (rec) { const f = fs.readdirSync(rec).filter((x) => x.endsWith(".webm")); console.log("recording:", f.join(", ")); }
}

// ---- fallbacks: reduced motion, Save-Data, no JavaScript -> poster only, no film requested
for (const [name, opts] of [["reduced motion", { reduce: true }], ["Save-Data", { saveData: true }], ["no JavaScript", { js: false }]]) {
  for (const [label, vp, want] of [["1363", DESK, "21x9"], ["390", PHONE, "4x3"]]) {
    const { ctx, pg, reqs } = await open(vp, opts); await pg.waitForTimeout(1500);
    const v = await pg.evaluate(() => { const i = document.querySelector(".funding-hero__poster"), b = document.querySelector(".funding-hero__toggle"), vid = document.querySelector(".funding-hero__video");
      return { poster: i.currentSrc.split("/").pop(), loaded: i.complete && i.naturalWidth > 0, btnHidden: b.hidden || getComputedStyle(b).display === "none", sources: vid.querySelectorAll("source").length }; });
    check(`@${label} ${name}: ${want} poster shown, no film requested, no control`, v.loaded && v.poster.includes(want + "-poster") && vids(reqs).length === 0 && v.sources === 0 && v.btnHidden, JSON.stringify([v, vids(reqs)]));
    await ctx.close();
  }
}

// ---- composition across desktop widths: copy and control inside the protected dark field, within the frame
for (const w of [1200, 1280, 1363, 1440, 1920]) {
  const { ctx, pg } = await open({ width: w, height: 1000 }, { reduce: true });
  const c = await pg.evaluate(() => { const f = document.querySelector("[data-funding-hero]").getBoundingClientRect(); const els = [...document.querySelectorAll(".funding-hero__copy > *, .funding-hero__toggle")].filter((e) => e.getClientRects().length);
    const r = els.map((e) => { const x = document.createRange(); x.selectNodeContents(e); const b = e.matches("button") ? e.getBoundingClientRect() : x.getBoundingClientRect(); return { right: (b.right - f.left) / f.width, top: b.top - f.top, bottom: f.bottom - b.bottom }; });
    return { maxRight: Math.max(...r.map((x) => x.right)), minTop: Math.min(...r.map((x) => x.top)), minBottom: Math.min(...r.map((x) => x.bottom)), frameRatio: f.width / f.height }; });
  check(`@${w} copy and control stay in the left ~37% and inside the frame`, c.maxRight <= 0.37 && c.minTop >= 8 && c.minBottom >= 8 && Math.abs(c.frameRatio - 1280 / 548) < 0.03, JSON.stringify(c));
  await ctx.close();
}

// ---- text contrast against real frames (start, a third, two thirds), measured from pixels behind each text line
{
  const { ctx, pg } = await open(DESK);
  await pg.waitForFunction(() => document.querySelector("[data-funding-hero]").classList.contains("is-playing"), null, { timeout: 15000 });
  const lines = await pg.evaluate(() => [...document.querySelectorAll(".funding-hero__copy > *")].map((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { sel: e.className || e.tagName, color: c.color, size: parseFloat(c.fontSize), weight: c.fontWeight, box: { x: r.x, y: r.y, w: r.width, h: r.height } }; }));
  const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const worst = {};
  for (const t of [0.05, 1.1, 2.2]) {
    await pg.evaluate(async (t) => { const v = document.querySelector(".funding-hero__video"); v.pause(); v.currentTime = t; await new Promise((r) => v.addEventListener("seeked", r, { once: true })); }, t);
    await pg.addStyleTag({ content: ".funding-hero__copy, .funding-hero__copy * { color: transparent !important; } .funding-hero__copy .eyebrow::before { background: transparent !important; }" });
    const shot = await pg.screenshot();
    await pg.evaluate(() => { const s = [...document.querySelectorAll("style")].pop(); s.remove(); });
    const blank = await ctx.newPage();
    const stats = await blank.evaluate(async ({ png, lines }) => { const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode(); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
      return lines.map((l) => { const d = x.getImageData(Math.floor(l.box.x), Math.floor(l.box.y), Math.max(1, Math.ceil(l.box.w)), Math.max(1, Math.ceil(l.box.h))).data; const Y = []; for (let i = 0; i < d.length; i += 4) Y.push([d[i], d[i + 1], d[i + 2]]); return Y; }); }, { png: shot.toString("base64"), lines });
    await blank.close();
    stats.forEach((px, i) => { const ls = px.map(([r, g, b]) => lum(r, g, b)).sort((a, b) => a - b); const p98 = ls[Math.floor(ls.length * 0.98)]; const k = lines[i].sel; worst[k] = Math.max(worst[k] || 0, p98); });
  }
  for (const l of lines) {
    const m = l.color.match(/\d+(\.\d+)?/g).map(Number); const fg = lum(m[0], m[1], m[2]); const bg = worst[l.sel];
    const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05); const large = l.size >= 24 || (l.size >= 18.66 && Number(l.weight) >= 700); const need = large ? 3 : 4.5;
    check(`contrast of "${l.sel}" over the brightest 2% of the film behind it (3 frames): ${ratio.toFixed(1)}:1 (needs ${need}:1)`, ratio >= need);
  }
  await ctx.close();
}

// ---- accessibility and neighbouring videos
for (const [label, vp] of [["390", PHONE], ["1363", DESK]]) {
  const { ctx, pg } = await open(vp, { reduce: true });
  await pg.evaluate(axe); const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
  check(`@${label} /funding-use axe automated checks (WCAG 2.2 A/AA rules)`, !v.length, v.join("; "));
  check(`@${label} approved copy and resources navigation unchanged`, (await pg.textContent("h1")) === "How catalytic capital could be used" && (await pg.locator('.secondary-nav a[aria-current="page"]').textContent()) === "Funding use");
  await ctx.close();
}
{
  const { ctx, pg, reqs } = await open(DESK, { path: "/" });
  await pg.waitForFunction(() => document.querySelector("[data-hero-motion]")?.classList.contains("is-playing"), null, { timeout: 15000 }).catch(() => {});
  check("homepage brain video still plays (unchanged)", await pg.evaluate(() => { const v = document.querySelector(".hero-motion__video"); return !!v && !v.paused && v.currentSrc.includes("brain-ecs-loop"); }) && !vids(reqs).length); // NWPT-046: the homepage funding card may show the poster image; the funding film must not load
  await ctx.close();
  const s = await open(DESK, { path: "/science" });
  const sci = await s.pg.evaluate(() => { const src = document.querySelector('video.manus-video source[src*="cns-motion-1280.webm"]'); return src ? src.getAttribute("src") : null; });
  const sciOk = sci ? (await fetch(srv.base + "/" + sci)).status === 200 : false;
  check("Science page video still present and served (unchanged)", !!sci && sciOk && !s.reqs.some((u) => u.includes("funding-hero")), String(sci));
  await s.ctx.close();
}
await b.close(); srv.stop();
console.log(`funding hero: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
