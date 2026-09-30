# Increment A: clarity and trust

## What was delivered

- **Shared content source** in `content/`:
  - The files: `facts.json`, `people.json`, `references.json`, `study.json`, `updates.json`, `documents.json`, `interviews.json`, `sources.json`, and `ui/en.json`.
  - Each fact records its source, verification level and applicable date. The `review` field is internal and never rendered.
  - Pages use `{{fact:…}}`, `{{cite:…}}` and `{{block:…}}` placeholders.
  - The programme brief PDF is generated from the same facts (`src/print/programme-brief.html`), so it can't drift from the site.
- **Build v3**: `build.py` with `buildlib/`. It:
  - validates the content;
  - refuses to put a non-public or unconfirmed fact on a public page;
  - lists production blockers (unresolved markers, links to pages not yet built, facts checked only through search summaries).
- **Navigation**:
  - Six desktop items (The research, The programme, People, Updates, Funding, Contact).
  - Grouped mobile accordion.
  - A section sub-navigation strip, so new pages join a group rather than the top menu.
  - Links to pages not in this increment are turned into plain text and reported; they do not break.
- **Homepage**:
  - "The programme in 90 seconds" (clinical need, candidate, planned study, current status), each with an onward link.
  - The brief directly below, with the PDF (2 pages, tagged, language set).
  - "Latest programme update" taken from the newest real dated update (30 March 2026).
  - A discreet source link on the transition-risk claim.
  - Fewer repeated warnings.
- **People**:
  - Consistent cards generated from `people.json`: focus, verified role, bio, responsibilities and affiliations.
  - Scott Woods is featured first, as the clinical high risk lead.
  - Kane's and Blest-Hopley's responsibilities are stated only as documented.
  - Portraits appear only when a file exists and is marked authorised. Interview modules are hidden until video, transcript and captions all exist and are approved.
- **Consistent copy**:
  - Company, product and Phase 1 facts are now read from content everywhere.
  - "We will report results whatever they show" was rewritten as an intention pointing to the draft publication policy, because the policy has not been adopted.

## Tests performed

Automated browser QA (`tools/qa.mjs`): **147 of 147 checks passed** on 12 pages at 1280 px and 390 px.

- axe-core (WCAG 2.2 A/AA plus best practice): 0 violations.
- No horizontal scroll from 320 to 1440 px.
- Mobile accordion: states, focus, Escape and 44 px targets.
- Keyboard: skip link, and focus visible at every tab stop on the home page.
- Q&A accordion and deep links.
- PDF download.
- Contact routes: well formed, and no unconfirmed email address.
- No-JavaScript menu.
- Staging `noindex`.
- Restricted middleware fails closed.
- I also inspected the home and people pages visually.

## Limitations

- Links to the study, Phase 1, families and newsroom pages show as plain text until increments B and C.
- No portraits yet. Initials are shown.
- The company registration facts, the transition-risk figure and every reference are verified only through search summaries. Production is blocked until primary checks are recorded.

## Missing inputs (see docs/missing-inputs.md)

- Authorised portraits: `src/assets/img/people/<id>.jpg`, then set `authorised: true` in `people.json`. Blocks the photos on people.html and in the press kit.
- Confirmed titles for Jarosz and Barker, and a formal title for Woods (`people.json`). Blocks final profile copy.
- Disclosures for each person (`people.json` → `disclosures`). The section stays hidden until supplied.
