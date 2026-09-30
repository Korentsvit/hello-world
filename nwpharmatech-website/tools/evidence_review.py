#!/usr/bin/env python3
"""Monthly evidence review support. Records only reviews that actually happened.

    python3 tools/evidence_review.py status
        Lists every library item with its verification level and flags items needing primary checks.
    python3 tools/evidence_review.py record --date 2026-10-21 --by "Dr A. Reviewer" \
        --method "Opened each DOI/PubMed record" --scope "All items" [--primary id1,id2]
        Appends a review to references.json 'review_log', updates 'last_checked', and marks listed
        items as primary-verified. Refuses future dates. Run by the scientific reviewer, not automatically.
"""
from datetime import date
from pathlib import Path
import argparse
import json

P = Path(__file__).resolve().parent.parent / "content" / "references.json"


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status")
    rec = sub.add_parser("record")
    rec.add_argument("--date", required=True)
    rec.add_argument("--by", required=True)
    rec.add_argument("--method", required=True)
    rec.add_argument("--scope", required=True)
    rec.add_argument("--primary", default="")
    a = ap.parse_args()
    d = json.loads(P.read_text())
    if a.cmd == "status":
        last = date.fromisoformat(d["last_checked"])
        print(f"Last checked {last} ({(date.today() - last).days} days ago); monthly review due if over 31 days.")
        for r in d["items"]:
            flag = "" if r["verification"] == "primary" else "  <- needs primary check"
            print(f"  {r['id']:<22} {r['verification']:<15}{flag}")
        return
    when = date.fromisoformat(a.date)
    if when > date.today():
        raise SystemExit("Refusing a future-dated review.")
    ids = [x for x in a.primary.split(",") if x]
    known = {r["id"] for r in d["items"]}
    for i in ids:
        if i not in known:
            raise SystemExit(f"Unknown item {i}")
    for r in d["items"]:
        if r["id"] in ids:
            r["verification"] = "primary"
    d["review_log"].append({"date": a.date, "type": "monthly review", "scope": a.scope, "method": a.method, "by": a.by})
    d["last_checked"] = max(d["last_checked"], a.date)
    P.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
    print(f"Recorded review on {a.date}; {len(ids)} item(s) marked primary-verified.")


if __name__ == "__main__":
    main()
