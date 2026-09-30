# NWPT-055 Digital programme finance (`/funding/digital-programme-finance`) — preview candidate

> **30 September 2026.** Board approved the follow-up in `PRODUCTION-READY-DPF.md`. That tip updates the privacy notice for the no-send analytics layer and replaces the bare “Patient eligibility” label. Publish that tip. Do not attach an analytics sink. The notes below describe the `4e7ca635` preview candidate.

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

## Analytics (finalised 30 September 2026)

Two layers, as Filipp specified in the finalisation brief.

**1. Cloudflare Web Analytics (site-wide, cookieless).**
- Enabled on the Pages project by Web Boss (Pages → *Metrics* → Web Analytics); Cloudflare injects the beacon.
- No site token is kept in the repository.
- Every CSP in `_headers` now allows exactly `script-src https://static.cloudflareinsights.com` and `connect-src https://cloudflareinsights.com`. On the custom domain the beacon reports to same-origin `/cdn-cgi/rum`, which `'self'` already covers.
- No other CSP change.

**2. First-party conversion events: `POST /api/event`** (`functions/api/event.js`, a Pages Function, i.e. a Cloudflare Worker).
- **Stored per event** (Workers Analytics Engine binding **`NWPT_EVENTS`**, one data point):
  - `indexes: [event]`
  - `blobs: [event, path, link, utm_source, utm_medium, utm_campaign, utm_term, utm_content]`
  - `doubles: [server time in ms]`

  Analytics Engine also records its own write timestamp.
- **Allowlisted:**
  - the eight event names;
  - the page path (`/funding/digital-programme-finance` only);
  - the link identifier (`placement:/path#hash`, `faq:<id>` or `section:<id>`; anything else is stored empty);
  - UTM values (letters, digits, space, `._-`, at most 100 characters).
- **Never persisted:** email address, name, IP address, user agent, location, cookies, wallet or health data. The function reads only `Origin` and `Content-Type` from the request. A UTM tag containing `@` is dropped whole, and a value containing `@` can never be stored. Unknown fields are ignored.
- **Refused:** cross-origin posts (403), other content types (415), bodies over 2 KB (413), invalid JSON or unknown events or pages (400), and other methods (405).
- **Without the binding:** it stores nothing and answers 503, so analytics fail closed.
- **Client (`dpf.js`):**
  - each event is still pushed to `window.nwptAnalytics` and dispatched as `nwpt:analytics`;
  - it is also sent with `navigator.sendBeacon`, falling back to `fetch` with `keepalive` and credentials omitted;
  - nothing is sent when the browser signals Global Privacy Control or Do Not Track.
- **UTM cohort:** kept in `sessionStorage` for the tab and carried onto the page's own tracked links, as before.

| Event | When | Link identifier |
|---|---|---|
| `funding_digital_page_view` | page load | — |
| `architecture_section_view` | architecture section 30% visible (once) | `section:architecture` |
| `funding_use_click` | Funding use links | `objective:/funding-use.html`, `explore:/funding-use.html` |
| `evidence_click` | Evidence links | `explore:/evidence.html`, `final:/evidence.html` |
| `desci_click` | DeSci card | `explore:/desci.html` |
| `programme_financing_cta_click` | Programme financing card | `explore:/programme-financing.html` |
| `conversation_cta_click` | Contact financing links | `hero:`, `explore:`, `final:` + `/contact.html#financing` |
| `faq_expand` | an FAQ answer opened | `faq:<id>` |

**Privacy notice:** `privacy.html` gains two paragraphs under *Cookies and analytics* describing Cloudflare Web Analytics and the interaction records, including what they never contain and the GPC/DNT behaviour. The existing sentences are unchanged. This is not a legal sign-off.

**Reading the data:** Cloudflare dashboard → Workers & Pages → Analytics Engine → the dataset bound as `NWPT_EVENTS` (SQL API), for example: `SELECT blob1 AS event, blob4 AS utm_source, count() FROM <dataset> GROUP BY event, utm_source`.

## Claim matrix

Every external factual statement on the page and its source. “Site” means already published wording (or the unpublished `1406893` page it builds on). “Brief” means a company statement from the NWPT-055 brief (30 September 2026) that is not elsewhere on the site. Rows 12, 18, 19 and 23 use the wording Filipp approved in the finalisation brief.

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
| 12 | NWPharmaTech retains sponsor authority, protocol responsibility, CMC/manufacturing, safety, regulatory submissions, IP, counterparties, and licensing and commercial decisions. Eligibility criteria remain within the sponsor-approved protocol; individual participant eligibility is determined by investigators/sites under the protocol and applicable oversight. | **Filipp, finalisation brief (30 Sep 2026)**, approved wording; manufacturing quality also on `/about` and `/desci` |
| 13 | Investigators, ethics committees and regulators remain independent. | Site: `/programme-financing`; `/about` |
| 14 | Capital supporters do not vote on clinical design, trial budget or sponsor decisions; transparent financing does not mean decentralised clinical governance; no tokenholder clinical governance. | Site: `/programme-financing` (first two); Brief (third, consistent with “Class A: DAO / community must not control trial budget or protocol”) |
| 15 | A permissioned digital record at close is being evaluated where legally and operationally useful. | Site: `/proposed-token`; `/desci` |
| 16 | A conventional register-first private placement remains the fallback. | Site: `/proposed-token`; `/governance`; `/how-it-works`; `/desci` |
| 17 | No live public offering, public token sale, allocation, payment rail, mint or staking; you cannot invest, pay or connect a wallet here. | Site: `/programme-financing` (“no live public token … retail token sale”; “You cannot invest, pay, or connect a wallet on our website”); `/desci` (“production investment, payment and token issuance remain inactive”); footer |
| 18 | No yield, liquidity or appreciation is promised; no price chart. | **Filipp, finalisation brief (30 Sep 2026)**, approved wording (consistent with `/proposed-token` “Distributions may be zero”) |
| 19 | Any economic rights, if ultimately offered, would arise only under definitive private documentation, applicable eligibility requirements and applicable law; instrument, economics, jurisdictions and structure remain under evaluation. | **Filipp, finalisation brief (30 Sep 2026)**, approved wording; footer (“offered only under applicable law to eligible investors through appropriate private channels”) |
| 20 | Programme financing: private conversations; structure under evaluation. | Site: `/programme-financing` (“We are opening private conversations”; “Structure options … remain under evaluation”) |
| 21 | Process: conversation, diligence, structure, eligibility (KYC, investor and jurisdiction checks), close, report. | Brief; KYC on `/how-it-works` and `/proposed-token`; diligence materials on `/docs` and `/governance` |
| 22 | Capital layer: private investors, strategic capital, impact capital, potential digital rails, milestone-linked deployment. | Brief; approved with the page design (30 Sep 2026) |
| 23 | Digital infrastructure could support five potential capabilities (provenance, accountability, coordination, transparency, administrative programmability); none is operating today; subject to legal, technical and operating diligence. | **Filipp, finalisation brief (30 Sep 2026)**, approved framing; `/desci`; `/proposed-token` |
| 24 | No public data room; diligence materials shared privately. | Site: `/docs` (“not published as an open offer”); `/governance` (“private diligence package for eligible counterparties”) |

The page has no other external facts: no study numbers, percentages, prices, investor counts or transactions. The test enforces this.

## Checks (30 September 2026)

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

## Finalisation (30 September 2026)

**1. Production base.**
- Web Boss reported `/programme-financing` live from the `1406893` lineage. The repository's last production record is `5591bede` (`docs/production/PRODUCTION-BASELINE-5591bede/`).
- This environment's network policy blocks `www.nwpharmatech.org`, so the live site could not be read from here.
- The repository settles the release shape either way: `1406893` is a direct child of `5591bede`, and this candidate is a direct descendant of `1406893`.
  - If `1406893` is live, the candidate is a clean child of it.
  - If `5591bede` is live, this single deployment ships `/programme-financing` and `/funding/digital-programme-finance` together.
  - Either way it is **one** production deployment. The handoff includes a pre-deploy check that the live `/programme-financing` matches `1406893`, and stops if production is anything else.

**2. Governance wording.** “Patient eligibility” is gone from the page. The approved sentence (“Eligibility criteria remain within the sponsor-approved protocol. Individual participant eligibility is determined by investigators/sites under the protocol and applicable oversight.”) appears in three places: the sponsor layer, the *Stays with the sponsor* list and the FAQ. The sponsor-control list reads: sponsor authority; protocol, dose and endpoints; safety; CMC and manufacturing; regulatory submissions; IP; counterparties; licensing and commercial decisions.

**3. Financing language.**
- The FAQ reads “No yield, liquidity or appreciation is promised.” and “Any economic rights, if ultimately offered, would arise only under definitive private documentation, applicable eligibility requirements and applicable law.”
- It adds “The instrument, economics, jurisdictions and structure remain under evaluation; nothing is final.”
- The process qualifier (“Instrument, economic rights, jurisdictions and digital-record architecture remain under evaluation …”) is unchanged.

**4. Digital rails.**
- The intro reads “Digital infrastructure could support five potential capabilities. None of them is operating today. Subject to legal, technical and operating diligence.” The diligence sentence appears exactly once on the page.
- Each card begins “Could …”, and “Programmability” is now “Administrative programmability”.

**5. Analytics:** as above.

**Pre-existing, not changed:**
- `tools/build-science.py` no longer runs on this base, because NWPT-054 hand-edited `science.html`.
- The privacy notice's earlier line “Online enquiries are not active; contact is by email.” predates NWPT-054, which opened financing and updates on www. It is outside this release, and should be updated separately if the forms are live.

**Environment limits:**
- Google Fonts is blocked here, so screenshots and Lighthouse runs use fallback fonts.
- Safari/iPhone is untested.
