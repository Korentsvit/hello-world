# Content schema

All repeated facts live in `content/`. Pages and PDF templates reference them. A change in one file updates every page, the programme brief and the press fact sheet.

**Placeholders:**
- `{{fact:id}}`, `{{cite:ref-id}}` and `{{ui:key}}` insert a single value.
- `{{block:name}}` and `{{block:name:arg}}` insert a generated block (see `buildlib/render.py`, methods named `b_*`).

**Validation** (`buildlib/content.py`) stops the build when:
- a fact is missing a field;
- a source, category or status is unknown;
- a public page uses a fact marked `public: false` or `unconfirmed`.

**Internal fields** (`review`, `notes`, `sources`, `location`) are never rendered.

| File | Holds | Key fields |
|---|---|---|
| `sources.json` | Source register | `title`, `date`, `type`, `location` (internal), `public_label` (how it may be cited publicly, or null), `notes` (internal) |
| `facts.json` | Material facts | `value`, `public`, `source`, `verification` (`document` / `primary` / `registry-index` / `index` / `unconfirmed`), `as_of`, `review` (internal), optional `accept_for_production` |
| `study.json` | Study hub and Phase 1 | `summary`; `design_sources[]` (with `version`, `source`, `public`); `endpoints.confirmed[]`; `registrations[]`; `oversight`; `milestones.{clinical,operational,funding}[]` (`status` = Planned / In progress / Completed, `date` or `date_text`, `source`, `public`); `phase1.{measured, can_establish, cannot_establish, results, protocol_history}` |
| `people.json` | Profiles | `group`, `featured`, `name`, `initials`, `role`, `focus`, `responsibilities[]`, `affiliations[]`, `bio`, `disclosures[]` (shown only when non-empty), `portrait.{file, authorised}`, `interview`, `sources[]`, `review` |
| `interviews.json` | Optional video modules | `video`, `poster`, `transcript`, `captions` (WebVTT), `approved`. A module renders only when all files exist and `approved` is true |
| `references.json` | Evidence library | `category`, `kind`, `label` (`established` / `emerging` / `none`), `result` (`positive` / `negative` / `inconclusive` / `mixed` / `descriptive` / `not-conducted` / `guidance`), `population`, `product`, `design`, `finding`, `limitations`, `doi`, `pmid`, `url`, `verification`, `public`; plus `last_checked`, `corrections[]` (`public` flag) and `review_log[]` |
| `updates.json` | Dated real events | `date`, `kind`, `title`, `body`, `source`, `public` |
| `documents.json` | Public documents and change history | `history[]` with `version`, `date`, `status`, `change` |
| `reports.json` | Programme reports and digests | Empty until real. See `docs/templates/` |
| `services.json` | Families guide routes | `regions[]` (`routes`, `links`, `verification`), `education_work_uk[]`, `checked` |
| `assets.json` | Render slots | `file`, `alt`, `caption`, `authorised`, `caption_approved`, `fallback` |
| `graphics.json` | Evidence graphics data | `publish`, `rows[]`, `verification`, `verification_needed` |
| `ui/<locale>.json` | Interface strings and navigation | `primary_nav`, `groups[]`, `notice`, `staging_banner` |

## Common changes

- **Change a dose, study status or date:** edit `facts.json` or `study.json`, then run `python3 build.py && (cd tools && node make-pdf.mjs) && python3 build.py`.
- **Add a real update:** append to `updates.json` with its source. The homepage "Latest programme update" picks it up automatically.
- **Add Phase 1 results:** fill `study.json` → `phase1.results` (`as_of`, `source`, `summary`, `table[]`, `limitations`) and change `facts.json` → `phase1.results_status`.
- **Add a portrait:** save `src/assets/img/people/<id>.jpg`, then set `portrait.authorised: true`.
- **Record a primary check:** run `python3 tools/evidence_review.py record ... --primary id1,id2`. For facts, set `verification: primary`.
