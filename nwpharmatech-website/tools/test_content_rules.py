#!/usr/bin/env python3
"""Content rules of the correction release, each proved on a temporary copy (the repository is not modified):

  1. The programme brief is built from the same summary and results status as the study hub: a changed
     study.json summary.stage and summary.completed and facts.json phase1.results_status regenerate the brief,
     and the PDF text and the pages both carry the new wording.
  2. Crisis-line numbers are kept once (services.json 'crisis_lines'): a changed number and check date reach
     faq.html and the appointment preparation sheet PDF.
  3. A PDF header shows the newest version's status from documents.json while that version is unpublished,
     and no status once it is published.
  4. The official logo, once supplied and authorised, is embedded in both PDFs, which are regenerated.
  5. A public milestone or update sourced to a company instruction or a draft is refused by the build; the same
     milestone with public: false builds; the renderer never labels such a source 'Company records'.

    python3 tools/test_content_rules.py
"""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
OUTPUTS = {"public", "restricted", "build", "integration", "docs", ".git"}
PDF_TEXT = ('import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"; import fs from "node:fs";'
            'const d = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[1])), isEvalSupported: false }).promise;'
            'let t = ""; for (let i = 1; i <= d.numPages; i++) t += (await (await d.getPage(i)).getTextContent()).items.map((x) => x.str).join(" ") + "\\n";'
            'console.log(JSON.stringify({ pages: d.numPages, text: t }));')
results = []


def case(name, ok, detail=""):
    results.append(bool(ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"\n      {detail}" if detail and not ok else ""))


def copy_site(tmp, name):
    dst = Path(tmp) / name
    shutil.copytree(ROOT, dst, ignore=lambda d, names: [n for n in names if n == "node_modules" or n.startswith(".build-tmp-")
                                                       or (Path(d) == ROOT and n in OUTPUTS)])
    nm = ROOT / "tools" / "node_modules"
    if nm.exists():   # the PDFs are regenerated and checked by the build
        os.symlink(nm.resolve(), dst / "tools" / "node_modules")
    return dst


def edit_json(site, name, fn):
    p = site / "content" / name
    d = json.loads(p.read_text())
    fn(d)
    p.write_text(json.dumps(d, indent=1, ensure_ascii=False))


def build(site):
    return subprocess.run([sys.executable, "build.py"], cwd=site, capture_output=True, text=True)


def pdf(site, name):
    proc = subprocess.run(["node", "--input-type=module", "-e", PDF_TEXT, str(site / "src" / "downloads" / name)],
                          cwd=site / "tools", capture_output=True, text=True)
    if proc.returncode:
        raise SystemExit(f"cannot read {name}: {proc.stderr[-500:]}")
    d = json.loads(proc.stdout)
    return d["pages"], " ".join(d["text"].split())


def flat(html):
    import re
    from html import unescape
    return " ".join(unescape(re.sub(r"<[^>]+>", " ", html)).split())


with tempfile.TemporaryDirectory() as tmp:
    # ---- 1-4: one build with every change applied ----
    site = copy_site(tmp, "changed")
    STAGE, DONE = "TESTVALUE-stage-5512 protocol submitted.", "TESTVALUE-completed-5512 results published."
    RESULTS = "TESTVALUE-results-5512 Results summary published on both registries."

    def summary(d):
        d["summary"]["stage"], d["summary"]["completed"] = STAGE, DONE
    edit_json(site, "study.json", summary)
    edit_json(site, "facts.json", lambda d: d["facts"]["phase1.results_status"].update(value=RESULTS))

    def crisis(d):
        uk = d["crisis_lines"]["regions"][0]["lines"]
        next(x for x in uk if x.get("print", "").startswith("Samaritans"))["numbers"] = ["116 999"]
        d["crisis_lines"]["checked"] = "2026-10-01"
    edit_json(site, "services.json", crisis)
    edit_json(site, "documents.json", lambda d: next(x for x in d["documents"] if x["id"] == "brief")["history"][0].update(published=True))
    logo = site / "src" / "assets" / "img" / "brand" / "nwpharmatech-logo.svg"
    logo.parent.mkdir(parents=True, exist_ok=True)
    logo.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="30"><rect width="120" height="30" fill="#005EB8"/></svg>')
    edit_json(site, "assets.json", lambda d: d["assets"]["logo"].update(authorised=True))
    proc = build(site)
    case("build with changed summary, results status, crisis line, document status and logo", proc.returncode == 0,
         proc.stdout[-1500:] + proc.stderr[-1500:])
    if proc.returncode == 0:
        say = proc.stdout
        case("both PDFs are regenerated", "PDFs regenerated and checked:" in say and "nwpharmatech-programme-brief.pdf" in say
             and "appointment-preparation-sheet.pdf" in say, say[:300])
        brief_pages, brief = pdf(site, "nwpharmatech-programme-brief.pdf")
        sheet_pages, sheet = pdf(site, "appointment-preparation-sheet.pdf")
        study, phase1, faq = (flat((site / "public" / f"{n}.html").read_text()) for n in ("study", "phase-1", "faq"))
        # 1. the brief and the study hub say the same
        for label, text in (("stage", STAGE), ("completed work", DONE)):
            case(f"brief PDF and study hub show the changed {label}", text in brief and text in study)
        case("brief PDF, Phase 1 page and Q&A show the changed results status", RESULTS in brief and RESULTS in phase1 and RESULTS in faq)
        case("old stage and results wording gone from the brief", "Protocol being finalised" not in brief
             and "Results have not been published" not in brief)
        # 2. crisis lines kept once
        case("changed crisis number and check date on faq.html", 'href="tel:116999"' in (site / "public" / "faq.html").read_text()
             and "Last checked 1 October 2026" in faq)
        case("changed crisis number and check date on the appointment sheet PDF", "Samaritans 116 999" in sheet
             and "Numbers checked 1 October 2026" in sheet and "116 123" not in sheet)
        # 3. document status
        docs = {x["id"]: x["history"][0] for x in json.loads((site / "content" / "documents.json").read_text())["documents"]}
        case("published brief version: no status in the header", f"Version {docs['brief']['version']} · " in brief
             and docs["brief"]["status"] not in brief, brief[:200])
        newest = docs["appointment-sheet"]
        case("unpublished sheet version: status in the header", f"Version {newest['version']} · {newest['status']}" in sheet, sheet[:200])
        # 4. logo
        src = {n: (site / "build" / n).read_text() for n in ("programme-brief.html", "appointment-sheet.html")}
        case("official logo embedded in both PDF sources", all('src="data:image/svg+xml;base64,' in s for s in src.values()))
        case("interim text wordmark gone from both PDFs", "nw pharmatech" not in brief and "nw pharmatech" not in sheet)
        case("PDFs keep their page counts (brief 2, sheet 1)", (brief_pages, sheet_pages) == (2, 1), f"{brief_pages}, {sheet_pages}")
        man = json.loads((site / "src" / "downloads" / "pdf-manifest.json").read_text())
        case("regenerated PDFs passed their checks", all(e["pass"] for e in man.values()))

    # ---- baseline: status shown while unpublished ----
    base = copy_site(tmp, "base")
    proc = build(base)
    case("unchanged build succeeds", proc.returncode == 0, proc.stderr[-800:])
    if proc.returncode == 0:
        brief = pdf(base, "nwpharmatech-programme-brief.pdf")[1]
        case("unpublished brief version: 'Draft for review' in the header", "· Draft for review" in brief, brief[:200])
        study = (base / "public" / "study.html").read_text()
        case("no 'Company records' row for an instruction source on the study hub",
             "Programme financing route" not in study and "public registration before first enrolment" not in study)

    # ---- 5. milestones and updates must rest on a record ----
    for label, fn in (
        ("public milestone sourced to a company instruction",
         lambda d: next(m for m in d["milestones"]["funding"] if m["source"] == "brief-2026-09-b").update(public=True)),
        ("public milestone sourced to a draft",
         lambda d: d["milestones"]["clinical"][0].update(source="web3-2025-10"))):
        s = copy_site(tmp, "rule-" + str(len(results)))
        edit_json(s, "study.json", fn)
        proc = build(s)
        case(f"build refused: {label}", proc.returncode == 1 and "not a record" in proc.stderr, proc.stderr[-600:])
    s = copy_site(tmp, "rule-update")
    edit_json(s, "updates.json", lambda d: d["updates"][0].update(source="brief-2026-09"))
    proc = build(s)
    case("build refused: public update sourced to a company instruction", proc.returncode == 1 and "not a record" in proc.stderr,
         proc.stderr[-600:])
    s = copy_site(tmp, "rule-private")
    edit_json(s, "updates.json", lambda d: d["updates"][0].update(source="brief-2026-09", public=False))
    proc = build(s)
    case("the same update with public: false builds", proc.returncode == 0, proc.stderr[-600:])

    # the renderer's own guard, with content validation bypassed
    sys.path.insert(0, str(ROOT))
    from buildlib.content import Content, ContentError
    from buildlib.render import Renderer
    c = Content(ROOT)
    c.study = json.loads(json.dumps(c.study))
    next(m for m in c.study["milestones"]["funding"] if m["source"] == "brief-2026-09-b")["public"] = True
    try:
        out = Renderer(c, "staging", ROOT).expand("{{block:milestones:funding}}", "study.html", {})
        case("renderer refuses to label an instruction source 'Company records'", False, out[-300:])
    except ContentError as e:
        case("renderer refuses to label an instruction source 'Company records'", "no record" in str(e))

print(f"content rule tests: {sum(results)} passed, {len(results) - sum(results)} failed")
sys.exit(0 if all(results) else 1)
