# Monthly evidence review procedure

1. Run `python3 tools/evidence_review.py status`. It lists each item's verification level and how long ago the last check was.
2. Open each DOI, PubMed or official page from a normal network connection. Check the bibliographic details and every number quoted on the site.
3. Search for new publications, such as PubMed "clinical high risk" AND cannabidiol, and the trial registries. Add cards only for sources you have read.
4. Record the review:
   `python3 tools/evidence_review.py record --date <today> --by "<name, role>" --method "<what was opened>" --scope "<items>" --primary <ids checked>`
   The tool refuses future dates and records only what you enter.
5. If a published summary was wrong, add a correction with `public: true`. Rebuild and run QA.
6. If the review found noteworthy new evidence, publish an evidence digest (see the template).

Do not add review entries for months in which no review took place.
