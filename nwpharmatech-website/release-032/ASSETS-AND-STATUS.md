# Assets and release status: record

Updated 26 September 2026 (after NWPT-035).

## Release status

| Stage | State |
|---|---|
| Reviewed baseline | NWPT-034 at `f99ee77`; tag `nwpt-034-reviewed` (local only: this session can push its branch but not tags) |
| Live | **NWPT-035**, Grok's portrait release: commit `4b0158f` on `cursor/nwpt-035-portraits-5675` (PR #1), production deployment `c3e85514-2052-4b89-b5e8-9032efd20a4d`, as reported by Grok. It is NWPT-034 plus the seven portraits |
| Merged here | PR #1 fast-forwarded into `claude/nwpharmatech-website-bs459b`. Photographs, name mapping, markup and styles are kept exactly as deployed |
| Review candidate | **NWPT-036** at `3eb6b7bc3cbb889e79866148e870a21cc1086a10` = NWPT-035 plus the editorial patch. Web PR is hosting it on the existing preview. Production stays on NWPT-035 |
| Publication | **NWPT-038**: management publication approval (Filipp Korentsvit, 26 Sep 2026) of the NWPT-037 visual placements, the programme brief (v2026-09-26) and the programme summary (version 8). "Draft for review" removed from the HTML brief, both PDFs and the homepage panel; homepage heading now "The CHR-P programme at a glance". This is management approval only; no scientific reviewer sign-off is implied |
| Close-out on top | **NWPT-036b** = NWPT-036 plus the brief, summary and draft-label close-out (see `WEB-PR-HANDOFF-NWPT-036b.md`) |

**Correction to the NWPT-034 status report.** I wrote that the navigation fix was "also live on production now". That was wrong. The navigation *bug* was live on production (NWPT-032). The *fix* was on preview only until the NWPT-035 production deployment.

## Team portraits

| Person | File (`site/assets/team/`) | Supplied to Grok | Received here | On the live site (NWPT-035) |
|---|---|---|---|---|
| Filipp Korentsvit | `filipp-korentsvit.jpg` | Yes | Yes | Yes: Team |
| Daud Gutseriev | `daud-gutseriev.jpg` | Yes | Yes | Yes: Team |
| Dr Grace Blest-Hopley | `grace-blest-hopley.jpg` | Yes | Yes | Yes: Team and Home |
| Professor Scott Woods | `scott-woods.jpg` | Yes | Yes | Yes: Team and Home |
| Dr John Kane | `john-kane.jpg` | Yes | Yes | Yes: Team and Home |
| Prof. Richard Barker | `richard-barker.jpg` | Yes | Yes | Yes: Team |
| Prof. Trevor Jones | `trevor-jones.jpg` | Yes | Yes | Yes: Team |
| Gillian Cannon | `gillian-cannon.jpg` | **No: outstanding** | No | No; the initials "GC" remain |

**Notes**
- **The files** are 96×96 JPEGs, shown at 80 px on Team and 48 px on Home.
- **Rebuilds keep them:**
  - The staging build has byte-identical copies in `src/assets/img/people/`, marked authorised in `content/people.json`.
  - `tools/add-portraits.mjs` now leaves any card that already has a photograph exactly as deployed, and never upscales.
- **Authorisation:** all seven were supplied and authorised by Filipp from the labelled corporate deck. No source mismatch has been found. See `records/SOURCE-REGISTER.md` (V6).

## Other assets

- **Programme Room:** the original component never arrived. A new implementation (v1) is at `/programme-room` on the feature branch `claude/nwpt-programme-room` (NWPT-039), under review and not on production. See `PROGRAMME-ROOM-NWPT-039.md`.
- **Partnership Studio / "Work with us":** first journey ("Explore a research collaboration", `/work-with-us`) built on `claude/nwpt-work-with-us` (NWPT-041), integrated with the Programme Room header fix and linked from the Programme menu, footer and Contact page; preview candidate only. Online enquiries stay off until configured; see `WORK-WITH-US-NWPT-041.md`.
- **Hero video:** integrated from `nwpt-brain-ecs-hero-21x9.webm`. It stays on both Home and Science, per Filipp.
- **Funding page hero film (NWPT-044):** the refined collective-funding film on `/funding-use` (21:9 desktop, 4:3 phone, posters as fallback) on `claude/nwpt-funding-hero`, preview only. See `FUNDING-HERO-NWPT-044.md`.
- **Production baseline (27 Sep 2026, second update):** `91de637` is live (deployment `c4c07824-1b18-4a18-a3c7-8d1dc72afa44`, rollback `abd6ec97-051e-48d1-b743-b9372b4f9f90`): NWPT-047, the CANTOP-RCT update and the P1–P24 reference corrections. Enquiries remain disabled. See `records/PRODUCTION-BASELINE.md`.
- **Earlier production baseline (27 Sep 2026):** `6e997dd` was live (deployment `0b58051d-59cf-4caf-b6a4-0b9184b4803e`): the `6affaba` contents plus the homepage links (NWPT-046). Enquiries remain disabled. See `records/PRODUCTION-BASELINE.md`.
- **Previous production baseline (26 Sep 2026):** `6affaba` is live (deployment `af37bb7e-62aa-41f8-94da-3ee71694ec51`, rollback `6c0ca97e-6efc-4bd8-9a84-87f14f48119e`). It includes the Programme Room, Work with us (enquiries disabled), privacy Part A and the funding film. See `records/PRODUCTION-BASELINE.md`. Enquiry activation: `records/ENQUIRY-ACTIVATION-HANDOFF.md`, with detail in `records/ENQUIRY-ACTIVATION-CHECKLIST.md`; enquiries stay disabled until real delivery is verified on the preview.
