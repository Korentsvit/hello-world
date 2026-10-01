# NWPT-055 Digital programme finance (`/funding/digital-programme-finance`) — preview candidate

> **1 October 2026 — rebased onto live production `5c7af8d96aaef7f6d02b82aa9b705117733cb519`.** That SHA is the www tip (Cloudflare Pages project `nwpt-preview`, deployment `59c3fea1-7aea-4260-a69c-7f8da23cd126`, parent `15e38f117653603be24028a3747103f2ac36b7a9`). This candidate is a descendant of it. It has not been deployed, and production has not been overwritten.
>
> **Candidate:** rebase commit `a2c65484c613ed7401c9c050c79f47f0a9d3f95b` on `cursor/nwpt-055-rebase-onto-live-d653`. Live `5c7af8d96aaef7f6d02b82aa9b705117733cb519` is an ancestor. The commit that names this SHA does not change `site/`. Deploy branch HEAD after Filipp’s plain GO; the pull request records that full SHA. Do not deploy `ea97bff3f96db614429273ecb8c634f4bab8c780` (`5c7af8d` is not an ancestor of that parallel tip).
>
> **Kept from live `5c7af8d`:** the Digital programme finance page and its source (participant-eligibility sentence, `.dpf-cols__full`, published rails and returns copy), `dpf.css`, `/programme-financing`, and `PRODUCTION-READY-DPF.md` (the note for what is live, including the no-send layer on that deployment).
>
> **Brought from `ea97bff3`:** privacy notice (forms live since NWPT-054; Cloudflare Web Analytics and `POST /api/event`), `dpf.js` (sendBeacon/fetch, Global Privacy Control / Do Not Track, UTM values containing `@` dropped, first draw in the next frame), `functions/api/event.js`, the Web Analytics hosts in `_headers`, and `WEB-PR-HANDOFF-NWPT-055.md`. Bindings, Web Analytics, DNS and `NWPT_CONVERSION_MODE` are not changed in this commit.
>
> **Not brought:** the parallel tip’s further page-copy pass (rails beginning “Could …”, “No yield, liquidity or appreciation is promised.”, the restructured sponsor list). The notes under “What was built” describe the `4e7ca635` preview. `PRODUCTION-READY-DPF.md` describes what is already on www.

- **Base:** `1406893` (`cursor/programme-financing-journey-2e1f`, “Add the programme-financing journey beside funding use”). That commit sits on current production `5591bede` and is itself **not yet published**. It is the only place `/programme-financing` exists, and the brief treats that route as existing. This candidate therefore carries `/programme-financing` with it. If that page should ship separately, publish `1406893` first or review both together.
- **Branch:** `claude/nwpt-digital-programme-finance`.
- **Status:** preview only; not deployed. Web Boss owns hosting. Enquiries, updates, privacy and DNS are unchanged.
- **Reference sites:** bio.xyz and app.bio.xyz are blocked by this environment's network policy, so they could not be viewed. The design follows the principles listed in the brief. No Bio branding, layout, wording or assets are used.

## What was built

A dark, immersive flagship page at `/funding/digital-programme-finance`. It is built from the site shell (header, menu and footer unchanged) by `tools/build-digital-finance.py`, with content from `release-032/source/digital-programme-finance.html`.

The page has ten sections, in the brief's order, plus a short FAQ for progressive disclosure:
1. **Hero:** a live-looking node network (capital → sponsor → evidence/reporting), status chips, two calls to action, a qualifier line, and a strip stating the four scientific locks.
2. **Capital flow:** the visual centrepiece. Seven steps on a scroll-linked track; steps 04–05 sit inside a dashed **sponsor boundary**, and a sticky headline sits beside them.
3. **Three-layer architecture:** concentric rings (capital, transparency, protected sponsor core) with an accessible tab set. Without JavaScript all three layers are listed.
4. **Distributed / stays with the sponsor:** a split screen, the feature line, and the locked governance sentence.
5. **Six connected process steps,** with the fixed qualifier.
6. **~US$10m objective:** six use categories with no amounts, the qualifier, and a Funding use link.
7. **Five “digital rails” cards,** each framed as potential or under evaluation.
8. **Status panel:** twelve cells, labelled “As stated on this website · last reviewed 30 September 2026”. There is no live data, ticker, counts or transactions.
9. **FAQ:** six plain answers covering offering, returns, the ~US$10m, governance, the digital record and the data room.
10. **Explore:** six cards linking existing pages. There is no public data room.
11. **Final call to action.**

**Motion:**
- The network animates on SVG stroke/opacity/transform, and pauses when the hero is off screen.
- The capital-flow track follows the scroll, and its steps light up in turn.
- Cards reveal on scroll, but only those that start below the fold, so nothing flashes.
- The hero has a gentle parallax.
- Only transform and opacity change, so there is no layout shift.
- Under `prefers-reduced-motion` there is no animation, reveal or parallax, and the flow is drawn in full.
- No animation library is used; the page adds `dpf.css` (≈ 25 kB) and `dpf.js` (≈ 8 kB) with no dependencies.

**Copy adjustments to the brief** (ordinary implementation choices, listed so nothing changes silently):

| Brief | On the page | Why |
|---|---|---|
| “DSMB / medical oversight” under *Stays with the sponsor* | “Medical and safety oversight”, with the note “Independent committees and ethics bodies stay independent.” | A data monitoring committee is independent by design, and the site already says “Investigators, ethics committees and regulators remain independent.” |
| “Site activation” | “Site activation”, described as “First-site readiness when approvals allow. No one is being recruited.” | Keeps the not-recruiting lock next to the only category that could read as enrolment. |
| “Milestone-controlled treasury” | Same title, described as “Bank or custody accounts with dual-control release against operational milestones, not efficacy claims.” | Uses the existing `/funding-use` definition, so “treasury” does not read as a crypto treasury. |
| “Decentralized / centralized” | “Decentralised / centralised” | The site is en-GB. |
| — | The use categories carry one-line descriptions tied to the existing `/funding-use` clusters. | Avoids introducing new spending categories. |
| — | Added the locked sentence “Transparent financing does not mean decentralised clinical governance.” | From `/programme-financing`; it keeps the new “decentralised capital” line consistent with it. |

**Other site changes (additive only; 41 files, 45 lines added, 0 removed):**
- A “Digital programme finance” item after “Programme financing” in every page's Funding menu.
- A cross-link from `/programme-financing` (“See the proposed structure visually”), `/funding-use` and `/desci`.
- A sitemap entry.

`/programme-financing`, `/funding-use`, `/desci` and the `/funding` → `/funding-use` redirect are unchanged.

## Analytics

On live production `5c7af8d`, `dpf.js` still only pushes events to `window.nwptAnalytics` and dispatches `nwpt:analytics`. Nothing is sent. That behaviour is recorded in `PRODUCTION-READY-DPF.md`. This rebased candidate is the first tree that names a sink, and it is not deployed.

**1. Cloudflare Web Analytics (site-wide, cookieless), described for the deploy after GO.** The CSP in `_headers` allows `script-src https://static.cloudflareinsights.com` and `connect-src https://cloudflareinsights.com`. No token is stored in the repository. This commit does not enable Web Analytics on the Pages project.

**2. First-party conversion events: `POST /api/event`** (`functions/api/event.js`). With a Workers Analytics Engine binding named `NWPT_EVENTS`, one data point is written: `indexes: [event]`, `blobs: [event, path, link, utm_source, utm_medium, utm_campaign, utm_term, utm_content]`, `doubles: [server time in ms]`. Without the binding the function stores nothing and answers 503. This commit does not create that binding.

Allowlisted events are the eight names below, and the only page path is `/funding/digital-programme-finance`. Unknown fields are ignored. A UTM value containing `@` is dropped whole. The function does not read or store IP address, user agent, cookies, wallet or health data. Cross-origin posts are 403; other content types 415; bodies over 2 KB 413; invalid JSON or unknown events or pages 400; other methods 405.

`dpf.js` still pushes each event to `window.nwptAnalytics` and dispatches `nwpt:analytics`. It also sends the allowlisted fields with `navigator.sendBeacon`, falling back to `fetch` with `keepalive`. Nothing is sent when the browser signals Global Privacy Control or Do Not Track. UTM tags stay in `sessionStorage` under `nwpt-utm` for the tab and are copied onto this page’s tracked links.

| Event | When | Link identifier |
|---|---|---|
| `funding_digital_page_view` | page load | — |
| `architecture_section_view` | the architecture section is 30% visible (once) | `section:architecture` |
| `funding_use_click` | Funding use links | placement plus the on-site path |
| `evidence_click` | Evidence links | placement plus the on-site path |
| `desci_click` | DeSci link | placement plus the on-site path |
| `programme_financing_cta_click` | Programme financing card | placement plus the on-site path |
| `conversation_cta_click` | the Contact financing links | placement plus the on-site path |
| `faq_expand` | an FAQ answer is opened | `faq:<id>` |

The privacy notice dated 1 October 2026 describes the two forms that have been on www since NWPT-054, Cloudflare Web Analytics, and this endpoint. It does not invent a retention period. It is not a legal sign-off.

## Claim matrix

Every external factual statement on the page and its source. “Site” means already published wording (or the unpublished `1406893` page it builds on). “Brief” means a new company statement taken from the NWPT-055 brief (30 September 2026) that is **not yet elsewhere on the site**; these need Filipp's confirmation before publication.

| # | Statement on the page | Source |
|---|---|---|
| 1 | NWPT-SM32300 is investigational. | Site: `/programme-financing` (“investigational cannabidiol programme (candidate NWPT-SM32300 …)”, “not an approved medicine for CHR-P”) |
| 2 | Effectiveness in CHR-P is not established. | Site: `/programme-financing` intro and “Not established” list |
| 3 | The proposed next study is not recruiting. | Site: `/programme-financing`; `/study`; homepage |
| 4 | Prevention is not the current primary aim of the proposed next study. | Site: `/programme-financing` |
| 5 | Status: proposed next clinical study (proposed Phase 2B). | Site: `/programme-financing` (“That study is proposed”; “proposed Phase 2B study in people at CHR-P”) |
| 6 | ~US$10m is the current planning target for catalytic preparation and start-up toward the proposed Phase 2B. | Site: `/programme-financing` (What ~US$10m means); `/funding-use` |
| 7 | Not the full cost of Phase 2B; a bottoms-up RFQ and use-of-proceeds exercise is being developed; a planning assumption, not a Board-approved budget. | Site: `/programme-financing` (“not a Board-approved bottoms-up budget … not a claim that US$10 million fully funds a complete multiregional Phase 2B. Residual need awaits current RFQ”) |
| 8 | Use categories: clinical start-up, site activation (first-site readiness when approvals allow), CMC/supply, regulatory execution, programme operations (incl. contingency and wind-down), evidence infrastructure (data management, analysis planning, reporting). | Site: `/funding-use` clusters (clinical preparation, trial operations, product supply, regulatory work, data analysis, contingency); `/programme-financing` milestone list. Labels: Brief |
| 9 | Ring-fenced vehicle limited to expressly granted CHR-P programme economics (proposed). | Site: `/governance` (“Any programme financing would be limited to expressly granted CHR-P economics”) |
| 10 | Bank or custody accounts with dual-control release against operational milestones, not efficacy claims. | Site: `/funding-use` |
| 11 | NWPharmaTech remains the pharmaceutical sponsor: protocol, dose, endpoints, safety, CMC, regulatory filings, core IP. | Site: `/governance` diagram; `/programme-financing`; `/about`; `/desci` |
| 12 | NWPharmaTech also retains patient eligibility, licensing and commercial decisions, and manufacturing decisions. | **Brief** (manufacturing quality is on `/about` and `/desci`) |
| 13 | Investigators, ethics committees and regulators remain independent. | Site: `/programme-financing`; `/about` |
| 14 | Capital supporters do not vote on clinical design, trial budget or sponsor decisions; transparent financing does not mean decentralised clinical governance; no tokenholder clinical governance. | Site: `/programme-financing` (first two); Brief (third, consistent with “Class A: DAO / community must not control trial budget or protocol”) |
| 15 | A permissioned digital record at close is being evaluated where legally and operationally useful. | Site: `/proposed-token`; `/desci` |
| 16 | A conventional register-first private placement remains the fallback. | Site: `/proposed-token`; `/governance`; `/how-it-works`; `/desci` |
| 17 | No live public offering, public token sale, allocation, payment rail, mint or staking; you cannot invest, pay or connect a wallet here. | Site: `/programme-financing` (“no live public token … retail token sale”; “You cannot invest, pay, or connect a wallet on our website”); `/desci` (“production investment, payment and token issuance remain inactive”); footer |
| 18 | No promise of liquidity, appreciation, interest or yield; no price chart. | Brief (consistent with `/proposed-token` “Distributions may be zero”) |
| 19 | Future economic rights only under definitive private documentation, eligibility checks and applicable law. | Brief; footer (“offered only under applicable law to eligible investors through appropriate private channels”) |
| 20 | Programme financing: private conversations; structure under evaluation. | Site: `/programme-financing` (“We are opening private conversations”; “Structure options … remain under evaluation”) |
| 21 | Process: conversation, diligence, structure, eligibility (KYC, investor and jurisdiction checks), close, report. | Brief; KYC on `/how-it-works` and `/proposed-token`; diligence materials on `/docs` and `/governance` |
| 22 | Capital layer: private investors, strategic capital, impact capital, potential digital rails, milestone-linked deployment. | **Brief** |
| 23 | Digital rails: provenance, accountability, coordination, transparency, programmability (each “potential” or under evaluation; clinical decisions remain off-chain). | **Brief**; `/desci`; `/proposed-token` |
| 24 | No public data room; diligence materials shared privately. | Site: `/docs` (“not published as an open offer”); `/governance` (“private diligence package for eligible counterparties”) |

The page has no other external facts: no study numbers, percentages, prices, investor counts or transactions. The test enforces this.

## Checks (30 September 2026)

The figures in this section are the preview run on the `4e7ca635` lineage. They are not a measurement of the 1 October rebase.

**Rebase checks (1 October 2026), local Cloudflare Pages runtime, no `NWPT_EVENTS` binding:** `test-digital-finance.mjs` 94 passed, 0 failed; `test-conversion.mjs` 63 passed, 0 failed; `test-work-with-us.mjs` 185 passed, 0 failed. The browser was Google Chrome 148.0.7778.96. No visit counts were collected.

**Setup:** Chromium 141.0.7390.37 (Playwright 1.56.1) on the Cloudflare Pages runtime (`wrangler pages dev`). Google Fonts is blocked here, so fallback fonts were used. No physical devices were tested; Safari/iPhone is untested.

**`tools/test-digital-finance.mjs` (new): 73/73.**
- **Content locks:**
  - all 16 hard-lock sentences present;
  - ~US$10m never called a raise, a fully funded trial or a token sale;
  - title, description and headings free of token-sale, crypto, ICO, presale, coin, yield and APY positioning;
  - no control that invests, buys, pays, mints, stakes, subscribes or connects a wallet;
  - no form, input or third-party script;
  - no invented figures;
  - no DSMB attribution;
  - six use categories with no amounts;
  - status panel limited to site statements;
  - no public data room.
- **Isolation:** existing files only gain lines (the menu entry, three cross-links and the sitemap entry), and every page with the Funding menu has the new entry.
- **Routes:** the page returns 200; `.html` redirects to it; `/funding` and `/funding/` still redirect to `/funding-use`; `/programme-financing`, `/funding-use`, `/desci` and `/contact` return 200; all 11 internal links resolve; the calls to action go to Contact `#financing`.
- **Analytics:** all eight events fire. Payloads carry only event, page, time, UTM and placement fields, and query data such as an email or wallet address is ignored. The UTM cohort is carried onto internal links and persists for the tab session. Nothing leaves the origin except the site's existing Google Fonts stylesheet.
- **Layout** at 1440×900, 1366×768, 1024×768, 390×844, 360×740, 320×640, 844×390 landscape and 390 at 200% text: no horizontal overflow and no clipped element; layout shift 0.0000 at every size; every revealed card visible after scrolling. The primary call to action is above the fold at 1440×900 and 1366×768.
- **Accessibility:** axe WCAG 2.2 A/AA clean at 1440, at 390, at 390 with 200% text, and with reduced motion.
- **Motion:**
  - the flow track is scroll-linked (0 at the top, full after the flow, all 7 steps lit);
  - the hero animates;
  - the architecture tabs work by keyboard, and the rings follow the selection;
  - reduced motion has no animation, reveal or parallax, and the flow is drawn in full;
  - without JavaScript, all layers are shown, nothing is invisible and the flow is drawn in full.

**Regression suites (base `1406893` → this candidate):**

| Suite | Base | Candidate |
|---|---|---|
| `test-mobile-nav.mjs` | 23/23 (1,247 runs) | 23/23 (1,248 runs; the new menu link is included) |
| `test-nwpt034.mjs` | 35/35 | 35/35 |
| `test-homepage-discoverability.mjs` | 41/41 | 41/41 |
| `test-science-phone.mjs` | 8/8 | 8/8 |
| `test-science-gateway.mjs` | 74/74 | 74/74 |
| `test-programme-room.mjs` | 175/175 | 175/175 |
| `test-work-with-us.mjs` | 185/185 | 185/185 |
| `test-conversion.mjs` (financing and updates) | 63/63 | 63/63 |

The generators are consistent: re-running `build-programme-room.py`, `build-work-with-us.py` and `build-digital-finance.py` changes nothing.

**Lighthouse 13.5** (local, Cloudflare runtime):

| | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Mobile | 98 | 100 | 96 | 100 | 2.2 s | 0 ms | 0 |
| Desktop | 100 | 100 | 96 | 100 | 0.5 s | 0 ms | 0 |

- **Best practices (96):** the only deduction is the console error from the blocked Google Fonts request, which is specific to this environment.
- **Remaining notes** apply to the site-wide `styles.css` (unused rules, not minified) and the existing render-blocking font stylesheet. They are unchanged here.
- **Fixed during review:** a forced reflow in `dpf.js` (layout reads now happen before writes).

**Screenshots:** `records/screens-nwpt055/`, desktop 1440×900 and phone 390×844:
- `*-hero.png` and `*-full.png`;
- `*-s02` … `*-s11`: capital flow, architecture, split, process, objective, rails, status, FAQ, explore, final.

## Open questions / assumptions

1. **Base:** this candidate includes the unpublished `/programme-financing` page (`1406893`). Confirm it can ship together, or publish `1406893` first.
2. **Analytics sink:** live `5c7af8d` still sends nothing. This candidate’s sink is `POST /api/event`, fail-closed without `NWPT_EVENTS`, plus the CSP hosts for Cloudflare Web Analytics. Web PR sets the binding and the Web Analytics toggle only after Filipp’s plain GO, using `WEB-PR-HANDOFF-NWPT-055.md`. This commit does not change those project settings.
3. **Brief-only statements** (rows 12, 18, 19, 22, 23): confirm before publication.
4. **Pre-existing, not changed:** `tools/build-science.py` no longer runs on this base. NWPT-054 hand-added a “Continue” block to `science.html` after the generator's managed section, so its safety check refuses. The Science pages were therefore edited in place (menu line only), which is the same result the generator would give.
5. **Fonts:** Google Fonts is blocked in this environment, so screenshots and Lighthouse runs use fallback fonts. The hosted preview will use Sora and Source Serif 4.
