# Conversion preview — financing enquiry and programme updates

**Status:** financing enquiry and programme updates can open on www and the apex host when `NWPT_CONVERSION_MODE=production` and that lane’s settings are complete. Preview hosts still require `NWPT_CONVERSION_MODE=preview`. This change does not deploy.
**Repository:** https://github.com/Korentsvit/hello-world
**Production content this candidate starts from:** `fbd865d74fa7272f3eb06dd69c0c3a1c8fefe61d` (NWPT-052, the commit the ECS-video record says was published to www). The branch also contains the records commit `72bee37` directly above that SHA. The named branch `claude/nwpharmatech-website-bs459b` is behind that production SHA (it stops at NWPT-038), so this work is not based on it.
**Publish directory:** `nwpharmatech-website/release-032/site/`
**Out of scope:** Micelle / `nwpt-platform`, production DNS, Cloudflare project settings, and `/api/enquiry` (research collaboration stays off on www and the apex host).

Do not set `ENQUIRY_TEST_MODE` on the production Pages project. Copying the preview variable set, including `NWPT_CONVERSION_MODE=preview`, onto www does not switch the forms on.

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

## When financing and programme updates are on

`/api/financing` and `/api/subscribe` (including confirm and unsubscribe) open only when that lane’s required settings are present and the mode matches the host. `GET` then returns `configured: true` and the Turnstile site key. Otherwise `GET` returns `configured: false` and a null site key, and `POST` returns `503` with `code: "not_configured"` and does not call Resend. The page keeps the email fallback.

| Host | `NWPT_CONVERSION_MODE` | Financing and programme updates |
| --- | --- | --- |
| `www.nwpharmatech.org` or `nwpharmatech.org` | `production` | Open when that lane’s settings are complete |
| `www.nwpharmatech.org` or `nwpharmatech.org` | `preview`, empty, or anything else | Held |
| Any other host | `preview` | Open when that lane’s settings are complete |
| Any other host | `production`, empty, or anything else | Held |

Research-collaboration `/api/enquiry` still fails closed on `www.nwpharmatech.org` and `nwpharmatech.org`, including when `NWPT_CONVERSION_MODE=production`. A missing setting on an otherwise matching host is a `503`, not a success. Do not set `ENQUIRY_TEST_MODE` on the production Pages project.

## Environment variables

Set these on the Pages environment that should serve the forms, after Filipp has created the Resend topic and contact property. Never commit them. Preview uses `NWPT_CONVERSION_MODE=preview`. www and the apex host use `NWPT_CONVERSION_MODE=production`. Do not set `ENQUIRY_TEST_MODE` on production.

| Variable | Role |
| --- | --- |
| `NWPT_CONVERSION_MODE` | `preview` on a non-production host. `production` on www or the apex host. Anything else stays off |
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

Research-collaboration `/api/enquiry` is unchanged in its field rules (`version: "wwu-1"`). On a non-production host it still turns on only when its own five settings are present. On www and the apex host it stays off regardless of `NWPT_CONVERSION_MODE`.

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

Filipp approved activating financing enquiry and programme updates on www after the preview review. They turn on only when the production project sets `NWPT_CONVERSION_MODE=production` and the lane’s settings are complete. Until then, www stays email-first.

## Checks already run on this candidate

From `nwpharmatech-website/`:

```sh
node tools/test-conversion.mjs
node tools/test-conversion-browser.mjs
```

The first file calls the functions with a mock Resend and Turnstile: fail-closed without settings, fail-closed on www when the mode is not `production` or a required setting is missing, open on www and the apex host when the mode is `production` and settings are complete, preview hosts unchanged under `preview`, distinct subjects and tags, no contact created by a financing send, no topic opt-in before confirm, unsubscribe verified against the mock topic, a confirm link after unsubscribe does not opt back in, provider failure is not reported as acceptance, and the page copy checks above.

The browser file serves `release-032/site/` and checks the homepage, funding-use, science, and contact at phone and desktop widths, including the hidden forms and the “nothing has been sent” line, then a preview-configured contact journey through acceptance, confirm, and unsubscribe. It does not prove a real Resend delivery or a real Turnstile widget; those remain for the hosted preview.

`/functions/api/financing.js` answers `404` `Not found`. Wrangler also omits the `functions/` directory from uploaded assets.

## Not verified here

- A message in Filipp’s real mailbox, or a Resend dashboard “delivered” event.
- Cloudflare Turnstile on the hosted preview (the browser check uses a stub).
- That Filipp’s Resend account already has the `nwpt_updates` property and the topic. If it does not, the preview fails closed and must not be described as registered.
- Counsel review. The privacy notice is not a legal sign-off.
