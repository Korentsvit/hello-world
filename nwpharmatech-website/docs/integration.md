# Integration instructions for the live-site bots

**Nothing in this package replaces the live website automatically.** There is no deployment step, no DNS change and no
whole-site copy. The existing website bots import each module below individually into the live site, after review,
and only once that module's publication blockers are cleared.

`python3 build.py` writes the package to `integration/`:

```
integration/
  README.md                  generated summary: modules, live paths, current blockers, missing optional assets
  routes.json                page id -> path on the live site (every internal link in every fragment comes from here)
  modules/<id>/
    fragment.html            the markup, wrapped in <div class="nwpt-module" data-nwpt-module="<id>" lang="en-GB">
    module.css               scoped styles: every selector starts with .nwpt-module, every class is prefixed nwpt-
    module.js                only for modules that need behaviour (at present: evidence-library)
    manifest.json            facts, references, downloads, anchors, links, redirects, CSP needs, blockers, optional assets
    preview.html             the module on its own under a strict CSP (noindex), for review
  downloads/                 exactly the files the modules link to
  assets/                    exactly the images the modules show (none at present)
  content/                   public-safe export of the shared content model
```

The six modules are `study-hub`, `phase-1`, `formulation`, `evidence-library`, `family-guide` and `newsroom`. The
Programme Room is **not** one of them (see "Not in this package").

## Do not change

- **The live header, footer, navigation, brand assets and security configuration stay as they are** unless a specific
  change is agreed. That covers the logo, favicon, fonts, colours outside the modules, the Content Security Policy and
  other response headers, robots rules and redirects that are already live. The modules contain none of these.
- **Staging-only material is not exported.** The staging banner, `noindex` meta tags, the `X-Robots-Tag` header, the
  staging `robots.txt`, the skip link, the notice bar and the staging navigation stay in the staging build only.
  - The staging notice bar says that NWPT-SM32300 is investigational and that the site is not medical advice. Each
    module says so in its own text where it matters. Whether the live header carries a similar notice is for the
    live-site owners to decide; it is not part of this package.
- **Do not edit a fragment by hand.** Fragments, styles and manifests are regenerated on every build, and hand edits
  are lost. Change the content or the template instead (see "Updating content") and re-import.
- **Do not inline `module.css` or `module.js`** into `<style>` or `<script>` elements, and do not add `'unsafe-inline'`
  to the live policy. The modules are built to work under `script-src 'self'; style-src 'self'`.

## How to import any module

These steps are the same for every module. The module sections below add what is specific to each one.

1. **Review first.** Open `modules/<id>/preview.html` over HTTP (for example `python3 -m http.server` run in
   `integration/`, then `/modules/<id>/preview.html`) and read `manifest.json`. Do not publish a module while its
   `publication_blockers` list is not empty. It is regenerated on every build and holds:
   - any review item in `content/review.json` that names the module's page, or a document it offers for download
     (for example "programme brief PDF");
   - every fact or reference shown in the module that is verified only through search summaries;
   - any unconfirmed leadership title the module mentions (none at present).

   The per-module notes below describe the kind of blocker; the manifest gives the current list.
2. **Place the markup.** Put the whole of `fragment.html` in the page's main content area, between the live header
   and footer, so that the `.nwpt-module` wrapper is kept. Keep its `lang="en-GB"`.
   - Place it full width. The module has its own content container (`.nwpt-container`: up to 1120px wide with 16 to
     28px side padding). Inside a live layout container, the padding adds to the live one; the result is still
     readable, but check it at 320px.
3. **Load the files from the same origin.** Copy `module.css` (and `module.js` where it exists) to any path on the
   live site, for example `/assets/nwpt/<id>/module.css`.
   - Load the CSS with `<link rel="stylesheet">` in the page `<head>`.
   - Load the JS with `<script src="…" defer>`.
   - Two modules on one page can share the same `.nwpt-module` base rules: they come from the same source, so they
     never conflict.
4. **Copy the downloads and assets** listed in `manifest.json` from `integration/downloads/` and
   `integration/assets/` to the paths in `routes.json` (default `/downloads/` and `/assets/`). Check their SHA-256
   against the manifest.
5. **Set the page's metadata in the live template:**
   - canonical URL: `https://www.nwpharmatech.org` plus the live path, extensionless (`/study`, never `/study.html`);
   - title and description: `manifest.json` → `placement.page_title` and `page_description` (the staging page's);
   - add the extensionless path to the live sitemap.
6. **Add the redirects** listed in `manifest.json` → `redirects` to the live site's redirect configuration (on
   Cloudflare Pages, `_redirects`). Each goes to its final path in one hop. Never point a rule at a `.html`
   address: Cloudflare Pages already answers `/x.html` with a 308 to `/x`, so `/x /x.html` loops.
7. **Headings.** Page modules start with their own `h1` (in the `.nwpt-page-hero` section). Do not add a second `h1`
   in the live template. `formulation` starts at `h2`, so it goes under the science page's `h1`.
8. **Ids.** Every id is kept as on the staging page, because other pages and published material link to them (for
   example `/evidence#ref-perucca-2020`). `manifest.json` → `anchors.ids` lists them. Check that none of them is
   already used elsewhere on the live page.
9. **Verify after import** (see each module, and "Checks for every module").

### Where each link goes

- Every internal link in a fragment is written from `routes.json`. By default these are the staging routes (`/study`,
  `/evidence`, `/faq` …).
- If the live site uses other paths:
  1. put them in `src/integration-routes.json`, in the same shape as `integration/routes.json` (any subset, for
     example `{"pages": {"evidence": "/research/evidence"}, "downloads": "/files/"}`);
  2. run `python3 build.py`.

  Every fragment and manifest is rewritten, and each affected manifest then lists the redirect needed from the old
  path. The build refuses a path ending in `.html`.
- Some links lead to pages outside this package: `/faq#urgent-help` (family guide), `/contact` and `/updates`
  (newsroom). Point them at the live equivalents in `src/integration-routes.json`. **Do not publish `family-guide` until its
  urgent-help link reaches a live page with country-by-country urgent help.**

### Styles and collisions

- **The module cannot restyle the live site.** Every rule in `module.css` starts with `.nwpt-module`, so it applies
  only inside the wrapper. The design tokens are custom properties named `--nwpt-*`, set on the wrapper. There are no
  `@font-face` rules, no `url()` references and no rules for `html`, `body` or `:root` outside the wrapper.
- **Live class rules cannot restyle the module.** Every class in a fragment has the `nwpt-` prefix, so live rules
  such as `.card`, `.btn`, `.tag`, `.chip` or `.container` never match module elements, and live custom properties
  such as `--brand` are not used.
- **Live element rules still apply** (for example `h2 { … }` or `table { … }`) to any property the module does not
  set itself. The module sets its own colours, type and spacing for headings, links, lists, tables and details, so
  normally nothing shows. Check the preview against the imported page after import.
- **Sizes use `rem`**, relative to the live site's root font size. If the live site changes `html { font-size }`
  (for example to 62.5%), tell us and the module styles will be adjusted rather than overridden.
- `tools/test-integration.mjs` proves both directions against a deliberately hostile host page (see "Tests").

### CSP

- No module has inline scripts, `style` attributes, event-handler attributes, fonts, frames or requests to other
  origins. Links to other sites are ordinary links, not requests.
- A live policy of `script-src 'self'; style-src 'self'` (the staging policy) needs no change.
- `manifest.json` → `csp` lists what each module needs:
  - `script-src 'self'` for `evidence-library` only;
  - `img-src 'self'` only once an authorised image appears in a module;
  - nothing else.

## Modules

### study-hub: the study hub (`/study`)

- **What it is:** the content of the staging `/study` page:
  - where the programme stands: summary, public synopsis and proposed design;
  - milestones (Planned / In progress / Completed, with sources);
  - registry entries, sponsor and oversight;
  - document history;
  - the draft publication policy, labelled as not adopted.

  It is a static page. **It is not the Programme Room** and must not be described as delivering it.
- **Files:** `modules/study-hub/` (no JavaScript).
- **Belongs:** as the main content of the live study page. Default path `/study`.
- **Depends on:**
  - content: `content/study.json` (summary, milestones, registrations, oversight, design sources), `documents.json`
    and facts such as `product.name`, `phase2b.*` and `company.name`;
  - downloads: `downloads/nwpharmatech-programme-brief.pdf`.
- **Anchors:** `#milestones`, `#documents` and `#publication-policy`. Other pages link to the first and last.
- **Redirects:** `/phase-2b` and `/phase2b` to the study page.
- **Accessibility:**
  - Tables have captions and scoped row headers.
  - Below 560px each row is stacked, with its column name shown before each value (`data-label`). This needs
    `module.css`.
- **Publication blockers:** facts verified only through search summaries (for example the company name), and review
  items that name the study page or the programme brief.
- **Verify after import:**
  - the brief downloads, and its link text gives the page count of the PDF actually published;
  - `#milestones` and `#documents` scroll to their sections;
  - the tables stack at 320px.

### phase-1: the Phase 1 study (`/phase-1`)

- **What it is:** the completed Phase 1 study in healthy volunteers:
  - what was studied, and who took part;
  - design, doses and comparator;
  - measurements;
  - results publication status ("Not yet published");
  - what the study can and cannot establish;
  - protocol history.
- **Files:** `modules/phase-1/` (no JavaScript).
- **Belongs:** as the main content of the live Phase 1 page. Default path `/phase-1`.
- **Depends on:**
  - content: `content/study.json` → `phase1`, and facts `phase1.*` and `product.*`;
  - references: `perucca-2020` (links to the evidence library).
- **Links:** `/study` and `/evidence#ref-perucca-2020`. Import `evidence-library` first, or at the same time, so the
  reference anchor exists.
- **Anchors:** `#results`.
- **Redirects:** `/phase1` to the Phase 1 page.
- **Accessibility:** one `h1`, then an `h2` per section; tables have captions.
- **Publication blockers:**
  - registry identifiers, registry URLs, location and status checked only through search summaries of the registry
    pages (`registry-index`);
  - the Perucca and Bialer 2020 reference (`index`).
- **Verify after import:**
  - both registry links open the registry entries;
  - the reference link lands on the study card in the evidence library.

### formulation: the formulation explanation (`/science#formulation`)

- **What it is:** the section "Why investigate a micellar softgel?" from the science page:
  - the delivery problem;
  - the design of NWPT-SM32300;
  - what has not been shown;
  - a diagram of where the evidence stops.
- **Left out:** the "Question 2" label, which only numbers the question within the staging science page.
- **Files:** `modules/formulation/` (no JavaScript).
- **Belongs:** as a section of the live science or formulation page, below that page's `h1`. Default location
  `/science#formulation`.
- **Depends on:**
  - facts `product.name`, `product.strength`, `product.form` and `product.formulation`;
  - references `perucca-2020` and `taylor-2018`;
  - a link to `/phase-1`.
- **Optional assets:** the softgel render (`assets/img/renders/nwpt-sm32300-softgel.jpg`) and the micelle
  illustration.
  - They are not supplied or not authorised, so their slots render nothing and no empty frame is shown.
  - When they are authorised in `content/assets.json` and supplied under `src/`, a rebuild adds the image to the
    fragment and to `integration/assets/`, and adds `img-src 'self'` to the manifest's CSP needs.
- **Anchors:** `#formulation` (the section itself); `/formulation` redirects to it.
  - The diagram uses the ids `dg-title`, `dg-desc` and `ar` internally. Check that they are free on the live page.
- **Accessibility:**
  - The diagram is an inline SVG with `role="img"`, a title and a full text description, plus a visible caption.
  - It uses presentation attributes, not inline styles, so it is CSP-safe.
- **Publication blockers:** the two references are verified only through search summaries.
- **Verify after import:** `/formulation` lands on the section; the diagram's text description is read by a screen
  reader.

### evidence-library: the evidence library (`/evidence`)

- **What it is:** the evidence library:
  - a plain-language overview;
  - citation downloads;
  - topic filters;
  - one study card per source (population, product, design, finding, limitations, verified links), grouped by
    topic, with negative, mixed and inconclusive findings flagged;
  - corrections;
  - review history.
- **Files:** `modules/evidence-library/`, **including `module.js`**.
- **Belongs:** as the main content of the live evidence page. Default path `/evidence`.
- **Import this module first:** the other modules' source links point at its cards (`/evidence#ref-<id>`).
- **Depends on:**
  - content: `content/references.json` (public items only);
  - downloads: `downloads/nwpharmatech-references.ris` and `.bib`, generated from the same file;
  - JavaScript: `module.js` for the filters.
- **Links:** `/newsroom#corrections`, and many external DOI, PubMed and official links.
- **Anchors:**
  - `#ref-<id>` for every card (other pages and the brief link to these);
  - `#cat-<topic>` for every topic.
- **Redirects:** `/references` to the evidence page.
- **CSP:** `script-src 'self'` for `module.js`.
- **JavaScript behaviour:** `module.js` acts only inside `[data-nwpt-module="evidence-library"]`.
  - It shows the filter bar, which is hidden without JavaScript, when every section is shown.
  - Filter buttons use `aria-pressed`, and a polite status message says how many sources are shown.
- **Accessibility:**
  - The filters are real buttons with a group label.
  - A targeted card is outlined.
  - Every card has a heading.
- **Publication blockers:** every reference here is verified only through search summaries (`index`) until the
  primary pages are opened (`docs/reference-verification.md`).
- **Verify after import:**
  - each filter shows only its topic, and "All" restores every section, by mouse and by keyboard;
  - `/evidence#ref-perucca-2020` lands on its card;
  - both citation files download.

### family-guide: the guide for young people and families (`/families`)

- **What it is:** a plain guide for young people and families:
  - what "clinical high risk" means and does not mean;
  - what an assessment may involve;
  - questions to ask a clinician;
  - school, work and family life;
  - where to get help, by region.
- **What it does not do:** it has no symptom quiz, risk score, diagnosis, form, data collection or investment
  prompt, and nothing may be added that does.
- **Files:** `modules/family-guide/` (no JavaScript; the regional lists are native `<details>` elements).
- **Belongs:** as the main content of the live families page. Default path `/families`.
- **Depends on:**
  - content: `content/services.json` (regional routes to services);
  - references `salazar-2021`, `nice-cg155` and `fusarpoli-2013`;
  - downloads: `downloads/appointment-preparation-sheet.pdf`.
- **Links:** `/faq#urgent-help` near the top. **This must reach a live page with urgent help by country before the
  module is published.** Map it in `src/integration-routes.json` if the live path differs.
- **Accessibility:** the regional lists open and close with the keyboard (native `<details>`), and the sheet is a
  tagged PDF.
- **Publication blockers:**
  - the references it cites, and any fact it shows, that are verified only through search summaries (`index`);
  - also confirm the regional service routes: each region in `services.json` is marked `verification: index`, and
    the page tells readers to confirm with their GP or local service.
- **Verify after import:**
  - the urgent-help link reaches the live urgent-help content;
  - the appointment sheet downloads;
  - the regional lists work by keyboard.

### newsroom: the newsroom (`/newsroom`)

- **What it is:**
  - the press kit: boilerplate and a fact sheet generated from the shared facts;
  - downloads;
  - guidance for writers;
  - how progress is reported;
  - the corrections log;
  - the editorial standards, labelled as a draft for adoption.
- **Left out:** the optional email sign-up. It stays off until a live provider test is recorded
  (`docs/email-signup.md`) and its import is agreed separately.
- **Files:** `modules/newsroom/` (no JavaScript).
- **Belongs:** as the main content of the live newsroom or press page. Default path `/newsroom`.
- **Depends on:**
  - facts `company.*`, `product.*`, `phase1.*`, `phase2b.*` and `site.as_of`;
  - downloads: `downloads/nwpharmatech-programme-brief.pdf` and `downloads/nwpharmatech-references.ris`.
- **Links:** `/contact` and `/updates`. Map them to the live contact and updates pages.
- **Anchors:** `#corrections` (the evidence library links to it) and `#standards`.
- **Redirects:** `/news` and `/press` to the newsroom.
- **Programme reports:** none are shown until a real report is approved in `content/reports.json`.
- **Publication blockers:** company facts and registry identifiers verified only through search summaries, and review
  items for the programme brief it offers for download.
- **Verify after import:**
  - the fact sheet matches the live company details;
  - both downloads work;
  - `/newsroom#corrections` lands on the log.

## Checks for every module

After import, on the live page:

1. The page answers 200 at its extensionless path with no redirect, and its canonical URL is that path on
   `https://www.nwpharmatech.org`.
2. The browser console shows no errors and no CSP violations. `module.css` (and `module.js`) load from the live
   origin.
3. The page matches `preview.html` at 320px and at desktop width, with no horizontal scrolling.
4. The live header, footer and other live content look exactly as before (the module styles cannot reach them).
5. An accessibility check (axe or equivalent, WCAG 2.2 AA) finds no violations inside `.nwpt-module`.
6. Every link in `manifest.json` → `links` and `downloads` resolves without a redirect, and every anchor exists.
7. The redirects in `manifest.json` → `redirects` each take one hop to the final path.

## Updating content and rebuilding

- **Facts, study status, references and so on** live only in `content/*.json` (schema: `docs/content-schema.md`).
  Page wording lives in `src/pages/<page>.html`. Change them there and run `python3 build.py`.
- The build regenerates every module, and regenerates and checks the PDFs whenever a fact inside them changes. A
  failed or refused build leaves the previous `integration/` untouched.
- The export is deterministic. Compare `manifest.json` → `files` (SHA-256) and `downloads` with the previous import
  to see exactly which files changed, and re-import only those, downloads included.
- Never edit `integration/` directly.

## The shared content model

`content/` is the single source for facts, study status, references, updates and documents. Every page, the PDFs and
these modules are generated from it, so a changed value changes everywhere at once.

`integration/content/` is a **read-only, public-safe export** of it, for a live platform that wants the data (for
example a CMS):

- public items only;
- internal fields removed (`review`, `notes`, source titles and locations);
- sources reduced to their public citation labels;
- `people.json` left out: no module shows profiles, and leadership titles await management confirmation.

Keep the ids, `verification` and `as_of` fields if you import it. Make changes in `content/`, not in the export.

## Not in this package

- **The Programme Room.** The interactive component was not supplied (`docs/programme-room.md`). The study hub is
  not the Programme Room.
- **The email sign-up** (see `newsroom`).
- **People and leadership profiles.** Titles await management confirmation. The live People page stays as it is.
- **The restricted financing material** (`restricted/`). It is never imported into the public site.

## Tests

`cd tools && node test-integration.mjs` (after `python3 build.py`) checks every module.

**Static checks:**
- every selector starts with `.nwpt-module`;
- classes and custom properties are prefixed;
- no inline scripts, styles or handlers;
- no site chrome;
- the manifest is complete, free of internal fields and its hashes match;
- every link resolves.

**In Chromium:**
- the preview loads under its strict CSP with no console errors, CSP violations or other-origin requests;
- no horizontal scroll at 320px;
- axe (WCAG 2.0, 2.1 and 2.2 AA) finds no violations inside the module;
- **collisions against a hostile host page:**
  - host elements keep exactly their computed styles when `module.css` is added;
  - the host's generic class rules and custom properties change no module element;
  - a negative control shows the check detects a leak;
- the evidence filters work by mouse and keyboard.

**Package checks:**
- `content/` is public-safe;
- `downloads/` holds exactly what the modules link to;
- the export is byte-identical when repeated;
- a path changed in `src/integration-routes.json` reaches every fragment and adds the redirect it needs.

The report is written to `docs/qa/integration-report.json`, and preview screenshots to
`docs/qa/screenshots/module-*.png`.
