// Route tests under Cloudflare-compatible hosting: serves ../public (and ../restricted) with Cloudflare's
// own Pages runtime (`wrangler pages dev`, workerd), then follows every route hop by hop.
//   cd tools && npm install && node test-routes.mjs
// Writes ../docs/qa/routes-report.json. Exits non-zero on any failure.
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(process.env.PUBLIC_DIR || path.join(here, "../public"));
const res = path.resolve(process.env.RESTRICTED_DIR || path.join(here, "../restricted"));
const SITE = "https://www.nwpharmatech.org";
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass: !!pass, detail });
  if (!pass) console.log(`FAIL  ${name}${detail ? `\n      ${detail}` : ""}`);
};

const freePort = () => new Promise((r) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
// Each project is served from inside its own folder, as docs/deployment.md requires for deployment:
// Cloudflare Pages only runs functions/ from the directory wrangler is run in.
async function serve(dir, bindings = []) {
  const port = await freePort();
  const bin = path.join(here, "node_modules/.bin/wrangler");
  const extra = bindings.flatMap((b) => ["--binding", b]);
  const proc = spawn(bin, ["pages", "dev", ".", "--port", String(port), "--ip", "127.0.0.1", "--compatibility-date", "2025-01-01", "--log-level", "error", ...extra],
    { cwd: dir, env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1", NO_COLOR: "1" }, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    try { await fetch(base + "/", { redirect: "manual" }); return { base, proc, log: () => log }; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  proc.kill();
  throw new Error(`wrangler did not start for ${dir}:\n${log}`);
}

// Follow redirects one hop at a time; returns the chain of [status, location].
async function walk(base, p, init = {}) {
  const chain = [];
  let url = new URL(p, base).href;
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { redirect: "manual", ...init });
    const loc = r.headers.get("location");
    chain.push({ url: url.replace(base, ""), status: r.status, location: loc });
    if (![301, 302, 307, 308].includes(r.status) || !loc) return { chain, final: r, body: await r.text() };
    url = new URL(loc, url).href;
  }
  return { chain, final: null, body: "", loop: true };
}
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
  // Fragment deep links published in draft 3 keep working through the redirect (browsers carry the fragment).
  for (const [from, to] of [["/faq.html", "/faq"], ["/study.html", "/study"], ["/evidence.html", "/evidence"]]) {
    const w = await walk(b, from);
    check(`existing deep link ${from}#... keeps its page`, pathOf(w.chain[0].location || "") === to);
  }
  // 3. Every alias in _redirects: one hop, permanent, to a page that answers 200 without a further redirect.
  for (const [from, to, code] of redirects) {
    const w = await walk(b, from);
    const ok = w.chain.length === 2 && w.chain[0].status === Number(code) && pathOf(w.chain[0].location) === to && w.final?.status === 200;
    check(`alias ${from} -> ${to} (${code}), no chain`, ok, JSON.stringify(w.chain));
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
  srv.proc.kill();
}

// Restricted project: must fail closed when Access is not configured, and refuse writes.
if (fs.existsSync(path.join(res, "functions"))) {
  const rs = await serve(res);
  try {
    for (const p of ["/", "/financing-structure", "/investor-journey", "/funding-figures", "/financing-structure.html"]) {
      const r = await fetch(rs.base + p, { redirect: "manual" });
      const t = await r.text();
      check(`restricted ${p}: fails closed without Access configuration (503)`, r.status === 503 && !/<html/i.test(t), `${r.status}`);
      report.restricted[p] = r.status;
    }
    const post = await fetch(rs.base + "/investor-journey", { method: "POST", body: "x" });
    check("restricted POST refused", post.status >= 400, String(post.status));
    const src = await fetch(rs.base + "/functions/_middleware.js");
    check("restricted: function source not served", src.status === 503, String(src.status));
    await src.text();
  } finally {
    rs.proc.kill();
  }
  // Configured for Access, but the request carries no token / an invalid token: refused, never served.
  const rc = await serve(res, ["ACCESS_TEAM_DOMAIN=example.cloudflareaccess.com", "ACCESS_AUD=test-aud"]);
  try {
    const none = await fetch(rc.base + "/", { redirect: "manual" });
    const noneBody = await none.text();
    check("restricted, Access configured, no token: 403 and no page content", none.status === 403 && !/<html/i.test(noneBody), String(none.status));
    const bad = await fetch(rc.base + "/", { headers: { "cf-access-jwt-assertion": "e30.e30.sig" } });
    const badBody = await bad.text();
    check("restricted, Access configured, invalid token: refused (403 or 503) and no page content", [403, 503].includes(bad.status) && !/<html/i.test(badBody), String(bad.status));
    report.restricted.configured = { noToken: none.status, invalidToken: bad.status };
  } finally {
    rc.proc.kill();
  }
}

const failed = results.filter((r) => !r.pass);
report.checks = results;
fs.mkdirSync(path.resolve(here, "../docs/qa"), { recursive: true });
fs.writeFileSync(process.env.ROUTES_REPORT || path.resolve(here, "../docs/qa/routes-report.json"), JSON.stringify(report, null, 1));
console.log(`route tests: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
