# NWPT-041: “Work with us” — Explore a research collaboration (`/work-with-us`)

This feature is on the branch `claude/nwpt-work-with-us`, based on NWPT-040 (`3a39577`). It is a preview candidate; production publication is a separate decision. The Programme Room is unchanged here, and its review continues on `claude/nwpt-programme-room`. The sticky-header fix in `0c39278` is on that branch and is not included here.

## The journey: an investigator exploring a research collaboration

1. **Focus (optional, no registration).** Three questions: research objective, population of interest and planning stage.
   - Answers highlight matching cards and can filter to them. Topics can be switched off.
   - If the visitor chooses "Another population", a note says plainly that there is no public programme information about other populations.
   - If the visitor chooses "funding", a note says the page offers no funding, sponsorship or study medicine.
2. **Relevant public information.** There are 26 cards in six topics.
   - The kinds of card are Finding, Limitation, Open question, Question for discussion and one Website statement.
   - Every information card shows its sources. Each source gives its type, dates and limitations, and links to both the Evidence library entry and the original source.
3. **Card actions.** "Discuss this finding" appears on findings, "Clarify this limitation" on limitations, and "Ask about collaboration" on open questions and discussion questions.
4. **Agenda.** Items can be edited (each has its own "Your question" field), moved up or down, and removed.
   - On wide screens the agenda is a sticky sidebar. On phones it is a modal drawer opened from a bottom bar; the dialog contains focus, Escape closes it, and focus returns to the opener.
5. **Discussion brief.** Titled "Discussion brief — prepared from selected NWPT public information".
   - Dated ("Prepared on …"), with the content version and review date.
   - Company statements (quoted, with numbered references) are kept apart from text marked "Visitor question".
   - It states that it is not a protocol, offer or agreement, and does not indicate an approved protocol, available study medicine, sponsorship, funding, or access to unpublished data.
   - "Print or save as PDF" prints the brief only. See `records/screens-nwpt041/sample-discussion-brief.pdf`.
6. **Share link.** `#v=wwu-1&t=<topic ids>&c=<card id>.<action code>,…` — version, topic ids and card/action ids only. It never includes answers, questions, contact details or other free text. Opening the link recreates the topics and cards, says what was restored, and removes the fragment from the address bar.
7. **Enquiry.**
   - The visitor reviews exactly what will be sent before being asked for contact details: name, email, institution, optional role, and an optional message of up to 3,000 characters.
   - A non-confidentiality confirmation is required.
   - There are no file uploads and no patient information.

## Evidence structure: one set of statements

`source/work-with-us.json` holds no scientific claims. Each card points to a Programme Room statement in `source/programme-room.json`: a stage's "known" item or "further" text, a source's limitation, or an open question. Each source is a Programme Room source entry, from the Evidence library or a study-record page.

The generator `tools/build-work-with-us.py` resolves those references into:
- `site/work-with-us.html`, readable without JavaScript: every card and source is in the HTML;
- `site/functions/api/_lib/wwu-cards.js`, the server's copy of the card text. The enquiry email quotes company text from this file, never from the browser. The browser sends only card ids, action codes and the visitor's own text.

The only new text is:
- the questions;
- the topic introductions;
- one website statement: "This page brings together public information to help you prepare a conversation. It does not offer a study protocol, study medicine, sponsorship, funding or access to unpublished data. Selecting a card does not commit you or NWPharmaTech to anything.";
- four suggested questions, which are visitor-side wording the visitor can edit.

No sponsor, dose or participant-number statements are added.

## Privacy

- Answers, the agenda and the visitor's questions stay in this browser tab (`sessionStorage`). Nothing goes to `localStorage`, the URL or any analytics.
- Contact details are never stored.
- Visitor text is always inserted as text, never as markup; this is tested with an injection string.
- The function never logs request bodies.

## Submission: what exists and what is needed

**Existing infrastructure (inspected).**
- `contact.html` publishes `team@nwpharmatech.com` through `mailto:` links, including a research-collaboration card (`#research`).
- `functions/api/subscribe.js` (Buttondown and Turnstile) fails closed and is not used by any page.
- No email-sending service is configured for enquiries.

**Built.**
- `functions/api/enquiry.js` follows the same fail-closed pattern.
- `GET /api/enquiry` reports `{configured, turnstileSiteKey, version, testMode}`.
- `POST` works as follows:
  - It validates every field and card, and rejects the honeypot field, stale content versions, over-long text and unknown cards or actions.
  - It verifies Turnstile, passing an `idempotency_key` so a retry can re-verify the same token.
  - It sends a plain-text email through Resend: `to` the accountable recipient, `reply_to` the visitor, and an `Idempotency-Key` header.
  - It answers `202 {ok, accepted, reference}` only when the service returns a message id.

**Duplicate protection.**
- The button is disabled and marked busy while a submission is in flight.
- The idempotency key is a hash of the payload plus a per-tab nonce. A retry after a failure or a dropped connection therefore carries the same key, and the email service delivers it once.

**Messages to the visitor.**
- The page shows "Enquiry submitted" and a reference (`WWU-XXXXXXXX`) only after the function confirms acceptance. The wording is: "Our email service accepted your enquiry for delivery to the NWPharmaTech team. This confirms acceptance, not that it has reached an inbox."
- Every failure says "Nothing has been confirmed as sent" and re-enables the form.

**Unconfigured (as this preview deploys today).**
- The page says "Online enquiries are not available yet … Nothing has been sent", keeps the agenda and brief working, and points to the route already published on the Contact page.
- No contact fields are shown and no `mailto:` link is substituted.

**Configuration needed to switch it on.** Set these in Cloudflare Pages → Settings → Environment variables, for Preview and Production separately:

| Name | Kind | What is needed |
|---|---|---|
| `ENQUIRY_TO` | plain | **The accountable recipient's address.** This is an owner decision; it is not assumed from the Contact page |
| `ENQUIRY_FROM` | plain | A sender on a domain verified with Resend, for example `NWPharmaTech website <address@verified-domain>` (SPF and DKIM set up in DNS) |
| `RESEND_API_KEY` | secret | Resend API key with sending access |
| `TURNSTILE_SITE_KEY` | plain | Turnstile widget key; its hostnames must include the preview and production hosts |
| `TURNSTILE_SECRET_KEY` | secret | The Turnstile secret. It has the same name as the one `/api/subscribe` expects |

`ENQUIRY_TEST_MODE`, `ENQUIRY_PROVIDER_URL` and `TURNSTILE_VERIFY_URL` are for tests only. The two URLs are ignored unless test mode is `1`, and test mode shows a "Test mode … not delivered" notice on the form. Do not set any of them in Production.

**Also needed before production:**
- Confirm who is accountable for answering enquiries.
- Update the privacy notice to cover a web form and the email processor. It currently describes email enquiries only.
- Decide where the page appears in the navigation. For now it is linked only from the Contact page's research card.

## Verification report

**Verified here, against Cloudflare's Pages runtime (wrangler), a local mock email service and verifier, and a Turnstile stub:**
- As deployed today, with no settings: GET returns `configured: false`, POST returns 503 `not_configured`, and the page says nothing was sent.
- Validation happens before anything is sent: the honeypot field, stale version, unknown card, disallowed action, missing confirmation, over-long text and a failed security check are all rejected, and nothing reaches the email service.
- A provider error (500) is reported as not accepted, and the page never shows "submitted".
- After a dropped connection, the page does not report the enquiry as sent. The retry reuses the same idempotency key, so there is one delivery in total.
- Repeated clicks during a slow submission send one request, with the button disabled and busy.
- On acceptance, the page shows the reference with wording about acceptance, not delivery, and focus moves to the confirmation.
- The email payload goes to the recipient with reply-to set to the visitor. Company text comes from the server manifest; visitor text and the message are labelled as the visitor's.

**Not verified: system acceptance versus confirmed inbox delivery.** No real email service, Turnstile key or recipient exists yet. A `202` means only that the email service accepted the message. Confirmed inbox delivery has not been tested and needs to be checked after configuration:
1. Submit a test enquiry on the preview.
2. Confirm the message arrives in the `ENQUIRY_TO` inbox, not spam, with the reference, and that reply-to works.
3. Check the Resend dashboard shows "delivered".
4. Repeat one submission to confirm the idempotency behaviour against the real service.

## Other changes

- **`_headers`:** `/work-with-us` and `/work-with-us.html` replace the site-wide CSP with the same policy plus `script-src … https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'`. All other pages keep the site policy, which is tested.
- **`contact.html`:** the research card links to "Explore a research collaboration". The published email route is unchanged.
- **`styles.css`:** new `wwu-*` block. The stylesheet key on every page is now `?v=nwpt041`.

## Checks

- `test-work-with-us.mjs`: **140/140**, at 390×844 and 1363×936. It covers all of the above, plus:
  - automated axe checks against WCAG 2.2 A/AA rules on the page, with the drawer open, and after submission;
  - keyboard focus never under the sticky header or the phone agenda bar;
  - reduced motion;
  - no-JavaScript content;
  - no visitor text or contact details in any request URL.
- `check-pages.mjs`: **156/156** on `/work-with-us`, `/contact`, `/programme-room` and `/programme`.
- Regression runs:
  - `test-programme-room.mjs`: 173/173 (the NWPT-040 suite on this branch);
  - `test-nwpt034.mjs`: 35/35;
  - `test-image-checks.mjs`: 8/8.

## Screenshots

`records/screens-nwpt041/`, at 1363×936 and 390×844:
- the opening screen;
- the workspace with the agenda;
- the phone agenda drawer;
- the brief;
- the enquiry as deployed (not configured);
- review and submitted states under test settings with a mock service; these are not real deliveries;
- a sample brief PDF.

## Integrated preview candidate (supersedes the NWPT-041 handoff at `22d1c99`)

1. **Programme Room header fix.** `0c39278` is cherry-picked onto this branch.
   - The overlaps were the stylesheet cache-key line on 41 pages and two blocks appended to the end of `styles.css`. Both CSS blocks are kept; the cache key is now `?v=nwpt042` on every page.
   - Both focus rules are present (`html:has(main.room)` and `html:has(main.wwu)`, plus the phone agenda-bar bottom padding) and tested.
2. **Navigation.** "Work with us" is in the Programme menu, directly after Programme Room, and in the footer before Contact, on every page that has the menu (34). The link on the Contact research card is kept.
3. **Enquiries stay unconfigured.** Browsing, the agenda, the brief, printing and sharing all work without them.
   - Mock "submitted" captures are named `TEST-mock-*` and carry a red "TEST CAPTURE" banner. They live in `records/screens-nwpt041/`, outside the deployed site; see the README there.
4. **Privacy notice.** The draft update is in `records/PRIVACY-NOTICE-UPDATE-NWPT-041.md`:
   - Part A describes the planning tools and is accurate today.
   - Part B covers the form, with the provider, retention, recipient, data location and lawful basis marked unresolved.

   `privacy.html` is unchanged.
5. **Deployment.** Instructions are in `DEPLOY-PREVIEW-NWPT-041.md`. `functions/` is inside `site/`; deploy from inside `site/`.
   - A guard route, `functions/functions/[[path]].js`, answers 404 for `/functions/*` in every deploy mode.
   - `tools/test-deploy-layout.mjs` proves that the API executes when served from inside `site/`, that it does not execute when served from the parent directory, and that no source, helper or tooling file is served.

**Checks on the integration:**
- `test-work-with-us.mjs`: 143/143. This adds navigation on every page, the nav link target and the Contact link.
- `test-programme-room.mjs`: 175/175, including keyboard focus clear of the sticky header.
- `test-deploy-layout.mjs`: 4/4.
- `check-pages.mjs`: 249/249 on 10 pages (Home, Work with us, Programme Room, Contact, Programme, Updates, a Phase 2B update, Evidence, Privacy, 404).
- `test-nwpt034.mjs`: 35/35, covering menu keyboard and touch.
- `test-image-checks.mjs`: 8/8.
