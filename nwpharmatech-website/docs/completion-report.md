# Completion report: staging draft 3 (increments A, B and C)

Date: 23 September 2026. The commit ID is in `COMMIT.txt` in each package. **The live website has not been changed. Nothing has been deployed. GitHub has not been pushed to** (this session has no repository access; no further retries).

A clean build, a clean scan or passing link checks are **not** proof that the science is right or that the whole visitor experience works. The sections below keep machine-verified behaviour separate from what still needs human review.

## Verified: functionality (automated)
- **Browser QA** (`tools/qa.mjs`): **268 of 268 checks passed.** Covered: 16 public pages at 1280 and 390 px; widths from 320 to 1440 px; 200% zoom; text spacing; reduced motion; forced colours; accessibility-tree landmarks; axe WCAG 2.2 A/AA plus best practice (0 violations on public and restricted pages); keyboard and focus; mobile accordion; Q&A accordions and deep links; evidence filters, including without JavaScript; tables; links and anchors; downloads (tagged PDFs, RIS/BibTeX counts); contact routes; staging `noindex`; restricted-area safeguards (inactive controls, the eligibility statement, fail-closed middleware); families-page content rules; absence of placeholders, unpublished facts and graphics previews.
- **Sign-up unit tests** (`tools/test-signup.mjs`): 7 of 7 passed. The form was also tested in a `--with-signup` build.
- **Content consistency** (`tools/test_consistency.py`): changing the Phase 2B status, the product strength or a profile role updates every page that uses it and the generated brief, with no stale copies.
- **Production gate:** `build.py --env production` refuses to build while blockers remain (tested).

## Verified with limits: content
- **Company records:** programme facts come from them (see `content/sources.json` and `docs/source-register.md`). They show what the company recorded, not independent confirmation.
- **References:** every reference, DOI and PMID, every quoted number, the Companies House details, the registry entries and the service routes were checked **through search-engine summaries only**. The primary pages are blocked from this environment. Production stays blocked until someone records primary checks.
- **Graphics:** the two evidence graphics are built but **unpublished** for the same reason.

## Not done or not verified
- Everything in `docs/missing-inputs.md`. The most important items:
  - the CHR-P Phase 2B design, including the 300/600/900 mg range;
  - Phase 1 results;
  - authorised portraits and renders;
  - title confirmations;
  - approvals of the financing, publication-policy and editorial-standards wording;
  - the live-site URL list.
- Screen-reader, Safari, Firefox and real-device testing, and a manual WCAG audit.
- Scientific sign-off on every evidence label; legal review (financial promotion, the privacy notice); MHRA advertising review.
- Live testing of the email provider.

## Packages
- Increment A: `nwpharmatech-website-increment-A-70d9c8a.zip`
- Increment B: `nwpharmatech-website-increment-B-6953e38.zip`
- Increment C and final handoff: `nwpharmatech-website-increment-C-<commit>.zip`. This contains the source, content, deployable `public/` and `restricted/`, tools and all documents.
