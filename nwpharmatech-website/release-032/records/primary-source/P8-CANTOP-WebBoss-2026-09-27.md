# PRIMARY-SOURCE-P8-CANTOP — PMID 40096425 / CANTOP-RCT

**Inspection timestamp:** 2026-09-27 11:39–11:41 CEST (Europe/Vienna)  
**Rule applied:** No dates invented; only fields as stated on opened primary records. Where absent: “not stated on [URL]”.

Artifacts saved under `/workspace/primary-source-p8-artifacts/` (PubMed eutils XML/JSON, Crossref JSON, NIHR PDF + text extract, Wayback HTML of NIHR page).

---

## 1. PubMed — PMID 40096425

### Access status
| Channel | URL | Result |
|---|---|---|
| PubMed HTML | https://pubmed.ncbi.nlm.nih.gov/40096425/ | **Inaccessible** — Google reCAPTCHA interstitial (“Checking your browser before accessing pubmed.ncbi.nlm.nih.gov”). Not a content page. |
| NCBI E-utilities `efetch` (official PubMed XML API) | https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=40096425&retmode=xml | **Verified** — HTTP 200, full `PubmedBookArticle` record |
| NCBI E-utilities `esummary` | https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=40096425&retmode=json | **Verified** — HTTP 200 |

### Verified bibliographic facts (from PubMed XML / esummary)

| Field | Value as stated |
|---|---|
| PMID | 40096425 |
| Title (BookTitle) | Cannabidiol as a treatment for patients who are clinically at high risk of developing psychosis: learnings from the CANTOP-RCT |
| Authors (order) | Bhattacharyya S; Davies C; Carter B; McGuire P; Brammer M; Fusar-Poli P; Broome M; Watson S; Perez J; Yung A |
| Collection / series | Efficacy and Mechanism Evaluation |
| Publisher | National Institute for Health and Care Research, Southampton (UK) |
| DOI | 10.3310/YNFH9826 |
| Bookshelf ID | NBK612755 |
| Publication type | Review |
| Language | eng |
| **PubDate** | **Year 2025, Month 03** (no Day element in `<PubDate>`) |
| **epubdate** (esummary) | **empty string** — not stated |
| History `pubmed` / `medline` / `entrez` | Year 2025, Month 3, Day 1 |
| PublicationStatus | ppublish |
| Volume / issue / pages | **not stated** on PubMed book record (esummary `volume`/`issue`/`pages` empty) |
| Copyright (in Abstract CopyrightInformation) | Copyright © 2026 Bhattacharyya et al. |
| esummary `history` accepted | 2024/09/01 00:00 |
| Available-from URL (esummary) | http://www.ncbi.nlm.nih.gov/books/NBK612755/ |

### Quoted PubMed XML passages

```xml
<BookTitle book="ukemeynfh9826">Cannabidiol as a treatment for patients who are clinically at high risk of developing psychosis: learnings from the CANTOP-RCT</BookTitle>
<PubDate><Year>2025</Year><Month>03</Month></PubDate>
...
<CollectionTitle book="ukemecollect">Efficacy and Mechanism Evaluation</CollectionTitle>
...
<CopyrightInformation>Copyright © 2026 Bhattacharyya et al.</CopyrightInformation>
...
<PubMedPubDate PubStatus="pubmed"><Year>2025</Year><Month>3</Month><Day>1</Day></PubMedPubDate>
...
<PublicationStatus>ppublish</PublicationStatus>
```

**Day-level print/epub labels on PubMed HTML:** not stated on https://pubmed.ncbi.nlm.nih.gov/40096425/ (HTML blocked by reCAPTCHA; eutils has no separate epub date field populated).

---

## 2. NIHR Journals Library — CANTOP-RCT / YNFH9826

### Access status
| Channel | URL | Result |
|---|---|---|
| Live NIHR article page | https://www.journalslibrary.nihr.ac.uk/eme/published-articles/YNFH9826 | **Inaccessible now** — CloudFront HTTP 403 (“Request blocked”) from this environment |
| Live NIHR JATS XML (Crossref link) | https://www.journalslibrary.nihr.ac.uk/sites/journalslibrary/files/journal_data/YNFH9826/YNFH9826.xml | **Inaccessible** — CloudFront 403 |
| Official NIHR PDF (VOR, Crossref `link`) | https://njl-admin.nihr.ac.uk/document/download/2050125 | **Verified** — HTTP 200, application/pdf, 923803 bytes, 18 pages |
| Wayback Machine capture of official NIHR page | https://web.archive.org/web/20251206201918/https://www.journalslibrary.nihr.ac.uk/eme/published-articles/YNFH9826 (snapshot timestamp 20251206201918) | **Verified** — archived content of the official URL |
| Crossref works API | https://api.crossref.org/works/10.3310/YNFH9826 | **Verified** — publisher-registered metadata; `resource.primary.URL` = NIHR page above |

### A. Official NIHR PDF — publication date fields as printed

**Cover / front matter (page 1 text extract):**
> Published March 2025  
> DOI: 10.3310/YNFH9826

**Recommended citation as printed on the PDF:**
> This synopsis should be referenced as follows:  
> Bhattacharyya S, Davies C, Carter B, McGuire P, Brammer M, Fusar-Poli P, et al. Cannabidiol as a treatment for patients who are clinically at high risk of developing psychosis: learnings from the CANTOP-RCT. Efficacy Mech Eval 2026;13(7):197–214. https://doi.org/10.3310/YNFH9826

**Running header as printed:**
> Efficacy and Mechanism Evaluation 2026 Vol. 13 No. 7

**About this synopsis (article history) as printed:**
> The contractual start date for this research was in September 2018. This article began editorial review in August 2023 and was accepted for publication in September 2024.

**Copyright as printed:**
> Copyright © 2026 Bhattacharyya et al. […] publication source – NIHR Journals Library, and the DOI of the publication must be cited.

**PDFInfo Subject line:** `… Published March 2025`  
**PDF CreationDate (file metadata, not a publication label):** Fri Aug 7 2026 (box-local BST on `pdfinfo`; convert → 2026-08-07 ~15:15 CEST Europe/Vienna) — file production timestamp only; do not treat as publication date.

### B. NIHR Journals Library HTML (Wayback of official URL, snapshot 2025-12-06) — fields as printed / in citation metas

Visible text:
> Journal: Efficacy and Mechanism Evaluation  
> **Published: March 2025**

Citation string on page:
> … learnings from the CANTOP-RCT **[published online ahead of print March 12 2025]**. Efficacy Mech Eval **2025**. https://doi.org/10.3310/YNFH9826

HTML meta (as archived):
- `citation_publication_date` / `citation_date` = `2025/03/12` (scheme YYYY/MM/DD)
- `citation_year` = `2025`
- `citation_firstpage` = `1` ; `citation_lastpage` = `17`
- `citation_issn` = `ISSN: 2050-4373`
- `citation_doi` = `10.3310/YNFH9826`
- page description meta: `Published in March 2025`
- Copyright statement on archived page: `Copyright © 2025 Bhattacharyya et al.`

Volume / issue **not stated** as discrete fields in those citation metas on the archived page.

Article history text on archived page (same wording as PDF):
> … began editorial review in August 2023 and was accepted for publication in September 2024.

### C. Crossref (publisher deposit) — date objects present

| Crossref field | Value |
|---|---|
| `published` / `published-online` / `issued` | date-parts **[2025, 3]** (month precision; no day) |
| `published-print` | **absent** (key not present) |
| `license.start` | 2025-03-01T00:00:00Z |
| `page` | 1-17 |
| `volume` / `issue` | **null / not stated** |
| assertion `accepted_for_publication` | 09-2024 |
| assertion `editorial_review_begun` | 08-2023 |
| `resource.primary.URL` | https://www.journalslibrary.nihr.ac.uk/eme/published-articles/YNFH9826 |

---

## 3. Publication-date synthesis (no invention)

Report each label separately; do **not** collapse into one invented “publication date”.

| Label | Stated value | Source |
|---|---|---|
| Cover “Published …” | **March 2025** | NIHR PDF; NIHR page (Wayback); Crossref published-online [2025, 3] |
| Online-ahead-of-print day | **March 12 2025** | NIHR page citation string + `citation_publication_date` on Wayback HTML |
| PubMed `<PubDate>` | **2025 Mar** (no day) | NCBI efetch XML |
| PubMed history day | **2025-03-01** | NCBI efetch History pubmed/medline/entrez |
| PubMed epubdate | **not stated** (empty) | NCBI esummary |
| Bibliographic citation year / vol / issue / pages (on current PDF) | **2026;13(7):197–214** | NIHR PDF recommended citation + running header |
| Early-page / Crossref pages | **1–17** | Wayback citation metas; Crossref `page` |
| Accepted for publication | **September 2024** | NIHR PDF “About this synopsis”; Crossref assertion 09-2024 |
| Live NIHR HTML today | **not stated on https://www.journalslibrary.nihr.ac.uk/eme/published-articles/YNFH9826** (page returned CloudFront 403; could not re-read live) | this inspection |

**Important for Claude:** The PDF’s own cover line is “Published March 2025”, while the same PDF’s recommended citation uses journal year **2026** with volume 13 issue 7 pages 197–214. Both appear on the official PDF; neither was inferred here. The archived NIHR HTML (Dec 2025 snapshot) still showed ahead-of-print wording with journal year **2025** and pages 1–17 — consistent with an earlier online state vs the pagination/year in the current PDF citation block.

---

## 4. Quick peek — other high-priority PubMed abstracts (eutils only)

| Card | PMID | eutils HTTP | Title present | AbstractText present | PubDate year |
|---|---|---|---|---|---|
| P1 | 23165428 | 200 | Yes — “The psychosis high-risk state: a comprehensive state-of-the-art review.” | **Yes** | 2013 |
| P21 | 39279373 | 200 | Yes — “Effects of cannabidiol on symptoms in people at clinical high risk for psychosis.” | **No** (title/metadata only in this fetch) | 2024 |

PubMed HTML for these was not opened (same reCAPTCHA barrier expected). Full primary-source pass for P1–P24 was **not** done; P8 remained the priority.

---

## 5. Inaccessible summary

- https://pubmed.ncbi.nlm.nih.gov/40096425/ — reCAPTCHA; use eutils XML instead (done).
- https://www.journalslibrary.nihr.ac.uk/eme/published-articles/YNFH9826 — live CloudFront 403; used official PDF (njl-admin) + Wayback HTML of that URL + Crossref.
- NCBI Bookshelf HTML https://www.ncbi.nlm.nih.gov/books/NBK612755/ — also returned reCAPTCHA challenge page (same size class as PubMed HTML).

No site deploys performed.
