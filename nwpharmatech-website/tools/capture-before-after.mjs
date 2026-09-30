// Matched before/after captures: the same pages, widths and capture settings for two site directories.
//   node capture-before-after.mjs <before-dir> <after-dir> <out-dir> [paths...]
// Full-page PNGs at 1280 and 390 px (external requests stubbed; lazy images forced to load; motion allowed,
// so the "after" homepage shows the hero video ~3.5 s in).
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path";
const [before, after, out, ...paths] = process.argv.slice(2);
const pages = paths.length ? paths : ["/", "/team", "/science", "/updates/"];
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
for (const [tag, dir] of [["before", before], ["after", after]]) {
  const srv = await serve(dir);
  for (const [label, vp] of [["desktop-1280", { width: 1280, height: 900 }], ["phone-390", { width: 390, height: 844 }]]) {
    for (const p of pages) for (let attempt = 1; attempt <= 2; attempt++) try {
      const ctx = await b.newContext({ viewport: vp });
      await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
      const pg = await ctx.newPage();
      await pg.goto(srv.base + p, { waitUntil: "load" });
      await pg.evaluate(async () => { for (const i of document.images) i.loading = "eager"; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
      await pg.waitForTimeout(3500);
      const h = await pg.evaluate(() => document.documentElement.scrollHeight);
      await pg.setViewportSize({ width: vp.width, height: Math.min(h, 16000) }); await pg.waitForTimeout(800);
      const name = (p === "/" ? "home" : p.replace(/^\/|\/$/g, "").replace(/\//g, "_")) + `-${label}-${tag}.png`;
      await pg.screenshot({ path: path.join(out, name), fullPage: true });
      await ctx.close();
      break;
    } catch (e) { console.error(`${tag} ${label} ${p}: attempt ${attempt} failed: ${e.message.split("\n")[0]}`); if (attempt === 2) throw e; }
  }
  srv.stop();
}
await b.close();
console.log("captured", fs.readdirSync(out).length, "files in", out);
