#!/usr/bin/env python3
"""Build the NWPharmaTech.org site from structured content. Python 3.9+ standard library only
(PDF regeneration additionally needs Node.js and tools/node_modules; see tools/make-pdf.mjs).

    python3 build.py                       # staging build (default): noindex, staging banner
    python3 build.py --env production      # refuses while publication blockers remain (see below)
    python3 build.py --env production --accept-index
                                           # allow facts/references verified only via search summaries
                                           # (use only after a documented primary-source check)
    python3 build.py --with-signup         # include the email sign-up form; refused until a live provider
                                           # test is recorded in content/signup-provider-test.json
    python3 build.py --allow-stale-pdf     # staging only: build even if the PDFs could not be regenerated

How a build is installed
    Everything is built into a temporary directory next to this file and validated there. The deployable
    output (public/, restricted/, build/, integration/) is replaced only when every step and every check has
    passed. A refused or failed build leaves the previous output exactly as it was (tools/test_build_gate.py).

Outputs
    public/        public website: one Cloudflare Pages project (extensionless URLs; see docs/deployment.md)
    restricted/    access-controlled staging material (separate Cloudflare Pages project behind Access)
    integration/   module packages for the live-site integration (see docs/integration.md)
    build/         PDF sources and build-report.json (not deployed)

Publication blockers (a production build is refused while any remain)
    - any review item: a [TBC: ...] marker in a template, or an entry in content/review.json
    - any link to a page that is not built
    - any fact or reference used publicly whose verification is not 'document' or 'primary'
      (unless --accept-index or accept_for_production is set on that item)
    - any leadership title not confirmed by management, profile without consent to publish, or biography below
      document/primary verification (content/people.json)
    - any PDF whose content differs from the version recorded in content/documents.json
    - any PDF that is out of date with the facts it contains
Optional assets that have not been supplied (portraits, renders, the official logo, interview recordings)
are reported separately and never block a build: their slots render nothing until the asset is authorised.
"""
from datetime import datetime, timezone
from pathlib import Path
import argparse
import base64
import hashlib
import html
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import traceback

from buildlib.content import Content, ContentError
from buildlib.export import MODULES, export_modules
from buildlib.render import Renderer

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE_URL = "https://www.nwpharmatech.org"
OUTPUTS = ("public", "restricted", "build", "integration")
TBC_RE = re.compile(r"\[TBC:[^\]]*\]")
INLINE_JS = 'document.documentElement.classList.add("js");'
PAGE_LINK_RE = re.compile(r'<a ([^>]*?)href="([a-z0-9\-]+\.html)(#[^"]*)?"([^>]*)>(.*?)</a>', re.S)
# relative URLs in href/src/poster: rewritten to root-relative, extensionless routes
REL_URL_RE = re.compile(r'\b(href|src|poster)="(?![a-zA-Z][a-zA-Z0-9+.\-]*:|/|#)([^"]*)"')
NOINDEX_PAGES = {"funding-use.html"}   # public but not indexed (funding and financing)
PRINT_OUTPUTS = {"programme-brief.html": "nwpharmatech-programme-brief.pdf",
                 "appointment-sheet.html": "appointment-preparation-sheet.pdf"}


class BuildFailed(Exception):
    pass


# ---------- routes ----------
def page_route(name):
    """study.html -> /study, index.html -> /  (Cloudflare Pages serves /study from study.html and
    308-redirects /study.html and /study/ to /study, so links, canonicals and the sitemap use /study)."""
    return "/" if name == "index.html" else "/" + name[:-5]


def to_route(url):
    path, sep, frag = url.partition("#")
    if path.endswith(".html"):
        path = page_route(path)
    elif path:
        path = "/" + path
    return path + (sep + frag if sep else "")


def rewrite_urls(page_html):
    return REL_URL_RE.sub(lambda m: f'{m.group(1)}="{to_route(m.group(2))}"', page_html)


def strip_review_markers(page_html):
    """[TBC: ...] markers are review notes for the team. They are collected as publication blockers and
    never rendered; a paragraph or list item that held only a marker is removed with it."""
    s = TBC_RE.sub("\x00", page_html)
    s = re.sub(r"<(p|li)(\s[^>]*)?>\s*\x00\s*</\1>\s*", "", s)
    return re.sub(r"\s*\x00", "", s)


# ---------- pages ----------
def parse(text, name):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise BuildFailed(f"{name}: missing metadata block")
    meta = {}
    for line in m.group(1).splitlines():
        if line.strip():
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, text[m.end():]


def strip_optional(page_html, with_signup):
    """Remove <!--optional:signup--> ... <!--/optional--> blocks unless enabled."""
    if with_signup:
        return re.sub(r"<!--/?optional[^>]*-->", "", page_html)
    return re.sub(r"<!--optional:signup-->.*?<!--/optional-->", "", page_html, flags=re.S)


def build_tree(content, src_pages, out_dir, env, restricted=False, with_signup=False, pdfs=None):
    """Render every page into out_dir (which must not exist yet). Returns (review items, renderer)."""
    header = (SRC / "partials" / "header.html").read_text()
    footer = (SRC / "partials" / "footer.html").read_text()
    out_dir.mkdir(parents=True)
    shutil.copytree(SRC / "assets", out_dir / "assets")
    names = sorted(p.name for p in src_pages.glob("*.html"))
    # the restricted project has its own navigation: its index and pages, never the public page groups
    nav_pages = [(n, (lambda m: m.get("nav_title", m["title"]))(parse((src_pages / n).read_text(), n)[0]))
                 for n in sorted(names, key=lambda n: n != "index.html")] if restricted else None
    r = Renderer(content, env, ROOT, available=set(names), pdfs=pdfs, nav_pages=nav_pages)
    review = []
    ui = content.ui
    rendered = {}
    for name in names:
        meta, body = parse((src_pages / name).read_text(), name)
        full_title = ui["site_name"] if name == "index.html" and not restricted else f"{meta['title']} | {ui['site_name']}"
        robots = meta.get("robots", "noindex, nofollow" if name in NOINDEX_PAGES else "index, follow")
        if env == "staging" or restricted:
            robots = "noindex, nofollow"
        r.page_name = name
        desk, mob = r.nav(meta)
        if restricted:
            banner = f'<aside class="env-banner env-restricted" aria-label="{html.escape(ui["environment_region"])}">{ui["restricted_banner"]}</aside>'
        elif env == "staging":
            banner = f'<aside class="env-banner" aria-label="{html.escape(ui["environment_region"])}">{ui["staging_banner"]}</aside>'
        else:
            banner = ""
        page_html = header + body + footer
        if restricted:   # not on the public domain: no canonical URL, and no links into the public site
            page_html = re.sub(r'\s*<link rel="canonical" href="\{\{canonical\}\}">', "", page_html)
            page_html = re.sub(r"<!--public-only-->.*?<!--/public-only-->", "", page_html, flags=re.S)
        else:
            page_html = re.sub(r"<!--/?public-only-->", "", page_html)
        page_html = (page_html.replace("{{title}}", html.escape(full_title))
                     .replace("{{description}}", html.escape(meta["description"]))
                     .replace("{{robots}}", robots)
                     .replace("{{canonical}}", SITE_URL + page_route(name))
                     .replace("{{lang}}", ui["lang"])
                     .replace("{{nav}}", desk)
                     .replace("{{mobile_nav}}", mob)
                     .replace("{{env_banner}}", banner))
        page_html = strip_optional(page_html, with_signup)
        page_html = r.expand(page_html, name, meta)
        review += [(name, t) for t in TBC_RE.findall(page_html)]
        rendered[name] = strip_review_markers(page_html)
    for name, page_html in rendered.items():
        def unwrap(m, name=name):
            if m.group(2) in rendered:
                return m.group(0)
            review.append((name, f"link to unbuilt page {m.group(2)}"))
            return f'<span class="dangling">{m.group(5)}</span>'
        page_html = rewrite_urls(PAGE_LINK_RE.sub(unwrap, page_html))
        (out_dir / name).write_text(page_html)
    return review, r


# ---------- redirects, headers, robots, sitemap ----------
FILE_PREFIXES = ("/assets/", "/downloads/", "/functions/", "/api/", "/_")
FILE_ROUTES = {"/robots.txt", "/sitemap.xml", "/404", "/404.html", "/favicon.ico"}


def load_redirects(page_names):
    """src/redirects.txt, validated: every target is a page route (optionally with a fragment), no rule
    shadows a page or a form of it that Cloudflare already redirects, and no rule points at another rule."""
    routes = {page_route(n) for n in page_names}
    shadowed = routes | {n if n == "/" else n + ".html" for n in routes} | {r + "/" for r in routes if r != "/"} | {"/index.html"}
    rules, errs = [], []
    for i, line in enumerate((SRC / "redirects.txt").read_text().splitlines(), 1):
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        parts = s.split()
        if len(parts) != 3:
            errs.append(f"redirects.txt:{i}: expected 'source target status'")
            continue
        src, dst, code = parts
        if any(src == r[0] for r in rules):
            errs.append(f"redirects.txt:{i}: {src} already has a rule (Cloudflare uses only the first)")
            continue
        if not src.startswith("/") or src.startswith(FILE_PREFIXES) or src in FILE_ROUTES:
            errs.append(f"redirects.txt:{i}: {src} is not a free path (files under /assets/ and /downloads/, "
                        f"and {', '.join(sorted(FILE_ROUTES))}, are served as files)")
            continue
        rules.append((src, dst, code))
    for src, dst, code in list(rules):
        if "*" in src + dst or ":" in src + dst:
            errs.append(f"redirect {src} -> {dst}: splats and placeholders are not used (the build cannot check them for loops)")
        elif not src.endswith("/") and "." not in src.rsplit("/", 1)[-1] and src + "/" not in shadowed:
            rules.append((src + "/", dst, code))   # Cloudflare treats /team and /team/ as different paths
    sources = {s for s, _, _ in rules}
    for src, dst, code in rules:
        if src in shadowed:
            errs.append(f"redirect {src}: shadows a page (Cloudflare already serves or redirects this path)")
        if dst.split("#")[0] not in routes:
            errs.append(f"redirect {src} -> {dst}: target is not a page route")
        if dst.split("#")[0] in sources:
            errs.append(f"redirect {src} -> {dst}: target is itself redirected (chain)")
        if code not in ("301", "302", "307", "308"):
            errs.append(f"redirect {src}: status {code}")
    if errs:
        raise BuildFailed("Invalid redirects:\n  " + "\n  ".join(errs))
    return rules


def write_meta_files(out, env, page_names, pdf_dir, pdf_names):
    js_hash = base64.b64encode(hashlib.sha256(INLINE_JS.encode()).digest()).decode()
    headers = ["/*",
               "  X-Content-Type-Options: nosniff",
               "  Referrer-Policy: strict-origin-when-cross-origin",
               "  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()",
               f"  Content-Security-Policy: default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self'; "
               f"script-src 'self' 'sha256-{js_hash}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"]
    if env == "staging":
        headers.append("  X-Robots-Tag: noindex, nofollow")
    for n in sorted(NOINDEX_PAGES):
        headers += [page_route(n), "  X-Robots-Tag: noindex, nofollow"]
    headers += ["/downloads/*", "  X-Content-Type-Options: nosniff"]
    (out / "_headers").write_text("\n".join(headers) + "\n")
    rules = load_redirects(page_names)
    (out / "_redirects").write_text("# Generated from src/redirects.txt by build.py. Route map: docs/url-map.md\n"
                                    + "".join(f"{s} {d} {c}\n" for s, d, c in rules))
    # Production: the noindex pages stay crawlable so that crawlers can see their noindex (a robots.txt
    # Disallow would hide it, and the URL could still be indexed from links).
    robots = "User-agent: *\nDisallow: /\n" if env == "staging" else \
        f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n"
    (out / "robots.txt").write_text(robots)
    locs = "".join(f"<url><loc>{SITE_URL}{page_route(n)}</loc></url>" for n in page_names if n not in NOINDEX_PAGES)
    (out / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{locs}</urlset>\n')
    (out / "downloads").mkdir(exist_ok=True)
    for name in pdf_names:   # only PDFs with a checked source and manifest entry are published
        shutil.copy2(pdf_dir / name, out / "downloads" / name)
    if (SRC / "404.html").exists():
        shutil.copy2(SRC / "404.html", out / "404.html")


def write_citations(content, out):
    """RIS and BibTeX exports of the public evidence library, generated from content/references.json."""
    ris, bib = [], []
    for r in content.refs["items"]:
        if not r["public"]:
            continue
        ty = {"literature": "JOUR", "guideline": "GEN", "regulatory": "GEN", "report": "RPRT", "programme": "GEN"}[r["kind"]]
        lines = [f"TY  - {ty}", f"TI  - {r['title']}"]
        for a in [x.strip() for x in r["authors"].replace(", et al.", "").split(", ") if x.strip()] if r["kind"] == "literature" else [r["authors"]]:
            if a:
                lines.append(f"AU  - {a.rstrip('.')}")
        if r.get("journal"): lines.append(f"T2  - {r['journal']}")
        if r.get("year"): lines.append(f"PY  - {r['year']}")
        if r.get("volume"): lines.append(f"VL  - {r['volume']}")
        if r.get("issue"): lines.append(f"IS  - {r['issue']}")
        if r.get("pages"):
            sp, _, ep = str(r["pages"]).partition("-")
            lines.append(f"SP  - {sp}")
            if ep: lines.append(f"EP  - {ep}")
        if r.get("doi"): lines.append(f"DO  - {r['doi']}")
        if r.get("pmid"): lines.append(f"AN  - PMID:{r['pmid']}")
        if r.get("url"): lines.append(f"UR  - {r['url']}")
        lines.append("ER  - ")
        ris.append("\n".join(lines))
        key = r["id"].replace("-", "")
        fields = {"title": r["title"], "author": r["authors"].replace(", et al.", " and others").replace(", ", " and ") if r["kind"] == "literature" else "{" + r["authors"] + "}",
                  "journal": r.get("journal"), "year": r.get("year"), "volume": r.get("volume"), "number": r.get("issue"),
                  "pages": str(r.get("pages") or "").replace("-", "--"), "doi": r.get("doi"), "url": r.get("url"),
                  "note": f"PMID: {r['pmid']}" if r.get("pmid") else None}
        body = ",\n".join(f"  {k} = {{{v}}}" for k, v in fields.items() if v)
        bib.append(f"@{'article' if r['kind'] == 'literature' else 'misc'}{{{key},\n{body}\n}}")
    (out / "downloads").mkdir(exist_ok=True)
    (out / "downloads" / "nwpharmatech-references.ris").write_text("\n\n".join(ris) + "\n")
    (out / "downloads" / "nwpharmatech-references.bib").write_text("\n\n".join(bib) + "\n")


# ---------- PDFs ----------
def build_print_sources(content, env, out):
    """Expand PDF templates (src/print/*.html) with the same content. For each, write <stem>.checks.json:
    the SHA-256 of the expanded source, the expected page count and every fact value the PDF must contain.
    tools/make-pdf.mjs renders the PDF and verifies it against these checks."""
    out.mkdir(parents=True, exist_ok=True)
    r = Renderer(content, env, ROOT)
    checks = {}
    for t in sorted((SRC / "print").glob("*.html")):
        expanded = r.expand(t.read_text(), t.name, {})
        if TBC_RE.search(expanded):
            raise BuildFailed(f"src/print/{t.name}: contains a [TBC] marker; PDFs must not carry review notes")
        (out / t.name).write_text(expanded)
        m = re.search(r'<meta name="expected-pages" content="(\d+)">', expanded)
        values = sorted({content.facts[f]["value"] for f, pages in content.used_facts.items() if t.name in pages})
        # the document's content, without its own version label: recording a version cannot change this hash
        versionless = re.sub(r'<span class="doc-version">.*?</span>', "", expanded, flags=re.S)
        checks[t.name] = {"source": t.name, "pdf": PRINT_OUTPUTS[t.name],
                          "sha256": hashlib.sha256(expanded.encode()).hexdigest(),
                          "content_sha256": hashlib.sha256(versionless.encode()).hexdigest(),
                          "expected_pages": int(m.group(1)) if m else None, "facts": values}
        (out / (t.stem + ".checks.json")).write_text(json.dumps(checks[t.name], indent=1))
    return checks


def _sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_pdfs(checks, build_dir, tmp, allow_stale):
    """Returns (directory holding exactly the PDFs to publish, manifest, stale list).

    A PDF is current only when its manifest entry matches the expanded source (source_sha256), the file itself
    (sha256 and bytes) and records passed checks. Otherwise it is regenerated and checked. The PDFs are read once
    into the build's own directory, so nothing changed in src/downloads during the build can reach this output.
    Any other PDF in src/downloads has no checked source and is not published."""
    names = [c["pdf"] for c in checks.values()]
    current = tmp / "pdf-current"
    current.mkdir()
    for name in names:
        if (SRC / "downloads" / name).exists():
            shutil.copy2(SRC / "downloads" / name, current / name)
    for f in sorted((SRC / "downloads").glob("*.pdf")):
        if f.name not in names:
            print(f"WARNING: src/downloads/{f.name} has no checked source and is not published")
    try:
        manifest = json.loads((SRC / "downloads" / "pdf-manifest.json").read_text())
    except (OSError, json.JSONDecodeError):
        manifest = {}
    manifest = {k: v for k, v in manifest.items() if k in names}

    def stale_in(man, d):
        bad = []
        for c in checks.values():
            e, f = man.get(c["pdf"]), d / c["pdf"]
            if (not e or not f.exists() or e.get("source_sha256") != c["sha256"] or e.get("pass") is not True
                    or e.get("sha256") != _sha256(f) or e.get("bytes") != f.stat().st_size):
                bad.append(c["pdf"])
        return bad

    stale = stale_in(manifest, current)
    if not stale:
        return current, manifest, []
    out = tmp / "pdf"
    out.mkdir()
    cmd = ["node", str(ROOT / "tools" / "make-pdf.mjs"), "--src", str(build_dir), "--out", str(out)]
    try:
        proc = subprocess.run(cmd, cwd=ROOT / "tools", capture_output=True, text=True, timeout=300)
        ok = proc.returncode == 0
        detail = (proc.stdout + proc.stderr).strip()
    except (OSError, subprocess.TimeoutExpired) as e:
        ok, detail = False, str(e)
    if ok:
        new_manifest = json.loads((out / "pdf-manifest.json").read_text())
        still = stale_in(new_manifest, out)
        if not still:
            print(f"PDFs regenerated and checked: {', '.join(stale)}")
            return out, new_manifest, []
        detail += f"\nchecks failed for: {', '.join(still)}"
    if allow_stale:
        print(f"WARNING: PDFs out of date and not regenerated ({', '.join(stale)}):\n{detail}")
        return current, manifest, stale
    raise BuildFailed("The PDFs are out of date with their sources, or do not match their checked manifest, and could "
                      f"not be regenerated and checked ({', '.join(stale)}).\n{detail}\nInstall the tools (cd tools && "
                      "npm install) or, for a staging preview only, pass --allow-stale-pdf.")


def document_version_blockers(checks, env):
    """Each PDF must be a recorded version: the newest entry of its document in content/documents.json carries the
    SHA-256 of the PDF's content (without its own version label). A version, once built, keeps its content: the
    hashes are logged in src/downloads/document-versions.json, so changing a version's hash instead of adding a
    version is refused. Production also needs the newest version marked published (the PDF header otherwise shows
    its draft status). Returns (blockers, updated issued-versions log)."""
    try:
        issued = json.loads((SRC / "downloads" / "document-versions.json").read_text())
    except (OSError, json.JSONDecodeError):
        issued = {}
    out = []
    for d in json.loads((ROOT / "content" / "documents.json").read_text())["documents"]:
        c = next((c for c in checks.values() if c["pdf"] == Path(d.get("file", "")).name), None)
        if not c:
            continue
        newest = d["history"][0]
        v, recorded, pdf = newest["version"], newest.get("source_sha256"), c["pdf"]
        nxt = str(int(v) + 1) if v.isdigit() else "a new version"
        if recorded is None:
            out.append(f"{pdf}: set source_sha256 of version {v} in documents.json to {c['content_sha256']}")
        elif recorded != c["content_sha256"]:
            out.append(f"{pdf}: content differs from version {v}; add version {nxt} to documents.json (newest first) "
                       f"with source_sha256 {c['content_sha256']}")
        elif issued.get(pdf, {}).get(v, recorded) != recorded:
            out.append(f"{pdf}: version {v} was already built with other content; add version {nxt} instead of "
                       "changing its source_sha256")
        else:
            issued.setdefault(pdf, {})[v] = recorded
        if env == "production" and not newest.get("published"):
            out.append(f"{pdf}: version {v} is not marked published in documents.json (its header shows "
                       f"'{newest.get('status')}')")
    return out, issued


# ---------- validation of the built output ----------
def _ids(html_text):
    return set(re.findall(r'\bid="([^"]+)"', html_text))


def validate_output(out, env, page_names, restricted_names, pdf_manifest):
    """Checks the built tree before it is installed. Any failure aborts the build."""
    errs = []
    pub = out / "public"
    routes = {page_route(n): n for n in page_names}
    rules = [line.split() for line in (pub / "_redirects").read_text().splitlines() if line.strip() and not line.startswith("#")]
    redirect_sources = {r[0] for r in rules}
    ids = {page_route(n): _ids((pub / n).read_text()) for n in page_names}
    for src, dst, _ in rules:   # a redirect to a fragment must reach an element with that id
        path, _, frag = dst.partition("#")
        if frag and frag not in ids.get(path, set()):
            errs.append(f"redirect {src} -> {dst}: no id '{frag}' on {path}")
    for name in page_names:
        h = (pub / name).read_text()
        where = f"public/{name}"
        canon = re.findall(r'<link rel="canonical" href="([^"]+)">', h)
        if canon != [SITE_URL + page_route(name)]:
            errs.append(f"{where}: canonical {canon}")
        if "[TBC" in h:
            errs.append(f"{where}: review marker rendered")
        for attr, url, frag in re.findall(r'\b(href|src|poster)="(/[^"#]*)(#[^"]*)?"', h):
            if url.endswith(".html"):
                errs.append(f"{where}: link to {url} (Cloudflare redirects .html; link the route)")
            elif url.startswith(("/assets/", "/downloads/")):
                if not (pub / url.lstrip("/")).exists():
                    errs.append(f"{where}: missing file {url}")
            elif url in redirect_sources:
                errs.append(f"{where}: link to {url}, which redirects; link the target instead")
            elif url not in routes:
                errs.append(f"{where}: link to unknown route {url}")
            elif frag and frag[1:] not in ids[url]:
                errs.append(f"{where}: link to {url}{frag}, but that page has no such id")
        robots = re.search(r'<meta name="robots" content="([^"]+)">', h).group(1)
        if env == "staging":
            if "noindex" not in robots or 'class="env-banner"' not in h:
                errs.append(f"{where}: staging protections missing")
        else:
            if 'class="env-banner' in h or 'class="dangling"' in h:
                errs.append(f"{where}: staging content in a production build")
            if ("noindex" in robots) != (name in NOINDEX_PAGES):
                errs.append(f"{where}: robots '{robots}'")
    robots_txt = (pub / "robots.txt").read_text()
    headers = (pub / "_headers").read_text()
    if env == "staging" and ("Disallow: /\n" not in robots_txt or "X-Robots-Tag: noindex" not in headers.split("\n/")[0]):
        errs.append("public: staging robots.txt or X-Robots-Tag header missing")
    for loc in re.findall(r"<loc>([^<]+)</loc>", (pub / "sitemap.xml").read_text()):
        if loc[len(SITE_URL):] not in routes or loc.endswith(".html"):
            errs.append(f"sitemap: {loc}")
    # every published PDF is the file its checked manifest entry describes
    published = sorted(f.name for f in (pub / "downloads").glob("*.pdf"))
    if published != sorted(pdf_manifest):
        errs.append(f"public/downloads: PDFs {published} do not match the checked manifest {sorted(pdf_manifest)}")
    for name in published:
        e, f = pdf_manifest.get(name, {}), pub / "downloads" / name
        if e.get("sha256") != _sha256(f) or e.get("bytes") != f.stat().st_size:
            errs.append(f"public/downloads/{name}: file differs from its checked manifest entry")
    res = out / "restricted"
    restricted_routes = {page_route(n) for n in restricted_names}
    for name in restricted_names:
        h = (res / name).read_text()
        if 'content="noindex' not in h or "env-restricted" not in h:
            errs.append(f"restricted/{name}: protections missing")
        for url in re.findall(r'\b(?:href|src)="(/[^"#]*)', h):
            if not (url in restricted_routes or (url.startswith("/assets/") and (res / url.lstrip("/")).exists())):
                errs.append(f"restricted/{name}: link to {url}, which the restricted project does not serve")
    if not (res / "_worker.js").exists() or "noindex" not in (res / "_headers").read_text():
        errs.append("restricted: access worker or noindex header missing")
    # both projects carry a CSP that forbids framing and allows only the one inline script
    js_hash = base64.b64encode(hashlib.sha256(INLINE_JS.encode()).digest()).decode()
    for label, hdrs in (("public", headers), ("restricted", (res / "_headers").read_text() if (res / "_headers").exists() else "")):
        csp = re.search(r"^/\*\n(?:  .*\n)*?  Content-Security-Policy: ([^\n]+)", hdrs, re.M)
        if not csp or "frame-ancestors 'none'" not in csp.group(1) or f"'sha256-{js_hash}'" not in csp.group(1) \
                or "unsafe-inline" in csp.group(1):
            errs.append(f"{label}/_headers: Content-Security-Policy for /* is missing, allows framing or does not match the inline script")
    if (res / "functions").exists():
        errs.append("restricted: functions/ must not be shipped (the _worker.js guard replaces it)")
    for tree in (pub, res):
        for f in tree.rglob(".*"):
            errs.append(f"{f.relative_to(out)}: hidden file in a deployable folder")
    integ = out / "integration" / "modules"
    for mid in MODULES:
        for f in ("fragment.html", "module.css", "manifest.json", "preview.html"):
            if not (integ / mid / f).exists():
                errs.append(f"integration: module {mid} is missing {f}")
    if errs:
        raise BuildFailed("Output validation failed:\n  " + "\n  ".join(errs))


# ---------- install ----------
def build_lock():
    """Exclusive lock for the whole build (POSIX), so concurrent builds cannot mix PDFs or outputs."""
    lock = open(ROOT / ".build.lock", "w")
    try:
        import fcntl
    except ImportError:   # Windows: no advisory locking; run one build at a time
        print("WARNING: no build lock on this platform; do not run builds concurrently")
        return lock
    fcntl.flock(lock, fcntl.LOCK_EX)
    return lock


class RollbackFailed(Exception):
    """The install failed and restoring the previous output also failed. The previous output is still in `aside`."""
    def __init__(self, aside):
        super().__init__(aside)
        self.aside = aside


def install(built, names, source_files):
    """Replace ROOT/<name> with built/<name> for each output, and copy regenerated PDFs (source_files: pairs of
    built file -> source path) into src/downloads. Everything old is moved aside first and restored if any step
    fails or is interrupted, so the previous output is never left half-replaced."""
    aside = built.parent / "previous"
    aside.mkdir()
    moved, placed, sources_saved, sources_written = [], [], [], []
    try:
        for i, (_, dst) in enumerate(source_files):
            if dst.exists():
                shutil.copy2(dst, aside / f"source-{i}")
                sources_saved.append(i)
        for n in names:
            if (ROOT / n).exists():
                os.rename(ROOT / n, aside / n)
                moved.append(n)
        for n in names:
            os.rename(built / n, ROOT / n)
            placed.append(n)
        for i, (src, dst) in enumerate(source_files):
            sources_written.append(i)
            shutil.copy2(src, dst)
    except BaseException:
        # A second Ctrl-C, SIGTERM or SIGHUP must not cut the rollback short.
        stop = (signal.SIGINT, signal.SIGTERM, signal.SIGHUP)
        saved = {sig: signal.signal(sig, signal.SIG_IGN) for sig in stop}
        try:
            for n in reversed(placed):
                os.rename(ROOT / n, built / n)
            for n in reversed(moved):
                os.rename(aside / n, ROOT / n)
            for i in sources_written:
                _, dst = source_files[i]
                if i in sources_saved:
                    shutil.copy2(aside / f"source-{i}", dst)
                else:
                    dst.unlink(missing_ok=True)
        except BaseException as e:
            raise RollbackFailed(aside) from e
        finally:
            for sig, handler in saved.items():
                signal.signal(sig, handler)
        raise


def git_commit():
    try:
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        dirty = bool(subprocess.run(["git", "status", "--porcelain", "--", "."], cwd=ROOT, capture_output=True, text=True).stdout.strip())
        return sha or None, dirty
    except OSError:
        return None, None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build the NWPharmaTech.org site (see module docstring).")
    ap.add_argument("--env", choices=("staging", "production"), default="staging")
    ap.add_argument("--accept-index", action="store_true")
    ap.add_argument("--with-signup", action="store_true")
    ap.add_argument("--allow-stale-pdf", action="store_true")
    ap.add_argument("--locale", default="en")
    a = ap.parse_args(argv)
    env = a.env
    if a.locale != "en" and env == "production":
        raise SystemExit("Only English is approved for production. Translations need human translation and clinical review (docs/translation.md).")
    if a.allow_stale_pdf and env == "production":
        raise SystemExit("--allow-stale-pdf is for staging previews only.")

    def terminated(signum, frame):   # run the same clean-up and rollback as Ctrl-C
        raise KeyboardInterrupt(f"signal {signum}")
    signal.signal(signal.SIGTERM, terminated)
    signal.signal(signal.SIGHUP, terminated)
    lock = build_lock()
    tmp = Path(tempfile.mkdtemp(prefix=".build-tmp-", dir=ROOT))
    built = tmp / "out"
    keep_tmp = False
    try:
        try:
            content = Content(ROOT, a.locale)
            checks = build_print_sources(content, env, built / "build")
            pdf_dir, pdf_manifest, stale_pdfs = ensure_pdfs(checks, built / "build", tmp, a.allow_stale_pdf)
            page_names = sorted(p.name for p in (SRC / "pages").glob("*.html"))
            review, _ = build_tree(content, SRC / "pages", built / "public", env, with_signup=a.with_signup, pdfs=pdf_manifest)
            write_meta_files(built / "public", env, page_names, pdf_dir, sorted(pdf_manifest))
            write_citations(content, built / "public")
            if a.with_signup:
                problem = content.signup_provider_problem()
                if problem:
                    raise BuildFailed(f"--with-signup refused: {problem} (see docs/email-signup.md)")
                shutil.copytree(SRC / "optional" / "signup" / "functions", built / "public" / "functions")
            restricted_names = sorted(p.name for p in (SRC / "restricted").glob("*.html"))
            restricted_review, _ = build_tree(content, SRC / "restricted", built / "restricted", "staging", restricted=True, pdfs=pdf_manifest)
            # The restricted project is never published, but its review notes are still owed before legal review.
            restricted_review = [f"restricted/{p}: {t}" for p, t in restricted_review if not t.startswith("link to unbuilt page")]
            js_hash = base64.b64encode(hashlib.sha256(INLINE_JS.encode()).digest()).decode()
            (built / "restricted" / "_headers").write_text(
                "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n"
                "  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n"
                "  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()\n"
                f"  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self' "
                f"'sha256-{js_hash}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'\n")
            (built / "restricted" / "404.html").write_text(
                '<!DOCTYPE html>\n<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, '
                'initial-scale=1">\n<title>Not found | Restricted staging</title><meta name="robots" content="noindex, nofollow">\n'
                '<link rel="stylesheet" href="/assets/css/site.css"></head>\n<body><main id="main" class="section"><div class="container prose">\n'
                '<h1>Not found</h1><p>There is no page at this address in the restricted area. Access to this area does not '
                'confirm that anyone is eligible to invest.</p>\n'
                '<p><a class="btn btn-primary" href="/">Restricted index</a></p>\n</div></main></body></html>\n')
            shutil.copy2(SRC / "restricted-worker" / "_worker.js", built / "restricted" / "_worker.js")
            export_modules(ROOT, content, built / "public", built / "integration")

            blockers = ([f"{p}: {t}" for p, t in review] + content.review_items()
                        + content.production_blockers(a.accept_index) + content.leadership_blockers()
                        + [f"PDF out of date: {p}" for p in stale_pdfs])
            version_blockers, issued_versions = document_version_blockers(checks, env)
            blockers += version_blockers
            optional = content.optional_assets_missing()
            validate_output(built, env, page_names, restricted_names, pdf_manifest)
        except ContentError as e:
            raise BuildFailed(f"Content error:\n{e}")

        sha, dirty = git_commit()
        report = {"env": env, "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                  "source_commit": sha, "uncommitted_changes": dirty, "public_pages": page_names,
                  "restricted_pages": restricted_names, "publication_blockers": blockers,
                  "optional_assets_missing": optional, "restricted_review_items": restricted_review, "pdfs": pdf_manifest}
        (built / "build" / "build-report.json").write_text(json.dumps(report, indent=1))
        print(f"env={env} public_pages={len(page_names)} restricted_pages={len(restricted_names)}")
        print(f"facts used publicly={len(content.used_facts)} references cited={len(content.used_refs)}")
        print(f"publication blockers={len(blockers)}")
        for b in blockers:
            print("  " + b)
        print(f"restricted review items (restricted staging only)={len(restricted_review)}")
        for x in restricted_review:
            print("  " + x)
        print(f"optional assets not yet supplied (do not block)={len(optional)}")
        for o in optional:
            print("  " + o)
        if env == "production" and blockers:
            raise BuildFailed("Production build refused: publication blockers remain. The previous output is unchanged.")
        # regenerated and checked PDFs become the new sources, in the same transaction as the outputs
        regenerated = [] if pdf_dir.name == "pdf-current" else \
            [(pdf_dir / n, SRC / "downloads" / n) for n in sorted(pdf_manifest)] + \
            [(pdf_dir / "pdf-manifest.json", SRC / "downloads" / "pdf-manifest.json")]
        (tmp / "document-versions.json").write_text(json.dumps(issued_versions, indent=1, sort_keys=True) + "\n")
        regenerated.append((tmp / "document-versions.json", SRC / "downloads" / "document-versions.json"))
        install(built, OUTPUTS, regenerated)
        print("Installed: " + ", ".join(OUTPUTS))
    except RollbackFailed as e:
        keep_tmp = True
        traceback.print_exc()
        print(f"Install failed AND restoring the previous output failed. Nothing has been deleted: the previous output is "
              f"in {e.aside} and the new build in {built}. Move the previous output back by hand before building again.",
              file=sys.stderr)
        return 2
    except BuildFailed as e:
        print(str(e), file=sys.stderr)
        print("Build not installed; previous output left unchanged.", file=sys.stderr)
        return 1
    except Exception:
        traceback.print_exc()
        print("Build failed unexpectedly and was not installed; previous output left unchanged.", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Build interrupted and not installed; previous output left unchanged.", file=sys.stderr)
        return 130
    finally:
        if not keep_tmp:
            shutil.rmtree(tmp, ignore_errors=True)
        lock.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
