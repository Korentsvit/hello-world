// Proves the image checks fail on real breakage and skip only content that is not rendered:
//   node test-image-checks.mjs [site-dir]
// Copies the site to a temporary directory and breaks two Programme Room images: stage 1 (the panel shown on load)
// and stage 3 (a closed tab panel). Then:
//   check-pages.mjs must fail on the stage-1 image, and log the stage-3 image as SKIP with its reason
//     (it is inside the closed panel) rather than pass it silently;
//   test-programme-room.mjs, which opens all six stages, must fail on both images.
// The unmodified site is run as a control.
import { spawnSync } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
const here = path.dirname(new URL(import.meta.url).pathname);
const site = path.resolve(process.argv[2] || path.join(here, "../release-032/site"));
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + d}`); };
const run = (script, dir, ...args) => { const r = spawnSync("node", [path.join(here, script), dir, ...args], { cwd: here, encoding: "utf8", timeout: 900000 }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nwpt-imgcheck-"));
const broken = path.join(tmp, "site"); fs.cpSync(site, broken, { recursive: true });
const page = path.join(broken, "programme-room.html");
const VISIBLE = "glass-thresholds-light-", HIDDEN = "softgel-isolated-dark-";   // stage 1 (need) and stage 3 (phase-1)
let html = fs.readFileSync(page, "utf8");
for (const k of [VISIBLE, HIDDEN]) { if (!html.includes(k)) throw new Error("image not found in page: " + k); html = html.split(k).join(k + "MISSING-"); }
fs.writeFileSync(page, html);

try {
  const ctl = run("check-pages.mjs", site, "/programme-room");
  check("control: check-pages passes the unmodified page", ctl.code === 0, ctl.out.slice(-400));
  check("control: closed-panel images are logged as SKIP with a reason", /SKIP .*inside hidden #stage-/.test(ctl.out), ctl.out.slice(-400));

  const cp = run("check-pages.mjs", broken, "/programme-room");
  const fails = cp.out.split("\n").filter((l) => l.startsWith("FAIL")), skips = cp.out.split("\n").filter((l) => l.startsWith("SKIP"));
  check("check-pages fails on the broken image in the visible panel", cp.code === 1 && fails.some((l) => l.includes(VISIBLE + "MISSING-")), fails.join("\n") || cp.out.slice(-400));
  check("check-pages logs the closed-panel image as SKIP, with its reason", skips.some((l) => l.includes(HIDDEN + "MISSING-") && l.includes("inside hidden #stage-phase-1")), skips.join("\n"));
  check("check-pages skips nothing that is rendered", !skips.some((l) => l.includes(VISIBLE)), skips.join("\n"));

  const rt = run("test-programme-room.mjs", broken);
  const rf = rt.out.split("\n").filter((l) => l.startsWith("FAIL"));
  check("room test fails when the stage-1 image is broken", rt.code === 1 && rf.some((l) => l.includes("stage-need: one image")), rf.join("\n"));
  check("room test fails when the stage-3 image is broken (found by opening the stage)", rf.some((l) => l.includes("stage-phase-1: one image")), rf.join("\n"));
  check("room test flags no other stage", rf.filter((l) => / stage-[a-z0-9-]+: one image/.test(l)).every((l) => /stage-(need|phase-1):/.test(l)), rf.join("\n"));
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(`image checks: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
