# Programme brief: HTML (v2026-09-22) compared with PDF version 6

26 September 2026. The two documents compared:

- **HTML brief:** `/resources/programme-brief`, "Version 2026-09-22". It is linked from the header, the homepage hero and the homepage brief panel. Its own companion PDF is `/resources/NWPharmaTech-CHRP-programme-brief-v2026-09-22.pdf`.
- **PDF version 6:** `/downloads/nwpharmatech-programme-brief.pdf`, "Version 6 · 26 September 2026 · Draft for review". It is linked from Study and Newsroom.

**Finding.** They are two different documents with different scope, not two versions of one text. There is no direct numerical contradiction, but they differ on sponsor wording, the level of design detail, the transition figure, and the financing text. Nothing has been changed; the list below is for a decision first.

| Topic | HTML v2026-09-22 | PDF version 6 | Kind of difference |
|---|---|---|---|
| Status label | Informational overview; no draft label | "Draft for review", yet publicly linked (as version 4 was before it) | Status |
| Sponsor | "NWPharmaTech remains pharmaceutical sponsor"; mission refers to "pharmaceutical-sponsor accountability" | No sponsor statement for Phase 2B; only company details (company number 13572461, England and Wales) | **Substantive.** This is the open sponsor-wording question |
| Programme lead | Professor Scott Woods, CHR-P programme lead, individual capacity; Yale does not sponsor or endorse | No people named | Scope |
| Phase 2B design | About 328 participants; placebo or one of three daily doses; 12 weeks; follow-up at week 16; primary outcome being finalised | Aims only (dose response, symptoms, safety, tolerability); "Planned. Not recruiting. Protocol being finalised" | **Substantive.** The design source has not been supplied to me |
| Phase 1 | Not mentioned | 14 healthy volunteers; single 600 and 900 mg doses against Epidyolex; completed 10 Dec 2025; database locked 11 Mar 2026; outputs 30 Mar 2026; NCT and ISRCTN numbers; results unpublished | Scope |
| Transition risk | "Elevated transition risk", no figure. The references omit Salazar de Pablo 2021 (its own companion PDF lists it) | "In an updated meta-analysis, the pooled estimate was that about one in four … developed psychosis within three years, and most do not" | Scientific. Consistent with the site, but only the PDF gives the figure |
| Care guidance | "No broadly approved pharmacotherapy labelled to prevent psychosis in CHR-P across major markets" | "No medicine is licensed for this group; NICE advises against antipsychotics for prevention" | Wording; consistent in substance |
| Other CBD evidence | "Hypothesis-generating only"; McGuire 2018 listed | Small, short studies in schizophrenia (mixed) and in clinical high risk (brain activity, stress response, one 21-day symptom study) | Level of detail |
| Formulation | "300 mg CBD micellar-emulsion softgel" | "300 mg oral softgel capsule; highly purified cannabidiol in a self-emulsifying (micellar) lipid formulation; GMP manufacture" | Wording |
| Financing | "Planning-only and inactive on this public site … not an offer and does not accept investments." No route described | "Preferred path under evaluation: platform-integrated programme financing with a permissioned token at close where feasible; register-first fallback; development objectives, not live offering terms"; no investment accepted through the site or the route | **Substantive.** The PDF follows the NWPT-031 pack wording; the HTML predates it |
| Disclaimer | "Not an offering document. Not medical advice." | "Not medical advice and is not an offer of any security or token" | Wording |
| Roadmap | Qualitative horizons; "applicable approvals not confirmed in public materials" | Dated study milestones; no roadmap | Scope |

## Decisions needed before any wording changes

1. Which document is the programme brief? The site links both, from different places.
2. The sponsor wording: "remains pharmaceutical sponsor", or the agreed "is developing the proposed CHR-P programme; formal study responsibilities will be documented before the study begins".
3. Whether the HTML brief should carry the pooled one-in-four figure and the Salazar reference, and the pack's financing sentence.
4. Whether PDF version 6 should stop being "Draft for review" while it is publicly linked.


## Update: aligned in NWPT-036 (26 September 2026)

Both documents now carry the same approved statements wherever they overlap:

| Statement | Source |
|---|---|
| The pooled one-in-four transition figure (Salazar de Pablo 2021, now in the HTML references) | the site-wide approved text |
| No medicine licensed for this group; NICE's position on antipsychotics | the site-wide approved text |
| Phase 1 status (14 volunteers, completed 10 December 2025, results not yet published) | the Study page records |
| Programme lead Professor Scott Woods, individual capacity, Yale non-endorsement | pack C2, live on Team |
| Financing: preferred path under evaluation, register-first fallback, development objectives, not live offering terms, no investment through the site | pack F1–F2 |

**Documents now:**
- **HTML brief:** version 2026-09-26. Its PDF (`/resources/NWPharmaTech-CHRP-programme-brief-v2026-09-26.pdf`) is printed from the page itself (`tools/print-html-brief.mjs`), so the two cannot drift. The older PDFs redirect to it.
- **Downloadable status PDF:** version 7.

**Still genuinely unresolved** (not changed in either document):
1. **Sponsor wording.** The HTML brief says "remains pharmaceutical sponsor". The PDF is silent. The agreed alternative is "is developing the proposed CHR-P programme; formal study responsibilities will be documented before the study begins".
2. **Phase 2B design figures** (about 328 participants, placebo or three doses, 12 weeks plus week 16). They are live on the site and in the HTML brief, but I hold no design source, so the PDF keeps to aims only.
3. **The PDF's "Draft for review" label** while it is publicly linked.
4. **Scope:** both documents are kept; the HTML brief is the full brief and the PDF the two-page status summary. Say if one should replace the other.


## Close-out (NWPT-036b, 26 September 2026)

- **One primary brief.** It is `/resources/programme-brief`, with a PDF printed from that page. Every "Read programme brief" link on the site leads there.
- **The two-page document** is now titled **"Programme summary"** (version 8). It is published as `/downloads/nwpharmatech-programme-summary.pdf`, and the old file name redirects to it. It points to the full brief, and it agrees with the brief wherever they overlap.
- **Draft labels.** Both documents show "Draft for review" while they await approval. At the approved publication step:
  1. Remove the `.brief-draft-label` paragraph from the HTML brief, and "draft for review" from its version line and from the homepage panel.
  2. Rerun `tools/print-html-brief.mjs` and `tools/render-pdf-cover.mjs`.
  3. Set the summary's version `published: true` in `content/documents.json`, rebuild, and copy the PDF across.
- **Sponsor wording and the Phase 2B design** are kept in their approved production wording. The missing source evidence is recorded once, in `records/SOURCE-REGISTER.md` (S1, S2).
