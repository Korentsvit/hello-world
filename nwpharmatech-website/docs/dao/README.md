# DAO visual tranche: placement and relationship review

Package: `NWPT-DAO-visual-tranche-01.zip` (Manus, 24 September 2026). The checksums were verified on import (`tools/import-visuals.mjs`). The package is creative direction only: the wording on the site follows the agreed financing content already in `financing.html`, not the brief.

## Asset-to-page list

| Asset | Page and section | How used |
|---|---|---|
| 09 Bounded-governance hero | Funding → "How the programme could be funded" | Full container width; 4:3 crop around the focal point on phones; explanatory, with a caption |
| 10 Register and digital twin | Funding → "The register and any digital record" | Beside the text; phone crop; caption "the register controls" |
| 11 Clinical-governance boundary | Programme → "Programme governance" (new), beside the sponsor, investigator, ethics committee and regulator responsibilities | Beside the text; phone crop |
| 12 Milestone-release architecture | Funding → "Use of funds" → "Proposed controls over research spending" | Beside the text; phone crop; caption says a milestone releases spending, decides nothing clinical and is not a payout |
| 13 Research commons | Updates → "Following the research" (new) | Beside the text; phone crop |
| 14 Governance sigil | Funding → "Who does what" heading only | 48 px decorative marker, empty alt text; used once |
| 15 Governance architecture | Funding → "How the parts relate" | **Raster not used.** Rebuilt as HTML text from the Mermaid source, with the relationships corrected (below); editable source in `docs/dao/governance-architecture.mmd` |
| Contact sheet, brief, art direction, prompts, masters, Mermaid source | — | Not published. Only WebP derivatives, and crops made from the masters, are in `public/assets/img/dao/` |

The homepage keeps its scientific hero. No DAO, token or community page was created, and no retired route was restored. There are no family or patient images on the Funding page.

Captions are the site's own wording. The package's captions were kept in meaning but written to name the proposal plainly. For example, image 12 now says "It does not decide anything clinical and does not mean a payout".

## Relationships corrected from the supplied diagram (15)

| # | Supplied diagram | Problem | On the site |
|---|---|---|---|
| 1 | Bank / custody → "milestone-gated programme spend" → Operational milestone review → NWPharmaTech sponsor → "Protocol · dose · endpoints · safety" | A funding milestone appears to authorise clinical decisions | Money released against milestones pays for research work. The financing lane has no link into clinical decisions, and the text says no milestone can authorise one |
| 2 | Investigators, ethics committees and regulators all point into one "Protocol · dose · endpoints" node, beside the sponsor | Implies one shared command structure | Four separate roles, each with its own duties, stated as "not one chain of command" |
| 3 | "Bank / custody, dual control" | Presents a custody arrangement as part of the structure; it is not in the agreed financing content | Left out until agreed (see open item C) |
| 4 | "Eligible, verified investors → private legal documents" | Leaves out the agreed route | Adds "checked by a regulated investor platform", as agreed |
| 5 | Whole private process: "if developed" | Header only | Every private-lane item sits under a "Proposed; only if it goes ahead" label; the explorer marks three of five layers "Proposed" |
| 6 | "source-controlled" (brief) | Could be read as verified | Not used. The diagram is labelled "Proposed structure, simplified" |

## Open factual relationships (need the production source or management)

- **A. Sponsor.** The site now says "NWPharmaTech is developing the proposed CHR-P programme. Formal study responsibilities will be documented before the study begins." (management instruction, 24 Sep 2026). Earlier instructions identified NWPharmaTech as sponsor of the proposed company programme. Still to reconcile, internally: whether the planned Phase 2B is that company-sponsored programme or a separate investigator-led or grant study (`docs/preview-handoff.md`).
- **B. Who reviews milestones, and what the milestones are.** The site says only that the vehicle "would release money in stages against defined operational milestones". The reviewer, the milestones and how this relates to today's control (spending is controlled by the company board) are not in the agreed content.
- **C. Custody and dual control.** Not in the agreed content, so left out. If agreed, add it as proposed.
- **D. Live pages the brief cites:** `/how-it-works`, `/proposed-token`, `/updates/how-desci-could-help`, `/about`, `/faq`.
  - The brief quotes content from them that this preview does not contain: "qualifying receipts", "distributions may be zero", no parent equity, no medicine or patient-data ownership.
  - Whether those routes are current or retired, and whether that wording is agreed, can only be settled against the production source.
  - Nothing from them was reproduced or restored here.
- **E. Regulator.** The site names the MHRA as the UK example. The Phase 2B countries are not public, so the text says "the medicines regulator in each country".

## Not in this preview

- The first scientific portfolio (`NWPT-visual-portfolio-01.zip`) has not been supplied; only this DAO package has.
- Team portraits: none are in this package. That work continues separately.
- Deferred, as instructed: the register-conflict simulator and the animated financing lifecycle.
