# NWPharmaTech.org: website handoff

A static website for www.nwpharmatech.org. It presents the research programme for
people at clinical high risk of psychosis (CHR-P): the clinical need, the science,
the investigational product NWPT-SM32300 and its planned Phase 2B study, the people
involved, programme updates and the proposed financing route.

**Status: content draft for review. Do not launch until the checklist below is complete.**

## Quick start

```bash
python3 build.py             # rebuild public/ from src/ (Python 3 standard library only)
open public/index.html       # or serve it: python3 -m http.server -d public 8000
```

`public/` is the deployable site: plain HTML, CSS and a few lines of JavaScript, with
no framework, cookies, analytics or third-party requests. It can be hosted on any
static host (Netlify, Cloudflare Pages, S3, GitHub Pages) or moved into a CMS.

## Structure

```
build.py                 assembles pages: header + page body + footer -> public/
src/partials/            shared header (notice bar, navigation) and footer
src/pages/*.html         page content, each with a small metadata block
public/                  built site (commit it; it is what gets deployed)
public/assets/css/       site.css, with design tokens at the top
public/assets/js/        site.js (mobile menu and footer year only; the site works without JS)
public/assets/img/       mark.svg placeholder logo (replace with the real brand)
```

Edit files in `src/`, then run `python3 build.py`. Don't edit `public/*.html` directly,
because the next build overwrites it. CSS, JS and images are edited in `public/assets/`.

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Overview, evidence labels, approach, financing summary, latest updates |
| Clinical need | `clinical-need.html` | What CHR-P is, outcomes, current care (NICE), the gap |
| The science | `science.html` | CBD background, clinical studies to date, mechanisms, open questions |
| Evidence | `evidence.html` | Evidence-labelling policy and the full reference list |
| The programme | `programme.html` | NWPT-SM32300, the Phase 2B design table, participant protections |
| People | `people.html` | Leadership, advisers, governance and clinical independence |
| Updates | `updates.html` | Dated timeline of milestones |
| Financing | `financing.html` | Programme vehicle and permissioned tokens, safeguards, risks (**noindex**) |
| Q&A | `faq.html` | Patients, families, clinicians |
| Contact | `contact.html` | Contact routes |
| Legal | `legal.html` | Disclaimers, privacy, cookies, accessibility |

## Editorial conventions

**Evidence labels.** Every scientific statement carries one of three labels, which the brief
calls for ("clearly distinguishing established findings from questions our research aims
to answer"):

```html
<span class="tag tag-established">Established</span>
<span class="tag tag-emerging">Emerging evidence</span>
<span class="tag tag-open">Open question</span>
```

Use the `claim-list` pattern in `science.html` for new claims, and link each one to its
entry in `evidence.html` (`evidence.html#ref-...`).

**Placeholders.** Text written as `[PLACEHOLDER: ...]` (missing information) or
`[CONFIRM: ...]` (drafted wording that must be checked) is highlighted in yellow on
the built site. To list them all:

```bash
grep -rn "PLACEHOLDER\|CONFIRM" src
```

When this handoff was written there were about 54 placeholders and 15 items to confirm.
None of them can remain at launch.

**Tone.** Never state or imply that NWPT-SM32300 is effective or safe. Use "investigational",
"planned" and "aims to". Write updates as dated facts, never as forecasts.

## Pre-launch checklist

### Content (programme team)
- [ ] Fill in every `PLACEHOLDER`: legal entity, sponsor, study design details, people, dates, addresses.
- [ ] Resolve every `CONFIRM`, especially the study design (control arm, blinding), the Data
      Monitoring Committee, the registry and publication commitments, and the governance commitments.
- [ ] Have the clinical and scientific leads check every reference (authors, journal, year,
      volume and pages) and every evidence label. The summaries of McGuire 2018, Leweke 2012,
      Boggs 2018, Bhattacharyya 2018 and Appiah-Kusi 2020 should be checked against the papers.
- [ ] Add any relevant newer or ongoing CBD and CHR-P trials. The reference list does not claim to be complete.
- [ ] Get written consent from every named person for their name, photo and biography.
- [ ] Check the crisis signposting (999, NHS 111 option 2, Samaritans 116 123) and add
      equivalents for other target countries.

### Regulatory and legal (qualified counsel, per jurisdiction)
- [ ] **Medicines advertising.** Promoting unlicensed medicines to the public is restricted
      (in the UK, the Human Medicines Regulations 2012 and the MHRA Blue Guide; the EU and US have equivalents).
      Confirm that the whole site reads as disease-awareness and research information, not promotion.
- [ ] **Clinical trial communications.** Recruitment wording and materials must be approved by
      the research ethics committee before recruitment opens.
- [ ] **Financing page (`financing.html`).** This page describes a possible investment and digital-asset
      offering. It must be reviewed under the rules for financial promotions and securities in each
      jurisdiction where it can be seen. Examples: UK FSMA s21 and the cryptoasset financial
      promotions regime; US securities law, where tokens representing an interest in a venture are
      likely to be securities; EU MiCA and prospectus rules. Counsel may decide the page should be
      geo-restricted, placed behind an eligibility gate, reworded or removed.
      - Until sign-off, the page has `noindex, nofollow`. If the page is withheld, remove the
        financing summary from `index.html`, the "Financing" entry in `NAV` in `build.py`, and the
        links in the footer and FAQ.
      - The six "independence" principles are drafted as *proposed*. The board must approve them
        before they are published as commitments.
- [ ] Complete `legal.html`: disclaimers, privacy notice (UK/EU GDPR) and entity details.
- [ ] Complete a trademark and name check for "NWPharmaTech" and "NWPT-SM32300".

### Technical
- [ ] Replace `assets/img/mark.svg` with the real logo, and add an Open Graph image.
- [ ] Set up hosting, HTTPS, redirects (apex to www) and a 404 page.
- [ ] Add `sitemap.xml` and `robots.txt`. Leave `financing.html` out of the sitemap until it is approved.
- [ ] Run an accessibility audit (target WCAG 2.2 AA) before the accessibility statement is published.
- [ ] If analytics are added, update the cookies section and add a consent mechanism first.
- [ ] If you add a contact form, use a GDPR-compliant processor and warn users not to send medical information.

## Design notes

- Colours, spacing and fonts are CSS custom properties at the top of `site.css`, so rebranding is quick.
- System fonts only, so no data goes to Google Fonts or other third parties.
- Responsive from 320px up. The navigation collapses below 940px. The skip link, focus styles,
  `aria-current` and reduced-motion support are built in.
- The notice bar on every page states that NWPT-SM32300 is investigational and its effectiveness unproven.
