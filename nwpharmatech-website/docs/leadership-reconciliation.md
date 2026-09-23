# Leadership reconciliation (23 September 2026)

Internal. Checks the people page against the latest management instructions and the company records. Data: `content/people.json` (the wording of every record is in `role_records`, `descriptor_records` and each responsibility's `records`); sources: `content/sources.json`.

**Records:** D23 = Pitch Deck FK2, 15 Aug 2023 · O25 = draft outreach email, 27 Apr 2025 (drafted as from Kane and Woods; not known to have been sent) · W25 = 'Web3' draft deck, 30 Oct 2025 (superseded) · E26 = CEO's board circulation email, 14 Jul 2026 (no titles; recipients are not stated to be the Board) · T26 = Series A teaser, 7 Aug 2026 (not authoritative for current appointments).
**Management instructions:** M3 = round 3 ("Make Scott Woods's CHR-P role prominent. Keep John Kane's and Grace Blest-Hopley's actual responsibilities clear. Do not invent committee appointments.") · M4 = round 4, the latest (Woods changed to an adviser, two chairmen listed, Trevor Jones omitted; do not treat the teaser as authoritative).

| Person | Staging a4e31c4 showed | Records (short) | This release shows | Management to confirm |
|---|---|---|---|---|
| Dr Scott W. Woods | "Adviser on clinical high risk of psychosis" | No title in any record. W25 "Additional Advisor Input ... on trial design"; T26 "CHR-P authority" | Featured; no title (M4); a line derived from W25: CHR-P expertise for the planned Phase 2B design | How his role is described |
| Dr John M. Kane | "Chair, Scientific Advisory Board" | D23 "Senior Psychiatric Advisor"; W25 "Principal Investigator, relapse-prevention studies"; T26 "SAB Chair" (teaser only) | No title; descriptor "Clinical trial design" (W25, T26); no responsibility line | Whether an SAB exists, and its chair; his title; whether he leads the CHR-P Phase 2B design (W25's was relapse prevention) |
| Filipp Korentsvit | "Chief Executive Officer and Founding Partner" | CEO in D23, W25, T26; "Founding Partner" only in his 2026 signature | "Chief Executive Officer" | Whether to add "Founding Partner" |
| Daud Gutseriev | "Chief Operating Officer" | COO in D23 and T26 only; W25 "Co-founders" | No title; descriptor "Co-founder" (D23, W25); no responsibility line | His title and remit |
| William Jarosz | "Executive Chairman" | D23, T26 "Executive Chairman"; T26 also has Barker "Non-Executive Chairman" | No title | Who chairs the board; his title |
| Prof. Richard Barker OBE | "Non-Executive Chairman" | D23 and W25 "Senior Advisor(s)"; T26 "Non-Executive Chairman" | No title | His title |
| Dr Gillian Cannon | "Non-Executive Director" | W25 "Board Member"; T26 "NED" | "Board Member" | Whether "Non-Executive Director" is right |
| Prof. Trevor Jones CBE | Absent | D23 "Senior Regulatory and Clinical Advisor"; W25 "Senior Advisors"; not in T26 | Restored as "Senior Adviser" | His title |

Unchanged: Dr Grace Blest-Hopley, "Chief Scientific Officer" (D23, W25 and T26 agree). Still not listed, as in a4e31c4: Max Moldaschl, Prof. Matthew Walker, Dr Ian Hudson, Prof. Gennady Shvarts and Prof. Christine Allen (all in D23); management to say whether to list any of them. For everyone: written confirmation of the title, written consent to publish the profile, and a primary check of each index-level biography.

## Title rules

Checked by `buildlib/content.py` on every build (staging included); tests in `tools/test_people.py`.

- **confirmed:** `role_records` holds a management confirmation (source type `company-instruction` or `confirmation`, dated after 23 September 2026) whose wording contains the title. None yet.
- **records-agree:** at least two records give the title, and at least one of them is dated 2025 or later and is not the teaser. A record gives the title when its `title` (quoted from its wording) contains every word of it; CEO, CSO, COO and NED are read in full. No record may give a different title unless it is marked `compatible` (held alongside, as with Korentsvit's "Founding Partner"). Never a chair or committee title. Where the wording differs in detail, only the shared part is shown (Cannon, Jones). Shown on staging; blocks production.
- **unconfirmed:** anything else. No title is shown, only the descriptor. Blocks production.
- **The August 2026 teaser** can only corroborate. It is never the only 2025–2026 support for a title or a responsibility, and it corroborates neither chair title because it names two chairmen.
- **Descriptor:** a field of expertise, remit or neutral description, never a title; two supporting records, at least one of them not the teaser. **Responsibility:** a supporting record dated 2025 or later other than the teaser.
- **Consent and biography:** `consent_to_publish` (the person's written consent) must be true, and `bio_verification` must be `document` or `primary`, as for facts. Until then the profile blocks production.
- `tools/qa.mjs` fails if any public or restricted page, PDF, PDF source or integration fragment shows a chair or committee title that management has not confirmed.

## Biographies

Levels as in `facts.json`. **document:** every statement is in a company record (the person's consent to publish is the check on it). **index:** at least one statement rests on a web search summary; blocks production until a primary check.

| Person | Level | Basis |
|---|---|---|
| Woods | index | O25 (Yale posts); search summaries (reference-verification.md row 19; reference-verification-2.md row 15) |
| Kane | index | D23 (Zucker School professorship); Feinstein post and trial leadership from search summaries (row 19; round 2 row 16) |
| Blest-Hopley | document | D23: "Ph.D. in the actions and effects of cannabinoids at King's College London"; T26 "cannabinoid neuropharmacology" |
| Korentsvit | document | D23: "Executive Director at Goldman Sachs"; "Bachelors of Science in Economics and Statistics from the University College London" |
| Gutseriev | document | D23: "Associate Director at VTB Capital - Infrastructure Capital & Project Financing"; "Executive MBA from University of Oxford - Saïd Business School" |
| Jarosz | document | D23: "Accomplished business leader, with a background in finance and pharma"; "MA in Law and Diplomacy from Tufts University and a JD from Harvard Law School" |
| Barker | index | D23 (ABPI, Chiron, Celgene); the years 2004–2011 from a search summary (row 19) |
| Cannon | index | W25 and T26 (Merck, Otsuka); "senior roles" from a search summary (row 19). UCB is in that summary only, in no company record: not used |
| Jones | index | Log below |

D23 quotations are from the full text of the team slide, not the shorter records extract.

## Trevor Jones: verification log

Level: **index** (web search summaries only; primary pages not opened). All searches on 23 Sep 2026. A statement is used only if it is in the company records and a summary confirmed it.

| Query | What the summary said | Used |
|---|---|---|
| Professor Trevor Jones CBE former Director General ABPI Wellcome Foundation research and development director | Visiting professor at King's College London; former head of R&D at Wellcome; main board director of the Wellcome Foundation 1987–94, responsible for R&D; Director General of the ABPI for 10 years until September 2004; CBE in 2003 | "Former research and development director at the Wellcome Foundation" (W25: "former Wellcome R&D head"); CBE (D23). ABPI not used: it is not in the company records for him |
| Trevor Jones European Medicinal Cannabis Association chair | Appointed chairman of the European Medicinal Cannabis Association; chairman 2019–2022; previously Group R&D Director at the Wellcome Foundation and a director of Allergan | "Former chair of the European Medicinal Cannabis Association" (D23: "until recently Chair") |
| Professor Trevor Jones visiting professor King's College London Institute of Pharmaceutical Science | Is a visiting professor at King's College London; Vice Chair of King's College London 2000–2008 | "Visiting Professor, King's College London" (D23). The Institute is not named: the summaries did not confirm it |

Sources named in the summaries: en.wikipedia.org/wiki/Trevor_M._Jones; europeanpharmaceuticalreview.com (news 110591); thecmcuk.org/proftrevorjones; openaccessgovernment.org (EUMCA contributor profile).
Not used: "senior leader in the global pharmaceutical sector" (D23, present tense; no summary says it), "FRS" (W25; the summaries give FMedSci), "Teva" (W25; not checked), "several senior governmental commissioner roles" (D23; too general to check).
