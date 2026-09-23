// Route tests under Cloudflare-compatible hosting: serves ../public (and ../restricted) with Cloudflare's
// own Pages runtime (`wrangler pages dev`, workerd), then follows every route hop by hop.
//   cd tools && npm install && node test-routes.mjs
// Writes ../docs/qa/routes-report.json. Exits non-zero on any failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import os from "node:os";
import { serve, walk } from "./lib/cf-serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(process.env.PUBLIC_DIR || path.join(here, "../public"));
const res = path.resolve(process.env.RESTRICTED_DIR || path.join(here, "../restricted"));
const SITE = "https://www.nwpharmatech.org";
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass: !!pass, detail });
  if (!pass) console.log(`FAIL  ${name}${detail ? `\n      ${detail}` : ""}`);
};

const pathOf = (u) => { const x = new URL(u, "http://x"); return x.pathname + x.hash; };

const report = { generated: new Date().toISOString(), server: "wrangler pages dev (Cloudflare workerd runtime)", public: {}, restricted: {} };
const pages = fs.readdirSync(pub).filter((f) => f.endsWith(".html") && f !== "404.html").sort();
const route = (f) => (f === "index.html" ? "/" : "/" + f.replace(/\.html$/, ""));
const redirects = fs.readFileSync(path.join(pub, "_redirects"), "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.trim().split(/\s+/));

const srv = await serve(pub);
try {
  const b = srv.base;
  // 1. Every page route answers 200 directly, with the matching canonical URL.
  for (const f of pages) {
    const w = await walk(b, route(f));
    const canon = (w.body.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
    check(`route ${route(f)}: 200 with no redirect`, w.chain.length === 1 && w.final?.status === 200, JSON.stringify(w.chain));
    check(`route ${route(f)}: canonical is ${SITE}${route(f)}`, canon === SITE + route(f), `canonical=${canon}`);
    report.public[route(f)] = w.chain;
  }
  // 2. Existing public URLs: every earlier .html address (drafts 2 and 3 linked pages this way) reaches its
  //    route in exactly one permanent redirect; /index.html and trailing-slash forms likewise.
  const legacy = [...pages.map((f) => ["/" + f, route(f)]), ...pages.filter((f) => f !== "index.html").map((f) => [route(f) + "/", route(f)])];
  for (const [from, to] of legacy) {
    const w = await walk(b, from);
    const ok = w.chain.length === 2 && [301, 308].includes(w.chain[0].status) && pathOf(w.chain[0].location) === to && w.final?.status === 200;
    check(`existing URL ${from} -> ${to} in one permanent redirect`, ok, JSON.stringify(w.chain));
    report.public[from] = w.chain;
  }
  // Fragment deep links published in draft 3: the redirect keeps the page (browsers carry the fragment across
  // it), and the fragment still names an element on that page.
  for (const [from, to, frag] of [["/faq.html", "/faq", "urgent-help"], ["/faq.html", "/faq", "not-medical-advice"],
    ["/evidence.html", "/evidence", "ref-salazar-2021"], ["/study.html", "/study", "milestones"]]) {
    const w = await walk(b, from);
    check(`existing deep link ${from}#${frag} -> ${to}#${frag}`, pathOf(w.chain[0].location || "") === to && w.body.includes(`id="${frag}"`), JSON.stringify(w.chain));
  }
  // Known live address (nwpharmatech.com); the full live URL list has not been supplied.
  for (const from of ["/contactus", "/contactus/"]) {
    const w = await walk(b, from);
    check(`live address ${from} -> /contact in one redirect`, w.chain.length === 2 && pathOf(w.chain[0].location) === "/contact" && w.final?.status === 200, JSON.stringify(w.chain));
  }
  // 3. Every alias in _redirects: one hop, permanent, to a page that answers 200 without a further redirect.
  for (const [from, to, code] of redirects) {
    const w = await walk(b, from);
    const frag = to.split("#")[1];
    const ok = w.chain.length === 2 && w.chain[0].status === Number(code) && pathOf(w.chain[0].location) === to && w.final?.status === 200
      && (!frag || w.body.includes(`id="${frag}"`));
    check(`alias ${from} -> ${to} (${code}), no chain${frag ? ", fragment exists" : ""}`, ok, JSON.stringify(w.chain));
    report.public[from] = w.chain;
  }
  // 4. The draft-3 redirect rules that looped (/study -> /study.html -> /study ...) are gone.
  for (const p of ["/study", "/phase-1", "/science", "/evidence", "/families", "/people", "/updates"]) {
    const w = await walk(b, p);
    check(`former loop ${p}: now 200 directly`, !w.loop && w.chain.length === 1 && w.final?.status === 200, JSON.stringify(w.chain));
  }
  // 5. Unknown addresses: 404 status with the site's 404 page (not a soft 200).
  for (const p of ["/no-such-page", "/study/extra", "/phase-2b.html"]) {
    const w = await walk(b, p);
    check(`unknown ${p}: 404 page`, w.final?.status === 404 && /Page not found/.test(w.body), JSON.stringify(w.chain));
  }
  // 6. Every internal link on every page resolves without any redirect.
  const seen = new Set();
  for (const f of pages) {
    const html = fs.readFileSync(path.join(pub, f), "utf8");
    for (const [, u] of html.matchAll(/\b(?:href|src)="(\/[^"#]*)/g)) seen.add(u);
  }
  for (const u of [...seen].sort()) {
    const w = await walk(b, u);
    check(`internal link ${u}: 200 without redirect`, w.chain.length === 1 && w.final?.status === 200, JSON.stringify(w.chain));
  }
  // 7. Sitemap entries are final URLs.
  const locs = [...fs.readFileSync(path.join(pub, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) {
    const w = await walk(b, loc.replace(SITE, "") || "/");
    check(`sitemap ${loc}: 200 without redirect`, w.chain.length === 1 && w.final?.status === 200, JSON.stringify(w.chain));
  }
  check("sitemap excludes the noindex financing page", !locs.some((l) => l.endsWith("/financing")));
  // 8. Headers and downloads.
  const home = await fetch(b + "/");
  const staging = /Disallow: \/\n/.test(fs.readFileSync(path.join(pub, "robots.txt"), "utf8"));
  check("CSP header present", /script-src 'self'/.test(home.headers.get("content-security-policy") || ""));
  if (staging) check("staging: X-Robots-Tag noindex on pages", /noindex/.test(home.headers.get("x-robots-tag") || ""));
  const fin = await fetch(b + "/financing");
  check("/financing: X-Robots-Tag noindex", /noindex/.test(fin.headers.get("x-robots-tag") || ""));
  for (const d of fs.readdirSync(path.join(pub, "downloads"))) {
    const r = await fetch(`${b}/downloads/${d}`);
    const type = r.headers.get("content-type") || "";
    const want = d.endsWith(".pdf") ? "application/pdf" : "";
    check(`download /downloads/${d}: 200${want ? " " + want : ""}`, r.status === 200 && (!want || type.startsWith(want)), `${r.status} ${type}`);
    await r.arrayBuffer();
  }
} finally {
  srv.stop();
}

// Production headers and robots: built into a copy of public/ with build.py's own write_meta_files, then served.
{
  const prod = fs.mkdtempSync(path.join(os.tmpdir(), "routes-prod-"));
  fs.cpSync(pub, prod, { recursive: true });
  const py = `import sys; sys.path.insert(0, ${JSON.stringify(path.resolve(here, ".."))}); import build, pathlib, json
out = pathlib.Path(${JSON.stringify(prod)})
names = sorted(p.name for p in (build.SRC / "pages").glob("*.html"))
pdfs = sorted(json.loads((build.SRC / "downloads" / "pdf-manifest.json").read_text()))
build.write_meta_files(out, "production", names, build.SRC / "downloads", pdfs)`;
  const w = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  check("production meta files written for the test", w.status === 0, w.stderr);
  const ps = await serve(prod);
  try {
    const robots = await (await fetch(ps.base + "/robots.txt")).text();
    check("production robots.txt does not block /financing (crawlers must be able to see its noindex)", !/Disallow: \/financing/.test(robots) && /Sitemap:/.test(robots), robots);
    const fin = await fetch(ps.base + "/financing");
    check("production /financing: X-Robots-Tag noindex", /noindex/.test(fin.headers.get("x-robots-tag") || ""), fin.headers.get("x-robots-tag"));
    const study = await fetch(ps.base + "/study");
    check("production /study: no X-Robots-Tag noindex", !/noindex/.test(study.headers.get("x-robots-tag") || ""), study.headers.get("x-robots-tag"));
    await fin.arrayBuffer(); await study.arrayBuffer();
  } finally {
    ps.stop();
    fs.rmSync(prod, { recursive: true, force: true });
  }
}

// Restricted project: the _worker.js guard must fail closed however the project is deployed: from inside the
// folder (as documented) and from its parent folder (the mistake that skips a functions/ directory).
if (fs.existsSync(path.join(res, "_worker.js"))) {
  for (const fromParent of [false, true]) {
    const how = fromParent ? "deployed from the parent folder" : "deployed from inside the folder";
    const rs = await serve(res, [], { fromParent });
    try {
      for (const p of ["/", "/financing-structure", "/investor-journey", "/funding-figures", "/financing-structure.html", "/_worker.js", "/no-such-page"]) {
        const r = await fetch(rs.base + p, { redirect: "manual" });
        const t = await r.text();
        check(`restricted (${how}) ${p}: fails closed without Access configuration (503, no page, no source)`, r.status === 503 && !/<html|ACCESS_AUD/i.test(t), `${r.status}`);
        report.restricted[`${fromParent ? "parent" : "inside"} ${p}`] = r.status;
      }
    } finally {
      rs.stop();
    }
  }
  // Configured for Access, but the request carries no token / an invalid token: refused, never served.
  // (Token verification itself, including valid tokens and the 405 for writes, is unit-tested in test-access.mjs.)
  const rc = await serve(res, ["ACCESS_TEAM_DOMAIN=example.cloudflareaccess.com", "ACCESS_AUD=test-aud"], { fromParent: true });
  try {
    const none = await fetch(rc.base + "/", { redirect: "manual" });
    const noneBody = await none.text();
    check("restricted, Access configured, no token: 403 and no page content", none.status === 403 && !/<html/i.test(noneBody), String(none.status));
    const bad = await fetch(rc.base + "/", { headers: { "cf-access-jwt-assertion": "e30.e30.sig" } });
    const badBody = await bad.text();
    check("restricted, Access configured, invalid token: refused and no page content", [403, 503].includes(bad.status) && !/<html/i.test(badBody), String(bad.status));
    report.restricted.configured = { noToken: none.status, invalidToken: bad.status };
  } finally {
    rc.stop();
  }
} else {
  check("restricted project has its _worker.js guard", false);
}

// Serving must never write into the deployable folders (wrangler keeps its state in a temporary copy).
for (const dir of [pub, res]) {
  const hidden = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith(".")) : [];
  check(`${path.basename(dir)}/ contains no hidden files or tool state after testing`, hidden.length === 0, hidden.join(", "));
}

const failed = results.filter((r) => !r.pass);
report.checks = results;
fs.mkdirSync(path.resolve(here, "../docs/qa"), { recursive: true });
fs.writeFileSync(process.env.ROUTES_REPORT || path.resolve(here, "../docs/qa/routes-report.json"), JSON.stringify(report, null, 1));
console.log(`route tests: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
