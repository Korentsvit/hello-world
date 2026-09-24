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
import base64
import json
import mimetypes
import re

from buildlib.content import RECORD_TYPES, ContentError

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
    def __init__(self, content, env, root, available=None, pdfs=None, nav_pages=None):
        self.c = content
        self.env = env
        self.root = root
        self.nav_pages = nav_pages   # restricted project: [(page, title)] replaces the public navigation
        self.page_name = None        # the page whose navigation is being rendered (set by build.py)
        self.pdfs = pdfs or {}   # pdf-manifest.json of the PDFs being published
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
        # The "Source:" prefix is link text, seen and announced once (not added again by CSS), and translatable.
        r = self.c.ref(rid, self.page)
        return (f'<a class="cite" href="evidence.html#ref-{rid}">'
                f'{escape(self.c.ui["source"])}: {escape(r["short"])}</a>')

    def src_label(self, sid):
        s = self.c.sources.get(sid) or {}
        return s.get("public_label")

    # ---------- navigation ----------
    def nav(self, meta):
        ui = self.c.ui
        if self.nav_pages is not None:
            return self._restricted_nav()
        active, section = meta.get("nav", ""), meta.get("section", "")
        desk = []
        for key, href, label in ui["primary_nav"]:
            if not self._has(href):
                continue
            cur = ' aria-current="page"' if key in (active, section) and key else ""
            if key == section and active != key:
                cur = ' aria-current="true"'
            desk.append(f'<li><a href="{href}"{cur}>{escape(label)}</a></li>')
        cur_attr = ' aria-current="page"'
        # Mobile: the only Home link, then the programme brief (a section of the public home page; restricted
        # pages have their own index), then one accordion group per section. The shared name makes the groups
        # exclusive (one open at a time); the group holding the current page starts open.
        quick = [f'<li><a href="index.html"{cur_attr if active == "home" else ""}>{escape(ui["home"])}</a></li>']
        if self.available and "index.html" in self.available:
            quick.append(f'<li><a href="index.html#programme-brief">{escape(ui["brief_link"])}</a></li>')
        mob = [f'<ul class="mobile-quick">{"".join(quick)}</ul>']
        for g in ui["groups"]:
            is_open = any(k == active for k, _, _ in g["items"])
            links = "".join(
                f'<li><a href="{h}"{cur_attr if k == active else ""}>{escape(l)}</a></li>'
                for k, h, l in g["items"] if self._has(h))
            mob.append(f'<details class="nav-group" name="mobile-nav-group"{" open" if is_open else ""}>'
                       f'<summary>{escape(g["title"])}</summary><ul>{links}</ul></details>')
        return "\n          ".join(desk), "\n        ".join(mob)

    def _restricted_nav(self):
        """The restricted project links only to its own pages (it serves nothing from the public site)."""
        cur_attr = ' aria-current="page"'
        links = "".join(f'<li><a href="{n}"{cur_attr if n == self.page_name else ""}>{escape(t)}</a></li>'
                        for n, t in self.nav_pages)
        return links, f'<ul class="mobile-quick">{links}</ul>'

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
    def b_evidence_key(self, variant=None):
        """The four labels with what each means (evidence library), or {{block:evidence_key:compact}}: the tags
        alone, with "Programme information" set apart because it is not a grade of evidence (homepage)."""
        if variant == "compact":
            return ('<div class="evidence-key-compact">'
                    '<ul class="key-grades" aria-label="Strength of evidence">'
                    '<li><span class="tag tag-established">Established</span></li>'
                    '<li><span class="tag tag-emerging">Emerging evidence</span></li>'
                    '<li><span class="tag tag-open">Open question</span></li></ul>'
                    '<p class="key-company"><span class="tag tag-company">Programme information</span> '
                    'Facts about our own studies, not a grade of evidence.</p></div>')
        return ('<div class="evidence-key">'
                '<div><span class="tag tag-established">Established</span><p>Consistent evidence, systematic reviews, regulatory decisions or clinical guidelines.</p></div>'
                '<div><span class="tag tag-emerging">Emerging evidence</span><p>Small, short or early studies. Informative, not confirmed.</p></div>'
                '<div><span class="tag tag-open">Open question</span><p>Not yet known; what research aims to answer.</p></div>'
                '<div><span class="tag tag-company">Programme information</span><p>Facts about NWPT-SM32300 and our own studies. Not an assessment of evidence strength.</p></div>'
                '</div>')

    # ---------- people ----------
    def _portrait(self, p):
        """The authorised portrait, or nothing at all: no initials, frame or empty slot."""
        path = self.root / "src" / p["portrait"]["file"]
        if p["portrait"]["authorised"] and path.exists():
            return f'<img class="portrait" src="{p["portrait"]["file"]}" alt="" width="96" height="96" loading="lazy">'
        return ""

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
        resp = "".join(f"<li>{escape(r['text'])}</li>" for r in p["responsibilities"])
        aff = "".join(f"<li>{escape(a)}</li>" for a in p["affiliations"])
        disc = ""
        if p["disclosures"]:
            disc = "<h4>Disclosures</h4><ul>" + "".join(f"<li>{escape(d)}</li>" for d in p["disclosures"]) + "</ul>"
        feat = " person-featured" if p.get("featured") else ""
        # the title only when management confirmed it or company records agree; the descriptor is never a title
        role = f'<p class="role">{escape(p["role"])}</p>' if p["role_status"] in ("confirmed", "records-agree") else ""
        return (f'<article class="person{feat}" id="{p["id"]}"><div class="person-head">{self._portrait(p)}'
                f'<div><p class="person-focus">{escape(p["descriptor"])}</p><{level}>{escape(p["name"])}</{level}>{role}</div></div>'
                f'<p>{escape(p["bio"])}</p>'
                + (f'<h4>Responsibilities</h4><ul class="plain">{resp}</ul>' if resp else "")
                + (f'<h4>Affiliations</h4><ul class="plain">{aff}</ul>' if aff else "")
                + disc + self._interview(p) + "</article>")

    def b_people(self, group):
        ppl = [p for p in self.c.people["people"] if p["group"] == group and p["public"]]
        ppl.sort(key=lambda p: not p.get("featured"))
        return '<div class="people-grid">' + "".join(self.person_card(p) for p in ppl) + "</div>"

    def b_person(self, pid):
        p = self.c.person(pid)
        return self.person_card(p) if p["public"] else ""

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
            if not label and self.c.sources[m["source"]].get("type") not in RECORD_TYPES:
                # content.py refuses this; an instruction or a draft is never shown as a company record
                raise ContentError(f"{self.page}: milestone '{m['title']}' has no record as its source")
            src = escape(label) if label else "NWPharmaTech records (not published)"
            rows.append(f'<tr><th scope="row">{escape(m["title"])}</th>'
                        f'<td data-label="Status"><span class="st {STATUS_CLASS[m["status"]]}">{m["status"]}</span></td>'
                        f'<td data-label="Date">{when}</td><td class="small" data-label="Source">{src}</td></tr>')
        return "".join(rows)

    def b_milestones(self, kind):
        titles = {"clinical": "Clinical milestones", "operational": "Operational milestones", "funding": "Funding milestones"}
        body = self._milestone_rows(self.c.study["milestones"][kind])
        if not body:   # no empty table: say that nothing is published
            return f'<p class="status-note">No {titles[kind].lower()} have been published.</p>'
        return (f'<div class="table-wrap"><table class="table-stack milestones"><caption>{titles[kind]}</caption>'
                f'<thead><tr><th scope="col">Milestone</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col">Source</th></tr></thead>'
                f'<tbody>{body}</tbody></table></div>')

    def b_registrations(self):
        rows = "".join(
            f'<tr><th scope="row">{escape(r["study"])}</th><td data-label="Registry">{escape(r["registry"])}</td>'
            f'<td data-label="Identifier"><a href="{r["url"]}" rel="external">{escape(r["id"])}</a></td></tr>'
            for r in self.c.study["registrations"] if r["public"])
        return (f'<div class="table-wrap"><table class="table-stack"><caption>Registry entries</caption><thead><tr><th scope="col">Study</th>'
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
        """The whole 'Document history' section, listing published versions only. Unpublished drafts are
        internal, so until a version is published the section (heading included) is omitted."""
        out = []
        for d in self.c.documents:
            rows = "".join(f'<tr><th scope="row">{escape(h["version"])}</th><td data-label="Date"><time datetime="{h["date"]}">{fmt_date(h["date"])}</time></td>'
                           f'<td data-label="Change">{escape(h["change"])}</td></tr>' for h in d["history"] if h.get("published"))
            if d["public"] and rows:
                out.append(f'<div class="table-wrap"><table class="table-stack"><caption>{escape(d["title"])}</caption>'
                           f'<thead><tr><th scope="col">Version</th><th scope="col">Date</th><th scope="col">Substantive change</th></tr></thead>'
                           f'<tbody>{rows}</tbody></table></div>')
        if not out:
            return ""
        return ('<section class="section section-alt" id="documents" aria-labelledby="doc-h"><div class="container">'
                '<h2 id="doc-h">Document history</h2><p class="status-note">Substantive changes to published documents.</p>'
                + "".join(out) + "</div></section>")

    def _newest_version(self, did):
        d = next((x for x in self.c.documents if x["id"] == did), None)
        if not d or not d["history"]:
            raise KeyError(f"{self.page}: no document history for {did}")
        return d["history"][0]

    def b_document_version(self, did):
        """'Version 3' for a document in content/documents.json (history is newest first). Used in PDF headers."""
        return f'Version {escape(self._newest_version(did)["version"])}'

    def b_site_url(self, page):
        """'www.nwpharmatech.org/study' for printed documents, following the live route map
        (src/integration-routes.json) when it moves a page, so a route change also changes the PDF."""
        import json
        over = self.root / "src" / "integration-routes.json"
        pages = json.loads(over.read_text()).get("pages", {}) if over.exists() else {}
        path = pages.get(page, "/" if page == "index" else "/" + page)
        return "www.nwpharmatech.org" + ("" if path == "/" else path)

    def b_document_date(self, did):
        """The newest version's date, for PDF headers (not the site-wide as-of date)."""
        return fmt_date(self._newest_version(did)["date"])

    def b_document_status(self, did):
        """' · Draft for review': the newest version's status from content/documents.json, printed in the PDF
        header until that version is published, then nothing. A status, never an instruction to the reader."""
        h = self._newest_version(did)
        if h.get("published"):
            return ""
        if not h.get("status"):
            raise KeyError(f"{self.page}: unpublished version {h['version']} of {did} has no status")
        return f' · {escape(h["status"])}'

    # ---------- brand ----------
    def b_dao_image(self, arg):
        """A picture from the DAO visual tranche (content/dao-images.json, tools/import-dao-visuals.mjs).
        arg: '<id>.<layout>[.eager]', layout 'wide' (full container), 'half' (a two-column side) or 'mark' (a small
        decorative section marker). Narrow screens get the 4:3 crop around the focal point; wider ones the supplied
        derivatives. Intrinsic width and height are set; images load lazily unless marked eager. Explanatory images
        carry a visible caption; decorative ones have empty alt text and no caption."""
        iid, layout, *flags = arg.split(".")
        im = json.loads((self.root / "content" / "dao-images.json").read_text())["images"][iid]
        url = lambda f: "/assets/img/" + f["file"]
        srcset = lambda fs: ", ".join(f"{url(f)} {f['width']}w" for f in fs)
        big = im["files"][-1]
        if layout == "mark":
            small = im["files"][0]
            return (f'<img class="dao-mark" src="{url(small)}" srcset="{srcset(im["files"][:2])}" sizes="48px" '
                    f'width="{small["width"]}" height="{small["height"]}" alt="" loading="lazy" decoding="async">')
        sizes = "(min-width: 1120px) 1088px, calc(100vw - 32px)" if layout == "wide" else "(min-width: 900px) 540px, calc(100vw - 32px)"
        load = 'fetchpriority="high"' if "eager" in flags else 'loading="lazy" decoding="async"'
        mobile = (f'<source media="(max-width: 600px)" type="image/webp" srcset="{srcset(im["mobile"])}" sizes="calc(100vw - 32px)" '
                  f'width="{im["mobile"][-1]["width"]}" height="{im["mobile"][-1]["height"]}">') if im["mobile"] else ""
        pic = (f'<picture>{mobile}<img src="{url(big)}" srcset="{srcset(im["files"])}" sizes="{sizes}" width="{big["width"]}" '
               f'height="{big["height"]}" alt="{escape(im["alt"])}" {load}></picture>')
        cap = f'<figcaption>{escape(im["caption"])}</figcaption>' if im.get("caption") else ""
        return f'<figure class="dao-figure dao-{layout}">{pic}{cap}</figure>'

    def b_brand(self, where):
        """The official logo once supplied and authorised (content/assets.json 'logo'); until then the
        interim mark with the text wordmark. One switch changes the header, footer and favicon."""
        a = self.c.assets["logo"]
        official = a["authorised"] and (self.root / "src" / a["file"]).exists()
        if where == "icon":
            return a["file"] if official else "assets/img/mark.svg"
        if where == "print":
            # PDF templates (src/print): the logo is embedded, so the PDF needs no asset files, and a new or
            # replaced logo changes the PDF source, which makes the build regenerate the PDFs
            if not official:
                return "nw <span>pharmatech</span>"
            data = base64.b64encode((self.root / "src" / a["file"]).read_bytes()).decode()
            mime = mimetypes.guess_type(a["file"])[0] or "image/svg+xml"
            return f'<img class="brand-logo" src="data:{mime};base64,{data}" alt="{escape(a["alt"])}" height="30">'
        if official:
            return f'<img class="brand-logo" src="{a["file"]}" alt="" height="36">' if where == "header" else \
                   f'<img class="brand-logo" src="{a["file"]}" alt="{escape(a["alt"])}" height="32">'
        if where == "header":
            return ('<img src="assets/img/mark.svg" alt="" width="36" height="36">'
                    '<span class="brand-name">nw <span>pharmatech</span></span>')
        return "nw <span>pharmatech</span>"

    # ---------- assets ----------
    def b_asset(self, aid):
        """An authorised image with its approved caption, or nothing at all: no empty figure, orphan caption or
        reserved space, so the surrounding layout must read as finished without it (docs/asset-manifest.md)."""
        a = self.c.assets[aid]
        if not (a["authorised"] and a["caption_approved"] and (self.root / "src" / a["file"]).exists()):
            return ""
        return (f'<figure class="asset-figure"><img src="{a["file"]}" alt="{escape(a["alt"])}" '
                f'width="{a["width"]}" height="{a["height"]}" loading="lazy">'
                f'<figcaption>{escape(a["caption"])}</figcaption></figure>')

    # ---------- Phase 1 ----------
    def b_phase1_results(self):
        p = self.c.study["phase1"]
        r = p.get("results")
        if not r:   # the status is the shared fact, which the programme brief prints too
            return (f'<p><span class="st st-planned">Not yet published</span></p>'
                    f'<p>{escape(self.c.fact("phase1.results_status", self.page))}</p>')
        rows = "".join(f'<tr><th scope="row">{escape(x["measure"])}</th><td>{escape(x["finding"])}</td></tr>' for x in r["table"])
        return (f'<p class="as-of">Results as of <time datetime="{r["as_of"]}">{fmt_date(r["as_of"])}</time>. Source: {escape(r["source"])}</p>'
                f'<p>{escape(r["summary"])}</p><div class="table-wrap"><table><caption>Phase 1 results</caption>'
                f'<thead><tr><th scope="col">Measure</th><th scope="col">Finding</th></tr></thead><tbody>{rows}</tbody></table></div>'
                f'<h3>Limitations</h3><p>{escape(r["limitations"])}</p>')

    def b_phase1_results_short(self):
        """The 'Results' entry of the Phase 1 summary: follows study.json phase1.results, as the results section does."""
        return '<a href="#results">Published: see below</a>' if self.c.study["phase1"].get("results") else "Not yet published"

    def b_phase1_list(self, key):
        return '<ul class="checklist">' + "".join(f"<li>{escape(x)}</li>" for x in self.c.study["phase1"][key]) + "</ul>"

    def b_phase1_measured(self):
        m = self.c.study["phase1"]["measured"]
        return (f'<dl class="facts"><div><dt>Absorption</dt><dd>{escape(m["absorption"])}</dd></div>'
                f'<div><dt>Safety and tolerability</dt><dd>{escape(m["safety"])}</dd></div></dl>')

    def b_protocol_history(self):
        rows = "".join(f'<tr><th scope="row">{escape(h["version"])}</th><td data-label="Date">{escape(h["date_text"])}</td><td data-label="Change">{escape(h["change"])}</td></tr>'
                       for h in self.c.study["phase1"]["protocol_history"])
        return (f'<div class="table-wrap"><table class="table-stack"><caption>Phase 1 eligibility criteria versions</caption>'
                f'<thead><tr><th scope="col">Version</th><th scope="col">Date</th><th scope="col">Substantive change</th></tr></thead><tbody>{rows}</tbody></table></div>')

    # ---------- evidence library ----------
    def _ref_links(self, r):
        links = []
        if r.get("doi"):
            links.append(f'<a href="https://doi.org/{escape(r["doi"])}" rel="external">DOI {escape(r["doi"])}</a>')
        if r.get("pmid"):
            links.append(f'<a href="https://pubmed.ncbi.nlm.nih.gov/{escape(r["pmid"])}/" rel="external">PubMed {escape(r["pmid"])}</a>')
        if r.get("url") and not r.get("doi"):
            links.append(f'<a href="{escape(r["url"])}" rel="external">Official source</a>')
        return " · ".join(links)

    def citation(self, r):
        parts = [r["authors"], r["title"] + "."]
        j = f'<em>{escape(str(r["journal"]))}</em>' if r["journal"] else ""
        vol = ""
        if r.get("year"):
            vol = f'{r["year"]}'
            if r.get("volume"):
                vol += f';{r["volume"]}'
                if r.get("issue"):
                    vol += f'({r["issue"]})'
                if r.get("pages"):
                    vol += f':{r["pages"]}'
            vol += "."
        return f'{escape(r["authors"])}{". " if r["authors"] else ""}{escape(r["title"])}. {j}{". " if j else ""}{escape(vol)}'

    def study_card(self, r):
        cat = next(c["title"] for c in self.c.refs["categories"] if c["id"] == r["category"])
        if r["kind"] == "programme":
            tag = '<span class="tag tag-company">Programme information</span>'
        elif r["label"] in LABEL_TEXT:
            cls, txt = LABEL_TEXT[r["label"]]
            tag = f'<span class="tag {cls}">{txt}</span>'
        else:
            tag = ""
        res = r["result"]
        flag = ""
        if res in ("negative", "inconclusive", "mixed", "not-conducted"):
            flag = f'<span class="result-flag result-{res}">{RESULT_LABEL[res]}</span>'
        self.c.ref(r["id"], self.page)
        return (f'<article class="study-card" id="ref-{r["id"]}" data-category="{r["category"]}">'
                f'<div class="study-card-head"><p class="card-kicker">{escape(cat)}</p><div class="card-flags">{tag}{flag}</div></div>'
                f'<h3>{escape(r["title"])}</h3>'
                f'<dl class="card-dl"><div><dt>Population</dt><dd>{escape(r["population"])}</dd></div>'
                f'<div><dt>Product</dt><dd>{escape(r["product"])}</dd></div>'
                f'<div><dt>Design</dt><dd>{escape(r["design"])}</dd></div>'
                f'<div><dt>Finding</dt><dd>{escape(r["finding"])}</dd></div>'
                f'<div><dt>Limitations</dt><dd>{escape(r["limitations"])}</dd></div></dl>'
                f'<p class="source-line"><span class="src-label">Source:</span> {self.citation(r)} {self._ref_links(r)}</p>'
                f'</article>')

    def b_evidence_filters(self):
        btns = ['<button type="button" class="chip" aria-pressed="true" data-filter="all">All</button>']
        for c in self.c.refs["categories"]:
            n = sum(1 for r in self.c.refs["items"] if r["public"] and r["category"] == c["id"])
            btns.append(f'<button type="button" class="chip" aria-pressed="false" data-filter="{c["id"]}">{escape(c["title"])} <span class="chip-n">{n}</span></button>')
        return (f'<div class="filters" role="group" aria-label="Filter the evidence library by topic" hidden>{"".join(btns)}</div>'
                '<p class="filter-status" role="status" aria-live="polite"></p>')

    def b_evidence_library(self):
        out = []
        for c in self.c.refs["categories"]:
            items = [r for r in self.c.refs["items"] if r["public"] and r["category"] == c["id"]]
            if not items:
                continue
            out.append(f'<section class="lib-section" data-section="{c["id"]}" aria-labelledby="cat-{c["id"]}">'
                       f'<h2 id="cat-{c["id"]}">{escape(c["title"])}</h2><div class="study-cards">'
                       + "".join(self.study_card(r) for r in items) + "</div></section>")
        return "".join(out)

    def b_evidence_last_checked(self):
        d = self.c.refs["last_checked"]
        return f'<time datetime="{d}">{fmt_date(d)}</time>'

    def b_corrections_public(self):
        pub = [x for x in self.c.refs["corrections"] if x["public"]]
        if not pub:
            return "<p>No corrections have been made since publication.</p>"
        rows = "".join(f'<tr><td><time datetime="{x["date"]}">{fmt_date(x["date"])}</time></td><td>{escape(x["change"])}</td></tr>' for x in pub)
        return (f'<div class="table-wrap"><table><caption>Corrections</caption><thead><tr><th scope="col">Date</th>'
                f'<th scope="col">Correction</th></tr></thead><tbody>{rows}</tbody></table></div>')

    def b_review_log(self):
        rows = "".join(f'<tr><td data-label="Date"><time datetime="{x["date"]}">{fmt_date(x["date"])}</time></td><td data-label="Review">{escape(x["type"])}</td><td data-label="Method">{escape(x["method"])}</td></tr>'
                       for x in self.c.refs["review_log"])
        return (f'<div class="table-wrap"><table class="table-stack"><caption>Evidence reviews</caption><thead><tr><th scope="col">Date</th>'
                f'<th scope="col">Review</th><th scope="col">Method</th></tr></thead><tbody>{rows}</tbody></table></div>')

    # ---------- families: services ----------
    def _json(self, name):
        import json
        return json.loads((self.root / "content" / name).read_text())

    def b_services(self):
        s = self._json("services.json")
        out = ['<div class="region-list">']
        for r in s["regions"]:
            routes = "".join(f"<li>{escape(x)}</li>" for x in r["routes"])
            links = "".join(f'<li><a href="{u}" rel="external">{escape(t)}</a></li>' for t, u in r["links"])
            out.append(f'<details class="region"><summary>{escape(r["name"])}</summary><div><ul>{routes}</ul>'
                       + (f'<ul class="plain links">{links}</ul>' if links else "") + "</div></details>")
        out.append("</div>")
        out.append(f'<p class="small">Routes checked <time datetime="{s["checked"]}">{fmt_date(s["checked"])}</time>. Services change: always confirm with your GP or local service.</p>')
        return "".join(out)

    def _crisis_line(self, line, key="text"):
        """One crisis line: its text with each {n} replaced by number n, linked for calling (or texting, for an
        'sms:' number) on the web, plain and unbroken across lines in print."""
        nums = [n.split(":", 1)[-1] for n in line["numbers"]]
        if key == "print":
            return escape(line["print"]).format(*(escape(n).replace(" ", "&nbsp;") for n in nums))
        links = [f'<a href="{"sms" if raw.startswith("sms:") else "tel"}:{n.replace(" ", "")}">{escape(n)}</a>'
                 for raw, n in zip(line["numbers"], nums)]
        return escape(line["text"]).format(*links)

    def b_crisis_lines(self, variant=None):
        """Urgent-help numbers from content/services.json 'crisis_lines', the one place they are kept: the cards
        and 'Last checked' date on faq.html, or {{block:crisis_lines:print}}, the short line and check date
        printed on the appointment preparation sheet PDF."""
        c = self._json("services.json")["crisis_lines"]
        checked = f'<time datetime="{c["checked"]}">{fmt_date(c["checked"])}</time>'
        if variant == "print":
            parts = [f'{escape(g["print_name"])}: ' + ", ".join(self._crisis_line(x, "print") for x in g["lines"] if x.get("print"))
                     for g in c["regions"] if g.get("print_name")]
            return "; ".join(parts) + f". Numbers checked {checked}."
        cards = "".join(f'<div class="card"><h3>{escape(g["name"])}</h3><ul>'
                        + "".join(f"<li>{self._crisis_line(x)}</li>" for x in g["lines"]) + "</ul></div>"
                        for g in c["regions"])
        return (f'<div class="help-grid">{cards}</div>'
                f'<p class="help-verified mt">Last checked {checked}. Elsewhere, contact your local emergency services.</p>')

    def b_education_work(self):
        s = self._json("services.json")
        items = []
        for text, url in s["education_work_uk"]:
            items.append(f"<li>{escape(text)}" + (f' <a href="{url}" rel="external">gov.uk</a>' if url else "") + "</li>")
        return "<ul>" + "".join(items) + "</ul>"

    # ---------- newsroom ----------
    def b_boilerplate(self):
        f = lambda k: escape(self.c.fact(k, self.page))
        return (f'<p>{f("company.name")} is a UK company developing {f("product.name")}, an investigational oral cannabidiol medicine, '
                f'for people at clinical high risk of psychosis. A Phase 1 study in healthy volunteers ({f("phase1.nct")}) was completed on '
                f'{f("phase1.end")}; a Phase 2B study is planned. {f("product.name")} is not approved for any use and its effectiveness is unproven.</p>')

    def b_fact_sheet(self):
        rows = [("Company", f'{self.c.fact("company.name", self.page)}, company number {self.c.fact("company.number", self.page)}, {self.c.fact("company.jurisdiction", self.page)}'),
                ("Investigational medicine", f'{self.c.fact("product.name", self.page)}: {self.c.fact("product.strength", self.page)} {self.c.fact("product.form", self.page)} of {self.c.fact("product.api", self.page)}'),
                ("Regulatory status", self.c.fact("product.status", self.page)),
                ("Completed study", f'Phase 1, {self.c.fact("phase1.population", self.page)}; {self.c.fact("phase1.nct", self.page)}, {self.c.fact("phase1.isrctn", self.page)}; completed {self.c.fact("phase1.end", self.page)}'),
                ("Planned study", f'Phase 2B in {self.c.fact("phase2b.population", self.page)}: {self.c.fact("phase2b.status", self.page)}'),
                ("Media contact", f'{self.c.fact("company.phone_display", self.page)} (head office)')]
        body = "".join(f'<tr><th scope="row">{escape(a)}</th><td>{escape(b)}</td></tr>' for a, b in rows)
        return f'<div class="table-wrap"><table class="table-stack"><caption>Fact sheet (as of {escape(self.c.fact("site.as_of", self.page))})</caption><tbody>{body}</tbody></table></div>'

    def b_press_photos(self):
        people = [p for p in self.c.people["people"] if p["public"] and self._portrait(p)]
        if not people:
            return ""
        # same rule as the profile cards: a title only when confirmed or agreed by the records
        label = lambda p: p["role"] if p["role_status"] in ("confirmed", "records-agree") else p["descriptor"]
        figs = "".join(f'<figure><img src="{p["portrait"]["file"]}" alt="{escape(p["name"])}" loading="lazy"><figcaption>{escape(p["name"])}, {escape(label(p))}. <a href="{p["portrait"]["file"]}" download>Download</a></figcaption></figure>' for p in people)
        return f'<h3>Photographs</h3><div class="press-photos">{figs}</div>'

    def b_reports(self):
        reps = self._json("reports.json")["reports"]
        if not reps:
            return ""
        out = ['<h2 id="reports">Programme reports</h2>']
        for r in sorted(reps, key=lambda x: x["published"], reverse=True):
            qa = "".join(f"<h4>{escape(q)}</h4><p>{escape(r[k])}</p>" for q, k in (("What changed?", "changed"), ("What supports it?", "support"), ("What remains unresolved?", "unresolved"), ("What happens next?", "next")))
            out.append(f'<article class="report"><h3>{escape(r["title"])}</h3><p class="small">Period: {escape(r["period"])} · Published <time datetime="{r["published"]}">{fmt_date(r["published"])}</time></p>{qa}</article>')
        return "".join(out)

    def b_pdf_label(self, pdf):
        """'PDF, 2 pages, 150 KB' from the checked manifest of the PDF actually published."""
        e = self.pdfs.get(pdf + ".pdf")
        if not e:
            raise KeyError(f"{self.page}: no checked PDF {pdf}.pdf")
        kb = max(1, round(e["bytes"] / 1024))
        return f'PDF, {e["pages"]} page{"s" if e["pages"] != 1 else ""}, {kb} KB'

    def b_summary(self, field):
        """A single field of the study summary (keeps the brief and pages in step)."""
        return escape(self.c.study["summary"][field])
