// Integration package tests: every module in ../integration/modules/ on its own and inside a hostile host page.
//   python3 build.py && cd tools && npm install && node test-integration.mjs
// Per module:
//   - static: scoped CSS (every selector starts with the weighted .nwpt-module scope), links underlined explicitly,
//     prefixed classes, no inline script/style/handlers, no site chrome, manifest complete and free of internal
//     fields, file hashes match, links all resolvable (routes.json, a file in integration/downloads or assets, an
//     in-module #anchor, or external), blocking dependencies listed as publication blockers;
//   - docs/integration.md: every #anchor its module section names exists, every anchor other pages link to and every
//     alias redirect is named, and its optional assets match the manifest;
//   - preview.html under its strict CSP: no console errors, no securitypolicyviolation, no request to another origin,
//     no horizontal scroll at 320px;
//   - axe (WCAG 2.0/2.1 A and AA, WCAG 2.2 AA) inside the module: no violations, in the preview and inside a hostile
//     host page that resets link underlines (with a negative control: a host !important reset is detected);
//   - collisions: host elements keep exactly their computed styles when module.css is added; the host's generic class
//     rules and custom properties, and element rules written for the host's content area (#content, .entry-content
//     ancestors), do not change any property the module sets;
//   - evidence-library filters work in the preview, by mouse and keyboard, and a link to a card in a hidden topic
//     (in the module or by address) shows every topic again.
// Plus: public-safe content export, a deterministic export (same input, same bytes), live paths changed in one place
// (with refusals for unsafe paths and redirect sets, and the redirects run under Cloudflare's own runtime), and the
// family guide's urgent-help dependency cleared only by a recorded check.
// Writes ../docs/qa/integration-report.json and preview screenshots ../docs/qa/screenshots/module-*.png.
// Exits non-zero on any failure.
import { chromium } from "playwright-core";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { serve, walk } from "./lib/cf-serve.mjs";

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "..");
const integ = path.join(site, "integration");
const pub = path.join(site, "public");
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${!pass && detail ? `\n      ${String(detail).slice(0, 1200)}` : ""}`);
};

if (!fs.existsSync(path.join(integ, "modules"))) {
  console.log("FAIL  integration/modules/ not found: run python3 build.py first");
  process.exit(1);
}
const routes = JSON.parse(fs.readFileSync(path.join(integ, "routes.json"), "utf8"));
const MODULES = fs.readdirSync(path.join(integ, "modules")).sort();
const read = (...p) => fs.readFileSync(path.join(integ, ...p), "utf8");
const exists = (...p) => fs.existsSync(path.join(integ, ...p));
const INTERNAL = ["review", "notes", "note", "location", "results_review", "verification_needed", "by"];
const CHROME = ["site-header", "site-footer", "site-nav", "mobile-nav", "nav-toggle", "notice-bar", "env-banner", "env-restricted", "skip-link", "subnav"];
check("integration: the six agreed modules are exported",
  ["evidence-library", "family-guide", "formulation", "newsroom", "phase-1", "study-hub"].every((m) => MODULES.includes(m)), MODULES.join(", "));

// ---------- helpers ----------
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
// Selectors of every style rule, at any @media/@supports depth; at-rule preludes separately.
function cssSelectors(css) {
  const sels = [], ats = [];
  const walk = (t) => {
    let i = 0;
    while (i < t.length) {
      const j = t.indexOf("{", i);
      if (j < 0) break;
      const prelude = t.slice(i, j).trim();
      let depth = 1, k = j + 1;
      while (depth && k < t.length) { if (t[k] === "{") depth++; else if (t[k] === "}") depth--; k++; }
      if (prelude.startsWith("@")) { ats.push(prelude); if (/^@(media|supports)/.test(prelude)) walk(t.slice(j + 1, k - 1)); }
      else sels.push(...prelude.split(/,(?![^(]*\))/).map((s) => s.trim()));
      i = k;
    }
  };
  walk(stripComments(css));
  return { sels, ats };
}
const attrs = (html, name) => [...html.matchAll(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "g"))].map((m) => m[2] ?? m[3] ?? m[4]);
const unescapeHtml = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const pagePaths = new Map(Object.entries(routes.pages).map(([id, p]) => [p, id]));
const findInternal = (o, trail = "") => {
  if (Array.isArray(o)) return o.flatMap((x, i) => (x && typeof x === "object" && x.public === false ? [`${trail}[${i}] public:false`] : findInternal(x, `${trail}[${i}]`)));
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => (INTERNAL.includes(k) ? [`${trail}.${k}`] : findInternal(v, `${trail}.${k}`)));
  return [];
};
const sha256 = async (s) => (await import("node:crypto")).createHash("sha256").update(s).digest("hex");
const pathOf = (u) => { const x = new URL(u, "http://x"); return x.pathname + x.hash; };
// Every module.css selector starts with this (buildlib/export.py SCOPE): the wrapper, weighted by two ids.
const SCOPE = ".nwpt-module:not(#nwpt-a):not(#nwpt-b)";
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- static checks ----------
for (const id of MODULES) {
  const frag = read("modules", id, "fragment.html");
  const css = read("modules", id, "module.css");
  const man = JSON.parse(read("modules", id, "manifest.json"));
  const hasJs = exists("modules", id, "module.js");

  const { sels, ats } = cssSelectors(css);
  const unscoped = sels.filter((s) => !new RegExp(`^${reEsc(SCOPE)}( (?![+~])|$)`).test(s));
  check(`${id}: every selector in module.css starts with ${SCOPE} (${sels.length} selectors)`, sels.length > 0 && unscoped.length === 0, unscoped.join(" | "));
  if (/<a\s/.test(frag)) {
    check(`${id}: module.css underlines links explicitly (a live "a { text-decoration: none }" cannot remove it)`,
      new RegExp(`^${reEsc(SCOPE)} a \\{[^}]*text-decoration-line: underline`, "m").test(css));
  }
  check(`${id}: module.css has no @font-face, @import, :root or url()`, !/@font-face|@import|:root|url\(/.test(stripComments(css)), ats.join(" | "));
  const cssClasses = new Set([...stripComments(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]).filter((c) => !/^\d/.test(c)));
  check(`${id}: every class in module.css carries the nwpt- prefix`, [...cssClasses].every((c) => c.startsWith("nwpt-")), [...cssClasses].filter((c) => !c.startsWith("nwpt-")).join(", "));
  const customProps = [...css.matchAll(/(?<![\w-])--([\w-]+)/g)].map((m) => m[1]);
  check(`${id}: custom properties carry the nwpt- prefix`, customProps.every((p) => p.startsWith("nwpt-")), customProps.filter((p) => !p.startsWith("nwpt-")).join(", "));

  check(`${id}: fragment is one .nwpt-module wrapper with data-nwpt-module and lang="en-GB"`,
    new RegExp(`^(<!--[\\s\\S]*?-->\\s*)?<div class="nwpt-module" data-nwpt-module="${id}" lang="en-GB">[\\s\\S]*</div>\\s*$`).test(frag));
  const classes = attrs(frag, "class").flatMap((v) => v.split(/\s+/)).filter(Boolean);
  check(`${id}: every class in the fragment carries the nwpt- prefix`, classes.every((c) => c.startsWith("nwpt-")), classes.filter((c) => !c.startsWith("nwpt-")).join(", "));
  const inline = [...frag.matchAll(/<(script|style|link|meta)\b|\s(style|on[a-z]+)\s*=|javascript:/gi)].map((m) => m[0]);
  check(`${id}: no inline scripts, styles or event handlers`, inline.length === 0, inline.join(", "));
  const chrome = classes.filter((c) => CHROME.includes(c.replace(/^nwpt-/, "")));
  check(`${id}: no site header, footer, navigation, notice bar, staging banner or skip link`,
    chrome.length === 0 && !/<(header|footer|nav)\b[^>]*class="nwpt-(site|mobile|sub)/.test(frag) && !/Skip to main content|noindex|\[TBC/i.test(frag), chrome.join(", "));

  // links: routes.json page, a download or asset in integration/, an in-module anchor, or external
  const ids = new Set(attrs(frag, "id"));
  const badLinks = [];
  let n = 0;
  for (const raw of [...attrs(frag, "href"), ...attrs(frag, "src"), ...attrs(frag, "poster")]) {
    const u = unescapeHtml(raw);
    n++;
    if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(u)) { if (/^javascript:/i.test(u)) badLinks.push(u); continue; }
    if (u.startsWith("#")) { if (!ids.has(decodeURIComponent(u.slice(1)))) badLinks.push(`${u} (no such id in the module)`); continue; }
    const [p, hash] = u.split("#");
    if (p.startsWith(routes.downloads)) { if (!exists("downloads", p.slice(routes.downloads.length))) badLinks.push(`${u} (not in integration/downloads)`); continue; }
    if (p.startsWith(routes.assets)) { if (!exists("assets", p.slice(routes.assets.length))) badLinks.push(`${u} (not in integration/assets)`); continue; }
    if (!pagePaths.has(p)) { badLinks.push(`${u} (not a path in routes.json)`); continue; }
    if (hash !== undefined) {
      const target = path.join(pub, `${pagePaths.get(p)}.html`);
      if (fs.existsSync(target) && !fs.readFileSync(target, "utf8").includes(`id="${decodeURIComponent(hash)}"`)) badLinks.push(`${u} (anchor not on the ${pagePaths.get(p)} page)`);
    }
  }
  check(`${id}: all ${n} links resolve (routes.json, integration/ files, in-module anchors or external)`, badLinks.length === 0, badLinks.join("; "));

  const required = ["id", "title", "source", "placement", "files", "facts", "references", "downloads", "assets", "anchors", "links", "dependencies", "redirects", "csp", "publication_blockers", "optional_assets"];
  check(`${id}: manifest has ${required.length} required sections`, required.every((k) => k in man) && man.id === id, required.filter((k) => !(k in man)).join(", "));
  const unlisted = (man.dependencies || []).filter((d) => d.blocks_publication && !man.publication_blockers.some((b) => b.startsWith(`dependency ${d.id}:`)));
  check(`${id}: every dependency that blocks publication is a publication blocker`, unlisted.length === 0, unlisted.map((d) => d.id).join(", "));
  const selfRedirect = man.redirects.filter((r) => r.from === r.to.split("#")[0] || typeof r.required !== "boolean" || r.required !== (r.kind === "staging route"));
  check(`${id}: redirects are marked required (staging route) or optional (alias), and none points at its own path`, selfRedirect.length === 0, JSON.stringify(selfRedirect));
  const leaks = findInternal(man);
  check(`${id}: manifest exports no internal fields`, leaks.length === 0, leaks.join(", "));
  const hashBad = [];
  for (const [f, meta] of Object.entries(man.files)) if (!exists("modules", id, f) || (await sha256(read("modules", id, f))) !== meta.sha256) hashBad.push(f);
  check(`${id}: manifest file hashes match`, hashBad.length === 0, hashBad.join(", "));
  check(`${id}: module.js present only when the module needs behaviour`, hasJs === (man.javascript || []).length > 0 && hasJs === "module.js" in man.files);
  if (hasJs) {
    const js = read("modules", id, "module.js");
    check(`${id}: module.js acts only inside its wrapper, with prefixed classes`,
      js.includes(`[data-nwpt-module="${id}"]`) && ![...js.matchAll(/querySelector(?:All)?\("\.([\w-]+)/g)].some((m) => !m[1].startsWith("nwpt-")) && !/document\.querySelector\(/.test(js));
  }
  const facts = JSON.parse(read("content", "facts.json")).facts;
  check(`${id}: facts listed in the manifest are public`, man.facts.every((f) => facts[f.id] && facts[f.id].value === f.value), man.facts.filter((f) => !facts[f.id]).map((f) => f.id).join(", "));
  const preview = read("modules", id, "preview.html");
  check(`${id}: preview.html is noindex, with a strict CSP and no inline script or style`,
    /<meta name="robots" content="noindex, nofollow">/.test(preview) && /http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'/.test(preview)
    && !/<script>|<script(?![^>]*\bsrc=)[^>]*>|<style|\sstyle=/.test(preview));
}

// ---------- the family guide's urgent-help link gates publication ----------
if (MODULES.includes("family-guide")) {
  const fg = JSON.parse(read("modules", "family-guide", "manifest.json"));
  const dep = (fg.dependencies || []).find((d) => d.id === "urgent-help");
  check("family-guide: the urgent-help link is a dependency that blocks publication until a check is recorded, with the FAQ crisis-line review item",
    dep && dep.blocks_publication === true && dep.confirmed === null && dep.links.includes(`${routes.pages.faq}#urgent-help`)
    && fg.publication_blockers.some((b) => b.startsWith("dependency urgent-help:"))
    && fg.publication_blockers.some((b) => /crisis-line/.test(b.split(": ")[1] || "") && /appointment preparation sheet PDF/.test(b.split(": ")[0])), JSON.stringify(dep));
}

// ---------- docs/integration.md matches the manifests ----------
{
  const doc = fs.readFileSync(path.join(site, "docs", "integration.md"), "utf8");
  const mans = Object.fromEntries(MODULES.map((id) => [id, JSON.parse(read("modules", id, "manifest.json"))]));
  const byPage = Object.fromEntries(Object.values(mans).map((m) => [m.source.page.replace(/\.html$/, ""), m]));
  const sections = {};
  for (const part of doc.split(/^(?=#{2,3} )/m)) {
    const h = part.match(/^### ([a-z0-9-]+): /);
    if (h) sections[h[1]] = part;
  }
  check("docs/integration.md: one section per exported module", Object.keys(sections).sort().join() === [...MODULES].sort().join(), Object.keys(sections).join(", "));
  for (const id of MODULES) {
    const sec = sections[id] || "";
    const man = mans[id];
    const spans = [...sec.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
    const bad = [], own = [];
    let n = 0;
    // `#id`, `/page#id` or a pattern such as `#ref-<id>`: a pattern must match at least one id
    for (const s of spans) for (const a of s.matchAll(/(\/[\w/-]*)?#([\w<>-]+)/g)) {
      n++;
      const re = new RegExp(`^${a[2].replace(/<[^>]+>/g, "[\\w-]+")}$`);
      const pageId = a[1] ? (a[1] === "/" ? "index" : a[1].slice(1)) : null;
      const owner = pageId ? byPage[pageId] : man;
      if (owner) {
        if (!owner.anchors.ids.some((x) => re.test(x))) bad.push(`${a[0]} (not in the ${owner.id} manifest's anchors)`);
        if (owner === man) own.push(re);
      } else {
        const f = path.join(pub, `${pageId}.html`);
        if (!fs.existsSync(f) || ![...fs.readFileSync(f, "utf8").matchAll(/\sid="([^"]+)"/g)].some((m) => re.test(m[1]))) bad.push(`${a[0]} (no such id on public/${pageId}.html)`);
      }
    }
    check(`${id}: every #anchor docs/integration.md names in its section exists (${n} named)`, !!sections[id] && bad.length === 0, bad.join("; "));
    const unnamed = man.anchors.linked_from_site.filter((x) => !own.some((re) => re.test(x)));
    check(`${id}: docs/integration.md names every anchor other pages link to`, unnamed.length === 0, unnamed.join(", "));
    const aliases = man.redirects.filter((r) => !r.required).map((r) => r.from).filter((f) => !spans.includes(f));
    check(`${id}: docs/integration.md names every alias redirect`, aliases.length === 0, aliases.join(", "));
    const docAssets = spans.filter((s) => /^assets\//.test(s)).sort();
    const manAssets = [...man.optional_assets.map((o) => o.file), ...man.assets.map((a) => a.file)].sort();
    check(`${id}: images named in docs/integration.md are the manifest's (optional) assets`, docAssets.join() === manAssets.join(), `docs ${docAssets} manifest ${manAssets}`);
  }
}

// ---------- content export ----------
{
  const files = fs.readdirSync(path.join(integ, "content")).sort();
  const leaks = files.flatMap((f) => findInternal(JSON.parse(read("content", f)), f));
  check(`content/: ${files.length} files, public items only, no internal fields`, files.length > 0 && leaks.length === 0, leaks.slice(0, 20).join(", "));
  check("content/: people.json not exported (titles await management confirmation)", !files.includes("people.json"));
  const facts = JSON.parse(read("content", "facts.json")).facts;
  check("content/: only public, confirmed facts", Object.values(facts).every((f) => f.public === true && f.verification !== "unconfirmed"));
  const src = JSON.parse(read("content", "sources.json"));
  check("content/: sources carry public labels only", Object.entries(src).every(([k, v]) => k === "_doc" || Object.keys(v).join() === "public_label"));
  const cited = new Set();
  const cite = (o) => {
    if (Array.isArray(o)) o.forEach(cite);
    else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) (k === "source" || k === "sources" ? [].concat(v).forEach((x) => typeof x === "string" && cited.add(x)) : cite(v));
  };
  for (const f of files) if (f !== "sources.json") cite(JSON.parse(read("content", f)));
  const uncited = Object.entries(src).filter(([k, v]) => k !== "_doc" && !v.public_label && !cited.has(k)).map(([k]) => k);
  const unknown = [...cited].filter((k) => !(k in src));
  check("content/: sources.json lists only citable sources and those an exported item cites, and every cited one",
    uncited.length === 0 && unknown.length === 0, `uncited: ${uncited.join(", ")}; missing: ${unknown.join(", ")}`);
  const unpublished = JSON.parse(read("content", "documents.json")).documents.flatMap((d) => d.history.filter((h) => h.published !== true || "status" in h).map((h) => `${d.id} v${h.version}`));
  check("content/: document history lists published versions only, without internal status notes", unpublished.length === 0, unpublished.join(", "));
  const tokens = files.flatMap((f) => [...read("content", f).matchAll(/\{\{[^}]*\}\}/g)].map((m) => `${f}: ${m[0]}`));
  check("content/: no template tokens (fact placeholders replaced by their values)",
    tokens.length === 0 && (!facts["product.name"] || read("content", "study.json").includes(facts["product.name"].value)), tokens.slice(0, 10).join(", "));
  const needed = new Set(MODULES.flatMap((id) => JSON.parse(read("modules", id, "manifest.json")).downloads.map((d) => d.file)));
  const present = exists("downloads") ? fs.readdirSync(path.join(integ, "downloads")).map((f) => `downloads/${f}`) : [];
  check("downloads/: exactly the files the modules link to", [...needed].sort().join() === present.sort().join(), `needed ${[...needed]} present ${present}`);
}

// ---------- deterministic export ----------
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nwpt-export-"));
  const py = `import sys\nfrom pathlib import Path\nsys.path.insert(0, ${JSON.stringify(site)})\nfrom buildlib.content import Content\nfrom buildlib.export import export_modules\n` +
    `root = Path(${JSON.stringify(site)})\nfor d in ("a", "b"):\n    export_modules(root, Content(root), root / "public", Path(${JSON.stringify(tmp)}) / d)\n`;
  const r = spawnSync("python3", ["-c", py], { cwd: site, encoding: "utf8" });
  const list = (d) => { const out = []; const w = (p) => { for (const f of fs.readdirSync(p).sort()) { const q = path.join(p, f); fs.statSync(q).isDirectory() ? w(q) : out.push(path.relative(d, q)); } }; w(d); return out; };
  let same = r.status === 0;
  const diffs = [];
  if (same) {
    const a = list(path.join(tmp, "a")), b = list(path.join(tmp, "b")), c = list(integ);
    same = a.join() === b.join() && a.join() === c.join();
    for (const f of a) {
      const x = fs.readFileSync(path.join(tmp, "a", f)), y = fs.readFileSync(path.join(tmp, "b", f)), z = fs.existsSync(path.join(integ, f)) ? fs.readFileSync(path.join(integ, f)) : null;
      if (!x.equals(y) || !z || !x.equals(z)) { same = false; diffs.push(f); }
    }
  }
  check("export is deterministic: two fresh exports and the built integration/ are byte-identical", same, r.stderr || diffs.join(", "));
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------- live paths changed in one place (src/integration-routes.json), on a copy ----------
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nwpt-routes-"));
  for (const d of ["src", "content"]) fs.cpSync(path.join(site, d), path.join(tmp, "root", d), { recursive: true });
  const exportWith = (over, out) => {
    fs.writeFileSync(path.join(tmp, "root", "src", "integration-routes.json"), JSON.stringify(over));
    const py = `import sys\nfrom pathlib import Path\nsys.path.insert(0, ${JSON.stringify(site)})\nfrom buildlib.content import Content\nfrom buildlib.export import export_modules\n` +
      `root = Path(${JSON.stringify(path.join(tmp, "root"))})\nexport_modules(root, Content(root), Path(${JSON.stringify(pub)}), Path(${JSON.stringify(path.join(tmp, out))}))\n`;
    return spawnSync("python3", ["-c", py], { encoding: "utf8" });
  };
  const r = exportWith({ pages: { evidence: "/research/evidence", study: "/programme/study" }, downloads: "/files/" }, "out");
  const rdo = (out, ...p) => fs.readFileSync(path.join(tmp, out, ...p), "utf8");
  const rd = (...p) => rdo("out", ...p);
  const ok = r.status === 0 && rd("modules", "formulation", "fragment.html").includes('href="/research/evidence#ref-perucca-2020"')
    && rd("modules", "phase-1", "fragment.html").includes('href="/programme/study"') && !/href="\/(evidence|study)[#"]/.test(rd("modules", "phase-1", "fragment.html"))
    && rd("modules", "study-hub", "fragment.html").includes('href="/files/nwpharmatech-programme-brief.pdf"')
    && JSON.parse(rd("routes.json")).pages.evidence === "/research/evidence";
  const redir = r.status === 0 ? JSON.parse(rd("modules", "evidence-library", "manifest.json")).redirects.map((x) => `${x.from}>${x.to}:${x.required}`) : [];
  check("routes: a path changed in src/integration-routes.json reaches every fragment link and download", ok, r.stderr);
  check("routes: the manifest lists the redirects the new path needs (staging route required, alias optional)",
    redir.includes("/evidence>/research/evidence:true") && redir.includes("/references>/research/evidence:false"), redir.join(", "));
  const refused = (label, over, re) => {
    const x = exportWith(over, "bad");
    check(`routes: ${label}`, x.status !== 0 && re.test(x.stderr), x.stderr.slice(-400));
  };
  refused("a .html live path is refused (Cloudflare Pages would redirect it)", { pages: { study: "/study.html" } }, /extensionless/);
  refused("a trailing-slash live path is refused (Cloudflare Pages redirects /x/ itself, so the redirect loops)", { pages: { study: "/study/" } }, /must not end with \//);
  refused("a live path with _redirects pattern syntax is refused", { pages: { study: "/:slug" } }, /plain path/);
  refused("two pages on one live path are refused", { pages: { study: "/evidence" } }, /are both \/evidence/);
  refused("a live path that another module's alias would take over is refused (/news: newsroom alias)", { pages: { study: "/news" } }, /\/news -> \/newsroom shadows a live page/);
  refused("swapped live paths are refused (each staging-route redirect would shadow the other page, a loop)",
    { pages: { study: "/phase-1", "phase-1": "/study" } }, /shadows a live page/);

  // A live path equal to an alias: the alias is left out (it would redirect the page to itself), the rest still work.
  const al = exportWith({ pages: { newsroom: "/press", science: "/formulation", evidence: "/references" } }, "alias");
  const rules = (id) => (al.status === 0 ? JSON.parse(rdo("alias", "modules", id, "manifest.json")).redirects.map((x) => `${x.from}>${x.to}:${x.required}`).join(", ") : "");
  check("routes: a live path equal to an alias drops that alias and keeps a one-hop redirect from every other address",
    al.status === 0 && rules("newsroom") === "/newsroom>/press:true, /news>/press:false" && rules("formulation") === "/science>/formulation:true"
    && rules("evidence-library") === "/evidence>/references:true", al.stderr || `${rules("newsroom")} | ${rules("formulation")} | ${rules("evidence-library")}`);

  // The family guide's urgent-help dependency clears only with a recorded check for the link as it now is.
  const fgManifest = (out) => JSON.parse(rdo(out, "modules", "family-guide", "manifest.json"));
  const ok1 = exportWith({ confirmed_dependencies: { "urgent-help": { href: "/faq#urgent-help", record: "Test record: live urgent-help section checked" } } }, "confirmed");
  const m1 = ok1.status === 0 ? fgManifest("confirmed") : null;
  const d1 = m1 && (m1.dependencies || []).find((d) => d.id === "urgent-help");
  check("dependency: a recorded check clears the urgent-help blocker; the FAQ crisis-line review item stays while the link is the staging /faq",
    d1 && d1.blocks_publication === false && d1.confirmed === "Test record: live urgent-help section checked"
    && !m1.publication_blockers.some((b) => b.startsWith("dependency urgent-help")) && m1.publication_blockers.some((b) => /crisis-line/.test(b)), ok1.stderr || JSON.stringify(d1));
  const ok2 = exportWith({ pages: { faq: "/help" }, confirmed_dependencies: { "urgent-help": { href: "/faq#urgent-help", record: "Test record" } } }, "stale");
  const m2 = ok2.status === 0 ? fgManifest("stale") : null;
  // The crisis-line re-check still applies after the move: the module ships the appointment sheet, which prints the numbers.
  check("dependency: a check recorded for another address does not count (live path changed to /help); the sheet's crisis-line item stays",
    m2 && (m2.dependencies || []).find((d) => d.id === "urgent-help")?.blocks_publication === true
    && m2.publication_blockers.some((b) => b.startsWith("dependency urgent-help: /help#urgent-help") && /recorded check was for \/faq#urgent-help/.test(b))
    && m2.publication_blockers.some((b) => /crisis-line/.test(b)), ok2.stderr || JSON.stringify(m2?.publication_blockers));
  refused("a check recorded for an unknown dependency is refused", { confirmed_dependencies: { "no-such": { href: "/x", record: "y" } } }, /unknown dependency/);

  // A published document version is exported without its internal status note; unpublished ones are not.
  const docsPath = path.join(tmp, "root", "content", "documents.json");
  const docs = JSON.parse(fs.readFileSync(docsPath, "utf8"));
  docs.documents[0].history[1].published = true;
  fs.writeFileSync(docsPath, JSON.stringify(docs));
  const pubd = exportWith({}, "published");
  const hist = pubd.status === 0 ? JSON.parse(rdo("published", "content", "documents.json")).documents[0].history : null;
  check("content/: a published document version is exported (without 'status'); unpublished ones are not",
    hist && hist.length === 1 && hist[0].version === docs.documents[0].history[1].version && !("status" in hist[0]), pubd.stderr || JSON.stringify(hist));
  fs.rmSync(tmp, { recursive: true, force: true });

  // Under Cloudflare's own runtime (wrangler pages dev): a mock live site with a page at every live path and every
  // manifest redirect in _redirects. Each page answers 200 directly; each redirect takes one hop to its target.
  const oneHop = async (label, dir) => {
    const rts = JSON.parse(fs.readFileSync(path.join(dir, "routes.json"), "utf8"));
    const all = fs.readdirSync(path.join(dir, "modules")).flatMap((id) => JSON.parse(fs.readFileSync(path.join(dir, "modules", id, "manifest.json"), "utf8")).redirects);
    const mock = fs.mkdtempSync(path.join(os.tmpdir(), "nwpt-live-"));
    for (const [pid, p] of Object.entries(rts.pages)) {
      const f = path.join(mock, p === "/" ? "index.html" : `${p.slice(1)}.html`);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><title>${pid}</title></head><body><p>${pid}</p></body></html>\n`);
    }
    fs.writeFileSync(path.join(mock, "_redirects"), all.map((x) => `${x.from} ${x.to} ${x.status}`).join("\n") + "\n");
    const bad = [];
    const srv = await serve(mock);
    try {
      for (const p of Object.values(rts.pages)) {
        const w = await walk(srv.base, p);
        if (!(w.chain.length === 1 && w.final?.status === 200)) bad.push(`${p}: ${JSON.stringify(w.chain)}`);
      }
      for (const x of all) {
        const w = await walk(srv.base, x.from);
        if (!(w.chain.length === 2 && w.chain[0].status === x.status && pathOf(w.chain[0].location) === x.to && w.final?.status === 200)) bad.push(`${x.from}: ${JSON.stringify(w.chain)}`);
      }
    } finally {
      srv.stop();
      fs.rmSync(mock, { recursive: true, force: true });
    }
    check(`routes (${label}): under Cloudflare's runtime every live page answers 200 and each of the ${all.length} manifest redirects takes one hop`, all.length > 0 && bad.length === 0, bad.join("; "));
  };
  await oneHop("default paths", integ);
  const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), "nwpt-routes-"));
  for (const d of ["src", "content"]) fs.cpSync(path.join(site, d), path.join(tmp2, "root", d), { recursive: true });
  fs.writeFileSync(path.join(tmp2, "root", "src", "integration-routes.json"), JSON.stringify({ pages: { newsroom: "/press", science: "/formulation", evidence: "/references", study: "/programme/study" } }));
  const py2 = `import sys\nfrom pathlib import Path\nsys.path.insert(0, ${JSON.stringify(site)})\nfrom buildlib.content import Content\nfrom buildlib.export import export_modules\n` +
    `root = Path(${JSON.stringify(path.join(tmp2, "root"))})\nexport_modules(root, Content(root), Path(${JSON.stringify(pub)}), Path(${JSON.stringify(path.join(tmp2, "out"))}))\n`;
  const r2 = spawnSync("python3", ["-c", py2], { encoding: "utf8" });
  if (r2.status === 0) await oneHop("live paths on alias addresses, and a nested path", path.join(tmp2, "out"));
  else check("routes (live paths on alias addresses): export", false, r2.stderr);
  fs.rmSync(tmp2, { recursive: true, force: true });
}

// ---------- browser checks ----------
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".pdf": "application/pdf",
  ".ris": "application/x-research-info-systems", ".bib": "text/plain", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
// Aggressive host styles. Generic class rules and custom properties with the names the site uses (must not reach
// the module), and element rules (these may style module elements where the module sets nothing, by design).
const HOST_GENERIC = `:root { --ink: #c00; --brand: #0c0; --brand-dark: #00c; --line: #f0f; --radius: 40px; --font: Georgia, serif; --measure: 20ch; --max: 300px; }
.container { max-width: 300px; padding: 40px; background: #ff0; border: 5px dashed #f00; }
.card, .study-card, .aside, .callout { background: #000; color: #fff; padding: 50px; border-radius: 0; box-shadow: 0 0 30px #f00; }
.btn, .btn-primary, .chip { display: block; width: 100%; background: #f0f; color: #0f0; font-size: 30px; text-transform: uppercase; }
.tag, .st, .tag-company, .tag-established { font-size: 40px; background: #0ff; transform: rotate(3deg); }
.section, .section-alt, .page-hero, .section-tight { padding: 200px 0; margin: 50px; background: #fcc; }
.small, .lead, .eyebrow, .prose, .two-col, .grid, .table-wrap, .filters, .lib-section { font-size: 5px; display: flex; color: #f00; letter-spacing: 1em; }
.visually-hidden { position: static !important; width: auto; height: auto; clip: auto; }
.hidden, .is-hidden { display: block; }
`;
// Element rules, including the common link reset "a { text-decoration: none }" (with nothing else, such as bold,
// that would still mark links in text: axe would accept that and miss a lost underline).
const ELEMENT_RULES = [
  ["h1, h2", "color: #c00; font-size: 50px; text-transform: uppercase;"],
  ["a", "color: #0c0; text-decoration: none;"],
  ["table", "border: 6px solid #00f; font-size: 30px;"],
  ["details", "background: #ee0;"],
];
const HOST_ELEMENTS = "body { margin: 0; font-family: Georgia, serif; color: #333; background: #fafafa; }\n"
  + ELEMENT_RULES.map(([s, d]) => `${s} { ${d} }`).join("\n") + "\n";
// The same declarations written for the host's content area, as site themes do: an ancestor id and classes
// (up to one id, two classes). The module sits inside <main id="content" class="site-main entry-content">.
const CONTEXTS = ["#content ", ".site-main.entry-content ", "body #content.entry-content "];
const HOST_CONTEXT = ELEMENT_RULES.map(([s, d]) => `${s.split(", ").flatMap((x) => CONTEXTS.map((c) => c + x)).join(", ")} { ${d} }`).join("\n") + "\n";
// !important still wins over any selector: the documented limit, used as the axe negative control.
const HOST_IMPORTANT = "#content a { text-decoration: none !important; }\n";
const HOST_MARKUP = `<div class="container"><h1>Host page</h1><p class="lead">Host lead</p><p class="small">Host small <a href="#x">link</a></p>
<a class="btn btn-primary" href="#x">Host button</a> <span class="tag tag-company">Host tag</span> <span class="st">Host status</span>
<button type="button" class="chip">Host chip</button><div class="card"><h2>Host card</h2><p>Text</p></div>
<section class="section section-alt"><div class="two-col"><div class="prose"><h3>Host prose</h3><ul><li>One</li></ul></div><aside class="aside">Aside</aside></div></section>
<div class="table-wrap"><table><caption>Host table</caption><tr><th scope="row">A</th><td>B</td></tr></table></div>
<details><summary>Host details</summary><p>Inside</p></details><dl><dt>Term</dt><dd>Def</dd></dl><span class="visually-hidden">Hidden host text</span></div>`;
// Negative control: an unscoped rule and a host rule on a prefixed class, which the checks must detect.
const LEAK = `.card { letter-spacing: 3px; }\n.nwpt-section, .nwpt-page-hero { letter-spacing: 3px; }\n`;
// Host styles load after module.css, as a live theme's stylesheet may.
const HOST_CSS = { generic: HOST_GENERIC, elements: HOST_ELEMENTS, context: HOST_CONTEXT, important: HOST_IMPORTANT, leak: LEAK };
function hostPage(id, opts) {
  const sheet = (k) => (opts[k] ? `<link rel="stylesheet" href="/__host/${k}.css">` : "");
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><title>Host</title>
${opts.module ? `<link rel="stylesheet" href="/modules/${id}/module.css">` : ""}${Object.keys(HOST_CSS).map(sheet).join("")}</head><body>
<div id="host-before">${HOST_MARKUP}</div><main id="content" class="site-main entry-content"><div id="slot">${read("modules", id, "fragment.html")}</div></main><div id="host-after">${HOST_MARKUP}</div></body></html>`;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const c = u.pathname.match(/^\/__host\/(\w+)\.css$/);
  if (c && HOST_CSS[c[1]]) {
    res.writeHead(200, { "content-type": "text/css" });
    return res.end(HOST_CSS[c[1]]);
  }
  const m = u.pathname.match(/^\/__host\/([\w-]+)$/);
  if (m) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(hostPage(m[1], Object.fromEntries(["module", ...Object.keys(HOST_CSS)].map((k) => [k, u.searchParams.has(k)]))));
  }
  const f = path.join(integ, path.normalize(decodeURIComponent(u.pathname)).replace(/^(\.\.[/\\])+/, ""));
  if (!f.startsWith(integ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const shots = path.join(site, "docs", "qa", "screenshots");
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

// Computed styles of elements (and their ::before/::after), without layout-dependent sizes.
const styleSnapshot = (scope) => {
  // resolved from layout (the host's own content above the module moves it), not from the cascade
  const skip = new Set(["width", "height", "inline-size", "block-size", "transform-origin", "perspective-origin",
    "top", "bottom", "left", "right", "inset-block-start", "inset-block-end", "inset-inline-start", "inset-inline-end"]);
  const one = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo);
    const out = [];
    // host custom properties inherit into the module but style nothing there (it uses --nwpt-* only)
    for (let i = 0; i < cs.length; i++) if (!skip.has(cs[i]) && !(cs[i].startsWith("--") && !cs[i].startsWith("--nwpt-"))) out.push(`${pseudo || ""}${cs[i]}:${cs.getPropertyValue(cs[i])}`);
    return out.sort();
  };
  const els = scope === "host" ? [document.documentElement, document.body, ...document.querySelectorAll("#host-before, #host-before *, #host-after, #host-after *")]
    : [...document.querySelectorAll("[data-nwpt-module], [data-nwpt-module] *")];
  return els.map((el) => ({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""),
    s: [...one(el, null), ...one(el, "::before"), ...one(el, "::after")].join(";") }));
};
const firstDiff = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (!a[i] || !b[i] || a[i].s !== b[i].s) {
      const pa = (a[i]?.s || "").split(";"), pb = (b[i]?.s || "").split(";");
      const only = (x, y) => x.filter((p) => !y.includes(p)).slice(0, 6).join("; ");
      return `${a[i]?.el || b[i]?.el} (element ${i}): before [${only(pa, pb)}] after [${only(pb, pa)}]`;
    }
  }
  return "";
};

try {
  for (const id of MODULES) {
    // 1. Preview under its strict CSP: no errors, no violations, no other origins, no horizontal scroll.
    for (const width of [320, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        window.__csp = [];
        document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      });
      const errors = [], foreign = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
      page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
      page.on("request", (r) => !r.url().startsWith(base) && !r.url().startsWith("data:") && foreign.push(r.url()));
      await page.goto(`${base}/modules/${id}/preview.html`, { waitUntil: "load" });
      await page.waitForTimeout(100);
      const st = await page.evaluate(() => {
        const w = document.querySelector("[data-nwpt-module]");
        return { csp: window.__csp, styled: getComputedStyle(w).getPropertyValue("--nwpt-ink").trim() !== "", ready: w.hasAttribute("data-nwpt-ready"),
          overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      if (width === 1280) {
        check(`${id}: preview loads under the strict CSP with no console errors`, errors.length === 0, errors.join("; "));
        check(`${id}: preview raises no securitypolicyviolation`, st.csp.length === 0, st.csp.join("; "));
        check(`${id}: preview makes no request to another origin`, foreign.length === 0, foreign.join("; "));
        check(`${id}: module.css applies${exists("modules", id, "module.js") ? " and module.js runs" : ""}`, st.styled && st.ready === exists("modules", id, "module.js"));
        await page.screenshot({ path: path.join(shots, `module-${id}-desktop.png`), fullPage: true });
      } else {
        check(`${id}: no horizontal scroll at 320px`, !st.overflow && errors.length === 0 && st.csp.length === 0, errors.concat(st.csp).join("; "));
        await page.screenshot({ path: path.join(shots, `module-${id}-320.png`), fullPage: true });
      }
      await ctx.close();
    }

    // 2. axe inside the module (CSP bypassed only so the test can inject axe): in the preview, and in the hostile
    //    host page, whose element rules include "a { text-decoration: none }" at element and content-area level.
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, bypassCSP: true });
      const page = await ctx.newPage();
      const axeIn = async (url) => {
        await page.goto(url, { waitUntil: "load" });
        await page.addScriptTag({ content: axeSource });
        return page.evaluate(async () => (await window.axe.run({ include: [["[data-nwpt-module]"]] },
          { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations
          .map((x) => `${x.id}(${x.impact}) x${x.nodes.length}: ${x.nodes[0]?.target}`));
      };
      const v = await axeIn(`${base}/modules/${id}/preview.html`);
      check(`${id}: axe (WCAG 2.2 AA) finds no violations inside the module`, v.length === 0, v.join("; "));
      const vh = await axeIn(`${base}/__host/${id}?module&generic&elements&context`);
      check(`${id}: axe finds no violations inside the module in the hostile host page (host resets link underlines)`, vh.length === 0, vh.join("; "));
      if (id === "evidence-library") {
        const vi = await axeIn(`${base}/__host/${id}?module&generic&elements&context&important`);
        check("negative control: axe in the host page detects unmarked links when a host !important rule removes underlines (the documented limit)",
          vi.some((x) => x.startsWith("link-in-text-block")), vi.join("; "));
      }
      await ctx.close();
    }

    // 3. Collisions with a host page's generic CSS.
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      const snap = async (q, scope) => { await page.goto(`${base}/__host/${id}?${q}`, { waitUntil: "load" }); return page.evaluate(styleSnapshot, scope); };
      const hostWithout = await snap("generic&elements", "host");
      const hostWith = await snap("generic&elements&module", "host");
      check(`${id}: host elements keep exactly their host styles when module.css is added (${hostWith.length} elements)`,
        hostWith.length === hostWithout.length && !firstDiff(hostWithout, hostWith), firstDiff(hostWithout, hostWith));
      const modHostile = await snap("generic&elements&module", "module");
      const modElementsOnly = await snap("elements&module", "module");
      check(`${id}: the host's generic class rules and custom properties do not change any module element (${modHostile.length} elements)`,
        modHostile.length === modElementsOnly.length && !firstDiff(modElementsOnly, modHostile), firstDiff(modElementsOnly, modHostile));
      // Content-area rules carry the element rules' own declarations, so any difference is a property the module
      // sets that an ancestor-id or ancestor-class rule overrode (element rules already reach what it does not set).
      const modContext = await snap("generic&elements&context&module", "module");
      check(`${id}: host rules for the content area (#content, .entry-content ancestors) do not override any property the module sets`,
        modContext.length === modHostile.length && !firstDiff(modHostile, modContext), firstDiff(modHostile, modContext));
      if (id === MODULES[0]) {
        const hostLeak = await snap("generic&elements&module&leak", "host");
        const modLeak = await snap("generic&elements&module&leak", "module");
        check("negative control: the collision checks detect an unscoped rule and a host rule on a module class",
          !!firstDiff(hostWith, hostLeak) && !!firstDiff(modHostile, modLeak), `${firstDiff(hostWith, hostLeak)} / ${firstDiff(modHostile, modLeak)}`);
      }
      await ctx.close();
    }
  }

  // 4. Evidence filters in the preview.
  if (MODULES.includes("evidence-library")) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/modules/evidence-library/preview.html`, { waitUntil: "load" });
    const state = () => page.evaluate(() => {
      const r = document.querySelector('[data-nwpt-module="evidence-library"]');
      return {
        barVisible: !r.querySelector(".nwpt-filters").hidden,
        pressed: [...r.querySelectorAll(".nwpt-filters button")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.filter),
        visible: [...r.querySelectorAll(".nwpt-lib-section")].filter((s) => !s.hidden && s.offsetParent).map((s) => s.dataset.section),
        cards: [...r.querySelectorAll(".nwpt-study-card")].filter((c) => c.offsetParent).length,
        all: r.querySelectorAll(".nwpt-lib-section").length,
        status: r.querySelector(".nwpt-filter-status").textContent,
      };
    });
    const s0 = await state();
    check("evidence-library: filter bar shown with JavaScript, 'All' pressed, every section visible", s0.barVisible && s0.pressed.join() === "all" && s0.visible.length === s0.all, JSON.stringify(s0));
    const second = page.locator(".nwpt-filters button").nth(1);
    const cat = await second.getAttribute("data-filter");
    await second.click();
    const s1 = await state();
    check(`evidence-library: clicking a topic filter shows only that topic (${cat})`,
      s1.pressed.join() === cat && s1.visible.join() === cat && s1.cards > 0 && s1.status.startsWith(`Showing ${s1.cards} source`), JSON.stringify(s1));
    await page.locator('.nwpt-filters button[data-filter="all"]').focus();
    await page.keyboard.press("Enter");
    const s2 = await state();
    check("evidence-library: 'All' by keyboard shows every section again", s2.pressed.join() === "all" && s2.visible.length === s2.all && /^Showing \d+ sources$/.test(s2.status), JSON.stringify(s2));
    await page.locator(".nwpt-filters button").nth(2).focus();
    await page.keyboard.press("Space");
    const s3 = await state();
    check("evidence-library: Space on a filter works too", s3.pressed.length === 1 && s3.visible.length === 1, JSON.stringify(s3));

    // A source link (in the module) to a card in a topic the filter hides: every topic is shown and the page moves
    // to the card. Then the same by address (a link from elsewhere on the live page changes only the hash).
    const target = (hash) => page.evaluate((h) => {
      const el = document.getElementById(h.slice(1));
      const r = el.getBoundingClientRect();
      const bar = document.querySelector('[data-nwpt-module="evidence-library"] .nwpt-filters');
      return { hash: location.hash, shown: !!el.offsetParent, inView: r.top >= -1 && r.top < innerHeight,
        pressed: [...bar.querySelectorAll("button")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.filter).join(),
        status: document.querySelector('[data-nwpt-module="evidence-library"] .nwpt-filter-status').textContent };
    }, hash);
    await page.locator(".nwpt-filters button").nth(1).click();
    const href = await page.evaluate(() => {
      const r = document.querySelector('[data-nwpt-module="evidence-library"]');
      const a = [...r.querySelectorAll('a[href^="#ref-"]')].find((x) => x.offsetParent && document.getElementById(x.getAttribute("href").slice(1))?.closest(".nwpt-lib-section")?.hidden);
      if (a) a.setAttribute("data-test-link", "");
      return a ? a.getAttribute("href") : null;
    });
    if (href) await page.locator("[data-test-link]").click();
    await page.waitForTimeout(150);
    const t1 = href && await target(href);
    check(`evidence-library: a source link to a card in a hidden topic shows every topic and moves to the card (${href})`,
      t1 && t1.hash === href && t1.shown && t1.inView && t1.pressed === "all" && /^Showing \d+ sources$/.test(t1.status), JSON.stringify(t1) || "no in-module link to a hidden card");
    await page.locator(".nwpt-filters button").nth(1).click();
    const other = await page.evaluate((h) => {
      const r = document.querySelector('[data-nwpt-module="evidence-library"]');
      const c = [...r.querySelectorAll(".nwpt-lib-section[hidden] [id^='ref-']")].find((x) => "#" + x.id !== h);
      return c ? "#" + c.id : null;
    }, href);
    if (other) await page.evaluate((h) => { location.hash = h; }, other);
    await page.waitForTimeout(150);
    const t2 = other && await target(other);
    check(`evidence-library: an address naming a card in a hidden topic shows every topic and moves to the card (${other})`,
      t2 && t2.hash === other && t2.shown && t2.inView && t2.pressed === "all", JSON.stringify(t2) || "no card in a hidden topic");
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
const outDir = path.join(site, "docs", "qa");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "integration-report.json"), JSON.stringify({ generated: new Date().toISOString(), modules: MODULES, checks: results }, null, 1));
console.log(`integration tests: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
