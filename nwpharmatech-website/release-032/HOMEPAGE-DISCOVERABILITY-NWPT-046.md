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

There are no Invest, Pay, Wallet or Mint CTAs. The hero video, portraits and approved copy are unchanged.

## Fold
- **Desktop:** the quick links sit on one line, bottom at 902px. They are inside the first screen at 1363×936 and 1440×900, and about 100px below it at 1280×800.
- **Phone (390×844):** they wrap to three lines and start just above the fold.
- The explore band follows the hero on every width.

## Checks (Cloudflare Pages runtime)
| Suite | Result |
|---|---|
| `test-homepage-discoverability.mjs` (new) | 28 passed |
| `check-pages.mjs` `/`, `/programme-room`, `/work-with-us`, `/funding-use` | 152 passed |
| `test-nwpt034.mjs` | 35 passed |
| `test-funding-hero.mjs` | 45 passed (see note) |
| `test-programme-room.mjs` | 175 passed |
| `test-work-with-us.mjs` | 172 passed |
| `test-deploy-layout.mjs` | 4 passed |
| `test-image-checks.mjs` | 8 passed |

**Note:** the funding-hero guard "homepage brain video still plays" had rejected any `funding-hero` request on the homepage. It now rejects only the funding film files, because the new card deliberately shows the poster image. It passes on both `6affaba` and this branch.

Screenshots: `records/screens-nwpt046/{before,after}-{desktop-1363x936,phone-390x844}-{hero,explore}.png`. In the explore captures the sticky header is hidden, for the capture only.
