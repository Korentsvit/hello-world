# NWPT-048 Science expansion: claim-to-source map (preview candidate)

- **Brief:** "NWPharmaTech Science expansion: research, proposed website copy and implementation brief", 27 Sep 2026.
- **Base:** production `db61de444c3785cda56076a54066835e6a6f4a86`.
- **Branch:** `claude/nwpt-science-expansion`.
- **Not included:** privacy and enquiry configuration are unchanged.
- **Status:** preview only. This is not independent scientific validation.

## How sources were handled

- **Already-checked sources.** Claims resting on sources with completed checks in `records/SOURCE-VERIFICATION-P1-P24-2026-09-27.md` reuse the Evidence library's existing wording and keep that check level.
- **New sources.** The 11 new Evidence library entries are **not** marked checked. Each carries the public tag "Source check in progress", and in `content/references.json` it has `verification: "brief"` and a pending `metadata_check` and `finding_check`.
  - **Why:** Claude could not open any of them. The network egress policy blocks medicines.org.uk, PubMed/NCBI, publishers, gov.uk, england.nhs.uk, fda.gov, guidetopharmacology.org and cannabinoidevidence.org, including the web-fetch tool.
  - **What their wording rests on:** (a) the brief's source register, which records the brief author's own inspection, and (b) web-search index snippets. The snippets are recorded below as **leads**, not inspection.
- **Status key used below:**
  - **Checked (existing)**: the existing record's check level applies.
  - **Unresolved – lead consistent**: brief-reported; not inspected; a search-index lead agrees.
  - **Unresolved – brief only**: brief-reported; no independent lead found.
  - **Editorial**: framing, definitions or reading guidance; no factual source needed.

## Claim-to-source map

### /science (overview)
| Claim | Source | Status |
|---|---|---|
| Two routes, starting questions, programme note ("NWPT-SM32300 is investigational…") | — | Editorial |
| CannabinoidEvidence.org is funded by NW PharmaTech Ltd; it describes itself as a working draft, with independent scientific and regulatory verification pending | Brief S14 (the brief author's browser inspection) | **Unresolved – brief only.** No search result found the site. **Web Boss to confirm the current home and About wording before publication** |
| Existing sections, anchors, images and video | Unchanged | — |

### /science/psychiatry
| Claim | Source | Status |
|---|---|---|
| Risk is not a diagnosis; risk, symptoms, functioning and outcomes differ | — | Editorial |
| About one in four CHR-P (pooled 25%) developed psychosis within 3 years; most do not | Salazar de Pablo 2021 | Checked (existing: V1/P7) |
| Psychological therapy first; NICE advises against antipsychotics to prevent psychosis in this group | NICE CG178 1.2.3.1–1.2.3.2 (CG178 only) | Checked (existing: P3 closed) |
| CBD-in-psychiatry table: McGuire 2018, Boggs 2018 | Existing Evidence library cards (verbatim) | Checked at abstract level only |
| Table: Leweke 2012, Bhattacharyya 2018 | Existing cards (verbatim) | Existing status: consistent with abstract, not quoted |
| Table: Bhattacharyya 2024 | Existing card (verbatim) | Checked (existing: matches quoted text) |
| Reading a result: checklist | — | Editorial |

### /science/cannabinoids
| Claim | Source | Status |
|---|---|---|
| Cannabis, cannabinoids, CBD and THC defined; four distinctions diagram | IUPHAR/BPS; FDA Q&A | **Unresolved – brief only** (definitions are general) |
| Endocannabinoids (anandamide, 2-AG); CB1/CB2; enzymes; cell communication | IUPHAR/BPS (brief S1) | **Unresolved – brief only** |
| THC can produce intoxication and alter memory and perception | Englund 2013, Englund 2023 | **Unresolved – lead consistent** |
| CBD does not typically produce the THC-like high; "non-intoxicating" ≠ no effects | FDA Q&A (brief S13) | **Unresolved – brief only** |
| CBD investigated; benefit depends on product, population and outcome | McGuire 2018, Boggs 2018 | Checked at abstract level |
| CBG, CBN, THCV: no treatment claims | — | Editorial |
| Oral route: about 6% reaches the bloodstream; a high-fat meal increases absorption several-fold | Perucca 2020; Taylor 2018 | Checked (existing: quoted; Taylor read directly) |
| CBD can change how other medicines are handled (clobazam) | Epidyolex SmPC | Checked (existing: P12) |

### /science/cbd-thc
| Claim | Source | Status |
|---|---|---|
| THC activates cannabinoid receptors including CB1 | IUPHAR/BPS | **Unresolved – brief only** |
| CBD reduces CB1 signalling in cells (negative allosteric modulation), a laboratory finding | Laprairie 2015 | **Unresolved – lead consistent** (the search lead reports reduced efficacy and potency of 2-AG and THC signalling, and non-competitive NAM) |
| Englund 2013: 48 healthy participants; oral CBD or placebo before intravenous THC; selected paranoia and memory outcomes reduced; mean PANSS-positive difference not significant | Englund 2013 | **Unresolved – lead consistent.** The route and timing detail ("oral CBD … before intravenous THC") comes from the search lead, not the brief |
| Englund 2023: 46 healthy infrequent users; inhaled (vaporised) cannabis, fixed THC with increasing CBD; no protection | Englund 2023 | **Unresolved – lead consistent.** "Vaporised" comes from the search lead |
| Zamarripa 2023: 18 healthy adults; oral extract, same THC with or without high-dose CBD; greater THC exposure and impairment; probe-drug cocktail | Zamarripa 2023 | **Unresolved – lead consistent.** "Oral extract" is from the search lead; the brief says "high oral CBD dose" |
| Chesney 2025: 30 people with schizophrenia or schizoaffective disorder and CUD; oral CBD or placebo before inhaled cannabis; did not reduce acute memory or psychotic effects, appeared to worsen them | Chesney 2025 | **Unresolved – lead consistent** (the lead reports worse delayed recall and a larger PANSS-positive increase with CBD) |
| Daily and high-potency cannabis use associated with higher odds of psychotic disorder; group-level | Di Forti 2019 (existing card wording) | Existing status: consistent with abstract; odds ratios not quoted and not used |
| THC can produce temporary psychotic symptoms in experimental settings | Englund 2013 | **Unresolved – lead consistent** |
| THC-containing medicine example (THC and CBD spray for MS spasticity) | Sativex SmPC | **Unresolved – lead consistent** |
| Epidyolex licensed for specified epilepsies | Epidyolex SmPC | Checked (existing: P12 approved wording) |
| Safety: sleepiness, raised liver enzymes (valproate), clobazam interaction | Epidyolex SmPC | Checked (existing) |
| Safety: diarrhoea, vomiting, fatigue, fever, sleepiness, abnormal liver tests (purified CBD trial) | Devinsky 2017 | Checked (existing: matches quoted abstract) |
| "Not reliably"; interactions depend on dose, timing, route, formulation, population; not an antidote | Synthesis of the above | Editorial (rests on the unresolved rows above) |

### /science/cannabinoid-medicines
| Claim | Source | Status |
|---|---|---|
| Four product categories (licensed, unlicensed, investigational, consumer) | MHRA specials; NHS England CBPMs; FDA Q&A | **Unresolved – brief only** (category-level) |
| Epidyolex UK indications | Epidyolex SmPC | Checked (existing: P12 approved wording) |
| Sativex UK indication (adults; moderate to severe MS spasticity; inadequate response to other anti-spasticity medicines; improvement during an initial trial) | Sativex SmPC 4.1 | **Unresolved – lead consistent** |
| Nabilone UK indication (chemotherapy nausea and vomiting after inadequate response to conventional antiemetics); a distinct synthetic compound, not THC | Nabilone SmPC 4.1 and 5.1 | **Unresolved – lead consistent** for the indication; "not THC" rests on brief S11 (section 5.1) |
| Six steps; four separate dimensions; no single "approved" label | — | Editorial |

### Evidence library bibliographic details for new entries
- **Search-index titles:** the titles of Laprairie 2015, Englund 2013, Englund 2023, Zamarripa 2023 and Chesney 2025, and their first authors, come from search-index titles (publisher, KCL, JHU, Bath and Oxford portals).
- **From the brief:** DOIs and PMIDs are as given in the brief.
- **Not added:** volume, issue and pages are deliberately left out until inspected.

## Exact unresolved statements (to verify before publication or keep as "Source check in progress")

1. "CannabinoidEvidence.org … Its development and hosting are funded by NW PharmaTech Ltd. The resource currently describes itself as a working draft, with independent scientific and regulatory verification pending." Confirm on https://cannabinoidevidence.org/ and /about.
2. Englund 2013: "48 healthy participants"; "Oral CBD or placebo before intravenous THC"; "reduced selected paranoia and memory outcomes"; "average positive-symptom (PANSS) score was not statistically significant".
3. Englund 2023: "46 healthy, infrequent cannabis users"; "Inhaled (vaporised) cannabis: a fixed THC dose with increasing amounts of CBD"; "did not protect against the acute adverse effects measured".
4. Zamarripa 2023: "18 healthy adults"; "the same THC dose with or without a high dose of CBD"; "increased THC exposure and impairment"; "probe drugs".
5. Chesney 2025: "30 people with schizophrenia or schizoaffective disorder and cannabis use disorder"; "Oral CBD or placebo before inhaled (vaporised) cannabis"; "did not reduce … and appeared to worsen them".
6. Laprairie 2015: "CBD reduced CB1 signalling in response to THC and to … 2-AG, consistent with negative allosteric modulation".
7. IUPHAR/BPS: CB1/CB2, anandamide and 2-AG, enzymes; "THC activates cannabinoid receptors, including CB1".
8. FDA Q&A: "CBD does not typically produce the THC-like high"; plant, compound and product distinctions.
9. Sativex SmPC 4.1 indication wording as on the medicines page and in the Evidence card.
10. Nabilone SmPC 4.1 indication wording; 5.1 "a distinct synthetic compound, not another name for THC".
11. MHRA "specials" and NHS England CBPM category explanations (medicines page table and Evidence cards).

## Requests to Web Boss (primary-source pass, same format as P1–P24)
For items 1–11: open the primary record, record the URL, the access date and the passage, with page or section, and note any mismatch. When an item is confirmed, Claude removes its "Source check in progress" tag and records the check level. No wording is changed without a supporting passage.

## Existing issue noticed (not introduced here)
With the phone menu open, axe reports target-size on the header `.brand` link and `#nav-toggle`, because the open panel partly covers them. The finding is identical on production `db61de4`. It is not fixed in this candidate.

## Hosting handoff for Web Boss (preview only)

1. **Confirm production is still `db61de4`** (deployment `45620d96-71a8-41de-a334-9b2d8397afe7`). If anything newer was published, tell Claude before previewing; this branch is built on `db61de4`.
2. **Deploy the candidate to a preview project/branch.** Use the usual method: from a clean checkout of the candidate SHA, `cd nwpharmatech-website/release-032/site`, then `npx wrangler@4 pages deploy . --project-name <preview project> --branch <preview branch> --commit-hash <SHA>`. No environment variables change; enquiries stay unconfigured.
3. **Hosted checks:**
   - **Routes and redirects:** `/science`, `/science/psychiatry`, `/science/cannabinoids`, `/science/cbd-thc` and `/science/cannabinoid-medicines` return 200. `/science.html` and `/science/` redirect to `/science`. `/formulation` still reaches `/science#formulation`.
   - **Science menu:** it opens by click and by keyboard on desktop and in the phone menu, with 8 links. Study synopsis now sits under Programme.
   - **Comparison:** on `/science/cbd-thc` the three tabs switch with the mouse and the arrow keys. With JavaScript off, all three panels show.
   - **Unchanged features:** existing links still work: `/science#investigating` from Programme Room and Work with us briefs, Programme Room share links, the homepage and Science videos, and the team portraits.
   - **Evidence library:** "Cannabinoid science and medicines" shows 11 sources, each marked "Source check in progress".
4. **Primary-source pass for the 11 unresolved items** listed above, especially item 1 (the CannabinoidEvidence.org funding and draft-status wording) before any production publication.
5. **Not tested here:** Safari/iPhone, as before.
6. **Production publication** follows Filipp's review of the completed preview. This candidate does not authorise it.
