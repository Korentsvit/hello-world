// Renders build/*.html (expanded from src/print by build.py) to tagged, accessible PDFs in src/downloads/.
// Run: python3 build.py && (cd tools && node make-pdf.mjs) && python3 build.py
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const map = { "programme-brief.html": "nwpharmatech-programme-brief.pdf", "appointment-sheet.html": "appointment-preparation-sheet.pdf" };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [src, out] of Object.entries(map)) {
  const file = path.join(here, "../build", src);
  if (!fs.existsSync(file)) continue;
  const page = await browser.newPage();
  await page.goto("file://" + file);
  await page.pdf({ path: path.join(here, "../src/downloads", out), format: "A4", printBackground: true, tagged: true, outline: true });
  console.log("wrote", out);
}
await browser.close();
