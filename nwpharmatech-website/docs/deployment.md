# Deployment requirements

**Do not modify or replace the live website.** Everything here targets staging.

## Requirements
- **Build:** Python 3.9+ (standard library only).
- **PDFs and QA:** Node 18+ with `playwright-core` and `axe-core` (`cd tools && npm install`), and a Chromium binary. Set `CHROMIUM=/path` if it isn't in the default location.
- **Hosting:** Cloudflare Pages, with two separate projects. Any static host works for `public/` unless you enable sign-up, which uses a Pages Function.

## Public staging
1. `python3 build.py && (cd tools && node make-pdf.mjs) && python3 build.py`
2. `cd tools && node qa.mjs && node test-signup.mjs`. All checks should pass.
3. Deploy `public/` to a staging project, for example `staging.nwpharmatech.org` or `*.pages.dev`.
   - The staging build is `noindex` everywhere, disallows everything in `robots.txt`, and shows a staging banner.
   - Putting staging behind Cloudflare Access as well is recommended.

## Restricted project
1. Deploy `restricted/` as a separate project on its own hostname, run from inside the folder so `functions/` is picked up.
2. Create a Cloudflare Access application for that hostname, allowing named reviewers only.
3. Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. Without them the middleware returns 503; it returns 403 without a valid token, and 405 for any submission.
4. `noindex` is not relied on for protection.

## Optional email sign-up
See `docs/email-signup.md`. It stays out of both staging and production until the provider is configured and tested end to end.

## Production (later, after sign-off)
1. Clear every item in `docs/missing-inputs.md` that is marked as a blocker.
2. Record primary-source checks with `tools/evidence_review.py`.
3. Run `python3 build.py --env production`. It refuses to build while any of these remain:
   - `[TBC]` markers;
   - links to missing pages;
   - search-summary-only facts or references.
   `--accept-index` exists only for a documented, signed-off exception.
4. Re-run QA.
5. Get scientific, editorial, legal (including financial promotion) and MHRA advertising sign-off.
6. Only then point the live DNS at the production build.
