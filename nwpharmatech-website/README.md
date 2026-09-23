# NWPharmaTech.org: staging site and handoff package

This is a staging build of the NWPT-SM32300 research-programme website for people at clinical high risk of psychosis. **It is not the live site and must not replace it.**

## Quick start
```
python3 build.py                                  # staging build → public/, restricted/, build/
(cd tools && npm install && node make-pdf.mjs)    # regenerate the brief and appointment-sheet PDFs from content
python3 build.py                                  # copy the fresh PDFs into public/
(cd tools && node qa.mjs && node test-signup.mjs) # browser QA + sign-up unit tests
python3 build.py --env production                 # refuses while blockers remain (by design)
tools/package.sh <label> <out-dir>                # zip of the committed tree + COMMIT.txt
```

## Layout
| Path | What it is |
|---|---|
| `content/` | **Single source of facts:** sources, facts, study, people, references, updates, documents, reports, services, assets, graphics, UI strings (see `docs/content-schema.md`) |
| `src/pages/` | 16 public page templates |
| `src/restricted/` | Access-controlled material (financing structure, investor-journey demo, classified funding figures) |
| `src/print/` | PDF templates (brief, appointment sheet), filled from the same content |
| `src/optional/signup/` | Email sign-up function, excluded unless `--with-signup` |
| `src/partials/`, `src/assets/` | Header, footer, CSS, JS, images |
| `buildlib/`, `build.py` | Content validation, rendering, production gates |
| `tools/` | QA suite, PDF generator, graphics generator, evidence-review tool, packaging |
| `public/`, `restricted/` | Deployable output |
| `docs/` | Handoff documentation (below) |

## Handoff documents
- `docs/completion-report.md`: what is verified and what is unfinished.
- `docs/missing-inputs.md`: each missing input, where it goes and what it blocks.
- `docs/increments/`: reports A, B and C.
- `docs/content-schema.md`, `docs/source-register.md`, `docs/asset-manifest.md`, `docs/url-map.md`, `docs/deployment.md`, `docs/integration.md`.
- `docs/accessibility-testing.md`, `docs/translation.md`, `docs/email-signup.md`, `docs/evidence-review-procedure.md`.
- `docs/reference-verification*.md` (evidence checks), `docs/graphics-preview/` (unpublished graphics).
- `docs/templates/` (quarterly report, evidence digest), `docs/interviews/` (outlines).
- `docs/private/` (lived-experience adviser proposal; internal, not for the website).
- `docs/qa/` (report, screenshots, accessibility-tree snapshots).
