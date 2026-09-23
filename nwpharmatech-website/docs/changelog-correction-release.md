# Change log: correction release (staging draft 3.1)

Date: 23 September 2026. Base: increment C (`a4e31c4`). The release commit is in `COMMIT.txt` in the ZIP.

**Nothing has been deployed, no DNS has changed, the live website is untouched, and nothing has been pushed to GitHub.** The live-site bots integrate the reviewed modules themselves (`docs/integration.md`).

Every test count below comes from a run on the final tree. Passing tests are not proof that the scientific content is right or that a person has checked every page. Those checks are listed as still open under "Still open".

## 1. Production build gate
**Problem:** a refused production build had already overwritten `public/`. It left production-style output with the staging protections removed and unresolved content still present.

**Changes:**
- `build.py` now builds everything in a temporary directory beside the project.
- It validates the result before installing anything:
  - canonical URLs;
  - no link to a `.html` address or to a redirect;
  - redirect rules (no loops, no shadowed pages, no chains);
  - staging protections on every page;
  - restricted protections;
  - no hidden files in deployable folders.
- Only then does it replace `public/`, `restricted/`, `build/` and `integration/` together, under a lock, with rollback if any step fails.
- A refused or failed build prints "Build not installed; previous output left unchanged".
- `[TBC]` review notes are never rendered.

**Test:** `tools/test_build_gate.py` works on a copy of the project. For each failure case it compares every output file (path, size, SHA-256 and modification time) before and after the build. The cases:
- a refused production build;
- `--allow-stale-pdf` in production;
- a content error part-way through rendering;
- a redirect that would loop on Cloudflare;
- a failed output validation;
- a PDF whose facts changed but which cannot be regenerated.

Positive controls check that a good build installs and that a changed fact reaches the site and its PDF. **Result: 25 of 25 passed.**

## 2. Cloudflare routing
**Problem:** draft 3 redirected `/study` to `/study.html`, and Cloudflare Pages redirects `/study.html` back to `/study` (308). Seven routes looped.

**Changes:**
- Internal links are now extensionless and root-relative (`/study`, `/`). Canonical URLs and sitemap entries are absolute and extensionless (`https://www.nwpharmatech.org/study`).
- `_redirects` keeps only short aliases (for example `/team` to `/people`).
- The build rejects any rule that shadows a page, uses a form Cloudflare already redirects (`.html`, trailing slash, `/index.html`), or points at another redirect.
- `_headers` and `robots.txt` use `/financing`.
- The 404 page links to `/faq#urgent-help`.

**Test:** `tools/test-routes.mjs` serves both projects with Cloudflare's own Pages runtime (`wrangler pages dev`) and follows every request hop by hop. It covers:
- every page route (200, no redirect, correct canonical);
- every earlier `.html` and trailing-slash address (one 308 to the route);
- earlier deep links;
- every alias (one 301, no chain);
- the seven former loops;
- 404s for unknown addresses;
- every internal link and sitemap entry reached with no redirect;
- the CSP, noindex headers and downloads;
- the restricted project failing closed;
- nothing left behind in the deployable folders.

**Result: 143 of 143 passed.** Run against the increment-C build, the same test fails 74 checks; for example, `/study` loops 301 → 308 → 301.

**Found while testing:** Cloudflare runs `functions/_middleware.js` only when the restricted project is deployed from inside `restricted/`. Deployed from the parent folder, the restricted pages were served with Access unconfigured. `docs/deployment.md` now gives the exact command, the Git-integration settings and a check to run after every deploy. The test serves the project the correct way and checks that:
- it returns 503 when Access is unconfigured;
- it returns 403 when Access is configured but the request has no token;
- a request with an invalid token is refused;
- a write is refused.

**Limit:** the live site's own URL list was never supplied, so old live addresses can't be mapped or tested yet. `src/redirects.txt` and `docs/url-map.md` say where to add them.

## 3. Mobile menu
**Changes:**
- One Home link, marked as the current page on the home page. A "Programme brief" quick link keeps the brief prominent.
- The three groups form an exclusive accordion: native `<details name>`, with a script fallback. Only the current page's group starts open.
- A link to the current page, or to a `#fragment` on it, closes the menu (hidden, `aria-expanded="false"`) and moves focus to the destination.
- Escape closes the menu and returns focus to the toggle.
- Tabbing out of the open menu closes it, so focus is never hidden behind the panel.
- The panel fits and scrolls within the viewport on small screens.
- A sticky-header scroll padding keeps in-page destinations visible.
- Without JavaScript, the menu stays visible and its groups still open one at a time.

**Test:** `tools/test-menu.mjs` runs under the Cloudflare runtime with the CSP on. It covers:
- widths 320, 360, 375, 390 and 414 px, and 1099/1100 px;
- keyboard and pointer use;
- touch-target sizes;
- focus visibility and obscuring;
- overflow;
- axe with the menu open;
- no-JS and fallback behaviour.

**Result: 39 of 39 check groups passed.** Screenshots: `docs/qa/screenshots/menu-open-320.png` and `menu-open-390.png`.

## 4. Leadership
The latest management instruction and each dated record are compared person by person in [`leadership-reconciliation.md`](leadership-reconciliation.md), which holds the one-table summary. The August 2026 teaser is used only to corroborate another record, never on its own.

**On the people page now:**
- Scott Woods is featured first. He has no title and no adviser wording; the page describes the CHR-P expertise he brings to study design.
- No chair title is shown for either William Jarosz or Richard Barker. The records conflict, and management is asked who chairs the board.
- Professor Trevor Jones CBE is restored as Senior Adviser. The 2023 and 2025 records agree on that title, and he is on the July 2026 circulation list. His short biography is checked against search summaries, with the checks logged.
- John Kane's "Chair, Scientific Advisory Board" is withheld, because it appears only in the teaser and it is a committee appointment. He is shown as leading clinical trial design.
- Groups: "Clinical and scientific leadership", "Management", "Board and senior advisers".
- A title appears only when two or more records agree. Every title blocks a production build until management confirms it in writing.
- Portraits render nothing until authorised: no initials placeholder.

## 5. Integration package (not a site replacement)
`python3 build.py` now also writes `integration/`, with six modules the live-site bots import one at a time: study hub, Phase 1, formulation explanation, evidence library, family guide and newsroom.

Each module has:
- `fragment.html`: main content only. No header, footer, navigation, notice bar, staging banner or skip link.
- `module.css`: only the rules the fragment uses. Every selector is under `.nwpt-module`, classes and custom properties are `nwpt-` prefixed, and there are no global rules.
- `module.js`: only where behaviour is needed. It is CSP-compatible, with no inline code.
- `manifest.json`: facts with their verification level, references, downloads, anchors, links and the blockers that apply to the module.
- `preview.html`: for reviewing the module on its own.

Also in `integration/`:
- `routes.json`: a single route map for every link.
- The shared public-safe content model. Internal source notes are never exported.
- Instructions for each module in `docs/integration.md`. It opens by saying nothing replaces the live site automatically, and its "Do not change" section keeps the live header, footer, brand assets and security configuration unless a change is agreed.

**Test:** `tools/test-integration.mjs` covers:
- each preview under a strict CSP: no errors or violations, axe clean;
- scoping of every selector;
- a collision test with an aggressive host stylesheet, showing no leakage either way for classes and variables;
- evidence filters;
- that every link resolves.

**Result: 154 of 154 passed.** Two limits:
- Host element rules (for example the live site's `h2` styles) can still set properties the module leaves unset. The docs say so.
- The newsroom module ships without the optional sign-up form.

## 6. Programme Room
It is not in this package. It was not built in this workspace and is not in the repository, Drive, Gmail or the account's published artifacts. The study hub is not presented as the Programme Room anywhere. [`programme-room.md`](programme-room.md) records this, and sets out what the component must meet when supplied:
- one consistently labelled pooled risk series, not mixed with Kaplan–Meier estimates, and still unpublished pending primary verification;
- CSP-compatible, self-hosted assets.

## 7. Visual and editorial pass
- **Logo:** one switch (`content/assets.json` → `logo`) replaces the interim mark in the header, footer and favicon once the official SVG is supplied and authorised.
- **Portraits and renders:** these placements render nothing until authorised. There are no empty frames, initials or orphan captions. Sizes, alt text, captions and switches are in `docs/asset-manifest.md`.
- **Homepage:**
  - The programme brief now sits directly below the hero, under the heading "The programme at a glance".
  - Its download label is generated from the checked PDF ("PDF, 2 pages, … KB"), so it can't disagree with the file.
  - The evidence-label explanation is one sentence plus a compact key and a link to the full explanation (`/evidence#labels`).
- **Draft instructions removed from public pages:**
  - `[TBC]` notes moved to `content/review.json`, where they are reported as publication blockers and never shown.
  - The unadopted publication policy and editorial standards moved to `docs/proposals/`.
  - The note promising a future mailbox and the document-history "staging drafts" note were removed.
  - "(staging draft)" was removed from the PDF.
- **Unsupported content resolved or removed:** every public sentence was checked against the content sources. Examples:
  - unrecorded commitments such as "full ingredients will be listed", "doses will be published with its design" and "we never make unsolicited investment approaches";
  - "treatment" wording for the investigational medicine;
  - unsourced statements about CBD products;
  - independence wording aligned with the brief ("kept independent of funding and financing").

  Each change and its reason is recorded in the editorial pass notes.
- **Blockers and optional assets kept separate:** the build prints publication blockers and optional assets as separate lists and writes both to `build/build-report.json`. `docs/missing-inputs.md` keeps the same split.

## 8. Functional claims
- **Sign-up:**
  - "Nothing was saved" is gone.
  - A network failure, a timeout (8 s), a provider 5xx or an unreadable reply now says: "We could not get confirmation that your sign-up was received, so it may or may not have been recorded…". The browser script says the same.
  - `--with-signup` is refused until `tools/test-signup-live.mjs` has recorded a passing live test on a test list for the exact version of `subscribe.js` in use.
  - **Live provider behaviour has not been tested**: no provider is configured here.
  - Tests: 36 of 36 unit and static checks; 59 of 59 including the browser run under the Cloudflare runtime.
- **PDFs:**
  - When a fact in a PDF changes, the build regenerates it with `tools/make-pdf.mjs`.
  - It then checks the page count against the template, that the PDF is tagged, and that every fact value used appears in the PDF text.
  - The results go in `src/downloads/pdf-manifest.json`.
  - If regeneration or a check fails, the build stops without installing.
  - Download labels come from the manifest.
  - `tools/test_consistency.py` now also proves the brief PDF is regenerated and checked after a fact change.

## Other fixes found on the way
- `qa.mjs` runs under the Cloudflare runtime, uses extensionless routes, and checks that no internal link passes through a redirect. **Result: 268 of 268 passed.** It now also checks:
  - the brief's heading and label;
  - the brief sits right after the hero;
  - draft wording is absent;
  - Woods is not presented as an adviser, only one chair title is shown, and Trevor Jones is listed;
  - there are no empty image slots.
- Test tooling no longer writes into deployable folders (wrangler state is kept in a temporary copy).
- Review notes on restricted pages are now reported (restricted staging only).
- The newsroom boilerplate says "completed on 10 December 2025".

## Still open
- Everything in `docs/missing-inputs.md`, including primary-source verification and management confirmation of every title.
- Scientific, legal (including financial promotion) and MHRA advertising review.
- Manual screen-reader, Safari, Firefox and real-device testing.
- A live email-provider test.
- The live-site URL list.
- The Programme Room component.
