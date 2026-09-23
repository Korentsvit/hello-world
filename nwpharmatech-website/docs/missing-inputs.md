# Missing inputs

Nothing below is shown as a placeholder on a public page. `python3 build.py` prints the current publication blockers and the optional assets separately, and writes both to `build/build-report.json`.

## Publication blockers

A production build is refused while any of these remain.

| # | What is needed | Owner | Where it is tracked |
|---|---|---|---|
| 1 | **Primary-source verification** of every cited reference and of the Companies House, registry and pooled-risk facts (checked so far only through search summaries) | Scientific reviewer | Build report; `tools/evidence_review.py record`; `facts.json` `verification` |
| 2 | **Leadership titles** confirmed by management, and consent to publish each profile. The discrepancies and the questions for management are in [`leadership-reconciliation.md`](leadership-reconciliation.md) | NWPharmaTech management | `people.json` `role_status` |
| 3 | **Board and legal approval** of the funding and financing wording (financing page, homepage, Q&A, programme brief PDF) | Board and legal counsel | `content/review.json` |
| 4 | **Legal review of the privacy notice**, including the retention period and a data protection contact | Legal counsel | `content/review.json` |
| 5 | **Crisis-line re-check** on the official sites immediately before launch. The numbers are kept once, in `content/services.json` → `crisis_lines`, which fills the Q&A urgent-help section and the appointment preparation sheet PDF | Site editor | `content/review.json` |
| 6 | **Head-office address spelling** ("Wisely" or "Wisley" Court) | NWPharmaTech management | `content/review.json` |
| 7 | **Phase 1 start date:** company records (first consent 27 August 2025) against ClinicalTrials.gov (start 22 September 2025) | Clinical operations | `content/review.json` |
| 8 | **Current Phase 2B status:** "Protocol being finalised" was last documented on 23 February 2026; confirm it, and give the next milestone date if one is set | NWPharmaTech management | `content/review.json` |

A PDF whose facts have changed is regenerated and checked by the build; if that fails, the build stops (no action needed unless it does).

## Optional assets (never block publication)

Each slot renders nothing until supplied and authorised. Paths, sizes and switches: [`asset-manifest.md`](asset-manifest.md).

- Official logo (the interim mark and text wordmark are used meanwhile)
- Softgel render with an approved caption (the diagram stands on its own meanwhile)
- Micellar illustration (no agreed placement)
- Portraits of the nine people on the people page, with written consent
- Interview recordings with captions and transcripts, approved by each speaker (outlines in `docs/interviews/`)

## Content that appears when supplied (not blockers)

The site omits these modules, or says only what is known, until the input arrives.

- CHR-P Phase 2B design document (control group, doses, duration, endpoints, size, countries), then confirmed endpoints
- Phase 1 study report and approved plain-language results; Phase 1 ethics and regulatory approval references; the Epidyolex comparator dose as worded in the protocol
- Disclosures for each person; approved funding figures; a monitored public enquiries mailbox
- Investor platform, KYC provider and registrar, with counsel review (restricted demonstration only); email provider and a recorded live test (`docs/email-signup.md`)
- Live-site URL list for old-to-new redirects (`docs/url-map.md`); checked nhs.uk links for the families guide; the UK Specials / expanded access decision
- A company record for each of three milestones kept off the public pages because their only source is a development instruction: a Phase 1 results summary on the registries and the site, Phase 2B registration before first enrolment, and the programme financing route (`study.json` review notes). The build refuses a public milestone or update whose source is an instruction or a draft
- Management decisions on two proposals removed from the public pages: [`proposals/publication-policy.md`](proposals/publication-policy.md) and [`proposals/editorial-standards.md`](proposals/editorial-standards.md)
- A lived-experience adviser appointment (no adviser is listed until one is appointed)
