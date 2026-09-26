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
V = "?v=nwpt039"


def status_chip(key):
    s = DATA["statuses"][key]
    return f'<span class="room-status room-status--{key}">{s["label"]}</span>'


def picture(img, sizes_attr):
    files = [(f'{img["src"]}-{w}.webp', w, h) for w, h in img["sizes"]]
    big = files[-1]
    srcset = ", ".join(f"{f}{V} {w}w" for f, w, _ in files)
    return (f'<figure class="room-figure"><img src="{big[0]}{V}" srcset="{srcset}" sizes="{sizes_attr}" width="{big[1]}" '
            f'height="{big[2]}" alt="{html.escape(img["alt"])}" style="object-position: {img["focal"]};" loading="lazy" decoding="async" />'
            f'<figcaption>{html.escape(img["caption"])}</figcaption></figure>')


def stage_panel(st):
    points = "".join(f"<li>{p}</li>" for p in st["points"])
    open_q = (f'<p class="room-inline-open">{status_chip("open")} {st["open"]}</p>' if st.get("open") else "")
    tl = ""
    if st.get("timeline"):
        tl = ('<ol class="room-dates">' + "".join(f'<li><span class="room-dates__when">{d}</span><span>{t}</span></li>'
                                                  for d, t in st["timeline"]) + "</ol>")
    where = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in st["where"])
    fig = picture(st["image"], "(max-width: 900px) 100vw, 420px") if st.get("image") else ""
    srcs = "".join(
        f'<li class="room-source"><a href="{s["ref"]}">{html.escape(s["title"])}</a>'
        f'<dl class="room-source__meta"><div><dt>Evidence status</dt><dd>{html.escape(s["status"])}</dd></div>'
        f'<div><dt>Date</dt><dd>{html.escape(s["date"])}</dd></div>'
        f'<div><dt>Limitations</dt><dd>{html.escape(s["limit"])}</dd></div></dl></li>'
        for s in st["sources"])
    return f'''
          <li class="room-stage" id="stage-{st["id"]}" data-stage>
            <article class="room-panel" aria-labelledby="stage-{st["id"]}-title">
              <div class="room-panel__head">
                <span class="room-panel__n" aria-hidden="true">{st["n"]}</span>
                <div>
                  <p class="room-panel__kicker">Stage {st["n"]} · {st["short"]} {status_chip(st["status"])}</p>
                  <h3 id="stage-{st["id"]}-title">{st["title"]}</h3>
                </div>
              </div>
              <div class="room-panel__body">
                <div class="room-panel__text">
                  <h4>What this stage investigates</h4>
                  <p>{st["asks"]}</p>
                  <ul>{points}</ul>
                  {open_q}
                  {tl}
                  <dl class="room-where">{where}</dl>
                </div>
                {fig}
              </div>
              <details class="room-support">
                <summary>What supports this? <span class="room-support__count">{len(st["sources"])} source{"s" if len(st["sources"]) != 1 else ""}</span></summary>
                <ol class="room-sources">{srcs}</ol>
              </details>
            </article>
          </li>'''


def main_html():
    legend = "".join(f'<li>{status_chip(k)} <span>{v["text"]}</span></li>' for k, v in DATA["statuses"].items())
    tiles = "".join(
        f'<li class="room-tile room-tile--{t["status"]}">{status_chip(t["status"])}<h3>{t["title"]}</h3><p>{t["text"]}</p>'
        f'<a href="{t["link"][0]}">{t["link"][1]}</a></li>' for t in DATA["overview"])
    stage_nav = "".join(
        f'<li><a class="room-steps__link room-steps__link--{s["status"]}" href="#stage-{s["id"]}" data-stage-link="stage-{s["id"]}">'
        f'<span class="room-steps__n" aria-hidden="true">{s["n"]}</span><span class="room-steps__label">{s["short"]}</span>'
        f'<span class="visually-hidden"> — {DATA["statuses"][s["status"]]["label"]}</span></a></li>' for s in DATA["stages"])
    stages = "".join(stage_panel(s) for s in DATA["stages"])
    oq = "".join(f'<li><h3>{q}</h3><p>{a}</p></li>' for q, a in DATA["open_questions"])
    explore = "".join(f'<li><a class="room-explore__card" href="{h}"><span class="room-explore__title">{t}</span><span>{d}</span></a></li>'
                      for h, t, d in DATA["explore"])
    hero = picture({"src": "assets/manus/06-programme-horizon", "sizes": [[768, 329], [1200, 514], [1920, 823]], "focal": "66% 50%",
                    "alt": "Abstract development thresholds toward a horizon.",
                    "caption": "Conceptual programme visualization — not a forecast of outcomes or completed milestones."},
                   "(max-width: 1100px) 100vw, 1100px").replace('loading="lazy" decoding="async"', 'fetchpriority="high"').replace('class="room-figure"', 'class="room-figure room-figure--hero"')
    return f'''<main id="main" class="room">
    <header class="page-hero room-hero">
      <div class="wrap">
        <p class="eyebrow">Programme Room</p>
        <h1>Inside the CHR-P programme</h1>
        <p class="lede">Where the programme stands, what each stage would investigate, and what supports it. Everything here is labelled as a documented finding, proposed work or an open question.</p>
        <ul class="room-legend" aria-label="How items are labelled">{legend}</ul>
        {hero}
      </div>
    </header>

    <section class="section section-light" aria-labelledby="room-overview-title">
      <div class="wrap">
        <h2 id="room-overview-title">The programme at a glance</h2>
        <ul class="room-tiles">{tiles}</ul>
        <p class="fineprint room-note">NWPT-SM32300 is investigational. Its effectiveness has not been established. This page is general information, not medical advice.</p>
      </div>
    </section>

    <section class="section section-alt room-timeline-section" id="timeline" aria-labelledby="room-timeline-title">
      <div class="wrap">
        <h2 id="room-timeline-title">Study timeline</h2>
        <p class="room-intro">Six stages, from the clinical need to the longer-term questions. Choose a stage to see what it would investigate, where it stands and the sources behind it.</p>
        <div class="room-timeline" data-room-timeline>
          <nav class="room-steps" aria-label="Timeline stages"><ol>{stage_nav}</ol></nav>
          <ol class="room-stages">{stages}
          </ol>
        </div>
      </div>
    </section>

    <section class="section section-light" id="open-questions" aria-labelledby="room-open-title">
      <div class="wrap">
        <h2 id="room-open-title">Open questions {status_chip("open")}</h2>
        <p class="room-intro">What the research does not yet know, and what would answer each question.</p>
        <ul class="room-open">{oq}</ul>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="room-explore-title">
      <div class="wrap">
        <h2 id="room-explore-title">Go deeper</h2>
        <ul class="room-explore">{explore}</ul>
        <p class="fineprint room-note">Sources on this page come from the <a href="evidence.html">evidence library</a> and the <a href="study.html#milestones">study records</a>. Last reviewed {DATA["reviewed"]}. Corrections are listed in the <a href="newsroom.html#corrections">corrections log</a>.</p>
      </div>
    </section>
  </main>'''


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
