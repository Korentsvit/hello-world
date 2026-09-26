# Enquiry activation checklist ("Explore a research collaboration")

> **Summary for action:** `ENQUIRY-ACTIVATION-HANDOFF.md` records what is settled (the recipient, the public wording "the NWPharmaTech team", roles, no response-time promise) and what remains (email service account, sender, retention, lawful basis, data location). This checklist keeps the detail.

Status: **online enquiries disabled** on production (`6affaba`). Nothing below is switched on. This checklist is for the decision to enable the form.

## A. Already built (in production, dormant)

- `functions/api/enquiry.js`:
  - **Unconfigured behaviour:** it fails closed until every setting exists. `GET` reports `configured:false`; `POST` answers `503 not_configured`.
  - **What a submission goes through:** field and card validation, a honeypot field, a content-version check, Turnstile verification, and one email through Resend.
  - **The email itself:** it goes to the recipient with the visitor as reply-to. Company text comes from the site's own card data; the visitor's text is labelled as theirs.
  - **Success reporting:** `202` with a reference only when the email service returns a message id.
- **Duplicate protection:**
  - The button is locked while a submission is in flight.
  - An idempotency key (a hash of the payload plus a per-tab random value) goes to Resend and to Turnstile, so retrying the same enquiry delivers once.
- **Page behaviour:**
  - The page shows "Contact about collaboration" while enquiries are off, and changes to "Send a non-confidential enquiry" once they are configured.
  - It reports "submitted" only on acceptance, with wording that separates acceptance from inbox delivery. Every failure says nothing was confirmed as sent.
- **Security headers:** the page-specific CSP allows only `challenges.cloudflare.com` for the security check. `/functions/*` is never served.
- **Tests:** `tools/test-work-with-us.mjs` covers validation, provider failure, a dropped connection with retry, duplicate clicks and URL privacy, against local mocks. `tools/test-deploy-layout.mjs` checks that the API runs and source files are not served.

## B. Decisions for Filipp

1. **Accountable recipient: decided 26 Sep 2026.** `ENQUIRY_TO = Filipp.korentsvit@nwpharmatech.com` (Filipp handles enquiries for now; receiving inbox, not the sender).
2. **Email service.** Confirm Resend (the code targets it) and its account, data-processing terms and region. Choosing another provider means a small code change.
3. **Sending address.** Pick an address on a domain verified with the provider (`ENQUIRY_FROM`), with SPF and DKIM in DNS. Decide whether it is a subdomain.
4. **Retention.** How long enquiries are kept in the mailbox and at the provider, and how they are deleted.
5. **Lawful basis and controller wording** for the privacy notice, confirmed by legal.
6. **Response expectations:** whether visitors are told a response time.
7. **Go-live date:** whether enquiries open on production directly, or on the preview first (recommended).

## C. Configuration (Web Boss, once B is settled)

Set these in the Pages project, in Preview first and then Production:

| Name | Kind |
|---|---|
| `ENQUIRY_TO` | plain |
| `ENQUIRY_FROM` | plain |
| `RESEND_API_KEY` | secret |
| `TURNSTILE_SITE_KEY` | plain; the widget hostnames must include the preview and production hosts |
| `TURNSTILE_SECRET_KEY` | secret |

Never set `ENQUIRY_TEST_MODE`, `ENQUIRY_PROVIDER_URL` or `TURNSTILE_VERIFY_URL` in Production. Configuration takes effect on the next deployment; no code change is needed.

## D. Privacy (before the form is live)

- Apply Part B of `PRIVACY-NOTICE-UPDATE-NWPT-041.md` with the decided provider, recipient, retention, data location and lawful basis, and update "Last updated".
- It must be published in the same release that switches the form on, not before and not after.

## E. Tests before enabling on production (on the preview, with the real settings)

1. `GET /api/enquiry` returns `configured:true`, the site key, and `testMode:false`.
2. **Real inbox delivery:**
   - Submit a test enquiry, and confirm it arrives in the `ENQUIRY_TO` inbox (not spam) within a few minutes.
   - The subject, reference, company text, visitor-labelled questions and message should all be correct.
   - Reply-to should reach the tester, and the provider's dashboard should show "delivered".
3. **Retry handling:**
   - Submit, simulate a lost response, then resubmit the same enquiry. Exactly one email should arrive, with the same reference.
   - Submit a changed enquiry; it should arrive as a new email.
4. **Duplicate clicks:** repeated clicks during a slow network give one email.
5. **Failures:**
   - With a wrong recipient or a revoked key, the page never says "submitted".
   - A failed security check is refused. After deleting any setting, the page returns to "not available … nothing has been sent".
6. **Privacy:** no visitor text appears in URLs or logs, and the provider's retention matches the notice.
7. Run `tools/test-work-with-us.mjs` and `tools/test-deploy-layout.mjs` against the release commit.

**Record:** note system acceptance (the `202` reference) separately from confirmed inbox delivery (steps 2–3), with dates and the tester.

## F. Switching off again

Remove `ENQUIRY_TO`, or any other required setting, and redeploy. The form falls back to the unavailable message with the Contact route. Keep the rollback deployment ID from the release record.
