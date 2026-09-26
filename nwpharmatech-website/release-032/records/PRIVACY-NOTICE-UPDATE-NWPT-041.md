# Privacy notice update for “Work with us” (NWPT-041): draft for approval

**Status:** draft. `site/privacy.html` has not been changed. The preview can be reviewed without this update and without the enquiry form being active.

**Basis:** the implementation at the integrated candidate, which is:
- `work-with-us.js`;
- `functions/api/enquiry.js`;
- the `_headers` CSP for `/work-with-us`;
- the current notice, last updated 21 September 2026. The current notice already describes the planned programme-updates form (Buttondown and Turnstile) before it goes live; this draft follows the same pattern.

It has two parts:
- **Part A** describes what the preview does today and has no unresolved details.
- **Part B** describes the enquiry form and contains marked items that must be settled before the form is switched on.

---

## Part A: planning tools on “Explore a research collaboration” (accurate for the preview today)

The proposed new section reads:

> **Research collaboration planning tools**
>
> The “Explore a research collaboration” page lets you answer optional questions, build an agenda of topics and write your own questions. These stay in your browser, in storage that belongs to the open tab and is cleared when the tab or browser session ends. They are not sent to NWPharmaTech unless you choose to submit an enquiry. You can clear your answers and remove agenda items at any time.
>
> Links you copy from the page contain only the page's content version and the identifiers of the public topics and cards you selected. They never include your answers, your questions or any contact details.
>
> Discussion briefs are created in your browser. Printing or saving one as a PDF does not send it to us.

It also needs a matching change to **“What this site collects”**. That section currently says “These pages are static. We do not run an account system, payment system, or open contact form that stores messages on this website.” Proposed replacement, while the form is inactive:

> These pages are static. We do not run an account system or payment system. The research collaboration page keeps your planning notes in your browser only (see below). Online enquiries are not yet active; contact is by email.

**Implementation facts behind Part A:**
- Browser storage is `sessionStorage` under the keys `nwpt-wwu` and `nwpt-wwu-nonce`. Nothing is written to `localStorage` or cookies.
- Share-link fields are `v`, `t` and `c` only.
- The brief is rendered locally and printed with `window.print()`.
- The page makes no analytics calls. With the form unconfigured, its only request to the site's own API is `GET /api/enquiry`, which carries no visitor data.

## Part B: the online enquiry form (for use when the form is switched on)

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
