// Renders page 1 of a PDF (pdf.js in Chromium) to WebP covers for the homepage brief panel:
//   node render-pdf-cover.mjs <pdf> <out-prefix>      -> <out-prefix>-320.webp and -640.webp
import { chromium } from "playwright-core"; import http from "node:http"; import fs from "node:fs"; import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("sharp");
const [pdf, prefix] = process.argv.slice(2);
if (!pdf || !prefix) { console.error("usage: node render-pdf-cover.mjs <pdf> <out-prefix>"); process.exit(2); }
const files = { "/pdf.mjs": "node_modules/pdfjs-dist/legacy/build/pdf.mjs", "/pdf.worker.mjs": "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", "/doc.pdf": pdf };
const srv = http.createServer((q, r) => { const f = files[q.url]; if (!f) { r.writeHead(200, { "content-type": "text/html" }); return r.end("<!doctype html><canvas id=c></canvas>"); }
  r.writeHead(200, { "content-type": q.url.endsWith(".pdf") ? "application/pdf" : "text/javascript" }); fs.createReadStream(f.startsWith("node_modules") ? new URL(f, import.meta.url) : f).pipe(r); }).listen(0);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage(); await p.goto(`http://127.0.0.1:${srv.address().port}/`);
const png = await p.evaluate(async () => { const pdfjs = await import("/pdf.mjs"); pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
  const page = await (await pdfjs.getDocument("/doc.pdf").promise).getPage(1); const vp = page.getViewport({ scale: 2 });
  const c = document.getElementById("c"); c.width = vp.width; c.height = vp.height; const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise; return c.toDataURL("image/png"); });
const buf = Buffer.from(png.split(",")[1], "base64");
for (const w of [320, 640]) await sharp(buf).resize({ width: w }).webp({ quality: 78 }).toFile(`${prefix}-${w}.webp`);
await b.close(); srv.close(); console.log("covers written:", `${prefix}-320.webp`, `${prefix}-640.webp`);
