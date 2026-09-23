# Content schema

All repeated facts live in `content/`. Pages and PDF templates reference them. A change in one file updates every page, the programme brief and the press fact sheet.

**Placeholders:**
- `{{fact:id}}`, `{{cite:ref-id}}` and `{{ui:key}}` insert a single value.
- `{{block:name}}` and `{{block:name:arg}}` insert a generated block (see `buildlib/render.py`, methods named `b_*`).

**Validation** (`buildlib/content.py`) stops the build when:
- a fact is missing a field;
- a source, category or status is unknown;
- a public page uses a fact marked `public: false` or `unconfirmed`;
- a profile breaks the title rules: `confirmed` without a management confirmation naming the title; `records-agree` without two agreeing records (one a 2025–2026 record other than the teaser) or with a conflicting record; an unconfirmed chair or committee title; a descriptor or responsibility without its supporting records; an unknown status, group or source;
- a public milestone or update rests on a source that is neither citable (`public_label`) nor a company record (for example a management instruction or a draft).

**Publication blockers** (listed by every build, refused by a production build): open items in `review.json` and any `[TBC: ...]` left in a template (neither is ever rendered); links to unbuilt pages; facts and references used publicly below `document`/`primary` verification; titles not confirmed by management; profiles without consent to publish; biographies below `document`/`primary` verification; a PDF whose content differs from its version in `documents.json`; PDFs out of date with their facts. **Optional assets** (logo, renders, portraits, interviews) are listed separately and never block.

**Internal fields** (`review`, `notes`, `sources`, `location`) are never rendered.

| File | Holds | Key fields |
|---|---|---|
| `sources.json` | Source register | `title`, `date`, `type`, `location` (internal), `public_label` (how it may be cited publicly, or null), `notes` (internal) |
| `facts.json` | Material facts | `value`, `public`, `source`, `verification` (`document` / `primary` / `registry-index` / `index` / `unconfirmed`), `as_of`, `review` (internal), optional `accept_for_production` |
| `study.json` | Study hub and Phase 1 | `summary`; `design_sources[]` (with `version`, `source`, `public`); `endpoints.confirmed[]`; `registrations[]`; `oversight`; `milestones.{clinical,operational,funding}[]` (`status` = Planned / In progress / Completed, `date` or `date_text`, `source`, `public`); `phase1.{measured, can_establish, cannot_establish, results, protocol_history}` |
| `people.json` | Profiles | `group`, `featured`, `public` (false = not rendered), `name`, `role` (the title; null unless `role_status` is `confirmed` or `records-agree`), `role_status` (`confirmed` / `records-agree` / `unconfirmed`; rules in `docs/leadership-reconciliation.md`), `role_records[]` (internal: `source`, `date`, `wording`, optional `title` quoted from the wording, optional `compatible`), `descriptor` (a field of expertise, remit or neutral description, never a title; always shown) with `descriptor_records[]` (two, at least one not the teaser), `responsibilities[]` as `{text, records[]}` (a record dated 2025 or later other than the teaser), `affiliations[]`, `bio`, `bio_verification` (levels as for facts), `consent_to_publish`, `disclosures[]` (shown only when non-empty), `portrait.{file, authorised}` (nothing renders until both are met), `interview`, `sources[]`, `review`. Any title not confirmed, missing consent or an index-level biography blocks production |
| `interviews.json` | Optional video modules | `video`, `poster`, `transcript`, `captions` (WebVTT), `approved`. A module renders only when all files exist and `approved` is true |
| `references.json` | Evidence library | `category`, `kind`, `label` (`established` / `emerging` / `none`), `result` (`positive` / `negative` / `inconclusive` / `mixed` / `descriptive` / `not-conducted` / `guidance`), `population`, `product`, `design`, `finding`, `limitations`, `doi`, `pmid`, `url`, `verification`, `public`; plus `last_checked`, `corrections[]` (`public` flag) and `review_log[]` |
| `updates.json` | Dated real events | `date`, `kind`, `title`, `body`, `source`, `public` |
| `documents.json` | Public documents and change history | per document `file` and `history[]` (newest first) with `version`, `date`, `status`, `change`, `published`, `source_sha256` (the SHA-256 of the PDF source this version was made from; a PDF whose content differs is a publication blocker until a new version is recorded). Only published versions are shown on pages; while the newest version is unpublished its `status` ("Draft for review") is printed in the PDF header. `{{block:document_version:<id>}}` gives the current version label |
| `review.json` | Review items owed before publication | `items[]` with `page`, `item`, `owner`, `done`. Every open item is a publication blocker; never rendered |
| `reports.json` | Programme reports and digests | Empty until real. See `docs/templates/` |
| `services.json` | Families guide routes and crisis lines | `regions[]` (`routes`, `links`, `verification`), `education_work_uk[]`, `crisis_lines` (`text`, `numbers`, `print`; the only copy, used by the Q&A urgent-help section and the appointment sheet), `checked` |
| `assets.json` | Image slots: `logo` (header, footer and favicon via `{{block:brand:*}}`, and both PDFs via `{{block:brand:print}}`) and the renders | `file`, `alt`, `caption`, `authorised`, `caption_approved`, `width`, `height`, `fallback`, `note`, `used_on`. A slot renders nothing until its file exists and it is authorised (see `docs/asset-manifest.md`) |
| `signup-provider-test.json` | Recorded live test of the email provider (absent until done) | `provider`, `list`, `date`, `tested_by`, `function_sha256`, `harness` (`tools/test-signup-live.mjs`), `cases{...}` (every `pass` must be `true`), `digest` (SHA-256 over provider, list, date, tested_by, function_sha256 and cases, see `src/optional/signup/record.mjs`; recomputed by the build). Written only by the harness; `--with-signup` is refused without a passing record for the current `subscribe.js`. The digest is a checksum, not a signature |
| `graphics.json` | Evidence graphics data | `publish`, `rows[]`, `verification`, `verification_needed` |
| `ui/<locale>.json` | Interface strings and navigation | `primary_nav`, `groups[]`, `home`, `brief_link`, `menu`, `notice`, `staging_banner` |

**Generated values:** `{{block:pdf_label:<pdf-name>}}` prints "PDF, N pages, S KB" from the checked `src/downloads/pdf-manifest.json`, so a download label can never disagree with the file. `{{block:evidence_key:compact}}` is the short label key used on the homepage.

## Common changes

- **Change a dose, study status or date:** edit `facts.json` or `study.json`, then run `python3 build.py`. If a PDF contains the changed value, the build regenerates it and checks its page count, tagging and every fact value before installing anything.
- **Add a real update:** append to `updates.json` with its source. The homepage "Latest programme update" picks it up automatically.
- **Add Phase 1 results:** fill `study.json` → `phase1.results` (`as_of`, `source`, `summary`, `table[]`, `limitations`) and change `facts.json` → `phase1.results_status`. The programme brief and the Phase 1 summary's results entry follow automatically; the build regenerates and checks the brief, and asks for a new version in `documents.json`.
- **Add a portrait:** save `src/assets/img/people/<id>.jpg` (square; shown at 96 × 96; requirements in `docs/asset-manifest.md`), then set `portrait.authorised: true`.
- **Confirm a title:** add management's written confirmation to `sources.json` (type `confirmation` or `company-instruction`, dated after 23 September 2026) and to the person's `role_records` with wording that contains the title; set `role` and `role_status: confirmed`; update `docs/leadership-reconciliation.md`.
- **Record consent to publish a profile:** set `consent_to_publish: true` once written consent is held.
- **Record a primary biography check:** set `bio_verification: primary` after checking each statement against its primary source.
- **Record a primary check:** run `python3 tools/evidence_review.py record ... --primary id1,id2`. For facts, set `verification: primary`.
