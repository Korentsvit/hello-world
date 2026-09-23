#!/usr/bin/env python3
"""Assemble the static site: src/pages/*.html + shared partials -> public/*.html.

Each page starts with a metadata block:

    ---
    title: Page title
    description: One-sentence meta description.
    nav: science            (optional; key of the nav item to highlight)
    robots: noindex         (optional)
    ---

Usage: python3 build.py   (standard library only, no dependencies)
"""
from pathlib import Path
import re

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "public"
SITE_NAME = "NWPharmaTech"
SITE_URL = "https://www.nwpharmatech.org"

# Editorial markers ("[PLACEHOLDER: ...]", "[CONFIRM: ...]") are highlighted so
# nothing unfinished ships unnoticed. `grep -rn "PLACEHOLDER\|CONFIRM" src` lists them.
PLACEHOLDER_RE = re.compile(r"\[(?:PLACEHOLDER|CONFIRM)[^\]]*\]")

NAV = [
    ("need", "clinical-need.html", "Clinical need"),
    ("science", "science.html", "The science"),
    ("programme", "programme.html", "The programme"),
    ("people", "people.html", "People"),
    ("updates", "updates.html", "Updates"),
    ("financing", "financing.html", "Financing"),
    ("contact", "contact.html", "Contact"),
]


def parse(text):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ValueError("missing metadata block")
    meta = dict(
        (k.strip(), v.strip())
        for k, v in (line.split(":", 1) for line in m.group(1).splitlines() if line.strip())
    )
    return meta, text[m.end():]


def nav_html(active):
    items = []
    for key, href, label in NAV:
        current = ' aria-current="page"' if key == active else ""
        items.append(f'<li><a href="{href}"{current}>{label}</a></li>')
    return "\n          ".join(items)


def main():
    header = (SRC / "partials" / "header.html").read_text()
    footer = (SRC / "partials" / "footer.html").read_text()
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse(page.read_text())
        title = meta["title"]
        full_title = SITE_NAME if page.name == "index.html" else f"{title} | {SITE_NAME}"
        robots = meta.get("robots", "index, follow")
        canonical = f"{SITE_URL}/" if page.name == "index.html" else f"{SITE_URL}/{page.name}"
        html = (
            header.replace("{{title}}", full_title)
            .replace("{{description}}", meta["description"])
            .replace("{{robots}}", robots)
            .replace("{{canonical}}", canonical)
            .replace("{{nav}}", nav_html(meta.get("nav", "")))
            + body
            + footer
        )
        html = PLACEHOLDER_RE.sub(r'<span class="placeholder">\g<0></span>', html)
        (OUT / page.name).write_text(html)
        print(f"built {page.name}")


if __name__ == "__main__":
    main()
