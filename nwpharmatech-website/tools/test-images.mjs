// Tests tools/prepare-images.mjs with synthetic images (no real asset is needed or used).
//   node test-images.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sharp = createRequire(import.meta.url)("sharp");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "img-test-"));
const src = path.join(tmp, "src"), out = path.join(tmp, "out");
fs.mkdirSync(src);
await sharp({ create: { width: 2400, height: 1350, channels: 3, background: "#3a6ea5" } }).jpeg().toFile(path.join(src, "wide.jpg"));
await sharp({ create: { width: 600, height: 800, channels: 3, background: "#777" } }).jpeg().toFile(path.join(src, "face.jpg"));
await sharp({ create: { width: 900, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(path.join(src, "diagram.png"));
const intake = { source_dir: "src", images: [
  { id: "hero-lab", file: "wide.jpg", purpose: "hero", alt: "Laboratory bench with sample vials", caption: "Illustrative image of a formulation laboratory." },
  { id: "diagram", file: "diagram.png", purpose: "diagram", alt: "How a lipid formulation disperses in the gut" },
  { id: "portrait-ok", file: "face.jpg", purpose: "portrait", alt: "Portrait of A. Person", person: "a-person", authorised: true, authorised_by: "A. Person", authorised_on: "2026-09-20" },
  { id: "portrait-unauth", file: "face.jpg", purpose: "portrait", alt: "Portrait of B. Person", person: "b-person" },
  { id: "portrait-missing", file: "nobody.jpg", purpose: "portrait", alt: "Portrait of C. Person", person: "c-person", authorised: true, authorised_by: "C", authorised_on: "2026-09-20" },
  { id: "claim", file: "wide.jpg", purpose: "illustration", alt: "Capsules", caption: "A softgel proven to reduce symptoms." },
  { id: "claim-reviewed", file: "wide.jpg", purpose: "illustration", alt: "Capsules", caption: "Softgels are designed to improve absorption; whether this reduces symptoms is untested.", caption_reviewed: "Medical reviewer, 2026-09-24" },
  { id: "no-alt", file: "wide.jpg", purpose: "illustration" },
] };
fs.writeFileSync(path.join(tmp, "intake.json"), JSON.stringify(intake));
const log = execFileSync("node", [path.join(here, "prepare-images.mjs"), path.join(tmp, "intake.json"), out], { encoding: "utf8" });
const rep = JSON.parse(fs.readFileSync(path.join(out, "images-report.json"), "utf8"));
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  --  " + detail}`); };
const ids = (k) => rep[k].map((x) => x.id).sort().join(",");
check("accepted: hero, diagram, authorised portrait, reviewed caption", ids("accepted") === "claim-reviewed,diagram,hero-lab,portrait-ok", ids("accepted"));
check("refused: unauthorised portrait, unreviewed claim caption, missing alt", ids("refused") === "claim,no-alt,portrait-unauth", ids("refused"));
check("missing portrait file is reported and does not stop the others", ids("missing") === "portrait-missing" && /1 missing/.test(log), log);
const hero = fs.readFileSync(path.join(out, "hero-lab.html"), "utf8");
check("hero: AVIF and WebP sources, width/height set, fetchpriority, caption", /type="image\/avif"/.test(hero) && /type="image\/webp"/.test(hero)
  && /width="1920" height="1080"/.test(hero) && /fetchpriority="high"/.test(hero) && /<figcaption>Illustrative image/.test(hero), hero.slice(0, 300));
const face = fs.readFileSync(path.join(out, "portrait-ok.html"), "utf8");
check("portrait: never upscaled past the source (600 px), lazy-loaded", /width="600" height="800"/.test(face) && !/720w/.test(face) && /loading="lazy"/.test(face), face.slice(0, 300));
check("transparent diagram keeps a PNG fallback", fs.existsSync(path.join(out, "diagram-800.png")) && !fs.existsSync(path.join(out, "diagram-800.jpg")));
const avif = fs.statSync(path.join(out, "hero-lab-1920.avif")).size, jpg = fs.statSync(path.join(out, "hero-lab-1920.jpg")).size;
check(`AVIF smaller than the JPEG fallback (${avif} vs ${jpg} bytes)`, avif < jpg);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`image pipeline tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
