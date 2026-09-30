#!/usr/bin/env python3
"""Proves that a refused, failed or interrupted build never touches the deployable output.

Works on a temporary copy of the project; the repository is not modified. For each failure case the
test records every file under public/, restricted/, build/, integration/ and src/downloads (path, size,
SHA-256 and modification time) before the build and compares after it, and checks that no temporary
build directory is left behind. Successful builds are run as positive controls.

    python3 tools/test_build_gate.py
"""
from pathlib import Path
import hashlib
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
TREES = ("public", "restricted", "build", "integration", "src/downloads")
NO_CHROMIUM = dict(os.environ, CHROMIUM="/nonexistent/chromium")   # PDF regeneration cannot run


def snapshot(site):
    snap = {}
    for out in TREES:
        base = site / out
        for p in sorted(base.rglob("*")) if base.exists() else []:
            if p.is_file():
                st = p.stat()
                snap[str(p.relative_to(site))] = (st.st_size, st.st_mtime_ns, hashlib.sha256(p.read_bytes()).hexdigest())
    return snap


def build(site, *args, env=None):
    return subprocess.run([sys.executable, "build.py", *args], cwd=site, capture_output=True, text=True, env=env)


def build_with_failing_rename(site, at, exc):
    """Runs build.main() with os.rename raising `exc` on its `at`-th call (a failure or Ctrl-C mid-install).
    `at` may be a tuple, to fail several calls (for example one during the install and one during its rollback)."""
    ats = at if isinstance(at, tuple) else (at,)
    code = (f"import os, sys; sys.path.insert(0, '.'); orig = os.rename; n = [0]\n"
            f"def rename(a, b):\n    n[0] += 1\n    if n[0] in {ats}: raise {exc}('injected at rename ' + str(n[0]))\n    return orig(a, b)\n"
            f"os.rename = rename\nimport build\nsys.exit(build.main([]))\n")
    return subprocess.run([sys.executable, "-c", code], cwd=site, capture_output=True, text=True)


results = []


def case(name, ok, detail=""):
    results.append(bool(ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"\n      {detail}" if detail and not ok else ""))


def expect_unchanged(site, name, proc, before, must_say, code=None):
    after = snapshot(site)
    leftovers = [p.name for p in site.glob(".build-tmp-*")]
    said = must_say in (proc.stdout + proc.stderr)
    changed = sorted(set(before) ^ set(after)) + sorted(k for k in before.keys() & after.keys() if before[k] != after[k])
    case(f"{name}: build exits non-zero" + (f" ({code})" if code else ""), proc.returncode != 0 and (code is None or proc.returncode == code), f"exit {proc.returncode}")
    case(f"{name}: reports '{must_say}'", said, (proc.stdout + proc.stderr)[-800:])
    case(f"{name}: previous output unchanged ({len(before)} files compared)", not changed, f"changed: {changed[:10]}")
    case(f"{name}: no temporary build directory left", not leftovers, str(leftovers))


def set_fact(site, fid, value):
    facts = site / "content" / "facts.json"
    d = json.loads(facts.read_text())
    d["facts"][fid]["value"] = value
    facts.write_text(json.dumps(d))


with tempfile.TemporaryDirectory() as tmp:
    site = Path(tmp) / "site"
    shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns("node_modules", ".build-tmp-*", "docs", ".git", ".build.lock"))
    nm = ROOT / "tools" / "node_modules"
    if nm.exists():
        os.symlink(nm.resolve(), site / "tools" / "node_modules")
    original_facts = (site / "content" / "facts.json").read_text()

    p = build(site)
    case("positive control: staging build succeeds and installs", p.returncode == 0 and (site / "public" / "index.html").exists(), p.stderr[-800:])
    staging_index = (site / "public" / "index.html").read_text()

    before = snapshot(site)
    p = build(site, "--env", "production")
    expect_unchanged(site, "production build with publication blockers", p, before, "Production build refused")
    case("refused production build left the staging protections in place",
         (site / "public" / "index.html").read_text() == staging_index and "Disallow: /" in (site / "public" / "robots.txt").read_text())

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
    for rule, says in (("/study /study.html 301", "shadows a page"), ("/:slug /study 301", "splats and placeholders"),
                       ("/privacy-policy /legal#no-such-anchor 301", "no id 'no-such-anchor'"),
                       ("/contactus /faq 301", "already has a rule"),
                       ("/downloads/old-brief.pdf /study 301", "not a free path"),
                       ("/robots.txt /study 301", "not a free path")):
        redirects.write_text(original_redirects + rule + "\n")
        before = snapshot(site)
        p = build(site)
        expect_unchanged(site, f"redirect rule '{rule}'", p, before, says)
    redirects.write_text(original_redirects)

    header = site / "src" / "partials" / "header.html"
    original_header = header.read_text()
    header.write_text(original_header.replace('<link rel="canonical" href="{{canonical}}">', ""))
    before = snapshot(site)
    p = build(site)
    expect_unchanged(site, "output validation failure (canonical URL missing)", p, before, "Output validation failed")
    header.write_text(original_header)

    exporter = site / "buildlib" / "export.py"
    original_exporter = exporter.read_text()
    exporter.write_text("from buildlib.render import NoSuchHelper\n" + original_exporter)
    before = snapshot(site)
    p = build(site)
    expect_unchanged(site, "module exporter cannot be imported", p, before, "ImportError")
    exporter.write_text(original_exporter)

    set_fact(site, "product.strength", "301 mg")
    before = snapshot(site)
    p = build(site, env=NO_CHROMIUM)
    expect_unchanged(site, "facts in a PDF changed and the PDF cannot be regenerated", p, before, "PDFs are out of date")

    before = snapshot(site)
    p = build(site, "--env", "production")
    expect_unchanged(site, "production refused after the PDFs were regenerated", p, before, "Production build refused")

    for at, exc, code in ((3, "OSError", 1), (5, "KeyboardInterrupt", 130)):
        before = snapshot(site)
        p = build_with_failing_rename(site, at, exc)
        expect_unchanged(site, f"{exc} during installation (rename {at})", p, before, "previous output left unchanged", code)

    # the install fails (rename 6: placing the second output) and so does the rollback (rename 9: moving the
    # last-moved previous output back). Nothing may be deleted: the previous output stays in the kept temp directory.
    before = snapshot(site)
    p = build_with_failing_rename(site, (6, 9), "OSError")
    kept = sorted(site.glob(".build-tmp-*"))
    aside = kept[0] / "previous" if kept else None
    case("rollback failure: build exits 2 and says so", p.returncode == 2 and "restoring the previous output failed" in p.stderr,
         f"exit {p.returncode}: {p.stderr[-600:]}")
    case("rollback failure: temporary directory kept and named", len(kept) == 1 and str(aside) in p.stderr, str(kept))
    if aside and aside.exists():
        for n in ("public", "restricted", "build", "integration"):
            if (aside / n).exists() and not (site / n).exists():
                os.rename(aside / n, site / n)
        shutil.rmtree(kept[0])
    case("rollback failure: previous output recoverable from the kept directory", snapshot(site) == before,
         str(sorted(set(before) ^ set(snapshot(site)))[:10]))
    for extra in site.glob(".build-tmp-*"):
        shutil.rmtree(extra)

    before = snapshot(site)
    proc = subprocess.Popen([sys.executable, "build.py"], cwd=site, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    deadline = time.time() + 30
    while time.time() < deadline and not list(site.glob(".build-tmp-*/pdf")):
        time.sleep(0.01)
    proc.send_signal(signal.SIGTERM)
    out, err = proc.communicate(timeout=120)
    expect_unchanged(site, "SIGTERM during PDF regeneration", subprocess.CompletedProcess(proc.args, proc.returncode, out, err),
                     before, "interrupted", 130)

    manifest_file = site / "src" / "downloads" / "pdf-manifest.json"
    p = build(site)
    manifest = json.loads(manifest_file.read_text())
    brief = manifest["nwpharmatech-programme-brief.pdf"]
    case("changed fact: PDFs regenerated and checked during the build",
         p.returncode == 0 and brief["pass"] is True and brief["missing_text"] == []
         and "301 mg" in json.loads((site / "build" / "programme-brief.checks.json").read_text())["facts"],
         p.stdout[-600:] + p.stderr[-600:])
    case("changed fact: new value on the site after a successful build", "301 mg" in (site / "public" / "index.html").read_text())
    published = site / "public" / "downloads" / "nwpharmatech-programme-brief.pdf"
    case("published PDF is byte-identical to its checked manifest entry",
         hashlib.sha256(published.read_bytes()).hexdigest() == brief["sha256"] and published.stat().st_size == brief["bytes"])

    downloads = site / "src" / "downloads"
    shutil.copy2(downloads / "appointment-preparation-sheet.pdf", downloads / "nwpharmatech-programme-brief.pdf")
    before = snapshot(site)
    p = build(site, env=NO_CHROMIUM)
    expect_unchanged(site, "PDF file swapped for another without regeneration", p, before, "do not match their checked manifest")
    p = build(site)
    published = site / "public" / "downloads" / "nwpharmatech-programme-brief.pdf"
    manifest = json.loads(manifest_file.read_text())
    case("swapped PDF: rebuilt from its source, and the published file matches its checked two-page entry",
         p.returncode == 0 and manifest["nwpharmatech-programme-brief.pdf"]["pages"] == 2
         and hashlib.sha256(published.read_bytes()).hexdigest() == manifest["nwpharmatech-programme-brief.pdf"]["sha256"]
         and published.read_bytes() != (downloads / "appointment-preparation-sheet.pdf").read_bytes(), p.stderr[-600:])

    shutil.copy2(downloads / "appointment-preparation-sheet.pdf", downloads / "old-draft-brief.pdf")
    p = build(site)
    case("a PDF without a checked source is not published",
         p.returncode == 0 and not (site / "public" / "downloads" / "old-draft-brief.pdf").exists()
         and "has no checked source" in p.stdout, p.stdout[-400:])
    (downloads / "old-draft-brief.pdf").unlink()

    (site / "content" / "facts.json").write_text(original_facts)

print(f"build gate tests: {sum(results)} passed, {len(results) - sum(results)} failed")
sys.exit(0 if all(results) else 1)
