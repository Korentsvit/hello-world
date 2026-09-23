# Deployment requirements

**Do not modify or replace the live website, and do not change DNS.** Everything here targets staging. The live-site bots import the reviewed modules individually (`docs/integration.md`); this package is not a site replacement.

## Requirements
- **Build:** Python 3.9+ (standard library only) on a POSIX system (Linux or macOS): the build takes an exclusive lock so that concurrent builds cannot mix outputs. On Windows it runs without the lock; run one build at a time.
- **PDFs, QA and route tests:** Node 18+ with the tools' dev dependencies (`cd tools && npm install`: `playwright-core`, `axe-core`, `pdfjs-dist`, `wrangler`), and a Chromium binary (set `CHROMIUM=/path` if it isn't in the default location).
- **Hosting:** Cloudflare Pages, two separate projects: public staging, and restricted staging behind Cloudflare Access.

## How a build is made and installed
- `python3 build.py` builds into a temporary directory and validates the result before anything is replaced. It checks:
  - canonical URLs;
  - that no link points at a `.html` address, at a redirect, or at a #fragment the target page lacks;
  - redirect rules (none may loop, shadow a page or chain; no splats or placeholders; target fragments must exist);
  - staging protections on every page;
  - that every published PDF is byte-identical to its checked manifest entry;
  - the restricted protections (the `_worker.js` guard, noindex and CSP headers, links only to restricted pages);
  - that every integration module was exported.
- Only when every check passes does it replace `public/`, `restricted/`, `build/` and `integration/`, together with any regenerated PDFs in `src/downloads`, as one transaction. An exception or interrupt (Ctrl-C, SIGTERM) at any point rolls everything back.
- A refused, failed or interrupted build leaves the previous output exactly as it was. `tools/test_build_gate.py` proves this for:
  - a refused production build, including one refused after PDFs were regenerated;
  - a content error;
  - looping, pattern and broken-fragment redirects;
  - a failed validation;
  - an exporter that cannot load;
  - stale PDFs that cannot be regenerated;
  - a swapped PDF file;
  - failures and interrupts in the middle of installation;
  - SIGTERM.
- **PDFs:** whenever a PDF's expanded source changes (a fact, a study-summary field, the template), or the file no longer matches its checked manifest entry, the build regenerates it with `tools/make-pdf.mjs`. It then checks:
  - its page count;
  - its tagging;
  - that every fact value and every line of the source text appears in it.

  The results, with the SHA-256 of both the source and the PDF, go in `src/downloads/pdf-manifest.json`. Only PDFs whose file matches its checked entry are published; any other PDF in `src/downloads` is not published. If regeneration fails, the build fails. `--allow-stale-pdf` exists for staging previews only and is itself a publication blocker.
- The build prints two separate lists and writes them to `build/build-report.json`:
  - **publication blockers** (content accuracy, verification, approvals, unconfirmed leadership titles, stale PDFs);
  - **optional assets not yet supplied** (portraits, renders, the official logo, interview recordings). These never block.

## Routes on Cloudflare Pages
- Page URLs are **extensionless**: `/study`, `/phase-1`, `/`.
  - Cloudflare Pages serves `/study` from `study.html`.
  - It answers `/study.html` and `/study/` with a 308 to `/study`, and `/index.html` with a 308 to `/`.
- The build writes every internal link, canonical URL and sitemap entry in that final form, so no visitor or crawler passes through a redirect.
- Earlier `.html` addresses keep working through Cloudflare's single 308.
- `src/redirects.txt` holds only short aliases (for example `/team` to `/people`) and known live addresses (`/contactus`). The build adds each alias's trailing-slash form. It rejects any rule for a page's own route, its `.html` form or its trailing-slash form: a rule such as `/study /study.html` loops with Cloudflare's 308, and that was the bug in draft 3.
- In production `robots.txt` blocks nothing: the noindex page (`/financing`) must stay crawlable so that crawlers can see its noindex.
- `cd tools && node test-routes.mjs` serves both projects with Cloudflare's own Pages runtime (`wrangler pages dev`) and follows every route hop by hop. It covers:
  - page routes;
  - earlier `.html` and trailing-slash addresses;
  - earlier deep links, checked for their fragments;
  - every alias and its trailing-slash form, checked for chains and fragments;
  - the one known live address;
  - the former loops;
  - 404s;
  - every internal link;
  - sitemap entries;
  - headers and downloads;
  - a production-style header and robots pass;
  - the restricted project failing closed whether it is deployed from inside its folder or from the parent folder.
- The live site's full URL list has not been supplied, so old live addresses cannot be tested yet.

## Staging
1. `python3 build.py`
2. Run the test suites (`python3 tools/test_build_gate.py`, `python3 tools/test_consistency.py`, `python3 tools/test_people.py`, `python3 tools/test_content_rules.py`, then `cd tools && node test-routes.mjs && node test-access.mjs && node test-menu.mjs && node qa.mjs && node test-signup.mjs --browser && node test-integration.mjs`). All checks should pass.
3. Deploy `public/` to a staging project (for example `staging.nwpharmatech.org` or `*.pages.dev`). The staging build:
   - is `noindex` everywhere (meta tag and `X-Robots-Tag` header);
   - disallows everything in `robots.txt`;
   - shows a staging banner.

   Putting staging behind Cloudflare Access as well is recommended.

## Restricted project
The restricted material is protected in two layers:
- **Cloudflare Access (primary):** an Access application that covers **every** hostname of the project.
- **The `_worker.js` guard (defence in depth):** it checks the Access token on every request and fails closed.

1. **Deploy:** `npx wrangler pages deploy restricted --project-name <restricted-project>`, or Git integration with build output directory `nwpharmatech-website/restricted`.
   - The guard is `restricted/_worker.js` (Cloudflare Pages "advanced mode").
   - Pages runs it from the output folder **whichever directory the deploy is run from**, and never serves the file itself.
   - Draft 3 used a `functions/` directory, which Cloudflare runs only when the deploy is made from inside the folder. Deployed from the parent folder, those pages were served unguarded. `tools/test-routes.mjs` now serves the project both ways and requires a closed response each time.
2. **Access application:**
   - Create a Cloudflare Access application allowing named reviewers only.
   - It must cover the custom hostname, **`<project>.pages.dev`**, and **preview deployments** (`*.<project>.pages.dev`). In the Pages project settings, enable the Access policy for preview deployments.
   - An Access application on the custom hostname alone leaves `<project>.pages.dev` open.
3. **Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`** as the project's environment variables. The guard then refuses:
   - with 503 when they are not set;
   - with 403 when there is no valid token (wrong audience, issuer, key or signature, or an expired or malformed token);
   - with 405 for any submission.

   These cases are unit-tested in `tools/test-access.mjs`.
4. **Verify after every deploy, before sharing any link**, from a browser or terminal that is *not* signed in to Access. Run these against the `pages.dev` hostname and a preview URL as well as the custom hostname:
   - `curl -s -o /dev/null -w '%{http_code}' https://<host>/` must be 302 or 403 (Access login or refusal) or 503. It must never be 200.
   - `curl -s https://<host>/financing-structure | head -c 200` must not contain HTML page content.
   - To check the guard itself behind Access, sign in and confirm the pages load. Then, from a signed-out session on a hostname Access does not cover, confirm the response is 403 or 503 plain text.
5. `noindex` is not relied on for protection.

## Optional email sign-up
See `docs/email-signup.md`. `--with-signup` is refused until a live provider test on a test list is recorded in `content/signup-provider-test.json`. Deploy a sign-up build from inside `public/` for the same reason as above.

## Production (later, after sign-off; not part of this package)
1. Clear every publication blocker (`docs/missing-inputs.md`, `build/build-report.json`), including management confirmation of every leadership title (`docs/leadership-reconciliation.md`).
2. Record primary-source checks with `tools/evidence_review.py`.
3. `python3 build.py --env production` refuses while any blocker remains, and leaves the previous output unchanged. `--accept-index` exists only for a documented, signed-off exception.
4. Re-run every test suite.
5. Get scientific, editorial, legal (including financial promotion) and MHRA advertising sign-off.
6. Integration into the live site is done by the live-site bots, module by module (`docs/integration.md`). DNS is not part of this package.
