# NWPT-048 Science expansion: claim-to-source map (preview candidate)

- **Brief:** "NWPharmaTech Science expansion: research, proposed website copy and implementation brief", 27 Sep 2026.
- **Base:** production `db61de444c3785cda56076a54066835e6a6f4a86`.
- **Branch:** `claude/nwpt-science-expansion`.
- **Not included:** privacy and enquiry configuration are unchanged.
- **Status:** preview only. This is not independent scientific validation.
- **Follow-up (primary-source pass):** Web Boss's evidence pack `NWPT-SCIENCE-EVIDENCE-3d029959-2026-09-27` (inspection date 27 Sep 2026) reconciled on top of candidate `3d029959d5d08982fff35fd64de3c5840b2de01d`. See **Primary-source reconciliation** below; the tables keep the original status and add the outcome.

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
| CannabinoidEvidence.org is funded by NW PharmaTech Ltd; it describes itself as a working draft, with independent scientific and regulatory review in progress | cannabinoidevidence.org About page and review badge (Web Boss) | **Checked (full: live JS string literals).** Wording aligned from “verification pending” to the badge's “review in progress” |
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
| Cannabis, cannabinoids, CBD and THC defined; four distinctions diagram | Now Englund 2023 (preparations varying in CBD:THC content) and NHS England CBPMs (medicinal product categories); IUPHAR and FDA citations removed | **Checked** (Englund 2023 full paper; NHS category level). Definitions otherwise editorial |
| Endocannabinoids (anandamide, 2-AG); CB1/CB2; enzymes that make and break down the signals (restored in the second follow-up); separately, in cell experiments THC and 2-AG activated CB1 signalling and CBD reduced it | Health Canada, Information for Health Care Professionals: Cannabis (marihuana, marijuana) and the cannabinoids (Spring 2018), section 1.0 (basic biology only); Laprairie 2015 for the cell findings | **Health Canada: checked** (Web Boss's captured passage, reviewed by Claude). Laprairie: checked at abstract level |
| ~~THC can produce intoxication and alter memory and perception~~ → In experiments in people, THC impaired memory and produced temporary psychotic symptoms such as paranoia | Englund 2013, Englund 2023 | **Checked** (2013 abstract; 2023 full paper). “Intoxication” and “perception” removed: not in the passages |
| CBD does not produce the THC-like high. / Non-intoxicating does not mean inactive or risk-free. / Sleepiness listed for one CBD medicine | Health Canada, About cannabis (THC and CBD sections) / Health Canada, Cannabidiol (CBD) (“it does have an effect on the brain”) with the Epidyolex example for “not risk-free” / Epidyolex SmPC | **Checked** (Web Boss's captured passages, reviewed by Claude; Epidyolex existing P12). The interim NHS England “not psychoactive” sentence was removed |
| CBD investigated; benefit depends on product, population and outcome | McGuire 2018, Boggs 2018 | Checked at abstract level |
| CBG, CBN, THCV: no treatment claims | — | Editorial |
| Oral route: about 6% reaches the bloodstream; a high-fat meal increases absorption several-fold | Perucca 2020; Taylor 2018 | Checked (existing: quoted; Taylor read directly) |
| CBD can change how other medicines are handled (clobazam) | Epidyolex SmPC | Checked (existing: P12) |

### /science/cbd-thc
| Claim | Source | Status |
|---|---|---|
| THC activates the cannabinoid receptor CB1 (cell experiments) | Laprairie 2015 (IUPHAR removed) | **Checked at abstract level** |
| CBD reduces CB1 signalling in cells (negative allosteric modulation), a laboratory finding | Laprairie 2015 | **Checked at abstract level** |
| Englund 2013: 48 healthy participants; oral CBD or placebo before intravenous THC; selected paranoia and memory outcomes reduced; mean PANSS-positive difference not significant | Englund 2013 | **Checked at abstract level** (subscription full text not inspected). Design corrected: “double-blind” not in the abstract |
| Englund 2023: 46 healthy infrequent users; inhaled (vaporised) cannabis, fixed THC with increasing CBD; no protection | Englund 2023 | **Checked (full paper)** |
| Zamarripa 2023: 18 healthy adults; oral extract, same THC with or without high-dose CBD; greater THC exposure and impairment; probe-drug cocktail | Zamarripa 2023 | **Checked (full paper)**; the oral extract was given in brownies |
| Chesney 2025: 30 people with schizophrenia or schizoaffective disorder and CUD; oral CBD or placebo before inhaled cannabis; did not reduce acute memory or psychotic effects, appeared to worsen them | Chesney 2025 | **Checked (full paper)** |
| Daily and high-potency cannabis use associated with higher odds of psychotic disorder; group-level | Di Forti 2019 (existing card wording) | Existing status: consistent with abstract; odds ratios not quoted and not used |
| THC can produce temporary psychotic symptoms in experimental settings | Englund 2013 | **Checked at abstract level** |
| THC-containing medicine example (THC and CBD spray for MS spasticity) | Sativex SmPC | **Checked (full SmPC)** |
| Epidyolex licensed for specified epilepsies | Epidyolex SmPC | Checked (existing: P12 approved wording) |
| Safety: sleepiness, raised liver enzymes (valproate), clobazam interaction | Epidyolex SmPC | Checked (existing) |
| Safety: diarrhoea, vomiting, fatigue, fever, sleepiness, abnormal liver tests (purified CBD trial) | Devinsky 2017 | Checked (existing: matches quoted abstract) |
| "Not reliably"; interactions depend on dose, timing, route, formulation, population; not an antidote | Synthesis of the above | Editorial (rests on the unresolved rows above) |

### /science/cannabinoid-medicines
| Claim | Source | Status |
|---|---|---|
| Four product categories (licensed, unlicensed, investigational, consumer) | MHRA specials; NHS England CBPMs (FDA removed) | **Checked at category level** for licensed/unlicensed; investigational and consumer rows are editorial |
| Epidyolex UK indications | Epidyolex SmPC | Checked (existing: P12 approved wording) |
| Sativex UK indication (adults; moderate to severe MS spasticity; inadequate response to other anti-spasticity medicines; improvement during an initial trial) | Sativex SmPC 4.1 | **Checked (full SmPC)** |
| Nabilone UK indication; “a synthetic cannabinoid”; ~~a distinct compound, not another name for THC~~ → NHS England groups nabilone with synthetic cannabinoids structurally related to THC, rather than identical to it | Nabilone SmPC 4.1 and 5.1; NHS England CBPMs | **Checked** (full SmPC for indication and “synthetic cannabinoid”; the THC distinction rests on NHS England's grouping, from Web Boss's summary, and is not presented as SmPC wording) |
| Six steps; four separate dimensions; no single "approved" label | — | Editorial |

### Evidence library bibliographic details for new entries
- **Search-index titles:** the titles of Laprairie 2015, Englund 2013, Englund 2023, Zamarripa 2023 and Chesney 2025, and their first authors, come from search-index titles (publisher, KCL, JHU, Bath and Oxford portals).
- **From the brief:** DOIs and PMIDs are as given in the brief.
- **Not added:** volume, issue and pages are deliberately left out until inspected.
- **Primary-source pass:** the Europe PMC records in Web Boss's pack match our titles for Englund 2013, Englund 2023 and Laprairie 2015. DOIs were confirmed for all five papers. The records give pages (19–27; 869–876; 4790–4805) but not volume or issue, so bibliographic volume, issue and pages remain omitted for consistency.

## Exact unresolved statements at candidate `3d02995` (outcomes in the reconciliation below)

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

## Primary-source reconciliation (Web Boss evidence pack, 27 Sep 2026)

Claude could not open any source directly (egress policy unchanged). Every outcome below rests on the passages in Web Boss's notes and extracts. No wording was changed without a supporting passage; where a passage was missing, the detail was removed or its citation replaced.

| # | Source | Access level | Outcome | Change made |
|---|---|---|---|---|
| 1 | CannabinoidEvidence.org About page and review badge (live JS bundle `index-D1VAdfWo.js`) | Full (string literals) | **Closed.** (a) our pages display the disclosure and link to the home and About pages; (b) the site states “The development and hosting of CannabinoidEvidence.org is funded by NW PharmaTech Ltd …” and “Working draft — Independent scientific and regulatory review in progress.” | “verification pending” → “review in progress” (exact badge wording) on the overview, cannabinoids and medicines pages |
| 2 | Englund 2013 (PubMed 23042808; Europe PMC abstract) | **Abstract only** (subscription full text) | **Checked at abstract level.** 22 + 26 = 48; oral CBD 600 mg 210 min before IV THC 1.5 mg; SSPS paranoia and HVLT-R memory favoured CBD (p<0.05); PANSS-positive difference not significant | Design “double-blind” removed (not in the abstract). Tag removed |
| 3 | Englund 2023 (PMC10156730) | Full paper | **Checked** | None. Tag removed |
| 4 | Zamarripa 2023 (PMC9926328) | Full paper | **Checked** | None. Tag removed |
| 5 | Chesney 2025 (PMC12518716) | Full paper | **Checked.** PubMed ID 40702165 is from the brief, not confirmed in the pack | None. Tag removed |
| 6 | Laprairie 2015 (PMID 26218440; PMC4621983) | **Abstract only** (PDF not fetched) | **Checked at abstract level** | Card: “the body’s own cannabinoid 2-AG” → “2-AG (2-arachidonylglycerol)” (not stated in the abstract). Tag removed |
| 7 | IUPHAR/BPS Guide to Pharmacology, family 13 | **Inaccessible** (login wall) | **Unresolved.** Tag kept | All page citations removed. Receptor statements now rest on Laprairie 2015 (abstract, laboratory). The endocannabinoid-system description (anandamide, CB2, enzymes) was removed from the cannabinoids page, and the glossary term “Endocannabinoid system” (`#g-ecs`) was replaced by “CB1 receptor” (`#g-cb1`); no page linked to `#g-ecs` |
| 8 | FDA cannabis and CBD Q&A | **Partial** (fetch incomplete); “THC-like high” not found | **Unresolved.** Tag kept | All page citations removed. Plant/compound/product distinction → Englund 2023 + NHS England CBPMs; the “high” statement → NHS England (“not psychoactive”), with “not no effects” → Epidyolex SmPC (sleepiness) |
| 9 | Sativex SmPC 4.1 (emc 602) | Full SmPC | **Checked** | None. Tag removed |
| 10 | Nabilone SmPC 4.1 / 5.1 (emc 12767) | Full SmPC | **Checked:** indication and “a synthetic cannabinoid”. The SmPC does not say “not THC” | Medicines page: “a distinct compound, not another name for THC” → “NHS England groups nabilone with synthetic cannabinoids that are structurally related to THC, rather than identical to it” (cites SmPC + NHS England). Card: “(a distinct compound; not THC and not NWPT-SM32300)” → “(a different product; not NWPT-SM32300)”. Tag removed |
| 11 | MHRA specials landing page; NHS England CBPM long-read | Full (landing page + long-read) | **Checked at category level.** Guidance Note 14 PDF not quoted. NHS passages are Web Boss's summaries, not full quotations | None. Tags removed |

**Consequential wording change (THC effects).** Once Englund 2013 and 2023 were checked, their passages support memory impairment and temporary psychotic symptoms (paranoia), not “intoxication” or altered “perception”. The THC sentences on the cannabinoids and CBD-and-THC pages, the comparison panel and the glossary term were narrowed to the supported wording.

**Where the check levels are kept.** The public cards carry no pending tag once checked, as for P1–P24. Access levels and evidence limits (abstract-only, category-level, summarised passages) are kept in `content/references.json` (`metadata_check`, `finding_check`) and in this record. Evidence-strength labels for the new entries remain unassigned (`label: "pending"`); this pass did not grade evidence strength.

**Remaining pending entries (superseded by the second follow-up below).** The IUPHAR/BPS and FDA entries stayed in the Evidence library marked “Source check in progress”, with `verification: "brief"`, in `references.json`, BibTeX and RIS. No statement on any page cites them (enforced by `tools/test-science.mjs`).

## Hosted interaction checks (Web Boss, preview `3d02995`, 27 Sep 2026)
Web Boss checked the immutable preview host `5e6b6a16.nwpt-837794c-preview.pages.dev` in Chromium:
- **Passed:** the sticky header, the Science dropdown (8 links), the phone Menu button (visible, keyboard focus ring), opening with Enter, both Close controls, the four distinctions stacking on phone, and the comparison tabs (they wrap to two rows on phone).
- **Phone-menu obstruction:** the suspected obstruction (axe target-size on `.brand` and `#nav-toggle` with the menu open, identical on production) was **closed as not reproduced** in the tested Chromium viewport.
- **Duplicate Close controls:** the panel has a second Close control. Noted; no cosmetic fix in this release.
- **Not tested:** Safari/iPhone.

## Second follow-up (Filipp's decisions, 27 Sep 2026)

1. **IUPHAR/BPS and FDA withdrawn from the public library.** Both were unresolved and cited by no page. They are removed from `evidence.html`, BibTeX and RIS, and kept in `content/references.json` with `public: false`, their `verification: "brief"` status and their full inspection history. Published production evidence IDs are unchanged (neither ID was ever on production).
2. **Endocannabinoid-system explanation restored**, cited to Health Canada, *Information for Health Care Professionals: Cannabis and cannabinoids*, section 1.0 “Components of the endocannabinoid system” (Spring 2018; used only for basic biology). Glossary: “Endocannabinoid system” (`#g-ecs`) restored alongside “CB1 receptor” (`#g-cb1`).
3. **CBD/THC distinction** now reads “CBD does not produce the THC-like high. Non-intoxicating does not mean inactive or risk-free.”, cited to Health Canada, *About cannabis*, “Chemical substances in cannabis” (THC and CBD subsections). The SmPC-backed safety sentence (sleepiness, Epidyolex) is kept. The interim sentence “NHS England describes it as not psychoactive” is removed. The CBD–THC interaction conclusions still rest only on the checked human studies (Englund 2013, Englund 2023, Zamarripa 2023, Chesney 2025).

**Inspection attribution.** ChatGPT inspected both Health Canada pages directly, as reported by Filipp. Claude could not open them (egress blocked), and Web Boss has not inspected them. Both entries record this in `metadata_check` and `finding_check`. The page titles in our citations follow Filipp's message and have not been compared with the live page headings.

**Request to Web Boss (these passages only; closed by the third follow-up):**
- Health Canada, Information for Health Care Professionals: Cannabis and cannabinoids — https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html — the exact page title, the date line, and section 1.0 “Components of the endocannabinoid system”: the sentences naming CB1 and CB2, anandamide and 2-AG, and the synthesising and degrading enzymes.
- Health Canada, About cannabis — https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/about.html — the exact page title, the “Date modified” line, and the THC and CBD subsections of “Chemical substances in cannabis”: the sentences on the high and on CBD's effects.

**Focus test.** `tools/test-science.mjs` now requires the focused element's top edge to be below the sticky header and a usable part of it on screen: all of a control, or at least 44px of a focusable content panel. Long panels may scroll below the fold.

## Third follow-up: Health Canada passages (Web Boss pack `NWPT-HEALTH-CANADA-PASSAGES-2026-09-27`)

The pack names `17f2068` as its parent; it was reconciled against `e3d1a919191cb6da2268df032c3ad29928d642db` as instructed. Inspection: Web Boss loaded the three canada.ca pages on 27 Sep 2026 and supplied the text captures and exact passages; Claude reviewed the captures against our wording (canada.ca is still blocked from Claude's environment). The earlier attribution (ChatGPT's inspection as reported by Filipp) is kept as history in `references.json`.

| Our wording | Captured passage | Result |
|---|---|---|
| “The body produces signalling molecules called endocannabinoids, including anandamide and 2-AG. The endocannabinoid system includes these molecules, receptors such as CB1 and CB2, and enzymes involved in making and breaking down the signals.” (and glossary `#g-ecs`) | HCP §1.0 “Components of the endocannabinoid system”: “The ECS consists mainly of: the cannabinoid 1 and 2 (CB1 and CB2) receptors; the cannabinoid receptor ligands … (“anandamide”) and 2-arachidonoylglycerol (2-AG); the endocannabinoid-synthesizing enzymes … and the endocannabinoid-degrading enzymes …”; “Anandamide and 2-AG are considered the primary endogenous activators of cannabinoid signaling” | **Matches.** No change |
| “CBD does not produce the THC-like high.” | About cannabis, CBD: “Unlike THC, CBD does not produce a high or intoxication.” (THC: “… including causing the high and intoxication”) | **Matches.** No change |
| “Non-intoxicating does not mean inactive or risk-free.” | Not in the About cannabis capture. Cannabidiol (CBD), “Where CBD comes from”: “CBD is not intoxicating … however, it does have an effect on the brain.” | **Citation corrected.** Now cites Health Canada, Cannabidiol (CBD), added as a 12th library entry from Web Boss's secondary passage. “Not risk-free” rests on the adjacent Epidyolex SmPC example (sleepiness). Wording unchanged |

**Titles matched to captured headings:** “Information for Health Care Professionals: Cannabis (marihuana, marijuana) and the cannabinoids”; “About cannabis”; “Cannabidiol (CBD)”.

**Dates:** professional reference recorded as Spring 2018. The capture does not include its date line, and it cites items from June and July 2018. The PDF in the pack is an older February 2013 version and was not used. About cannabis and Cannabidiol (CBD): date modified not captured; inspected 27 Sep 2026.

**Not imported:** Health Canada's statements that CBD may block or lower some effects of THC, §1.0's list of conditions, and the “entourage effect” discussion. The CBD–THC interaction conclusions still rest only on Englund 2013, Englund 2023, Zamarripa 2023 and Chesney 2025 (enforced in `tools/test-science.mjs`).

The request to Web Boss in the second follow-up is closed by this pack.

## Requests to Web Boss (primary-source pass, same format as P1–P24)
For items 1–11: open the primary record, record the URL, the access date and the passage, with page or section, and note any mismatch. When an item is confirmed, Claude removes its "Source check in progress" tag and records the check level. No wording is changed without a supporting passage.

## Existing issue noticed (not introduced here)
With the phone menu open, axe reports target-size on the header `.brand` link and `#nav-toggle`, because the open panel partly covers them. The finding is identical on production `db61de4`. It is not fixed in this candidate. **Outcome:** closed as not reproduced in Web Boss's hosted Chromium check (see above); Safari/iPhone untested.

## Hosting handoff for Web Boss (preview only)

1. **Confirm production is still `db61de4`** (deployment `45620d96-71a8-41de-a334-9b2d8397afe7`). If anything newer was published, tell Claude before previewing; this branch is built on `db61de4`.
2. **Deploy the candidate to a preview project/branch.** Use the usual method: from a clean checkout of the candidate SHA, `cd nwpharmatech-website/release-032/site`, then `npx wrangler@4 pages deploy . --project-name <preview project> --branch <preview branch> --commit-hash <SHA>`. No environment variables change; enquiries stay unconfigured.
3. **Hosted checks:**
   - **Routes and redirects:** `/science`, `/science/psychiatry`, `/science/cannabinoids`, `/science/cbd-thc` and `/science/cannabinoid-medicines` return 200. `/science.html` and `/science/` redirect to `/science`. `/formulation` still reaches `/science#formulation`.
   - **Science menu:** it opens by click and by keyboard on desktop and in the phone menu, with 8 links. Study synopsis now sits under Programme.
   - **Comparison:** on `/science/cbd-thc` the three tabs switch with the mouse and the arrow keys. With JavaScript off, all three panels show.
   - **Unchanged features:** existing links still work: `/science#investigating` from Programme Room and Work with us briefs, Programme Room share links, the homepage and Science videos, and the team portraits.
   - **Evidence library:** "Cannabinoid science and medicines" shows 11 sources, each marked "Source check in progress".
     - *After the primary-source follow-up:* 11 sources; only IUPHAR/BPS and FDA are marked "Source check in progress".
     - *After the second follow-up:* 11 sources (IUPHAR/BPS and FDA withdrawn; two Health Canada entries added); none marked "Source check in progress".
     - *After the third follow-up:* 12 sources (Health Canada CBD page added); none marked "Source check in progress".
4. **Primary-source pass for the 11 unresolved items** listed above, especially item 1 (the CannabinoidEvidence.org funding and draft-status wording) before any production publication.
5. **Not tested here:** Safari/iPhone, as before.
6. **Production publication** follows Filipp's review of the completed preview. This candidate does not authorise it.
