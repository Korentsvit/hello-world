#!/usr/bin/env python3
"""Render evidence graphics from content/graphics.json as accessible SVG + data table.
Unpublished graphics go to docs/graphics-preview/ (reviewers only). Published ones (publish: true,
primary-verified) go to src/assets/graphics/ for inclusion in pages. Standard library only."""
from html import escape
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
BLUE, INK, MUTED, GRID = "#005EB8", "#14212b", "#5b6b77", "#d9e2ea"


def prevalence_svg(g):
    w, h, left, right, top = 640, 190, 250, 40, 30
    xmax = 30
    x = lambda v: left + (w - left - right) * v / xmax
    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" aria-labelledby="pt pd"><title id="pt">{escape(g["title"])}</title>'
             f'<desc id="pd">Point estimates with 95% confidence intervals; values are listed in the table below.</desc>']
    for t in range(0, xmax + 1, 5):
        parts.append(f'<line x1="{x(t)}" x2="{x(t)}" y1="{top - 10}" y2="{h - 40}" stroke="{GRID}"/>'
                     f'<text x="{x(t)}" y="{h - 20}" text-anchor="middle" font-size="12" fill="{MUTED}">{t}%</text>')
    for i, r in enumerate(g["rows"]):
        y = top + 20 + i * 60
        parts.append(f'<text x="{left - 12}" y="{y + 4}" text-anchor="end" font-size="13" fill="{INK}">{escape(r["label"])}</text>'
                     f'<g><title>{escape(r["label"])}: {r["estimate"]}% (95% CI {r["low"]} to {r["high"]})</title>'
                     f'<line x1="{x(r["low"])}" x2="{x(r["high"])}" y1="{y}" y2="{y}" stroke="{BLUE}" stroke-width="2"/>'
                     f'<line x1="{x(r["low"])}" x2="{x(r["low"])}" y1="{y - 6}" y2="{y + 6}" stroke="{BLUE}" stroke-width="2"/>'
                     f'<line x1="{x(r["high"])}" x2="{x(r["high"])}" y1="{y - 6}" y2="{y + 6}" stroke="{BLUE}" stroke-width="2"/>'
                     f'<circle cx="{x(r["estimate"])}" cy="{y}" r="6" fill="{BLUE}" stroke="#fff" stroke-width="2"/>'
                     f'<text x="{x(r["high"]) + 8}" y="{y + 4}" font-size="12" fill="{INK}">{r["estimate"]}%</text></g>')
    parts.append("</svg>")
    return "".join(parts)


def transition_svg(g):
    w, h, left, right, top, bottom = 640, 300, 50, 30, 20, 50
    xmax, ymax = 48, 35
    x = lambda m: left + (w - left - right) * m / xmax
    y = lambda v: top + (h - top - bottom) * (1 - v / ymax)
    rows = g["rows"]
    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" aria-labelledby="tt td"><title id="tt">{escape(g["title"])}</title>'
             f'<desc id="td">Line with shaded 95% confidence band rising from 9% at 6 months to 27% at 48 months; values in the table below.</desc>']
    for v in range(0, ymax + 1, 5):
        parts.append(f'<line x1="{left}" x2="{w - right}" y1="{y(v)}" y2="{y(v)}" stroke="{GRID}"/>'
                     f'<text x="{left - 8}" y="{y(v) + 4}" text-anchor="end" font-size="12" fill="{MUTED}">{v}%</text>')
    for m in (0, 12, 24, 36, 48):
        parts.append(f'<text x="{x(m)}" y="{h - bottom + 20}" text-anchor="middle" font-size="12" fill="{MUTED}">{m}</text>')
    parts.append(f'<text x="{(left + w - right) / 2}" y="{h - 8}" text-anchor="middle" font-size="12" fill="{MUTED}">Months since assessment</text>')
    band = " ".join(f"{x(r['months'])},{y(r['high'])}" for r in rows) + " " + " ".join(f"{x(r['months'])},{y(r['low'])}" for r in reversed(rows))
    parts.append(f'<polygon points="{band}" fill="{BLUE}" fill-opacity=".15"/>')
    line = " ".join(f"{x(r['months'])},{y(r['estimate'])}" for r in rows)
    parts.append(f'<polyline points="{line}" fill="none" stroke="{BLUE}" stroke-width="2"/>')
    for r in rows:
        parts.append(f'<g><title>{r["months"]} months: {r["estimate"]}% (95% CI {r["low"]} to {r["high"]})</title>'
                     f'<circle cx="{x(r["months"])}" cy="{y(r["estimate"])}" r="5" fill="{BLUE}" stroke="#fff" stroke-width="2"/></g>')
    last = rows[-1]
    parts.append(f'<text x="{x(last["months"]) - 6}" y="{y(last["estimate"]) - 12}" text-anchor="end" font-size="12" fill="{INK}">{last["estimate"]}% at {last["months"]} months</text></svg>')
    return "".join(parts)


def table(g, kind):
    if kind == "prevalence":
        head = "<tr><th scope='col'>Population</th><th scope='col'>Estimate</th><th scope='col'>95% CI</th><th scope='col'>Studies</th><th scope='col'>People</th></tr>"
        body = "".join(f"<tr><th scope='row'>{escape(r['label'])}</th><td>{r['estimate']}%</td><td>{r['low']}–{r['high']}%</td><td>{r['studies']}</td><td>{r['people']:,}</td></tr>" for r in g["rows"])
    else:
        head = "<tr><th scope='col'>Months</th><th scope='col'>Cumulative risk</th><th scope='col'>95% CI</th></tr>"
        body = "".join(f"<tr><th scope='row'>{r['months']}</th><td>{r['estimate']}%</td><td>{r['low']}–{r['high']}%</td></tr>" for r in g["rows"])
    return f"<table><caption>{escape(g['measure'])}</caption><thead>{head}</thead><tbody>{body}</tbody></table>"


def main():
    data = json.loads((ROOT / "content" / "graphics.json").read_text())
    refs = {r["id"]: r for r in json.loads((ROOT / "content" / "references.json").read_text())["items"]}
    prev = ROOT / "docs" / "graphics-preview"
    prev.mkdir(parents=True, exist_ok=True)
    for kind, fn in (("prevalence", prevalence_svg), ("transition", transition_svg)):
        g = data[kind]
        r = refs[g["source_ref"]]
        fig = (f'<figure><h2>{escape(g["title"])}</h2>{fn(g)}{table(g, kind)}'
               f'<figcaption>Source: {escape(r["authors"])} {escape(r["title"])}. {escape(r["journal"])} {r["year"]}. doi:{escape(r["doi"])}</figcaption></figure>')
        status = ("PUBLISHABLE" if g["publish"] else "NOT PUBLISHED: verification level '" + g["verification"] + "'. " + g["verification_needed"])
        page = (f'<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
                f'<title>Preview: {escape(g["title"])}</title><style>body{{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 16px;color:#14212b}}'
                f'svg{{width:100%;height:auto}}table{{border-collapse:collapse;width:100%;margin-top:1rem}}th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid #d9e2ea}}'
                f'.status{{background:#fff1a8;padding:.6rem .8rem;border-radius:6px}}</style></head><body>'
                f'<p class="status">{escape(status)}</p>{fig}</body></html>')
        (prev / f"{kind}.html").write_text(page)
        if g["publish"]:
            out = ROOT / "src" / "assets" / "graphics"
            out.mkdir(parents=True, exist_ok=True)
            (out / f"{kind}.html").write_text(fig)
        print(kind, "published" if g["publish"] else "preview only")


if __name__ == "__main__":
    main()
