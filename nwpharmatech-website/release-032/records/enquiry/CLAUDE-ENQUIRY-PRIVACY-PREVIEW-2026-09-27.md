# Claude — Enquiry privacy wording for preview enablement

**Date:** 2026-09-27 (Europe/Vienna)  
**From:** DAO Web PR Boss (hosting)  
**Status:** Resend verification and preview credential setup are **complete**. No further account-setup work from Claude. Apply Part B privacy on a commit that Web PR will deploy to **`nwpt-837794c-preview` only**, then enable the form in the **same release** so privacy never describes enquiries as inactive while the form accepts submissions. **Production enquiries stay disabled; production configuration unchanged.**

## Settled for Part B (use these exact names)

| Item | Value |
|---|---|
| Email service | **Resend** (matches `enquiry.js`) |
| Recipient | Collaboration enquiries to **Filipp Korentsvit** at `Filipp.korentsvit@nwpharmatech.com` (`ENQUIRY_TO`) |
| Sender (transactional) | `NWPharmaTech website <website@nwpharmatech.org>` (`ENQUIRY_FROM`) — send-only via Resend; not the collaboration inbox |
| Reply-to | Visitor’s submitted email (already implemented) |
| Anti-abuse | Cloudflare Turnstile (preview host only for now) |
| Host scope (preview) | `nwpt-837794c-preview.pages.dev` — no wildcard; no www widget yet |

## Confirmed Resend facts (for privacy wording — no credentials)

| Fact | Value | Confidence |
|---|---|---|
| Domain | `nwpharmatech.org` | **Verified** in Resend (ready to send) |
| Account owner (dashboard display name) | `filippkorentsvit` | Confirmed by Filipp (company Resend; Google sign-in) |
| Sending region | **Ireland / eu** | Confirmed by Filipp in Resend domain settings |
| DNS provider shown in Resend | Cloudflare | Confirmed; no further Resend DNS needed for sending |
| Inbound receiving via Resend | **Not used** | Filipp decision — collaboration replies stay on the company mailbox path only |
| Resend API key / Turnstile secrets | — | **Do not include.** Web PR holds these on preview Pages only |

## Retention / transfers — mark unknowns (do not invent)

| Topic | Status for privacy copy |
|---|---|
| Resend processing of enquiry payloads (transmission to deliver the email) | **Confirmed for wording:** Resend is the transactional email processor for collaboration enquiries submitted through this form. |
| Resend **data retention period** for message content / metadata after send | **UNKNOWN** — not confirmed by Filipp or Security for this notice. Leave a clearly labelled **Unresolved** line, or cite only what Security/Legal already approved. Do **not** invent a retention period. |
| NWPT mailbox retention for received enquiry emails (`Filipp.korentsvit@nwpharmatech.com`) | **UNKNOWN** — company mailbox policy not supplied for this handoff. Leave **Unresolved** unless Filipp/Security provide a period. |
| Lawful basis / international transfers (Resend / Cloudflare) | Use the shortest accurate wording already approved by Security/Legal if available; otherwise leave **Unresolved**. Do **not** invent. |
| Cloudflare Turnstile (bot protection on the form) | **Confirmed for wording:** Turnstile runs on the preview enquiry form host only. Widget scoped to `nwpt-837794c-preview.pages.dev`. |

## Please prepare / ship (one commit Web PR can deploy)

1. Fill Part B placeholders in `site/privacy.html` (see `records/PRIVACY-NOTICE-UPDATE-NWPT-041.md` Part B) with the settled names and confirmed Resend facts above.
2. For retention / lawful basis / transfers: shortest accurate approved wording if available; otherwise clearly labelled **Unresolved** — never invent.
3. **Coordination with enablement:** privacy on this commit must describe Resend + Turnstile + recipient as **active for preview** (not “online enquiries are not active”). Web PR will set `ENQUIRY_TO` / `ENQUIRY_FROM` on preview in the **same release** as deploying your commit so the page wording and form state match.
4. Hand Web PR the **exact commit SHA**. Target host: **`nwpt-837794c-preview` only**. Do **not** request production cutover.
5. Confirm duplicate / idempotency behaviour remains as implemented (retried submit / lost response does not create a duplicate email).

## Out of scope for Claude

- Resend account, DNS, API keys, Turnstile keys (already done by Web PR + Filipp)
- Production activation or any change to www / `nwpt-preview` enquiry config
- Newsletter / Buttondown

## Approved preview env values (Web PR will set after your privacy commit is deployed)

- `ENQUIRY_FROM` = `NWPharmaTech website <website@nwpharmatech.org>`
- `ENQUIRY_TO` = `Filipp.korentsvit@nwpharmatech.com`

## Web PR after your commit

Deploy exact SHA to `nwpt-837794c-preview` → set From/To (preview only) → labelled synthetic tests (inbox delivery, reply-to, repeated clicks, retry after lost response) → report service acceptance vs confirmed inbox delivery. Production enquiries remain disabled.
