// Prints the HTML programme brief (release-032/site/resources/programme-brief.html) to its companion PDF,
// so the downloadable PDF always says exactly what the page says:
//   node print-html-brief.mjs <site-dir> <version YYYY-MM-DD>
// Writes <site-dir>/resources/NWPharmaTech-CHRP-programme-brief-v<version>.pdf (A4). Site chrome
// (header, navigation, buttons, footer) is hidden for the print only; the page itself is not changed.
import { chromium } from "playwright-core"; import { serve } from "./lib/cf-serve.mjs"; import path from "node:path";
const [dir, version] = process.argv.slice(2);
if (!dir || !/^\d{4}-\d{2}-\d{2}$/.test(version || "")) { console.error("usage: node print-html-brief.mjs <site-dir> <YYYY-MM-DD>"); process.exit(2); }
const srv = await serve(dir);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
await p.route((u) => !u.href.startsWith(srv.base), (r) => r.fulfill({ status: 200, body: "" }));
await p.goto(srv.base + "/resources/programme-brief", { waitUntil: "load" });
await p.addStyleTag({ content: `
  .skip-link, .site-header, .site-footer, .secondary-nav, .cta-row, .btn { display: none !important; }
  main { padding-top: 0 !important; } .page-hero { padding: 0 0 8px !important; background: #fff !important; }
  body { background: #fff !important; color: #111 !important; font-size: 10.5pt; } a { color: #064 !important; }
  h1 { font-size: 20pt !important; } h2 { font-size: 13pt !important; margin-top: 14px !important; break-after: avoid; }
  figure, .callout { break-inside: avoid; } .figure-inline img { max-width: 70% !important; }` });
const out = path.join(dir, "resources", `NWPharmaTech-CHRP-programme-brief-v${version}.pdf`);
await p.pdf({ path: out, format: "A4", printBackground: true, margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;width:100%;padding:0 16mm;color:#555">NWPharmaTech CHR-P programme brief · v${version}</div>`,
  footerTemplate: `<div style="font-size:8px;width:100%;padding:0 16mm;color:#555;display:flex;justify-content:space-between"><span>Informational only · not medical advice · not an offer of securities</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>` });
await b.close(); srv.stop();
console.log("wrote", out);
