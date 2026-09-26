import { chromium } from "playwright-core"; import fs from "node:fs"; import http from "node:http"; import path from "node:path";
const dir = process.argv[2]; const pages = process.argv.slice(3);
const axe = fs.readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const srv = http.createServer((q, r) => { let f = path.join(dir, decodeURIComponent(q.url.split("?")[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html"); if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } const ext = path.extname(f); r.writeHead(200, { "content-type": { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" }[ext] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }).listen(0);
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const w of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  await ctx.route((u) => !u.href.startsWith(base), (r) => r.fulfill({ status: 200, body: "" }));
  for (const p of pages) { const pg = await ctx.newPage(); await pg.goto(base + p, { waitUntil: "load" }); await pg.evaluate(() => document.querySelectorAll("details").forEach((d) => d.open = true));
    await pg.evaluate(axe); const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations);
    for (const x of v) for (const n of x.nodes.slice(0, 3)) console.log(w, p, x.id, n.target.join(" "), (n.any[0]?.message || "").slice(0, 160));
    await pg.close(); }
  await ctx.close(); }
await b.close(); srv.close();
