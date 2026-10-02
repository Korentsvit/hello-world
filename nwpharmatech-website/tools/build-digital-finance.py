#!/usr/bin/env python3
"""NWPT-055: build /funding/digital-programme-finance and keep its Funding-menu entry on every page.

  python3 tools/build-digital-finance.py

1. Every page's Funding menu gains "Digital programme finance" directly after "Programme financing" (idempotent;
   the relative prefix follows the page's own link to programme-financing.html).
2. site/funding/digital-programme-finance.html is assembled from the shell of a sub-directory page
   (updates/why-early-intervention-matters.html: header, menu, footer, all with ../ links) and the main content in
   release-032/source/digital-programme-finance.html. Page styles and script: dpf.css, dpf.js.
Re-running with unchanged sources changes nothing.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "release-032" / "site"
SRC = ROOT / "release-032" / "source" / "digital-programme-finance.html"
SHELL = SITE / "updates" / "why-early-intervention-matters.html"
OUT = SITE / "funding" / "digital-programme-finance.html"
V = "nwpt055"
URL = "https://www.nwpharmatech.org/funding/digital-programme-finance"
TITLE = "Digital Programme Finance | NWPharmaTech CHR-P Programme"
DESC = ("How NWPharmaTech is evaluating regulated private programme finance, milestone accountability and digital "
        "transparency for its investigational CHR-P development programme.")
LABEL = "Digital finance &amp; DeSci"   # NWPT-057 menu label (menus are maintained by build-funding-ia.py)

MENU_ITEM = re.compile(r'^(?P<ind>[ \t]*)<li><a href="(?P<pre>/|(?:\.\./)*)programme-financing\.html"(?: aria-current="page")?>Programme financing</a></li>\n', re.M)


def ensure_nav(path):
    s = path.read_text()
    if f">{LABEL}</a>" in s:
        return False
    new, n = MENU_ITEM.subn(lambda m: m.group(0) + f'{m.group("ind")}<li><a href="{m.group("pre")}funding/digital-programme-finance.html">{LABEL}</a></li>\n', s, count=1)
    if n:
        path.write_text(new)
    return bool(n)


def build_page():
    s = SHELL.read_text()
    s = re.sub(r"<title>.*?</title>", f"<title>{TITLE}</title>", s, count=1)
    for pat, val in [
        (r'<meta name="description" content="[^"]*" />', f'<meta name="description" content="{DESC}" />'),
        (r'<link rel="canonical" href="[^"]*" />', f'<link rel="canonical" href="{URL}" />'),
        (r'<meta property="og:title" content="[^"]*" />', f'<meta property="og:title" content="{TITLE}" />'),
        (r'<meta property="og:description" content="[^"]*" />', f'<meta property="og:description" content="{DESC}" />'),
        (r'<meta property="og:url" content="[^"]*" />', f'<meta property="og:url" content="{URL}" />'),
        (r'<meta property="og:image:alt" content="[^"]*" />', '<meta property="og:image:alt" content="NWPharmaTech — Digital programme finance" />'),
        (r'<meta name="twitter:title" content="[^"]*" />', f'<meta name="twitter:title" content="{TITLE}" />'),
        (r'<meta name="twitter:description" content="[^"]*" />', f'<meta name="twitter:description" content="{DESC}" />'),
    ]:
        s, n = re.subn(pat, lambda m, v=val: v, s, count=1)
        assert n == 1, pat
    s = re.sub(r'(<link rel="stylesheet" href="\.\./styles\.css\?v=[a-z0-9]+" />\n)',
               lambda m: m.group(1) + f'  <link rel="stylesheet" href="../dpf.css?v={V}" />\n  <link rel="stylesheet" href="../funding-nav.css?v=nwpt057" />\n', s, count=1)
    s = s.replace(' aria-current="page"', "")
    s, n = re.subn(rf'(<a href="\.\./funding/digital-programme-finance\.html")(>{LABEL}</a>)', r'\1 aria-current="page"\2', s, count=1)
    assert n == 1, "menu entry missing in shell"
    main = SRC.read_text().split("\n", 1)[1].rstrip() + "\n"
    s, n = re.subn(r"  <main id=\"main\">.*?</main>\n", lambda m: main, s, count=1, flags=re.S)
    assert n == 1, "main not found in shell"
    s, n = re.subn(r'  <script src="\.\./nav\.js', f'  <script src="../dpf.js?v={V}" defer></script>\n  <script src="../nav.js', s, count=1)
    assert n == 1
    OUT.parent.mkdir(exist_ok=True)
    if not OUT.exists() or OUT.read_text() != s:
        OUT.write_text(s)
        return True
    return False


if __name__ == "__main__":
    built = build_page()
    print(f"page {'written' if built else 'unchanged'}: {OUT.relative_to(SITE)}")
