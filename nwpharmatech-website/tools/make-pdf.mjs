// Renders tools/programme-brief.html to src/downloads/nwpharmatech-programme-brief.pdf.
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage();
await page.goto("file://" + path.join(here, "programme-brief.html"));
await page.pdf({ path: path.join(here, "../src/downloads/nwpharmatech-programme-brief.pdf"), format: "A4", printBackground: true });
await browser.close();
