# Privacy notice update for “Work with us” (NWPT-041): draft for approval

**Status:** draft. `site/privacy.html` has not been changed. The preview can be reviewed without this update and without the enquiry form being active.

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
> The website does not store your enquiry. It passes the enquiry to **[EMAIL SERVICE PROVIDER — to be confirmed]**, which delivers it by email to **[RECIPIENT TEAM / ROLE — to be confirmed]** at NWPharmaTech. Your email address is set as the reply-to address so that we can answer you.
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
| Recipient (`ENQUIRY_TO`) and accountable team | Who receives and answers enquiries; not assumed from the Contact page | NWPharmaTech |
| Retention and deletion of enquiries in NWPharmaTech's mailbox | Not documented | NWPharmaTech |
| Lawful basis and controller wording | The current notice does not state these; they need legal confirmation | NWPharmaTech (legal) |
| Turnstile keys and hostnames | These are needed to activate the form. The notice wording reuses the existing Turnstile description | NWPharmaTech / Web PR |

**Recommendation.** Approve Part A for the preview whenever convenient; it describes live behaviour. Approve Part B once the items above are settled, and apply it in the same release that switches the form on. Update "Last updated" at each change.
