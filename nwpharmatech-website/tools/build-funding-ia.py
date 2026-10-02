#!/usr/bin/env python3
"""NWPT-057: one funding architecture with three choices (idempotent).

  python3 tools/build-funding-ia.py

1. Every page's Funding menu lists exactly: Funding overview (/programme-financing), Use of funds (/funding-use),
   Digital finance & DeSci (/funding/digital-programme-finance). The link prefix follows the page's own existing
   Funding links; aria-current is kept on the current page.
2. /programme-financing and /funding-use carry the shared funding sub-navigation (the Digital finance & DeSci page
   carries it in release-032/source/digital-programme-finance.html, built by tools/build-digital-finance.py).
3. /desci is retired: internal links point to its replacement, the page file is removed and _redirects sends
   /desci, /desci/ and /desci.html to /funding/digital-programme-finance (301).
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "release-032" / "site"
DPF = "funding/digital-programme-finance.html"
ITEMS = [("programme-financing.html", "Funding overview"), ("funding-use.html", "Use of funds"), (DPF, "Digital finance &amp; DeSci")]
SUBNAV_V = "nwpt057"

MENU = re.compile(r'(<ul class="nav-dropdown" id="nav-dd-funding">\n)(.*?)(\n[ \t]*</ul>)', re.S)


def prefix_of(page):
    depth = len(page.relative_to(SITE).parts) - 1
    return "/" if page.name == "404.html" else "../" * depth


def menu(page):
    s = page.read_text()
    m = MENU.search(s)
    if not m:
        return False
    ind = re.match(r"[ \t]*", m.group(2)).group(0)
    pre = prefix_of(page)
    here = page.relative_to(SITE).as_posix()
    cur = ' aria-current="page"'
    lines = [f'{ind}<li><a href="{pre}{href}"{cur if href == here else ""}>{label}</a></li>' for href, label in ITEMS]
    new = s[:m.start(2)] + "\n".join(lines) + s[m.end(2):]
    if new != s:
        page.write_text(new)
        return True
    return False


def subnav(pre, current):
    links = []
    for href, label in [("programme-financing.html", "Overview"), ("funding-use.html", "Use of funds"), (DPF, "Digital finance &amp; DeSci")]:
        cur = ' aria-current="page"' if href == current else ""
        links.append(f'<a href="{pre}{href}"{cur}>{label}</a>')
    return f'    <nav class="funding-subnav" aria-label="Funding sections"><div class="funding-subnav__inner">{"".join(links)}</div></nav>\n'


def add_subnav(name):
    p = SITE / name
    s = p.read_text()
    block = subnav("", name)
    s2 = re.sub(r'    <nav class="funding-subnav".*?</nav>\n', "", s)
    s2 = s2.replace('  <main id="main">\n', '  <main id="main">\n' + block, 1)
    css = f'  <link rel="stylesheet" href="funding-nav.css?v={SUBNAV_V}" />\n'
    if "funding-nav.css" not in s2:
        s2 = re.sub(r'(  <link rel="stylesheet" href="styles\.css\?v=[a-z0-9]+" />\n)', lambda m: m.group(1) + css, s2, count=1)
    if s2 != s:
        p.write_text(s2)


def retire_desci():
    links = {
        "programme.html": ('<a href="desci.html">DeSci approach</a>', f'<a href="{DPF}">Digital finance &amp; DeSci</a>'),
        "updates/how-desci-could-help.html": ('<a href="../desci.html">DeSci overview</a>', f'<a href="../{DPF}">Digital finance &amp; DeSci</a>'),
    }
    for f, (a, b) in links.items():
        p = SITE / f
        s = p.read_text()
        if a in s:
            p.write_text(s.replace(a, b))
    d = SITE / "desci.html"
    if d.exists():
        d.unlink()
    r = SITE / "_redirects"
    s = r.read_text()
    block = ("# NWPT-057: /desci is retired; its content lives on Digital finance & DeSci\n"
             "/desci /funding/digital-programme-finance 301\n/desci/ /funding/digital-programme-finance 301\n"
             "/desci.html /funding/digital-programme-finance 301\n")
    if "/desci " not in s:
        r.write_text(s.rstrip("\n") + "\n" + block)


if __name__ == "__main__":
    changed = [p.relative_to(SITE).as_posix() for p in sorted(SITE.rglob("*.html")) if menu(p)]
    for name in ["programme-financing.html", "funding-use.html"]:
        add_subnav(name)
    retire_desci()
    left = [p.relative_to(SITE).as_posix() for p in SITE.rglob("*.html") if p.relative_to(SITE).as_posix() != DPF and re.search(r'href="[^"]*desci\.html"', p.read_text())]
    assert not left, f"links to desci.html remain: {left}"
    print(f"funding menu updated on {len(changed)} page(s)")
