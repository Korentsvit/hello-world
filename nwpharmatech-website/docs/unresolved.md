# Unresolved items

These are the only facts still missing. A production build (`python3 build.py --env production`) refuses to run while any `[TBC: …]` marker remains on a public page.

| # | Page | Missing fact | Question |
|---|---|---|---|
| 1 | programme.html | CHR-P Phase 2B design: control group, dose arms, duration, primary outcome, sample size, countries | Where is the CHR-P Phase 2B design document? I found designs only for schizophrenia studies (Aug 2026 teaser: acute, placebo vs 900 mg BID, N≈240; Nov 2025 SAP v5.1: relapse prevention, placebo/600/900 mg). The Feb 2026 update says the CHR-P protocol is "being finalised". May its design be published? |
| 2 | programme.html (Phase 1 dates) | Study start date | Screening began 26–27 Aug 2025 (study SDTM data), but ClinicalTrials.gov lists 22 Sep 2025 as the start. Which date should the site use, and should the registry be updated? |
| 3 | contact.html | Public email address | Which mailbox should the public use, and is it monitored? No public address appears in any source. I did not publish personal addresses. |
| 4 | contact.html | Spelling of head-office address | Is it "Wisely Court" (your email signature) or "Wisley Court" (planning register)? |
| 5 | people.html | Board titles | The Aug 2026 teaser lists William Jarosz as "Executive Chairman" and Prof. Richard Barker as "Non-Executive Chairman". What is each person's correct title? |
| 6 | people.html | Dr Scott Woods's role | What is his formal title with the programme (for example, Scientific Advisory Board member)? |
| 7 | people.html | People not in the teaser | Should Prof. Trevor Jones (in the July 2026 board email) and Max Moldaschl (co-founder) be listed? Has everyone listed consented to their name, biography and portrait being published? |
| 8 | people.html | Conflict-of-interest policy | Does a board policy exist, and will declarations be published? |
| 9 | financing.html | Four "financing does not influence the science" commitments | Have the board and counsel approved them, including "no investment sought from study participants or families"? |
| 10 | legal.html | Privacy notice | Who is the data protection contact, and what is the retention period? The notice needs legal review. |
| 11 | faq.html | Crisis numbers | Someone with normal internet access must re-check each number on nhs.uk, nidirect.gov.uk, samaritans.org, pieta.ie and 988lifeline.org immediately before launch. They were checked here only through search summaries. |

**Also needed before launch. These do not block the build:**

- 8 authorised portraits and 2 softgel renders (see `asset-manifest.md`).
- The official NW logo files.
- Primary-source check of every reference (see `reference-verification.md`).
- Counsel sign-off on `financing.html` and the homepage financing section: UK FSMA s21 and cryptoasset promotions; US securities law; EU MiCA.
- MHRA advertising review of the site as a whole.
- A decision on the UK Specials / expanded-access draft (July 2026). If it goes ahead, "not available outside an approved study" on programme.html and faq.html becomes untrue.
