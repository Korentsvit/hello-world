# NWPT-036: hand-off to Web PR (existing preview)

NWPT-036 is NWPT-035 (Grok's portrait release, `4b0158f`, live as deployment `c3e85514`) plus the editorial patch below. **Deploy to the existing preview only.** Production waits for Filipp's approval.

## What to deploy

- **Repository:** `Korentsvit/hello-world`, branch `claude/nwpharmatech-website-bs459b`, at the commit given in the reply that accompanies this note (the head of the branch).
- **Deployment directory:** `nwpharmatech-website/release-032/site/`. Deploy it as it is:

```
cd nwpharmatech-website/release-032/site
npx wrangler pages deploy . --project-name=<the nwpt-837794c-preview project>
```

- **Contents:** public website files only. Internal notes live beside the folder, not in it (`release-032/records/`, `*.md`).

## Changes against NWPT-035

| Page or file | Change |
|---|---|
| All seven portraits, Home and Team wiring | **Unchanged**, exactly as NWPT-035 deployed them |
| `faq.html` (urgent help) | Removed "checked in the Claude package". The numbers were checked against official sources on 26 Sep 2026. Pieta: added "or text HELP to 51444" |
| `evidence.html` | Corrections section records the 26 Sep 2026 transition-figure correction; review history has a new dated row |
| `newsroom.html` | Corrections log records the same correction, linked to the evidence card |
| `study.html` | "Not the Programme Room" removed from the description metadata and body |
| `study`, `phase-1`, `science`, `families`, `evidence`, `newsroom` | Build comments removed from page source |
| `resources/programme-brief.html` | Version 2026-09-26. Adds the pooled transition figure, the NICE line, Phase 1 status, the pack's financing sentence and the Salazar reference |
| `resources/NWPharmaTech-CHRP-programme-brief-v2026-09-26.pdf` | New; printed from the HTML brief. The v2026-09-22 and v2026-09-20 PDFs are removed and redirect here (301) |
| `downloads/nwpharmatech-programme-brief.pdf` | Version 7: programme-lead line added |
| `index.html` | Brief panel: new PDF link, cover rendered from its first page, "Version 2026-09-26 · PDF, 3 pages, 120 KB". Nothing else on Home changed |
| `programme.html`, `updates/index.html` | Brief PDF link and version text updated |
| `assets/team/README.txt`, `assets/visuals-033/manifest.json` | Internal notes, no longer publicly served; moved to `release-032/records/` |
| `_redirects` | Two redirects added (the old brief PDFs) |

## Checks run here (targeted)

- **`check-pages.mjs`: 234 of 234.** It covered 12 changed pages at 390 and 1280 px:
  - images load;
  - no console errors;
  - no horizontal scroll;
  - axe WCAG 2.2 AA;
  - one h1;
  - 75 internal links and anchors.
- **`test-nwpt034.mjs`: 34 of 34.** Hero video and pause control, navigation by keyboard and touch, brief links, 404, PDFs and redirects.
- **Portraits:** all seven load on the correct named cards on Team, and the three on Home; Gillian Cannon keeps her initials.
- **Staging rebuild:** it renders the same seven portraits, and rerunning `add-portraits.mjs` changes nothing.

## Please verify on the hosted preview, then return the results

1. `/team` and `/` show the seven portraits as on production.
2. `/faq#urgent-help` has the new sources line and no internal wording.
3. `/evidence#corr-h` and `/newsroom#corrections` show the dated correction.
4. `/resources/programme-brief` shows version 2026-09-26, and "Download PDF" opens the 3-page PDF. `/resources/NWPharmaTech-CHRP-programme-brief-v2026-09-22.pdf` answers 301 to it.
5. The homepage hero video and pause control, navigation and downloads work as before.

Return the preview URL, deployment ID, deployed commit and the preview's access status.
