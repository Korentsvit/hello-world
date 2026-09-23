#!/usr/bin/env python3
"""Proves that changing one fact (study status, dose-related fact, profile role) updates every page and the
generated brief source. Works on a temporary copy; the repository is not modified."""
from pathlib import Path
import json, os, shutil, subprocess, sys, tempfile

ROOT = Path(__file__).resolve().parent.parent
CASES = [
    ("facts.json", ["facts", "phase2b.protocol_status", "value"], "TESTVALUE-status-7731"),
    ("facts.json", ["facts", "product.strength", "value"], "TESTVALUE-dose-7731"),
]
ok = True
with tempfile.TemporaryDirectory() as tmp:
    dst = Path(tmp) / "site"
    top_level_outputs = {"public", "restricted", "build", "integration", "docs", ".git"}
    shutil.copytree(ROOT, dst, ignore=lambda d, names: [n for n in names if n == "node_modules" or n.startswith(".build-tmp-")
                                                       or (Path(d) == ROOT and n in top_level_outputs)])
    nm = ROOT / "tools" / "node_modules"
    if nm.exists():   # the changed facts appear in the PDFs, which the build regenerates and checks
        os.symlink(nm.resolve(), dst / "tools" / "node_modules")
    for fname, path, marker in CASES:
        p = dst / "content" / fname
        d = json.loads(p.read_text())
        orig = d
        node = d
        for k in path[:-1]:
            node = node[k]
        node[path[-1]] = marker
        p.write_text(json.dumps(d))
    # profile role
    pp = dst / "content" / "people.json"
    d = json.loads(pp.read_text())
    next(p for p in d["people"] if p["role_status"] in ("confirmed", "records-agree"))["role"] = "TESTVALUE-role-7731"
    pp.write_text(json.dumps(d))
    proc = subprocess.run([sys.executable, "build.py"], cwd=dst, capture_output=True, text=True)
    if proc.returncode:
        print(proc.stdout[-2000:], proc.stderr[-2000:])
        sys.exit("consistency test: FAIL (build failed)")
    pdf_manifest = json.loads((dst / "src" / "downloads" / "pdf-manifest.json").read_text())
    pages = {p.name: p.read_text() for p in (dst / "public").glob("*.html")}
    brief = (dst / "build" / "programme-brief.html").read_text()
    checks = {
        "TESTVALUE-status-7731": ["index.html", "programme.html", "study.html"],
        "TESTVALUE-dose-7731": ["index.html", "programme.html", "phase-1.html", "science.html", "faq.html"],
        "TESTVALUE-role-7731": ["people.html"],
    }
    for marker, expected in checks.items():
        found = sorted(n for n, h in pages.items() if marker in h)
        missing = [e for e in expected if e not in found]
        print(f"{marker}: on {', '.join(found)}" + (f"  MISSING on {missing}" if missing else ""))
        ok &= not missing
    for marker in ("TESTVALUE-status-7731", "TESTVALUE-dose-7731"):
        print(f"{marker} in generated brief: {marker in brief}")
        ok &= marker in brief
    checks_json = json.loads((dst / "build" / "programme-brief.checks.json").read_text())
    brief_pdf = pdf_manifest["nwpharmatech-programme-brief.pdf"]
    regenerated = brief_pdf["pass"] and brief_pdf["source_sha256"] == checks_json["sha256"] and "TESTVALUE-dose-7731" in checks_json["facts"]
    print(f"brief PDF regenerated and checked against the changed facts: {regenerated}")
    ok &= regenerated
    stale = [n for n, h in pages.items() if "protocol being finalised" in h.lower()]
    print("old status text left anywhere:", stale or "none")
    ok &= not stale
print("consistency test:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
