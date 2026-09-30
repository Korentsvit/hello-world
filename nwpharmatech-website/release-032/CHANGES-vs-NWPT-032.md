# NWPT-033 integrated release candidate: changes against NWPT-032

26 September 2026. The baseline is `nwpt-production-source-032.zip`, committed unchanged as `3dfad5a`. The candidate is `release-032/site/`, and every change below is a separate commit on top of that baseline. Production is not changed. All `assets/filipp-032/` files and their placements are kept as they are.

## Changes

| Area | NWPT-032 | Candidate |
|---|---|---|
| **Transition figure** (Home, Families, Evidence overview, clinical-need article) | "Published Kaplan–Meier estimates suggest … one in four (~25%)" | "An updated meta-analysis estimated that about one in four … (pooled estimate, 25%) developed psychosis within three years". Salazar de Pablo 2021 reports a pooled 3-year estimate of 25% and a separate Kaplan–Meier series of 27% at 3 years |
| Evidence card, Salazar de Pablo 2021 | "≈25% … (Kaplan–Meier cumulative estimate)" | The pooled estimate (25% at 3 years) and the Kaplan–Meier series (8 / 14 / 20 / 27 / 35% at 6 months and 1, 2, 3 and 10 years) are given as separate analyses and never combined. Fusar-Poli 2012 stays a separate pooled synthesis |
| Clinical-need article, FACTS and method notes | Kaplan–Meier series given as "8 / 14 / 20 / 25%" | Pooled 25% in FACTS; the Kaplan–Meier series 8 / 14 / 20 / 27 / 35% in the method notes; the two are never mixed |
| Programme brief PDF (`/downloads/`) | Version 4: "we are developing a financing route…", and an unlabelled "pooled studies" wording | Version 6: the one-in-four figure labelled as the pooled estimate; the financing row follows the pack ("Preferred path under evaluation … register-first fallback; development objectives, not live offering terms") |
| Team | Grace: "— distinct from Professor Woods's role as CHR-P programme lead"; Kane: "it is **not** the CHR-P programme lead role…" | Each person is described by their own role, with no internal comparison labels. Roles, the eight-person roster and all biographies are unchanged. William Jarosz is not published (his draft stays in the private staging content) |
| Funding use | Manus 07 at the end of the page | DAO 09 is the page hero. DAO 12 goes at "How spend would be controlled". Manus 07 moves to `/desci` |
| How funding could work | Diagram only | DAO 10 (the register and the digital record derived from it) after the diagram. The page stays separate from Funding use |
| Governance | Lanes diagram only | DAO 11 (independent clinical oversight) above the lanes |
| Community | No image | DAO 13 (open research dialogue) in the page hero |
| Science, "The unanswered question" | No image | New membrane-receptor still, with a caption saying it is not evidence of mechanism, brain delivery or benefit |
| Updates | Legacy JPGs, 135–307 KB each, including a brain with particles streaming in, which reads as brain delivery | Optimised WebP thumbnails: glass thresholds (featured card), micelle field (aims article and its card), glass ledger (DeSci card) |
| Routes | `/funding` and `/people` resolved through two hops (`.html` target, then the clean URL) | Every redirect resolves in one hop. Added `/financing` → `/funding-use` (Board lock) and `/clinical-need` → the clinical-need article (staging preview route). Nothing was consolidated: `/how-it-works` and `/funding-use` stay separate |
| 404 | Unknown paths returned the home page with status 200 | `404.html` (noindex) links to the main sections |
| Links | `proposed-token` → `how-it-works#scen-title` pointed at an anchor that no longer exists | Links to the Scenario explorer |
| Accessibility | 60 axe failures (colour contrast of the footer, badges, table headers and diagram notes; footer link not underlined) | 0 axe failures. The fix is CSS only; the stylesheet cache key is now `nwpt033` on every page |

Every visual is labelled conceptual, is served as WebP at 768, 1200 and 1920 px with a 4:3 phone crop, has an intrinsic size and loads lazily (except the hero images).

## Supplied assets that were not used

- `nwpt-brain-ecs-hero-21x9.webm`: the same clip as `assets/filipp-032/cns-motion-1280.webm`, already on `/science` with a poster.
- The MP4 (H.264, 960×540, 12 s): brain, then neuron, then membrane receptors. It opens on the same brain, and the receptor sequence implies a mechanism no study has shown. The membrane still is used instead.
- The meeting scene (three people around a model): unidentified, realistic people could be read as the team or as real collaborators.
- Stills already in production: platform hub, pipeline flow, softgel cutaway and the brain frame.

## Checks (Cloudflare Pages runtime, `release-check.mjs --stub-external`)

| | NWPT-032 | Candidate |
|---|---|---|
| Checks | 4,133 / 4,195 | **4,301 / 4,301** |
| Pages crawled, at 390 and 1280 px | 31 | 31 |
| axe WCAG 2.2 AA | 0 / 60 | 60 / 60 |
| Redirect rules resolving in one hop | 2 two-hop chains | all rules, one hop |

- These are automated checks, not a WCAG audit.
- Web fonts and the 83 external links are not reachable from this environment: fonts were stubbed and links listed, not fetched.

## Remaining factual conflicts for a decision

1. **Sponsor wording.** Nineteen statements on ten pages say "NWPharmaTech remains (the) pharmaceutical sponsor", as does the public brief `v2026-09-22`. The wording given for the preview was "NWPharmaTech is developing the proposed CHR-P programme. Formal study responsibilities will be documented before the study begins." These were not changed. Which applies to production?
2. **Two programme briefs.** The home hero links the HTML brief (`/resources/programme-brief`, v2026-09-22, with PDF). Study and Newsroom link the downloads PDF, now version 6. The two differ in content. Pick one as the programme brief.
3. **Phase 2B design** (about 328 participants; placebo, 300, 600 and 900 mg; 12 weeks and a week-16 follow-up). This is kept from production. The design source has never been supplied to me, so I cannot verify it.
4. **Transition figures.** The values come from your summary of the PubMed abstract (34259821). PubMed is blocked from this environment. NWPT-031's own paste pairs "~25%" with the Kaplan–Meier label; this release supersedes that.
5. **~US$10m.** It appears on Home, How funding could work, Funding use, Governance and DeSci as a planning target only, as the pack's consistency patch retains it. Confirm that it is still authorised.

## Still absent

- Authorised portraits: 0 of 8. Expected files: `filipp-korentsvit.jpg`, `daud-gutseriev.jpg`, `grace-blest-hopley.jpg`, `scott-woods.jpg`, `john-kane.jpg`, `richard-barker.jpg`, `trevor-jones.jpg`, `gillian-cannon.jpg`.
- The Programme Room (a separate handoff).
- Cloudflare Access on the preview (Filipp's dashboard).
