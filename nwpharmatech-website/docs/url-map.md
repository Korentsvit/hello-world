# Routes and redirects

Page URLs are **extensionless**. Cloudflare Pages serves `/study` from `study.html`, and itself answers `/study.html` and `/study/` with a 308 to `/study` (and `/index.html` with a 308 to `/`). Links, canonical URLs and the sitemap all use the extensionless route. Earlier `.html` addresses therefore keep working in one permanent redirect; never add a rule for a page's own route (it would loop). Tested with Cloudflare's runtime by `tools/test-routes.mjs`.

## Public routes

| Route | Page | Anchors |
|---|---|---|
| `/` | Home | `#programme-brief` |
| `/clinical-need` | Clinical need | |
| `/science` | Science and formulation | `#why-cbd`, `#formulation`, `#dose` |
| `/evidence` | Evidence library | `#labels` (new), `#ref-<id>`, `#cat-<category>` |
| `/families` | For young people and families | |
| `/programme` | Programme overview | |
| `/study` | The study: progress and evidence | `#milestones`; `#documents` only once a document version is published |
| `/phase-1` | Phase 1 study | `#results` |
| `/updates` | Programme updates | |
| `/people` | People | |
| `/financing` | Funding and financing (noindex; not in the sitemap) | |
| `/newsroom` | Newsroom | `#corrections`; `#signup` in sign-up builds only |
| `/faq` | Questions and answers | `#urgent-help`, `#not-medical-advice` |
| `/contact`, `/legal` | Contact; Legal, privacy and accessibility | `/legal`: `#disclaimer`, `#privacy`, `#cookies`, `#accessibility` |

**Downloads:** `/downloads/nwpharmatech-programme-brief.pdf`, `/downloads/appointment-preparation-sheet.pdf`, `/downloads/nwpharmatech-references.ris` and `.bib`.

**Short aliases** (301, one hop, defined in `src/redirects.txt`): `/brief` and `/programme-brief` → `/#programme-brief`; `/phase-2b`, `/phase2b` → `/study`; `/phase1` → `/phase-1`; `/formulation` → `/science#formulation`; `/references` → `/evidence`; `/team` → `/people`; `/news`, `/press` → `/newsroom`; `/funding`, `/invest`, `/investors` → `/financing`; `/privacy`, `/accessibility` → `/legal#…`; `/help` → `/faq#urgent-help`. `/contactus` → `/contact` (an address used on the live site).

Every alias also answers with a trailing slash (`/team/`, `/contactus/` …), which Cloudflare treats as a different path; the build adds those forms itself. `src/redirects.txt` refuses splats and placeholders, a second rule for the same path, a rule for a page's own route or a form Cloudflare already redirects, a rule whose target is itself redirected, and a rule for a path served as a file (`/assets/…`, `/downloads/…`, `/robots.txt`, `/sitemap.xml`, `/404`).

## Removed anchors

Fragments cannot be redirected server-side; an old fragment opens the top of its page. Update any links you control.

| Old address | Why | Link instead |
|---|---|---|
| `/study#publication-policy` | Unadopted draft, removed from public pages (`docs/proposals/publication-policy.md`) | `/phase-1#results` for results status |
| `/newsroom#standards` | Unadopted draft, removed from public pages (`docs/proposals/editorial-standards.md`) | `/newsroom#corrections` |
| `/study#documents` | Shown only when a document version is published; none is yet | `/study` |
| `/programme#phase-1` (draft 2) | Moved to its own page | `/phase-1` |
| `/evidence#need`, `#cbd`, `#psychosis` (draft 2) | Library rebuilt | `/evidence#cat-<category>` |

## Restricted project

A separate hostname behind Cloudflare Access: `/`, `/financing-structure`, `/investor-journey`, `/funding-figures`. Never linked from the public site.

## Old live site to new: not completed

The live sites could not be reached from the build environment. Once the list of live URLs is supplied, add one line per old URL to `src/redirects.txt`, pointing straight at its final route above.
