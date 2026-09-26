# Internal source register: open evidence and verification

Internal; not published. Recorded once here; the other records point to this file. Updated 26 September 2026 (V3 closed).

## Claims kept in their current approved wording, with source evidence missing

| # | Claim on the site | Where | Evidence held | Missing | Handling |
|---|---|---|---|---|---|
| S1 | "NWPharmaTech remains pharmaceutical sponsor" (Phase 2B and the programme) | Team, Programme, Science, DeSci, Governance, FAQ, Updates articles, the programme brief | The registrations name NWPharmaTech Ltd as sponsor of the **Phase 1** study only | A document designating the Phase 2B sponsor (or recording that formal study responsibilities are still to be documented) | Wording kept as approved on production. Not changed in either direction |
| S2 | Phase 2B design: about 328 participants; placebo or 300, 600 or 900 mg daily; 12 weeks; follow-up at week 16 | Home (design strip), Programme, the Phase 2B article, the programme brief | None in this workspace | The CHR-P Phase 2B design source (synopsis or protocol) | Wording kept as approved on production. The summary PDF gives aims only. No design details imported from another indication |

## Verification notes

| # | Item | Status | Source used |
|---|---|---|---|
| V1 | Salazar de Pablo 2021: **pooled** 25% at 3 years | Verified 26 Sep 2026 | Search results for the publisher and index pages (JAMA Psychiatry 2021;78(9):970–978; PubMed 34259821). The pooled series also gives 9% (6 months), 15% (1 year), 19% (2 years) and 27% (4 years) |
| V2 | Salazar de Pablo 2021: **Kaplan–Meier** 8% (6 months), 14% (1 year), 20% (2 years), 35% (10 years) | Verified 26 Sep 2026 | Same searches |
| V3 | Salazar de Pablo 2021: Kaplan–Meier **27% at 3 years** | **Closed 26 Sep 2026: verified by external primary-source check, independently corroborated here** | (1) The CHRP scientific reviewer confirmed the figures against the paper's Tables 1–2 on 26 Sep 2026 (Grok team editorial package, `CLAUDE-JAMA-SALAZAR-2021-SOURCE.md` and `05-CHRP-FACT-SHEET-CONFIRMATION.md`): pooled 25% and Kaplan–Meier 27% at 3 years are separate analyses. (2) Independent corroboration here: a web-search result summary for the paper gives the Kaplan–Meier 3-year estimate as **0.27 (95% CI 0.25–0.28; n = 1,029)**, from 130 studies and 9,222 individuals. (3) Not directly viewed here: PMC (PMC8281006), jamanetwork.com, PubMed, Europe PMC and Crossref are all blocked from this environment, so the table layout (which table carries which method) has not been read by us. Public wording already matched and is unchanged. Keep in mind that the pooled 4-year figure is also 27%; never pair "27%" with "pooled" at 3 years |
| V4 | Date the transition-figure correction became public | **Confirmed: 26 September 2026.** The logs' date stands | Cloudflare `created_on` for the NWPT-035 production deployment `c3e85514-2052-4b89-b5e8-9032efd20a4d`: **2026-09-26T16:13:19.433042Z** (17:13:19 BST / 18:13:19 CEST), confirmed by Web PR (Grok) on 26 Sep 2026. The Git commit time is not used as evidence |
| V5 | Urgent-help contacts (FAQ, linked from the family guide) | Verified 26 Sep 2026 | Official-domain search results: england.nhs.uk and gov.wales (111 option 2); nhs24.scot (111 mental health hub); nidirect.gov.uk and publichealth.hscni.net (Lifeline 0808 808 8000); samaritans.org (116 123); samaritans.org and NHS pages (Shout 85258); pieta.ie (1800 247 247, text HELP to 51444); hse.ie (112/999); samhsa.gov, fcc.gov and 988lifeline.org (988 call or text). Re-check immediately before each production publication |
| V6 | Team portraits (7) | Authorised | Supplied and authorised by Filipp from the labelled corporate deck. No source mismatch found (the deck itself is not held here) |

## Salazar de Pablo 2021: locked figures for internal materials (26 Sep 2026)

| Analysis | 3-year transition | Other points | Public wording |
|---|---|---|---|
| **Pooled** meta-analytic estimate | **25%** | 9% (6 months), 15% (1 year), 19% (2 years), 27% (4 years) | "about one in four … (pooled estimate, 25%) within three years" |
| **Kaplan–Meier** cumulative estimate, a separate analysis | **27%** (95% CI 0.25–0.28; n = 1,029, per the corroborating summary) | 8% (6 months), 14% (1 year), 20% (2 years), 35% (10 years) | Named only as a separate series; never merged with the pooled estimate |

Rules: never label 25% as Kaplan–Meier, never combine the two series, and never mix the Fusar-Poli 2012 pooled averages into the Salazar sentence.

**Sweep of 26 Sep 2026 (repository and supplied drafts).** No residual mislabel was found.
- `CHANGES-vs-NWPT-032.md` quotes the old wording only as the "before" text.
- The unpublished preview `docs/graphics-preview/transition.html` plots the pooled series and says Kaplan–Meier is not combined. It stays gated: its pooled 95% intervals from 18 months onward still need checking against the paper.
- The Grok drafts `02-DEMO-SCRIPT.md` and `04-EXTERNAL-FACT-SHEET.md` (Q2) label the methods correctly. They are Grok's to revise and have not been changed.
