# PRIMARY-SOURCE PASS — SUMMARY
**Pass directory:** `/workspace/primary-source-pass-2026-09-27/`  
**Inspection window:** 2026-09-27 ~11:24–11:27 CEST (Europe/Vienna)  
**Scope:** Evidence library P1–P24 **except P8** (already filed at `/workspace/PRIMARY-SOURCE-P8-CANTOP.md`).  
**Rules:** No invented dates/PMID/DOI/findings; official channels preferred (PubMed eutils, Crossref, NICE, CT.gov, emc SmPC, Europe PMC, ISRCTN XML API).

## Counts
| Status | Cards |
|---|---|
| **Fully inspected this pass** | **23** (P1–P7, P9–P24) |
| Already done earlier (excluded) | P8 |
| Blocked for primary HTML only (fallback used) | PubMed HTML (reCAPTCHA); MDPI P2 (403); Wiley P21 (403); ISRCTN HTML (cookies) — **content obtained via eutils / PMC / Europe PMC PDF / ISRCTN API** |
| Remaining to inspect | **none** in P1–P24 list after this pass + P8 |

## Artifact index
| Path | Contents |
|---|---|
| `SUMMARY.md` | This file |
| `P01-P07-clinical-need-prediction-NICE.md` | P1–P7 notes |
| `P09-P12-interventions-Epidyolex.md` | P9–P12 notes |
| `P13-P18-CBD-core-trials.md` | P13–P18 notes |
| `P19-P24-CBD-CHR-PK-registry.md` | P19–P24 notes |
| `raw/` | efetch/esummary XML/JSON, Crossref JSON, NICE HTML, CT.gov JSON, ISRCTN XML, Epidyolex SmPC HTML, PMC XML, Europe PMC P21 PDF + text, abstracts |

## Key differences vs current `references.json` / site text (quotes / factual gaps only)
These need **Filipp / Claude wording attention** before changing public copy:

1. **P6** — Site DOI/PMID empty (“not confirmed”). Primary: **PMID 22393215**; **DOI 10.1001/archgenpsychiatry.2011.1472**. Transition % on site match PubMed quote (“18% after 6 months…36% after 3 years”).
2. **P2** — Authors after first author now on PubMed/PMC: Woods SW, Drymonitou G, de Diego H, Fusar-Poli P (site notes said not confirmed).
3. **P3 CG178** — Published **12 February 2014**; Last updated / Last reviewed **04 September 2026** (site notes: last-updated not confirmed).
4. **P4 CG155** — Published **23 January 2013**; Last updated **26 October 2016**; Last reviewed **19 September 2024**. Site “for this purpose” paraphrases **1.2.6** (“with the aim of decreasing the risk of psychosis”). Prefer exact NICE text if tightening.
5. **P12 Epidyolex** — emc **Last updated 18 Jun 2026**; **Date of revision of the text 8 June 2026**. Indications name **LGS, DS (with clobazam), and TSC** (site: “certain severe epilepsies”).
6. **P13** — Site **pages empty**; PubMed **376(21):2011-2020**.
7. **P14** — Site pages **“427-”**; PubMed **427-436**.
8. **P15** — Site PMID/issue empty; PubMed **PMID 19924114**; **issue 3**.
9. **P17** — Site issue empty; PubMed **issue 3**.
10. **P19** — Site PMID empty; PubMed **PMID 30167644**.
11. **P20** — Site vol/issue/pages/DOI empty; PubMed **237(4):1121-1130**; **DOI 10.1007/s00213-019-05442-6**. Cortisol non-difference quote: “was not different between CHR-P and CHR-CBD (p = .70)”.
12. **P22** — Site notes PMID not confirmed; PubMed **PMID 32504461**; **issue 8**. Bioavailability quote: “approximately 6%” / “increases fourfold” with high-fat meal.
13. **P23** — Site issue empty; PubMed **32(11)**; title on PubMed includes explicit “Pharmacokinetics” / “Tolerability” wording (near-match to site).
14. **P24** — CT.gov completion **2025-12-10**, status **COMPLETED**, **hasResults false**. Sponsor registry spelling **“NW PharmaTech Ltd”** vs site **“NWPharmaTech Ltd”**. officialTitle matches site title; briefTitle differs.
15. **P1 finding** — Bibliographic OK; descriptive finding not a contiguous abstract quote — Claude should decide whether to keep paraphrase or cite body/PMC.

## Findings that matched site (no change needed for numbers)
- **P6** transition 18/22/29/36%; **P7** 25% at 3 years + KM 8/14/20/27/35%; **P2** 1.7% / 19.2%; **P9** CBT RR 0.54; **P10** no superior intervention; **P21** adjusted lower CAARMS/distress + well tolerated (Europe PMC PDF); **P8** already separate.

## Access notes (do not treat as “record missing”)
- PubMed **HTML** often reCAPTCHA — used **eutils** throughout.
- **MDPI** P2 HTML 403 — used PubMed + PMC.
- **Wiley** P21 HTML/epdf 403 — used **Europe PMC PDF**.
- **ISRCTN** HTML cookie wall — used **XML API** + CT.gov API.

## Suggested Claude follow-up (from gaps file process)
1. Update `content/references.json` identifiers/pages/issues/dates listed above.
2. Strengthen Evidence library verification sentence only for items with primary records opened (this pass + P8).
3. Optional wording: P4 NICE exact text; P12 named indications; P1 finding quote discipline.
