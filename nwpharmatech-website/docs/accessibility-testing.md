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
| Forced colours | Home page at 1280 px only: screenshot `docs/qa/screenshots/index-forced-colors.png`; skip link focusable. The mobile menu and the navigation's current-page markers are checked by `tools/test-menu.mjs` (below) | Screenshot for manual review |
| Tables | Captions and scoped headers. On narrow screens, rows stack with a label on each cell | Pass |
| Forms | Restricted demo forms: labelled, and disabled. Optional sign-up form (tested in a `--with-signup` build): labelled; errors announced in a live region; `aria-invalid` set and focus returned to the field; axe clean | Pass |
| Downloads | Brief and appointment-sheet PDFs are tagged (structure tree), with language and title set | Pass |
| Accessibility tree | A Playwright ARIA snapshot per page (`docs/qa/aria/*.yml`). Each page has main, navigation (or the collapsed Menu button), contentinfo and a level-1 heading | Pass; the snapshots are available for manual review |
| Diagram | The SVG has a title and a full text description, and the steps are also given in the page text | Pass |

## Tested (mobile menu, `tools/test-menu.mjs`; results printed, one line per check)

Chromium only, with the site served by Cloudflare's own Pages runtime. Touch, reduced motion and forced colours are Chromium's emulations, not real devices or real Windows settings.

| Area | What was checked | Result |
|---|---|---|
| Widths and pages | 320, 360, 375, 390, 414 and 768 px on the home, study, evidence, Q&A and People pages: opening and closing, focus to the first link, Escape returns focus to the toggle, one group open at a time (pointer and keyboard), targets at least 24x24 px, no horizontal scroll, axe with the menu open, the current page's own link (by pointer; by keyboard and by touch on the People page at 390 px) | Pass |
| Leaving the menu | Tab past the last item. Shift+Tab past the toggle up to the skip link, then the skip link and the next four Tab stops. The skip link activated while the menu is open without being focused first (a scripted click, as a screen reader may do). Checked at 375x667, 390x600, 320x568, 768x1024 and 1099x700: the menu closes at the first focus stop outside it and its toggle, and no focus stop is covered by the menu panel | Pass |
| Short and zoomed screens | 568x320 (landscape phone), 341x162 (about 400% zoom on a 1366x768 laptop) and 320x180, on the Q&A and study pages: the header moves to the top of the screen and the panel fits below it; every link can be reached with Tab (opening each group from the keyboard) and each focused item is fully on screen; the panel scrolls to its last link; closing the menu (toggle or Escape) puts the page back where it was. At 320x480 (Q&A page, top and part-way down): the panel fits and scrolls to its last link | Pass |
| Touch | Touch emulation at 390 px on the People page: tap to open and close, tap a group, tap outside the menu, tap the current page, tap a link to another page | Pass |
| Reduced motion | With `prefers-reduced-motion: reduce` at 390 px: no smooth scrolling; the "Programme brief" link lands at the brief at once, clear of the header | Pass |
| Forced colours | Chromium's forced-colours emulation, light and dark schemes. On the People page at 320 px (where the "Menu" label is hidden) and 390 px: the toggle's icon is drawn (counted in screenshot pixels), closed and open; the current page is underlined in the open menu (computed style). At 1280 px: the desktop navigation's current page keeps a bar under it (pixels) and the current section is underlined (computed style, Science page). Screenshot `docs/qa/screenshots/menu-forced-colors-320.png` | Pass |
| Breakpoint and no JavaScript | 1099, 1100 and 1280 px on the same pages; widening past 1100 px closes the menu; without JavaScript (study page, 390 px) the menu is shown open and its groups work | Pass |
| Labels | The header's landmark labels, home-link label and "Menu" label come from `content/ui/en.json`; citation links on the Science page are announced with one "Source:" prefix | Pass |

## Not tested

- **Real screen readers:** NVDA, JAWS, VoiceOver on iOS and macOS, TalkBack. The accessibility-tree snapshots are not a substitute.
- **Browsers:** Safari, Firefox, and real mobile devices. QA used Chromium only.
- **Real forced-colours and contrast themes:** Windows contrast themes, Edge and Firefox in forced colours, and themes whose button colours differ from the page colours. Only Chromium's emulation was used, and only on the pages named above.
- **Voice control and switch access.**
- **Full manual audit:** cognitive-load and plain-language review of every page by users, including young people and families.
- **PDFs:** reading order in a screen reader. PAC or Acrobat checks have not been done.

The accessibility statement on legal.html must be updated after an audit. It must not claim conformance before then.
