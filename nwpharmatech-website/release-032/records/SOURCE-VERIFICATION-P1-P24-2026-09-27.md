# Primary-source pass P1–P24: reference corrections (27 Sep 2026)

**Evidence:** Web Boss's primary-source pass of 27 Sep 2026 (`records/primary-source/pass-2026-09-27/`, with his `SUMMARY.md` and per-card notes) and the P8 CANTOP notes. Web Boss read the records through official channels: PubMed E-utilities, Crossref, PMC / Europe PMC, NICE pages, the emc SmPC, and the ClinicalTrials.gov and ISRCTN APIs. Claude did not open the underlying records; this environment cannot reach them.

**Matching:** each card was matched to Web Boss's P-number by title and PMID/DOI before editing:
- 19 cards matched on PMID and/or DOI;
- P6 matched on journal, volume, issue and pages (69(3):220-229), because it had no identifier;
- the NICE guidelines, the SmPC and the registry cards matched on their official URL or registry number.

Corrected mapping: **P13 = Devinsky et al. 2017** (pages 2011-2020); **P14 = Di Forti et al. 2019** (pages 427-436).

**Two kinds of check, kept separate:**
- **Metadata check:** bibliographic details were compared with the primary record. Done for all 24 cards.
- **Finding check:** the card's finding was compared with primary text. This is recorded per card below. It is **not** scientific sign-off. A finding marked "consistent" or "not confirmed" was not compared line by line.

In `content/references.json` each item now carries `metadata_check` and `finding_check` fields. `verification` stays `index`: no scientific reviewer has recorded a review with `tools/evidence_review.py`.

## Per-card status

| # | Card | Metadata | Bibliographic correction applied | Finding check (per Web Boss) |
|---|---|---|---|---|
| P1 | Fusar-Poli et al. 2013 | Primary record checked | None needed | Not confirmed: the card's finding is a paraphrase, not a contiguous passage of the abstract |
| P2 | Salazar de Pablo et al. 2021 (prevalence) | Primary record checked | Authors after the first: Woods SW, Drymonitou G, de Diego H, Fusar-Poli P | Matches quoted primary text (PMC) |
| P3 | NICE CG178 | Primary record checked | Published 12 February 2014; last updated 4 September 2026 | Matches quoted recommendations |
| P4 | NICE CG155 | Primary record checked | Published 23 January 2013; last updated 26 October 2016 (last reviewed 19 September 2024, recorded internally) | Matches recommendations 1.2.5 and 1.2.6 in substance; 'for this purpose' paraphrases 1.2.6 |
| P5 | Addington et al. 2011 | Primary record checked | None needed | Consistent with abstract conclusions (paraphrase) |
| P6 | Fusar-Poli et al. 2012 | Primary record checked | PMID 22393215; DOI 10.1001/archgenpsychiatry.2011.1472 | Matches quoted abstract figures (18%, 22%, 29%, 36%) |
| P7 | Salazar de Pablo et al. 2021 | Primary record checked | None needed | Matches quoted primary text |
| P8 | Bhattacharyya et al. (CANTOP-RCT report) | Primary record checked | Title, authors, dates, DOI (earlier commits) | Supported by report Abstract, Study limitations and future work, PDF page 2 |
| P9 | Stafford et al. 2013 | Primary record checked | None needed | Matches quoted abstract (RR 0.54; not conclusive) |
| P10 | Davies et al. 2018 | Primary record checked | None needed | Matches quoted abstract |
| P11 | Kane et al. 2016 | Primary record checked | None needed | Matches quoted abstract |
| P12 | Epidyolex SmPC | Primary record checked | Date of revision of the text 8 June 2026 (emc page last updated 18 June 2026) | Adverse effects and interactions supported by SmPC text; indications paraphrased ('certain severe epilepsies'; SmPC 4.1 names LGS, Dravet syndrome and TSC) |
| P13 | Devinsky et al. 2017 | Primary record checked | Pages 2011-2020 (P13) | Matches quoted abstract results |
| P14 | Di Forti et al. 2019 | Primary record checked | Pages 427-436 (P14) | Consistent with abstract framing; odds ratios not quoted |
| P15 | Bhattacharyya et al. 2010 | Primary record checked | PMID 19924114; issue 3 | Consistent with abstract (not quoted) |
| P16 | McGuire et al. 2018 | Primary record checked | None needed | Not confirmed: full text needed for the symptom results |
| P17 | Leweke et al. 2012 | Primary record checked | Issue 3 | Consistent with abstract theme (not quoted) |
| P18 | Boggs et al. 2018 | Primary record checked | None needed | Not confirmed: exact null result to be checked in full text |
| P19 | Bhattacharyya et al. 2018 | Primary record checked | PMID 30167644 | Consistent with abstract (not quoted) |
| P20 | Appiah-Kusi et al. 2020 | Primary record checked | Volume 237, issue 4, pages 1121-1130; DOI 10.1007/s00213-019-05442-6 | Matches quoted abstract results |
| P21 | Bhattacharyya et al. 2024 | Primary record checked | None needed | Matches quoted article text (Europe PMC PDF) |
| P22 | Perucca and Bialer 2020 | Primary record checked | PMID 32504461; issue 8 | Matches quoted text (about 6%; fourfold with high-fat meal) |
| P23 | Taylor et al. 2018 | Primary record checked | Issue 11 | Partly: food effect supported; exact fold changes not confirmed |
| P24 | Phase 1 registry records | Primary record checked | None needed | Completion 10 December 2025 and no posted results confirmed (ClinicalTrials.gov API) |

**Where the corrections were applied:**
- the Evidence library source lines;
- the Programme Room and Work with us sources: NICE dates, and a PubMed link for Perucca 2020;
- `content/references.json`;
- `downloads/nwpharmatech-references.bib` and `.ris`.

The Evidence library's 18 "et al.." and one "Bialer M.." (doubled full stop) are also fixed.

## Substantive wording: proposed for Filipp's review (NOT applied)

1. **Evidence library verification sentence.**
   - **Now:** "Last checked: 23 September 2026. Bibliographic details and quoted findings were checked against search-engine records of publisher, PubMed, registry and official pages."
   - **Proposed:** "Last checked: 27 September 2026. Bibliographic details of every entry were checked against primary records (publisher and PubMed records, NICE, the medicines compendium and trial registries). Findings are summaries of those sources; they are not a clinical recommendation."
   - **Why not applied:** it changes a public verification claim. The sentence should not claim that every finding was checked, because P1, P16, P18 and P23 are not fully confirmed.
2. **P4 NICE CG155 finding.**
   - **Now:** "Consider individual CBT with or without family intervention. Do not offer antipsychotic medication for this purpose."
   - **Proposed, closer to NICE 1.2.6:** "Consider individual CBT with or without family intervention. Do not offer antipsychotic medication with the aim of decreasing the risk of psychosis."
3. **P12 Epidyolex finding.**
   - **Now:** "Licensed CBD medicine for certain severe epilepsies. …"
   - **Proposed, per SmPC 4.1:** "Licensed CBD medicine for seizures associated with Lennox-Gastaut syndrome or Dravet syndrome (with clobazam) and tuberous sclerosis complex, from 2 years of age. …" The rest of the sentence is unchanged.
4. **P1 Fusar-Poli 2013 finding** ("Describes how the high-risk state is defined and assessed, including attenuated psychotic symptoms and brief limited intermittent psychotic symptoms."). This is a paraphrase, not a contiguous passage of the abstract. Proposed: keep it as a paraphrase; it already reads as a description. The existing internal note stays: "genetic-risk-with-deterioration wording not confirmed".
5. **P24 sponsor spelling in the citation exports.** The registries give "NW PharmaTech Ltd" (ClinicalTrials.gov) and "NW PharmaTech" (ISRCTN); the exports say "NWPharmaTech Ltd (sponsor)". Filipp to decide whether citations should use the registry spelling. The public card is unchanged.
6. **P23 Taylor 2018 title.** Web Boss reports that the PubMed title includes "Pharmacokinetics" and "Tolerability" wording that differs slightly from ours. He did not supply the exact PubMed title, so no change was made; exact wording is needed from him.

## Still open (evidence needed)
- **P16 McGuire 2018 and P18 Boggs 2018:** findings need the full text.
- **P23:** the exact food-effect fold changes, and the exact PubMed title.
- **P1:** the genetic-risk wording.
- **P3:** CG178 recommendation numbers are not recorded.
