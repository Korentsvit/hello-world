# Sources used and how conflicts were resolved

The machine-readable register is `content/sources.json`: every fact, milestone and update points to an entry there. This document explains the sources and the conflicts between them.

## Sources read

| Source | Date | Used for |
|---|---|---|
| Website brief (your message) | Sep 2026 | Programme framing, CHR-P focus, financing description, homepage brief text (verbatim in the PDF) |
| NWPharmaTech_SeriesA_Teaser_FINAL_v2 (Drive, marked "Non-Confidential") | Aug 2026 | Formulation facts (300 mg softgel, SEDDS, U Toronto, Thermo Fisher cGMP, THC not detected), leadership list and roles |
| trialdesign_v1.xlsx: SDTM TS/TI/TA domains for NWPharma_CH_001 | Mar 2026 | Phase 1 design, N=14, ages 18–55, doses, comparator, sponsor, registry ID, start/end/lock dates, bovine gelatine capsule |
| NWPharma_CH_001 TFL / statistics documents (Drive) | Mar 2026 | Confirmed that the analysis was delivered. Results **not** published (your instruction) |
| "Обновление по программе" email (Feb 2026) | Feb 2026 | CHR-P Phase 2b planned for the UK/Europe with protocol being finalised; GMP; ~$5M invested privately |
| "Web3" draft deck (Oct 2025) | Oct 2025 | Background to the financing structure only. Projections and return claims were **not** used |
| SAP v5.1 email (Nov 2025) | Nov 2025 | Reconciliation only (schizophrenia relapse-prevention design) |
| Pitch Deck FK2 (2023) | Aug 2023 | Biographies (UCL, Goldman Sachs, VTB, Oxford Saïd, Harvard/Tufts, KCL PhD) |
| Branding guidelines (Studio P+P, Oct 2021) | 2021 | Colours #005EB8 / #00A3E0, lowercase wordmark |
| Email signature | 2026 | Head office address and phone |
| Web search (reference-verification.md) | 23 Sep 2026 | Literature, NICE, Companies House, registries, crisis lines, advisers' titles |

## Conflicts and how each was resolved

| Topic | Conflict | Resolution |
|---|---|---|
| Lead indication | Brief: CHR-P. Aug 2026 teaser: acute schizophrenia first, with CHR-P as a pipeline indication | You said a CHR-P design exists. The site keeps CHR-P and states that the design is being finalised (unresolved #1). No schizophrenia design details are published |
| Phase 2B design | Three different designs across sources, none for CHR-P | None was carried into the CHR-P page |
| Phase 1 start | SDTM 26 Aug 2025 (consent 27 Aug) vs registry 22 Sep 2025 | The site uses the first-consent date and flags the difference (unresolved #2) |
| Company address | Signature: 5 Wisely Court, Beaufort Gardens. Companies House: Kemp House, 160 City Road | Registered office (Companies House) in the footer and legal page; Beaufort Gardens as head office on the contact page |
| Company name | "NW PharmaTech Ltd" (sponsor field, signatures) vs "NWPHARMATECH LTD" (Companies House) | "NWPharmaTech Ltd" for legal statements; the registry citation is quoted as registered |
| API supplier | "VantageHemp" (2023) vs "VantageAMP" (2026) | Supplier not named on the site |
| Chair titles | Jarosz "Executive Chairman" and Barker "Non-Executive Chairman" in the same teaser | Both shown, flagged (unresolved #5) |
| Availability | Site says "not available outside approved studies"; July 2026 internal draft proposes UK Specials and US expanded access | Kept as true today; flagged |
| Clinical evidence | Teaser cites a CBD-vs-risperidone trial (Rasmussen/Baandrup 2026) as "comparable efficacy" | Excluded: only the protocol is peer-reviewed (BMC Psychiatry 2021); results are sponsor-reported |
| McGuire 2018 | Teaser "p = 0.019" | Not used. The verified value is p = 0.02; the site gives no p-values |
| Appiah-Kusi 2020 | Draft v1 said CBD reduced physiological stress responses | Corrected: the cortisol difference was not significant |
| Devinsky 2017 | Draft v1 listed "reduced appetite" | Replaced with the confirmed adverse events |

## Added in draft 3

| Topic | Issue | Resolution |
|---|---|---|
| Phase 2B doses | The instruction refers to a proposed 300/600/900 mg range from a CHR-P design source; that source was not found in Drive, Gmail or the repository | Not published; no rationale invented (missing input 1) |
| Phase 1 dosing date | The draft 2 milestone said "before August 2025"; the registry start date is 22 September 2025 | Changed to "before Phase 1 dosing (2025)" |
| Taylor et al. 2018 | My verification request gave a wrong title ("GW42003") | The library uses the verified title |
| Kane et al. 2016 (RAISE) | My request said NEJM | *Am J Psychiatry* 2016;173(4):362–372 |
| Salazar de Pablo 2021 | The paper reports pooled and Kaplan–Meier estimates, which differ | The graphic uses pooled estimates only and is labelled so; it is unpublished pending a primary check |
| Services | Whether first-episode services accept people at clinical high risk varies by nation | Stated per region only as far as verified; unconfirmed nhs.uk URLs omitted |
| Phase 1 funding | The Feb 2026 letter reports outstanding supplier payments | No public "Phase 1 funded" milestone |
| Funding figures | US$50M (Feb 2026) vs US$35M (Aug 2026) planning targets; about US$5M company-reported expenditure | Classified in the restricted area only; not public |
