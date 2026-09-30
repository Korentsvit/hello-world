import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs";
const [dir, out, pathArg, ...opts] = process.argv.slice(2);
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
for (const [label, vp] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: opts.includes("--reduce") ? "reduce" : "no-preference" });
  await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
  const p = await ctx.newPage(); const errs = []; p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(srv.base + pathArg, { waitUntil: "load" });
  await p.waitForTimeout(3500);
  const st = await p.evaluate(() => { const v = document.querySelector(".hero-motion__video"); const r = document.querySelector("[data-hero-motion]");
    return v ? { src: v.currentSrc.split("/").pop(), paused: v.paused, t: v.currentTime.toFixed(1), playing: r.classList.contains("is-playing"), btn: !document.querySelector(".hero-motion__toggle").hidden } : null; });
  console.log(label, JSON.stringify(st), errs.join(" | "));
  if (opts.includes("--full")) { await p.evaluate(async () => { for (const i of document.images) { i.loading = "eager"; } await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
    const h = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewportSize({ width: vp.width, height: Math.min(h, 16000) }); await p.waitForTimeout(800); }
  await p.screenshot({ path: `${out}-${label}.png`, fullPage: opts.includes("--full") });
  await ctx.close();
}
await b.close(); srv.stop();
