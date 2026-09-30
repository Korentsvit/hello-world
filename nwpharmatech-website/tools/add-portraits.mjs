// Publishes whichever authorised team portraits are present, without waiting for the full set:
//   node add-portraits.mjs <site-dir>
// For each <site-dir>/assets/team/<person>.jpg listed below that exists:
// - makes consistent square WebP crops (240 and 480 px; sharp's attention crop keeps the face);
// - replaces that person's initials avatar on team.html and on the homepage leadership card.
// People without a file keep their initials. Nothing is generated or substituted.
// Safe to rerun: a person whose card already shows a photograph (for example the NWPT-035 portraits, wired as
// <img class="team-card__photo" src="assets/team/<id>.jpg">) is left exactly as it is, and no crop is ever
// larger than its source (no upscaling).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const sharp = createRequire(import.meta.url)("sharp");
const site = path.resolve(process.argv[2] || "");
const teamDir = path.join(site, "assets", "team");
if (!fs.existsSync(path.join(site, "team.html"))) { console.error("usage: node add-portraits.mjs <site-dir>"); process.exit(2); }

const PEOPLE = {   // file id -> name as printed on the cards, initials used by the avatar
  "scott-woods": ["Professor Scott Woods", "SW"], "grace-blest-hopley": ["Dr Grace Blest-Hopley", "GB"],
  "john-kane": ["Dr John Kane, MD", "JK"], "filipp-korentsvit": ["Filipp Korentsvit", "FK"],
  "daud-gutseriev": ["Daud Gutseriev", "DG"], "richard-barker": ["Prof. Richard Barker, OBE", "RB"],
  "trevor-jones": ["Prof. Trevor Jones", "TJ"], "gillian-cannon": ["Gillian Cannon", "GC"],
};
const V = "?v=" + new Date().toISOString().slice(0, 10).replace(/-/g, "");
let team = fs.readFileSync(path.join(site, "team.html"), "utf8");
let home = fs.readFileSync(path.join(site, "index.html"), "utf8");
const done = [], missing = [], kept = [], lowres = [];
for (const [id, [name, initials]] of Object.entries(PEOPLE)) {
  const src = path.join(teamDir, `${id}.jpg`);
  if (!fs.existsSync(src)) { missing.push(`${id}.jpg (${name})`); continue; }
  if (new RegExp(`<img class="team-card__photo[^"]*" src="assets/team/${id}[.-]`).test(team)) { kept.push(id); continue; }   // already wired: keep as deployed
  const meta = await sharp(src).metadata();
  const sizes = [240, 480].filter((s) => s <= Math.min(meta.width, meta.height));
  if (!sizes.length) { lowres.push(`${id} (${meta.width}x${meta.height})`); continue; }
  for (const s of sizes) await sharp(src).resize(s, s, { fit: "cover", position: sharp.strategy.attention }).webp({ quality: 80 }).toFile(path.join(teamDir, `${id}-${s}.webp`));
  const img = (cls, size) => `<img class="${cls}" src="assets/team/${id}-240.webp${V}" srcset="assets/team/${id}-240.webp${V} 240w, assets/team/${id}-480.webp${V} 480w" sizes="${size}" width="240" height="240" alt="Portrait of ${name}" loading="lazy" decoding="async" />`;
  // team.html: the avatar inside <article id="<id>">
  team = team.replace(new RegExp(`(<article[^>]*id="${id}"[\\s\\S]*?)<div class="team-card__avatar[^"]*" aria-hidden="true">${initials}</div>`),
    (m, pre) => pre + img("team-card__photo", "6rem"));
  // homepage leadership card (only the three scientific leads have one)
  home = home.replace(new RegExp(`<div class="home-person-card__avatar" aria-hidden="true">${initials}</div>(\\s*<h3>${name.replace(/[.,]/g, "\\$&")}</h3>)`),
    (m, h3) => img("home-person-card__photo", "4rem") + h3);
  done.push(id);
}
fs.writeFileSync(path.join(site, "team.html"), team);
fs.writeFileSync(path.join(site, "index.html"), home);
console.log(`portraits published: ${done.length ? done.join(", ") : "none"}`);
if (kept.length) console.log(`already on the page, left unchanged: ${kept.join(", ")}`);
if (lowres.length) console.log(`too small to crop without upscaling (wire by hand, as NWPT-035 did): ${lowres.join(", ")}`);
console.log(`still missing (${missing.length}/8): ${missing.join("; ") || "none"}`);
