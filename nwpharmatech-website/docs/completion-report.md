# Completion report: correction release (staging draft 3.1)

Date: 23 September 2026. The commit ID is in `COMMIT.txt` in the ZIP.

**The live website has not been changed. Nothing has been deployed, no DNS has changed, and nothing has been pushed to GitHub:** this session has no repository access, and push is not being retried. This package is for the live-site bots to integrate, module by module (`docs/integration.md`).

A clean build, passing tests or clean scans are **not** proof that the science is right or that the whole visitor experience works. This report keeps what machines verified apart from what still needs people.

## The eight items
| # | Item | Status | Where to look |
|---|---|---|---|
| 1 | Production build gate | Done. A failed, refused or interrupted build leaves every output unchanged; if even the rollback fails, nothing is deleted (75 checks) | `changelog-correction-release.md` §1; `tools/test_build_gate.py` |
| 2 | Cloudflare routing | Done for this site's own URLs and aliases, under Cloudflare's runtime (175 checks). Old **live** URLs can't be mapped until their list is supplied | §2; `docs/url-map.md`; `tools/test-routes.mjs` |
| 3 | Mobile menu | Done. One Home link, one group open at a time, closes on in-page destinations and whenever focus leaves it (66 checks) | §3; `tools/test-menu.mjs`; screenshots `docs/qa/screenshots/menu-*.png` |
| 4 | Leadership | Reconciled, and every title needs management confirmation. The one table and its questions for management are ready. Woods: no title, no adviser wording, no responsibility line; neither chair title is shown while the records conflict; Trevor Jones restored | `leadership-reconciliation.md` |
| 5 | Integration package | Done: six modules, scoped styles, module-by-module instructions (241 checks) | `docs/integration.md`; `integration/` |
| 6 | Programme Room | **Not supplied.** It isn't in this workspace or anywhere this session can reach. Nothing presents the study hub as the Programme Room | `programme-room.md` |
| 7 | Visual and editorial pass | Done, apart from assets that haven't been supplied: the official logo, portraits and renders. Their slots are ready and show nothing until then | §7; `editorial-pass-notes.md`; `asset-manifest.md` |
| 8 | Functional claims | Sign-up wording and gate: done; **live provider not tested**. PDFs: regenerated and checked whenever their content changes | §8; `email-signup.md` |

## Verified by machine
- **Test suites on the final tree** (full table in the change log):
  - build gate 75/75;
  - routes 175/175;
  - access guard 22/22;
  - menu 66/66;
  - QA 282/282;
  - integration 241/241;
  - sign-up 75/75 (99/99 with the browser run);
  - people gate 30/30;
  - content rules 22/22;
  - consistency: pass.
- **Adversarial review:** six independent reviewers attacked the release on private copies. Their confirmed findings were fixed, and a second round of checkers re-ran the original reproductions against the fixed tree. A final verification pass confirmed 57 of 61 findings fixed and found new defects (restricted layout, the Access guard's handling of malformed tokens and key rotation, rollback edge cases, unrecorded plans in the wording). The remaining four and the new defects are fixed and covered by tests; see "Verification pass" in the change log.
- **Cloudflare behaviour:** routes, redirects, headers and the restricted guard were exercised with Cloudflare's own Pages runtime (`wrangler pages dev`, workerd) locally. This is not a deployment. Behaviour on a real Cloudflare account, including Access and `pages.dev` hostnames, still has to be checked after the first staging deploy, using the steps in `docs/deployment.md`.
- **Accessibility (automated):**
  - axe WCAG 2.2 A/AA and best practice on every page at two widths, with the menu open, and inside each module;
  - keyboard and focus paths;
  - 200% zoom, text spacing and reduced motion;
  - forced colours: Chromium emulation only. That covers the home page at 1280 px in `qa.mjs`, and the mobile toggle, open menu and navigation markers at 320, 390 and 1280 px, light and dark, in `test-menu.mjs`. It has not been tested with real Windows contrast themes.

## Verified with limits
- **Programme facts** come from company records (`content/sources.json`, `docs/source-register.md`). These show what the company recorded, not independent confirmation.
- **References, registry entries, Companies House details, crisis lines and index-level biographies** were checked through search-engine summaries only. The primary pages were blocked from this environment. Production stays blocked until someone records primary checks.
- **Leadership titles** are shown on staging only where two or more records agree. No title is confirmed by management, and no profile has recorded consent to publish.
- **Investment wording:** every public statement about investment says no investment is accepted "through this website or through the financing route described here". The site does not claim anything about the company's other fundraising.

## Not done or not verified
- Everything in `docs/missing-inputs.md`. The most important items:
  - the CHR-P Phase 2B design, including the 300/600/900 mg range;
  - Phase 1 results;
  - management confirmation of titles, and each person's consent; Grace Blest-Hopley's written responsibilities;
  - board and legal approval of the financing wording;
  - legal review of the privacy notice;
  - the official logo, portraits and renders;
  - the live-site URL list.
- The Programme Room component.
- A live email-provider test. `--with-signup` stays refused until one is recorded.
- Screen-reader, Safari, Firefox and real-device testing, and a manual WCAG audit.
- Scientific sign-off on every evidence label; legal review (financial promotion, the privacy notice); MHRA advertising review.

## Packages
- This release: `nwpharmatech-website-correction-release-<commit>.zip`. It contains:
  - source and content;
  - deployable `public/` and `restricted/`;
  - `integration/`;
  - tools;
  - all documents and screenshots;
  - `COMMIT.txt`.
- Earlier: increment A (`70d9c8a`), B (`6953e38`) and C (`a4e31c4`).
