# Deployment (staging first; the live site is not replaced)

## Public staging
1. `python3 build.py`. The staging build is the default: `noindex` on every page, `X-Robots-Tag` header, `robots.txt` disallows all, and a staging banner.
2. Deploy `public/` to a separate Cloudflare Pages project, for example `staging.nwpharmatech.org` or a `*.pages.dev` URL.
3. **Do not point www.nwpharmatech.org at it.**
4. Recommended: put the staging hostname behind Cloudflare Access as well.

## Restricted financing material
1. `restricted/` is a separate Cloudflare Pages project, for example `restricted-staging.nwpharmatech.org`. It is never merged into `public/`.
2. Create a Cloudflare Access (Zero Trust) application for that hostname, allowing only named reviewer emails.
3. In the Pages project, set `ACCESS_TEAM_DOMAIN` (for example `yourteam.cloudflareaccess.com`) and `ACCESS_AUD` (the application's AUD tag).
4. `functions/_middleware.js` then checks the Access token on every request and fails closed:
   - 503 if the variables are not set;
   - 403 if there is no token or the token is invalid;
   - 405 for any non-GET request, so the inactive forms stay inactive.
5. `noindex` alone is not relied on.

## Production (later)
1. Resolve every item in `unresolved.md`.
2. Run `python3 build.py --env production`. It refuses to build while `[TBC]` markers remain.
3. Re-run `cd tools && npm install && node qa.mjs`.
4. Obtain scientific, legal and regulatory sign-off.
5. Only then switch the live DNS.

Keep `financing.html` `noindex` and out of the sitemap until counsel approves it; the build already does both.
