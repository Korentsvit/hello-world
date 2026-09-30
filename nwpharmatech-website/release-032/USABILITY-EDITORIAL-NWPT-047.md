# NWPT-047: usability and editorial release (review candidate)

- **Base:** production `6e997ddf02513bbb23a909f24f676e4e776b8272`.
- **Branch:** `claude/nwpt-usability-editorial`.
- **Not included:** the enquiry and privacy branches. Online enquiries stay off and the privacy notice is unchanged.
- **Not deployed:** Web Boss hosts the preview; production publication follows review.

**Commits** (reviewable separately):
1. `fda155b` **Sources:** brief source dates from existing records only. Details: `records/SOURCE-METADATA-NWPT-047.md`.
2. **Interface and editorial:** everything below.

## 1. Homepage hierarchy

**Hero**
- **Primary action:** "Explore the Programme Room" (`programme-room.html`).
- **Secondary action:** "Read programme brief".
- **Quick links:** "Research collaboration" and "Funding overview".
- **Removed:** the "Why it matters" button and the Programme Room quick link. The clinical-need card below still links to "Why it matters", and the Programme Room is now the primary action.

**One "Start here" section, where there were three competing introductions**
- **Before:**
  - a separate "Programme brief" band;
  - "Explore online / Explore the programme in depth";
  - "Start here / The programme in three steps".
- **After:** "Start here / Explore the programme".
  - It holds the Programme Room, Work with us and Funding cards, with the programme brief (read and PDF) as a panel inside the same section.
  - The old three-step section becomes **"Background / The clinical need and the science"**, with two cards.
  - The **study card is removed**, because the study section directly below covers the same design. Its "not recruiting" moves into the study status chip: "planned Phase 2B · not recruiting · investigational".

**Unchanged**
- the hero video, the Pause control and the caption;
- all images;
- leadership, updates, and the funding and contact section;
- the site header's "Read programme brief" button.

## 2. Work with us: email handoff while online enquiries are off

When `/api/enquiry` reports that enquiries are not configured, section 4 now shows the following. The callout is kept: "Online enquiries are not available yet … Nothing has been sent from this page."

**Contact us by email instead**
1. Print your brief or save it as a PDF, with a button that prints the current brief.
2. Write to **team@nwpharmatech.com** with the subject "Research collaboration".
   - This is the existing approved Contact-page link, `mailto:team@nwpharmatech.com?subject=Research%20collaboration`.
   - The page says: "The link opens your own email app with the subject filled in. It does not send anything, and it does not add your brief, questions or answers."
3. Attach the saved PDF to your email yourself, add your name and institution, and send it from your email app.

It adds: "If you share a copied topic link instead, it contains only the selected topics and cards. Your own questions, focus answers and contact details are not in it, so add anything you want us to see to your email."

**Related wording**
- **Brief help text:** "A copied link never includes your questions, focus answers or contact details".
- **Copy-link status:** "…not your questions, focus answers or contact details".
- **No-JavaScript fallback:** also gives the email address with the same subject.

**Guarantees, tested**
- The mailto carries **only** the approved subject: no body, cc, questions, focus answers or contact details, even after the visitor has entered them.
- No wording says clicking sends or attaches anything.
- The online-enquiry code path is unchanged, and the `/api/enquiry` checks pass.

## 3. Editorial tightening: before and after

Substantive scientific limitations, investment restrictions and role distinctions are each kept at least once where they apply. There are no new claims, endorsements, quotes or commitments.

The shared financing paragraph ("We are evaluating a platform-supported route …") is approved wording used on several pages. It is **unchanged** on Home, Funding and Contact.

"Last reviewed" dates on Funding and Team are unchanged, because no facts were re-reviewed. The `sitemap.xml` `lastmod` is 2026-09-27 for Home, Funding, Contact and Team.

| # | Page | Before | After | Why |
|---|---|---|---|---|
| E1 | Home | The science pages separate what is known from what remains open. Effectiveness in this population has not been established. | The science pages separate what is known from what remains open. | Science card: effectiveness limitation already stated in the hero and the study section on the same page |
| E2 | Home | Proposed Phase 2B design — investigational. Effectiveness not established. Not a locked protocol. | Proposed Phase 2B design — not a locked protocol. | Study diagram caption: status and effectiveness limitation are in the paragraph directly above |
| E3 | Home | Plain-language planning for the CHR-P programme. This page is informational. It is not an offer to invest, a prospectus, or open subscription. | Plain-language planning for the CHR-P programme — informational only, not an offer to invest, a prospectus, or open subscription. | Funding card: two sentences merged; restriction unchanged |
| E4 | Funding (/funding-use) | You cannot invest, pay, subscribe, or connect a wallet on this website. This site does not accept investments. | You cannot invest, pay, subscribe, or connect a wallet on this website. | Second sentence restated the first |
| E5 | Funding (/funding-use) | On this website today: learn about the science, read the public synopsis, how the funding model works, and contact us about research or collaboration. | (removed) | 'On this website today' callout removed; the same routes are listed under 'Next steps for visitors' at the end of the page |
| E6 | Funding (/funding-use) | The remaining funding need to complete a full multiregional 328-participant run is to-be-established pending a current Phase 2B RFQ and Board use-of-proceeds. A current remaining funding figure is not published here pending a Phase 2B RFQ and Board use-of-proceeds. | The remaining funding need to complete a full multiregional 328-participant run is to-be-established, and no figure is published here, pending a current Phase 2B RFQ and Board use-of-proceeds. | Two sentences with the same condition merged |
| E7 | Funding (/funding-use) | contact us about research or collaboration. There is no Invest button on this website. | contact us about research or collaboration. | Restates 'You cannot invest, pay, subscribe, or connect a wallet on this website' in 'What this page is' |
| E8 | Contact | Press, research collaboration, programme updates, and financing enquiries each have a clear route below. Financing questions are enquiries only — this website cannot accept investment. | Press, research collaboration, programme updates, and financing enquiries each have a clear route below. | Financing restriction is stated in full on the Financing enquiries card |
| E9 | Contact | Scientific or partnership enquiries: please state your institution and the nature of the enquiry. This is not a diagnosis service, crisis line, or trial enrolment portal. | Scientific or partnership enquiries: please state your institution and the nature of the enquiry. | Same sentence is in the general email block at the top of the page |
| E10 | Contact | Email is processed for enquiry handling only. Please do not send personal health information, clinical records, or patient-identifiable data. Prefer organisational contact details where possible. | Email is processed for enquiry handling only. Prefer organisational contact details where possible. | Health-data warning is in the general email block at the top of the page |
| E11 | Contact | Programme updates on this page. This is news only — not an investment waitlist or token allocation. | Programme updates on this page. | 'News only — not an investment waitlist' is on the Programme updates card; allocation is covered under 'Being developed' |
| E12 | Team | NWPharmaTech remains the pharmaceutical sponsor for clinical development, safety, manufacturing quality (CMC), and regulatory strategy. | NWPharmaTech remains the pharmaceutical sponsor for clinical development, safety, manufacturing quality (CMC), and regulatory strategy; investigators, ethics committees and regulators remain independent. | Company leadership intro absorbs the independence clause repeated in the CEO profile |
| E13 | Team | Company accountability for strategy and sponsorship of the investigational CHR-P programme. NWPharmaTech remains pharmaceutical sponsor (CMC, safety, regulatory); investigators, ethics committees, and regulators remain independent. Roles listed here are company roles — not DAO board or treasury seats. | Company accountability for strategy and sponsorship of the investigational CHR-P programme. | Sponsor/independence stated in the section intro; DAO-role limit stated in the page intro |
| E14 | Team | including the investigational CHR-P workstream. Listing here does not create DAO governance or treasury authority. | including the investigational CHR-P workstream. | DAO-role limit stated in the page intro |
| E15 | Team | focused on strategy and life-sciences development. Advisory listing does not create DAO governance or treasury authority. | focused on strategy and life-sciences development. | Adviser profile (Barker): stated once in the Advisers intro |
| E16 | Team | for NWPharmaTech as pharmaceutical sponsor. Advisory listing does not create DAO governance or treasury authority. | for NWPharmaTech as pharmaceutical sponsor. | Adviser profile (Jones): stated once in the Advisers intro |
| E17 | Team | via the Commercial Committee. Listing here does not create DAO governance or treasury authority. | via the Commercial Committee. | Adviser profile (Cannon): stated once in the Advisers intro |

**Homepage structural wording**
- "Explore online / Explore the programme in depth" becomes "Start here / Explore the programme".
- "Start here / The programme in three steps" becomes "Background / The clinical need and the science".
- The kickers "1 · Clinical need" and "2 · Science" become "Clinical need" and "Science".

## 4. Source metadata

This is commit `fda155b`, separate from the interface changes; see `records/SOURCE-METADATA-NWPT-047.md`.
- **No longer shown in the brief:** "Not available" and "Not shown on the page".
- **Public synopsis and Science page:** "No separate issue date (company web page)".
- **Science page:** "Website page last updated: 22 September 2026 (site map record; no review date is shown on the page)". This is kept distinct from review dates.
- **CANTOP-RCT:** "Publication date not yet recorded; to be checked against the NIHR Journals Library record". No year is held in any record.
- **Unchanged:** the Evidence library's "search-engine records" wording.

## 5. Tests (Cloudflare Pages runtime, this candidate)

| Suite | Result |
|---|---|
| `test-homepage-discoverability.mjs` (updated for NWPT-047) | 41 passed |
| `test-work-with-us.mjs` (updated; email handoff checks added) | 184 passed |
| `test-programme-room.mjs` | 175 passed |
| `test-nwpt034.mjs` (homepage video and navigation) | 35 passed |
| `test-funding-hero.mjs` | 45 passed |
| `check-pages.mjs` for `/`, `/programme-room`, `/work-with-us`, `/funding-use`, `/contact`, `/team` | 176 passed |
| `test-deploy-layout.mjs`, `test-image-checks.mjs`, `test-access.mjs` | 4, 8 and 22 passed |

**What the homepage test covers**
- Hero order and the primary/secondary split.
- A single "Start here" section.
- The brief inside that section.
- The two-card background section.
- The limitations that must remain.
- The primary action inside the first desktop screen.
- Tab and Shift+Tab across all 11 entry-point links, cards and brief buttons, clear of the real sticky header with scrolling settled.
- axe at 390px and 1363px.
- No horizontal scroll.
- The funding film is not loaded on the homepage.

**What the Work with us test covers**
- The full card → agenda → brief → share → email handoff journey, with visitor questions and focus answers entered.
- The mailto is checked to carry none of them.
- The handoff print button prints the current brief.

**Tests changed (earlier requirements now superseded)**
- The homepage test no longer expects the three NWPT-046 quick links.
- The Work with us checks that required **no** mailto and a Contact-page link while enquiries are off now require the approved subject-only mailto instead.
- Programme Room: the date regex accepts the new unknown-date wording, and "Website page last updated" is a recognised date label.

## 6. Screenshots (`records/screens-nwpt047/`, real sticky header, normal motion)

- **Capture method:** each capture waits until the scroll position has stopped changing. The focus position and header bottom are recorded for each.
- **After:** `after-{phone-390x844,desktop-1363x936}-…`
  - home: first screen; wheel-scrolled to "Start here"; the brief panel (phone); Tab to the primary action; Shift+Tab back to "Read the brief";
  - Work with us: cards added; agenda with a question (phone drawer or desktop sidebar); brief; share status; Tab to the email link.
  - Every focused element is clear of the header.
- **Before:** `before-…` from `6e997dd`, for the homepage and the Work with us enquiry section.

## 7. Outstanding issues

1. **Monitored inbox: resolved (Filipp, 27 Sep 2026).** Filipp confirms that email to `team@nwpharmatech.com` is automatically forwarded to `filipp.korentsvit@nwpharmatech.com`. The handoff's destination is therefore monitored by the accountable owner. No site change was needed.
2. **Primary-source verification: open, not a blocker.**
   - This release adds no source claims, and every unknown is labelled as unknown.
   - The precise missing evidence per card is in `records/SOURCE-METADATA-NWPT-047.md` §2. CANTOP-RCT comes first: its publication month and year, DOI, and EME volume and issue from the NIHR Journals Library.
   - Only dates read from a primary record will be added.
3. **Phone Funding link at the fold: no change.** At 390×844 the "Funding overview" quick link starts at y=824, so its top edge shows at the fold. Clear routes remain:
   - Menu → Funding → "Use of funds" (`funding-use.html`);
   - the Funding card in "Start here", directly below the hero.
4. **Phone agenda bar: defect confirmed and fixed (follow-up commit).**
   - **Reproduced** at 390×844 and 360×640: at the end of Work with us, the footer's last line ("… Last reviewed 23 September 2026") ended 20px under the fixed "Your agenda" bar and could never be scrolled clear. The Privacy notice link above it stayed visible; focused controls were already clear.
   - **Fix:** while the bar is shown, the footer gets extra bottom padding. The line now ends 52px above the bar.
   - **Test:** a phone check that nothing is left under the bar at the end of the page. It fails without the fix and passes with it.
   - **Stylesheet key:** `nwpt048`.
5. **Programme Room accessibility finding: not a user-facing defect; harness corrected (follow-up commit).**
   - **Element:** the "Link to this topic" copy-link for Formulation (`a.room-copy[href="#stage-formulation"]`), 44px tall.
   - **Reproduced:** axe flags it only when the snapshot is taken with the link partly under the sticky header ("partially obscured … 155.4px by 10.2px"). It is not flagged when the link is fully visible or fully covered.
   - **Cause:** the test scrolled back to the top with smooth scrolling and waited a fixed 200ms, so axe sometimes ran mid-scroll.
   - **User impact checked directly:** keyboard focus on all six copy-links (Tab and Shift+Tab, with and without the page script, 1363px and 390px, scrolling settled) is never under the header. A mouse user scrolling past sees the link pass under the header like any other content.
   - **Change:** the test's axe helper now scrolls instantly and waits for the scroll position to settle. No site change.
   - **Verification limit:** axe is a snapshot of one scroll position; it cannot judge sticky-header overlap across all positions. That behaviour is covered by the keyboard-focus tests.
6. **Legacy suites.** `test-menu.mjs` and `test-routes.mjs` target the older `public/` site. Against release-032 they give identical results on production `6e997dd` and on this candidate (menu 1 passed / 2 failed; routes 186 passed / 59 failed), so they are not evidence about this release.
