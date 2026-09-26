# Homepage discoverability (NWPT-046)

**Branch:** `claude/nwpt-homepage-discoverability`, from production `6affaba`. It is independent of enquiry activation: no Work with us behaviour, API, CSP or privacy text changes. Not deployed; Web Boss publishes after review.

## What changes on the homepage
1. **Hero quick links** below the two hero buttons: *Programme Room* → `programme-room.html`, *Research collaboration* → `work-with-us.html`, *Funding overview* → `funding-use.html` (the canonical Funding page).
2. **"Explore the programme in depth" band**, before the existing routes section: three image cards reusing the `.route-card` style.
   - The card text reuses each page's approved wording.
   - The Work with us card mentions no enquiries or sending.
   - The funding card carries "This page is informational. It is **not** an offer to invest, a prospectus, or open subscription."
   - The images are existing site assets (Manus 06 and 05, and the funding hero poster). The funding film is not loaded on the homepage.
3. **Stylesheet:** the `?v=` key is bumped `nwpt044` → `nwpt046` on all 42 pages. `programme-room.html` and `work-with-us.html` were regenerated with key-only diffs.

4. **Sticky-header focus fix:** `html:has(.home-explore) { scroll-padding-top: 5.5rem; }`, the same pattern as `/programme-room` and `/work-with-us`.
   - **Problem, reproduced with scrolling settled:** Shift+Tab moving back up the page left the focused link under the sticky header. On 390×844 this affected the funding and research-collaboration quick links (y 0–58 under a 56px header) and the Work with us card edge. The new test also caught it at 1363×936 without the fix.
   - **Production has the same fault** on `6affaba`'s existing hero buttons and route cards, so this fix covers those too.
   - **Tab forwards** was already clear.

There are no Invest, Pay, Wallet or Mint CTAs. The hero video, portraits and approved copy are unchanged.

## Fold
- **Desktop:** the quick links sit on one line, bottom at 902px. They are inside the first screen at 1363×936 and 1440×900, and about 100px below it at 1280×800.
- **Phone (390×844):** they wrap to three lines and start just above the fold.
- The explore band follows the hero on every width.

## Checks (Cloudflare Pages runtime)
| Suite | Result |
|---|---|
| `test-homepage-discoverability.mjs` (new) | 30 passed (includes Tab/Shift+Tab focus clear of the header; that check fails without the fix) |
| `check-pages.mjs` `/`, `/programme-room`, `/work-with-us`, `/funding-use` | 152 passed |
| `test-nwpt034.mjs` | 35 passed |
| `test-funding-hero.mjs` | 45 passed (see note) |
| `test-programme-room.mjs` | 175 passed |
| `test-work-with-us.mjs` | 172 passed |
| `test-deploy-layout.mjs` | 4 passed |
| `test-image-checks.mjs` | 8 passed |

**Note:** the funding-hero guard "homepage brain video still plays" had rejected any `funding-hero` request on the homepage. It now rejects only the funding film files, because the new card deliberately shows the poster image. It passes on both `6affaba` and this branch.

## Screenshots (`records/screens-nwpt046/`)
**Visitor experience: `real-{phone-390x844,desktop-1363x936}-N-*.png`.** Taken with the real sticky header, normal (non-reduced) motion, and each capture made only after the scroll position had stopped changing for 10 frames.

| # | Scenario | Focused element vs header (phone / desktop) |
|---|---|---|
| 1 | First screen | — |
| 2 | Mouse-wheel scrolled to the explore band | — |
| 3 | Tab to the Programme Room quick link | top 776 / 862, header ends 56 / 65 |
| 4 | Tab on to the funding card | top 406 / 440 |
| 5 | Shift+Tab back to the Programme Room card | top 258 / 440 |
| 6 | Shift+Tab back to the Funding overview quick link | top 88 / 610 |
| 7 | Click the Work with us card, then browser Back | Scroll restored; the clicked card and its heading are fully visible |

In capture 7 on the phone, the previous card's heading sits under the header at the top of the screen. That is simply where the browser restores the scroll position, and nothing has focus there.

**Composition only:** `{before,after}-*-hero.png` and `*-explore-composition-header-hidden.png`. In the explore captures the header is hidden, so they do not show the visitor's view.
