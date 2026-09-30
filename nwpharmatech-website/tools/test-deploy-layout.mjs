// Deployment layout check for the site directory Grok deploys (Cloudflare Pages runtime, wrangler pages dev):
//   node test-deploy-layout.mjs [site-dir]
// functions/ lives INSIDE the site directory (release-032/site/functions). Pages compiles it only when wrangler runs
// from that directory. This check serves the site both ways:
//   inside  (cwd = site/, `pages dev .`)       -> /api/enquiry must execute and answer JSON
//   parent  (cwd = release-032/, `pages dev site`) -> the API does NOT execute: the mistaken deploy
// and confirms that no function source, generated helper, content source or tooling file is served publicly.
import { serve } from "./lib/cf-serve.mjs";
const dir = process.argv[2] || "../release-032/site";
let pass = 0, fail = 0; const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"}  ${n}${ok ? "" : "  --  " + d}`); };
const PRIVATE = ["/functions", "/functions/", "/functions/functions/[[path]].js", "/functions/api/enquiry.js", "/functions/api/_lib/wwu-cards.js", "/functions/api/subscribe.js", "/api/_lib/wwu-cards.js", "/api/_lib/wwu-cards",
  "/_lib/wwu-cards.js", "/source/work-with-us.json", "/source/programme-room.json", "/tools/build-work-with-us.py", "/_headers", "/_redirects"];
const leaks = async (base) => {
  const out = [];
  for (const p of PRIVATE) {
    const r = await fetch(base + p, { redirect: "manual" }); const t = await r.text();
    if (r.status === 200 && /export (async )?function|export const WWU|"cards"|Content-Security-Policy|^\/\S+ \/\S+ 30\d/m.test(t)) out.push(`${p} (${r.status})`);
    if (p.startsWith("/functions") && r.status !== 404) out.push(`${p} answered ${r.status}, expected 404`);
  }
  return out;
};
{
  const srv = await serve(dir);
  const r = await fetch(srv.base + "/api/enquiry"); const ct = r.headers.get("content-type") || ""; const j = ct.includes("json") ? await r.json() : null;
  check("inside site/: /api/enquiry executes (JSON, unconfigured)", r.status === 200 && j && j.configured === false && j.version === "wwu-1", `${r.status} ${ct}`);
  const p = await fetch(srv.base + "/api/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  check("inside site/: POST answers 503 not_configured", p.status === 503 && (await p.json()).code === "not_configured");
  const l = await leaks(srv.base); check("inside site/: no function source, helper, content source or tooling served", !l.length, l.join(", "));
  srv.stop();
}
{
  const srv = await serve(dir, [], { fromParent: true });
  const r = await fetch(srv.base + "/api/enquiry"); const ct = r.headers.get("content-type") || "";
  check("from the parent directory: the API does not execute (the deploy mistake this guards against)", !ct.includes("json"), `${r.status} ${ct}`);
  srv.stop();
}
console.log(`deploy layout: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
