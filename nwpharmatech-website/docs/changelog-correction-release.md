# Change log: correction release (staging draft 3.1)

Date: 23 September 2026. Base: increment C (`a4e31c4`). The release commit is in `COMMIT.txt` in the ZIP.

**Nothing has been deployed, no DNS has changed, the live website is untouched, and nothing has been pushed to GitHub.** The live-site bots integrate the reviewed modules themselves (`docs/integration.md`).

## How this release was checked
1. The eight items were implemented.
2. Six independent reviewers then tried to show that each item was not done. They worked on private copies and ran their own browser and Cloudflare-runtime probes.
3. Ten serious findings survived a separate refutation check (one was later rated minor), and about fifty minor findings were reported. All of them are fixed, or listed as not fixed with the reason.
4. A second round of independent checkers re-ran the original reproductions against the fixed tree (results in `completion-report.md`).
5. A final verification pass confirmed 57 of 61 findings fixed and found new defects, mostly in the restricted project, the Access guard, rollback edge cases and unrecorded wording. The four open findings and the new defects are fixed; see "Verification pass" below.

Every test count below comes from a run on the final tree. Passing tests do not prove that the science is right or that a person has checked every page; those checks are listed under "Still open".

| Suite | What it proves | Result |
|---|---|---|
| `tools/test_build_gate.py` | Failed, refused or interrupted builds leave every output unchanged, even when the rollback fails | 75 / 75 |
| `tools/test-routes.mjs` | Routes, redirects, headers and the restricted guard under Cloudflare's own runtime | 175 / 175 |
| `tools/test-access.mjs` | The restricted Access guard: valid, forged, expired, tampered and malformed tokens, key rotation, audience tags, writes | 22 / 22 |
| `tools/test-menu.mjs` | Mobile menu behaviour, keyboard, narrow and short screens, forced colours | 66 / 66 |
| `tools/qa.mjs` | Every page at two widths, axe, links, downloads, content rules, restricted layout | 282 / 282 |
| `tools/test-integration.mjs` | The six modules: CSP, axe, scoping, collisions, routes, redirects, dependencies | 241 / 241 |
| `tools/test-signup.mjs` (`--browser`) | Sign-up outcomes, redirects, the provider-test gate, the live harness | 75 / 75 (99 / 99) |
| `tools/test_people.py` | The leadership title, consent and biography gate | 30 / 30 |
| `tools/test_content_rules.py` | Brief and study hub from the same content, crisis lines, PDF status, logo, source rules | 22 / 22 |
| `tools/test_consistency.py` | One fact change reaches every page, the brief and its regenerated PDF | Pass |

## 1. Production build gate
**Problem:** a refused production build had already overwritten `public/`. It left production-style output with the staging protections removed and unresolved content still present.

**Changes:**
- `build.py` builds everything in a temporary directory, validates it, and only then installs `public/`, `restricted/`, `build/` and `integration/`, together with any regenerated PDFs in `src/downloads`, as one transaction.
- The build holds a lock for its whole run (on POSIX systems). Any exception, Ctrl-C, SIGTERM or SIGHUP rolls everything back, and further signals are ignored until the rollback has finished.
- If the rollback itself fails (for example a disk error), nothing is deleted: the build exits with status 2 and names the kept temporary directory that holds the previous output.
- Validation covers:
  - canonical URLs;
  - no link to a `.html` address, to a redirect or to a missing `#fragment`;
  - redirect rules;
  - staging protections;
  - published PDFs byte-identical to their checked manifest;
  - the restricted guard, headers and links;
  - a Content-Security-Policy in both projects that forbids framing and allows only the one inline script;
  - every integration module present;
  - no hidden files in deployable folders.
- If the module exporter fails to load, the build fails. Before, it installed an empty `integration/`.
- `[TBC]` review notes are never rendered. They become publication blockers.

**Test:** `tools/test_build_gate.py` compares every file of all five trees before and after the build (path, size, SHA-256, modification time). The five trees are `public/`, `restricted/`, `build/`, `integration/` and `src/downloads`. The cases:
- a refused production build, including one refused after PDFs were regenerated;
- `--allow-stale-pdf` in production;
- a content error;
- looping, pattern, duplicate and broken-fragment redirects, and redirects from paths served as files (`/downloads/…`, `/robots.txt`);
- a failed validation;
- an exporter that cannot load;
- a stale PDF that cannot be regenerated;
- a swapped PDF file;
- `OSError` and Ctrl-C during installation;
- SIGTERM during PDF regeneration;
- an installation failure followed by a failed rollback (exit 2, temporary directory kept, previous output recoverable);
- positive controls.

## 2. Cloudflare routing
**Problem:** draft 3 redirected `/study` to `/study.html`, and Cloudflare Pages redirects `/study.html` back to `/study` with a 308, so seven routes looped.

**Changes:**
- **Links and URLs:**
  - Internal links are extensionless and root-relative (`/study`, `/`).
  - Canonical URLs and sitemap entries are absolute and extensionless.
- **Redirects:**
  - `_redirects` holds only short aliases, each also answered with a trailing slash, plus the one known live address (`/contactus`, from the company site).
  - The build rejects any rule that shadows a page or a form Cloudflare already redirects, chains, uses a splat or placeholder, points to a missing fragment, repeats a path, or starts from a path served as a file.
- **Production robots and headers:**
  - `robots.txt` blocks nothing, so `/financing` stays crawlable and its noindex is seen.
  - `/financing` keeps its `X-Robots-Tag` noindex.
- **Restricted project** (found while testing; see below):
  - The guard is now `restricted/_worker.js`.
  - The project has its own navigation, a Not Found page and a CSP.
  - It links only to its own pages, with short navigation labels that fit the header at every width.
  - The guard answers a malformed token with 403 (not 503), refetches Access's signing keys when a new key id appears (at most once a minute), accepts several comma-separated audience tags, and marks every response it serves with `x-nwpt-guard: verified`, so reviewers can confirm after a deploy that it is running.

**Found while testing:** the draft-3 guard was a `functions/` directory, which Cloudflare runs only when the deploy is made from inside the folder. Deployed from the parent folder, the restricted pages were served unguarded.

The Pages advanced-mode `_worker.js` now runs whichever folder the deploy is made from. `docs/deployment.md` also now requires the Access application to cover `<project>.pages.dev` and preview deployments, and gives checks to run after every deploy against those hostnames.

**Test:** `tools/test-routes.mjs` serves the projects with Cloudflare's own Pages runtime (`wrangler pages dev`) and follows every request hop by hop. It covers:
- page routes;
- earlier `.html` and trailing-slash addresses;
- earlier deep links, with their fragments;
- every alias, for chains and fragments;
- the former loops;
- 404s;
- every internal link;
- sitemap entries;
- a production-style header and robots pass;
- the restricted project failing closed, both from inside its folder and from its parent;
- no tool state left in deployable folders.

Run against the increment-C build, the same test fails 74 checks; for example, `/study` loops 301 → 308 → 301.

**Limit:** the live site's URL list was never supplied, so old live addresses can't be mapped or tested yet.

## 3. Mobile menu
- **One Home link**, marked as the current page on the home page. A "Programme brief" quick link keeps the brief one tap away.
- **One group open at a time**, using native `<details name>` with a script fallback. The current page's group starts open.
- **In-page destinations:** a link to the current page, or to a `#fragment` on it, closes the menu and moves focus to the destination.
- **Closing:**
  - The menu closes whenever focus leaves it and its toggle in either direction (Tab, Shift+Tab or the skip link), and on a click outside, so focus is never hidden behind it.
  - Escape closes it and returns focus to the toggle.
- **Short or zoomed screens:** opening the menu brings the header to the top so the panel fits and scrolls. Closing it with the toggle or Escape restores the page.
- **Forced colours:** the toggle icon stays visible at every width. The current page is marked with a border or underline that forced colours keep, and the pressed evidence filter stays distinguishable.
- **Labels:** menu landmark labels are translatable, and citation links read "Source:" once.

**Test:** `tools/test-menu.mjs` runs under the Cloudflare runtime with the CSP on. It covers:
- widths 320–414, 768 and 1099/1100 px;
- short viewports: 568×320, 341×162 and 320×180;
- keyboard (including Shift+Tab and the skip link), pointer and touch;
- reduced motion;
- forced colours, light and dark;
- axe with the menu open;
- no-JS behaviour.

Run on the pre-fix code, it fails 17 checks. Forced colours are Chromium emulation only.

## 4. Leadership
One table in [`leadership-reconciliation.md`](leadership-reconciliation.md) compares the latest management instruction with each dated record, listing only the people whose display changed or who need a decision.

**Title rules, checked by the build:**
- A title is shown only when two or more records agree, and at least one of them is a 2025–2026 record other than the teaser.
- "Confirmed" requires a logged management confirmation that names the title.
- No chair title or committee appointment is shown anywhere (pages, PDFs, PDF sources or integration fragments) until management confirms it.
- The August 2026 teaser can only corroborate another record.

**On the people page now:**
- **Scott Woods** is featured first, with no title, no adviser wording and no responsibility line: the October 2025 draft's "Additional Advisor Input" is not an appointment. Management is asked for his role wording.
- **Grace Blest-Hopley** keeps "Chief Scientific Officer". Her responsibility line is withheld because the records give only the title; management is asked for her responsibilities, as the round-3 instruction requires.
- **William Jarosz and Richard Barker** are shown with no chair title. The records conflict, and management is asked who chairs the board.
- **Trevor Jones:** Professor Trevor Jones CBE is restored as Senior Adviser. His biography uses only statements that are in the company records and were confirmed by a logged search.
- **John Kane** has neither "Chair, Scientific Advisory Board" (teaser only) nor "leads clinical trial design" (only the teaser links him to this programme's design). He is shown with the descriptor "Clinical trial design".
- **Daud Gutseriev:** "Chief Operating Officer" is withheld. Apart from the teaser, only the 2023 deck gives it. He is shown as "Co-founder".
- **Gillian Cannon** is shown as "Board Member". "Non-executive" is teaser-only.
- **Filipp Korentsvit** is shown as "Chief Executive Officer", with "Leads company strategy." No record says he leads the development programme, so that part was removed.
- **Richard Barker:** the table now also shows the 2023 deck's "Head of Advisory Board", and asks whether an advisory board exists now.
- **Biographies:** Trevor Jones's drops an unchecked opening, and Gillian Cannon's drops UCB, which is in no company record.
- **Production blockers:** every unconfirmed title, every profile without written consent to publish, and every index-level biography blocks production.
- **Portraits** render nothing until authorised.

## 5. Integration package (not a site replacement)
`python3 build.py` writes `integration/`, with six modules the live-site bots import one at a time:
- study hub;
- Phase 1;
- formulation explanation;
- evidence library;
- family guide;
- newsroom.

Each module has five files:
- **`fragment.html`:** main content only.
- **`module.css`:**
  - only the rules the fragment uses;
  - every selector under `.nwpt-module:not(#nwpt-a):not(#nwpt-b)`, a two-id weight so content-area host rules don't override it;
  - `nwpt-`-prefixed classes and custom properties;
  - links underlined explicitly with the `text-decoration` shorthand, so a live rule that changes the underline's colour or style cannot hide it.
- **`module.js`:** only where needed; CSP-compatible. A link anywhere on the live page to an evidence card hidden by the filter shows every topic first, including when the address already names that card.
- **`manifest.json`:**
  - facts with their verification level, references, downloads, anchors and links;
  - dependencies on pages outside the package;
  - redirects, marked required (the staging route) or optional (an alias, to skip if the path already exists on the live site), each with its trailing-slash form;
  - the blockers that apply to the module.
- **`preview.html`:** to review the module on its own.

**Routes:** one route map, `routes.json`. The export refuses live paths that would loop, chain or take over another page, and trailing-slash routes.

**Content export:** the export includes only citable or cited sources, published document versions and expanded fact values.

**Family guide:** it stays blocked until the live urgent-help link is checked and recorded, and while the crisis-line re-check is open.

**Instructions:** `docs/integration.md` gives module-by-module instructions, and its anchor lists are cross-checked against the manifests by the test. It opens by saying nothing replaces the live site automatically, and its "Do not change" section keeps the live header, footer, brand assets and security configuration.

**Limits:**
- Host rules for properties a module does not set, `!important` rules, and rules with two or more ids can still restyle a module. The docs say so.
- The newsroom module ships without the optional sign-up form.

## 6. Programme Room
It is not in this package. It was not built in this workspace, and it isn't in the repository, Drive, Gmail or the account's published artifacts. The study hub is not presented as the Programme Room anywhere. [`programme-room.md`](programme-room.md) records this, and lists what the component must meet when supplied:
- one consistently labelled pooled risk series, not mixed with Kaplan–Meier estimates, and unpublished until primary verification;
- CSP-compatible, self-hosted assets.

## 7. Visual and editorial pass
- **Logo:** one switch (`content/assets.json` → `logo`) replaces the interim mark in the header, footer, favicon and both PDFs once the official SVG is supplied and authorised.
- **Portraits and renders:** these placements render nothing until authorised. There are no empty frames, initials or orphan captions (`docs/asset-manifest.md`).
- **Homepage:**
  - The programme brief sits directly below the hero, under "The programme at a glance". Its label comes from the checked PDF ("PDF, 2 pages, … KB").
  - The evidence-label explanation is one sentence plus a compact key, linking to `/evidence#labels`.
- **Draft instructions:**
  - `[TBC]` notes moved to `content/review.json`, where they are blockers and never shown.
  - The unadopted publication policy and editorial standards moved to `docs/proposals/`.
  - The future-mailbox note and the "staging drafts" note were removed.
  - The PDF headers show the document status from `documents.json` ("Draft for review") while the newest version is unpublished. It is a status, not an instruction.
- **Unsupported content:**
  - **Commitments:** unrecorded ones (registering before enrolment, a registry results summary, "will be published after review") were removed.
  - **Build rule:** the build refuses public milestones and updates sourced to an instruction or a draft.
  - **Unsourced claims:** the unsourced DMC "usual" clause and the untested screen-reader claim were removed.
  - **Wording:** "treatment" wording for the investigational medicine was corrected.
  - **Brief:** its stage, completed-work and results rows now come from the same study summary and fact as the study hub.
  - **Crisis numbers:** these are kept once in `services.json` and used by both the Q&A and the appointment sheet, which now prints the lines for every UK nation.
  - **Unrecorded plans** (verification pass): the programme-report format and the corrections procedure (from the unadopted editorial standards), the "Lived experience" intention, the Phase 2B submission and supply milestones, and the funding milestone sourced only to the unapproved teaser were removed. The next milestone now says what the February 2026 update records.
  - **Investment wording:** "No investment is being accepted" is limited to "through this website or through the financing route described here", on every page and in the brief. A blanket statement could be untrue of the company as a whole. The Q&A now answers "Can I invest in the programme through this website?" directly.

  Every change is listed with its reason in [`editorial-pass-notes.md`](editorial-pass-notes.md).
- **Optional assets are kept separate from publication blockers**, in the build output, `build/build-report.json` and `docs/missing-inputs.md`.

## 8. Functional claims
**Sign-up:**
- "Nothing was saved" is gone.
- A network failure, a timeout, a provider 5xx, a redirect (redirects are no longer followed) or an unreadable reply now shows: "We could not get confirmation that your sign-up was received, so it may or may not have been recorded…". The browser script shows the same.
- The "unavailable" message now says the address "has not been passed to an email provider or stored".
- `--with-signup` is refused until `tools/test-signup-live.mjs` records a passing live test on a test list. The record must match the current `subscribe.js`, have every case `true`, and carry a matching digest.
- The live harness fails if a confirmed subscriber is told to confirm again.
- **Live provider behaviour has not been tested**: no provider is configured here.

**PDFs:**
- **When they regenerate:** when their expanded source changes (facts, study summary, results status, crisis lines, logo, template), or when the file no longer matches its checked manifest entry.
- **What is checked:**
  - page count;
  - tagging;
  - every fact value;
  - every line of source text.
- **Publishing:** only files byte-identical to their manifest entry are published, and download labels come from the manifest.
- **Versions:** a PDF whose content differs from its recorded version in `documents.json` is a publication blocker until a new version is recorded. Brief version 4 and sheet version 2 were never issued before this release; they are now bound to their final content (`source_sha256`), and `src/downloads/document-versions.json` logs them. Any later change needs version 5 and version 3.

## Verification pass
The last round of checks re-ran every earlier finding and looked for new defects. Fixed:
- **Restricted project:** navigation overflowed the header between 1100 and 1460 px and the investor journey overflowed at 320 px (short labels; the form's fieldsets and selects now shrink); the banner text moved to `content/ui/en.json`; the footer's link to the public legal page was removed; the build now checks the restricted CSP. `tools/qa.mjs` checks restricted pages for overflow at 320, 1100 and 1280 px.
- **Access guard:** malformed tokens, key rotation, several audience tags and a canary header (see §2); `docs/deployment.md` explains how to check the guard when Access covers every hostname, and how to set the audience tags for preview deployments.
- **Build:** rollback that itself fails, SIGHUP, duplicate redirects and redirects from file paths (see §1).
- **Integration:** trailing-slash redirect forms, blockers listed once, the underline shorthand and page-wide link handling (see §5). The staging evidence page got the same link handling.
- **QA:** the chair-title detector also catches plural and derived forms and committee names, and allows a confirmed title only on that person's own card; `qa.mjs` now exits non-zero on any failure.
- **Wording:** see §4 and §7, and pass W in `editorial-pass-notes.md`.
- **Docs:** `/contactus` and the trailing-slash forms added to `url-map.md`; the leadership table updated.

## Still open
- Everything in `docs/missing-inputs.md`. That includes primary-source verification, and management confirmation of every title, consent and biography.
- Scientific, legal (including financial promotion) and MHRA advertising review.
- Manual screen-reader, Safari, Firefox, real-device and real Windows contrast-theme testing.
- A live email-provider test.
- The live-site URL list.
- The Programme Room component.
