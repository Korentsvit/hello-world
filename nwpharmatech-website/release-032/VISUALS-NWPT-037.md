# NWPT-037: visual tranche 05 ("Ten Windows Into the Programme")

This is a separate commit on top of NWPT-036b, so the editorial patch and the visual work can each be reviewed on their own. The seven portraits and the homepage and Science video are unchanged.

## Receipt (26 September 2026)

`NWPT-ten-windows-visual-tranche-05.zip` was received, along with the manifest `ten-windows-assets-manifest.json` (identical to the copy inside the ZIP) and the hand-off note. All 40 checksums in `SHA256SUMS.txt` verify.

**Masters (10):**
- `28-neuroimmune-dialogue.jpg`
- `29-biological-threshold.jpg`
- `30-formulation-bench-daylight.jpg`
- `31-life-around-science.jpg`
- `32-translational-leadership.jpg`
- `33-open-evidence-horizon.jpg`
- `34-dose-architecture.jpg`
- `35-micellar-interior.jpg`
- `36-stewardship-in-practice.jpg`
- `37-northwest-signal.jpg`

Each master comes with WebP derivatives at 768, 1200 and 1920 px (30 in all).

## Asset-to-page list

| Asset | Page and position | Why here | Caption on the site | Delivery |
|---|---|---|---|---|
| 33 Open Evidence Horizon | `/evidence`, page hero below the lead | Introduces the library as traceable, public reporting | "Conceptual visualization of evidence traceability and public programme reporting — not a claim of certainty or approval." | 768/1200/1920 WebP; 4:3 phone crop (480/800) around 75% 50%; loads early (hero); a 21:9 band on desktop |
| 34 Dose Architecture | `/programme`, "Proposed study design", above the expandable design | Four neutral channels echo the proposed four-arm design without adding numbers or favouring a dose | "Conceptual illustration of a proposed four-arm dose-ranging design — no result or preferred dose is represented." | WebP set; 4:3 phone crop around 72% 58%; lazy |
| 30 Formulation Bench in Daylight | `/phase-1`, top of the "At a glance" column | Gives the formulation description a human, practical context | "Conceptual editorial image of exploratory formulation work — not the Phase 1 study, its manufacture or its product." | WebP set (already 4:3); lazy |
| 31 The Life Around the Science | `/families`, page hero below the urgent-help link | The human context for young people and families | "Fictional editorial scene illustrating the human context around research. The person shown is not a patient or study participant." | WebP set; 4:3 phone crop around 74% 50%; loads early (hero); a 21:9 band on desktop |

Every image has explicit width and height and the manifest's alt text. Supplied files are used unchanged; only the phone crops are new, cut from the masters. Total added: about 1.2 MB across 16 files (`assets/visuals-037/`).

## Not placed, and why

| Asset | Reason |
|---|---|
| 28 Neuroimmune Dialogue | Duplicates the neural motif the homepage and Science video already carry. A second neural hero would repeat imagery |
| 29 Biological Threshold | A barrier with carriers above it naturally reads as brain penetration. The site explicitly says brain delivery has not been measured, so there is no placement that does not invite that reading |
| 32 Translational Leadership | Fictional senior scientists near the Team or collaboration content could be read as company personnel, whatever the caption says |
| 35 Micellar Interior | The micelle idea is already covered (the Science cutaway and the micelle field on Updates) |
| 36 Stewardship in Practice | Six fictional people around a governance model could suggest an appointed board or committee, which does not exist |
| 37 Northwest Signal | A Pacific Northwest landscape could suggest a US location for a company registered in England and Wales. Better kept for brand or film use than for site pages |

These six are kept in the tranche and can be revisited if the surrounding copy changes.

## Checks

- **`check-pages.mjs`: 143 of 143.** It covered Evidence, Families, Programme, Phase 1, Home and Team at 390 and 1280 px: images load, no console errors, no horizontal scroll, axe WCAG 2.2 AA, one h1, 56 internal links.
- **Before/after screenshots** of the four pages, at 1280 and 390 px, against NWPT-036b.
