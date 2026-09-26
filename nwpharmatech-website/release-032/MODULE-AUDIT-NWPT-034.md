# Module audit against the reviewed release (NWPT-034, `f99ee77`)

26 September 2026. This audits the six modules delivered in NWPT-030 against the release source (`release-032/site/`) as reviewed on the preview.

- **Reachable** means the page is linked from the site menu on every page, and from other pages.
- **Functional** is what was checked in Chromium under the Cloudflare Pages runtime. The release check had 0 failures on every route, and the interaction tests passed.
- No changes were made for this audit.

| Module | Route | Reachable | Functional (checked) | Remaining gap |
|---|---|---|---|---|
| Study progress (`study-hub`) | `/study` | Yes: Programme menu ("Study progress"), 32 pages; home route card | Summary, public synopsis link, milestones table (clinical and operational, dated, sourced), registrations (NCT07186283, ISRCTN25163383), sponsor and oversight. Module styles load; static, needs no script | Phase 2B oversight is "not yet published", which is correct. The meta description reads "Not the Programme Room"; an internal label should not appear in search snippets |
| Phase 1 (`phase-1`) | `/phase-1` | Yes: Programme and Science menus, Study, Evidence | Eight sections: what was studied, participants, design and doses, measures, results status ("not yet published"), what the study can and cannot establish, protocol history | None found. Results remain unpublished, as they should |
| Formulation explainer (`formulation`) | `/science#formulation` | Yes: Science menu ("Formulation explainer"); anchor resolves | Evidence rows (established, programme information, open question), the capsule-to-measurement diagram, and the cutaway figure | None found |
| Evidence library (`evidence-library`) | `/evidence` | Yes: Science menu and many in-text citations | 24 study cards. Category filters work (All → 24; "CBD research" → 12); the script loads with no console errors; DOI and PubMed links | The corrections section says "No corrections have been made since publication", and the review history ends at 23 September 2026. Yet the Salazar de Pablo 2021 card was corrected in NWPT-033: it now separates the pooled estimate from the Kaplan–Meier series. That correction should be logged |
| Family guide (`family-guide`) | `/families` | Yes: "Why it matters" menu ("Family guide") | Seven sections, including the clinician questions and "Where to get help". Its urgent-help dependency resolves to `/faq#urgent-help`: UK, Ireland and US emergency and crisis numbers | The urgent-help text says the numbers were "checked in the Claude package as of 23 September 2026". That internal wording should not be public. The numbers also need re-checking immediately before launch (the module's publication condition) |
| Newsroom (`newsroom`) | `/newsroom` | Yes: Updates menu ("Newsroom / Press"); Updates page | Press kit with an inline fact sheet (as of 23 September 2026), the programme brief PDF (version 6) and references (.ris); progress; corrections log. The optional email signup was left out, as agreed, because the provider is not live | The corrections log also says "No corrections", although the transition-figure correction has shipped. It needs a dated entry once production carries it |
| **Programme Room** (separate hand-off) | none | **No** | **Not supplied.** It has never been received in this workspace. Nothing on the site stands in for it: the Study page states it is "not the interactive Programme Room" | Awaiting the actual component and its hand-off. `/study` and `/programme` are not counted as its replacement |

## Fixes proposed (not applied)

These fixes touch `faq.html`, `evidence.html`, `newsroom.html` and `study.html` only, not Home or Team. They wait until Grok's portrait commit is reconciled, so that nobody edits the same files in parallel.

1. Remove "in the Claude package" from the urgent-help text (`faq.html`). Re-check the numbers on the day of launch.
2. Add a dated corrections entry to both the Evidence and Newsroom corrections logs, with the date production carries it: "Salazar de Pablo 2021: the one-in-four figure is the pooled estimate (25% at three years); the separate Kaplan–Meier series (27% at three years) was previously mislabelled." Extend the Evidence review history with the same date.
3. Replace "Not the Programme Room" in the Study page's search description with a plain description.
