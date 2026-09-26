# Production baseline (recorded 26 September 2026)

Web Boss has confirmed that NWPT-044 is live on production (www.nwpharmatech.org).

| Item | Value |
|---|---|
| Commit | `6affabafe67ea049e732f6e15f16df16823cbb93` (branch `claude/nwpt-funding-hero`) |
| Cloudflare deployment | `af37bb7e-62aa-41f8-94da-3ee71694ec51` |
| Rollback deployment | `6c0ca97e-6efc-4bd8-9a84-87f14f48119e` |
| Deployed directory | `nwpharmatech-website/release-032/site` (Pages Functions in `site/functions/`) |
| Hosting owner | Web Boss |

## What this baseline contains

- **Programme Room** at `/programme-room` (NWPT-039/040): the six-stage explorer, work-status and source-type labels, dated milestones, open questions and source disclosures. It includes the sticky-header keyboard-focus fix (`0c39278`).
- **Work with us** at `/work-with-us` (NWPT-041): the "Explore a research collaboration" journey (focus questions, 26 evidence cards, agenda, dated brief, share link). It is in the Programme menu, the footer and the Contact research card.
  - The review fixes are included: open questions show "Unresolved"; "Contact about collaboration" while enquiries are off; "No account is needed …".
  - `/api/enquiry` is deployed but **unconfigured**. Online enquiries are disabled and the page says nothing is sent.
- **Privacy notice**: Part A (the browser-only planning workspace) is applied, "Last updated: 26 September 2026". Part B, the enquiry form, is **not** applied.
- **Funding page film** at `/funding-use` (NWPT-044): 21:9 and 4:3 with posters, reduced-motion, Save-Data and no-JavaScript fallbacks, and a Pause/Play control.
- Unchanged from earlier: the homepage and Science brain videos, the portraits, the programme brief and summary PDFs, the redirects, and the existing scientific and financing wording.

## Not in this baseline

- Online enquiry delivery: no email service, recipient or Turnstile keys. See `ENQUIRY-ACTIVATION-CHECKLIST.md`.
- Launch copy (founder post, invites, fact sheet): drafts owned by Grok; nothing is published from them.

Earlier preview handoffs (NWPT-039 to NWPT-044) are complete and superseded by this baseline. Record-only commits after `6affaba` change nothing under `site/` and need no rebuild or deployment.
