# Clinical design check: Phase 2B (CHR-P)

24 September 2026. For the Grok team, before any module that mentions Phase 2B is published.

**The live site publishes a proposed CHR-P design that this package could not read.** Its address is blocked by the build environment's network policy (checked 24 September 2026 by direct request and by fetch; both refused by the egress proxy). The CHR-P design document itself, including the proposed 300/600/900 mg range, was never supplied. So this check compares the modules against the company records that were supplied, and lists what must be compared with the live design by someone who can see it.

**Rule for integration:** no module replaces the live design section. `study-hub` (Study progress) states population, aims and status only. Put it beside the live design, or use its milestone and registry sections without its synopsis. Each manifest lists the module's Phase 2B sentences under `clinical_design.phase2b_statements`. Until they have been compared with the live design, `publication_blockers` holds a "clinical design" item.

## What the modules say about Phase 2B, and the basis

| # | Topic | Module wording | Basis | Compare with live design |
|---|---|---|---|---|
| 1 | Population | "people at clinical high risk of psychosis" | Management website brief, Sep 2026 | Age range and entry criteria: the module states none |
| 2 | Aims | "dose response, symptoms, safety and tolerability" | Management website brief, Sep 2026 | Wording and order of aims; primary vs secondary if the live design distinguishes them |
| 3 | Status | "Planned. Not recruiting." | Management brief | Must match |
| 4 | Protocol | "Finalisation of the Phase 2B protocol, reported as in progress in February 2026. No date has been announced." | Programme update letter, 23 Feb 2026 | If the live design shows a later protocol version or date, the module is out of date: raise it; do not publish both |
| 5 | Oversight | "Oversight arrangements for the Phase 2B study have not yet been published." | No record describes them | If the live design names oversight (DMC, sponsor), this sentence is wrong on the live site: remove it there |
| 6 | Doses | **Not stated.** | The proposed 300/600/900 mg range comes from a CHR-P design source that was not supplied (`facts.json` `phase2b.doses`, withheld) | The live design's dose range stays in the live design section. The module must not be read as a replacement that drops it |
| 7 | Comparator, duration, endpoints, sample size, sites | **Not stated.** | No CHR-P source | As 6 |
| 8 | Regions | Not stated | "UK and Europe" appears only in a private letter (not for publication) | — |

## Details deliberately not borrowed

These records are about other studies. Nothing from them appears as a description of the CHR-P Phase 2B:

| Record | What it describes | Where it could be confused |
|---|---|---|
| Preliminary SAP v5.1 cover email, Nov 2025 (`sap-2025-11`) | A relapse-prevention design **in schizophrenia** (placebo/600/900 mg) | Its 600/900 mg arms resemble the Phase 1 doses and part of the proposed CHR-P range. Not used anywhere |
| 'Web3' draft deck, Oct 2025 | "Randomized event-driven relapse-prevention design, led by Prof. John Kane" (schizophrenia) | Not used for design; the deck supports leadership records only |
| Series A teaser, Aug 2026 | Lead study: an **acute schizophrenia** Phase 2B (US) | Only product facts (capsule, 300 mg strength, formulation, manufacturer) come from it. No design, region or funding statement does |
| Phase 1 study records (`phase-1` module) | Single 600 mg and 900 mg doses **in healthy adults** | The Phase 1 module labels them Phase 1 single doses; the mapping says they are not the Phase 2B range |
| Evidence library: McGuire 2018, Leweke 2012, Boggs 2018 | CBD in **established schizophrenia** (e.g. 1,000 mg/day for 6 weeks) | Shown only as labelled evidence, each card "not NWPT-SM32300" |
| Evidence library: CANTOP-RCT | Another sponsor's **planned CHR-P trial** (CBD 600 mg/day vs placebo, 6 months, about 300 people), which never started | Closest to a CHR-P design. The card now says "not NWPT-SM32300" and "not the NWPharmaTech Phase 2B study" |

## Needed to close this check
1. Someone who can see the live site compares rows 1 to 7 with the published proposed design and records the result (the manifests' "clinical design" blocker clears only by removing it from the check list in `buildlib/export.py` after that comparison, or by supplying the design source).
2. Better: supply the CHR-P design document. The 300/600/900 mg range and any rationale can then be stated to the extent the document supports, and the study module can show the full design from the same source as the live site.
