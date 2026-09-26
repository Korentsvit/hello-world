# Enquiry activation handoff: "Explore a research collaboration"

**Status:** online enquiries are **disabled** on production (`6affabafe67ea049e732f6e15f16df16823cbb93`). They stay disabled until the section 2 decisions are made, section 3 is configured on the preview and section 4 has passed. No redeployment is requested now.

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
   | `ENQUIRY_TO` | plain: `Filipp.korentsvit@nwpharmatech.com` (D1) |
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
