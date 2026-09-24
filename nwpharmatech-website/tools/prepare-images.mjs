// Responsive image pipeline for the integrated release: visual-portfolio images and authorised portraits.
//   node prepare-images.mjs <intake.json> <out-dir> [--base /assets/img/]
// intake.json lists every image with its purpose, alt text, caption and authorisation (docs/release-runbook.md,
// "Assets"). For each accepted image it writes AVIF, WebP and a JPEG (or PNG, if the source has transparency)
// fallback at the widths its purpose needs (never upscaled), and a <picture> snippet with width and height
// set, so the page reserves the space. Refused, and listed in the report rather than published:
//   - a portrait without recorded authorisation (who authorised it, and when), or not tied to a person;
//   - any image without alt text (decorative images must say so with "decorative": true);
//   - a caption with clinical or comparative claim wording, until "caption_reviewed" records a reviewer.
// A missing file is reported and skipped; it never stops the other images (a missing portrait must not block).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const WIDTHS = { hero: [640, 960, 1280, 1920], illustration: [480, 800, 1200], diagram: [480, 800, 1200],
  render: [400, 800, 1200], portrait: [240, 480, 720], logo: [160, 320] };
const SIZES = { hero: "100vw", illustration: "(min-width: 900px) 50vw, 100vw", diagram: "(min-width: 900px) 60vw, 100vw",
  render: "(min-width: 900px) 40vw, 100vw", portrait: "(min-width: 700px) 240px, 45vw", logo: "160px" };
// wording a caption may not carry without a recorded review: efficacy, comparison, safety and cure claims
const CLAIMS = /\b(cure[sd]?|treat(s|ed|ment)?|effective(ness)?|efficacy|proven|superior|better than|bioequivalen\w*|safe(r|ty)?|reduc(e|es|ed|ing) (risk|symptoms|relapse)|prevent(s|ed|ion)?|clinically (shown|proven)|approved)\b/i;

const [intakePath, outDir, ...rest] = process.argv.slice(2);
if (!intakePath || !outDir) {
  console.error("usage: node prepare-images.mjs <intake.json> <out-dir> [--base /assets/img/]");
  process.exit(2);
}
const base = rest[rest.indexOf("--base") + 1] && rest.includes("--base") ? rest[rest.indexOf("--base") + 1] : "/assets/img/";
const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));
const srcDir = path.resolve(path.dirname(intakePath), intake.source_dir || ".");
fs.mkdirSync(outDir, { recursive: true });
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const report = { accepted: [], refused: [], missing: [] };
for (const img of intake.images) {
  const why = [];
  if (!WIDTHS[img.purpose]) why.push(`unknown purpose '${img.purpose}' (one of ${Object.keys(WIDTHS).join(", ")})`);
  if (!img.decorative && !String(img.alt || "").trim()) why.push("no alt text");
  if (img.purpose === "portrait") {
    if (!img.person) why.push("portrait not tied to a person");
    if (!img.authorised || !img.authorised_by || !img.authorised_on) why.push("portrait authorisation not recorded (authorised, authorised_by, authorised_on)");
  }
  if (img.caption && CLAIMS.test(img.caption) && !img.caption_reviewed) why.push(`caption has claim wording ('${img.caption.match(CLAIMS)[0]}') without caption_reviewed`);
  const file = path.join(srcDir, img.file || "");
  if (!img.file || !fs.existsSync(file)) { report.missing.push({ id: img.id, file: img.file, purpose: img.purpose }); continue; }
  if (why.length) { report.refused.push({ id: img.id, file: img.file, why }); continue; }

  const meta = await sharp(file).metadata();
  const alpha = meta.hasAlpha && img.purpose !== "portrait";
  const widths = [...new Set(WIDTHS[img.purpose].map((w) => Math.min(w, meta.width)))];
  const ratio = meta.height / meta.width;
  const out = { avif: [], webp: [], fallback: [] };
  for (const w of widths) {
    const pipe = () => sharp(file).rotate().resize({ width: w, withoutEnlargement: true });
    const stem = `${img.id}-${w}`;
    await pipe().avif({ quality: 50 }).toFile(path.join(outDir, `${stem}.avif`));
    await pipe().webp({ quality: 72 }).toFile(path.join(outDir, `${stem}.webp`));
    const fb = alpha ? `${stem}.png` : `${stem}.jpg`;
    await (alpha ? pipe().png({ compressionLevel: 9 }) : pipe().jpeg({ quality: 78, mozjpeg: true })).toFile(path.join(outDir, fb));
    out.avif.push(`${base}${stem}.avif ${w}w`); out.webp.push(`${base}${stem}.webp ${w}w`); out.fallback.push([`${base}${fb}`, w]);
  }
  const largest = out.fallback[out.fallback.length - 1];
  const h = Math.round(largest[1] * ratio);
  const loading = img.purpose === "hero" ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
  const imgTag = `<img src="${largest[0]}" srcset="${out.fallback.map(([u, w]) => `${u} ${w}w`).join(", ")}" sizes="${SIZES[img.purpose]}" `
    + `width="${largest[1]}" height="${h}" alt="${img.decorative ? "" : esc(img.alt)}" ${loading}>`;
  const picture = `<picture><source type="image/avif" srcset="${out.avif.join(", ")}" sizes="${SIZES[img.purpose]}">`
    + `<source type="image/webp" srcset="${out.webp.join(", ")}" sizes="${SIZES[img.purpose]}">${imgTag}</picture>`;
  const html = img.caption ? `<figure>${picture}<figcaption>${esc(img.caption)}</figcaption></figure>` : picture;
  fs.writeFileSync(path.join(outDir, `${img.id}.html`), html + "\n");
  report.accepted.push({ id: img.id, purpose: img.purpose, person: img.person || null, widths, width: largest[1], height: h,
    bytes: fs.readdirSync(outDir).filter((f) => f.startsWith(`${img.id}-`)).reduce((n, f) => n + fs.statSync(path.join(outDir, f)).size, 0) });
}
fs.writeFileSync(path.join(outDir, "images-report.json"), JSON.stringify(report, null, 1) + "\n");
console.log(`images: ${report.accepted.length} accepted, ${report.refused.length} refused, ${report.missing.length} missing`);
for (const r of report.refused) console.log(`  refused ${r.id}: ${r.why.join("; ")}`);
for (const m of report.missing) console.log(`  missing ${m.id}: ${m.file || "(no file)"} (${m.purpose}); skipped, the rest continue`);
process.exit(0);
