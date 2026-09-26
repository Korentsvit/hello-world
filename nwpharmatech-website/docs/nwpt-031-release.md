# Release candidate NWPT-031: correction pack and first scientific portfolio

26 September 2026. Internal. This release builds on the 5ad9428 preview (hosted at nwpt-claude-5ad9428-preview.pages.dev) and is meant for Grok to redeploy to the same preview project. **Production is unchanged.**

## Before and after

| Pack item | Before (5ad9428) | After |
|---|---|---|
| F1/D1 Home | Brief blurb and funding strip said "we are developing…" | Brief blurb: "A financing route for the programme is under evaluation: platform-integrated financing is the preferred path, with a conventional register-first placement as the fallback." Funding strip: the exact KEEP paste ("We are evaluating a platform-supported route… Community updates and discussion are separate from any regulated investment process.") |
| F2/D2 wording | "Preferred path" | "Preferred path under evaluation" (Funding), plus "These are development objectives, not live offering terms." Same wording in the Q&A and the programme brief |
| F3/D3 routes | `/financing`, `/people` | Canonical `/funding-use` and `/team`. 301s from `/financing`, `/funding`, `/invest`, `/investors` and `/people`, including their trailing-slash forms. All internal links were updated |
| C1/B1 Salazar 2021 | Described as "pooled" | Kaplan–Meier cumulative estimates on Home, Clinical need, Families, the brief and the Evidence card. The evidence limitations separate it from pooled averages; Fusar-Poli 2012 stays "pooled" |
| C2/B2 roles | Woods "CHR-P lead" | **Woods:** "CHR-P programme lead", with an "Individual capacity" badge and a statement: Yale does not endorse the programme, and programme leadership is separate from the sponsor role. **Grace Blest-Hopley:** "Partner & Chief Scientific Officer", the company's scientific lead, not the CHR-P lead. **Kane:** "Lead, Schizophrenia Programme", separate from CHR-P |
| Programme brief PDF | Version 4 | Version 5, "Draft for review", with the wording above |
| Scientific portfolio | Not supplied | Six images, checksums verified: **01** Home hero, **02** Science hero, **04** Science · formulation, **05** Team hero, **06** Programme · where the programme stands, **08** Phase 1 · at a glance. The package's own captions are used, with 4:3 phone crops and 21:9 desktop hero bands. **03** micelle is not used, as on the live site. **07** is held (conflict 1). The portfolio images are left out of the exported live modules, since the live site places its own |

## Conflicts to decide

1. **Funding hero.** The live funding-use page uses portfolio 07. The DAO instruction put DAO 09 there, and this release keeps 09. Choose one.
2. **Funding mechanics.** The live funding-use page is reported to include ring-fenced vehicle, bank/custody and dual-control wording. This release keeps the agreed level: it names no release approvers, custody arrangement, dual control or qualifying-receipt definitions. This needs the production source to reconcile.
3. **Live-only routes.** `/how-it-works`, `/desci` and `/updates/how-desci-could-help` are live but not in this build. They are neither restored nor redirected.
4. **Team biographies.** The exact live biography paste (`CHRP-NWPT-027-BIOS-PASTE.md`) was not in the pack, so the staging biographies stand.
5. **Roster.** Staging has nine profiles; the live roster has eight. The extra person is **William Jarosz** (not Trevor Jones, as an earlier note said). See `docs/preview-handoff.md`. Management decides.
6. **Woods eyebrow.** "CHR-P programme lead" is shown as his role line. Descriptors cannot hold remit words, so the eyebrow stays as the area ("Clinical high risk of psychosis (CHR-P)").
7. **Internal only.** `content/graphics.json` (an unpublished graphic) still labels the Salazar series "pooled". It does not appear on any public page.

## Still absent

- **`nwpt-production-source-030b.zip`:** not among the files received. Full reconciliation with the live KEEP text waits for it.
- **Authorised portraits, 0 of 8:**

  | Person | Expected file |
  |---|---|
  | Filipp Korentsvit | `filipp-korentsvit.jpg` |
  | Daud Gutseriev | `daud-gutseriev.jpg` |
  | Dr Grace Blest-Hopley | `grace-blest-hopley.jpg` |
  | Dr Scott W. Woods | `scott-woods.jpg` |
  | Dr John M. Kane | `john-kane.jpg` |
  | Professor Richard Barker | `richard-barker.jpg` |
  | Professor Trevor Jones | `trevor-jones.jpg` |
  | Dr Gillian Cannon | `gillian-cannon.jpg` |

  Also `william-jarosz.jpg`, if he stays. No portrait was generated or scraped.
- **Programme Room:** a separate handoff; not supplied.
- **Cloudflare Access on the preview:** set in Filipp's dashboard.
- **RFI replies:** platform recommendation still "Assumed".

## Checks (this tree)

| Suite | Result |
|---|---|
| release-check on `public/` | 2,086 / 2,086 |
| qa | 282 / 282 |
| test-funding | 72 / 72 |
| test-integration | 259 / 259 |
| test-routes | 189 / 189 |
| test-menu | 66 / 66 |
| test-signup `--browser` | 99 / 99 |
| test_build_gate | 75 / 75 |
| test_people | 32 / 32 |
| test_content_rules | 22 / 22 |
| test-access | 22 / 22 |
| test-release-check | 10 / 10 |
| test-images | 7 / 7 |
| test_consistency | pass |

These are automated checks, not a WCAG audit.
