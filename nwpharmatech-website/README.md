# NWPharmaTech.org: staging site and integration package

This is a staging build of the NWPT-SM32300 research-programme website for people at clinical high risk of psychosis. **It is not the live site and must not replace it.** The live-site bots import the reviewed modules one at a time (`docs/integration.md`). Nothing here is deployed automatically or changes DNS.

## Quick start
```
(cd tools && npm install)                         # QA, route tests (wrangler), PDF generation and checks
python3 build.py                                  # staging build: validated in a temp dir, then installed
python3 tools/test_build_gate.py                  # a failed or refused build leaves the previous output unchanged
python3 tools/test_consistency.py                 # one fact change reaches every page, the brief and its PDF
cd tools && node test-routes.mjs && node test-menu.mjs && node qa.mjs \
         && node test-signup.mjs --browser && node test-integration.mjs
python3 build.py --env production                 # refused while publication blockers remain (by design)
tools/package.sh <label> <out-dir>                # zip of the committed tree + COMMIT.txt
```
If a PDF contains a changed fact, the build regenerates it and checks it itself. The route, menu, QA and sign-up tests run Cloudflare's own Pages runtime (`wrangler pages dev`).

## Layout
| Path | What it is |
|---|---|
| `content/` | **Single source of facts:** sources, facts, study, people, references, updates, documents, review items, reports, services, assets, graphics, UI strings (see `docs/content-schema.md`) |
| `src/pages/` | 15 public page templates (plus `src/404.html`) |
| `src/restricted/` | Access-controlled material (financing structure, investor-journey demonstration, classified funding figures) |
| `src/print/` | PDF templates (brief, appointment sheet), filled from the same content |
| `src/optional/signup/` | Email sign-up function, excluded unless `--with-signup` (refused until a live provider test is recorded) |
| `src/partials/`, `src/assets/` | Header, footer, CSS, JS, images |
| `buildlib/`, `build.py` | Content validation, rendering, output validation, module export, publication gates |
| `tools/` | Test suites, PDF generator and checker, graphics generator, evidence-review tool, packaging |
| `public/`, `restricted/` | Deployable staging output (two Cloudflare Pages projects; extensionless URLs) |
| `integration/` | **Module packages for the live-site bots:** study hub, Phase 1, formulation, evidence library, family guide, newsroom |
| `docs/` | Handoff documentation (below) |

## Handoff documents
- `docs/changelog-correction-release.md`: what changed in this release and how each item was verified.
- `docs/integration.md`: module-by-module integration instructions for the live-site bots.
- `docs/leadership-reconciliation.md`: the leadership discrepancy table and the title rules.
- `docs/missing-inputs.md`: publication blockers, listed separately from optional assets.
- `docs/programme-room.md`: status of the Programme Room component (not supplied).
- `docs/completion-report.md`: what is verified and what is unfinished.
- `docs/deployment.md`, `docs/url-map.md`, `docs/content-schema.md`, `docs/source-register.md`, `docs/asset-manifest.md`.
- `docs/accessibility-testing.md`, `docs/translation.md`, `docs/email-signup.md`, `docs/evidence-review-procedure.md`.
- `docs/proposals/` (publication policy and editorial standards, awaiting management adoption; not on the public site).
- `docs/reference-verification*.md` (evidence checks), `docs/graphics-preview/` (unpublished graphics).
- `docs/templates/` (quarterly report, evidence digest), `docs/interviews/` (outlines).
- `docs/private/` (lived-experience adviser proposal; internal, not for the website).
- `docs/qa/` (reports, screenshots, accessibility-tree snapshots).
- `docs/increments/` (reports A, B and C from the previous round).
