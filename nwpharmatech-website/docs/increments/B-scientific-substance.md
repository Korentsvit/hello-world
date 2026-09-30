# Increment B: scientific substance

## What was delivered

### Study hub (study.html): "The study: progress and evidence"

- **Dated summary:** what the study is intended to investigate, the current verified stage, what has been completed, and the next substantive milestone (no date set).
- **Public synopsis,** with a link to the brief download.
- **Proposed design:** shown only from sources that exist (population and aims, from the September 2026 brief), with source and version.
- **Endpoints:** omitted until confirmed. There are no placeholder panels.
- **Milestones:** separated into clinical, operational and funding. Each has a Planned, In progress or Completed status, a date or "as reported", and a source. There are no percentages, recruitment counts, approvals or committee appointments.
- **Registrations:** both Phase 1 registry entries, linked. The page states that the Phase 2B study will be registered before first enrolment.
- **Sponsor and oversight:**
  - An explanation of sponsor responsibilities.
  - The actual Phase 1 arrangements, from study records: stopping rules; no data monitoring committee; external biostatistics provider.
  - A statement that Phase 2B oversight has not yet been established.
- **Document history:** substantive changes, with staging drafts marked as unpublished.
- **Publication policy:** marked as a draft for management adoption. It covers disclosure regardless of outcome, registry results, a plain-language summary and journal submission, and presents no timetable as a commitment.

### Phase 1 page (phase-1.html)

- **Sections:** what was studied, who took part, design, doses and comparator, what was measured, results publication status, and what the study can and cannot establish.
- **Protocol history:** the change from eligibility-criteria version 2 to version 3.
- **Results:** withheld. The page shows a status only. A structured `results` slot in `study.json` means results can be added later without redesign.
- **Registry entries:** both entries were matched to this study (sponsor, age range, 105-day duration, crossover design and title match the study records). This was checked at search-summary level.
- **Wording tests:** the QA suite fails the build if the page shows PK numbers or claims bioequivalence or superior tolerability.

### Science and formulation page (science.html)

- **Three connected questions:** why CBD, why a micellar softgel, and why a dose range.
- **Evidence rows:** each question separates Established / Emerging (other CBD preparations) / Programme information (NWPT-SM32300) / Open question.
- **One static SVG diagram:**
  - It shows the steps from capsule to the bloodstream, ending at "Measured in Phase 1".
  - The brain step is shown dashed as "not measured; delivery not shown".
  - It has an accessible title and description and no animation.
- **Asset slots** (`content/assets.json`) for the corporate softgel and micellar renders. They render only when the file exists and both the image and its caption are authorised; otherwise the diagram stands alone and no "pending" box appears.
- **Dose range:** explained only from established principles, other preparations' doses and Phase 1 facts. **The proposed 300/600/900 mg range is not shown, because the CHR-P design source has not been supplied.**

### Evidence library (evidence.html)

- **Plain-language overview.**
- **Filters:** clinical need, current care, prediction and outcomes, interventions, CBD research, programme-specific. They are keyboard accessible, show pressed state, have a live result count, and with no JavaScript every section is shown instead.
- **Cards:** 24 study cards with population, product, design, finding, limitations and source. DOI and PubMed links are included where confirmed.
- **Findings flagged:** negative (Boggs 2018), mixed (Appiah-Kusi 2020), inconclusive (Stafford 2013, Davies 2018) and not conducted (CANTOP).
- **Programme information** is shown as a separate label, never as an evidence grade.
- **Downloadable citations:** RIS and BibTeX, generated from `references.json`.
- **Last-checked date,** the method statement (search-summary level, until a primary check is done), a public corrections section (empty, because staging-only corrections are internal) and the review history.
- **Monthly review support:** `tools/evidence_review.py status | record`. It records only reviews that took place and refuses future dates.

### Evidence graphics: built but NOT published

- `docs/graphics-preview/prevalence.html` and `.png`: pooled prevalence with 95% confidence intervals, from Salazar de Pablo et al., *Brain Sci* 2021.
- `docs/graphics-preview/transition.html` and `.png`: pooled meta-analytic cumulative risk at 6–48 months with 95% CIs, from Salazar de Pablo et al., *JAMA Psychiatry* 2021. Kaplan–Meier estimates are deliberately not combined with these.
- Both have data tables and SVG titles and descriptions, and the palette was validated.
- They stay unpublished because the values are verified only through search summaries. The exact checks needed are in `content/graphics.json`. Once a check is recorded, set `publish: true` and run `python3 tools/make_graphics.py`.

## Tests performed

Automated QA: **216 of 216 checks passed** on 14 pages at 1280 px and 390 px, and at widths from 320 to 1440 px.

- axe-core: 0 violations.
- Evidence filters: states, live status, and the no-JavaScript fallback. This caught a real bug, now fixed: CSS overrode `hidden`, so the filter bar showed without JavaScript.
- Card completeness and result flags.
- The RIS and BibTeX record counts match the 24 cards.
- Phase 1 page: both registry links; no results numbers; no bioequivalence or superiority wording.
- Diagram: accessible, no animation.
- No placeholder or "pending" text in the public build.
- Unpublished facts (Phase 2B regions, funding figures) do not appear on public pages.

I also inspected the study, science, Phase 1 and evidence pages visually.

## Limitations

- Every reference and quoted figure is verified only through search summaries, so production is blocked until primary checks are recorded.
- The evidence library is long on mobile. The filters shorten it.

## Missing inputs

- The **CHR-P Phase 2B design document** (arms including the 300/600/900 mg range, control group, duration, endpoints, size, countries), to go in `content/study.json` → `design_sources` and `endpoints`. It blocks the design details, endpoints and dose rationale.
- The **Phase 1 CSR and approved plain-language results,** to go in `content/study.json` → `phase1.results`. They block the results section.
- **Phase 1 ethics and regulatory approval references,** to go in `study.json` → `oversight.phase1`. They block the approvals statement.
- The **Epidyolex comparator dose wording from the protocol,** to go in `facts.json` → `phase1.treatments`. It blocks the comparator dose on the page.
- **Authorised softgel and micellar renders with approved captions,** to go in `src/assets/img/renders/` and `content/assets.json`. They block the render images; the diagram covers the page meanwhile.
- **Primary-source verification** of the graphics values, recorded in `content/graphics.json`. It blocks both graphics.
