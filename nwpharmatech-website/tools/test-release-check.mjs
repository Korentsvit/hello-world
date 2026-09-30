// Negative controls for tools/release-check.mjs: a small site with one planted defect per check must fail
// exactly those checks, and a clean copy must pass.   node test-release-check.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const page = (title, body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="icon" href="data:,"></head>`
  + `<body><header><nav aria-label="Main"><a href="/">Home</a> <a href="/about">About</a> <a href="/study">Study</a></nav></header><main><h1>${title}</h1>${body}</main></body></html>`;
function site(defects) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "rc-site-"));
  fs.mkdirSync(path.join(d, "img")); fs.mkdirSync(path.join(d, "downloads"));
  fs.writeFileSync(path.join(d, "img/a.png"), png);
  fs.writeFileSync(path.join(d, "downloads/brief.pdf"), "%PDF-1.4\n%%EOF\n");
  fs.writeFileSync(path.join(d, "_redirects"), defects ? "/old /older 301\n/older /about 301\n" : "/old /about 301\n");
  fs.writeFileSync(path.join(d, "index.html"), page("Home", `<p><a href="/old">Old address</a> <a href="/downloads/brief.pdf">Brief</a> <a href="mailto:info@example.org">Email</a> `
    + `<a href="${defects ? "tel:+44 20 ABC" : "tel:+442071234567"}">Call</a> <a href="/about#team">Team</a></p>`
    + `<img src="/img/a.png" alt="A" width="1" height="1">`));
  fs.writeFileSync(path.join(d, "about.html"), page("About", `<h2 id="team">Team</h2>${defects ? '<img src="/img/missing.png" alt="gone" width="1" height="1"><img src="/img/a.png">' : ""}`
    + `<p><a href="/study">Study</a></p>`));
  fs.writeFileSync(path.join(d, "404.html"), page("Not found", "<p>No page here.</p>"));
  fs.writeFileSync(path.join(d, "study.html"), page("Study", defects ? `<div style="width:2000px">wide</div><a href="/nowhere">Broken</a>` : "<p>Study.</p>"));
  return d;
}
const run = (dir) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "rc-out-"));
  const p = spawnSync("node", [path.join(here, "release-check.mjs"), dir, out], { encoding: "utf8", timeout: 600000 });
  const rep = JSON.parse(fs.readFileSync(path.join(out, "release-report.json"), "utf8"));
  fs.rmSync(out, { recursive: true, force: true });
  return { code: p.status, fails: rep.results.filter((r) => !r.ok).map((r) => r.name) };
};
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  --  " + detail}`); };
const clean = run(site(false));
check("clean site: every check passes, exit 0", clean.code === 0 && clean.fails.length === 0, clean.fails.join(" | "));
const bad = run(site(true));
const has = (re) => bad.fails.some((f) => re.test(f));
check("defects: exit code 1", bad.code === 1, String(bad.code));
check("catches a redirect chain", has(/\/old.*at most one redirect/));
check("catches a broken internal link", has(/-> \/nowhere resolves/));
check("catches a malformed tel: link", has(/tel well formed/));
check("catches an image that does not load", has(/every image loads/));
check("catches an image without alt", has(/every image has alt/));
check("catches an image without width and height", has(/width and height/));
const noNotFound = site(false); fs.rmSync(path.join(noNotFound, "404.html"));
check("catches a site without a 404 page (Cloudflare would serve the home page for every unknown path)", run(noNotFound).fails.some((f) => /unknown path answers 404/.test(f)));
check("catches horizontal scroll on mobile", has(/\/study @390px: no horizontal scroll/));
console.log(`release-check negative controls: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
