# Production baseline (recorded 27 September 2026)

Web Boss has published the homepage discoverability release (NWPT-046) to production (www.nwpharmatech.org).

| Item | Value |
|---|---|
| Commit | `6e997ddf02513bbb23a909f24f676e4e776b8272` (branch `claude/nwpt-homepage-discoverability`) |
| Cloudflare deployment | `0b58051d-59cf-4caf-b6a4-0b9184b4803e` |
| Rollback deployment | Not supplied with this record. The previous production deployment was `af37bb7e-62aa-41f8-94da-3ee71694ec51` (`6affaba`) |
| Deployed directory | `nwpharmatech-website/release-032/site` |
| Hosting owner | Web Boss |

**Contents:** everything in `6affaba` (below), plus:
- the homepage hero quick links and the "Explore the programme in depth" band (Programme Room, Work with us, Funding overview);
- the homepage sticky-header keyboard-focus fix;
- stylesheet key `nwpt046`.

Record: `HOMEPAGE-DISCOVERABILITY-NWPT-046.md`.

**Not in this baseline:** online enquiries (disabled; `/api/enquiry` unconfigured) and privacy Part B. The final privacy candidate must be built on this commit, not on `bfbf132` alone.

---

# Previous baseline (recorded 26 September 2026)

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
