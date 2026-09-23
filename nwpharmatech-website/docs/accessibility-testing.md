# Accessibility: target and what has actually been tested

**Target:** WCAG 2.2 level AA. **Status:** automated and scripted checks pass. **The site has not been confirmed as conforming.** Conformance needs manual testing with assistive technology and with users. A clean automated scan does not show conformance.

## Tested (automated, `tools/qa.mjs`; results in `docs/qa/report.json`)

| Area | What was checked | Result |
|---|---|---|
| Automated rules | axe-core (WCAG 2.0, 2.1 and 2.2 A/AA plus best practice) on every public page at 1280 and 390 px, and on every restricted page | 0 violations |
| Keyboard | First Tab reaches the skip link, which moves focus to `main`. Every tab stop on the home page shows a focus outline of at least 2 px. The mobile menu takes focus on opening, and Escape closes it and returns focus. Q&A answers open and close with Enter. Evidence filters are buttons with `aria-pressed` | Pass |
| Mobile navigation | Accordion states, `aria-expanded`, `aria-current`, 44 px touch targets, and works without JavaScript | Pass |
| Zoom and reflow | No horizontal scroll at 640 CSS px (200% zoom), and at 320, 360, 768, 1024, 1100 and 1440 px (320 px equals 400% zoom) | Pass |
| Text spacing (1.4.12) | Increased line, letter, word and paragraph spacing applied to every page: no overflow | Pass |
| Contrast | Covered by the axe colour-contrast rule. The brand's Blue 2 (#00A3E0) is used only decoratively | Pass |
| Reduced motion | With `prefers-reduced-motion: reduce`: no transitions and no smooth scrolling. There is no animation anywhere | Pass |
| Forced colours | Screenshot `docs/qa/screenshots/index-forced-colors.png`; skip link focusable | Screenshot for manual review |
| Tables | Captions and scoped headers. On narrow screens, rows stack with a label on each cell | Pass |
| Forms | Restricted demo forms: labelled, and disabled. Optional sign-up form (tested in a `--with-signup` build): labelled; errors announced in a live region; `aria-invalid` set and focus returned to the field; axe clean | Pass |
| Downloads | Brief and appointment-sheet PDFs are tagged (structure tree), with language and title set | Pass |
| Accessibility tree | A Playwright ARIA snapshot per page (`docs/qa/aria/*.yml`). Each page has main, navigation (or the collapsed Menu button), contentinfo and a level-1 heading | Pass; the snapshots are available for manual review |
| Diagram | The SVG has a title and a full text description, and the steps are also given in the page text | Pass |

## Not tested

- **Real screen readers:** NVDA, JAWS, VoiceOver on iOS and macOS, TalkBack. The accessibility-tree snapshots are not a substitute.
- **Browsers:** Safari, Firefox, and real mobile devices. QA used Chromium only.
- **Voice control and switch access.**
- **Full manual audit:** cognitive-load and plain-language review of every page by users, including young people and families.
- **PDFs:** reading order in a screen reader. PAC or Acrobat checks have not been done.

The accessibility statement on legal.html must be updated after an audit. It must not claim conformance before then.
