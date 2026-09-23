# Missing inputs

Each entry gives what is missing, where it goes, and what it blocks. Nothing here is shown as a placeholder on public pages; the affected module is omitted or the text says exactly what is known.

| # | Input | Where it goes | What it blocks |
|---|---|---|---|
| 1 | **CHR-P Phase 2B design document**: control group, the proposed 300/600/900 mg arms, duration, endpoints, size, countries, version and date | `content/study.json` → `design_sources` (add an entry with `version`), `endpoints.confirmed`; dose rationale text in `science.html#dose` | Design details, endpoints and the dose-range rationale on the study and science pages |
| 2 | **Phase 1 CSR and approved plain-language results** | `study.json` → `phase1.results`; `facts.json` → `phase1.results_status` | Phase 1 results section; registry results |
| 3 | Phase 1 **ethics and regulatory approval references**, and the **Epidyolex comparator dose** as worded in the protocol | `study.json` → `oversight.phase1`; `facts.json` → `phase1.treatments` | Approval statement; comparator dose |
| 4 | **Phase 1 start date:** SDTM 26–27 Aug 2025 vs ClinicalTrials.gov 22 Sep 2025 | `facts.json` → `phase1.first_consent`; registry record | Consistent date across site and registry |
| 5 | **Current status of the Phase 2B protocol** (last documented Feb 2026) and the next milestone date | `facts.json` → `phase2b.protocol_status`; `study.json` → `summary.next` | Accuracy of "In progress"; a dated next milestone |
| 6 | **Authorised portraits** for 8 people, plus written consent to publish name, biography and photo | `src/assets/img/people/<id>.jpg`; `people.json` → `portrait.authorised` | Photos on people.html and the press kit |
| 7 | **Titles:** Jarosz (Executive Chairman) vs Barker (Non-Executive Chairman); a formal title for Woods; whether Trevor Jones and Max Moldaschl are listed | `people.json` | Final profile copy |
| 8 | **Disclosures** for each person | `people.json` → `disclosures` | The disclosures line on each profile (hidden meanwhile) |
| 9 | **Interview recordings** with transcripts and WebVTT captions, approved by each speaker | `src/assets/media/`; `interviews.json` | Interview modules (hidden meanwhile). Outlines: `docs/interviews/` |
| 10 | **Corporate softgel and micellar renders** with approved captions | `src/assets/img/renders/`; `assets.json` | Render images (the diagram covers the page meanwhile) |
| 11 | **Official logo files** (NW monogram) | `src/assets/img/` | Brand mark (an interim mark is used) |
| 12 | **Primary-source verification** of every reference, the company registration facts and the two graphics | `tools/evidence_review.py record`; `facts.json` `verification`; `graphics.json` `publish` | Production build; the two graphics |
| 13 | **Public enquiries mailbox** (monitored) | `contact.html` | Email contact route |
| 14 | **Spelling of the head-office address** ("Wisely" or "Wisley" Court) | `facts.json` → `company.head_office` | Address accuracy |
| 15 | **Board and counsel approval** of the funding and financing wording, the independence commitments and the editorial standards | `financing.html`, `newsroom.html#standards` | Production build (TBC marker); adoption labels |
| 16 | **Management adoption** of the publication policy, with timings | `study.html#publication-policy`; `documents.json` | Changing "draft" to "adopted" |
| 17 | **Approved funding figures** (committed, cash received, expenditure) | `facts.json` → `funding.*` (`public: true` once approved) | Public funding figures |
| 18 | **Investor platform, KYC provider and registrar** selection; counsel review (UK FSMA s21 and cryptoasset promotions; US securities law; EU MiCA) | `src/restricted/investor-journey.html` | Any move beyond the inactive demonstration |
| 19 | **Email provider** account, API key and a tested adapter | Cloudflare environment variables (see `docs/email-signup.md`) | Email sign-up (absent from the public build meanwhile) |
| 20 | **Privacy notice:** data protection contact and retention period | `legal.html` | Production (TBC marker) |
| 21 | **Crisis-line re-check** on official sites just before launch | `faq.html` | Production (TBC marker) |
| 22 | **Live-site URL list** (nwpharmatech.org / .com) | `src/redirects.txt`; `docs/url-map.md` | Old-to-new redirects for the live site |
| 23 | **Lived-experience adviser** appointment (see the private proposal) | `people.json` once appointed | Listing an adviser (not shown until appointed) |
| 24 | **UK Specials / expanded access** decision | `faq.html`, `programme.html` | "Not available outside approved studies" wording |
| 25 | Official nhs.uk page URLs for EIP and CAMHS, checked | `content/services.json` | Direct links in the families guide |
