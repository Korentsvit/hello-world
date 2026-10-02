# NWPT-057 Funding information architecture (preview candidate)

- **Base:** `82b26c5` (the NWPT-055 candidate reconciled onto live `5c7af8d`). Branch `claude/nwpt-057-funding-ia`.
- **Scope:** information architecture only. There is no redesign and no new funding page, and no scientific, financing, governance, analytics, form or privacy substance changes. `/desci` content is migrated as described below.
- **Status:** preview only; not deployed.

## Funding menu

| Before (all pages) | After (all pages) |
|---|---|
| How funding could work · Use of funds · Programme financing · Digital programme finance · Questions | **Funding overview** (`/programme-financing`) · **Use of funds** (`/funding-use`) · **Digital finance & DeSci** (`/funding/digital-programme-finance`) |

`/programme-financing` stays first and remains the general-investor landing page. *How funding could work* (`/how-it-works`) and *Questions* (`/faq`) leave the Funding menu, as specified, but stay published. They remain reachable from the footer (How it works, FAQ) and from links within pages.

**Outreach routing (no audience labels in the navigation):**
- conventional biotech / CNS / impact investors → `/programme-financing`;
- DeSci / crypto-native investors → `/funding/digital-programme-finance`;
- diligence → `/funding-use` and `/evidence`.

## Funding sub-navigation

`Overview | Use of funds | Digital finance & DeSci` appears at the top of `<main>` on the three funding pages, with the current page marked (`aria-current="page"`, underline). It uses a light variant on the two light pages and a dark variant on Digital finance & DeSci. The styles are in `funding-nav.css` and loaded only on those three pages.

## `/desci` retired

**Comparison** of `/desci` with Digital finance & DeSci:

| `/desci` idea | Already on the new page? | Action |
|---|---|---|
| Why look beyond conventional funding (long studies vs venture timelines; specialist and newer constituencies incl. crypto-native family offices and DeSci supporters) | No | **Migrated:** new FAQ “Why look beyond conventional funding alone?” |
| How programme funding could work (platform route, permissioned record at close, register-first fallback, ~US$10m planning target, development objectives, nothing live) | Yes | — |
| Dedicated vehicle *separate from NWPharmaTech parent equity* | Partly (ring-fenced vehicle) | **Migrated:** clause added to capital-flow step 02 |
| Register as legal truth; any digital representation only mirrors the register; providers and timing under evaluation | Partly (register-first fallback) | **Migrated:** sentence added to the “digital record” FAQ |
| What stays with NWPharmaTech; investors do not vote on dose, endpoints or medical decisions | Yes | — |
| Investors would not own the medicine or patient data | No | **Migrated:** sentence appended to the governance FAQ (existing wording unchanged) |
| How most visitors can take part; community ≠ investment rights; community separate from regulated process | No | **Migrated:** new FAQ “Can I take part without investing?” (links to Community) |
| No public token, no live offering, no wallet; clinical control with the sponsor | Yes | — |

All migrated sentences are existing published wording from `/desci` and `/programme-financing`.

**Retirement:**
- `site/desci.html` is removed.
- `_redirects`: `/desci`, `/desci/` and `/desci.html` → `/funding/digital-programme-finance` (301). Query strings, including UTM tags, are carried through; this was tested on the Cloudflare Pages runtime.
- Internal links updated:
  - `programme.html` (“DeSci approach”) and `updates/how-desci-could-help.html` (“DeSci overview”) now link to Digital finance & DeSci.
  - The Digital finance & DeSci page's own “DeSci” explore card now points to the DeSci explainer `updates/how-desci-could-help.html`, so it no longer loops back to the same page. Its `desci_click` analytics event is unchanged.
- `/desci` was not in the sitemap, so the sitemap needed no change. Canonical tags reference only each page's own URL.

## Generators

- `tools/build-funding-ia.py` (new, idempotent) maintains the Funding menu on every page, the sub-navigation on `/programme-financing` and `/funding-use`, and the `/desci` retirement.
- `tools/build-digital-finance.py` now only builds the Digital finance & DeSci page; its sub-navigation is in `release-032/source/digital-programme-finance.html`.
- Run `build-funding-ia.py` then `build-digital-finance.py`. A second run changes nothing.

## Checks

See the commit message and the reply to Filipp. They cover `tools/test-funding-ia.mjs` (new), `tools/test-digital-finance.mjs` (isolation rules updated for the funding IA; the `/desci` route check is now a redirect check) and the regression suites.
