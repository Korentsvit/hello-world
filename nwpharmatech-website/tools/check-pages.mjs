// Targeted checks for a set of changed pages (Cloudflare Pages runtime), at 390 and 1280 px:
//   node check-pages.mjs <site-dir> <path> [path...]
// Every rendered image loads (an image the site sets to display:none at that width is listed, not required),
// no console errors, no horizontal scroll, axe WCAG 2.2 AA, one h1, and every internal link and anchor
// on those pages resolves in at most one redirect.
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import fs from "node:fs";
const [dir, ...paths] = process.argv.slice(2);
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; if (!ok) console.log(`FAIL  ${n}  --  ${d}`); };
const links = new Set();
for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1280", { width: 1280, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: "reduce" });
  await ctx.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "", contentType: "text/css" }));
  for (const p of paths) {
    const pg = await ctx.newPage(); const errs = []; pg.on("console", (m) => m.type() === "error" && errs.push(m.text())); pg.on("pageerror", (e) => errs.push(e.message));
    await pg.goto(srv.base + p, { waitUntil: "load" });
    const st = await pg.evaluate(async () => {
      for (const i of document.images) { if (getComputedStyle(i).display === "none") continue; i.scrollIntoView({ block: "center" }); const t0 = performance.now();
        while (!(i.complete && i.naturalWidth > 0) && performance.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 50)); }
      window.scrollTo(0, 0);
      const shown = [...document.images].filter((i) => getComputedStyle(i).display !== "none");
      return { broken: shown.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.currentSrc || i.src), hidden: document.images.length - shown.length,
        overflow: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll("h1").length,
        hrefs: [...document.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => h.startsWith(location.origin)) };
    });
    st.hrefs.forEach((h) => links.add(h));
    check(`${p} @${label}: rendered images load`, !st.broken.length, st.broken.join(", "));
    check(`${p} @${label}: no console errors`, !errs.length, errs.join(" | "));
    check(`${p} @${label}: no horizontal scroll`, st.overflow <= 1, `${st.overflow}px`);
    check(`${p} @${label}: one h1`, st.h1 === 1, String(st.h1));
    await pg.evaluate(axe);
    const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id} x${x.nodes.length}: ${x.nodes[0]?.target}`));
    check(`${p} @${label}: axe WCAG 2.2 AA`, !v.length, v.join("; "));
    await pg.close();
  }
  await ctx.close();
}
const ids = new Map();
for (const h of links) {
  const u = new URL(h); let r = await fetch(srv.base + u.pathname, { redirect: "manual" }); let hops = 0; let final = u.pathname;
  while ([301, 302, 307, 308].includes(r.status) && hops < 3) { hops++; final = new URL(r.headers.get("location"), srv.base).pathname; r = await fetch(srv.base + final, { redirect: "manual" }); }
  check(`link ${u.pathname}${u.hash} resolves (${hops} redirect)`, r.status === 200 && hops <= 1, `${r.status} after ${hops}`);
  if (u.hash && r.status === 200 && /html/.test(r.headers.get("content-type") || "")) {
    if (!ids.has(final)) ids.set(final, new Set([...(await r.text()).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    check(`anchor ${u.pathname}${u.hash} exists`, ids.get(final).has(decodeURIComponent(u.hash.slice(1))));
  }
}
await b.close(); srv.stop();
console.log(`targeted checks: ${pass} passed, ${fail} failed; ${paths.length} pages x 2 widths; ${links.size} internal links`);
process.exit(fail ? 1 : 0);
