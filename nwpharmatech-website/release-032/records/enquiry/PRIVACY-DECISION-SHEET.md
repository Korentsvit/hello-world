# Enquiry privacy: what is still needed (27 Sep 2026)

**Production baseline:** `6e997ddf02513bbb23a909f24f676e4e776b8272`. Enquiries stay **disabled**.

The final privacy candidate will be built on this baseline with `bfbf132`'s privacy changes merged in. A trial merge is clean and keeps the homepage shortcuts and focus fix. **A branch based only on `bfbf132` must not be deployed.**

The published notice will contain **no placeholders**: every slot below is filled from an answer, or its sentence is left out.

---

## 1. Company facts you must supply

| # | Fact | Used for |
|---|---|---|
| A1 | Controller: full legal entity name and registered address | "Who is responsible" (slot A1) |
| A2 | Privacy contact: the address people write to (currently the notice says `team@nwpharmatech.com`; keep it or give another) | "Who is responsible", "Your rights", Contact (slot A2) |
| A3 | Mailbox provider for `nwpharmatech.com` (for example Google Workspace or Microsoft 365) | Where enquiries are held (slot A3) |
| A4 | Are enquiries forwarded or copied anywhere else (another address, CRM, shared drive, ticketing tool)? Yes or no; if yes, where | Other copies (slot A4) |

## 2. Policy proposals for approval

These are **recommendations, not current practice**. Nothing is published until you approve or amend them.

**P1. Mailbox retention.**
- **Recommendation:** keep enquiries for **12 months after our last correspondence** with the enquirer, then delete them. If a collaboration begins, the correspondence moves to the project's records and is governed by that project's terms.
- **Alternatives:** 6 or 24 months; or count from the date received.

**P2. Deletion method.**
- **Recommendation:** an automatic retention rule in the mailbox, if the provider (A3) supports one.
- **Otherwise:** a documented review by the accountable owner every three months.
- **Also confirm:** whether mailbox backups keep deleted items for longer. If they do, the notice says so, using the provider's stated period.

**P3. Lawful basis (legal to confirm).**
- **Recommendation:** legitimate interests, meaning considering and responding to professional research-collaboration enquiries.
- **Alternative or addition:** "steps at your request before entering into a contract".
- Consent is not relied on.

**P4. Rights and complaints wording.**
- **Recommendation:** add the section below. It names no specific authority. The GDPR lets people complain where they live, where they work or where the alleged infringement took place, so no country needs choosing.

### Proposed public wording (replaces the "Not yet confirmed" list)

Slots in «» are filled from section 1, the approved P1–P3, or the Web Boss checks in section 3. None appears in the published text.

> **Research collaboration enquiries** (existing paragraphs unchanged down to "…that is where our emails are sent from; it does not mean that all processing takes place in Ireland or the EU.")
>
> Resend stores message content and delivery records in the United States. Resend's terms cover this transfer with Standard Contractual Clauses and the EU–U.S. Data Privacy Framework. «If W1 confirms Free, Pro or Scale: Resend keeps message content and delivery records for 30 days. — If not confirmed: Resend keeps them for the period set out in its own terms.»
>
> The security check is provided by Cloudflare Turnstile under Cloudflare's Turnstile Privacy Addendum. Cloudflare states that Turnstile does not read the contents of form fields.
>
> Enquiries are received in the NWPharmaTech mailbox, provided by «A3». We keep them for «P1» and then delete them «P2». «If A4 = no: Enquiries are not copied to other systems. — If yes: name where.»
>
> We use your enquiry only to consider and respond to it. We rely on «P3, e.g. our legitimate interest in considering and responding to research-collaboration enquiries».
>
> **Who is responsible**
>
> «A1 legal name», «A1 registered address», is responsible for personal data collected through this website. Privacy contact: «A2».
>
> **Your rights**
>
> You can ask us for access to, correction of or deletion of your personal data, or object to how we use it, by writing to «A2». You also have the right to complain to a data protection supervisory authority, in particular in the country where you live or work.

## 3. Provider and account checks (owned by Web Boss)

| # | Check | Why | Status |
|---|---|---|---|
| W1 | Resend plan name (Resend Dashboard → Billing) | Decides whether the "30 days" sentence is used | Open |
| W8a | Production Pages project: Logpush setting and tail consumers | Only the preview project was checked | Open |
| W8b | Workers Logs / Observability and account-wide Logpush jobs, on both projects | Not covered by the preview check; the API returned 403 | Open |
| W9 | MX records for `nwpharmatech.com` | Cross-checks A3 | Open |
| W4, W5, W6, W7 | Resend subprocessors and idempotency-key retention; Cloudflare's role, transfer terms and localisation setting | Not needed for the proposed wording, which does not state them; recorded for completeness | Open |

**The preview-project evidence is limited.** Web Boss found `logpush: false` and no tail consumers on the preview project's Pages workers. That shows Logpush is off and no tail consumer is attached. It does **not** show that every kind of logging is disabled:
- Workers Logs and Observability were not checked;
- neither was account-level Logpush;
- nor Cloudflare's own request records.

The notice already says Cloudflare "may keep technical request records"; no stronger claim is made.

**Next step:** when section 1 is answered and P1–P4 are approved, Claude prepares the final privacy candidate on the latest production baseline and returns the full notice text for review before activation. No deployment or test emails before then.
