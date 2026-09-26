# Enquiry activation handoff: "Explore a research collaboration"

**Status:** online enquiries are **disabled** on production (`6affabafe67ea049e732f6e15f16df16823cbb93`). They stay disabled until sections 1 and 2 are complete and section 3 has passed on the preview. No redeployment is requested now.

**Already built and live, dormant:**
- `/api/enquiry` fails closed until all five settings exist.
- The page switches its wording automatically, from "Contact about collaboration" to "Send a non-confidential enquiry", once the API reports it is configured.
- It shows "submitted" only after the email service accepts the message, and a retry of the same enquiry delivers once (idempotency key).

No code change is needed. The only website change at activation is publishing privacy Part B (section 2, step 5).

Full detail on each item: `ENQUIRY-ACTIVATION-CHECKLIST.md` and `PRIVACY-NOTICE-UPDATE-NWPT-041.md`.

## 1. Decisions for Filipp

| # | Decision | Needed for |
|---|---|---|
| D1 | **Recipient:** the accountable person or team, and the inbox address. `team@nwpharmatech.com` is not assumed | `ENQUIRY_TO`, privacy Part B |
| D2 | **Email service:** confirm Resend (the implemented provider), with the account owner, data-processing terms and data region. Another provider needs a small code change | `RESEND_API_KEY`, privacy Part B |
| D3 | **Sending address and domain:** an address on a domain verified with the service, with SPF and DKIM in DNS | `ENQUIRY_FROM` |
| D4 | **Retention:** how long enquiries are kept in the inbox and at the provider, and how they are deleted | privacy Part B |
| D5 | **Lawful basis and controller wording,** confirmed by legal | privacy Part B |
| D6 | **Response expectation:** whether to state a response time (optional) | page or privacy text |
| D7 | **Who runs the preview tests,** and who approves production activation | section 3 |

## 2. Configuration for Web Boss (after D1–D3)

1. **Turnstile.** Create a widget in Cloudflare and allow the preview and production hostnames. Keep its site key and secret.
2. **Preview environment only.** Set these in Pages → Settings → Environment variables:

   | Name | Kind |
   |---|---|
   | `ENQUIRY_TO` | plain |
   | `ENQUIRY_FROM` | plain |
   | `RESEND_API_KEY` | secret |
   | `TURNSTILE_SITE_KEY` | plain |
   | `TURNSTILE_SECRET_KEY` | secret |

   Do **not** set `ENQUIRY_TEST_MODE`, `ENQUIRY_PROVIDER_URL` or `TURNSTILE_VERIFY_URL`.
3. **Redeploy to the preview.** Pages applies variables only to new deployments, so redeploy the current commit from a clean checkout, following `DEPLOY-PREVIEW-NWPT-041.md`. Then run section 3.
4. **After section 3 passes and activation is approved:** set the same five variables in the **Production** environment.
5. **Production release.** Claude prepares the privacy Part B commit with the D1–D5 details, on top of the live baseline. Web Boss deploys that commit to production, which also applies the variables. Record the new deployment and its rollback ID.
6. **Switching off at any time:** remove any required variable (for example `ENQUIRY_TO`) and redeploy. The page returns to "Online enquiries are not available yet … Nothing has been sent from this page".

## 3. Preview tests before production activation

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
7. **Privacy:** no visitor text in any URL; the provider's retention matches D4.
8. **Automated checks** against the release commit: `tools/test-work-with-us.mjs` and `tools/test-deploy-layout.mjs`.

Record **system acceptance** (the `202` and reference) separately from **confirmed inbox delivery** (steps 3–4). Production activation needs both.
