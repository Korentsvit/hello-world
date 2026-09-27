# Enquiry activation handoff: "Explore a research collaboration"

**Status:** online enquiries are **disabled** on production (`db61de444c3785cda56076a54066835e6a6f4a86`, deployment `45620d96-71a8-41de-a334-9b2d8397afe7`, 27 Sep 2026; previously `91de637`).

**Privacy candidate base:** the final privacy candidate is built on the latest production baseline, with `bfbf132`'s privacy changes merged in (a trial merge onto `6e997dd` was clean; re-check against the current production baseline (`db61de4`) when preparing it and keeps the homepage shortcuts and focus fix). A branch based only on `bfbf132` must not be deployed. They stay disabled until the section 2 decisions are made, section 3 is configured on the preview and section 4 has passed. No redeployment is requested now.

**27 Sep 2026 update:**
- **Web Boss setup (Web Boss report):**
  - Resend reports `nwpharmatech.org` as verified, with sending region Ireland (EU).
  - A Turnstile widget covers `nwpt-837794c-preview.pages.dev` only.
  - The preview project holds the Resend and Turnstile credentials. `ENQUIRY_FROM` and `ENQUIRY_TO` are deliberately unset, so the form is off.
  - Production has no enquiry secrets.
- **Settled:** the sender is `NWPharmaTech website <website@nwpharmatech.org>` (send-only; inbound through Resend is not used).
- **Privacy Part B:** applied on the preview candidate (branch `claude/nwpt-enquiry-preview`). The remaining open items are the P1, P2 and P3 decisions, now listed publicly under "Not yet confirmed".

**27 Sep 2026: preview tests (Web Boss hosted testing; reports `CLAUDE-ENQUIRY-PRIVACY-PREVIEW-2026-09-27.md` and `CONSOLIDATED-RESULT.md`).**
- **Candidate:** `646693df8b4586eb418e432e24a0e9d46879250f` on `nwpt-837794c-preview`.
- **Test deployment:** `ea40c233-78c6-4a98-82a9-2c85243df80a`, since deleted.
- **Synthetic tag:** `NWPT-SYNTH-20260927-7e97f8`.
- **Reference:** **`WWU-E453F947`**. Resend reports `last_event=delivered`, and **Filipp confirmed inbox receipt**.
- The results below are Web Boss's hosted tests. They are **not** re-run or inferred by Claude.

| Section 4 test | Status | Evidence (Web Boss) |
|---|---|---|
| 1 Configuration (`GET /api/enquiry` with `configured:true` during the test) | Not reported | After the disable redeploy the endpoint returns `configured:false` (see below) |
| 2 Page wording, security check and review step | Not reported | — |
| 3 Real inbox delivery | **Passed** | HTTP 202 with `WWU-E453F947`; Resend `delivered`; Filipp confirmed the inbox |
| 3 Reply-to | **Passed** | Resend `reply_to` is the synthetic visitor address (`@example.com`) |
| 4 Lost-response retry: the unchanged enquiry is resent | **Passed** | Resubmitting the same key and token → 202, same reference, no new email |
| 4 A changed enquiry arrives as a new email | Not reported | — |
| 5 Repeated clicks / same idempotency key | **Passed** | Four POSTs with the same key and token → four 202s with the same reference; Resend holds **one** email |
| 6 Failures: missing Turnstile token | **Passed** | 400 "Complete the security check." |
| 6 Failures: honeypot filled | **Passed** | 400 "The enquiry could not be accepted." |
| 6 Failures: wrong content version | **Passed** | 409 `code: version` |
| 6 Failures: malformed JSON | **Passed** | 400 "The enquiry could not be read." |
| 6 Failures: wrong recipient or revoked key reports "nothing confirmed as sent" | Not reported | — |
| 6 Removing a variable returns the "not available" message on the page | Not reported | The API returns `configured:false` after `ENQUIRY_TO`/`ENQUIRY_FROM` were removed. The page message was not reported |
| 7 No visitor text in any URL | Not reported | — |
| 7 Provider retention matches the notice | Open | Resend documents 30 days on Free, Pro and Scale; the account's plan is unknown (W1) |
| 8 Automated checks (Claude) | Not part of this report | — |

**Preview submissions are disabled again** (Web Boss, 27 Sep 2026 ~01:33 CEST):
- `ENQUIRY_TO` and `ENQUIRY_FROM` are removed from the preview project; the Resend and Turnstile credentials are kept.
- The same SHA was redeployed as `8b0027bf-bb4d-405d-ab27-8267f3ce8fba`.
- The stable preview host and `www.nwpharmatech.org` both return `configured:false`.

**No further test emails or enquiry deployments** are requested.

**Cloudflare Access on the preview host is not applied.** Filipp needs to create a Zero Trust Access application in the dashboard, because Web Boss's API access was refused (403). Until then the preview stays public and its form stays off.

**Production stays disabled.** Activation still needs:
- the unreported checks above, including URL privacy;
- the privacy decisions (`records/enquiry/PRIVACY-DECISION-SHEET.md`);
- the open provider facts below;
- Filipp's approval.

The privacy follow-up `bfbf132` (precise storage wording, sending-region caveat) is a separate candidate. Its public "Not yet confirmed" notice must not go to production.

## Provider and logging facts (Web Boss review, 27 Sep 2026)

Web Boss confirmed these through the company Resend API, the Cloudflare Pages APIs and the official pages cited in its report. Claude has not re-checked them; its own earlier search leads are superseded where a row is confirmed. The **Status** column keeps provider documentation separate from account settings.

| # | Fact | Status | What Web Boss reported |
|---|---|---|---|
| W1 | Resend retention | **Confirmed (provider docs)**; plan **unknown** | Message content and delivery logs are kept 30 days on Free, Pro and Scale; Enterprise is flexible. After termination, data is deleted within 90 days, backups 7 days (resend.com/security/gdpr). The plan name is not available via the API; Filipp can read it at Resend Dashboard → Billing |
| W2 | Resend storage location | **Confirmed (provider docs)** | Customer data is stored in the **United States**. The domain region (`eu-west-1`, Ireland, confirmed on the account) controls the sending path only, not storage (resend.com/security/gdpr; resend.com/docs/dashboard/domains/regions) |
| W3 | Resend transfers and DPA | **Confirmed (provider docs)** | Transfers rely on SCCs in the DPA plus the EU–U.S. Data Privacy Framework. The Article 28 DPA is pre-signed and executed on signup (signed PDF; also under Settings → Documents). The DPA version date was not reported |
| W4 | Resend subprocessors | Not reported | — |
| W5 | Resend idempotency-key retention | Not reported | — |
| W6 | Turnstile | **Partly confirmed (provider docs)** | The Turnstile Privacy Addendum applies. Per Cloudflare's Turnstile docs, Turnstile does not access form field contents. A fixed Turnstile retention period was **not found**. Cloudflare's controller or processor role was not reported |
| W7 | Cloudflare transfers and localisation | **Partly confirmed** | A Cloudflare Customer DPA is available (v6.4, 3 Apr 2026). The transfer mechanism and any account localisation setting were not reported |
| W8 | Workers Logs / Logpush | **Partly checked (account setting)** | On the **preview** project's Pages workers (production and preview slots): `logpush: false` and no tail consumers found. This shows Logpush is off and no tail consumer is attached; it does **not** show that all logging is disabled. **Unknown:** account-wide Logpush jobs and Workers Observability (API 403), and the production Pages project |
| W9 | Mailbox host for `nwpharmatech.com` | Not reported | — |
| W10 | Section 4 results | Reported above | URL privacy and the other rows marked "Not reported" remain open |

**Already built and live, dormant:**
- `/api/enquiry` fails closed until all five settings exist.
- The page switches its wording automatically, from "Contact about collaboration" to "Send a non-confidential enquiry", once the API reports it is configured.
- It shows "submitted" only after the email service accepts the message, and a retry of the same enquiry delivers once (idempotency key).

No code change is needed. The only website change at activation is publishing privacy Part B (section 3, step 5).

Full detail on each item: `ENQUIRY-ACTIVATION-CHECKLIST.md` and `PRIVACY-NOTICE-UPDATE-NWPT-041.md`.

## 1. Settled (26 Sep 2026)

- **Recipient (internal):** `ENQUIRY_TO = Filipp.korentsvit@nwpharmatech.com`. This is the receiving inbox, not the sender. Filipp is the internal accountable owner.
- **Public wording:** the privacy notice describes the recipient by role, as "the NWPharmaTech team".
- **Roles:** Web Boss runs the hosted preview tests. Claude makes the implementation and privacy changes. Filipp approves production activation.
- **No response-time promise** is published.
- **Web Boss finding:** neither Pages project has Resend credentials, Turnstile secrets or a verified sender configured. Whether a company Resend account exists elsewhere is **not established**.

None of this authorises activation.

## 2. Remaining decisions (service and privacy): Filipp

> Superseded for action by `records/enquiry/PRIVACY-DECISION-SHEET.md` (27 Sep 2026): S1–S2 are settled by Web Boss setup; the company choices that remain are there (updated with Web Boss's provider facts).

| # | Decision | Needed for |
|---|---|---|
| S1 | **Email service account.** Establish whether a company-owned Resend account exists outside Pages. If not, choose the company owner who creates one. Confirm its data-processing terms and data region. A provider other than Resend needs a small code change | `RESEND_API_KEY`, privacy Part B |
| S2 | **Sending address and domain.** Choose the sender (`ENQUIRY_FROM`) on a domain verified in that account, and name who can add the SPF and DKIM DNS records | `ENQUIRY_FROM` |
| P1 | **Retention.** How long enquiries are kept in the inbox and at the provider, and how they are deleted | privacy Part B |
| P2 | **Lawful basis and controller wording,** confirmed by legal | privacy Part B |
| P3 | **Data location and transfers** statement for the chosen provider (follows S1) | privacy Part B |

## 3. Configuration for Web Boss (after S1–S2)

Keep credentials out of chat and records: enter keys only in the Pages environment settings.

1. **Turnstile.** Create a widget in Cloudflare and allow the preview and production hostnames. Keep its site key and secret.
2. **Preview environment only.** Set these in Pages → Settings → Environment variables:

   | Name | Kind |
   |---|---|
   | `ENQUIRY_TO` | plain: `Filipp.korentsvit@nwpharmatech.com` (settled) |
   | `ENQUIRY_FROM` | plain |
   | `RESEND_API_KEY` | secret |
   | `TURNSTILE_SITE_KEY` | plain |
   | `TURNSTILE_SECRET_KEY` | secret |

   Do **not** set `ENQUIRY_TEST_MODE`, `ENQUIRY_PROVIDER_URL` or `TURNSTILE_VERIFY_URL`.
3. **Redeploy to the preview.** Pages applies variables only to new deployments, so redeploy the current commit from a clean checkout, following `DEPLOY-PREVIEW-NWPT-041.md`. Then run section 4.
4. **After section 4 passes and Filipp approves activation:** set the same five variables in the **Production** environment.
5. **Production release.** Claude prepares the privacy Part B commit with the settled wording and S1, P1–P3, on top of the live baseline. Web Boss deploys that commit to production, which also applies the variables. Record the new deployment and its rollback ID.
6. **Switching off at any time:** remove any required variable (for example `ENQUIRY_TO`) and redeploy. The page returns to "Online enquiries are not available yet … Nothing has been sent from this page".

## 4. Preview tests before production activation (run by Web Boss; Filipp approves activation)

Run these on the preview with the real settings. Record the date, the tester, and the result of each step.

1. **Configuration:** `GET /api/enquiry` returns `"configured":true`, the site key, and `"testMode":false`.
2. **Page:** "Send a non-confidential enquiry" and the security check appear. The review step shows the agenda before contact details are asked for.
3. **Real inbox delivery:** submit a test enquiry, with test text only.
   - The page shows "Enquiry submitted" and a `WWU-…` reference.
   - It arrives in the `ENQUIRY_TO` inbox, not spam, within a few minutes.
   - Subject, reference, company text, visitor-labelled questions and message are correct.
   - Reply-to reaches the tester, and the provider's dashboard shows "delivered".
4. **Retry handling:**
   - Submit with the connection cut after sending, so no response is seen, then resubmit the unchanged enquiry. Exactly **one** email arrives, with the same reference.
   - A changed enquiry arrives as a new email.
5. **Duplicate clicks:** repeated clicks during a slow connection produce one email.
6. **Failures never show "submitted":**
   - a failed security check is refused;
   - with a wrong recipient or a revoked key, the page reports that nothing was confirmed as sent;
   - removing a variable and redeploying returns the unavailable message.
7. **Privacy:** no visitor text in any URL; the provider's retention matches P1.
8. **Automated checks** (Claude) against the release commit: `tools/test-work-with-us.mjs` and `tools/test-deploy-layout.mjs`.

Record **system acceptance** (the `202` and reference) separately from **confirmed inbox delivery** (steps 3–4). Production activation needs both.
