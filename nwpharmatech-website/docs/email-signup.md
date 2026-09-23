# Email sign-up (optional; absent from the public build by default)

**Status: not enabled. No live provider test has been run.** No provider account or API key is configured in this environment, and `tools/test-signup-live.mjs` has never been run against a real provider. So `python3 build.py --with-signup` is refused: it needs a passed live test recorded in `content/signup-provider-test.json`, and no such record exists. All the testing described below used mocked or local stand-in providers. So far the live harness has been run only by `tools/test-signup.mjs`, against a local mock webhook in a temporary copy of the project, to check its own logic; the records those runs write are deleted with the copy.

## How it works
- **Build:** `python3 build.py --with-signup` adds the newsroom form (`src/pages/newsroom.html`, inside `<!--optional:signup-->`) and copies `src/optional/signup/functions/` into `public/functions/`. Deploy from inside `public/` so Cloudflare Pages finds `functions/` (`docs/deployment.md`).
- **Double opt-in:** the provider sends a confirmation email, and nobody is subscribed until they confirm. The provider adds an unsubscribe link to every email. The site stores no addresses.
- **Environment variables** (Cloudflare Pages secrets):
  - `SIGNUP_PROVIDER` = `buttondown` or `webhook`
  - `SIGNUP_API_KEY`
  - `SIGNUP_WEBHOOK` (for `webhook` only)
- **Webhook contract:** `POST` with `Authorization: Bearer <SIGNUP_API_KEY>` and the JSON body `{"email": "...", "double_opt_in": true}`. The webhook answers `2xx` with `{"accepted": true}` once the provider has taken a new address and will send the confirmation email. It answers `400`, `409` or `422` when the provider turns the address down, including an address that is already on the list, and `401` for a wrong key. It must not answer `{"accepted": true}` for an address already on the list: the site would then tell a confirmed subscriber that they will not receive updates until they confirm, and the live test fails. `SIGNUP_WEBHOOK` must be the final URL, because redirects are not followed.
- **Buttondown adapter:** `POST https://api.buttondown.com/v1/subscribers` with `{"email_address": "...", "type": "unactivated"}`. A `2xx` answer counts as accepted only if it contains the created subscriber (an `id`). This request shape, and what Buttondown answers for an address that is already subscribed, have not been checked against Buttondown's current API documentation. The live test is where that check happens.
- **Redirects:** neither adapter follows a redirect (`redirect: "manual"`). A followed redirect is sent again to another address (a `302` as a `GET` without the address), so its answer would not be the provider's answer to this sign-up. Any `3xx` answer is therefore unconfirmed.
- **Timeout:** the function waits at most 8 seconds for the provider's whole answer, then aborts the request. The browser waits at most 20 seconds for the function.

## What the person is told
There are two kinds of outcome:
- **Definite:** we know what happened, and we say so.
- **Unconfirmed:** the request may have reached the provider, but we did not get an answer we can read. The sign-up may or may not have been recorded, and we say exactly that. We never say that the address was not recorded, or that someone is signed up, unless we know.

The wording is defined once, in `MESSAGES` in `subscribe.js`, and the browser script uses the same words. `tools/test-signup.mjs` checks that every message below appears here verbatim.

| Situation | HTTP status (`outcome`) | Message |
|---|---|---|
| Sign-up not configured (the provider is not called) | 503 (`unavailable`) | Email sign-up is not available at the moment, and your address has not been passed to an email provider or stored. Please try again later. |
| The form cannot be read (the provider is not called) | 400 (`unreadable`) | We could not read the form. Please try again. |
| Invalid address. Checked in the browser, and by the function before any provider call | 400 (`invalid`) | Please enter a valid email address. |
| The hidden field is filled (a bot). The provider is not called, and the answer looks ordinary | 200 (`accepted`) | as "Provider accepted" |
| Provider accepted: a `2xx` answer we understand | 200 (`accepted`) | Thank you. Please check your inbox and confirm your email address. You will not receive updates until you confirm. |
| Provider turned the address down: `400`, `409` or `422` | 400 (`rejected`) | We could not sign up that address. It may already be subscribed, or the provider may not accept it. If you already receive updates, there is nothing more to do. |
| Provider refused the request: any other `4xx`, for example a wrong key or a rate limit | 503 (`refused`) | Our email provider did not accept the sign-up. Please try again later. |
| **Unconfirmed:** network failure; provider `5xx`; a redirect (`3xx`, not followed); an answer we cannot read (not JSON, JSON without the expected field, or another unexpected status) | 502 (`unconfirmed`) | We could not get confirmation that your sign-up was received, so it may or may not have been recorded. If an email arrives asking you to confirm your address, please follow the link in it. If none arrives, please try again later. |
| **Unconfirmed:** no complete answer from the provider within 8 seconds | 504 (`unconfirmed`) | the same unconfirmed message |
| **Unconfirmed, in the browser:** the request fails (offline, dropped connection), no answer arrives within 20 seconds, or the answer cannot be read | none | the same unconfirmed message |
| Any method other than `POST` | 405 (`method`) | Please use the sign-up form. |

- **While waiting,** the browser shows "Sending…". It never claims success before the server confirms, and it ignores a second submission.
- **Where messages appear:** in the form's `role="status"` live region. Without JavaScript, the form posts normally and the function answers with a short page that shows the message and links back to `/newsroom#signup`.
- **Why the unconfirmed wording:** a connection can fail after the provider has already recorded the address, so neither "you are signed up" nor "nothing was recorded" would be reliable. The confirmation email settles it:
  - if it arrives, the sign-up was recorded;
  - if none arrives, trying again is safe. An address that is already there gets the "may already be subscribed" answer.

## Tests
- **`node tools/test-signup.mjs`** needs no browser and no network beyond local test servers on `127.0.0.1`. It takes about 10 seconds. It runs the function with a mocked provider and covers every row above:
  - timeouts (a mock that waits on the abort signal, and one whose answer stalls part-way), checking that the requested timeout is about 8 seconds;
  - `5xx`, a network failure, and malformed and unexpected answers;
  - redirects: a local server that really answers `302`, `307` or `308` (pointing to an address that would accept), for both adapters. The function must answer unconfirmed, and the server must see only the original request. A browser-style opaque redirect is also unconfirmed;
  - accepted answers from both adapters, including the exact request each one sends.

  It also checks that:
  - no message the function can return, and no text in `src/` or `content/`, says "Nothing was saved";
  - unconfirmed outcomes use the agreed wording ("We could not get confirmation", "may or may not have been recorded");
  - `site.js` uses the function's words verbatim and never claims success on its own;
  - this document lists every message.

  It then runs the live harness, `tools/test-signup-live.mjs`, at a pseudo-terminal (through Python's `pty` module), against a local mock webhook, in two temporary copies of the project:
  - a webhook that answers a repeat of a confirmed address as if it were new: `repeat_address` must fail, and no record is written;
  - a webhook that keeps to the contract: every case passes, and the record it writes is accepted by the build's check.

  Finally it runs the build's record check (`signup_provider_problem` in `buildlib/content.py`) against records that must be refused: a case whose `pass` is anything but `true` (`"false"`, `"no"`, `"FAIL"`, `"not tested"`, `"0"`, `"true"`, `1`, `null`, `false`), a missing or unknown case, no `harness` or another script as `harness`, no `list`, no digest, fields changed after the digest was made, another version of `subscribe.js`, an unknown provider, a malformed date, the example file, and a file that is not JSON. It also checks that the digests made in Node and in Python agree for text with non-ASCII characters, quotes, backslashes and control characters.
- **`node tools/test-signup.mjs --browser`** also tests in Chromium under Cloudflare's own Pages runtime (`wrangler pages dev`), with a local mock provider behind the webhook adapter. It tests a copy of `public/` if that was built with `--with-signup`. Otherwise it works in a temporary copy of the project, and first checks the build gate there:
  - without a record, `--with-signup` is refused and `public/` is unchanged;
  - with the example record, it is also refused;
  - with a record for another version of `subscribe.js`, it is also refused;
  - with a fixture record in the harness's format (digest included, and `tested_by` saying that no provider was tested), it builds.

  The fixture exists only in the temporary copy. The checks under Cloudflare's runtime cover:
  - a provider redirect (`307`): not followed, unconfirmed;
  - accepted, rejected, provider `503` and an unreadable answer;
  - the provider never answering: the message stays "Sending…" until the 8-second timeout, then shows the unconfirmed wording;
  - requests failing in the browser (`page.route` aborts: failed, internet disconnected, connection reset): unconfirmed wording;
  - an HTML error page, or JSON without a message, instead of an answer: unconfirmed wording;
  - no answer within 20 seconds (simulated clock), with a second submission ignored;
  - an invalid address: `aria-invalid` is set, focus returns to the field, and nothing is sent;
  - keyboard submission, with focus kept in the field;
  - no horizontal scroll at 320 px;
  - no Content Security Policy violations;
  - the form without JavaScript, including the link back.
- **`tools/test-signup-live.mjs`**: the live test described below. It is run by a person and never automatically.

## Enabling sign-up
1. **Configure the provider.** Create a separate **test** list (or newsletter) and an API key for it. If you use `webhook`, deploy the webhook to the contract above. Check the adapter in `subscribe.js` against the provider's current API documentation.
2. **Run the live test on the test list:**
   ```
   SIGNUP_LIVE_TEST=1 SIGNUP_PROVIDER=buttondown SIGNUP_API_KEY=<test-list key> \
   SIGNUP_TEST_EMAIL=<a new address whose inbox you can read> node tools/test-signup-live.mjs
   ```
   (For `webhook`, also set `SIGNUP_WEBHOOK`.) The harness needs Node.js 18 or later. It refuses to run without these variables, or outside an interactive terminal. It asks you to type `TEST` to confirm the list is a test list, then asks for the list's name and yours. It calls the provider through the site's own function, and checks:
   - `invalid_address`: a malformed address is refused before any provider call, and an address at `example.invalid` gets a definite answer from the provider;
   - `new_address`: accepted, and the person is asked to confirm;
   - `confirmation_email` (you confirm): the email arrived and its link confirmed the address;
   - `repeat_address`: the same, now confirmed, address is sent again. The only answer that is true for a confirmed subscriber is the rejection ("It may already be subscribed … If you already receive updates, there is nothing more to do"). If the site gives the accepted message instead ("You will not receive updates until you confirm"), the case fails without a question: the provider, or the webhook, must answer `400`, `409` or `422` for an address already on the list. After a rejection you are asked whether the provider's list still shows the address exactly once, and still confirmed, and then whether everything the message says is true for that subscriber. Both answers must be yes;
   - `unsubscribe` (you confirm): the unsubscribe link in a test send works;
   - `provider_outage`: the function's own provider request is sent to a closed port, a server answering `503`, a server that redirects (to an address that would accept) and a server that never answers. Each must give the unconfirmed wording (502, 502, 502, 504), and the redirect must not be followed. The real provider is also sent a wrong key, which must not be accepted.

   Only when every case passes does the harness write `content/signup-provider-test.json`. The record holds the provider, list, date, `tested_by`, the SHA-256 of the function tested (`function_sha256`), `harness` (always `tools/test-signup-live.mjs`), each case's `pass` and `observed`, and a `digest`. See `content/signup-provider-test.example.json` for the format; the build refuses the example itself. Commit the record. If `subscribe.js` changes, run the live test again.

   `build.py --with-signup` accepts the record only if every case's `pass` is the value `true`, `harness` is `tools/test-signup-live.mjs`, provider, list, date and `tested_by` are filled in, `function_sha256` matches the current `subscribe.js`, and the digest matches. The digest is SHA-256 over provider, list, date, `tested_by`, `function_sha256` and the cases (`src/optional/signup/record.mjs`); the build recomputes it, so a record edited after the harness wrote it is refused. Do not edit the record by hand. The digest is a checksum, not a signature: anyone who reads the code can make one, so it shows that the record has not been changed since it was made, not who made it.
3. **Build with `--with-signup`:** `python3 build.py --with-signup`, for staging first.
4. **Run the browser test:** `node tools/test-signup.mjs --browser`, which tests the `--with-signup` build in `public/`.
5. **Before production:** update the privacy notice to name the provider as a processor (legal review). Set the Cloudflare Pages secrets for the live list on the production project. `SIGNUP_PROVIDER` must be the provider named in the record (and, for `webhook`, the same webhook that was tested): the build cannot see the secrets, so it cannot check this. Only the list and its key should differ from the test. Deployment is done by the website team, not from this package.

## Limits
- The live test runs the function in Node.js. The browser test runs it in Cloudflare's runtime, but with a mock provider. Neither alone covers the real provider in Cloudflare's runtime. Before production, make one real sign-up on the staging deployment, using the test list's secrets.
- The unconfirmed message cannot say whether the address was recorded. Only the provider knows. The confirmation email is how the person finds out.
