# Completion report: staging draft 2

Date: 23 September 2026. The commit identifier is in `COMMIT.txt` in the handoff ZIP. The live website has not been changed.

A clean build and a clean link check are **not** evidence that the science is right or that the whole visitor experience works. The sections below keep machine-verified behaviour separate from review that people still need to do.

## 1. Verified: functionality (automated browser QA, `docs/qa/report.json`)

Result: 154 of 155 checks pass. The one failure is expected (no public email address has been confirmed; see unresolved #3).

- **Pages:** all 11 pages load at desktop (1280 px) and mobile (390 px) with no console or request errors and one `h1` each.
- **No horizontal scrolling:** checked at 320, 360, 390, 768, 1024, 1100, 1280 and 1440 px, including that the header fits.
- **Automated accessibility (axe-core, WCAG 2.2 A/AA plus best practice):** zero violations on all 22 page and viewport combinations. This is automated testing only. There has been no manual screen-reader or user testing.
- **Mobile accordion menu:**
  - It starts collapsed and the toggle's `aria-expanded` state updates.
  - Only the current page's group is open, and focus moves into the panel.
  - Tapping a closed group expands it; `aria-current` is set.
  - Escape closes the menu and returns focus to the toggle.
  - Every visible touch target is at least 44 px tall, and the links navigate.
- **No JavaScript:** the menu shows expanded and its groups open natively.
- **Keyboard:**
  - The first Tab reaches the skip link, which moves focus to the main content.
  - Every tab stop on the home page (up to 60 checked) shows a visible outline of at least 2 px.
- **Q&A accordions:** they start collapsed and open and close with Enter. Deep links such as `#not-medical-advice` open the target answer, including from the notice bar.
- **Tables:** every table has a caption and scoped headers and fits its container. Rows stack on narrow screens.
- **Downloads:** the brief PDF is served as `application/pdf`, has a valid header and is about 58 KB. The homepage button triggers a real download.
- **Contact routes:**
  - All `tel:` and `sms:` links are well formed.
  - The head office number `+442036933791` and the postal address are present.
  - Crisis numbers are linked.
- **Internal links:** every internal link and anchor resolves.
- **Staging safeguards:**
  - Every page is `noindex`, `robots.txt` disallows all crawling, and the staging banner shows.
  - The public build contains no restricted pages and no `<form>` elements.
  - A production build refuses to run while `[TBC]` markers remain (tested).
- **Restricted middleware:**
  - Returns 503 when unconfigured and 403 without an Access token.
  - Refuses a forged token.
  - Returns 405 for non-GET requests; this is in the code but was not exercised with a live Access token.

## 2. Verified with limits: content

- **References.** All 17 literature and guideline items and both registry entries were checked for bibliographic details and the specific numbers quoted. The checks used web-search summaries of publisher, PubMed, registry and official pages. **The primary pages themselves could not be opened** because this environment's network policy blocks them. Six corrections came out of this (see `source-register.md`). Details that could not be confirmed were removed from citations, not guessed.
- **Company details.** The company number and registered office came from a Companies House search summary, not the register page.
- **Crisis numbers.** Checked through search summaries only, and labelled "Last checked 23 September 2026". They must be re-checked on the official sites before launch.
- **Programme facts** were taken from your documents (see `source-register.md`). Phase 1 results are deliberately not published.

## 3. Changed since draft 1

- The home page has a prominent programme brief, with a PDF download.
- Evidence labels now apply at section or study level instead of on every sentence. There is a fourth label, "Programme information", which separates facts about NWPT-SM32300 from published evidence about other CBD products.
- New mobile accordion menu, brand colours, section-level study summaries, and image slots for portraits and renders.
- The public financing page is shorter and factual, and states the preferred route (platform-integrated, possibly with a permissioned token at closing) and the register-first fallback. The detailed structure and the inactive registration flow moved to the restricted project, which is protected by Cloudflare Access plus a fail-closed middleware.
- New regional urgent-help section (UK by nation, Ireland, United States) with clear labels.

## 4. Unfinished

- **11 unresolved facts** (`unresolved.md`). The biggest is the CHR-P Phase 2B design, which I could not find.
- **Images:** 8 portraits, 2 renders and the official logo (`asset-manifest.md`).
- **Old-to-new URL map for the live site:** not done, because the live sites are not reachable from this environment (`url-map.md`).
- **Human review still needed:**
  - Primary-source check of every reference.
  - Scientific sign-off on each evidence label.
  - Legal review of financing (UK FSMA s21 and cryptoasset promotions, US securities, EU MiCA), the privacy notice and the disclaimers.
  - MHRA advertising review.
  - A manual accessibility audit.
  - Testing on real iOS and Android devices. QA used Chromium only; Safari and Firefox were not tested.
- **Git:** the commit was not pushed. This session has no GitHub access to `Korentsvit/hello-world`.
