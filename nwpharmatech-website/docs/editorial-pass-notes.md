# Editorial pass notes: correction release

Every change to text that a visitor can see, made in the correction release (after increment C, `a4e31c4`). For each change: the page, the text before and after, and the reason. Changes to markup, links or layout that do not change the wording are left out. The change log (`changelog-correction-release.md`) summarises these; this file is the full record.

**Passes**

| Mark | Pass | Commit |
|---|---|---|
| B | Build gate and checked PDFs | `05a0a70` |
| E | Editorial pass | `d362251` |
| L | Leadership reconciliation | `2272416` |
| M | Mobile menu | `65eec07` |
| S | Sign-up messages | `a49be8a` |
| F | Follow-ups after the merge | `abf8f72`, `7a4011f` |
| R | Review follow-up: records, PDFs and unsourced claims | this pass |

A change marked *superseded* was replaced by a later one, which is listed with it. Quoted text shows the rendered wording, with shared facts filled in.

## Home (`index.html`)

- **E** Section order: hero, "The programme in 90 seconds", brief … → the brief directly below the hero. *Keep the brief prominent.*
- **E** "The programme on one page" → "The programme at a glance". *The download is a 2-page PDF.*
- **E** "…Clinical decisions remain independent of financing, and the treatment's effectiveness is unproven." → "…and the effectiveness of NWPT-SM32300 is unproven." *The newsroom asks writers not to call it a treatment.*
- **E** "Designed to evaluate dose response…" → "Planned to evaluate dose response…". *The protocol is not final.*
- **E** "The Phase 1 study in healthy volunteers was completed in December 2025." → "…was completed on 10 December 2025." *Taken from the shared fact.*
- **E** "Each section of the site carries one label, so you can see how firm the ground is before reading the detail." and four described labels → "Research sections carry one of these labels, so you can see how firm the evidence is." with the Established, Emerging evidence and Open question tags, "Programme information: Facts about our own studies, not a grade of evidence." and a link "What each label means" to `/evidence#labels`. *40 words or fewer; programme information kept apart from evidence grades.*
- **E** "Study design, participant safety, analysis and publication are decided by the clinical and scientific leadership, subject to regulators and research ethics committees. Funders and investors have no say in them." → "Clinical decisions, such as study design, eligibility and safety, are kept independent of funding and financing. Each study needs approval from a medicines regulator and a research ethics committee before it can start." *The governance detail is in no record; aligned with the people page.*
- **E** "…and financing has no influence on clinical decisions." → "…and clinical decisions are kept independent of financing." *Same wording as the brief.*
- **B** "Download the brief (PDF, 2 pages)" → "Download the brief (PDF, 2 pages, 67 KB)". *Page count and size come from the checked PDF, not fixed text, so the size follows the file.*
- **R** Latest update: "The statistical and pharmacokinetic analysis outputs for the Phase 1 study were delivered. A results summary will be published after review." → "…were delivered." *No record states a publication plan. The analysis record says only that results are not to be published until reconciled. An update states what happened.*

## Programme updates (`updates.html`)

- **E** "Dated events that have happened. Planned steps are listed separately on the study page. When something changes, we add a dated entry rather than rewriting earlier ones." → last sentence removed. *Unadopted editorial practice; moved to the proposal.*
- **E** Link "Editorial standards" (`newsroom#standards`) → "Corrections log" (`newsroom#corrections`). *The standards section was removed.*
- **R** Timeline entry of 30 March 2026: "…A results summary will be published after review." removed, as on the home page.

## The programme (`programme.html`)

- **E** "Any Phase 2B study will start only after approval by a research ethics committee and the relevant medicines regulators. Participants will give informed consent, keep their usual care, and be free to leave at any time. Because cannabidiol can affect liver tests and interact with other medicines, safety monitoring will include blood tests and medicine checks." → "The Phase 2B study can start only after approval by a research ethics committee and the relevant medicines regulators. Anyone taking part would give informed consent and could leave at any time. Cannabidiol can raise liver enzymes and interact with other medicines, [Source: Epidyolex SmPC] so safety monitoring will be set out in the study protocol." *The protocol is not final.*
- **E** *(superseded)* "When recruitment opens, eligibility and study sites will be published here and on the public trial registry." → "The study will be registered publicly before anyone is enrolled, and its registry entry will list the eligibility criteria and study sites."
- **R** That sentence is removed; the aside keeps "Not yet: the Phase 2B study is not recruiting, and we cannot supply NWPT-SM32300 outside an approved study." *No record states the registration plan: its only source was the website brief, which does not mention registration.*

## The study (`study.html`, study-hub module)

- **E** "Further design details will be published here when the protocol is final and approved." → removed. *Commitment in no record.*
- **E** "A two-page summary of the programme, generated from the same facts as this page." → "A summary of the programme, generated from the same facts as this page." *No fixed page counts.*
- **E** "Version history is shown under Document history." → removed. *That section is not shown until a version is published.*
- **E** "…otherwise we say what the record states. No completion percentages or recruitment numbers are shown, because none exist yet." → "…otherwise we say what the record states." *The note explained what we chose not to show.*
- **E** Design card "Programme brief: Phase 2B aims", "Source and version: Website brief, September 2026" → "Population and aims", "Source and version: NWPharmaTech, September 2026". *Internal source name.*
- **E** "Oversight arrangements for the Phase 2B study have not yet been established. They will be described here when they are." → "Oversight arrangements for the Phase 2B study have not yet been published." *Unrecorded claim and promise.*
- **E** Document history section ("Substantive changes to public documents. Staging drafts are listed as unpublished." and a table of staging drafts) → left out until a version is published; when shown: "Substantive changes to published documents." with Version, Date and Change columns. *It read as internal workflow.*
- **E** Publication policy section (`#publication-policy`, "Draft for management adoption", five proposed points) → removed; the text is now `docs/proposals/publication-policy.md`. *Unadopted draft.*
- **R** Summary, current stage: "Phase 2B study planned. Protocol being finalised. Not recruiting." → "Phase 2B study: Planned. Not recruiting. Protocol being finalised." *Built from the same status facts as the rest of the site, and printed unchanged in the programme brief.*
- **R** Public synopsis: "The Phase 2B study is not recruiting. It will start only after regulatory and research ethics approval, and will be registered publicly before anyone is enrolled." → "The Phase 2B study is not recruiting. It can start only after regulatory and research ethics approval." *Registration plan in no record.*
- **R** Registrations: "The Phase 2B study will be registered before the first participant is enrolled, and its registry entries will be listed here." → removed. *Same reason.*
- **R** Sponsor: "…NWPharmaTech Ltd was the sponsor of the Phase 1 study. The sponsor of the Phase 2B study will be named in its registry entry." → "…NWPharmaTech Ltd was the sponsor of the Phase 1 study." *It relied on the unrecorded registration plan. The oversight list still says Phase 2B arrangements have not yet been published.*
- **R** Clinical milestones: rows "Phase 1: results summary on registries and this site · Planned · Date not set · Company records" and "Phase 2B: public registration before first enrolment · Planned · Date not set · Company records" → removed. *Neither is a recorded plan. Their sources were management instructions to the web team, which the table showed as "Company records". The first came from the unadopted publication policy.*
- **R** Funding milestones: row "Programme financing route for eligible investors · In progress · In development; not available · Company records" → removed. *Its only source is a development instruction. The funding and financing page still describes the route as in development.*

## Phase 1 study (`phase-1.html`, phase-1 module)

- **E** *(superseded)* "When results are published, this section will show each measure, what was found, the limitations and the source report, and a plain-language summary will be posted on both registries." → "A results summary is planned for both trial registries and this page. No date has been set."
- **R** Results publication status: "Results will be published after the study report and plain-language wording have been reconciled and approved. A results summary is planned for both trial registries and this page. No date has been set." → "Results have not been published. They will not be published until the clinical study report and the plain-language wording of the results have been reconciled." *The analysis record says results are not to be published until reconciled. No record states a plan to publish a summary on the registries or this site; that comes from the unadopted publication policy.*
- **R** "The study had pre-specified stopping rules and did not use a data monitoring committee, which is usual for a small single-dose study in healthy volunteers." → "…and did not use a data monitoring committee." *The study records support only that no committee was used; "usual" was an unsourced general claim.*

## Questions and answers (`faq.html`)

- **E** `[TBC: re-check each number … immediately before launch]` → removed from the template; now a `content/review.json` blocker. *It was never rendered.*
- **E** Heading "About the treatment" → "About the investigational medicine". *Not a treatment.*
- **E** "The planned Phase 2B study is designed to provide the first evidence on dose response, symptoms, safety and tolerability." → "The planned Phase 2B study is intended to give the first evidence in people at clinical high risk, looking at dose response, symptoms, safety and tolerability." *The design is not final.*
- **E** "Their content and quality vary, some contain THC, and CBD can interact with other medicines." → "They are not licensed medicines, and CBD can interact with other medicines. [Source: Epidyolex SmPC]" *Unsourced claims.*
- **E** "Frequent use of high-THC cannabis is associated with a higher risk of psychosis." → "Daily use of high-THC cannabis… [Source: Di Forti et al. 2019]" *Matches the recorded source.*
- **E** "…which may matter for dietary or religious reasons. Full ingredients will be listed in participant information for any study." → last sentence removed. *Unrecorded commitment.*
- **E** *(superseded)* "Not yet. It needs regulatory and ethics approvals before it can start. Recruitment details will be published on the updates page and on the public trial registry." → "Not yet. It needs regulatory and research ethics approval before it can start, and it will be registered publicly before anyone is enrolled."
- **R** → "Not yet. It needs regulatory and research ethics approval before it can start." *Registration plan in no record.*
- **E** *(superseded)* "The study is planned for people at clinical high risk of psychosis, as assessed by specialist services. Full eligibility criteria will be published with the protocol summary." → "The study is planned for people at clinical high risk of psychosis. Its full eligibility criteria will be listed in its public registry entry."
- **R** → "The study is planned for people at clinical high risk of psychosis. Its detailed eligibility criteria have not been published." *No record of a registry entry or a protocol summary; this says only what is true now.*
- **E** "No. Participants would continue to receive their usual care throughout, and could leave the study at any time without it affecting their care." → "Taking part in any study is voluntary, and anyone taking part can leave at any time without it affecting their usual care. How the Phase 2B study would fit alongside usual care will be set out in its participant information." *The design is not final.*
- **E** "The programme has been funded privately to date. We are developing a financing route for eligible investors; see programme financing. Funding does not influence clinical decisions." → "What funding supports, who controls spending and how progress is reported are explained under funding and financing. We are developing a financing route for eligible investors, but no investment is being accepted. Clinical decisions are kept independent of funding." *The funding-history claim is withheld until confirmed.*
- **E** *(superseded)* Q "Will you publish results if they are negative?" A "That is our intention. A publication policy … has been drafted for management adoption." → Q "Will study results be published?" A "Results of the completed Phase 1 study have not been published yet. A results summary is planned for both trial registries and this site; see the Phase 1 study. The Phase 2B study will be registered publicly before anyone is enrolled."
- **R** → Q "Have the Phase 1 study results been published?" A "Results have not been published. They will not be published until the clinical study report and the plain-language wording of the results have been reconciled. See the Phase 1 study." *The results summary and the registration plan are in no record. The question now asks what the records can answer, and the answer is the shared fact used on the Phase 1 page and in the brief.*
- **R** Urgent help: no change to the wording or numbers. The numbers now come from one list (`content/services.json` → `crisis_lines`), which also fills the appointment preparation sheet.

## Funding and financing (`financing.html`)

- **E** `[TBC: board and legal approval of the funding and financing wording on this page before publication]` → removed from the template; now a `content/review.json` blocker.
- **E** "Clinical decisions (study design, eligibility, dosing, safety, analysis and publication) are made by the clinical and scientific leadership and approved by regulators and research ethics committees. Funders and investors have no say in them and no access to participant data." → "Clinical decisions, including study design, eligibility, dosing and safety, are kept independent of funding and financing. Each study needs approval from a medicines regulator and a research ethics committee before it can start." *Commitments in no record.*
- **E** "We never make unsolicited investment approaches; please report any you receive." → "If you are unsure whether a message comes from us, please contact us." *Unsupported: the company has approached investors.*

## Evidence library (`evidence.html`)

- **E** Small paragraph on evidence labels → new section "How evidence is labelled" (`#labels`): "These labels are used on the research sections of this website and on the study cards below, one label at a time. Negative, mixed, inconclusive and not-conducted findings are also flagged on the cards." with the four labels and their meanings. *The homepage links to the full explanation.*
- **E** "A monthly review process has been prepared. A review is listed here only after it has taken place." → removed. *Internal process; unadopted commitment.*
- **E** "Last checked … official pages. The original pages are being opened and checked before launch." → second sentence removed. *Internal staging process.*
- **F** Review log, method: "Search-engine summaries of publisher, PubMed, registry and official pages (primary pages blocked from the build environment)" → "Search-engine summaries of publisher, PubMed, registry and official pages". *Internal detail of the staging environment.*

## Clinical need (`clinical-need.html`)

- **E** "…about one in four has done so within three years, with wide variation between services." → "…with wide variation between studies." *Matches Salazar de Pablo 2021; the value comes from the shared fact.*
- **E** "Psychological therapy helps many people, but not everyone can access it and not everyone benefits. Antipsychotic side effects are generally considered too great a burden for people who do not have psychosis, most of whom will not develop it." → "Psychological therapy is the recommended first step, but it does not prevent psychosis in everyone. [Source: Stafford 2013] Antipsychotics are not recommended for people at clinical high risk, most of whom will not develop psychosis. [Source: NICE CG178]" *Unsourced access and benefit claims.*
- **E** "Psychological therapy is recommended first, but no intervention has been shown to be better…" → "No intervention has been shown to be better…". *It repeated the paragraph above.*

## Science and formulation (`science.html`, formulation module)

- **E** "A fixed 300 mg capsule also avoids measuring doses from an oil." → "A fixed-strength capsule also avoids measuring doses from an oil." *The strength comes only from the shared fact.*
- **E** "Each capsule contains 300 mg, so doses are multiples of 300 mg. … The doses for the Phase 2B study will be published with its design." → "…so doses are whole numbers of capsules. … The doses for the Phase 2B study have not been confirmed." *Unrecorded commitment; Phase 2B doses are unconfirmed.*

## Families guide (`families.html`, family-guide module)

- **E** "A one-page sheet to fill in by hand before an appointment" → "A sheet to fill in by hand before an appointment". *No fixed page counts.*
- **B** "Download the sheet (PDF, 1 page)" → "Download the sheet (PDF, 1 page, 42 KB)". *From the checked PDF; the size follows the file.*

## People (`people.html`)

- **L** Hero lead → "Expertise in clinical high risk of psychosis, clinical trial design and cannabinoid science, alongside the company's management, board members and senior advisers." *Titles and groups follow the reconciled records.*
- **L** "Advisers are independent experts. Their involvement does not mean their institutions endorse the programme." → "Naming a university, hospital or company on this page does not mean that it endorses the programme." *No one is presented as an adviser without a confirmed title.*
- **L** One section "Company leadership and board" → two sections, "Management" and "Board and senior advisers". *Separates executive roles from board and advisory roles without stating unconfirmed titles.*
- **L** Governance bullets → "Clinical decisions, including study design, eligibility, safety and conduct, are kept independent of funding and financing." and "Each study needs approval from the medicines regulator and a research ethics committee before it can start." The SAP and unblinding bullet, the investor-rights bullet and the "draft publication policy" link are removed. *Phase 1 was open-label and no record shows the plan was adopted; the investor commitments await board and counsel approval; the policy is unadopted.*
- **L** Scott Woods: title "Adviser on clinical high risk of psychosis" removed; descriptor "Clinical high risk of psychosis (CHR-P)"; responsibility "Brings expertise in clinical high risk of psychosis, including how it is assessed, to the design of the programme's studies." *Management instruction: do not call him an adviser; no title is confirmed.*
- **L** John Kane: title "Chair, Scientific Advisory Board" and "Chairs the programme's Scientific Advisory Board." removed; responsibility "Leads the programme's clinical trial design." *The board chair appears only in the August 2026 teaser, which is never the sole authority for a current appointment.*
- **L** Filipp Korentsvit: "Chief Executive Officer and Founding Partner" → "Chief Executive Officer". *"Founding Partner" appears in one record only.*
- **L** William Jarosz: "Executive Chairman" and "Chairs the board; focuses on biotech partnerships." removed; descriptor "Pharmaceutical business and finance". *The teaser names two chairmen and older records conflict; management instruction not to list both.*
- **L** Richard Barker: "Non-Executive Chairman" and "Non-executive board role." removed; descriptor "Life-sciences leadership". *Same conflict.*
- **L** Gillian Cannon: "Non-Executive Director" → "Board Member"; descriptor "Pharmaceutical commercial strategy"; "Non-executive board role." removed. *Only the shared part of the records is shown; "non-executive" is in the teaser only.*
- **L** New profile: Professor Trevor Jones CBE, Senior Adviser; descriptor "Regulatory and clinical development"; biography "Senior leader in the pharmaceutical sector. Former research and development director at the Wellcome Foundation and former chair of the European Medicinal Cannabis Association."; affiliation "Visiting Professor, King's College London". *Management instruction not to omit him; only statements in the company records and confirmed by a search summary are used.*

## Newsroom (`newsroom.html`, newsroom module)

- **E** "Verified facts for journalists…" → "Key facts for journalists…". *Several facts are checked only through search summaries.*
- **E** Meta description "Press kit, fact sheet, programme reports, corrections log and editorial standards…" → "Press kit, fact sheet, how progress is reported and the corrections log…". *No reports exist; the standards were removed.*
- **E** Editorial standards section (`#standards`, "Draft for adoption", "They will apply once adopted by management.") → removed; the text is now `docs/proposals/editorial-standards.md`. *Unadopted draft.*
- **L** Press-kit photo captions (shown only once portraits are authorised) use the title or, where the title is withheld, the descriptor. *Same rule as the profile cards.*
- **B** "Programme brief (PDF)" → "Programme brief (PDF, 2 pages, 67 KB)". *From the checked PDF.*
- **S** Sign-up messages (the form is off unless the build is run with `--with-signup` after a recorded live provider test):
  - Unconfirmed outcome (502/504, and in the browser): "We could not sign you up just now. Nothing was saved. Please try again later." → "We could not get confirmation that your sign-up was received, so it may or may not have been recorded. If an email arrives asking you to confirm your address, please follow the link in it. If none arrives, please try again later." *"Nothing was saved" could be untrue.*
  - Not configured (503): "…Nothing was saved." → "Email sign-up is not available at the moment, and your address has not been sent anywhere. Please try again later." *Certain, because the function stops before reading the form.*
  - New, for a provider refusing the request (other 4xx): "Our email provider did not accept the sign-up. Please try again later." *Previously the outage message.*
  - Honeypot: "Thank you. Please check your inbox to confirm your email address." → the accepted message, "Thank you. Please check your inbox and confirm your email address. You will not receive updates until you confirm." *Bots cannot tell the difference.*
  - No-JavaScript answer page: link back to `/newsroom#signup` instead of `/newsroom.html#signup`. *Extensionless route.*

## Contact (`contact.html`)

- **E** Email card "Please write or telephone. A public enquiries email address will be added once a monitored mailbox is confirmed." → removed; the Telephone and Post cards remain. *A note to the team.*
- **E** "Head office, UK business hours" → "Head office". *Hours not recorded.*

## Legal (`legal.html`)

- **E** `[TBC: legal review of the full privacy notice, retention period and data protection contact]` → removed from the template; now a `content/review.json` blocker. *No visible change: it was never rendered.*
- **R** Accessibility: "The site supports keyboard navigation, visible focus, screen readers, text resizing to 200% and use without JavaScript." → "The site is designed for keyboard navigation, visible focus, text resizing to 200% and use without JavaScript, and automated tests check these. It has not yet been tested with screen readers." *No screen reader has been used to test the site (`accessibility-testing.md`).*

## Navigation (every page)

- **M** Mobile menu: the duplicate "Home" link is removed; one remains. *Two Home links in one menu.*
- **M** Mobile menu: new quick link "Programme brief" to the home page's brief section (`/#programme-brief`). *Keep the brief one tap away.*
- **B** Footer: "Programme brief (PDF)" → "Programme brief (PDF, 2 pages, 67 KB)". *From the checked PDF.*

## Programme brief PDF

- **E** *(superseded)* "Version 3 (staging draft) · 23 September 2026" → "Version 3 · 23 September 2026".
- **R** → "Version 4 · 23 September 2026 · Draft for review". *The brief is still an unapproved draft, so its status from `documents.json` is shown until a version is published. It is a status, not an instruction. Version 4 because the content below changed.*
- **E** "…recognising that the treatment's effectiveness remains unproven." → "…that the effectiveness of NWPT-SM32300 remains unproven." *Not a treatment.*
- **E** Table row "Sponsor" → "Company". *The Phase 2B sponsor has not been named.*
- **E** "www.nwpharmatech.org/evidence.html · … www.nwpharmatech.org/study.html" → "www.nwpharmatech.org/evidence · … www.nwpharmatech.org/study". *Extensionless routes.*
- **E** Heading "What is established, and what is not" left at the foot of page 1 → kept with its list on page 2. *Layout; still 2 pages.*
- **R** Completed: "Phase 1 study: 14 healthy adult volunteers aged 18 to 55; randomised, open-label, three-period crossover; single oral doses of NWPT-SM32300 600 mg and 900 mg, and the licensed cannabidiol oral solution Epidyolex as comparator. Completed 10 December 2025; database locked 11 March 2026. Registered as NCT07186283 and ISRCTN25163383. Results not yet published." → "Phase 1 study in 14 healthy volunteers: completed 10 December 2025; database locked 11 March 2026; analysis outputs delivered 30 March 2026. Design: randomised, open-label, three-period crossover; single oral doses of NWPT-SM32300 600 mg and 900 mg, and the licensed cannabidiol oral solution Epidyolex as comparator. Registered as NCT07186283 and ISRCTN25163383. Results have not been published. They will not be published until the clinical study report and the plain-language wording of the results have been reconciled." *The row is now the study hub's "Completed so far" text and the shared results status, so a change to either reaches the PDF and regenerates it.*
- **R** Current stage: "Phase 2B study in people at clinical high risk of psychosis: Planned. Not recruiting. Protocol being finalised." → "Phase 2B study: Planned. Not recruiting. Protocol being finalised." *The study hub's "Current stage" text, for the same reason.*
- **R** The "nw pharmatech" wordmark now comes from the logo slot. *No visible change until the official logo is authorised; then the logo appears here too.*

## Appointment preparation sheet PDF

- **R** New header line: "nw pharmatech" and "Version 2 · Draft for review". *The logo slot reaches this PDF too, and the sheet is still an unapproved draft. Version 2 because the sheet changed.*
- **R** "…UK: 999, NHS 111 (option 2 in England and Wales), Samaritans 116 123. General information…" → "…UK: 999, NHS 111 (option 2 in England and Wales), Samaritans 116 123. Numbers checked 23 September 2026. General information…". *The numbers now come from the same list as the Q&A urgent-help section, and the date of the last check goes with them.*

## Restricted staging area (not public)

- **F** Restricted pages link only to restricted pages: the footer's public links and the urgent-help link are left out, and a restricted "Not found" page says "There is no page at this address in the restricted area." with a link to the restricted index. *The restricted project serves nothing from the public site.*
