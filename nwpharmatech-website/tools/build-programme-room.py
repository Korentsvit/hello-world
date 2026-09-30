#!/usr/bin/env python3
"""Builds release-032/site/programme-room.html from release-032/source/programme-room.json.

The page shell (head, site header and navigation, footer, scripts) is taken from programme.html, so the Programme
Room always carries the current site navigation. The page reads completely without JavaScript: the timeline is an
ordered list of stages, each with a "What supports this?" disclosure. programme-room.js turns the list into
keyboard-operable tabs (arrow keys, Home, End) when scripting is available.

    python3 tools/build-programme-room.py
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "release-032"
SITE = ROOT / "site"
DATA = json.loads((ROOT / "source" / "programme-room.json").read_text())
V = "?v=nwpt040"



def work_chip(key):
    return f'<span class="room-status room-status--{key}">{DATA["work"][key]["label"]}</span>'


def type_chip(key):
    return f'<span class="room-type room-type--{key}">{DATA["types"][key]["label"]}</span>'


SEP = ' <span aria-hidden="true">·</span> '
TYPE_ORDER = ["published", "guidance", "registry", "company"]


def picture(img, sizes_attr):
    files = [(f'{img["src"]}-{w}.webp', w, h) for w, h in img["sizes"]]
    big = files[-1]
    srcset = ", ".join(f"{f}{V} {w}w" for f, w, _ in files)
    return (f'<figure class="room-figure"><img src="{big[0]}{V}" srcset="{srcset}" sizes="{sizes_attr}" width="{big[1]}" '
            f'height="{big[2]}" alt="{html.escape(img["alt"])}" style="object-position: {img["focal"]};" loading="lazy" decoding="async" />'
            f'<figcaption>{html.escape(img["caption"])}</figcaption></figure>')


def source_item(s):
    rows = [("Relates to", html.escape(DATA["about_labels"][s["about"]]), f' class="room-source__about room-source__about--{s["about"]}"'),
            ("Source type", type_chip(s["type"]), "")]
    if s.get("assessment"):
        rows.append(("Library assessment", html.escape(s["assessment"]), ""))
    rows += [(k, v, ' class="room-source__date"') for k, v in s["dates"]]
    rows.append(("Limitations", html.escape(s["limit"]), ""))
    meta = "".join(f"<div{c}><dt>{k}</dt><dd>{v}</dd></div>" for k, v, c in rows)
    if s.get("library"):
        links = [f'<a href="{s["library"]}">Evidence library entry</a>'] + [
            f'<a href="{u}" rel="external">Original source: {html.escape(n)}</a>' for n, u in s["original"]]
    else:
        links = [f'<a href="{s["page"]}">Website page</a>']
    return (f'<li class="room-source"><p class="room-source__title">{html.escape(s["title"])}</p>'
            f'<p class="room-source__links">{SEP.join(links)}</p>'
            f'<dl class="room-source__meta">{meta}</dl></li>')


def stage_panel(st):
    sid = f'stage-{st["id"]}'
    known = "".join(f"<li>{p}</li>" for p in st["known"])
    types = [t for t in TYPE_ORDER if any(x["type"] == t for x in st["sources"])]
    where = [("Work status", f'{work_chip(st["work"])} <span class="room-where__note">{st["note"]}</span>'),
             ("Sources used", " ".join(type_chip(t) for t in types))] + [tuple(x) for x in st.get("extra", [])]
    where_html = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in where)
    fig = picture(st["image"], "(max-width: 900px) 100vw, 380px") if st.get("image") else ""
    n = len(st["sources"])
    return f"""
          <li class="room-stage" id="{sid}" data-stage>
            <article class="room-panel" aria-labelledby="{sid}-title">
              <div class="room-panel__head">
                <span class="room-panel__n" aria-hidden="true">{st["n"]}</span>
                <div class="room-panel__heading">
                  <p class="room-panel__kicker">Stage {st["n"]} · {st["short"]}</p>
                  <h3 id="{sid}-title">{st["title"]}</h3>
                </div>
                <a class="room-copy" href="#{sid}" data-copy-link>Link to this topic</a>
              </div>
              <dl class="room-where">{where_html}</dl>
              <div class="room-panel__body">
                <div class="room-panel__text">
                  <h4>The question</h4>
                  <p>{st["question"]}</p>
                  <h4>What is known</h4>
                  <ul>{known}</ul>
                  <h4>What further research would establish</h4>
                  <p>{st["further"]}</p>
                </div>
                {fig}
              </div>
              <details class="room-support" id="{sid}-sources">
                <summary>What supports this? <span class="room-support__count">{n} source{"s" if n != 1 else ""}</span></summary>
                <ol class="room-sources">{"".join(source_item(x) for x in st["sources"])}</ol>
              </details>
            </article>
          </li>"""


def main_html():
    shortcuts = "".join(f'<li><a class="room-shortcut" href="{h}">{t}</a></li>' for h, t in DATA["shortcuts"])
    stage_nav = "".join(
        f'<li><a class="room-steps__link room-steps__link--{s["work"]}" href="#stage-{s["id"]}" data-stage-link="stage-{s["id"]}">'
        f'<span class="room-steps__n" aria-hidden="true">{s["n"]}</span><span class="room-steps__label">{s["short"]}</span>'
        f'<span class="room-steps__progress">{s["strip"]}</span></a></li>' for s in DATA["stages"])
    key_work = "".join(f'<div><dt>{work_chip(k)}</dt><dd>{v["text"]}</dd></div>' for k, v in DATA["work"].items())
    key_types = "".join(f'<div><dt>{type_chip(k)}</dt><dd>{v["text"]}</dd></div>' for k, v in DATA["types"].items())
    stages = "".join(stage_panel(s) for s in DATA["stages"])
    now = "".join(
        f'<li class="room-tile room-tile--{t["work"]}">{work_chip(t["work"])}<h3>{t["title"]}</h3><p>{t["text"]}</p>'
        f'<a href="{t["link"][0]}">{t["link"][1]}</a></li>' for t in DATA["now"])
    ms = "".join(f'<tr><td>{d}</td><td>{m}</td><td>{work_chip(w)}</td><td>{src}</td></tr>' for d, m, w, src in DATA["milestones"]["rows"])
    short = {s["id"]: f'Stage {s["n"]}: {s["short"]}' for s in DATA["stages"]}
    oq = "".join(
        f'<li><a class="room-open__link" href="#stage-{sid}-sources"><span class="room-open__q">{q}</span>'
        f'<span class="room-open__a">{a}</span><span class="room-open__go">See the evidence in {short[sid]}</span></a></li>'
        for q, a, sid in DATA["open_questions"])
    explore = "".join(f'<li><a class="room-explore__card" href="{h}"><span class="room-explore__title">{t}</span><span>{d}</span></a></li>'
                      for h, t, d in DATA["explore"])
    return f"""<main id="main" class="room">
    <header class="page-hero room-hero">
      <div class="wrap">
        <p class="eyebrow">Programme Room</p>
        <h1>Inside the CHR-P programme</h1>
        <p class="lede">What the programme has done, what it plans and what is still unknown, with the source behind each statement. NWPT-SM32300 is investigational; its effectiveness has not been established.</p>
        <nav class="room-shortcuts" aria-label="Start here"><ul>{shortcuts}</ul></nav>
      </div>
    </header>

    <section class="section section-alt room-explore-section" id="explore" aria-labelledby="room-explore-heading">
      <div class="wrap">
        <h2 id="room-explore-heading">Explore the programme</h2>
        <p class="room-intro">Research topics and development stages, not a schedule. Dates appear only where records give them; see <a href="#milestones">dated milestones</a>.</p>
        <div class="room-timeline" data-room-timeline>
          <nav class="room-steps" aria-label="Programme stages"><ol>{stage_nav}</ol></nav>
          <details class="room-key">
            <summary>What the labels mean</summary>
            <div class="room-key__cols">
              <div><h3>Work status <span>(each stage)</span></h3><dl>{key_work}</dl></div>
              <div><h3>Source type <span>(each source)</span></h3><dl>{key_types}</dl></div>
            </div>
          </details>
          <ol class="room-stages">{stages}
          </ol>
        </div>
      </div>
    </section>

    <section class="section section-light" id="now" tabindex="-1" aria-labelledby="room-now-title">
      <div class="wrap">
        <h2 id="room-now-title">Where are we now?</h2>
        <p class="room-intro">{DATA["candidate"]}</p>
        <ul class="room-tiles">{now}</ul>
        <h3 class="room-subhead" id="milestones" tabindex="-1">Dated milestones</h3>
        <div class="table-wrap room-table-wrap" role="region" aria-label="Dated milestones" tabindex="0">
          <table class="room-milestones">
            <caption class="visually-hidden">Dated programme milestones, oldest first</caption>
            <thead><tr><th scope="col">Date</th><th scope="col">Milestone</th><th scope="col">Work status</th><th scope="col">Record</th></tr></thead>
            <tbody>{ms}</tbody>
          </table>
        </div>
        <p class="fineprint room-note">From <a href="study.html#milestones">Study progress</a> (website page reviewed {DATA["milestones"]["reviewed"]}). Dates are those given in the records; none is a forecast.</p>
      </div>
    </section>

    <section class="section section-alt" id="open-questions" tabindex="-1" aria-labelledby="room-open-title">
      <div class="wrap">
        <h2 id="room-open-title">Open questions</h2>
        <p class="room-intro">What the research does not yet know. Each question opens the evidence behind it.</p>
        <ul class="room-open">{oq}</ul>
      </div>
    </section>

    <section class="section section-light" aria-labelledby="room-deeper-title">
      <div class="wrap">
        <h2 id="room-deeper-title">Go deeper</h2>
        <ul class="room-explore">{explore}</ul>
        <p class="fineprint room-note">Sources on this page come from the <a href="evidence.html">evidence library</a> and the <a href="study.html#milestones">study records</a>. This page last reviewed {DATA["reviewed"]}. Corrections are listed in the <a href="newsroom.html#corrections">corrections log</a>.</p>
      </div>
    </section>
  </main>"""


def build():
    shell = (SITE / "programme.html").read_text()
    a, b = shell.index("<main"), shell.index("</main>") + len("</main>")
    page = shell[:a] + main_html() + shell[b:]
    title, desc = "Programme Room | NWPharmaTech", ("Inside the CHR-P programme: where it stands, what each stage would investigate, "
                                                  "and the sources behind it — documented findings, proposed work and open questions.")
    page = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", page, count=1)
    page = re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*"', rf'\g<1>{desc}"', page)
    page = re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"', rf'\g<1>{title}"', page)
    page = page.replace('href="https://www.nwpharmatech.org/programme.html"', 'href="https://www.nwpharmatech.org/programme-room"')
    page = page.replace('content="https://www.nwpharmatech.org/programme.html"', 'content="https://www.nwpharmatech.org/programme-room"')
    page = re.sub(r'(<script src="nav\.js[^"]*" defer></script>)', r'\1\n  <script src="programme-room.js' + V + '" defer></script>', page, count=1)
    (SITE / "programme-room.html").write_text(page)
    print("wrote", SITE / "programme-room.html")


if __name__ == "__main__":
    build()
