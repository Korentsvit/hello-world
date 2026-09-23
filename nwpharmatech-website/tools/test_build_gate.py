#!/usr/bin/env python3
"""Proves that a refused or failed build never touches the deployable output.

Works on a temporary copy of the project; the repository is not modified. For each failure case the
test records every file under public/, restricted/, build/ and integration/ (path, size, SHA-256 and
modification time) before the build and compares after it, and checks that no temporary build
directory is left behind. A successful staging build is run first and last as a positive control.

    python3 tools/test_build_gate.py
"""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
OUTPUTS = ("public", "restricted", "build", "integration")


def snapshot(site):
    snap = {}
    for out in OUTPUTS:
        base = site / out
        for p in sorted(base.rglob("*")) if base.exists() else []:
            if p.is_file():
                st = p.stat()
                snap[str(p.relative_to(site))] = (st.st_size, st.st_mtime_ns, hashlib.sha256(p.read_bytes()).hexdigest())
    return snap


def build(site, *args, env=None):
    return subprocess.run([sys.executable, "build.py", *args], cwd=site, capture_output=True, text=True, env=env)


results = []


def case(name, ok, detail=""):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"\n      {detail}" if detail and not ok else ""))


def expect_unchanged(site, name, proc, before, must_say):
    after = snapshot(site)
    leftovers = [p.name for p in site.glob(".build-tmp-*")]
    said = must_say in (proc.stdout + proc.stderr)
    changed = sorted(set(before) ^ set(after)) + sorted(k for k in before.keys() & after.keys() if before[k] != after[k])
    case(f"{name}: build exits non-zero", proc.returncode != 0, f"exit {proc.returncode}")
    case(f"{name}: reports '{must_say}'", said, (proc.stdout + proc.stderr)[-800:])
    case(f"{name}: previous output unchanged ({len(before)} files compared)", not changed, f"changed: {changed[:10]}")
    case(f"{name}: no temporary build directory left", not leftovers, str(leftovers))


with tempfile.TemporaryDirectory() as tmp:
    site = Path(tmp) / "site"
    shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns("node_modules", ".build-tmp-*", "docs", ".git"))
    nm = ROOT / "tools" / "node_modules"
    if nm.exists():
        os.symlink(nm.resolve(), site / "tools" / "node_modules")

    p = build(site)
    case("positive control: staging build succeeds and installs", p.returncode == 0 and (site / "public" / "index.html").exists(), p.stderr[-800:])
    staging_index = (site / "public" / "index.html").read_text()

    before = snapshot(site)
    p = build(site, "--env", "production")
    expect_unchanged(site, "production build with publication blockers", p, before, "Production build refused")
    case("refused production build left the staging protections in place",
         (site / "public" / "index.html").read_text() == staging_index and "noindex" in (site / "public" / "robots.txt").read_text() + staging_index)

    before = snapshot(site)
    p = build(site, "--env", "production", "--allow-stale-pdf")
    case("production refuses --allow-stale-pdf", p.returncode != 0 and snapshot(site) == before)

    page = site / "src" / "pages" / "faq.html"
    original = page.read_text()
    page.write_text(original.replace("</h1>", "</h1>{{fact:no.such.fact}}", 1))
    before = snapshot(site)
    p = build(site)
    expect_unchanged(site, "content error part-way through rendering", p, before, "unknown fact")
    page.write_text(original)

    redirects = site / "src" / "redirects.txt"
    original_redirects = redirects.read_text()
    redirects.write_text(original_redirects + "/study /study.html 301\n")
    before = snapshot(site)
    p = build(site)
    expect_unchanged(site, "redirect that loops with Cloudflare's .html handling", p, before, "shadows a page")
    redirects.write_text(original_redirects)

    header = site / "src" / "partials" / "header.html"
    original_header = header.read_text()
    header.write_text(original_header.replace('<link rel="canonical" href="{{canonical}}">', ""))
    before = snapshot(site)
    p = build(site)
    expect_unchanged(site, "output validation failure (canonical URL missing)", p, before, "Output validation failed")
    header.write_text(original_header)

    facts = site / "content" / "facts.json"
    original_facts = facts.read_text()
    d = json.loads(original_facts)
    d["facts"]["product.strength"]["value"] = "301 mg"
    facts.write_text(json.dumps(d))
    before = snapshot(site)
    no_node = dict(os.environ, PATH="/usr/bin:/bin")
    p = build(site, env=no_node)
    expect_unchanged(site, "facts in a PDF changed and the PDF cannot be regenerated", p, before, "PDFs are out of date")

    before_pdfs = {f.name: f.read_bytes() for f in (site / "src" / "downloads").glob("*")}
    p = build(site)
    manifest = json.loads((site / "src" / "downloads" / "pdf-manifest.json").read_text())
    brief = manifest["nwpharmatech-programme-brief.pdf"]
    case("changed fact: PDFs regenerated and checked during the build",
         p.returncode == 0 and brief["pass"] and "301 mg" in json.loads((site / "build" / "programme-brief.checks.json").read_text())["facts"]
         and before_pdfs["nwpharmatech-programme-brief.pdf"] != (site / "src" / "downloads" / "nwpharmatech-programme-brief.pdf").read_bytes(),
         p.stdout[-600:] + p.stderr[-600:])
    case("changed fact: new value on the site after a successful build", "301 mg" in (site / "public" / "index.html").read_text())
    facts.write_text(original_facts)

print(f"build gate tests: {sum(results)} passed, {len(results) - sum(results)} failed")
sys.exit(0 if all(results) else 1)
