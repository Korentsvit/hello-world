# Source metadata (NWPT-047): corrections and primary-source verification request

This is a separate, reviewable change from the NWPT-047 interface work. It touches only `source/programme-room.json`, the two regenerated pages (`programme-room.html`, `work-with-us.html`) and the Programme Room test.

## 1. Brief and Programme Room source dates: before and after

Source dates and website dates are separate fields. No date was added that the records do not support.

| Source | Field | Before | After | Basis |
|---|---|---|---|---|
| Public study synopsis (`resources/public-synopsis.html`) | Source date | Not available | No separate issue date (company web page) | The page carries no issue date; it is a company web page |
| | Website page reviewed | 21 September 2026 | unchanged | "Last reviewed: 21 September 2026" is shown on the page |
| Science: what is known and what remains open (`science.html#investigating`) | Source date | Not available | No separate issue date (company web page) | As above |
| | Website page reviewed → **Website page last updated** | Not shown on the page | 22 September 2026 (site map record; no review date is shown on the page) | `sitemap.xml` `lastmod` 2026-09-22. This is a last-update date, **not** a review date, and is labelled as such |
| CANTOP-RCT study report, NIHR Journals Library | Source date | Not available | Publication date not yet recorded; to be checked against the NIHR Journals Library record | No year is held in `content/references.json`, the Evidence library card or the reference exports (BibTeX has no year). Not inferred from the PubMed ID. **Superseded 27 Sep 2026:** see §3 |

The Evidence library wording is **unchanged**: "Bibliographic details and quoted findings were checked against search-engine records of publisher, PubMed, registry and official pages" (last checked 23 September 2026). It will be strengthened only when the primary-source checks below are recorded.

## 2. Primary-source verification request (Web Boss), updated 27 Sep 2026

**Standard check for every card.** Open the primary record (publisher page, PubMed, NIHR Journals Library, NICE, medicines.org.uk or the registry) and record:
- the **URL opened** and the **date read**. No card holds a primary-record URL except the NICE, SmPC and registry entries;
- whether authors, title, journal, year, volume, pages, DOI and PMID match what is held;
- whether the finding quoted on the card matches the source.

**Specific missing evidence.** These are the gaps beyond the standard check. They come from `content/references.json` fields that are empty or noted as "not confirmed".

| # | Card | Held now (search-engine records, 23 Sep 2026) | Missing evidence to capture | Result (Web Boss) |
|---|---|---|---|---|
| P1 | Fusar-Poli et al. 2013 | 2013; PMID 23165428; DOI 10.1001/jamapsychiatry.2013.269 | Whether the **genetic-risk-with-deterioration** wording appears in the paper (not confirmed) | **Partial; still open.** Web Boss (27 Sep 2026, E-utilities only): the title matches, the PubMed year is 2013, and the abstract is present. Authors, journal details and the quoted wording were not checked |
| P2 | Salazar de Pablo et al. 2021 (prevalence) | 2021; PMID 34827543; DOI 10.3390/brainsci11111544 | Standard check only | |
| P3 | NICE CG178 | 2014; https://www.nice.org.uk/guidance/cg178 | **Recommendation numbers** cited on the card and the guideline's **last-updated date** (neither confirmed), from nice.org.uk/guidance/cg178 | |
| P4 | NICE CG155 | 2013; https://www.nice.org.uk/guidance/cg155 | Guideline **last-updated date** and the recommendation cited on the card, from nice.org.uk/guidance/cg155 | |
| P5 | Addington et al. 2011 | 2011; PMID 21498462; DOI 10.1176/appi.ajp.2011.10081191 | Standard check only | |
| P6 | Fusar-Poli et al. 2012 | 2012 | **DOI and PMID** (not held); confirm journal, volume and pages | |
| P7 | Salazar de Pablo et al. 2021 | 2021; PMID 34259821; DOI 10.1001/jamapsychiatry.2021.0830 | Standard check only | |
| P8 | CANTOP-RCT report | PMID 40096425 | **Publication date (month and year)**, report DOI, and NIHR Journals Library series, volume and issue (EME programme), from the NIHR Journals Library report page; confirm the PubMed 40096425 record matches. This is the only date shown as unknown in the brief | **Metadata: confirmed; card check open.** Web Boss evidence note, 27 Sep 2026 (`records/primary-source/P8-CANTOP-WebBoss-2026-09-27.md`), from the official NIHR PDF, NCBI E-utilities (PubMed XML) and Crossref. **Published:** March 2025. **Recommended citation on the current PDF:** Efficacy Mech Eval 2026;13(7):197–214. **DOI:** 10.3310/YNFH9826. **PMID:** 40096425. **Finding:** replaced on 27 Sep 2026 with the sentence approved by Filipp ("The study did not start owing to challenges in securing supply of the study drug."), used on the site as a paraphrase without quotation marks. It is supported by the report's Abstract (Study limitations and future work, PDF page 2), per Web Boss's inspection (see §3). **Title and authors:** corrected to the published title and named authors (see §3). The PubMed and NIHR web pages themselves could not be opened (reCAPTCHA / 403) |
| P9 | Stafford et al. 2013 | 2013; PMID 23335473; DOI 10.1136/bmj.f185 | Issue number (not held) | |
| P10 | Davies et al. 2018 | 2018; PMID 29856551; DOI 10.1002/wps.20526 | Standard check only | |
| P11 | Kane et al. 2016 | 2016; PMID 26481174; DOI 10.1176/appi.ajp.2015.15050632 | Standard check only | |
| P12 | Epidyolex SmPC | https://www.medicines.org.uk/emc/product/10781 | **SmPC revision date / version** shown on medicines.org.uk (none held), and the section numbers for the quoted statements | |
| P13 | Devinsky et al. 2017 | 2017; PMID 28538134; DOI 10.1056/NEJMoa1611618 | **Pages** (not held) | |
| P14 | Di Forti et al. 2019 | 2019; PMID 30902669; DOI 10.1016/S2215-0366(19)30048-3 | Standard check only | |
| P15 | Bhattacharyya et al. 2010 | 2010; DOI 10.1038/npp.2009.184 | **PMID** and issue (not held) | |
| P16 | McGuire et al. 2018 | 2018; PMID 29241357; DOI 10.1176/appi.ajp.2017.17030325 | Standard check only | |
| P17 | Leweke et al. 2012 | 2012; PMID 22832859; DOI 10.1038/tp.2012.15 | Issue number (not held) | |
| P18 | Boggs et al. 2018 | 2018; PMID 29619533; DOI 10.1007/s00213-018-4885-9 | Standard check only | |
| P19 | Bhattacharyya et al. 2018 | 2018; DOI 10.1001/jamapsychiatry.2018.2309 | **PMID** (not held) | |
| P20 | Appiah-Kusi et al. 2020 | 2020; PMID 31915861 | **Volume, issue, pages and DOI** (not held); confirm PMID 31915861 | |
| P21 | Bhattacharyya et al. 2024 | 2024; PMID 39279373; DOI 10.1002/wps.21253 | Standard check only | **Partial; still open.** Web Boss (27 Sep 2026, E-utilities only): the title matches and the PubMed year is 2024. No abstract was retrieved; journal details and the quoted finding were not checked |
| P22 | Perucca and Bialer 2020 | 2020; DOI 10.1007/s40263-020-00741-5 | **PMID** (32504461 not confirmed from PubMed) and issue | |
| P23 | Taylor et al. 2018 | 2018; PMID 30374683; DOI 10.1007/s40263-018-0578-5 | The **food-effect fold changes** quoted on the card (not confirmed) and the issue number | |
| P24 | Phase 1 registry records | 2025; DOI 10.1186/ISRCTN25163383; https://clinicaltrials.gov/study/NCT07186283 | Registration dates on ClinicalTrials.gov and ISRCTN (the brief says "Registered 2025; exact registration date not available") | |

**Order of work:**
1. P8 (CANTOP-RCT), because it is the only unknown date shown in the brief.
2. The cards whose notes say "not confirmed": NICE CG178, Epidyolex SmPC, Appiah-Kusi 2020, Perucca 2020, Taylor 2018, Fusar-Poli 2012 and 2013.
3. Everything else.

**Dates:** only dates read from a primary record will be added. Until then the brief keeps "Publication date not yet recorded" for CANTOP-RCT, and the Evidence library keeps "search-engine records".

**Status:** not a blocker for NWPT-047. This release adds no source claims, and every unknown is labelled as unknown.

When results come back, Claude:
1. updates `content/references.json` and the source dates;
2. changes the Evidence library sentence only for the items actually checked against primary records, naming them;
3. keeps any item that could not be opened as "search-engine records".

## 3. P8 CANTOP-RCT metadata update (27 Sep 2026; separate commit, based on release 546e5ea)

**Evidence:** Web Boss's inspection note, `records/primary-source/P8-CANTOP-WebBoss-2026-09-27.md` (27 Sep 2026, 11:39–11:41 CEST). Claude did not open the underlying records; this environment cannot reach them. This confirms **bibliographic metadata only**. It is not verification of the card's finding and not scientific sign-off.

The publication month and the journal citation year are recorded as **separate fields** and not merged into one date:

| Field | Value used | Source (per Web Boss) |
|---|---|---|
| Published (month) | March 2025 | Official NIHR PDF cover ("Published March 2025"); PubMed `<PubDate>` 2025 Mar; Crossref published-online [2025, 3] |
| Recommended citation (current PDF) | Efficacy Mech Eval 2026;13(7):197–214 | Official NIHR PDF: recommended citation block and running header |
| DOI | 10.3310/YNFH9826 | PDF, PubMed XML, Crossref |
| PMID | 40096425 | PubMed XML |
| Online ahead of print | 12 March 2025 | **Not used on the site.** Only on the archived NIHR page (Wayback snapshot of 6 Dec 2025: citation string and `citation_publication_date`); the live NIHR page returned 403 |

**Where it now appears:**
- **Programme Room and the Work with us brief:**
  - "Source date: Published March 2025 (NIHR Journals Library PDF and PubMed record)";
  - "Journal citation: Efficacy Mech Eval 2026;13(7):197–214 (recommended citation on the current NIHR PDF)";
  - "Original source (DOI)" added before PubMed.
- **Evidence library card:** the source line adds the published month, the recommended citation and the DOI link.
- **`downloads/nwpharmatech-references.bib` and `.ris`:** journal "Efficacy and Mechanism Evaluation (NIHR Journals Library)", citation year 2026, volume 13, issue 7, pages 197–214, DOI, and a note "Published March 2025".
- **`content/references.json`:** the same fields, plus `published` and `citation`. `verification` stays `index`.

**Unchanged:**
- the card's finding, limitations and descriptive title;
- the Evidence library "search-engine records" sentence, because only one card has had its metadata checked;
- P1–P24 statuses, apart from the P8, P1 and P21 notes above.

**Title and authors corrected (27 Sep 2026, at Filipp's instruction; follow-up commit):**
- **Published title everywhere:** "Cannabidiol as a treatment for patients who are clinically at high risk of developing psychosis: learnings from the CANTOP-RCT". This covers the Evidence library card heading and citation, the Programme Room source, the generated brief, `content/references.json`, BibTeX and RIS.
- **Named authors in the documented order:** Bhattacharyya S, Davies C, Carter B, McGuire P, Brammer M, Fusar-Poli P, Broome M, Watson S, Perez J, Yung A.
  - Displayed as "Bhattacharyya S, Davies C, et al.";
  - the full list is in `references.json`, BibTeX and RIS.
- **Publisher:** NIHR Journals Library. The journal is Efficacy and Mechanism Evaluation.
- **BibTeX and RIS:** now typed as a journal article.
- **Dates:** "Published March 2025" stays separate from the citation year 2026.
- **Finding:** the card's substantive finding remains **unverified** until checked against the report.

**Finding replaced (27 Sep 2026, follow-up commit on 683d8cf).**
- **Old wording:** "The trial was funded but did not start because the study medicine could not be supplied. It produced no efficacy results." (Evidence library card; `references.json`), and "…(CANTOP-RCT) was funded but never started, …" (Programme Room statement, Work with us card and brief).
- **New wording:** The study did not start owing to challenges in securing supply of the study drug. It is Filipp's approved sentence, used as a paraphrase without quotation marks. The Programme Room statement now reads "…(CANTOP-RCT) did not start owing to challenges in securing supply of the study drug, which is one reason this question remains open."
- **Removed:** "funded", which the approved sentence does not support. "It produced no efficacy results" is also dropped; the card's Limitations still say "Not an efficacy finding".

**Supporting passage: recorded from Web Boss's inspection** (`records/primary-source/P8-CANTOP-finding-support-WebBoss-2026-09-27.md`, from his forward pack of 27 Sep 2026). Claude did not open the PDF itself.

| Field | Value |
|---|---|
| Report passage (verbatim) | "The CANTOP-RCT did not start owing to challenges in securing supply of the study drug, and therefore addressing this issue is essential for any future definitive study to investigate the efficacy of cannabidiol as a treatment for clinical high-risk patients with attenuated psychotic symptoms." |
| Page | PDF page 2, Abstract: Study limitations and future work. Also consistent: Ethics statement, PDF page 12: "…this did not go ahead as supply of study drug was not secured." |
| Source file | Official NIHR PDF, https://njl-admin.nihr.ac.uk/document/download/2050125 (per the P8 note) |
| Inspected by / date | Web Boss, 27 Sep 2026 (report full-text extract of the official PDF, per his note) |

The only Web Boss note on file (`records/primary-source/P8-CANTOP-WebBoss-2026-09-27.md`) covers publication metadata and quotes no passage on why the study did not start. Claude could not open the PDF from its environment (proxy 403). **Status:** the passage and page above now support the card's finding. This supports that one statement only. It is not scientific sign-off, and it does not verify any other card. Recorded in a record-only commit; no site change.
