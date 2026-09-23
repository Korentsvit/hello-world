#!/usr/bin/env python3
"""Build the NWPharmaTech.org site from structured content. Python 3.9+ standard library only.

    python3 build.py                       # staging build (default): noindex, staging banner
    python3 build.py --env production      # refuses to build while blockers remain (see below)
    python3 build.py --env production --accept-index
                                           # allow facts/references verified only via search summaries
                                           # (use only after a documented primary-source check)
    python3 build.py --with-signup         # include the email sign-up form (only once the provider is
                                           # configured and tested; see docs/email-signup.md)

Outputs
    public/        public website (deploy to staging; see docs/deployment.md)
    restricted/    access-controlled staging material (separate Cloudflare Pages project behind Access)
    build/         generated sources for PDFs (programme brief, appointment sheet); not deployed

Production blockers
    - any [TBC: ...] marker on a public page
    - any fact or reference used publicly whose verification is not 'document' or 'primary'
      (unless --accept-index or accept_for_production is set on that item)
    - any missing image referenced by a render slot
"""
from pathlib import Path
import base64
import hashlib
import html
import re
import shutil
import sys

from buildlib.content import Content, ContentError
from buildlib.render import Renderer

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE_URL = "https://www.nwpharmatech.org"
TBC_RE = re.compile(r"\[TBC:[^\]]*\]")
INLINE_JS = 'document.documentElement.classList.add("js");'


def parse(text, name):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise SystemExit(f"{name}: missing metadata block")
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


def build_tree(content, src_pages, out_dir, env, restricted=False, with_signup=False):
    header = (SRC / "partials" / "header.html").read_text()
    footer = (SRC / "partials" / "footer.html").read_text()
    if out_dir.exists():
        shutil.rmtree(out_dir)
    shutil.copytree(SRC / "assets", out_dir / "assets")
    r = Renderer(content, env, ROOT, available=None if restricted else {p.name for p in src_pages.glob('*.html')})
    unresolved = []
    ui = content.ui
    for page in sorted(src_pages.glob("*.html")):
        meta, body = parse(page.read_text(), page.name)
        full_title = ui["site_name"] if page.name == "index.html" and not restricted else f"{meta['title']} | {ui['site_name']}"
        robots = meta.get("robots", "index, follow")
        if env == "staging" or restricted:
            robots = "noindex, nofollow"
        canonical = f"{SITE_URL}/" if page.name == "index.html" else f"{SITE_URL}/{page.name}"
        desk, mob = r.nav(meta)
        if restricted:
            banner = ('<aside class="env-banner env-restricted" aria-label="Environment"><strong>Restricted staging.</strong> '
                      'Unapproved financing material for internal and legal review only. Access to this area does not '
                      'confirm that anyone is eligible to invest. No investment, payment or token function is active.</aside>')
        elif env == "staging":
            banner = f'<aside class="env-banner" aria-label="Environment">{ui["staging_banner"]}</aside>'
        else:
            banner = ""
        page_html = (header + body + footer)
        page_html = (page_html.replace("{{title}}", html.escape(full_title))
                     .replace("{{description}}", html.escape(meta["description"]))
                     .replace("{{robots}}", robots)
                     .replace("{{canonical}}", canonical)
                     .replace("{{lang}}", ui["lang"])
                     .replace("{{nav}}", desk)
                     .replace("{{mobile_nav}}", mob)
                     .replace("{{env_banner}}", banner))
        page_html = strip_optional(page_html, with_signup)
        page_html = r.expand(page_html, page.name, meta)
        for t in TBC_RE.findall(page_html):
            unresolved.append((page.name, t))
        if env == "staging" or restricted:
            page_html = TBC_RE.sub(lambda m: f'<span class="tbc">{m.group(0)}</span>', page_html)
        (out_dir / page.name).write_text(page_html)
    dangling = resolve_dangling_links(out_dir, env)
    targets = sorted({t for _, t in dangling})
    unresolved += [("(several pages)", t) for t in targets]
    return unresolved, r


LINK_RE = re.compile(r'<a ([^>]*?)href="([a-z0-9\-]+\.html)(#[^"]*)?"([^>]*)>(.*?)</a>', re.S)


def resolve_dangling_links(out_dir, env):
    """Links to pages not in this build: unwrapped to plain text in staging (so partial increments stay
    usable) and reported; they block a production build."""
    built = {p.name for p in out_dir.glob("*.html")}
    problems = []
    for page in out_dir.glob("*.html"):
        text = page.read_text()

        def repl(m):
            if m.group(2) in built:
                return m.group(0)
            problems.append((page.name, f"[TBC: link to unbuilt page {m.group(2)}]"))
            return f'<span class="dangling">{m.group(5)}</span>'
        page.write_text(LINK_RE.sub(repl, text))
    return problems


def write_meta_files(out, env):
    js_hash = base64.b64encode(hashlib.sha256(INLINE_JS.encode()).digest()).decode()
    headers = ["/*",
               "  X-Content-Type-Options: nosniff",
               "  Referrer-Policy: strict-origin-when-cross-origin",
               "  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()",
               f"  Content-Security-Policy: default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self'; "
               f"script-src 'self' 'sha256-{js_hash}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"]
    if env == "staging":
        headers.append("  X-Robots-Tag: noindex, nofollow")
    headers += ["/financing.html", "  X-Robots-Tag: noindex, nofollow",
                "/downloads/*", "  X-Content-Type-Options: nosniff"]
    (out / "_headers").write_text("\n".join(headers) + "\n")
    (out / "_redirects").write_text((SRC / "redirects.txt").read_text())
    robots = "User-agent: *\nDisallow: /\n" if env == "staging" else \
        f"User-agent: *\nDisallow: /financing.html\nSitemap: {SITE_URL}/sitemap.xml\n"
    (out / "robots.txt").write_text(robots)
    urls = [p.name for p in sorted((SRC / "pages").glob("*.html")) if p.name != "financing.html"]
    locs = "".join(f"<url><loc>{SITE_URL}/{'' if u == 'index.html' else u}</loc></url>" for u in urls)
    (out / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{locs}</urlset>\n')
    (out / "downloads").mkdir(exist_ok=True)
    for f in (SRC / "downloads").glob("*"):
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


def build_print_sources(content, env):
    """Expand PDF templates (src/print/*.html) with the same content, for tools/make-pdf.mjs."""
    out = ROOT / "build"
    out.mkdir(exist_ok=True)
    r = Renderer(content, env, ROOT)
    for t in sorted((SRC / "print").glob("*.html")):
        (out / t.name).write_text(r.expand(t.read_text(), t.name, {}))


def main():
    args = sys.argv[1:]
    env = "production" if "--env" in args and args[args.index("--env") + 1] == "production" else "staging"
    accept_index = "--accept-index" in args
    with_signup = "--with-signup" in args
    try:
        content = Content(ROOT)
        unresolved, renderer = build_tree(content, SRC / "pages", ROOT / "public", env, with_signup=with_signup)
        write_meta_files(ROOT / "public", env)
        write_citations(content, ROOT / "public")
        build_print_sources(content, env)
        prod_blockers = content.production_blockers(accept_index)
        r_unresolved, _ = build_tree(content, SRC / "restricted", ROOT / "restricted", "staging", restricted=True)
    except ContentError as e:
        raise SystemExit(f"Content error:\n{e}")
    (ROOT / "restricted" / "_headers").write_text(
        "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n"
        "  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n")
    shutil.copytree(SRC / "restricted-functions", ROOT / "restricted" / "functions", dirs_exist_ok=True)

    blockers = [f"{p}: {t}" for p, t in unresolved] + prod_blockers
    pages = len(list((ROOT / "public").glob("*.html")))
    print(f"env={env} public_pages={pages} restricted_pages={len(list((ROOT / 'restricted').glob('*.html')))}")
    print(f"facts used publicly={len(content.used_facts)} references cited={len(content.used_refs)}")
    print(f"production blockers={len(blockers)}")
    for b in blockers:
        print("  " + b)
    if env == "production" and blockers:
        raise SystemExit("Production build refused.")


if __name__ == "__main__":
    main()
