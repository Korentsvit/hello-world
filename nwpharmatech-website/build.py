#!/usr/bin/env python3
"""Build the NWPharmaTech.org site. Python 3 standard library only.

    python3 build.py                  # staging build (default): noindex everywhere, staging banner
    python3 build.py --env production # production build: fails if anything unresolved remains

Outputs
    public/       the public website (deploy this)
    restricted/   access-controlled staging material (financing documents). Deploy ONLY
                  behind Cloudflare Access; see docs/deployment.md. Never copy into public/.

Page format: src/pages/*.html (public) and src/restricted/*.html start with

    ---
    title: Page title
    description: One-sentence meta description.
    nav: key-of-nav-item       (optional)
    robots: noindex, nofollow  (optional; staging forces noindex on every page)
    ---

Editorial markers
    [TBC: ...]   an unresolved fact. Highlighted in staging; a production build fails.
Images
    <figure class="asset" data-asset="assets/img/...jpg" data-alt="..."> ... </figure>
    If the file exists it is inserted as <img>. If not: staging shows a labelled slot;
    production drops render slots (class "asset-render") and keeps initials for portraits.
"""
from pathlib import Path
import html
import re
import shutil
import sys

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE_NAME = "NWPharmaTech"
SITE_URL = "https://www.nwpharmatech.org"

# Navigation. Desktop shows PRIMARY inline; mobile shows GROUPS as an accordion.
PRIMARY = [
    ("need", "clinical-need.html", "Clinical need"),
    ("science", "science.html", "The science"),
    ("programme", "programme.html", "The programme"),
    ("people", "people.html", "People"),
    ("updates", "updates.html", "Updates"),
    ("financing", "financing.html", "Financing"),
    ("contact", "contact.html", "Contact"),
]
GROUPS = [
    ("The research", [
        ("need", "clinical-need.html", "Clinical need"),
        ("science", "science.html", "The science"),
        ("evidence", "evidence.html", "Evidence & references"),
    ]),
    ("The programme", [
        ("programme", "programme.html", "NWPT-SM32300 & the Phase 2B study"),
        ("updates", "updates.html", "Programme updates"),
        ("people", "people.html", "People & governance"),
    ]),
    ("About", [
        ("financing", "financing.html", "Programme financing"),
        ("faq", "faq.html", "Questions & answers"),
        ("contact", "contact.html", "Contact"),
        ("legal", "legal.html", "Legal, privacy & accessibility"),
    ]),
]

TBC_RE = re.compile(r"\[TBC:[^\]]*\]")
FIGURE_RE = re.compile(
    r'<figure class="asset(?P<cls>[^"]*)" data-asset="(?P<src>[^"]+)" data-alt="(?P<alt>[^"]*)"'
    r'(?: data-initials="(?P<ini>[^"]*)")?>(?P<body>.*?)</figure>',
    re.S,
)


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


def nav_html(active, prefix=""):
    desk = []
    for key, href, label in PRIMARY:
        cur = ' aria-current="page"' if key == active else ""
        desk.append(f'<li><a href="{prefix}{href}"{cur}>{html.escape(label)}</a></li>')
    mob = []
    for title, items in GROUPS:
        is_open = any(k == active for k, _, _ in items)
        links = []
        for key, href, label in items:
            cur = ' aria-current="page"' if key == active else ""
            links.append(f'<li><a href="{prefix}{href}"{cur}>{html.escape(label)}</a></li>')
        mob.append(
            f'<details class="nav-group"{" open" if is_open else ""}>'
            f'<summary>{html.escape(title)}</summary><ul>{"".join(links)}</ul></details>'
        )
    return "\n          ".join(desk), "\n        ".join(mob)


def render_figures(page_html, out_dir, env, missing):
    def repl(m):
        cls, src, alt, ini, body = m.group("cls"), m.group("src"), m.group("alt"), m.group("ini"), m.group("body")
        exists = (out_dir / src).exists()
        is_render = "asset-render" in cls
        if exists:
            img = f'<img src="{src}" alt="{alt}" loading="lazy" decoding="async">'
            return f'<figure class="asset{cls} has-asset">{img}{body}</figure>'
        missing.append(src)
        if env == "production" and is_render:
            return ""  # never ship an empty render slot
        if ini is not None:
            slot = f'<div class="avatar" aria-hidden="true">{html.escape(ini)}</div>'
            label = '<p class="slot-note">Authorised portrait pending</p>' if env == "staging" else ""
            return f'<figure class="asset{cls} no-asset">{slot}{label}{body}</figure>'
        slot = (f'<div class="asset-slot" role="img" aria-label="{alt} (image pending)">'
                f'<span>Authorised render pending</span><code>{html.escape(src)}</code></div>')
        return f'<figure class="asset{cls} no-asset">{slot}{body}</figure>'

    return FIGURE_RE.sub(repl, page_html)


def build_tree(src_pages, out_dir, env, restricted=False):
    header = (SRC / "partials" / "header.html").read_text()
    footer = (SRC / "partials" / "footer.html").read_text()
    if out_dir.exists():
        shutil.rmtree(out_dir)
    shutil.copytree(SRC / "assets", out_dir / "assets")
    unresolved, missing = [], []
    prefix = "" if not restricted else "/"
    for page in sorted(src_pages.glob("*.html")):
        meta, body = parse(page.read_text(), page.name)
        title = meta["title"]
        full_title = SITE_NAME if page.name == "index.html" and not restricted else f"{title} | {SITE_NAME}"
        robots = meta.get("robots", "index, follow")
        if env == "staging" or restricted:
            robots = "noindex, nofollow"
        canonical = f"{SITE_URL}/" if page.name == "index.html" else f"{SITE_URL}/{page.name}"
        desk, mob = nav_html(meta.get("nav", ""), prefix=("https://www.nwpharmatech.org/" if restricted else ""))
        banner = ""
        if restricted:
            banner = ('<aside class="env-banner env-restricted" aria-label="Environment"><strong>Restricted staging.</strong> '
                      'Unapproved financing material for internal and legal review only. Not for distribution. '
                      'No investment function on this site is active.</aside>')
        elif env == "staging":
            banner = ('<aside class="env-banner" aria-label="Environment"><strong>Staging draft.</strong> '
                      'Not the live website. Content is under scientific, legal and regulatory review.</aside>')
        page_html = (
            header.replace("{{title}}", html.escape(full_title))
            .replace("{{description}}", html.escape(meta["description"]))
            .replace("{{robots}}", robots)
            .replace("{{canonical}}", canonical)
            .replace("{{nav}}", desk)
            .replace("{{mobile_nav}}", mob)
            .replace("{{env_banner}}", banner)
            + body
            + footer
        )
        page_html = render_figures(page_html, out_dir, env, missing)
        for t in TBC_RE.findall(page_html):
            unresolved.append((page.name, t))
        if env == "staging" or restricted:
            page_html = TBC_RE.sub(lambda m: f'<span class="tbc">{m.group(0)}</span>', page_html)
        (out_dir / page.name).write_text(page_html)
    return unresolved, missing


def write_headers(out_dir, env):
    lines = ["/*",
             "  X-Content-Type-Options: nosniff",
             "  Referrer-Policy: strict-origin-when-cross-origin",
             "  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()",
             "  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; "
             "script-src 'self' 'sha256-{js_hash}'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'"]
    if env == "staging":
        lines.append("  X-Robots-Tag: noindex, nofollow")
    lines += ["/financing.html", "  X-Robots-Tag: noindex, nofollow"]
    return "\n".join(lines) + "\n"


def main():
    env = "production" if "--env" in sys.argv and sys.argv[sys.argv.index("--env") + 1] == "production" else "staging"
    out = ROOT / "public"
    unresolved, missing = build_tree(SRC / "pages", out, env)

    import base64, hashlib
    inline = 'document.documentElement.classList.add("js");'
    js_hash = base64.b64encode(hashlib.sha256(inline.encode()).digest()).decode()
    (out / "_headers").write_text(write_headers(out, env).replace("{js_hash}", js_hash))
    (out / "_redirects").write_text((SRC / "redirects.txt").read_text())
    robots = "User-agent: *\nDisallow: /\n" if env == "staging" else \
        f"User-agent: *\nDisallow: /financing.html\nSitemap: {SITE_URL}/sitemap.xml\n"
    (out / "robots.txt").write_text(robots)
    urls = [p.name for p in sorted((SRC / "pages").glob("*.html")) if p.name not in ("financing.html",)]
    sitemap = "".join(f"<url><loc>{SITE_URL}/{'' if u == 'index.html' else u}</loc></url>" for u in urls)
    (out / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sitemap}</urlset>\n')
    for f in (SRC / "downloads").glob("*"):
        (out / "downloads").mkdir(exist_ok=True)
        shutil.copy2(f, out / "downloads" / f.name)
    shutil.copy2(SRC / "404.html", out / "404.html") if (SRC / "404.html").exists() else None

    r_unresolved, r_missing = build_tree(SRC / "restricted", ROOT / "restricted", "staging", restricted=True)
    (ROOT / "restricted" / "_headers").write_text(
        "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: private, no-store\n"
        "  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n")
    shutil.copytree(SRC / "restricted-functions", ROOT / "restricted" / "functions", dirs_exist_ok=True)

    print(f"env={env}  public pages={len(list(out.glob('*.html')))}  restricted pages={len(list((ROOT / 'restricted').glob('*.html')))}")
    print(f"unresolved markers (public): {len(unresolved)}")
    for page, t in unresolved:
        print(f"  {page}: {t}")
    print(f"missing image assets: {len(set(missing))}")
    for m in sorted(set(missing)):
        print(f"  {m}")
    if env == "production" and unresolved:
        raise SystemExit("Production build refused: unresolved [TBC] markers remain.")


if __name__ == "__main__":
    main()
