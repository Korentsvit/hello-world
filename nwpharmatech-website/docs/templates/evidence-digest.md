# Evidence digest: template

A short, periodic summary of new evidence relevant to clinical high risk of psychosis and cannabidiol. Publish one only when a review has actually found something worth reporting.

**Title:** Evidence digest: [Month, Year]
**Search/review date:** [date the review was carried out]
**Sources searched:** [e.g. PubMed query, registries]

For each item:
- **Citation**, with a DOI or PMID link that has been checked against the original.
- **Population, product, design:** the same fields as the evidence-library cards.
- **Finding:** in plain language, including negative or inconclusive results.
- **Limitations.**
- **Relevance to the programme:** say explicitly whether it used NWPT-SM32300. It usually will not have.
- **Label:** Established or Emerging evidence. Never apply "Programme information" to external evidence.

**Changes to the library:** list the cards added or corrected, and add any substantive correction to `references.json` → `corrections` with `public: true`.

**Review record:** reviewer, date and method. Run `python3 tools/evidence_review.py record …` to log it.
