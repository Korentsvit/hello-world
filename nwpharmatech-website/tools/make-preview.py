#!/usr/bin/env python3
"""Turn the built public/ site into a navigable preview for a static host that serves plain files without
Cloudflare's extensionless routes or _redirects (for example a Claude artifact):
  python3 tools/make-preview.py <out-dir>
- every page is kept, and every internal link becomes a relative file link: /study#x -> study.html#x, / -> index.html;
- short aliases from _redirects are resolved to their target, so no link depends on a redirect;
- the site stylesheet and script are inlined into each page (some preview hosts refuse separate CSS and JS files);
- images and downloads are copied unchanged; index.html is written without its <html>/<head>/<body> wrapper,
  because an artifact host wraps the entry page itself.
The deployable build for Cloudflare Pages is public/ itself; this preview is a review copy only."""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"


def main(out):
    out = Path(out)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    pages = {p.name for p in PUB.glob("*.html")}
    routes = {("/" if n == "index.html" else "/" + n[:-5]): n for n in pages}
    aliases = {}
    for line in (PUB / "_redirects").read_text().splitlines():
        parts = line.split()
        if len(parts) >= 2 and not line.startswith("#"):
            aliases[parts[0]] = parts[1]
    css = (PUB / "assets" / "css" / "site.css").read_text()
    js = (PUB / "assets" / "js" / "site.js").read_text()

    def local(url):
        if not url.startswith("/") or url.startswith("//"):
            return url
        path, _, frag = url.partition("#")
        if path in aliases:
            target = aliases[path]
            path, _, f2 = target.partition("#")
            frag = frag or f2
        if path in routes:
            return routes[path] + ("#" + frag if frag else "")
        if path.startswith(("/assets/", "/downloads/")):
            return path[1:] + ("#" + frag if frag else "")
        raise SystemExit(f"preview: no file for internal link {url}")

    def fix(html):
        html = re.sub(r'<link rel="stylesheet" href="[^"]*site\.css">', f"<style>\n{css}\n</style>", html)
        html = re.sub(r'<script src="[^"]*site\.js"( defer)?></script>', lambda m: f"<script>\n{js}\n</script>", html)
        html = re.sub(r'(<a\b[^>]*?)\sdownload(?:="[^"]*")?(?=[\s>])', r"\1", html)   # preview hosts may refuse downloads; open the file instead
        html = re.sub(r'\s(href|src)="([^"]+)"', lambda m: f' {m.group(1)}="{local(m.group(2))}"', html)
        html = re.sub(r'\ssrcset="([^"]+)"', lambda m: ' srcset="' + ", ".join(
            " ".join([local(x.split()[0])] + x.split()[1:]) for x in m.group(1).split(",")) + '"', html)
        return html

    count = 0
    for name in sorted(pages):
        html = fix((PUB / name).read_text())
        if name == "index.html":   # the artifact host supplies <html>, <head> and <body> for the entry page
            head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
            body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
            html = head + "\n" + body
        (out / name).write_text(html)
        count += 1
    for d in ("assets/img", "downloads"):
        shutil.copytree(PUB / d, out / d, ignore=shutil.ignore_patterns(".*"))
    files = [str(p.relative_to(out)) for p in sorted(out.rglob("*")) if p.is_file()]
    print(f"preview: {count} pages, {len(files)} files, {sum((out / f).stat().st_size for f in files) // 1024} KB -> {out}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "preview")
