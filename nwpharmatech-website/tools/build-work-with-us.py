#!/usr/bin/env python3
"""Builds the "Work with us" journey (/work-with-us) from release-032/source/work-with-us.json.

The content map holds no scientific claims of its own. Each card points into release-032/source/programme-room.json
(a stage's "known" item or "further" text, a source's limitation, or an open question) and each source is a
Programme Room source entry (Evidence library or study-record page), so the Programme Room and this page share
one set of statements and references.

Writes:
  site/work-with-us.html                    the page (shell from programme.html); readable without JavaScript
  site/functions/api/_lib/wwu-cards.js      the server's copy of card text, actions and references, so enquiry
                                            emails quote company text from the site, never from the browser

    python3 tools/build-work-with-us.py
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "release-032"
SITE = ROOT / "site"
WWU = json.loads((ROOT / "source" / "work-with-us.json").read_text())
ROOM = json.loads((ROOT / "source" / "programme-room.json").read_text())
V = "?v=nwpt047"
CANON = "https://www.nwpharmatech.org/"
STAGES = {s["id"]: s for s in ROOM["stages"]}


def plain(s):
    """Room text may carry &nbsp; and simple markup; cards and emails use plain text."""
    return html.unescape(re.sub(r"<[^>]+>", "", s)).replace(" ", " ")


def canon(href):
    path, _, frag = href.partition("#")
    path = path[:-5] if path.endswith(".html") else path
    return CANON + path + ("#" + frag if frag else "")


def find_source(ref):
    stage_id, _, key = ref.rpartition(":")
    for st in ROOM["stages"]:
        if stage_id and st["id"] != stage_id:
            continue
        for s in st["sources"]:
            if key in (s.get("library"), s.get("page")):
                return s, st
    raise SystemExit(f"source not found in programme-room.json: {ref}")


def resolve(card):
    frm, st_id, q = card.get("from"), None, None
    if card.get("text"):
        text = card["text"]
    elif "oq" in frm:
        q, a, stage = ROOM["open_questions"][frm["oq"]]
        text, st_id = a, stage
    elif "source" in frm:
        s, st = find_source(frm["source"])
        text, st_id = s["limit"], st["id"]
    elif frm.get("further"):
        text, st_id = STAGES[frm["stage"]]["further"], frm["stage"]
    else:
        text, st_id = STAGES[frm["stage"]]["known"][frm["known"]], frm["stage"]
    sources = []
    for ref in card["sources"]:
        s, _ = find_source(ref)
        src = {"key": ref, "title": s["title"], "type": s["type"], "about": s["about"], "limit": s["limit"],
               "dates": [[k, plain(v)] for k, v in s["dates"]], "assessment": s.get("assessment")}
        if s.get("library"):
            src["library"] = s["library"]
            src["original"] = s["original"]
        else:
            src["page"] = s["page"]
        sources.append(src)
    actions = [k for k, a in WWU["actions"].items() if card["kind"] in a["kinds"]]
    return {"id": card["id"], "topic": card["topic"], "kind": card["kind"], "question": q, "text": plain(text),
            "status": "unresolved" if card["kind"] == "open" else None,
            "stage": {"id": st_id, "n": STAGES[st_id]["n"], "short": plain(STAGES[st_id]["short"]), "work": STAGES[st_id]["work"]} if st_id else None,
            "sources": sources, "actions": actions, "tags": card["tags"]}


CARDS = [resolve(c) for c in WWU["cards"]]
assert len({c["id"] for c in CARDS}) == len(CARDS), "duplicate card id"


def work_label(key):
    return ROOM["work"][key]["label"]


def stage_context(c):
    """The related stage and its work status, labelled as such, so it is never read as the card's own status."""
    st = c["stage"]
    return f'Related stage: Stage {st["n"]} · {st["short"]} — stage work status: {work_label(st["work"])}' if st else ""


def type_chip(key):
    return f'<span class="room-type room-type--{key}">{ROOM["types"][key]["label"]}</span>'


def source_li(s):
    rows = [("Source type", type_chip(s["type"])), ("Relates to", html.escape(ROOM["about_labels"][s["about"]]))]
    rows += [(k, html.escape(v)) for k, v in s["dates"]]
    rows.append(("Limitations", html.escape(s["limit"])))
    if s.get("library"):
        links = [f'<a href="{s["library"]}">Evidence library entry</a>'] + [
            f'<a href="{u}" rel="external">Original source: {html.escape(n)}</a>' for n, u in s["original"]]
    else:
        links = [f'<a href="{s["page"]}">Website page</a>']
    meta = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in rows)
    return (f'<li><p class="wwu-src__title">{html.escape(s["title"])}</p><p class="wwu-src__links">{" · ".join(links)}</p>'
            f'<dl class="wwu-src__meta">{meta}</dl></li>')


def card_html(c):
    label = WWU["kinds"][c["kind"]]
    body = (f'<p class="wwu-card__q">{html.escape(c["question"])}</p><p class="wwu-card__text">{html.escape(c["text"])}</p>'
            if c["question"] else f'<p class="wwu-card__text">{html.escape(c["text"])}</p>')
    srcs = ""
    if c["sources"]:
        n = len(c["sources"])
        srcs = (f'<details class="wwu-card__sources"><summary>Sources and limitations <span>({n})</span></summary>'
                f'<ol>{"".join(source_li(s) for s in c["sources"])}</ol></details>')
    buttons = "".join(f'<button type="button" class="wwu-act" data-card="{c["id"]}" data-action="{a}" hidden>{WWU["actions"][a]["label"]}</button>'
                      for a in c["actions"])
    who = "Suggested wording for your question" if c["kind"] == "discussion" else "NWPharmaTech public information"
    status = '<span class="room-status room-status--open">Unresolved</span>' if c["status"] == "unresolved" else ""
    context = f'<p class="wwu-card__stage">{stage_context(c)}</p>' if c["stage"] else ""
    return f'''
            <li class="wwu-card wwu-card--{c["kind"]}" id="card-{c["id"]}" data-card-id="{c["id"]}">
              <p class="wwu-card__kind"><span class="wwu-kind">{label}</span> {status} <span class="wwu-card__who">{who}</span><span class="wwu-card__match" hidden>Matches your answers</span></p>
              {body}
              {context}
              {srcs}
              <div class="wwu-card__actions">{buttons}</div>
            </li>'''


def main_html():
    topics = ""
    for t in WWU["topics"]:
        cards = "".join(card_html(c) for c in CARDS if c["topic"] == t["id"])
        topics += f'''
        <section class="wwu-topic" id="topic-{t["id"]}" data-topic="{t["id"]}" aria-labelledby="topic-{t["id"]}-title">
          <h3 id="topic-{t["id"]}-title">{t["title"]}</h3>
          <p class="wwu-topic__intro">{t["intro"]}</p>
          <ul class="wwu-cards">{cards}
          </ul>
        </section>'''
    qs = ""
    for q in WWU["questions"]:
        opts = "".join(f'<label class="wwu-opt"><input type="radio" name="{q["id"]}" value="{v}" /> <span>{l}</span></label>' for v, l in q["options"])
        qs += f'<fieldset class="wwu-q"><legend>{q["label"]}</legend>{opts}</fieldset>'
    topic_boxes = "".join(f'<label class="wwu-opt"><input type="checkbox" name="topic" value="{t["id"]}" checked /> <span>{t["title"]}</span></label>' for t in WWU["topics"])
    data = {"version": WWU["version"], "reviewed": WWU["reviewed"], "actions": {k: a["label"] for k, a in WWU["actions"].items()},
            "kinds": WWU["kinds"], "questions": WWU["questions"], "notes": WWU["notes"],
            "topics": [{"id": t["id"], "title": t["title"]} for t in WWU["topics"]],
            "work": {k: v["label"] for k, v in ROOM["work"].items()}, "types": {k: v["label"] for k, v in ROOM["types"].items()},
            "canon": CANON,
            "cards": [{**c, "sources": [{**s, "url": canon(s.get("library") or s["page"])} for s in c["sources"]]} for c in CARDS]}
    data_json = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return f'''<main id="main" class="wwu">
    <header class="page-hero wwu-hero">
      <div class="wrap">
        <p class="eyebrow">Work with us</p>
        <h1>Explore a research collaboration</h1>
        <p class="lede">For investigators and research teams. See what NWPharmaTech has published about the CHR-P programme, with sources and limitations, build an agenda of points to discuss, and prepare a brief. No account is needed to explore the information or prepare a brief.</p>
        <ol class="wwu-steps" aria-label="How this page works">
          <li><a href="#focus">Your focus <span>(optional)</span></a></li>
          <li><a href="#information">Public information</a></li>
          <li><a href="#brief">Agenda and brief</a></li>
          <li><a href="#enquiry" data-enquiry-step>Contact</a></li>
        </ol>
      </div>
    </header>

    <div class="wrap wwu-workspace">
      <div class="wwu-main">
        <p class="wwu-nojs" data-nojs>The agenda, brief and online enquiry need JavaScript. Every card and its sources are listed below, and research collaboration enquiries can be made through the <a href="contact.html#research">Contact page</a>.</p>

        <section class="wwu-section" id="focus" tabindex="-1" aria-labelledby="focus-title" data-js-only hidden>
          <h2 id="focus-title"><span class="wwu-n">1</span> Your focus <span class="wwu-optional">optional</span></h2>
          <p class="wwu-help">Answers only highlight the most relevant cards on this page. They are not sent anywhere unless you include them in an enquiry, and they are never put in shared links.</p>
          <form class="wwu-focus" id="wwu-focus" novalidate>{qs}
            <fieldset class="wwu-q wwu-q--topics"><legend>Topics to show</legend>{topic_boxes}</fieldset>
            <p class="wwu-focus__actions"><button type="button" class="wwu-btn wwu-btn--quiet" id="wwu-clear-answers">Clear answers</button></p>
          </form>
          <div class="wwu-notes" id="wwu-notes" role="status"></div>
        </section>

        <section class="wwu-section" id="information" tabindex="-1" aria-labelledby="info-title">
          <h2 id="info-title"><span class="wwu-n">2</span> Relevant public information</h2>
          <p class="wwu-help">Each card is taken from the <a href="programme-room.html">Programme Room</a> and the <a href="evidence.html">Evidence library</a>, with its sources and limitations. Company statements and your own questions are always kept apart. <span class="wwu-count" id="wwu-count"></span></p>
          {topics}
        </section>

        <section class="wwu-section" id="brief" tabindex="-1" aria-labelledby="brief-title" data-js-only hidden>
          <h2 id="brief-title"><span class="wwu-n">3</span> Your discussion brief</h2>
          <p class="wwu-help">Built from your agenda. Print it or save it as a PDF, or copy a link that recreates the selected topics and cards. A copied link never includes your questions, focus answers or contact details.</p>
          <div class="wwu-brief-tools">
            <button type="button" class="wwu-btn" id="wwu-print">Print or save as PDF</button>
            <button type="button" class="wwu-btn wwu-btn--quiet" id="wwu-share">Copy link to these topics and cards</button>
            <span class="wwu-status" id="wwu-share-status" role="status"></span>
          </div>
          <div id="wwu-brief"></div>
        </section>

        <section class="wwu-section" id="enquiry" tabindex="-1" aria-labelledby="enquiry-title">
          <h2 id="enquiry-title"><span class="wwu-n">4</span> <span data-enquiry-heading>Contact about collaboration</span></h2>
          <p class="wwu-help">Please do not include confidential or unpublished information, patient information or health data. This is not a diagnosis service, crisis line, or trial enrolment portal.</p>
          <div id="wwu-enquiry" data-js-only hidden></div>
          <p data-nojs>Online enquiries need JavaScript. To contact us about a research collaboration, email <a href="mailto:team@nwpharmatech.com?subject=Research%20collaboration">team@nwpharmatech.com</a> with the subject “Research collaboration”, or see the <a href="contact.html#research">Contact page</a>.</p>
        </section>
        <p class="fineprint wwu-note">Content version {WWU["version"]} · public information reviewed {WWU["reviewed"]}. Sources come from the <a href="evidence.html">Evidence library</a> and the <a href="study.html#milestones">study records</a>. See the <a href="privacy.html">privacy notice</a>.</p>
      </div>

      <aside class="wwu-agenda" id="agenda" aria-labelledby="agenda-title" data-js-only hidden>
        <div class="wwu-agenda__inner">
          <h2 id="agenda-title">Your agenda <span class="wwu-agenda__count" data-agenda-count>0</span></h2>
          <div data-agenda-target="side"></div>
        </div>
      </aside>
    </div>

    <div class="wwu-drawer-bar" data-js-only hidden>
      <button type="button" class="wwu-drawer-open" id="wwu-drawer-open" aria-haspopup="dialog" aria-controls="wwu-drawer">Your agenda <span class="wwu-agenda__count" data-agenda-count>0</span></button>
    </div>
    <dialog class="wwu-drawer" id="wwu-drawer" aria-labelledby="wwu-drawer-title">
      <div class="wwu-drawer__head"><h2 id="wwu-drawer-title">Your agenda <span class="wwu-agenda__count" data-agenda-count>0</span></h2>
        <button type="button" class="wwu-btn wwu-btn--quiet" id="wwu-drawer-close">Close</button></div>
      <div data-agenda-target="drawer"></div>
    </dialog>
    <div class="visually-hidden" id="wwu-live" role="status" aria-live="polite"></div>
    <script type="application/json" id="wwu-data">{data_json}</script>
  </main>'''


def server_module():
    manifest = {"version": WWU["version"], "actions": {k: a["label"] for k, a in WWU["actions"].items()},
                "questions": {q["id"]: dict(q["options"]) for q in WWU["questions"]},
                "cards": {c["id"]: {"kind": WWU["kinds"][c["kind"]], "unresolved": c["status"] == "unresolved", "stage": stage_context(c), "question": c["question"], "text": c["text"],
                                    "actions": c["actions"], "refs": [[s["title"], canon(s.get("library") or s["page"])] for s in c["sources"]]}
                          for c in CARDS}}
    return ("// Generated by tools/build-work-with-us.py from source/work-with-us.json and source/programme-room.json.\n"
            "// Do not edit. The enquiry function quotes company text from here, never from the browser.\n"
            f"export const WWU = {json.dumps(manifest, ensure_ascii=False, indent=1)};\n")


def build():
    shell = (SITE / "programme.html").read_text()
    a, b = shell.index("<main"), shell.index("</main>") + len("</main>")
    page = shell[:a] + main_html() + shell[b:]
    title = "Explore a research collaboration | NWPharmaTech"
    desc = ("For investigators: public information about the CHR-P programme with sources and limitations, an agenda "
            "and printable discussion brief, and a non-confidential enquiry route.")
    page = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", page, count=1)
    page = re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*"', rf'\g<1>{desc}"', page)
    page = re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"', rf'\g<1>{title}"', page)
    page = page.replace('href="https://www.nwpharmatech.org/programme.html"', 'href="https://www.nwpharmatech.org/work-with-us"')
    page = page.replace('content="https://www.nwpharmatech.org/programme.html"', 'content="https://www.nwpharmatech.org/work-with-us"')
    page = re.sub(r'(<script src="nav\.js[^"]*" defer></script>)', r'\1\n  <script src="work-with-us.js' + V + '" defer></script>', page, count=1)
    (SITE / "work-with-us.html").write_text(page)
    lib = SITE / "functions" / "api" / "_lib"
    lib.mkdir(parents=True, exist_ok=True)
    (lib / "wwu-cards.js").write_text(server_module())
    print("wrote", SITE / "work-with-us.html", "and", lib / "wwu-cards.js", f"({len(CARDS)} cards)")


if __name__ == "__main__":
    build()
