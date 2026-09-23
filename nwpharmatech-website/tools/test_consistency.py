#!/usr/bin/env python3
"""Proves that changing one fact (study status, dose-related fact, profile role) updates every page and the
generated brief source. Works on a temporary copy; the repository is not modified."""
from pathlib import Path
import json, shutil, subprocess, sys, tempfile

ROOT = Path(__file__).resolve().parent.parent
CASES = [
    ("facts.json", ["facts", "phase2b.protocol_status", "value"], "TESTVALUE-status-7731"),
    ("facts.json", ["facts", "product.strength", "value"], "TESTVALUE-dose-7731"),
]
ok = True
with tempfile.TemporaryDirectory() as tmp:
    dst = Path(tmp) / "site"
    shutil.copytree(ROOT, dst, ignore=shutil.ignore_patterns("node_modules", "public", "restricted", "build", "docs"))
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
    d["people"][0]["role"] = "TESTVALUE-role-7731"
    pp.write_text(json.dumps(d))
    subprocess.run([sys.executable, "build.py"], cwd=dst, check=True, capture_output=True)
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
    stale = [n for n, h in pages.items() if "protocol being finalised" in h.lower()]
    print("old status text left anywhere:", stale or "none")
    ok &= not stale
print("consistency test:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
