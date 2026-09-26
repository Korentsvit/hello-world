# Privacy notice update for “Work with us” (NWPT-041): draft for approval

**Status:** draft. `site/privacy.html` has not been changed. The preview can be reviewed without this update and without the enquiry form being active.

> **27 Sep 2026: Part B applied to `site/privacy.html` on the preview candidate** (branch `claude/nwpt-enquiry-preview`, from live `6affaba` plus records). It follows the Web Boss handoff `records/enquiry/CLAUDE-ENQUIRY-PRIVACY-PREVIEW-2026-09-27.md`.
>
> - **What the notice now covers:** the new section "Research collaboration enquiries" describes the actual processing:
>   - only what the visitor explicitly submits is sent;
>   - Cloudflare Turnstile checks the submission;
>   - Resend sends it from website@nwpharmatech.org to "the NWPharmaTech team", with reply-to set to the visitor;
>   - nothing is stored on the website;
>   - the Resend sending region is Ireland (EU).
> - **Distinction kept:** the planning-tools section still says browser-only, now "not sent … unless you choose to submit an enquiry".
> - **Same wording whether the form is on or off:** the notice describes processing "when the online enquiry form … is available" and says nothing is sent when the page shows it unavailable. So it is correct on the preview once the form is on, and on production while the form stays off; it never calls enquiries inactive.
> - **Still unresolved,** listed publicly under "Not yet confirmed" and not invented:
>   - mailbox retention and deletion;
>   - Resend retention;
>   - other processing locations and international transfers;
>   - lawful basis.
> - **Last updated:** 27 September 2026.

**Before production publication (management, 26 September 2026):**
- **Part A** describes the workspace behaviour that is already active: tab storage, share links and the locally generated brief. It must be settled and applied to the privacy notice before the page is published to production.
- **Part B**, the enquiry form, stays dependent on the actual provider, recipient and retention arrangements. It is applied only when the form is switched on.

**Basis:** the implementation at the integrated candidate, which is:
- `work-with-us.js`;
- `functions/api/enquiry.js`;
- the `_headers` CSP for `/work-with-us`;
- the current notice, last updated 21 September 2026. The current notice already describes the planned programme-updates form (Buttondown and Turnstile) before it goes live; this draft follows the same pattern.

It has two parts:
- **Part A** describes what the preview does today and has no unresolved details.
- **Part B** describes the enquiry form and contains marked items that must be settled before the form is switched on.

---

## Part A: exact wording for publication review (the browser-only workspace that is active now)

> **Applied to `site/privacy.html`** in the publication-candidate follow-up to `9022854`, with management's refinements:
> - "These pages are static." is removed, because the site now includes an API.
> - The tab-close sentence is replaced with: "Your optional answers, agenda and questions are stored in your browser for this tab’s session. Browser session-restoration features may preserve them. You can clear your answers and remove agenda items using the page controls. These planning contents are not sent to NWPharmaTech."
> - "one request" became "one extra request", because the page also loads its normal files.
>
> The notice is dated **26 September 2026**, and `sitemap.xml` `lastmod` is 2026-09-26. If production publication happens on a later day, change both dates to that day. Part B is **not** applied. The text below is the earlier draft, kept for the record.

This is ready to apply to `site/privacy.html` once approved. It describes only what the page does today. It names no email provider, recipient or retention arrangement, because the enquiry form is not active. Change 3 moves the notice's existing "Last updated" date, which currently reads 21 September 2026.

**1. Replace** the paragraph under “What this site collects” that begins “These pages are static.” with:

> These pages are static. We do not run an account system or payment system. The “Explore a research collaboration” page keeps your planning notes in your browser only, as described below. Online enquiries are not active; contact is by email.

(The next paragraph, about emailing team@nwpharmatech.com, stays as it is.)

**2. Add a new section** after “Cookies and analytics”:

> **Research collaboration planning tools**
>
> The “Explore a research collaboration” page lets you answer optional questions, build an agenda of topics and write your own questions. These are kept in your browser's storage for the open tab. They are removed when you close the tab, and you can clear your answers or remove agenda items at any time. They are not sent to NWPharmaTech.
>
> To show whether online enquiries are available, the page makes one request to this website. That request contains none of your answers, agenda items or questions.
>
> Links you copy from the page contain only the page's content version and the identifiers of the public topics and cards you selected. They never include your answers, your questions or any contact details.
>
> Discussion briefs are created in your browser. Printing a brief or saving it as a PDF does not send it to us.

**3. Update** “Last updated: 21 September 2026.” to the date the change is published.

**Implementation facts behind Part A** (at candidate `367099e` and its follow-up):
- **Storage:** `sessionStorage` only, under the keys `nwpt-wwu` (answers, topics, agenda and the visitor's questions) and `nwpt-wwu-nonce` (a random value). No `localStorage` and no cookies.
- **Share-link fields:** `v`, `t` and `c` only. The link is removed from the address bar after it is opened.
- **Brief:** rendered in the page and printed with `window.print()`.
- **Requests:**
  - With enquiries unconfigured, the page's only request to the site's API is `GET /api/enquiry`, which carries no visitor data.
  - The security-check script is not loaded while enquiries are unconfigured.
  - The page makes no analytics calls.
  - Tests assert that no request URL carries visitor text.

## Part B: the online enquiry form (NOT part of this publication review; only when the form is configured)

The proposed text replaces “Today, contact is by email only” for research enquiries:

> **Research collaboration enquiries**
>
> If you submit an enquiry from the “Explore a research collaboration” page, we collect:
> - your name, email address and institution or organisation;
> - your role, if given;
> - an optional message;
> - the agenda items you selected, with any questions you wrote;
> - if you choose to include them, your answers to the optional focus questions;
> - your confirmation that the enquiry contains no confidential or unpublished information and no patient or health information.
>
> The enquiry is checked by Cloudflare Turnstile, an anti-abuse service. It may process technical request signals such as IP address and browser or device signals to verify the submission, and a submission may be refused when the check cannot be verified.
>
> The website does not store your enquiry. It passes the enquiry to **[EMAIL SERVICE PROVIDER — to be confirmed]**, which delivers it by email to the NWPharmaTech team. Your email address is set as the reply-to address so that we can answer you.
>
> Enquiries are kept **[RETENTION PERIOD AND DELETION ARRANGEMENTS — to be confirmed]**. The email service keeps delivery records **[PROVIDER RETENTION — to be confirmed]**.
>
> **[DATA LOCATION / INTERNATIONAL TRANSFERS — to be confirmed for the chosen provider]**
>
> We use your enquiry only to consider and respond to it. **[LAWFUL BASIS — to be confirmed by NWPharmaTech]**
>
> Please do not include confidential or unpublished information, patient information, health data or clinical records. The form does not accept file uploads. Provider privacy terms apply to their processing.

**Implementation facts behind Part B:**
- **Fields.** The function accepts only these: `name`, `email`, `organisation`, `role`, `message`, `answers`, `agenda` (card id, action code and the visitor's question), `confirm`, the Turnstile token, an idempotency key, and a honeypot field.
- **No storage or logging.** The function stores nothing and does not log the request body. It sends one email and returns a reference.
- **The email.** It goes to `ENQUIRY_TO`, from `ENQUIRY_FROM`, with `reply_to` set to the visitor's address. The subject is "Research collaboration enquiry — <organisation>". The body is plain text; company statements come from the site and the visitor's own text is labelled.
- **Turnstile.** The function verifies the token with Cloudflare Turnstile, sending the token, the visitor IP (`CF-Connecting-IP`) and the idempotency key.
- **Provider named in code.** The code sends through Resend (`api.resend.com`). No Resend account, verified sending domain or key has been provided for this project, so the provider is **proposed, not confirmed**.

## Unresolved before the form can be switched on (not invented here)

| Item | Why it matters | Owner |
|---|---|---|
| Email service provider | The code targets Resend. The contract, data-processing terms and account are not confirmed. Choosing another provider needs a small code change | NWPharmaTech |
| Data location and international transfers | These depend on the provider and account region | NWPharmaTech, with the provider |
| Provider retention of messages and logs | Set by the provider and account settings | NWPharmaTech, with the provider |
| Recipient (`ENQUIRY_TO`) and accountable team | **Decided 26 Sep 2026:** the internal inbox is recorded in the activation handoff, with Filipp as the accountable owner. The public wording is "the NWPharmaTech team" (a role, not a person) | Done |
| Retention and deletion of enquiries in NWPharmaTech's mailbox | Not documented | NWPharmaTech |
| Lawful basis and controller wording | The current notice does not state these; they need legal confirmation | NWPharmaTech (legal) |
| Turnstile keys and hostnames | These are needed to activate the form. The notice wording reuses the existing Turnstile description | NWPharmaTech / Web PR |

**Recommendation.** Approve Part A for the preview whenever convenient; it describes live behaviour. Approve Part B once the items above are settled, and apply it in the same release that switches the form on. Update "Last updated" at each change.

---

# Production privacy decisions (prepared 27 Sep 2026)

This section is prepared on branch `claude/nwpt-privacy-production-prep`, from the candidate under test (`646693d`, which is left unchanged).

**How far each fact has been verified.**
- **Account settings: verified.** These come from Web Boss's and Filipp's reports of the live Resend and Cloudflare accounts.
- **Official documentation: not read directly.** `resend.com`, `developers.cloudflare.com` and `cloudflare.com` are blocked from this environment. Those facts come from web-search summaries of official pages, which are named below. Each needs opening and confirming on the official page by Web Boss or Filipp before it is published. None of them has been published.

## A. Application storage: checked against the implementation

Result: "Nothing is stored on the website" was accurate only for our own code, so it has been replaced by a precise description on this branch.

| Place | What is held | Basis |
|---|---|---|
| Our application (`functions/api/enquiry.js`) | **Nothing persisted.** No KV, D1 or R2 bindings; there is no wrangler config in `site/`. There are no `console` calls. The enquiry is built in memory, sent once to Resend, and the response returns only a reference | Code audit |
| Visitor's browser | `sessionStorage` `nwpt-wwu` (answers, topics, agenda, the visitor's questions) and `nwpt-wwu-nonce` (a random value). Contact fields are never stored | Code audit |
| Cloudflare hosting (operational) | Request metadata such as IP, user agent and time, as the notice already says. Pages Functions invocation logs, errors and exceptions are visible in real-time logs, which are ephemeral. They are **persisted only if Workers Logs or Logpush is enabled** for the project. Our code does not log the body | Code audit; Cloudflare docs (search summary: "Real-time logs", "Debugging and logging · Pages") |
| Cloudflare Turnstile (provider) | The widget processes client signals: IP, TLS fingerprint, User-Agent, sitekey and origin. Our server's siteverify call sends the token, the visitor's IP (`remoteip`) and the idempotency key | Code audit; Turnstile privacy addendum (search summary) |
| Resend (provider) | The sent email (content and metadata) and delivery logs. The idempotency key is kept for 24 hours | Resend docs (search summary: "Idempotency Keys") |
| NWPharmaTech mailbox (`Filipp.korentsvit@nwpharmatech.com`) | The delivered email and any reply thread | Settled recipient |

**Web Boss to confirm:** whether Workers Logs or Logpush is enabled on either Pages project. If it is, the notice should mention retained request logs.

## B. NWPharmaTech mailbox retention and deletion: needs Filipp's decision

1. **Retention period for received enquiries,** and what starts the clock: date received, or last correspondence.
2. **Deletion method and responsibility:** manual deletion by Filipp, or a mailbox retention rule. Also whether the email provider's own backups or legal holds extend it.
3. **Whether enquiries are copied anywhere else,** such as CRM, shared drives or forwarding. If so, those need listing.
4. **Mailbox provider and location:** which email service hosts `nwpharmatech.com` mail, and where. This is a fact to verify, not assume.

## C. Provider retention, locations and transfers: needs factual verification

| Item | Lead from the official source (search summary; not yet verified) | What verification needs |
|---|---|---|
| Resend: retention of email and log data | "While your account is active, email and log data is retained for 30 days on Free, Pro, and Scale plans; Enterprise plans include flexible data retention." After termination, data is deleted within 90 days, and backups persist for 7 days (resend.com/security/gdpr) | Confirm on the page, and confirm the **account's plan** in Resend billing |
| Resend: idempotency keys | Kept for 24 hours (resend.com/docs/dashboard/emails/idempotency-keys) | Confirm on the page |
| Resend: storage location | Customer data, including message content, delivery logs and account records, is **stored in the United States**. Choosing `eu-west-1` means emails are **dispatched** from Ireland, but account data still resides in the US (resend.com/security/gdpr; resend.com/docs/dashboard/domains/regions) | Confirm on both pages |
| Resend: transfers | Transfers to the US are covered by the EU Standard Contractual Clauses in the DPA, and by EU-U.S. Data Privacy Framework participation, including the UK Extension. The DPA was updated 12/31/2025 (resend.com/legal/dpa; resend.com/security/gdpr) | Confirm; decide whether to accept or sign the DPA for the company account |
| Resend: subprocessors | These include Stripe, Supabase, Svix and Tinybird, all in the USA (resend.com/legal/subprocessors) | Confirm the current list |
| Turnstile: data and retention | The signals are listed in the Turnstile privacy addendum (cloudflare.com/turnstile-privacy-policy). No retention period was found in the summary | Read the addendum for retention and role (controller or processor) |
| Cloudflare: locations and transfers (hosting, logs, Turnstile) | Cloudflare DPA (cloudflare.com/cloudflare-customer-dpa) | Confirm the transfer mechanism and any data-localisation settings on the account |

**The Ireland region:** it is the sending region only. Section C indicates that storage is in the US. The site text on this branch now says the region "does not mean that all processing takes place in Ireland or the EU". No EU-residency statement may be published.

## D. Lawful basis: needs confirmation (legal)

1. **Lawful basis for processing enquiries.** Legitimate interests (responding to professional research-collaboration enquiries) is the usual candidate. Steps at the request of the data subject before entering into a contract is an alternative for some enquiries. Consent is not required by the implementation. Legal to choose and word.
2. **Controller identity and contact:** the notice does not yet name the controller, for example the NWPharmaTech legal entity and its address, or a privacy contact beyond `team@nwpharmatech.com`.
3. **International-transfer wording,** once section C is verified.
4. **Data-subject rights and complaint route** (UK/EU): whether the notice should add them. It currently has none.

## Site text changed on this branch (not on the candidate under test)

- **`privacy.html`:**
  - "This website does not store your enquiry." is replaced with: "The website’s code does not save your enquiry. It is not written to a database or file on this website, and our code does not write its content to any log. It is passed directly to Resend…"
  - Added: "Copies of the email are then held by Resend and in the NWPharmaTech mailbox (see “Not yet confirmed” below). Our hosting provider, Cloudflare, may keep technical request records, as described under “Cookies and analytics”."
  - The region sentence now reads: "Our sending domain uses Resend’s Ireland (EU) sending region. That is where our emails are sent from; it does not mean that all processing takes place in Ireland or the EU."
- **`work-with-us.js`:** the form notice "Nothing is stored on this website." now reads "The website’s code does not save it; Resend and our mailbox keep copies." The script key is `nwpt046`.
- **Unchanged:** the "Not yet confirmed" list stays until sections B–D are settled.
