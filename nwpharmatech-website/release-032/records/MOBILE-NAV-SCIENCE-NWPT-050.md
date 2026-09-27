# NWPT-050 Phone menu and Science usability (preview candidate)

- **Base:** production `5e926c8c592fcd8492e1fa2ff58a05ade7206d54` (deployment `b8788c49-3ddf-4f73-afe0-926321c125da`).
- **Branch:** `claude/nwpt-mobile-nav-050`.
- **Commits:**
  1. `01d6eec`: menu fix (shared header, every page).
  2. `69ffcae`: Science pages on phones (CSS only).
  3. This record, screenshots and recordings.
- **Status:** published to production on 27 Sep 2026 as `af4ab606a16813252fda4bd6c280afaa1f473974` (see **Production publication** at the end). This SHA is the baseline for future website work. Enquiries, privacy and DNS are unchanged.

## 1. Mobile menu

### Reproduction (report: Android screenshot, Science expanded, “Science overview” out of view)
The report was reproduced in Chromium at 360 × 780, 375 × 667 and 412 × 915. The page was scrolled to about 45%, then Menu was tapped, then Science. Screenshots: `screens-nwpt050/before-*`.

| Question | Finding |
|---|---|
| Clipping? | **Yes: the root cause.** The open menu (`#site-nav`) sat inside the sticky header as a column flex box capped at 70vh (`max-height: min(70vh, …)`, `overflow-y: auto`). It inherited `justify-content: flex-end` from the desktop rules. When Science expanded, the list became taller than the cap, and the overflow went out of the **top** of the box. That area is outside any scroll range. Hidden: the in-panel Close, Programme, Why it matters, the Science heading and “Science overview” (at 375 × 667 the Science button sat at −149 px). |
| Menu scroll position? | **Not the cause.** `scrollTop` stayed 0, and scrolling the menu to its end changed nothing (the `before-*-2-menu-scrolled-to-end` screenshots are identical to `-1`). |
| Page scrolling? | **Contributing.** The menu was part of the sticky header, so opening a group made the header taller and the page shifted underneath (scroll anchoring moved `scrollY` by about 230–240 px in the reproduction). |
| Also found | On pages that keep focus clear of the sticky header with `scroll-padding-top` (Science, Programme Room, Work with us, homepage), keyboard focus on a header control (logo, Menu, Close) scrolled the page by about 350 px. |

### Change (`nav.js`, `styles.css`; the shared header on all 45 pages, including the 7 sandbox pages)
**Menu panel**
- On phones and tablets (≤ 960 px) the open menu is a **fixed panel** from the bottom edge of the header to the bottom of the visible screen. Its height comes from `visualViewport`, so the end stays reachable when a page is zoomed or wider than the screen.
- The panel starts at the top and scrolls on its own; `overscroll-behavior: contain` stops scrolling passing through to the page.
- The header and its Close control stay visible.

**Groups**
- One group is open at a time (as before).
- Opening a group scrolls the **panel** only, never the page, just enough to show the group heading and as many links as fit, heading first.

**Page behind the menu**
- It is locked: the scroll lock on `html` plus `inert` on everything except the header.
- Its scroll position is restored on close.

**Keyboard and focus**
- `aria-expanded`, the Menu/Close label, and Escape handling (group first, then the menu) are unchanged.
- Focus returns to the Menu button or the group button without scrolling.
- Focusing a header control no longer moves the page.

**Unchanged:** tap targets (≥ 44 px), indentation of CBD and THC and From cannabis to medicines, and text size.

**Larger text (found while testing)**
- The skip link is now hidden by its own height. At 200% it had grown past its fixed `top: -100px` and covered the Menu button.
- The grouped Science dropdown no longer keeps its desktop `min-width: 15.5rem` on phones. At 200% that was wider than the screen.
- The brand takes the space left by the Menu button, and the logo text stays close to its normal size. At 200% the name had run over the Menu button.

**Desktop:** unchanged. The menu is inline, and dropdowns open by click, hover and keyboard as before. `test-nwpt034` passes 35/35.

**Cache keys:** `nav.js?v=nwpt050`, `styles.css?v=nwpt051`.

## 2. Illustrated Science pages on phones

**Reviewed:** `/science`, `/science/psychiatry`, `/science/cannabinoids`, `/science/cbd-thc` and `/science/cannabinoid-medicines`, covering reading flow, captions, section navigation and the CBD/THC tabs. Tested at 320–667 px wide and 100/150/200% text.

**No change needed**
- At default text size, all three illustrations, their captions, the section navigation and the CBD/THC tabs already worked.
- The molecular comparison's explanation, including “Same molecular formula. Different three-dimensional architecture.”, is readable HTML directly below the image at every size tested.

**Concrete issue fixed (commit `69ffcae`, CSS only)**
- At 150–200% text the Science pages were laid out wider than the screen, so readers had to pan sideways. On production, `/science` at 360 px and 150% text measured 423 px.
- Causes:
  - the one-word “CannabinoidEvidence.org” button;
  - citations and tags set to `nowrap` on `/science`;
  - panel paddings and page margins set in rem, which doubled with the text and left the THC/CBD columns about 150 px wide, splitting ordinary words.
- Fix:
  - long strings may break when necessary;
  - citations, tags and level chips may wrap;
  - phone paddings and margins are capped at their normal pixel size, so nothing changes at default text size;
  - the external-resource button takes its own row.
- No wording, citation, evidence ID, anchor, image, video or portrait changed.
- Screenshots at 360 × 780 and 200% text: `screens-nwpt050/science-before-*` and `science-after-*`.

## Verification (27 Sep 2026)

**Browser actually used:** Chromium 141.0.7390.37 (Playwright 1.56.1, headless) with mobile emulation (`isMobile`, touch, device scale factor 2), served by the Cloudflare Pages runtime (`wrangler pages dev`). Touch tests use real touch events at element coordinates; keyboard tests use real Tab, Enter and Escape. **No physical phones and no Safari/iOS, Firefox or Samsung Internet were tested.** Larger text is emulated by setting the root font size to 150% or 200%. That approximates Android and browser text scaling; it is not the operating-system setting itself.

| Test | Result |
|---|---|
| `tools/test-mobile-nav.mjs` (new) | **24 checks, 1,246 runs, all pass.** Covers: 320 × 568, 375 × 667, 390 × 844, 412 × 915, 667 × 375 and 915 × 412 landscape, and 768 × 1024 tablet; menu opened from the top, middle and bottom of the page by touch and by keyboard; 150% and 200% text (320 × 568, 390 × 844, 844 × 390). Every run confirms the panel sits below the header within the screen; Close is visible and operable; the page is locked and does not move; Science expands with only one group open; the heading and first link are visible; all 8 Science links are ≥ 44 px, with sub-pages indented; Tab reaches all 8, each visible; the last link is reachable by touch, and so is the first link after swiping back; Escape closes the group, then the menu, and returns focus; the page position is restored; no horizontal overflow; no page errors. Also: all 45 shared-menu pages (38 with Science, 7 sandbox pages without); every Science destination opened from the menu (8/8, anchors below the header); axe WCAG 2.2 A/AA with the menu open; desktop unchanged. |
| `tools/test-science-phone.mjs` (new) | **8 checks pass.** No sideways panning at 320–667 px and 100/150/200% text (55 page loads); captions readable below their images; section links on screen; each CBD/THC tab opens its panel by touch; axe clean at 200%. The same test **fails on production** `5e926c8` (panning at 150% and 200%). |
| Regression | `test-nwpt034` 35/35 · `test-homepage-discoverability` 41/41 · `test-programme-room` 175/175 · `test-work-with-us` 185/185 · `test-science` 106/106 (production evidence IDs preserved). |
| Recording | `screens-nwpt050/recording-after-candidate.webm`: Menu → Science → first link → swipe to last link → Close, 390 × 844, Chromium. The same flow on production: `recording-before-5e926c8.webm`. Tap positions are marked with a yellow dot and captions are overlaid; both are injected by the recording script, not part of the site. |

## Findings not changed in this candidate
- **320 px screen at 200% text:** the shared **footer** line (`.footer-meta`) is 19 px wider than the screen, so the phone lays the page out at 339 px. The menu, Close and all Science content still work at that size, and the menu height follows the visible screen. This is a one-line footer fix, left for Filipp's decision because it is outside the Science scope.
- **Other pages at 150–200% text** (outside this Science pass): the `/families` citations (`nowrap`) and the homepage people cards also widen the layout.
- **Duplicate Close:** the panel's own Close sits below the header Close. It was previously noted and kept, and it now stays reachable at the top of the menu.
- **Not tested:** Safari/iPhone and physical Android devices.

## Hosting handoff (preview only)
1. Deploy the candidate SHA from `claude/nwpt-mobile-nav-050` to a preview branch (usual method; no environment variables change).
2. On a real Android phone, and on an iPhone if available:
   - scroll part-way down a page, tap Menu and then Science;
   - check that “Science overview” is below the header, that you can swipe to “Glossary”, and that Close returns you to the same place;
   - repeat with large system text and in landscape.
3. Production publication follows Filipp's review of the preview.

## Production publication (Web Boss, 27 Sep 2026)

| Item | Value |
|---|---|
| Production SHA | `af4ab606a16813252fda4bd6c280afaa1f473974` |
| Deployment ID | `1329321b-8006-4761-8c06-e1ad92f5a0e7` |
| Deployed | 27 September 2026, 19:36:56 CEST |
| Immutable URL | https://1329321b.nwpt-preview.pages.dev |
| Rollback deployment ID | `b8788c49-3ddf-4f73-afe0-926321c125da` (previous production `5e926c8c592fcd8492e1fa2ff58a05ade7206d54`) |
| Production verification | PASS (reported by Web Boss): the Science menu opens below the header, the first and last Science links are reachable, and Close restores the scroll position |
| Phone gate | Filipp's check on his Android phone (reported by Web Boss as the phone gate for this release) |

**Unchanged:** enquiries remain disabled; DNS, privacy and enquiry settings unchanged.

**Testing distinctions, as recorded above:**
- Claude's checks used Chromium with mobile emulation.
- Larger text was emulated through the root font size; this is not the operating-system text setting.
- Browser zoom was not tested.
- The only physical-device check is Filipp's Android phone.
- **Safari/iPhone remains untested.**

**Baseline:** future website work starts from `af4ab606a16813252fda4bd6c280afaa1f473974`. This records-only commit is not deployed.

## Backlog (carried forward from this release)

Large-text overflow outside the Science pages, found at 150–200% emulated text. Each makes the phone lay the page out wider than the screen:

1. **Shared footer:** `.footer-meta` is 19 px wider than a 320 px screen at 200% text (all pages).
2. **Families page:** citations set to `nowrap` (`.nwpt-cite`) widen the layout at 150% and 200%.
3. **Homepage people cards:** `.home-person-card` widens the layout at 150%, and the homepage brief panel does so at 200%.

This closes NWPT-050.
