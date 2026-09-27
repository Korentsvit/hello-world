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
| P3 | NICE CG178 | Primary record checked | Published 12 February 2014; last updated 4 September 2026 | Partly confirmed (see P3 above) |
| P4 | NICE CG155 | Primary record checked | Published 23 January 2013; last updated 26 October 2016 (last reviewed 19 September 2024, recorded internally) | Matches quoted recommendations 1.2.5 and 1.2.6; card reworded to 1.2.6 wording (Filipp decision 2) |
| P5 | Addington et al. 2011 | Primary record checked | None needed | Consistent with abstract conclusions (paraphrase) |
| P6 | Fusar-Poli et al. 2012 | Primary record checked | PMID 22393215; DOI 10.1001/archgenpsychiatry.2011.1472 | Matches quoted abstract figures (18%, 22%, 29%, 36%) |
| P7 | Salazar de Pablo et al. 2021 | Primary record checked | None needed | Matches quoted primary text |
| P8 | Bhattacharyya et al. (CANTOP-RCT report) | Primary record checked | Title, authors, dates, DOI (earlier commits) | Supported by report Abstract, Study limitations and future work, PDF page 2 |
| P9 | Stafford et al. 2013 | Primary record checked | None needed | Matches quoted abstract (RR 0.54; not conclusive) |
| P10 | Davies et al. 2018 | Primary record checked | None needed | Matches quoted abstract |
| P11 | Kane et al. 2016 | Primary record checked | None needed | Matches quoted abstract |
| P12 | Epidyolex SmPC | Primary record checked | Date of revision of the text 8 June 2026 (emc page last updated 18 June 2026) | Indications match quoted SmPC 4.1 (card reworded, Filipp decision 3); adverse effects and interactions supported |
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
| P24 | Phase 1 registry records | Primary record checked | None needed | Completion 10 December 2025 and no posted results confirmed (ClinicalTrials.gov API); sponsor transcribed as NW PharmaTech Ltd (decision 5) |

**Where the corrections were applied:**
- the Evidence library source lines;
- the Programme Room and Work with us sources: NICE dates, and a PubMed link for Perucca 2020;
- `content/references.json`;
- `downloads/nwpharmatech-references.bib` and `.ris`.

The Evidence library's 18 "et al.." and one "Bialer M.." (doubled full stop) are also fixed.

## Filipp's decisions (27 Sep 2026), applied in the follow-up commit

1. **Evidence library verification sentence: applied.**
   - **Now reads (final clarification, Filipp, 27 Sep 2026):** "Bibliographic checks against primary publication, guideline, product-information and registry records were carried out on 27 September 2026. Some reference details and checks of the findings summarised below remain outstanding. These checks do not constitute independent scientific validation." "Some reference details … remain outstanding" covers the unresolved P23 title.
   - **Replaces:** "Last checked: 23 September 2026. Bibliographic details and quoted findings were checked against search-engine records…".
   - **Records:** per-card scope and attribution stay in this record and in `references.json` (`metadata_check`, `finding_check`).
2. **P4 NICE CG155: applied.** The finding now reads: "For children and young people considered at increased risk of psychosis, consider individual CBT with or without family intervention (recommendation 1.2.5). Do not offer antipsychotic medication with the aim of decreasing the risk of psychosis (recommendation 1.2.6)." Both recommendation texts are as quoted by Web Boss from the NICE page.
3. **P12 Epidyolex: applied.** The finding now reads: "The UK product information lists Epidyolex as an add-on treatment for seizures associated with Lennox–Gastaut or Dravet syndrome, together with clobazam, and for seizures associated with tuberous sclerosis complex, in patients aged 2 years and older. Its side effects include sleepiness and raised liver enzymes (especially with valproate); interacts with clobazam."
   - The card's existing Product ("Epidyolex (a different cannabidiol medicine)") and Limitations ("…not evidence about psychosis") are unchanged.
   - Nothing implies this authorisation applies to NWPT-SM32300.
4. **P1: no change.** The paraphrase is kept, with no quotation marks. Its finding check stays "not confirmed", and the genetic-risk check stays open.
5. **P24: applied.** The registry-derived citation fields use "NW PharmaTech Ltd (sponsor)": the Evidence library source line, `references.json` authors, BibTeX and RIS. This is transcription only. Company branding and sponsor roles elsewhere are unchanged.
6. **P23: no change.** The exact published title has been requested from Web Boss (below). The food-effect figures stay unverified.

**P3 NICE CG178: checked against the passages Web Boss quoted.** The recommendation numbers are those Filipp cited (1.2.3.1 psychological interventions; 1.2.3.2 antipsychotics for prevention). Web Boss's note does not state numbers, and Claude cannot open NICE from here (proxy blocked).
- **Card sentence 1:** "Offer individual CBT, with or without family intervention." This **matches** the quoted "offer individual cognitive behavioural therapy (CBT) with or without family intervention" (cited as 1.2.3.1).
- **Card sentence 2:** "Do not offer antipsychotic medication to people at increased risk or to reduce the risk of or prevent psychosis." The part **"to people at increased risk" matches** the quoted "Do not offer antipsychotic medication: to people considered to be at increased risk of developing psychosis …" (cited as 1.2.3.2). The part **"or to reduce the risk of or prevent psychosis" is not supported** by the quoted text, which ends with an ellipsis.
- **Status:** partly confirmed. No wording change. The full text of 1.2.3.2 is needed from Web Boss.

## Requests to Web Boss (next pass)
- **P23 Taylor et al. 2018:** the exact published title as on PubMed or the journal (the one held differs in its "pharmacokinetics"/"tolerability" wording), and the food-effect fold changes with their page or table.
- **P3 CG178:** the full text of recommendation 1.2.3.2 (the part after "to people considered to be at increased risk of developing psychosis"), and confirmation of the numbers 1.2.3.1 and 1.2.3.2 on the NICE page.
- **P16 McGuire 2018 and P18 Boggs 2018:** the symptom and cognition results from the full papers, with pages.
- **P1 Fusar-Poli 2013:** whether the paper states genetic risk with deterioration as a criterion (passage and page).

## Still open (evidence needed)
- **P16 McGuire 2018 and P18 Boggs 2018:** findings need the full text.
- **P23:** the exact food-effect fold changes, and the exact PubMed title.
- **P1:** the genetic-risk wording.
- **P3:** CG178 recommendation numbers are not recorded.

## Follow-up on P1, P3, P16, P18 and P23 (27 Sep 2026, against production `91de637`)

**Evidence used:** Web Boss's pass notes (`records/primary-source/pass-2026-09-27/`). No further notes have been received. Each live claim on the Evidence library card, and any Programme Room or Work with us statement that cites the card, was compared with the passage he quoted.

| # | Live claim | Evidence available | Result |
|---|---|---|---|
| P1 Fusar-Poli 2013 | "Describes how the high-risk state is defined and assessed, including attenuated psychotic symptoms and brief limited intermittent psychotic symptoms." | Record and abstract confirmed; no passage quoted on APS/BLIPS | **Open.** Needs a passage (abstract or body, with page) naming APS and BLIPS in the definition or assessment. The "genetic risk with deterioration" check is **closed as not applicable**, because the live card does not make that claim |
| P3 NICE CG178 (card) | "Offer individual CBT, with or without family intervention. Do not offer antipsychotic medication to people at increased risk or to reduce the risk of or prevent psychosis." | **Direct inspection (Web Boss):** "offer individual cognitive behavioural therapy (CBT) with or without family intervention"; "Do not offer antipsychotic medication: to people considered to be at increased risk of developing psychosis …" (truncated). **Corroboration (Codex, recorded separately):** NICE's indexed official CG178 text includes the prevention clause under **recommendation 1.2.3.2**; Codex's direct PDF fetch was blocked | **Wording kept; not closed.** Sentence 1 and the first limb are directly inspected. The prevention clause is corroborated by NICE's indexed official text, but not yet by direct inspection. Awaiting Web Boss's complete saved 1.2.3.2 passage |
| P3 NICE CG178 (Programme Room, Clinical need) | "In England, psychological therapy is the recommended first step. NICE advises against antipsychotics to prevent psychosis in this group." | **Supporting source: CG178 itself** (the adult guideline). Psychological therapy: directly inspected (CG178 quote above). Against antipsychotics to prevent psychosis: CG178 1.2.3.2, corroborated by Codex, with the full passage pending from Web Boss | **Not marked verified.** The earlier reasoning that combined CG155 1.2.6 (children and young people) with the partial CG178 excerpt is **withdrawn**. Closes when Web Boss supplies the complete 1.2.3.2 passage |
| P16 McGuire 2018 | "Positive psychotic symptoms fell more with CBD than placebo (small difference), and clinicians more often rated patients as improved. Generally well tolerated." | Design confirmed (1,000 mg/day add-on, PANSS); no result quoted | **Open.** Needs the abstract results or full paper with page: the PANSS positive difference, the clinician global impression, and tolerability |
| P18 Boggs 2018 | "No improvement in cognition or symptoms compared with placebo." | Web Boss: consistent with the PubMed record's aim and conclusion framing; not quoted | **Open.** Needs the quoted null results for cognition (MCCB) and symptoms (PANSS), with page |
| P23 Taylor 2018 (card) | "Described the safety and tolerability of single and repeated doses of purified CBD in healthy adults, and found that a high-fat meal increased CBD exposure." | Quoted: "CBD was generally well tolerated"; design SAD/MD/food-effect confirmed; food effect reported by Web Boss, no quote naming a high-fat meal | **Partly supported.** Tolerability and the dosing design are supported. "high-fat meal increased … exposure" needs a quoted passage. The exact published title is still outstanding |
| P23 Taylor 2018 (Programme Room, Formulation) | "…only about 6% of a dose is estimated to reach the bloodstream, and food changes absorption markedly (research on other CBD products)." | Perucca 2020 quoted: "approximately 6% … increases fourfold when … co-administered with a high-fat meal" | **Supported** by the co-cited Perucca 2020 passage |

**Wording:** no website change. The P3 trim (`d7f5dd5`, branch `claude/nwpt-p3-cg178-wording`) is **not to be published** (Filipp, 27 Sep 2026). The prevention clause is corroborated by NICE's indexed official text; the gap was only a truncated excerpt. Production stays at `91de637`. The other open cards need evidence, not rewording, and no evidence contradicts them.

**Requests to Web Boss (unchanged, now itemised):**
- **P1:** the passage on APS and BLIPS.
- **P3:** the complete saved passage of CG178 recommendation 1.2.3.2 ("Do not offer antipsychotic medication: …"), from his saved NICE HTML (`raw/`), confirming the number.
- **P16:** the abstract results or results section.
- **P18:** the abstract results.
- **P23:** the exact title and the food-effect passage, with its page.
