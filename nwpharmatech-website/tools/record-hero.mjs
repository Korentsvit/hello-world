// Short recordings of the homepage hero video and its Pause/Play control, desktop and phone.
//   node record-hero.mjs <site-dir> <out-dir>
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs"; import path from "node:path";
const [dir, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
for (const [label, vp] of [["desktop-1280", { width: 1280, height: 800 }], ["phone-390", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: out, size: vp } });
  await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
  const p = await ctx.newPage();
  await p.goto(srv.base + "/", { waitUntil: "load" });
  if (label.startsWith("phone")) { await p.waitForTimeout(1500); await p.evaluate(() => window.scrollTo({ top: document.querySelector(".hero-motion").offsetTop - 250, behavior: "smooth" })); }
  await p.waitForTimeout(6000);
  const tg = p.locator(".hero-motion__toggle");
  await tg.hover(); await p.waitForTimeout(600); await tg.click();          // pause
  await p.waitForTimeout(3000);
  await tg.click();                                                          // play again
  await p.waitForTimeout(3500);
  const v = p.video(); await ctx.close();
  fs.renameSync(await v.path(), path.join(out, `homepage-hero-${label}.webm`));
}
await b.close(); srv.stop();
console.log(fs.readdirSync(out));
