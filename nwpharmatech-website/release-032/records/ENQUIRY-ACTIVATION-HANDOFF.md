# Enquiry activation handoff: "Explore a research collaboration"

**Status:** online enquiries are **disabled** on production (`6affabafe67ea049e732f6e15f16df16823cbb93`). They stay disabled until the section 2 decisions are made, section 3 is configured on the preview and section 4 has passed. No redeployment is requested now.

**27 Sep 2026 update:**
- **Web Boss setup (Web Boss report):**
  - Resend reports `nwpharmatech.org` as verified, with sending region Ireland (EU).
  - A Turnstile widget covers `nwpt-837794c-preview.pages.dev` only.
  - The preview project holds the Resend and Turnstile credentials. `ENQUIRY_FROM` and `ENQUIRY_TO` are deliberately unset, so the form is off.
  - Production has no enquiry secrets.
- **Settled:** the sender is `NWPharmaTech website <website@nwpharmatech.org>` (send-only; inbound through Resend is not used).
- **Privacy Part B:** applied on the preview candidate (branch `claude/nwpt-enquiry-preview`). The remaining open items are the P1, P2 and P3 decisions, now listed publicly under "Not yet confirmed".

**27 Sep 2026: preview delivery (reported by Filipp and Web Boss).**
- Preview candidate `646693df8b4586eb418e432e24a0e9d46879250f` is on `nwpt-837794c-preview`, with `ENQUIRY_FROM` and `ENQUIRY_TO` set on the preview only.
- Synthetic enquiry **`WWU-E453F947`**: **system acceptance and confirmed inbox delivery are both reported.**

| Section 4 test | Status |
|---|---|
| 1–2 Configuration and page | Implied by the accepted submission; the `GET /api/enquiry` output is not yet reported |
| 3 Real inbox delivery (`WWU-E453F947`) | **Confirmed**: accepted and delivered |
| 3 Reply-to reaches the tester; provider shows "delivered" | Not yet reported |
| 4 Retry after a lost response gives exactly one email; a changed enquiry gives a new one | Not yet reported |
| 5 Repeated clicks give one email | Not yet reported |
| 6 Failure cases never show "submitted" | Not yet reported |
| 7 No visitor text in URLs; provider retention matches the notice | Not yet reported (retention: see the privacy decisions) |

**Production stays disabled.** Activation still needs:
- the remaining section 4 results;
- the privacy decisions (`records/enquiry/PRIVACY-DECISION-SHEET.md`);
- the provider and logging facts below;
- Filipp's approval.

The privacy follow-up `bfbf132` (precise storage wording, sending-region caveat) is a separate candidate. Its public "Not yet confirmed" notice must not go to production.

## Requests to Web Boss: provider and logging facts (27 Sep 2026)

Confirm each item on the **official page or the account itself**, and report the page, the date read and the setting value. No credentials. Claude could not open these pages from its environment; the values in brackets are search-summary leads only.

| # | Fact | Where to confirm | Lead to check |
|---|---|---|---|
| W1 | Resend plan on the company account, and its email/log retention | Resend billing; resend.com/security/gdpr | (30 days on Free, Pro and Scale) |
| W2 | Resend storage location for message content, logs and account data | resend.com/security/gdpr; resend.com/docs/dashboard/domains/regions | (United States; Ireland is the sending region only) |
| W3 | Resend transfer mechanism and DPA version; whether the company has accepted or signed it | resend.com/legal/dpa; account settings | (SCCs and EU-U.S. DPF, including the UK extension; DPA updated 31 Dec 2025) |
| W4 | Resend subprocessors (current list) | resend.com/legal/subprocessors | (Stripe, Supabase, Svix, Tinybird; all USA) |
| W5 | Resend idempotency-key retention | resend.com/docs/dashboard/emails/idempotency-keys | (24 hours) |
| W6 | Turnstile: data processed, retention, and Cloudflare's role (controller or processor) | cloudflare.com/turnstile-privacy-policy | (signals listed; retention not found) |
| W7 | Cloudflare transfer mechanism and any data-localisation setting on the account | cloudflare.com/cloudflare-customer-dpa; account settings | — |
| W8 | Whether Workers Logs or Logpush is enabled on either Pages project, and its retention | Pages project settings | (only ephemeral real-time logs if neither is enabled) |
| W9 | The mail service hosting `nwpharmatech.com` mailboxes, and its location | DNS MX records; the mail admin | — |
| W10 | The remaining section 4 results above (reply-to, delivered status, retry, duplicate clicks, failure cases, URL privacy) | Preview | — |


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

> Superseded for action by `records/enquiry/PRIVACY-DECISION-SHEET.md` (27 Sep 2026): S1–S2 are settled by Web Boss setup; the company choices that remain are there.

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
