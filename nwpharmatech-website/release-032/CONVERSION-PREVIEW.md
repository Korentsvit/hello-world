# Conversion preview — financing enquiry and programme updates

**Status:** preview-ready candidate. Production is not activated.
**Repository:** https://github.com/Korentsvit/hello-world
**Production content this candidate starts from:** `fbd865d74fa7272f3eb06dd69c0c3a1c8fefe61d` (NWPT-052, the commit the ECS-video record says was published to www). The branch also contains the records commit `72bee37` directly above that SHA. The named branch `claude/nwpharmatech-website-bs459b` is behind that production SHA (it stops at NWPT-038), so this work is not based on it.
**Publish directory:** `nwpharmatech-website/release-032/site/`
**Out of scope:** Micelle / `nwpt-platform`, production DNS, the live Pages project’s production settings, and any flip of `/api/enquiry` or programme updates on www.

Do not deploy this to the production Pages project. Do not copy the preview environment variables onto production.

## What a visitor can do

Two routes stay separate.

| Label | Route | Must not |
| --- | --- | --- |
| Express interest in programme financing | Homepage row under Explore, primary button at the end of `/funding-use`, Contact card `#financing`, quiet text link from Science and Evidence | Become a newsletter gate, an offer, a payment, a wallet connection, or an allocation |
| Register for programme updates | Same homepage row, secondary link on `/funding-use`, Contact card `#updates-enquiry`, button on Science and Evidence | Become a financing form, collect health information, or be required before a financing enquiry |

Beside every financing control: **You cannot invest, pay, or connect a wallet on our website.**

While the online form is off, Contact keeps the existing mailto routes (`Financing enquiry`, `Programme updates`, research, press, general) and says that nothing has been sent. The forms are in the page but hidden until the API reports `configured: true`.

## Provider mode (preview only)

Resend sends mail. Cloudflare Turnstile checks every public POST. Buttondown is not called. The older draft under `src/optional/signup/` is reference only and is not in the publish directory.

| Lane | Endpoint | Subject | Tag |
| --- | --- | --- | --- |
| Financing | `POST /api/financing` | `Programme financing enquiry — {organisation or name}` | `lane=financing` |
| Updates, to the team | `POST /api/subscribe` | `Programme updates request — {email}` | `lane=updates` |
| Updates, to the visitor | same request | `Confirm programme updates — {email}` | `lane=updates`, `kind=confirm` |

A `202` means Resend accepted the message for delivery (`accepted: true`, `inboxConfirmed: false`). It does not mean the message reached an inbox, and the financing text says it does not mean the person has invested, paid, subscribed, or been allocated anything. Programme updates stay unregistered until the person opens the confirmation link.

Confirmation: `GET /api/subscribe?action=confirm&token=…`
Unsubscribe: `GET` or `POST /api/subscribe?action=unsubscribe&token=…`

Unsubscribe sets the Resend contact property `nwpt_updates` to `unsubscribed` and the programme-updates topic to `opt_out`, then reads the topic back. The page claims success only when that read shows `opt_out`. A later confirmation link does not opt the address back in until the person submits “Register again”. Financing mail is one-off and is not affected.

Suggested preview routing, for Filipp to confirm before any activation: financing and the updates notification to `ENQUIRY_TO` (historically `Filipp.korentsvit@nwpharmatech.com`). Press and general stay `team@nwpharmatech.com`. `FINANCING_TO` / `UPDATES_TO` override the shared `ENQUIRY_TO` if the inboxes should differ.

## Why www stays off

Both new lanes, and the existing research-collaboration `/api/enquiry`, fail closed when the request host is `www.nwpharmatech.org` or `nwpharmatech.org`, even if every secret is present. `GET` then returns `configured: false` and a null Turnstile site key. `POST` returns `503` with `code: "not_configured"` and does not call Resend.

On any other host the new lanes also stay off unless `NWPT_CONVERSION_MODE` is exactly `preview` and every required setting below is present. A missing setting is a `503`, not a success.

Removing the production-host hold is a later change. It is not part of this candidate. Do not set `NWPT_CONVERSION_MODE` or `ENQUIRY_TEST_MODE` on the production Pages project.

## Preview environment variables

Set these on the **preview** Pages environment only, after Filipp has created the Resend topic and contact property. Never commit them.

| Variable | Role |
| --- | --- |
| `NWPT_CONVERSION_MODE` | Must be `preview` |
| `RESEND_API_KEY` | Secret |
| `TURNSTILE_SITE_KEY` | Public, returned only when the lane is configured |
| `TURNSTILE_SECRET_KEY` | Secret |
| `ENQUIRY_FROM` or `FINANCING_FROM` / `UPDATES_FROM` | Sender on a domain verified with Resend |
| `ENQUIRY_TO` or `FINANCING_TO` / `UPDATES_TO` | Accountable recipient |
| `UPDATES_SIGNING_SECRET` | At least 16 characters. Signs confirm and unsubscribe links |
| `UPDATES_TOPIC_ID` | Resend topic id for programme news |

In Resend, before a preview send will succeed end to end:

1. Create a contact property named `nwpt_updates` (values used: `pending`, `confirmed`, `unsubscribed`).
2. Create a topic for programme updates and set its default subscription to opt-out if Resend asks. Put that topic’s id in `UPDATES_TOPIC_ID`.
3. Verify the from-domain.

`ENQUIRY_TEST_MODE`, `ENQUIRY_PROVIDER_URL`, `TURNSTILE_VERIFY_URL`, and `UPDATES_CONTACTS_URL` are for the automated mock only. Do not set them on a hosted preview.

Research-collaboration `/api/enquiry` is unchanged in its field rules (`version: "wwu-1"`). On a non-production host it still turns on only when its own five settings are present. On www it now stays off regardless.

## How Web PR preview-deploys

Deploy the publish directory, from inside it, so `functions/` is compiled. Deploying the parent directory uploads HTML and no Functions.

```sh
git clone https://github.com/Korentsvit/hello-world.git nwpt-deploy
cd nwpt-deploy
git checkout --detach <FULL CANDIDATE SHA>
git rev-parse HEAD
git status --porcelain --untracked-files=all   # must print nothing
cd nwpharmatech-website/release-032/site
npx wrangler@4 pages deploy . --project-name <existing preview project> --branch <preview branch name> --commit-hash <FULL CANDIDATE SHA>
```

The deploy output must include “Compiled Worker successfully” and “Uploading Functions bundle”. Do not use `--commit-dirty`. Do not change the production branch, production DNS, or the production environment variables.

If the preview project builds from Git instead of a direct upload: root directory `nwpharmatech-website/release-032/site`, empty build command, output directory `.`. Leave the production branch as it is.

## What Filipp reviews before any activation

Show all six on the hosted preview, with a synthetic address. A mock, or an HTTP `202` alone, is not this review.

1. **Confirmation.** Financing says the email service accepted the message for delivery, and that this is not an investment. Updates says the person is not registered until they confirm from the email.
2. **Delivery.** Resend shows the financing message and the updates request as delivered, or honestly as accepted by the provider, and the messages are in Filipp’s mailbox. Check reply-to and the `FIN-` / `UPD-` reference. Inbox delivery was not verified in this repository; the functions only report provider acceptance.
3. **Unsubscribe.** The confirmation email contains an unsubscribe link. Following it shows the address as opted out, and a later programme-update send on that topic is not sent. Financing mail is one-off; retention and deletion are in the privacy notice.
4. **Privacy.** `/privacy` names NWPharmaTech Ltd, Resend, Cloudflare Turnstile, the purpose of each lane, retention, and the items Filipp still has to set (mailbox routing, the Resend property and topic). It says it is not a legal sign-off.
5. **Lane separation.** The updates form can be submitted with no financing fields. The financing form does not require programme updates.
6. **Speech.** Investigational and not an offer. No control invests, pays, subscribes to an offering, or connects a wallet.

Until those six are shown and Filipp gives a separate written activation, keep www email-first.

## Checks already run on this candidate

From `nwpharmatech-website/`:

```sh
node tools/test-conversion.mjs
node tools/test-conversion-browser.mjs
```

The first file calls the functions with a mock Resend and Turnstile: fail-closed without settings, fail-closed on www even with settings, distinct subjects and tags, no contact created by a financing send, no topic opt-in before confirm, unsubscribe verified against the mock topic, a confirm link after unsubscribe does not opt back in, provider failure is not reported as acceptance, and the page copy checks above.

The browser file serves `release-032/site/` and checks the homepage, funding-use, science, and contact at phone and desktop widths, including the hidden forms and the “nothing has been sent” line, then a preview-configured contact journey through acceptance, confirm, and unsubscribe. It does not prove a real Resend delivery or a real Turnstile widget; those remain for the hosted preview.

`/functions/api/financing.js` answers `404` `Not found`. Wrangler also omits the `functions/` directory from uploaded assets.

## Not verified here

- A message in Filipp’s real mailbox, or a Resend dashboard “delivered” event.
- Cloudflare Turnstile on the hosted preview (the browser check uses a stub).
- That Filipp’s Resend account already has the `nwpt_updates` property and the topic. If it does not, the preview fails closed and must not be described as registered.
- Counsel review. The privacy notice is not a legal sign-off.
