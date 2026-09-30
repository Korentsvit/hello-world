# NWPT-036b: close-out on NWPT-036 (existing preview, after NWPT-036 is reviewed)

NWPT-036b is NWPT-036 (`3eb6b7bc3cbb889e79866148e870a21cc1086a10`) plus the close-out below. It has the same deployment directory, `nwpharmatech-website/release-032/site/`, and it is for the existing preview only. The commit is given in the covering reply. Production stays on NWPT-035.

| Change | Files |
|---|---|
| The two-page PDF is renamed and retitled "Programme summary" (version 8). It points to the full brief. The old file name redirects (301) | `downloads/nwpharmatech-programme-summary.pdf` (new), `downloads/nwpharmatech-programme-brief.pdf` (removed), `_redirects` |
| Study and Newsroom: links to the primary brief, plus a clearly labelled summary PDF | `study.html`, `newsroom.html` |
| The primary brief shows "Draft for review" while it awaits approval; its PDF is regenerated to match | `resources/programme-brief.html`, `resources/NWPharmaTech-CHRP-programme-brief-v2026-09-26.pdf` |
| Homepage panel: version line shows "draft for review"; new size; cover re-rendered | `index.html` (panel only), `assets/visuals-034/programme-brief-cover-*.webp` |
| Label style; stylesheet cache key `nwpt036` on every page | `styles.css`, all pages (the `<link>` line only) |

The seven portraits, the Team page and the homepage video are unchanged apart from the stylesheet cache key.

## Please verify on the preview

- `/resources/programme-brief` shows the draft label, and its PDF does too.
- `/downloads/nwpharmatech-programme-brief.pdf` answers 301 to `/downloads/nwpharmatech-programme-summary.pdf`.
- The Study and Newsroom links work.

## Please also return

The **Cloudflare deployment timestamp of NWPT-035** (deployment `c3e85514-2052-4b89-b5e8-9032efd20a4d`). The correction logs use its date.
