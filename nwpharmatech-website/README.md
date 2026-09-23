# NWPharmaTech.org: staging draft and handoff

This is a static website for the NWPT-SM32300 research programme in clinical high risk of psychosis. **It is a staging draft. It does not replace the live website.**

## Quick start

```bash
python3 build.py                      # staging build (default)
python3 -m http.server -d public 8000 # preview at http://localhost:8000
cd tools && npm install && node qa.mjs  # browser QA: screenshots + docs/qa/report.json
node make-pdf.mjs                      # regenerate the programme brief PDF (from tools/)
python3 build.py --env production     # refuses to run while [TBC] markers remain
```

`build.py` uses only the Python standard library. The QA and PDF tools need Node with `playwright-core` and `axe-core`, plus a Chromium binary. Set the `CHROMIUM=/path/to/chrome` environment variable if it isn't at the default location.

## Layout

| Path | What it is |
|---|---|
| `src/pages/` | The 11 public pages (edit these) |
| `src/partials/` | Shared header (notices, desktop menu, mobile accordion menu) and footer |
| `src/assets/` | CSS (design tokens at the top), JS (menu, Q&A deep links), images |
| `src/downloads/` | Programme brief PDF (rendered from `tools/programme-brief.html`) |
| `src/restricted/`, `src/restricted-functions/` | Unapproved financing material, and the Cloudflare Access middleware |
| `src/redirects.txt`, `src/404.html` | Redirects and not-found page |
| `public/` | **Built public site.** Deploy this to staging |
| `restricted/` | **Built restricted site.** Deploy only behind Cloudflare Access, as a separate project |
| `tools/` | QA suite, PDF generator |
| `docs/` | Handoff documents (below) |

## Handoff documents

- `docs/completion-report.md`: what is verified and what is unfinished.
- `docs/unresolved.md`: the short list of missing facts, each with a precise question.
- `docs/source-register.md`: sources used and how conflicting sources were reconciled.
- `docs/reference-verification.md`: each reference and number, and how it was checked.
- `docs/url-map.md`: map from old URLs to new ones.
- `docs/asset-manifest.md`: portraits and renders required.
- `docs/deployment.md`: staging, restricted area and production gates.
- `docs/qa/`: QA report and screenshots (desktop 1280px, mobile 390px).

## Editorial conventions

- **One evidence label per section or study summary:** Established, Emerging evidence, Programme information (facts about NWPT-SM32300, not evidence of benefit), or Open question.
- **Other products are not our product.** Studies of other cannabidiol preparations are never presented as evidence about NWPT-SM32300. The science page says so explicitly.
- **`[TBC: …]` marks an unresolved fact.** It is highlighted in staging and blocks a production build.
- **Images** are declared with `<figure class="asset" data-asset=…>`. The build inserts a file if one exists; otherwise it shows a labelled slot. No invented likenesses.
