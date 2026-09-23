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
    - any leadership title not confirmed by management (content/people.json)
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
import subprocess
import sys
import tempfile
import traceback

from buildlib.content import Content, ContentError
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
NOINDEX_PAGES = {"financing.html"}   # public but not indexed (funding and financing)
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
    r = Renderer(content, env, ROOT, available=None if restricted else set(names), pdfs=pdfs)
    review = []
    ui = content.ui
    rendered = {}
    for name in names:
        meta, body = parse((src_pages / name).read_text(), name)
        full_title = ui["site_name"] if name == "index.html" and not restricted else f"{meta['title']} | {ui['site_name']}"
        robots = meta.get("robots", "noindex, nofollow" if name in NOINDEX_PAGES else "index, follow")
        if env == "staging" or restricted:
            robots = "noindex, nofollow"
        desk, mob = r.nav(meta)
        if restricted:
            banner = ('<aside class="env-banner env-restricted" aria-label="Environment"><strong>Restricted staging.</strong> '
                      'Unapproved financing material for internal and legal review only. Access to this area does not '
                      'confirm that anyone is eligible to invest. No investment, payment or token function is active.</aside>')
        elif env == "staging":
            banner = f'<aside class="env-banner" aria-label="Environment">{ui["staging_banner"]}</aside>'
        else:
            banner = ""
        page_html = header + body + footer
        if restricted:   # not on the public domain: no canonical URL
            page_html = re.sub(r'\s*<link rel="canonical" href="\{\{canonical\}\}">', "", page_html)
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
        rules.append((src, dst, code))
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


def write_meta_files(out, env, page_names, pdf_dir):
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
    disallow = "".join(f"Disallow: {page_route(n)}\n" for n in sorted(NOINDEX_PAGES))
    robots = "User-agent: *\nDisallow: /\n" if env == "staging" else \
        f"User-agent: *\n{disallow}Sitemap: {SITE_URL}/sitemap.xml\n"
    (out / "robots.txt").write_text(robots)
    locs = "".join(f"<url><loc>{SITE_URL}{page_route(n)}</loc></url>" for n in page_names if n not in NOINDEX_PAGES)
    (out / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{locs}</urlset>\n')
    (out / "downloads").mkdir(exist_ok=True)
    for f in pdf_dir.glob("*.pdf"):
        shutil.copy2(f, out / "downloads" / f.name)
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
        checks[t.name] = {"source": t.name, "pdf": PRINT_OUTPUTS[t.name],
                          "sha256": hashlib.sha256(expanded.encode()).hexdigest(),
                          "expected_pages": int(m.group(1)) if m else None, "facts": values}
        (out / (t.stem + ".checks.json")).write_text(json.dumps(checks[t.name], indent=1))
    return checks


def ensure_pdfs(checks, build_dir, tmp, allow_stale):
    """Returns (directory holding the PDFs to publish, manifest, stale list). Regenerates the PDFs when the
    facts they contain have changed, and requires every recorded check to pass."""
    current = SRC / "downloads"
    try:
        manifest = json.loads((current / "pdf-manifest.json").read_text())
    except (OSError, json.JSONDecodeError):
        manifest = {}

    def stale_in(man, d):
        bad = []
        for c in checks.values():
            e = man.get(c["pdf"])
            if not e or e.get("source_sha256") != c["sha256"] or not e.get("pass") or not (d / c["pdf"]).exists():
                bad.append(c["pdf"])
        return bad

    stale = stale_in(manifest, current)
    if not stale:
        return current, manifest, []
    out = tmp / "pdf"
    out.mkdir()
    for f in current.glob("*.pdf"):
        shutil.copy2(f, out / f.name)
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
    raise BuildFailed("The PDFs are out of date with the facts they contain and could not be regenerated and "
                      f"checked ({', '.join(stale)}).\n{detail}\nInstall the tools (cd tools && npm install) or, for a "
                      "staging preview only, pass --allow-stale-pdf.")


# ---------- validation of the built output ----------
def validate_output(out, env, page_names, restricted_names):
    """Checks the built tree before it is installed. Any failure aborts the build."""
    errs = []
    pub = out / "public"
    routes = {page_route(n) for n in page_names}
    redirect_sources = {line.split()[0] for line in (pub / "_redirects").read_text().splitlines()
                        if line.strip() and not line.startswith("#")}
    for name in page_names:
        h = (pub / name).read_text()
        where = f"public/{name}"
        canon = re.findall(r'<link rel="canonical" href="([^"]+)">', h)
        if canon != [SITE_URL + page_route(name)]:
            errs.append(f"{where}: canonical {canon}")
        if "[TBC" in h:
            errs.append(f"{where}: review marker rendered")
        for attr, url in re.findall(r'\b(href|src|poster)="(/[^"#]*)', h):
            if url.endswith(".html"):
                errs.append(f"{where}: link to {url} (Cloudflare redirects .html; link the route)")
            elif url.startswith(("/assets/", "/downloads/")):
                if not (pub / url.lstrip("/")).exists():
                    errs.append(f"{where}: missing file {url}")
            elif url not in routes and url not in redirect_sources:
                errs.append(f"{where}: link to unknown route {url}")
            elif url in redirect_sources:
                errs.append(f"{where}: link to {url}, which redirects; link the target instead")
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
    res = out / "restricted"
    for name in restricted_names:
        h = (res / name).read_text()
        if 'content="noindex' not in h or "env-restricted" not in h:
            errs.append(f"restricted/{name}: protections missing")
    if not (res / "functions" / "_middleware.js").exists() or "noindex" not in (res / "_headers").read_text():
        errs.append("restricted: access middleware or noindex header missing")
    if errs:
        raise BuildFailed("Output validation failed:\n  " + "\n  ".join(errs))


# ---------- install ----------
def install(built, names):
    """Replace ROOT/<name> with built/<name> for each output. Old trees are moved aside first and restored if
    any step fails, so the previous output is never left half-replaced. Concurrent builds install one at a time."""
    import fcntl
    lock = open(ROOT / ".build.lock", "w")
    fcntl.flock(lock, fcntl.LOCK_EX)
    aside = built.parent / "previous"
    aside.mkdir()
    moved, placed = [], []
    try:
        for n in names:
            if (ROOT / n).exists():
                os.rename(ROOT / n, aside / n)
                moved.append(n)
        for n in names:
            os.rename(built / n, ROOT / n)
            placed.append(n)
    except OSError:
        for n in placed:
            os.rename(ROOT / n, built / n)
        for n in moved:
            os.rename(aside / n, ROOT / n)
        raise
    finally:
        lock.close()


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

    tmp = Path(tempfile.mkdtemp(prefix=".build-tmp-", dir=ROOT))
    built = tmp / "out"
    try:
        try:
            content = Content(ROOT, a.locale)
            checks = build_print_sources(content, env, built / "build")
            pdf_dir, pdf_manifest, stale_pdfs = ensure_pdfs(checks, built / "build", tmp, a.allow_stale_pdf)
            page_names = sorted(p.name for p in (SRC / "pages").glob("*.html"))
            review, _ = build_tree(content, SRC / "pages", built / "public", env, with_signup=a.with_signup, pdfs=pdf_manifest)
            write_meta_files(built / "public", env, page_names, pdf_dir)
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
            (built / "restricted" / "_headers").write_text(
                "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n"
                "  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n")
            shutil.copytree(SRC / "restricted-functions", built / "restricted" / "functions")
            try:
                from buildlib.export import export_modules
            except ImportError:
                export_modules = None
            if export_modules:
                export_modules(ROOT, content, built / "public", built / "integration")
            else:
                (built / "integration").mkdir()

            blockers = ([f"{p}: {t}" for p, t in review] + content.review_items()
                        + content.production_blockers(a.accept_index) + content.leadership_blockers()
                        + [f"PDF out of date: {p}" for p in stale_pdfs])
            optional = content.optional_assets_missing()
            validate_output(built, env, page_names, restricted_names)
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
        install(built, OUTPUTS)
        if pdf_dir != SRC / "downloads":   # regenerated and checked: keep them as the new sources
            for f in list(pdf_dir.glob("*.pdf")) + [pdf_dir / "pdf-manifest.json"]:
                shutil.copy2(f, SRC / "downloads" / f.name)
        print("Installed: " + ", ".join(OUTPUTS))
    except BuildFailed as e:
        print(str(e), file=sys.stderr)
        print("Build not installed; previous output left unchanged.", file=sys.stderr)
        return 1
    except Exception:
        traceback.print_exc()
        print("Build failed unexpectedly and was not installed; previous output left unchanged.", file=sys.stderr)
        return 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
