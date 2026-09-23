#!/usr/bin/env python3
"""Proves the people rules in buildlib/content.py (docs/leadership-reconciliation.md, "Title rules"): a title is
shown only when a management confirmation names it or the logged records agree without leaning on the teaser;
descriptors and responsibilities need their own records; consent and biography checks block production.
Works on temporary copies; the repository is not modified.

    python3 tools/test_people.py
"""
from pathlib import Path
import copy, json, shutil, subprocess, sys, tempfile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from buildlib.content import Content, ContentError  # noqa: E402

PEOPLE = json.loads((ROOT / "content" / "people.json").read_text())
SOURCES = json.loads((ROOT / "content" / "sources.json").read_text())
CONFIRM = {"title": "Written confirmation of leadership titles", "date": "2026-10-01", "type": "confirmation",
           "location": "test", "public_label": None, "notes": "test"}
results = []


def load(change=None, sources=None):
    """Content built from content/ with people.json (and optionally sources.json) changed; (content, error)."""
    people, srcs = copy.deepcopy(PEOPLE), dict(SOURCES, **(sources or {}))
    if change:
        change({p["id"]: p for p in people["people"]})
    with tempfile.TemporaryDirectory() as tmp:
        shutil.copytree(ROOT / "content", Path(tmp) / "content")
        (Path(tmp) / "content" / "people.json").write_text(json.dumps(people))
        (Path(tmp) / "content" / "sources.json").write_text(json.dumps(srcs))
        try:
            return Content(Path(tmp)), ""
        except ContentError as e:
            return None, str(e)


def refused(name, expect, change=None, sources=None):
    c, err = load(change, sources)
    results.append((name, c is None and expect in err, err.splitlines()[:3] if err else "accepted"))


def accepted(name, change=None, sources=None, blockers=lambda b: True):
    c, err = load(change, sources)
    ok = c is not None and blockers(c.leadership_blockers())
    results.append((name, ok, err or ("" if ok else c.leadership_blockers())))


def setp(pid, **kw):
    return lambda ps: ps[pid].update(kw)


def confirm_record(pid, wording):
    return lambda ps: ps[pid]["role_records"].append({"source": "confirm-test", "date": "2026-10-01", "wording": wording})


def both(*fs):
    return lambda ps: [f(ps) for f in fs]


# ---- the current file ----
accepted("current people.json passes; every profile blocks production on title, consent and (index-level) biography",
         blockers=lambda b: sum("not confirmed by management" in x for x in b) == 9 and sum("no consent to publish" in x for x in b) == 9
         and sum("checked only at index level" in x for x in b) == 5)

# ---- 'confirmed' needs a management confirmation that names the title ----
kane_sab = setp("john-kane", role="Chair, Scientific Advisory Board", role_status="confirmed")
refused("one-word edit: Kane's SAB chair marked 'confirmed' without a confirmation record", "'confirmed' needs a role record", kane_sab)
refused("confirmation dated 23 Sep 2026 (not after the round-4 instruction)", "'confirmed' needs a role record",
        both(kane_sab, confirm_record("john-kane", "Chair, Scientific Advisory Board")), {"confirm-test": dict(CONFIRM, date="2026-09-23")})
refused("confirmation from an investor document (not a management confirmation)", "'confirmed' needs a role record",
        both(kane_sab, confirm_record("john-kane", "Chair, Scientific Advisory Board")), {"confirm-test": dict(CONFIRM, type="company-investor-document")})
refused("confirmation whose wording does not contain the title", "'confirmed' needs a role record",
        both(kane_sab, confirm_record("john-kane", "Management confirms Dr Kane's appointment")), {"confirm-test": CONFIRM})
accepted("a confirmation naming the title clears that title blocker only",
         both(setp("trevor-jones", role_status="confirmed"), confirm_record("trevor-jones", "Professor Trevor Jones CBE: Senior Adviser")),
         {"confirm-test": CONFIRM},
         blockers=lambda b: not any("title for Professor Trevor Jones" in x for x in b) and any("consent to publish recorded for Professor Trevor Jones" in x for x in b))

# ---- 'records-agree' is checked against the records ----
refused("records-agree: a chair or committee title", "chair or committee title", setp("john-kane", role="Chair, Scientific Advisory Board", role_status="records-agree"))
refused("records-agree: Gutseriev's COO, whose only 2025-2026 support is the teaser", "at least one dated 2025 or later other than the teaser",
        setp("daud-gutseriev", role="Chief Operating Officer", role_status="records-agree"))
refused("records-agree: Barker as Senior Adviser while the teaser gives a different title", "give a different title",
        setp("richard-barker", role="Senior Adviser", role_status="records-agree"))
refused("records-agree: Jones with only one agreeing record", "needs two records",
        lambda ps: ps["trevor-jones"].update(role_records=[r for r in ps["trevor-jones"]["role_records"] if r["source"] != "web3-2025-10"]))
refused("records-agree: a different title not marked 'compatible' (Korentsvit's signature)", "give a different title",
        lambda ps: [r.pop("compatible", None) for r in ps["filipp-korentsvit"]["role_records"]])
refused("a record's title must be quoted in its wording", "is not in its wording",
        lambda ps: ps["gillian-cannon"]["role_records"][0].update(title="Non-Executive Director"))
refused("an unknown role_status", "bad role_status", setp("gillian-cannon", role_status="agreed"))

# ---- descriptors and responsibilities ----
teaser = lambda w: {"source": "teaser-2026-08", "wording": w}
refused("descriptor resting on the teaser alone (Gutseriev 'Programme execution')", "needs two supporting records",
        setp("daud-gutseriev", descriptor="Programme execution", descriptor_records=[teaser("'COO; execution'")]))
refused("empty descriptor (always shown in place of a title)", "missing descriptor", setp("john-kane", descriptor=""))
refused("descriptor with one record", "needs two supporting records",
        lambda ps: ps["john-kane"].update(descriptor_records=ps["john-kane"]["descriptor_records"][:1]))
refused("descriptor naming a committee role", "descriptor names a chair or committee role", setp("john-kane", descriptor="Scientific Advisory Board"))
refused("responsibility resting on the teaser alone (Kane leads the programme's trial design)", "other than the teaser",
        setp("john-kane", responsibilities=[{"text": "Leads the programme's clinical trial design.", "records": [teaser("'clinical trial design led by Dr John Kane'")]}]))
refused("responsibility supported only by a record from before 2025", "dated 2025 or later",
        setp("daud-gutseriev", responsibilities=[{"text": "Leads operations.", "records": [{"source": "deck-2023-08", "wording": "'Chief Operating Officer'"}]}]))
refused("responsibility naming an unconfirmed committee role", "chair or committee role that management has not confirmed",
        setp("john-kane", responsibilities=[{"text": "Chairs the Scientific Advisory Board.", "records": [{"source": "web3-2025-10", "wording": "x"}]}]))
refused("responsibility as a bare string (no records)", "needs 'text' and 'records'", setp("john-kane", responsibilities=["Advises."]))

# ---- consent and biography verification ----
refused("consent_to_publish missing", "missing 'consent_to_publish'", lambda ps: ps["john-kane"].pop("consent_to_publish"))
refused("consent_to_publish not true or false", "consent_to_publish must be true or false", setp("john-kane", consent_to_publish="yes"))
accepted("consent recorded clears the consent blocker for that person only", setp("john-kane", consent_to_publish=True),
         blockers=lambda b: not any("consent to publish recorded for Dr John M. Kane" in x for x in b) and any("consent to publish recorded for Dr Scott" in x for x in b))
refused("bio_verification unknown", "bad bio_verification", setp("john-kane", bio_verification="checked"))
refused("bio_verification unconfirmed on a public profile", "unconfirmed biography", setp("john-kane", bio_verification="unconfirmed"))
accepted("a primary check clears the biography blocker", setp("trevor-jones", bio_verification="primary"),
         blockers=lambda b: not any("biography of Professor Trevor Jones" in x for x in b))

# ---- end to end: the review's reproduction no longer builds, even for staging ----
with tempfile.TemporaryDirectory() as tmp:
    dst = Path(tmp) / "site"
    outputs = {"public", "restricted", "build", "integration", "docs", ".git"}
    shutil.copytree(ROOT, dst, ignore=lambda d, names: [n for n in names if n == "node_modules" or n.startswith(".build-tmp-")
                                                       or (Path(d) == ROOT and n in outputs)])
    people = copy.deepcopy(PEOPLE)
    next(p for p in people["people"] if p["id"] == "john-kane").update(role="Chair, Scientific Advisory Board", role_status="confirmed")
    (dst / "content" / "people.json").write_text(json.dumps(people))
    proc = subprocess.run([sys.executable, "build.py"], cwd=dst, capture_output=True, text=True)
    results.append(("staging build refuses Kane's SAB chair marked 'confirmed' without a confirmation, and installs nothing",
                    proc.returncode != 0 and "'confirmed' needs a role record" in proc.stderr and not (dst / "public").exists(),
                    proc.stderr.strip().splitlines()[:3]))

ok = True
for name, passed, detail in results:
    print(("PASS  " if passed else "FAIL  ") + name + ("" if passed else f"  --  {detail}"))
    ok &= passed
print(f"people gate test: {'PASS' if ok else 'FAIL'} ({sum(r[1] for r in results)}/{len(results)})")
sys.exit(0 if ok else 1)
