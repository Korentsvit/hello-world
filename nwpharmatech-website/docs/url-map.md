# Routes and redirects

## Public routes (staging draft 3)

| Route | Page | Section (menu group) | Change since draft 2 (f8e07d8) |
|---|---|---|---|
| / | Home | none | Adds "Programme in 90 seconds", the brief near the top and the latest real update |
| /clinical-need.html | Clinical need | The research | Discreet source links |
| /science.html | Science and formulation | The research | **Rebuilt:** three questions and a diagram. The study cards moved to the evidence library |
| /evidence.html | Evidence library | The research | **Rebuilt:** filters, study cards, citations. Anchors are `#ref-<id>` and `#cat-<category>` (the old `#need`, `#cbd` and `#psychosis` anchors are replaced) |
| /families.html | For young people and families | The research | **New** |
| /programme.html | Programme overview | The programme | The design table moved to the study hub; `#phase-1` moved to /phase-1.html |
| /study.html | The study: progress and evidence | The programme | **New.** Anchors: `#milestones`, `#documents`, `#publication-policy` |
| /phase-1.html | Phase 1 study | The programme | **New.** Anchor: `#results` |
| /updates.html | Programme updates | The programme | Generated from updates.json |
| /people.html | People | About | Profile cards from people.json |
| /financing.html | Funding and financing | About | Adds funding transparency (noindex, not in the sitemap) |
| /newsroom.html | Newsroom | About | **New.** Anchors: `#corrections`, `#standards`, and `#signup` (optional builds only) |
| /faq.html | Questions and answers | About | Anchor: `#urgent-help` |
| /contact.html, /legal.html | Contact; Legal | About | — |
| /downloads/nwpharmatech-programme-brief.pdf | Brief (v3, generated) | none | Regenerated |
| /downloads/appointment-preparation-sheet.pdf | Appointment sheet | none | **New** |
| /downloads/nwpharmatech-references.ris and .bib | Citations | none | **New** |

**Anchor changes needing care:** `programme.html#phase-1` is now `phase-1.html`. Fragment redirects are not possible server-side, so update any links you control.

**Restricted project** (a separate hostname behind Access): `/`, `/financing-structure.html`, `/investor-journey.html`, `/funding-figures.html`. `interest-registration.html` from draft 2 is replaced by `investor-journey.html`.

**Convenience redirects:** see `src/redirects.txt`.

## Old live site to new: not completed
The live sites couldn't be reached from the build environment. Supply the list of live URLs (missing input 22), and each will be mapped to its nearest route above.
