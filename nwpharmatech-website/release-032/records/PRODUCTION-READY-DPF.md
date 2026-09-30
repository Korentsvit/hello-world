# PRODUCTION-READY — Digital programme finance

**Status:** board approved for preview publish. Not deployed from this workspace.

**Start candidate (NWPT-055):** `4e7ca63502983c05a5c735e1b03513640b18675d`
**Live parent already on www for `/programme-financing`:** `1406893ad9b6c02f2e7d7aaa7dc4b84bd36449c8`
**Publish tip:** branch `cursor/nwpt-dpf-production-ready-09f3` HEAD. The full SHA is the commit that introduces this file; the pull request repeats it. Deploy that SHA, not `4e7ca635` alone.

`/programme-financing` is unchanged in body copy. This tip is `1406893` plus the NWPT-055 page plus the two production fixes below, in one tree.

## What changed vs `4e7ca635`

1. **Privacy notice** (`site/privacy.html`). New section “Digital programme finance page events”. It describes the layer already in `dpf.js`: events stay in `window.nwptAnalytics` and are announced as `nwpt:analytics`. They are not sent to NWPharmaTech or to any other party. No vendor, pixel, or off-origin sink is attached. Events stay on this website until a sink is approved and the notice is updated to name it. UTM tags only (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) are kept in this tab’s `sessionStorage` under `nwpt-utm` and copied onto same-origin links. Wallet, health, and identity data are not read. “Last updated: 26 September 2026.” is unchanged. Added: “Digital programme finance browser events described: 30 September 2026.” Sitemap `lastmod` for `/privacy.html` is 2026-09-30. No third-party tracking or egress was added. `dpf.js` still does not call `fetch`, `sendBeacon`, or an analytics host.

2. **Participant eligibility (Security Exact Fix).** The bare label “Patient eligibility” is removed from `/funding/digital-programme-finance` (sponsor layer, “Stays with the sponsor”, and the governance answer). Each place now uses: “Eligibility criteria remain within the sponsor-approved protocol. Individual participant eligibility is determined by investigators/sites under the protocol and applicable oversight.” The long line in the two-column sponsor list spans the columns (`dpf-cols__full`) so it stays readable. No other layout change.

## Release surface (confirmed in this tip)

| Item | Where |
|---|---|
| `/programme-financing` | kept; 200 |
| `/funding/digital-programme-finance` | `site/funding/digital-programme-finance.html`; 200 |
| Funding nav entry | every page that lists Programme financing |
| Link from `/programme-financing` | “See the proposed structure visually” |
| Link from `/funding-use` | “Digital programme finance” |
| Link from `/desci` | “Digital programme finance” |
| Sitemap | `https://www.nwpharmatech.org/funding/digital-programme-finance` |
| Analytics | first-party, no-send, as above |
| Privacy | section added |
| `/funding` and `/funding/` | still 301 to `/funding-use` |

Language locks kept: investigational; effectiveness in CHR-P not established; proposed next study not recruiting; prevention not the current primary aim; you cannot invest, pay, or connect a wallet here; no live public offering.

## Regression (30 September 2026)

Chromium 141.0.7390.37, Cloudflare Pages runtime (`wrangler pages dev`), site `release-032/site`.

| Suite | Result |
|---|---|
| `test-digital-finance.mjs` | 86 passed, 0 failed |
| `test-mobile-nav.mjs` | 23 passed, 0 failed (1,248 runs) |
| `test-nwpt034.mjs` | 35 passed, 0 failed |
| `test-homepage-discoverability.mjs` | 41 passed, 0 failed |
| `test-science-phone.mjs` | 8 passed, 0 failed |
| `test-science-gateway.mjs` | 74 passed, 0 failed |
| `test-programme-room.mjs` | 175 passed, 0 failed |
| `test-work-with-us.mjs` | 185 passed, 0 failed |
| `test-conversion.mjs` | 63 passed, 0 failed |

## Publish (Web PR — not run here)

There is no production publish script for www in this repo. Prior notes deploy **preview** only. Do not point this at the www production project or change DNS.

From a clean checkout of the tip SHA:

```
cd nwpharmatech-website/release-032/site
npx wrangler@4 pages deploy . --project-name nwpt-preview --branch main --commit-hash <TIP SHA>
```

- Deploy directory is `nwpharmatech-website/release-032/site` (not `public/`).
- Do not pass `--commit-dirty`.
- Leave production environment variables and www DNS unchanged.
- Do not set an analytics sink. Do not copy preview conversion secrets onto www as part of this publish.
- After deploy, confirm `/programme-financing` and `/funding/digital-programme-finance` both return 200, and `/funding` still redirects to `/funding-use`.
