# Enquiry privacy: company decisions still needed (updated 27 Sep 2026)

This sheet lists only the choices NWPharmaTech must make.
- **Provider facts** are Web Boss's review of 27 Sep 2026 (handoff, "Provider and logging facts"). They are attributed there and not re-checked by Claude.
- Wording marked **PROPOSED, for approval** is a draft.
- **Bracketed items** are blanks for NWPharmaTech to fill: nothing here has been decided or invented.

| # | Decision | Options | Proposed wording, for approval |
|---|---|---|---|
| 1 | **Mailbox retention** for received enquiries | Choose a period, and what starts it: the date received, or the last correspondence | **PROPOSED:** "We keep enquiries in the NWPharmaTech mailbox for [period] after [our last correspondence / receipt], then delete them." |
| 2 | **Deletion method** | A manual review by the accountable owner, or an automatic mailbox rule. Also say whether backups or legal holds extend retention | **PROPOSED:** "Enquiries are deleted by [manual review / an automatic mailbox rule]." |
| 3 | **Other copies** | None, or name where enquiries are copied (a CRM, shared drive or forwarding) | **PROPOSED (if none):** "Enquiries are not copied to other systems." |
| 4 | **Controller identity** | The legal entity name, registered address and privacy contact | **PROPOSED:** "The controller for enquiries is [legal entity name], [registered address]. Privacy contact: [address]." |
| 5 | **Lawful basis** (legal to confirm) | Legitimate interests (responding to professional research-collaboration enquiries), or steps before a contract at the enquirer's request, or both. Consent is not required by the form | **PROPOSED, if legal confirms legitimate interests:** "We process enquiries on the basis of our legitimate interest in considering and responding to research-collaboration enquiries." |
| 6 | **Rights and complaints section** | Add it (recommended for UK/EU GDPR notices) or not | **PROPOSED:** "You can ask us for access to, correction of or deletion of your enquiry by writing to [privacy contact]. You can also complain to [supervisory authority]." |
| 7 | **Resend data-processing agreement** | Web Boss reports that Resend's Article 28 DPA is pre-signed and executed on signup. The choice left is whether the company accepts it as its processor agreement, and whether to file the signed copy (Resend Settings → Documents) | — |
| 8 | **Provider storage, transfer and retention wording** | Approve, amend or omit. The retention sentence holds only if the account is on Free, Pro or Scale; the plan is unknown, so Filipp should confirm it at Resend Dashboard → Billing | **PROPOSED:** "Resend stores enquiry emails and delivery records in the United States. Resend's terms cover this transfer with Standard Contractual Clauses and the EU–U.S. Data Privacy Framework. Our sending domain uses Resend's Ireland (EU) sending region; that is where our emails are sent from, and it does not mean that all processing stays in Ireland or the EU. On our plan, Resend keeps message content and delivery logs for [30 days, if the plan is Free, Pro or Scale]." |
| 9 | **Turnstile and Cloudflare wording** | Approve, amend or omit. No fixed Turnstile retention period was found, so none is stated. Cloudflare's controller or processor role and its transfer mechanism are not confirmed, so neither is named | **PROPOSED:** "The security check is provided by Cloudflare Turnstile under Cloudflare's Turnstile Privacy Addendum. Cloudflare states that Turnstile does not read the contents of form fields." |

**Facts still open (not company choices; they stay under "Not yet confirmed" until answered):**
- the Resend plan name;
- Resend subprocessors and idempotency-key retention;
- Cloudflare's role, transfer mechanism and any localisation setting;
- account-wide Cloudflare Logpush and Workers Observability, and logging on the production Pages project;
- the mailbox host for `nwpharmatech.com`.

When 1–9 are settled, Claude replaces the public "Not yet confirmed" list with the approved wording in a new commit on top of the privacy follow-up (`bfbf132`). That commit goes to the preview first.
