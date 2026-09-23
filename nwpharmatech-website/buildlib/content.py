"""Load and validate the structured content in content/.

Every page placeholder resolves through here, so a changed dose, status or profile
updates every page and the generated PDFs consistently.
"""
from datetime import date
from pathlib import Path
import json

ALLOWED_PROD = {"document", "primary"}


class ContentError(Exception):
    pass


class Content:
    def __init__(self, root: Path, locale: str = "en"):
        self.root = root
        c = root / "content"
        self.sources = self._load(c / "sources.json")
        facts_file = self._load(c / "facts.json")
        self.verification_levels = facts_file["verification_levels"]
        self.facts = facts_file["facts"]
        self.people = self._load(c / "people.json")
        self.refs = self._load(c / "references.json")
        self.study = self._load(c / "study.json")
        self.updates = self._load(c / "updates.json")["updates"]
        self.documents = self._load(c / "documents.json")["documents"]
        self.interviews = self._load(c / "interviews.json")["modules"]
        self.ui = self._load(c / "ui" / f"{locale}.json")
        self.used_facts = {}   # fact id -> set(pages)
        self.used_refs = {}
        self._validate()

    @staticmethod
    def _load(p):
        try:
            return json.loads(p.read_text())
        except json.JSONDecodeError as e:
            raise ContentError(f"{p}: {e}")

    def _validate(self):
        errs = []
        for fid, f in self.facts.items():
            for k in ("value", "public", "source", "verification", "as_of"):
                if k not in f:
                    errs.append(f"fact {fid}: missing '{k}'")
            if f.get("source") and f["source"] not in self.sources:
                errs.append(f"fact {fid}: unknown source {f['source']}")
            if f.get("verification") not in self.verification_levels:
                errs.append(f"fact {fid}: bad verification {f.get('verification')}")
        ref_ids = {r["id"] for r in self.refs["items"]}
        cats = {c["id"] for c in self.refs["categories"]}
        for r in self.refs["items"]:
            if r["category"] not in cats:
                errs.append(f"ref {r['id']}: unknown category")
        for group in self.study["milestones"].values():
            for m in group:
                if m["status"] not in ("Planned", "In progress", "Completed"):
                    errs.append(f"milestone {m['title']}: bad status")
                if not m.get("source") or m["source"] not in self.sources:
                    errs.append(f"milestone {m['title']}: missing/unknown source")
        for u in self.updates:
            date.fromisoformat(u["date"])
            if u["source"] not in self.sources:
                errs.append(f"update {u['title']}: unknown source")
        self.ref_ids = ref_ids
        if errs:
            raise ContentError("\n".join(errs))

    # ---- lookups used by templates ----
    def fact(self, fid, page, public=True):
        if fid not in self.facts:
            raise ContentError(f"{page}: unknown fact '{fid}'")
        f = self.facts[fid]
        if public and not f["public"]:
            raise ContentError(f"{page}: fact '{fid}' is not approved for public pages")
        if public and f["verification"] == "unconfirmed":
            raise ContentError(f"{page}: fact '{fid}' is unconfirmed")
        self.used_facts.setdefault(fid, set()).add(page)
        return f["value"]

    def ref(self, rid, page):
        for r in self.refs["items"]:
            if r["id"] == rid:
                self.used_refs.setdefault(rid, set()).add(page)
                return r
        raise ContentError(f"{page}: unknown reference '{rid}'")

    def person(self, pid):
        for p in self.people["people"]:
            if p["id"] == pid:
                return p
        raise ContentError(f"unknown person {pid}")

    def production_blockers(self, accept_index=False):
        """Facts/references used publicly whose verification is not good enough for production."""
        out = []
        for fid, pages in sorted(self.used_facts.items()):
            f = self.facts[fid]
            ok = f["verification"] in ALLOWED_PROD or f.get("accept_for_production") or accept_index
            if not ok:
                out.append(f"fact {fid} ({f['verification']}) on {', '.join(sorted(pages))}")
        for rid, pages in sorted(self.used_refs.items()):
            r = next(x for x in self.refs["items"] if x["id"] == rid)
            ok = r["verification"] in ALLOWED_PROD or r.get("accept_for_production") or accept_index
            if not ok:
                out.append(f"reference {rid} ({r['verification']}) on {', '.join(sorted(pages))}")
        return out
