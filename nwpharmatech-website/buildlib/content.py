"""Load and validate the structured content in content/.

Every page placeholder resolves through here, so a changed dose, status or profile
updates every page and the generated PDFs consistently.
"""
from datetime import date
from pathlib import Path
import json
import re

ALLOWED_PROD = {"document", "primary"}
# Source types that are records of the programme: a public milestone or update without a public citation label
# is shown as 'Company records' only when its source is one of these. An instruction to the web team
# ('company-instruction') or an unadopted draft ('company-draft') records nothing the programme did or decided.
RECORD_TYPES = {"company-study-record", "company-record", "company-correspondence", "company-investor-document"}

# People: the title rules in docs/leadership-reconciliation.md, applied to the records logged in people.json.
TEASER_SOURCES = {"teaser-2026-08"}       # management (brief-2026-09-c): never sole authority for a current appointment
CONFIRMATION_TYPES = {"company-instruction", "confirmation"}
CONFIRMED_AFTER = "2026-09-23"            # a confirmation must postdate the round-4 instruction (brief-2026-09-c)
CURRENT_FROM = "2025-01-01"               # a current title or remit needs a record from 2025 onwards
CHAIR_OR_COMMITTEE = re.compile(r"\bchair|\badvisory (?:board|committee|council)\b|\bsteering committee\b|\bSAB\b", re.I)
_ABBREVIATIONS = {"ceo": "chief executive officer", "cso": "chief scientific officer", "coo": "chief operating officer",
                  "cfo": "chief financial officer", "ned": "non-executive director board member"}


def title_words(text):
    """A title as comparable words: case, '&', advisor/adviser, plurals of adviser and the usual abbreviations
    normalised ('NED' reads as a non-executive director, who is a board member)."""
    out = []
    for w in re.findall(r"[a-z]+(?:-[a-z]+)*", text.lower().replace("&", " and ")):
        w = re.sub(r"^advis[eo]rs?$", "adviser", w)
        out += _ABBREVIATIONS.get(w, w).split()
    return out


def title_agrees(role, title):
    """A record's title agrees with a shown title when it has every word of it: 'Senior Adviser' agrees with
    'Partner & Senior Regulatory and Clinical Advisor', 'Chief Executive Officer' with 'Founder & CEO'."""
    return bool(title) and set(title_words(role)) <= set(title_words(title))


def mentions(text, phrase):
    """True when the normalised words of phrase appear, in order and together, in text."""
    return f" {' '.join(title_words(phrase))} " in f" {' '.join(title_words(text))} "


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
        self.assets = self._load(c / "assets.json")["assets"]
        self.review = self._load(c / "review.json")["items"] if (c / "review.json").exists() else []
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
        def not_a_record(sid):
            """Why a public milestone or update may not rest on this source, or None if it may: it must be
            citable publicly (public_label) or be a company record (RECORD_TYPES)."""
            s = self.sources[sid]
            if s.get("public_label") or s.get("type") in RECORD_TYPES:
                return None
            return f"source {sid} is a {s.get('type')}, not a record; set public: false until a record supports it"
        for group in self.study["milestones"].values():
            for m in group:
                if m["status"] not in ("Planned", "In progress", "Completed"):
                    errs.append(f"milestone {m['title']}: bad status")
                if not m.get("source") or m["source"] not in self.sources:
                    errs.append(f"milestone {m['title']}: missing/unknown source")
                elif m.get("public") and not_a_record(m["source"]):
                    errs.append(f"milestone {m['title']}: {not_a_record(m['source'])}")
        for u in self.updates:
            date.fromisoformat(u["date"])
            if u["source"] not in self.sources:
                errs.append(f"update {u['title']}: unknown source")
            elif u.get("public") and not_a_record(u["source"]):
                errs.append(f"update {u['title']}: {not_a_record(u['source'])}")
        # people: a title ('role') is held only when management confirmed it or company records agree, and both are
        # checked here against the logged records (docs/leadership-reconciliation.md, "Title rules"); a withheld
        # title lives in role_records, never in 'role'
        groups = {g["id"] for g in self.people["groups"]}
        for p in self.people["people"]:
            who = f"person {p.get('id')}"
            for k in ("group", "name", "role", "role_status", "role_records", "public", "portrait", "descriptor",
                      "descriptor_records", "responsibilities", "bio", "bio_verification", "consent_to_publish"):
                if k not in p:
                    errs.append(f"{who}: missing '{k}'")
            if p.get("group") not in groups:
                errs.append(f"{who}: unknown group {p.get('group')}")
            if not isinstance(p.get("consent_to_publish"), bool):
                errs.append(f"{who}: consent_to_publish must be true or false")
            if p.get("bio_verification") not in self.verification_levels:
                errs.append(f"{who}: bad bio_verification {p.get('bio_verification')}")
            elif p.get("public") and p["bio_verification"] == "unconfirmed":
                errs.append(f"{who}: an unconfirmed biography must not be public")
            records = []
            for r in p.get("role_records", []):
                src = self.sources.get(r.get("source"))
                if not src:
                    errs.append(f"{who}: role record with unknown source {r.get('source')}")
                    continue
                if r.get("date") != src["date"]:
                    errs.append(f"{who}: role record date {r.get('date')} does not match source {r.get('source')}")
                if not r.get("wording"):
                    errs.append(f"{who}: role record without wording")
                elif r.get("title") and not mentions(r["wording"], r["title"]):
                    errs.append(f"{who}: role record title '{r['title']}' is not in its wording ({r['source']})")
                records.append((r, src))
            errs += [f"{who}: {e}" for e in self._title_problems(p, records) + self._remit_problems(p)]
            for s in p.get("sources", []):
                if s not in self.sources:
                    errs.append(f"{who}: unknown source {s}")
        self.ref_ids = ref_ids
        if errs:
            raise ContentError("\n".join(errs))

    @staticmethod
    def _title_problems(p, records):
        """'confirmed' needs a management confirmation that names the title. 'records-agree' needs two records
        giving it, one dated 2025 or later other than the teaser (which only corroborates), no record giving a
        different title unless marked 'compatible', and never a chair or committee title."""
        status, role = p.get("role_status"), p.get("role")
        if status not in ("confirmed", "records-agree", "unconfirmed"):
            return [f"bad role_status {status}"]
        if bool(role) != (status != "unconfirmed"):
            return ["'role' must be set exactly when role_status is confirmed or records-agree"]
        if status == "confirmed":
            if not any(src["type"] in CONFIRMATION_TYPES and src["date"] > CONFIRMED_AFTER and mentions(r["wording"], role)
                       for r, src in records):
                return [f"'confirmed' needs a role record from a management confirmation (source type "
                        f"{' or '.join(sorted(CONFIRMATION_TYPES))}, dated after {CONFIRMED_AFTER}) whose wording contains '{role}'"]
            return []
        if status == "unconfirmed":
            return []
        out = []
        if CHAIR_OR_COMMITTEE.search(role):
            out.append(f"'{role}' is a chair or committee title: shown only once management has confirmed it")
        agree = [(r, src) for r, src in records if title_agrees(role, r.get("title"))]
        if len(agree) < 2 or not any(r["source"] not in TEASER_SOURCES and src["date"] >= CURRENT_FROM for r, src in agree):
            out.append(f"'records-agree' needs two records giving '{role}', at least one dated 2025 or later other than "
                       f"the teaser (agreeing: {', '.join(r['source'] for r, _ in agree) or 'none'})")
        conflicts = [r["source"] for r, _ in records if r.get("title") and not title_agrees(role, r["title"]) and not r.get("compatible")]
        if conflicts:
            out.append(f"'records-agree' but {', '.join(conflicts)} give a different title than '{role}'")
        return out

    def _remit_problems(self, p):
        """A descriptor needs two supporting records and a responsibility (a current remit) one dated 2025 or later;
        in both, at least one of them is not the teaser, which can only corroborate. Neither may carry a chair or
        committee role unless management confirmed the title."""
        out = []

        def support(what, recs, least, current):
            ok = []
            for s in recs or []:
                src = self.sources.get(s.get("source"))
                if not src or not s.get("wording"):
                    out.append(f"{what}: supporting record needs a known source and its wording ({s.get('source')})")
                else:
                    ok.append((s["source"], src["date"]))
            if len(ok) < least or not any(s not in TEASER_SOURCES and (not current or d >= CURRENT_FROM) for s, d in ok):
                out.append(f"{what}: needs {'two supporting records' if least > 1 else 'a supporting record'}, "
                           f"at least one {'dated 2025 or later ' if current else ''}other than the teaser")

        if not p.get("descriptor"):
            out.append("missing descriptor")
        elif CHAIR_OR_COMMITTEE.search(p["descriptor"]):
            out.append("descriptor names a chair or committee role (a descriptor is never a title)")
        else:
            support(f"descriptor '{p['descriptor']}'", p.get("descriptor_records"), 2, False)
        for r in p.get("responsibilities") or []:
            if not isinstance(r, dict) or not r.get("text"):
                out.append("responsibility needs 'text' and 'records'")
                continue
            if CHAIR_OR_COMMITTEE.search(r["text"]) and p.get("role_status") != "confirmed":
                out.append(f"responsibility '{r['text']}' names a chair or committee role that management has not confirmed")
            support(f"responsibility '{r['text']}'", r.get("records"), 1, True)
        return out

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

    def review_items(self):
        """Open items in content/review.json (approvals and checks the team must complete before publication).
        They are never rendered on a page."""
        return [f"{i['page']}: {i['item']}" for i in self.review if not i.get("done")]

    def leadership_blockers(self):
        """Every public profile needs its title confirmed by management, the person's consent to publish, and a
        biography checked at document or primary level, as for facts (see docs/leadership-reconciliation.md).
        A title the records agree on is shown on staging; a withheld title leaves only the descriptor."""
        out = []
        for p in self.people["people"]:
            if not p["public"]:
                continue
            if p["role_status"] != "confirmed":
                shown = f"shows '{p['role']}'" if p["role"] else "no title shown"
                out.append(f"people.json: title for {p['name']} not confirmed by management ({p['role_status']}; {shown})")
            if not p["consent_to_publish"]:
                out.append(f"people.json: no consent to publish recorded for {p['name']}")
            if p["bio_verification"] not in ALLOWED_PROD:
                out.append(f"people.json: biography of {p['name']} checked only at {p['bio_verification']} level")
        return out

    def optional_assets_missing(self):
        """Assets whose slots render nothing until supplied and authorised. Never a publication blocker."""
        out = []
        for aid, a in self.assets.items():
            if not (a.get("authorised") and a.get("caption_approved", True) and (self.root / "src" / a["file"]).exists()):
                out.append(f"asset {aid}: {a['file']} (not supplied or not authorised)")
        for p in self.people["people"]:
            if p.get("public", True) and not (p["portrait"]["authorised"] and (self.root / "src" / p["portrait"]["file"]).exists()):
                out.append(f"portrait {p['id']}: {p['portrait']['file']} (not supplied or not authorised)")
        for mid, m in self.interviews.items():
            if not m.get("approved"):
                out.append(f"interview {mid}: recording, transcript and captions not supplied")
        return out

    def signup_provider_problem(self):
        """The sign-up form may be built only after a live provider test has been recorded and passed.

        The record is written by tools/test-signup-live.mjs, never by hand, and every case must hold the boolean
        true. Its digest (src/optional/signup/record.mjs) is recomputed here, so a record changed after the harness
        wrote it is refused. The digest is a checksum, not a signature: it cannot show who made the record."""
        import hashlib
        import re
        p = self.root / "content" / "signup-provider-test.json"
        if not p.exists():
            return "no live provider test recorded in content/signup-provider-test.json"
        try:
            t = json.loads(p.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            return f"content/signup-provider-test.json cannot be read ({e})"
        if not isinstance(t, dict):
            return "content/signup-provider-test.json is not a test record"
        if t.get("example"):
            return "content/signup-provider-test.json is the example file, not a recorded test"
        if t.get("harness") != "tools/test-signup-live.mjs":
            return "content/signup-provider-test.json was not written by tools/test-signup-live.mjs (harness)"
        fields = ("provider", "list", "date", "tested_by", "function_sha256", "digest")
        blank = [k for k in fields if not isinstance(t.get(k), str) or not t[k].strip()]
        if blank:
            return f"live provider test record incomplete ({', '.join(blank)} missing)"
        if t["provider"] not in ("buttondown", "webhook"):
            return f"live provider test record names an unknown provider ({t['provider']})"
        try:
            ok_date = bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", t["date"])) and date.fromisoformat(t["date"])
        except ValueError:
            ok_date = False
        if not ok_date:
            return f"live provider test record has no valid date ({t['date']}; YYYY-MM-DD)"
        fn = self.root / "src" / "optional" / "signup" / "functions" / "api" / "subscribe.js"
        if t["function_sha256"] != hashlib.sha256(fn.read_bytes()).hexdigest():
            return "the live provider test was run on a different version of subscribe.js; rerun tools/test-signup-live.mjs"
        required = {"new_address", "repeat_address", "invalid_address", "confirmation_email", "unsubscribe", "provider_outage"}
        cases = t.get("cases")
        if not isinstance(cases, dict):
            return "live provider test record has no cases"
        failed = sorted(k for k in required if not (isinstance(cases.get(k), dict) and cases[k].get("pass") is True
                                                    and isinstance(cases[k].get("observed"), str)))
        unknown = sorted(set(cases) - required)
        if failed or unknown:
            return f"live provider test not passed (cases not passed: {', '.join(failed) or 'none'}; unknown cases: {', '.join(unknown) or 'none'})"
        payload = [t["provider"], t["list"], t["date"], t["tested_by"], t["function_sha256"],
                   [[k, cases[k]["pass"], cases[k]["observed"]] for k in sorted(cases)]]
        try:
            digest = hashlib.sha256(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()
        except UnicodeEncodeError:
            digest = None
        if t["digest"] != digest:
            return "the live provider test record does not match its digest: it was changed after tools/test-signup-live.mjs wrote it; rerun the live test"
        return None
