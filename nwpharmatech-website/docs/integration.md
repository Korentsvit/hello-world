# Integration instructions for the existing website agents

This package is a **staging build**. Do not deploy it to the live domain, and do not replace the live site, until every production blocker is cleared.

## What to take
- **Content model:** `content/*.json`, described in `docs/content-schema.md`. It is the single source for facts, study status, profiles, references, updates and documents. If your platform has its own CMS, import these files and keep the IDs, `source`, `verification` and `as_of` fields. Do not render `review`, `notes` or `location`.
- **Page templates:** `src/pages/*.html` with placeholders (`{{fact:…}}`, `{{cite:…}}`, `{{block:…}}`). The generated markup for each block is defined in `buildlib/render.py`; reproduce it or call the build.
- **Deployable output:** `public/` (public site) and `restricted/` (a separate Access-protected project). Both are fully static except for optional Cloudflare Pages Functions.
- **Styles and scripts:** `src/assets/css/site.css` (design tokens at the top) and `src/assets/js/site.js` (menu, Q&A deep links, evidence filters, optional sign-up). There are no external requests.

## Invariants to preserve
1. **Public/restricted separation.** Never copy `restricted/` or `src/restricted/` into the public site. The restricted project fails closed without Cloudflare Access.
2. **Shared facts.** Do not hard-code a dose, status, date, registry ID or profile detail in a page. Change it in `content/`.
3. **Evidence labels.** One label per section or study card. "Programme information" is never an evidence grade.
4. **No placeholders in public output.** Missing optional modules are omitted: interviews, portraits, renders, endpoints, reports and graphics.
5. **Clinical claims.** Nothing about NWPT-SM32300's effectiveness, bioequivalence, tolerability advantage or brain delivery. Findings from other CBD products are always labelled as such.
6. **Financing.** `financing.html` stays `noindex`; there are no investment, payment or token functions; and access to restricted pages is never eligibility confirmation.
7. **Staging markers.** A production build (`--env production`) must pass. It fails on `[TBC]` markers, links to missing pages, and facts or references verified only through search summaries.

## Build, test and package
```
python3 build.py && (cd tools && npm install && node make-pdf.mjs) && python3 build.py
cd tools && node qa.mjs && node test-signup.mjs
tools/package.sh <label> <out-dir>
```
Routes and redirects are in `docs/url-map.md` and `src/redirects.txt`. Deployment steps are in `docs/deployment.md`.
