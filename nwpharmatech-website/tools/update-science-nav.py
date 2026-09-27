#!/usr/bin/env python3
"""NWPT-048: grouped Science dropdown on every page (two learning routes, NWPT formulation, shared resources),
and Study synopsis moved to the Programme dropdown. Idempotent; keeps each page's own relative prefix."""
import pathlib, re, sys

SITE = pathlib.Path(__file__).resolve().parent.parent / "release-032" / "site"
OLD_SCIENCE = re.compile(
    r'(<ul class="nav-dropdown" id="nav-dd-science">)\s*<li><a href="(?P<p>[./]*)science\.html#investigating">Investigational formulation</a></li>.*?</ul>',
    re.S)
NEW_ITEMS = [
    ("", "science.html", "Science overview"),
    ("nav-dropdown__route", "science/psychiatry.html", "Psychiatry &amp; evidence"),
    ("nav-dropdown__route", "science/cannabinoids.html", "Understanding cannabinoids"),
    ("nav-dropdown__sub", "science/cbd-thc.html", "CBD and THC"),
    ("nav-dropdown__sub", "science/cannabinoid-medicines.html", "From cannabis to medicines"),
    ("nav-dropdown__sep", "science.html#investigating", "NWPT formulation"),
    ("", "evidence.html", "Evidence library"),
    ("", "glossary.html", "Glossary"),
]


def science_ul(p):
    lis = "".join(
        f'\n                  <li{f" class={chr(34)}{c}{chr(34)}" if c else ""}><a href="{p}{h}">{t}</a></li>' for c, h, t in NEW_ITEMS)
    return f'<ul class="nav-dropdown nav-dropdown--grouped" id="nav-dd-science">{lis}\n                </ul>'


def main():
    changed = 0
    for f in sorted(SITE.rglob("*.html")):
        s = f.read_text()
        m = OLD_SCIENCE.search(s)
        if m:
            p = m.group("p")
            s = s[:m.start()] + science_ul(p) + s[m.end():]
        else:
            g = re.search(r'<a href="(?P<p>[./]*)science\.html">Science overview</a>', s)
            if not g:
                continue
            p = g.group("p")
        # Study synopsis: now under Programme, after Study design
        a = f'<li><a href="{p}programme.html#design-title">Study design</a></li>'
        if a in s and not re.search(re.escape(a) + r'\s*<li><a href="[./]*resources/public-synopsis\.html">Study synopsis', s):
            s = s.replace(a, a + f'\n                  <li><a href="{p}resources/public-synopsis.html">Study synopsis</a></li>', 1)
        f.write_text(s)
        changed += 1
    print(f"updated {changed} pages")


if __name__ == "__main__":
    sys.exit(main())
