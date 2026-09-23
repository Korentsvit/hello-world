# Deployment requirements

**Do not modify or replace the live website, and do not change DNS.** Everything here targets staging. The live-site bots import the reviewed modules individually (`docs/integration.md`); this package is not a site replacement.

## Requirements
- **Build:** Python 3.9+ (standard library only).
- **PDFs, QA and route tests:** Node 18+ with the tools' dev dependencies (`cd tools && npm install`: `playwright-core`, `axe-core`, `pdfjs-dist`, `wrangler`), and a Chromium binary (set `CHROMIUM=/path` if it isn't in the default location).
- **Hosting:** Cloudflare Pages, two separate projects: public staging, and restricted staging behind Cloudflare Access.

## How a build is made and installed
- `python3 build.py` builds into a temporary directory and validates the result before anything is replaced. It checks:
  - canonical URLs;
  - that no link points at a `.html` address or at a redirect;
  - redirect rules (none may loop, shadow a page or chain);
  - staging protections on every page;
  - the restricted protections.
- Only when every check passes does it replace `public/`, `restricted/`, `build/` and `integration/`. A refused or failed build leaves the previous output exactly as it was. `tools/test_build_gate.py` proves this for:
  - a refused production build;
  - a content error;
  - a looping redirect;
  - a failed validation;
  - stale PDFs.
- **PDFs:** when a fact inside a PDF changes, the build regenerates the PDF, then checks its page count, tagging and that every fact value appears in it (`tools/make-pdf.mjs`, recorded in `src/downloads/pdf-manifest.json`). If that can't be done, the build fails. `--allow-stale-pdf` exists for staging previews only and is itself a publication blocker.
- The build prints two separate lists and writes them to `build/build-report.json`:
  - **publication blockers** (content accuracy, verification, approvals, unconfirmed leadership titles, stale PDFs);
  - **optional assets not yet supplied** (portraits, renders, the official logo, interview recordings). These never block.

## Routes on Cloudflare Pages
- Page URLs are **extensionless**: `/study`, `/phase-1`, `/`.
  - Cloudflare Pages serves `/study` from `study.html`.
  - It answers `/study.html` and `/study/` with a 308 to `/study`, and `/index.html` with a 308 to `/`.
- The build writes every internal link, canonical URL and sitemap entry in that final form, so no visitor or crawler passes through a redirect.
- Earlier `.html` addresses keep working through Cloudflare's single 308.
- `src/redirects.txt` holds only short aliases (for example `/team` to `/people`). The build rejects any rule for a page's own route, its `.html` form or its trailing-slash form: a rule such as `/study /study.html` loops with Cloudflare's 308, and that was the bug in draft 3.
- `cd tools && node test-routes.mjs` serves both projects with Cloudflare's own Pages runtime (`wrangler pages dev`) and follows every route hop by hop. It covers:
  - page routes;
  - earlier `.html` and trailing-slash addresses;
  - every alias, checked for chains;
  - the former loops;
  - 404s;
  - every internal link;
  - sitemap entries;
  - headers and downloads;
  - the restricted project failing closed.

## Staging
1. `python3 build.py`
2. Run the test suites (`python3 tools/test_build_gate.py`, `python3 tools/test_consistency.py`, then `cd tools && node test-routes.mjs && node test-menu.mjs && node qa.mjs && node test-signup.mjs && node test-integration.mjs`). All checks should pass.
3. Deploy `public/` to a staging project (for example `staging.nwpharmatech.org` or `*.pages.dev`). The staging build:
   - is `noindex` everywhere (meta tag and `X-Robots-Tag` header);
   - disallows everything in `robots.txt`;
   - shows a staging banner.

   Putting staging behind Cloudflare Access as well is recommended.

## Restricted project
1. **Deploy from inside the folder**, so Cloudflare picks up `functions/_middleware.js`: `cd restricted && npx wrangler pages deploy . --project-name <restricted-project>`.
   - Cloudflare Pages runs Functions only from a `functions/` directory at the project root, meaning the directory the deploy is run from, or the Git integration's root directory.
   - If `restricted/` is uploaded from its parent folder, or the Git integration's root directory is left at the repository root, the pages are served **without** the middleware. This was confirmed with `wrangler pages dev`: run from the parent, the restricted pages answer 200 with Access unconfigured.
   - With Git integration, set the project's root directory to `nwpharmatech-website/restricted` and its build output directory to `.`.
2. Create a Cloudflare Access application for that hostname, allowing named reviewers only. This is the primary control.
3. Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. The middleware then refuses:
   - with 503, when they are not set;
   - with 403, when there is no valid token;
   - with 405, for any submission.
4. **Verify after every deploy**, from outside Access, before sharing the link:
   - `curl -sI https://<restricted-host>/` must not return 200;
   - `curl -s https://<restricted-host>/functions/_middleware.js` must not return the file.
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
