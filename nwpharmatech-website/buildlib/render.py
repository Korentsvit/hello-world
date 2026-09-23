"""Template expansion and generated blocks.

Placeholders in src/pages/*.html:
    {{fact:id}}          value of a fact (validated; public pages only use public facts)
    {{cite:ref-id}}      discreet source link to the evidence library entry
    {{ui:key}}           interface string
    {{block:name}}       generated HTML (see BLOCKS)
    {{block:name:arg}}   generated HTML with one argument
"""
from datetime import date
from html import escape
import re

TOKEN = re.compile(r"\{\{(fact|cite|ui|block):([a-z0-9_.\-]+)(?::([a-z0-9_.\-]+))?\}\}")
STATUS_CLASS = {"Planned": "st-planned", "In progress": "st-progress", "Completed": "st-done"}
RESULT_LABEL = {"positive": "Positive finding", "negative": "Negative finding", "inconclusive": "Inconclusive",
                "mixed": "Mixed findings", "descriptive": "Descriptive", "not-conducted": "Not conducted",
                "guidance": "Guidance"}
LABEL_TEXT = {"established": ("tag-established", "Established"), "emerging": ("tag-emerging", "Emerging evidence")}


def fmt_date(iso):
    d = date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%B %Y')}"


class Renderer:
    def __init__(self, content, env, root, available=None):
        self.c = content
        self.env = env
        self.root = root
        # pages present in this build; navigation omits pages that are not built yet
        self.available = available

    def _has(self, href):
        return self.available is None or href.split("#")[0] in self.available

    # ---------- entry ----------
    def expand(self, html, page, meta):
        self.page, self.meta = page, meta

        def repl(m):
            kind, key, arg = m.group(1), m.group(2), m.group(3)
            if kind == "fact":
                return escape(self.c.fact(key, page))
            if kind == "ui":
                return self.c.ui[key]
            if kind == "cite":
                return self.cite(key)
            fn = getattr(self, "b_" + key.replace("-", "_"), None)
            if not fn:
                raise KeyError(f"{page}: unknown block {key}")
            return fn(arg) if arg else fn()
        # blocks may emit fact/cite tokens, so expand twice
        return TOKEN.sub(repl, TOKEN.sub(repl, html))

    def cite(self, rid):
        r = self.c.ref(rid, self.page)
        return (f'<a class="cite" href="evidence.html#ref-{rid}">'
                f'<span class="visually-hidden">Source: </span>{escape(r["short"])}</a>')

    def src_label(self, sid):
        s = self.c.sources.get(sid) or {}
        return s.get("public_label")

    # ---------- navigation ----------
    def nav(self, meta):
        ui = self.c.ui
        active, section = meta.get("nav", ""), meta.get("section", "")
        desk = []
        for key, href, label in ui["primary_nav"]:
            if not self._has(href):
                continue
            cur = ' aria-current="page"' if key in (active, section) and key else ""
            if key == section and active != key:
                cur = ' aria-current="true"'
            desk.append(f'<li><a href="{href}"{cur}>{escape(label)}</a></li>')
        mob = ['<a class="mobile-home" href="index.html">Home</a>']
        cur_attr = ' aria-current="page"'
        for g in ui["groups"]:
            is_open = any(k == active for k, _, _ in g["items"])
            links = "".join(
                f'<li><a href="{h}"{cur_attr if k == active else ""}>{escape(l)}</a></li>'
                for k, h, l in g["items"] if self._has(h))
            mob.append(f'<details class="nav-group"{" open" if is_open else ""}><summary>{escape(g["title"])}</summary><ul>{links}</ul></details>')
        return "\n          ".join(desk), "\n        ".join(mob)

    def b_subnav(self, gid=None):
        gid = gid or self.meta.get("section")
        g = next((x for x in self.c.ui["groups"] if x["id"] == gid), None)
        if not g:
            return ""
        cur_attr = ' aria-current="page"'
        items = "".join(
            f'<li><a href="{h}"{cur_attr if k == self.meta.get("nav") else ""}>{escape(l)}</a></li>'
            for k, h, l in g["items"] if self._has(h))
        return (f'<nav class="subnav" aria-label="{escape(g["title"])}"><div class="container">'
                f'<span class="subnav-title">{escape(g["title"])}</span><ul>{items}</ul></div></nav>')

    # ---------- updates ----------
    def _updates(self):
        return sorted((u for u in self.c.updates if u["public"]), key=lambda u: u["date"], reverse=True)

    def b_latest_update(self):
        u = self._updates()[0]
        return (f'<article class="latest"><p class="latest-date"><time datetime="{u["date"]}">{fmt_date(u["date"])}</time>'
                f' · {escape(u["kind"].capitalize())}</p><h3>{escape(u["title"])}</h3><p>{escape(u["body"])}</p>'
                f'<p><a href="updates.html">All programme updates</a></p></article>')

    def b_updates_timeline(self):
        items = []
        for u in self._updates():
            items.append(f'<li><span class="when"><time datetime="{u["date"]}">{fmt_date(u["date"])}</time> · {escape(u["kind"].capitalize())}</span>'
                         f'<h3>{escape(u["title"])}</h3><p>{escape(u["body"])}</p></li>')
        return '<h2 class="visually-hidden">Timeline</h2><ol class="timeline">' + "".join(items) + "</ol>"

    # ---------- evidence key ----------
    def b_evidence_key(self):
        return ('<div class="evidence-key">'
                '<div><span class="tag tag-established">Established</span><p>Consistent evidence, systematic reviews, regulatory decisions or clinical guidelines.</p></div>'
                '<div><span class="tag tag-emerging">Emerging evidence</span><p>Small, short or early studies. Informative, not confirmed.</p></div>'
                '<div><span class="tag tag-open">Open question</span><p>Not yet known; what research aims to answer.</p></div>'
                '<div><span class="tag tag-company">Programme information</span><p>Facts about NWPT-SM32300 and our own studies. Not an assessment of evidence strength.</p></div>'
                '</div>')

    # ---------- people ----------
    def _portrait(self, p):
        path = self.root / "src" / p["portrait"]["file"]
        if p["portrait"]["authorised"] and path.exists():
            return f'<img class="portrait" src="{p["portrait"]["file"]}" alt="" width="96" height="96" loading="lazy">'
        return f'<div class="avatar" aria-hidden="true">{escape(p["initials"])}</div>'

    def _interview(self, p):
        mid = p.get("interview")
        m = self.c.interviews.get(mid) if mid else None
        if not m or not m["approved"]:
            return ""
        files = [m["video"], m["transcript"], m["captions"]]
        if not all(files) or not all((self.root / "src" / f).exists() for f in files):
            return ""
        return (f'<details class="interview"><summary>Interview: {escape(m["title"])}</summary>'
                f'<video controls preload="none" poster="{m.get("poster") or ""}" src="{m["video"]}">'
                f'<track kind="captions" srclang="en" label="English" src="{m["captions"]}" default></video>'
                f'<p><a href="{m["transcript"]}">Read the transcript</a></p></details>')

    def person_card(self, p, level="h3"):
        resp = "".join(f"<li>{escape(r)}</li>" for r in p["responsibilities"])
        aff = "".join(f"<li>{escape(a)}</li>" for a in p["affiliations"])
        disc = ""
        if p["disclosures"]:
            disc = "<h4>Disclosures</h4><ul>" + "".join(f"<li>{escape(d)}</li>" for d in p["disclosures"]) + "</ul>"
        feat = " person-featured" if p.get("featured") else ""
        focus = f'<p class="person-focus">{escape(p["focus"])}</p>' if p.get("focus") else ""
        return (f'<article class="person{feat}" id="{p["id"]}"><div class="person-head">{self._portrait(p)}'
                f'<div>{focus}<{level}>{escape(p["name"])}</{level}><p class="role">{escape(p["role"])}</p></div></div>'
                f'<p>{escape(p["bio"])}</p>'
                + (f'<h4>Responsibilities</h4><ul class="plain">{resp}</ul>' if resp else "")
                + (f'<h4>Affiliations</h4><ul class="plain">{aff}</ul>' if aff else "")
                + disc + self._interview(p) + "</article>")

    def b_people(self, group):
        ppl = [p for p in self.c.people["people"] if p["group"] == group]
        ppl.sort(key=lambda p: not p.get("featured"))
        return '<div class="people-grid">' + "".join(self.person_card(p) for p in ppl) + "</div>"

    def b_person(self, pid):
        return self.person_card(self.c.person(pid))

    # ---------- study ----------
    def b_study_summary(self):
        s = self.c.study["summary"]
        rows = [("What the study is intended to investigate", s["investigates"]),
                ("Current stage", s["stage"]), ("Completed so far", s["completed"]), ("Next milestone", s["next"])]
        dl = "".join(f"<div><dt>{escape(a)}</dt><dd>{escape(b)}</dd></div>" for a, b in rows)
        return (f'<section class="summary-panel" aria-labelledby="sum-h"><h2 id="sum-h">Summary</h2>'
                f'<p class="as-of">As of <time datetime="{s["as_of"]}">{fmt_date(s["as_of"])}</time></p>'
                f'<dl class="summary-dl">{dl}</dl></section>')

    def _milestone_rows(self, items):
        rows = []
        for m in items:
            if not m["public"]:
                continue
            when = f'<time datetime="{m["date"]}">{fmt_date(m["date"])}</time>' if m.get("date") else escape(m.get("date_text", ""))
            label = self.src_label(m["source"])
            src = escape(label) if label else "Company records"
            rows.append(f'<tr><th scope="row">{escape(m["title"])}</th>'
                        f'<td><span class="st {STATUS_CLASS[m["status"]]}">{m["status"]}</span></td>'
                        f'<td>{when}</td><td class="small">{src}</td></tr>')
        return "".join(rows)

    def b_milestones(self, kind):
        titles = {"clinical": "Clinical milestones", "operational": "Operational milestones", "funding": "Funding milestones"}
        body = self._milestone_rows(self.c.study["milestones"][kind])
        return (f'<div class="table-wrap"><table class="table-stack milestones"><caption>{titles[kind]}</caption>'
                f'<thead><tr><th scope="col">Milestone</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col">Source</th></tr></thead>'
                f'<tbody>{body}</tbody></table></div>')

    def b_registrations(self):
        rows = "".join(
            f'<tr><th scope="row">{escape(r["study"])}</th><td>{escape(r["registry"])}</td>'
            f'<td><a href="{r["url"]}" rel="external">{escape(r["id"])}</a></td></tr>'
            for r in self.c.study["registrations"] if r["public"])
        return (f'<div class="table-wrap"><table><caption>Registry entries</caption><thead><tr><th scope="col">Study</th>'
                f'<th scope="col">Registry</th><th scope="col">Identifier</th></tr></thead><tbody>{rows}</tbody></table></div>')

    def b_oversight(self):
        o = self.c.study["oversight"]
        p1 = "".join(f"<li>{escape(x['text'])}</li>" for x in o["phase1"])
        p2 = "".join(f"<li>{escape(x['text'])}</li>" for x in o["phase2b"]) if o["phase2b"] else ""
        out = f'<h3>Phase 1 study (completed)</h3><ul>{p1}</ul><h3>Phase 2B study (planned)</h3>'
        out += f"<ul>{p2}</ul>" if p2 else f"<p>{escape(o['phase2b_note'])}</p>"
        return out

    def b_design_sources(self):
        out = []
        for d in self.c.study["design_sources"]:
            if not d["public"]:
                continue
            items = "".join(f"<li>{escape(x)}</li>" for x in d["content"])
            out.append(f'<div class="card"><h3>{escape(d["title"])}</h3><p class="small">Source and version: {escape(d["version"])}</p><ul>{items}</ul></div>')
        return "".join(out)

    def b_endpoints(self):
        e = self.c.study["endpoints"]["confirmed"]
        if not e:
            return ""
        return "<h2>Endpoints</h2><ul>" + "".join(f"<li>{escape(x)}</li>" for x in e) + "</ul>"

    def b_document_history(self):
        out = []
        for d in self.c.documents:
            if not d["public"]:
                continue
            rows = "".join(f'<tr><th scope="row">{escape(h["version"])}</th><td><time datetime="{h["date"]}">{fmt_date(h["date"])}</time></td>'
                           f'<td>{escape(h["status"])}</td><td>{escape(h["change"])}</td></tr>' for h in d["history"])
            out.append(f'<div class="table-wrap"><table class="table-stack"><caption>{escape(d["title"])}</caption>'
                       f'<thead><tr><th scope="col">Version</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Substantive change</th></tr></thead>'
                       f'<tbody>{rows}</tbody></table></div>')
        return "".join(out)
