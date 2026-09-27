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
| CANTOP-RCT study report, NIHR Journals Library | Source date | Not available | Publication date not yet recorded; to be checked against the NIHR Journals Library record | No year is held in `content/references.json`, the Evidence library card or the reference exports (BibTeX has no year). Not inferred from the PubMed ID |

The Evidence library wording is **unchanged**: "Bibliographic details and quoted findings were checked against search-engine records of publisher, PubMed, registry and official pages" (last checked 23 September 2026). It will be strengthened only when the primary-source checks below are recorded.

## 2. Primary-source verification request (Web Boss)

For each item, open the **primary record** (publisher page, PubMed, NIHR Journals Library, NICE, EMA or the registry) and record:
- the URL opened and the date it was read;
- whether authors, title, journal, year, volume and pages match;
- whether the quoted finding on the card matches the source;
- for P8, the publication date.

Claude cannot reach PubMed, publisher sites or NICE from its environment, so these are not verified here.

**Priority: P8 (CANTOP-RCT publication date)**, because it is the only date left open in the brief.

| # | Card | Year held | Identifiers held | Result (Web Boss) |
|---|---|---|---|---|
| P1 | Fusar-Poli et al. 2013 | 2013 | PMID 23165428; DOI 10.1001/jamapsychiatry.2013.269 | |
| P2 | Salazar de Pablo et al. 2021 (prevalence) | 2021 | PMID 34827543; DOI 10.3390/brainsci11111544 | |
| P3 | NICE CG178 | 2014 | — | |
| P4 | NICE CG155 | 2013 | — | |
| P5 | Addington et al. 2011 | 2011 | PMID 21498462; DOI 10.1176/appi.ajp.2011.10081191 | |
| P6 | Fusar-Poli et al. 2012 | 2012 | — | |
| P7 | Salazar de Pablo et al. 2021 | 2021 | PMID 34259821; DOI 10.1001/jamapsychiatry.2021.0830 | |
| P8 | CANTOP-RCT report | not recorded | PMID 40096425 | |
| P9 | Stafford et al. 2013 | 2013 | PMID 23335473; DOI 10.1136/bmj.f185 | |
| P10 | Davies et al. 2018 | 2018 | PMID 29856551; DOI 10.1002/wps.20526 | |
| P11 | Kane et al. 2016 | 2016 | PMID 26481174; DOI 10.1176/appi.ajp.2015.15050632 | |
| P12 | Epidyolex SmPC | not recorded | — | |
| P13 | Devinsky et al. 2017 | 2017 | PMID 28538134; DOI 10.1056/NEJMoa1611618 | |
| P14 | Di Forti et al. 2019 | 2019 | PMID 30902669; DOI 10.1016/S2215-0366(19)30048-3 | |
| P15 | Bhattacharyya et al. 2010 | 2010 | DOI 10.1038/npp.2009.184 | |
| P16 | McGuire et al. 2018 | 2018 | PMID 29241357; DOI 10.1176/appi.ajp.2017.17030325 | |
| P17 | Leweke et al. 2012 | 2012 | PMID 22832859; DOI 10.1038/tp.2012.15 | |
| P18 | Boggs et al. 2018 | 2018 | PMID 29619533; DOI 10.1007/s00213-018-4885-9 | |
| P19 | Bhattacharyya et al. 2018 | 2018 | DOI 10.1001/jamapsychiatry.2018.2309 | |
| P20 | Appiah-Kusi et al. 2020 | 2020 | PMID 31915861 | |
| P21 | Bhattacharyya et al. 2024 | 2024 | PMID 39279373; DOI 10.1002/wps.21253 | |
| P22 | Perucca and Bialer 2020 | 2020 | DOI 10.1007/s40263-020-00741-5 | |
| P23 | Taylor et al. 2018 | 2018 | PMID 30374683; DOI 10.1007/s40263-018-0578-5 | |
| P24 | Phase 1 registry records | 2025 | DOI 10.1186/ISRCTN25163383 | |

When results come back, Claude:
1. updates `content/references.json` and the source dates;
2. changes the Evidence library sentence only for the items actually checked against primary records, naming them;
3. keeps any item that could not be opened as "search-engine records".
