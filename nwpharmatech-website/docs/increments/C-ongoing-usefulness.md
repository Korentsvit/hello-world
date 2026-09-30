# Increment C: ongoing usefulness

## What was delivered

### For young people and families (families.html)
- **Sections:** what clinical high risk means and does not mean; what a specialist assessment may involve; questions to ask a clinician; school, work and family life; region-specific routes to help.
- **Services** (`content/services.json`): England, Wales, Scotland, Northern Ireland, Ireland and the United States.
  - The guide never assumes that a first-episode service accepts people at risk. It says what is verified for each nation and tells people to ask locally.
  - nhs.uk links whose addresses were unconfirmed are omitted.
- **Printable appointment-preparation sheet:** a tagged one-page PDF, filled in by hand.
- **No** quiz, risk score, diagnosis, data collection or investment prompt; this is tested.
- Urgent help is one link at the top, not a crisis page.

### Newsroom (newsroom.html)
- **Press kit:** boilerplate and fact sheet generated from `content/facts.json`. The photograph section appears only when authorised portraits exist.
- **Programme reports:** the four-question format (what changed, what supports it, what remains unresolved, what happens next) is built into the page. No reports are shown, because none exist yet. Template: `docs/templates/quarterly-report.md` and `.example.json`.
- **Evidence-digest template:** `docs/templates/evidence-digest.md`.
- **Public corrections log:** shows none since publication. The internal corrections made during staging are kept out.
- **Editorial standards:** a draft for adoption that separates scientific review, editorial review and publication approval, and states that reviews are never backdated.

### Funding and financing (financing.html)
- **Public page, kept concise:** what funding supports; what is and is not funded (from the funding milestones); who controls spending (the board) and clinical decisions; how progress is reported.
- **Financing route:** the preferred platform-integrated route, with permissioned tokens at closing where feasible and register-first as the fallback, is preserved.
- **No figures are public.** Figures are classified (planning target, committed funding, cash received, expenditure) in the restricted `funding-figures.html`. Expressions of interest are explicitly never counted.

### Restricted investor-journey demonstration (restricted/investor-journey.html)
- **Steps:** eligibility → disclosures → identity checks → documents → subscription → ownership record → reporting, each showing who delivers it (the platform, its KYC provider or payment partner, the registrar, or the tokenisation service at closing where feasible).
- **Synthetic data only.** Every control is disabled, and the middleware refuses all submissions.
- The page states that access does not confirm eligibility.
- No bespoke custody, identity or payment infrastructure was built.

### Email sign-up (optional)
- A double opt-in function with provider adapters, truthful error messages and a hidden anti-bot field. It is absent from the public build unless `--with-signup` is used.
- 7 unit tests pass. The newsroom form was tested in a sign-up build: axe clean, and errors are announced accessibly.

### Translation architecture
- The `--locale` flag and `content/ui/<locale>.json`.
- The policy forbids machine-only clinical translation. Production builds are English-only.

### Handoff
- Content schema, missing inputs, integration instructions, deployment, route map, asset manifest and the updated source register.
- Lived-experience adviser proposal (private), interview outlines and the evidence-review procedure.

## Tests performed
- `tools/qa.mjs`: **268 of 268 checks passed.** This covers 16 public pages at desktop and mobile widths, and the 4 restricted pages. It includes the increment A and B checks plus:
  - text spacing, reduced motion, 200% zoom, forced colours;
  - accessibility-tree landmarks, tagged PDFs;
  - families-page content rules;
  - restricted axe checks, inactive controls, and the eligibility statement.
- `tools/test-signup.mjs`: 7 of 7 passed.
- I inspected pages visually, including the restricted pages.

## Limitations
- No real screen-reader, Safari or Firefox testing (see `docs/accessibility-testing.md`).
- Service routes are verified only through search summaries and must be re-checked before launch.
- The sign-up adapter has not been checked against live provider documentation.

## Missing inputs
See `docs/missing-inputs.md`, items 9 and 13–25.
