// Renders the PDF sources expanded by build.py (build/*.html) to tagged PDFs and checks each one:
//   - page count equals the template's <meta name="expected-pages">
//   - the PDF is tagged (structure tree present)
//   - every fact value used in the source appears in the PDF text
//   - every line of the source's rendered text appears in the PDF text (so no fixed statement is lost or stale)
// Writes the PDFs and pdf-manifest.json (source SHA-256, PDF SHA-256, pages, size, check results) to --out.
// build.py publishes a PDF only when the file matches its manifest entry.
// build.py runs this automatically whenever the facts in a PDF change, so it rarely needs running by hand:
//   node make-pdf.mjs [--src ../build] [--out ../src/downloads]
import { chromium } from "playwright-core";
import crypto from "node:crypto";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > -1 ? path.resolve(process.argv[i + 1]) : dflt; };
const srcDir = arg("--src", path.join(here, "../build"));
const outDir = arg("--out", path.join(here, "../src/downloads"));
const norm = (s) => s.normalize("NFKC").replace(/[‐-―−]/g, "-").replace(/[‘’]/g, "'").replace(/\s+/g, "").toLowerCase();

const checkFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith(".checks.json")).sort();
if (!checkFiles.length) { console.error(`no *.checks.json in ${srcDir}; run python3 build.py first`); process.exit(1); }

const manifest = {};
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let failed = 0;
for (const cf of checkFiles) {
  const c = JSON.parse(fs.readFileSync(path.join(srcDir, cf), "utf8"));
  const page = await browser.newPage();
  await page.goto("file://" + path.join(srcDir, c.source));
  await page.emulateMedia({ media: "print" });
  const sourceLines = (await page.evaluate(() => document.body.innerText)).split(/[\n\t]+/).map((l) => l.trim()).filter((l) => l.length >= 12);
  const out = path.join(outDir, c.pdf);
  await page.pdf({ path: out, format: "A4", printBackground: true, tagged: true, outline: true });
  await page.close();

  const bytes = fs.readFileSync(out);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, isEvalSupported: false }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    text += tc.items.map((it) => it.str).join(" ") + "\n";
  }
  const tagged = bytes.includes("/StructTreeRoot");
  const flat = norm(text);
  const missing = c.facts.filter((v) => !flat.includes(norm(v)));
  const missingText = sourceLines.filter((l) => !flat.includes(norm(l)));
  const pagesOk = c.expected_pages == null || doc.numPages === c.expected_pages;
  const pass = pagesOk && tagged && missing.length === 0 && missingText.length === 0;
  manifest[c.pdf] = {
    source: c.source, source_sha256: c.sha256, generated: new Date().toISOString(),
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    pages: doc.numPages, expected_pages: c.expected_pages, bytes: bytes.length, tagged,
    facts_checked: c.facts.length, missing_facts: missing, text_lines_checked: sourceLines.length, missing_text: missingText, pass,
  };
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.pdf}: ${doc.numPages} page(s) (expected ${c.expected_pages}), tagged=${tagged}, ` +
    `${c.facts.length - missing.length}/${c.facts.length} facts found, ${sourceLines.length - missingText.length}/${sourceLines.length} text lines found` +
    (missing.length ? `; missing facts: ${missing.join(" | ")}` : "") + (missingText.length ? `; missing text: ${missingText.slice(0, 5).join(" | ")}` : ""));
  if (!pass) failed++;
  await doc.destroy();
}
await browser.close();
fs.writeFileSync(path.join(outDir, "pdf-manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
process.exit(failed ? 1 : 0);
