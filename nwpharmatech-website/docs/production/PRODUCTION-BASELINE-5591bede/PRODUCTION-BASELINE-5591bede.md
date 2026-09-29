# Production baseline — NWPT conversion activation (5591bede)

**Status:** LIVE production identity as of 2026-09-29  
**Recorder:** DAO Web PR Boss (Filipp closeout order)  
**Canonical closeout:** this file is the single production-baseline record for this release. Prefer it over older baselines (e.g. NWPT-046 / fbd865d artwork era).  
**Release code freeze:** no further site code changes for this release.

## Identity

| Field | Value |
|---|---|
| Label | **NWPT-054 production conversion** |
| **Production full SHA** | **`5591bede41b5f0a471d1ca954f184cae532828f6`** |
| **Production deploy ID** | **`1828e642-7999-4865-b092-554517b54f4f`** |
| Production URL | https://www.nwpharmatech.org |
| Project | `nwpt-preview` (aliases `www.nwpharmatech.org`, `nwpharmatech.org`) |
| Europe/Vienna deploy complete | **2026-09-29 12:30:37 CEST** |
| Journeys finished | **2026-09-29 12:41:51 CEST** |
| Mode | `NWPT_CONVERSION_MODE=production` |
| Immutable | https://1828e642.nwpt-preview.pages.dev |

## Authorship (accurate — do not attribute activation to Claude)

| Item | Value |
|---|---|
| Activation commit | `5591bede41b5f0a471d1ca954f184cae532828f6` |
| **Authored by** | **Cursor Agent** `<cursoragent@cursor.com>` |
| Cloud agent | https://cursor.com/agents/bc-fec14051-b171-5df4-897e-569af4c40c63 |
| Subject | `NWPT-054: open financing and programme updates on www when mode is production` |
| Parent (Claude preview lineage) | `452cafa20a582f999af536b7b3afbbdda092c525` |
| Branch / PR | `cursor/nwpt-production-conversion-0c63` · https://github.com/Korentsvit/hello-world/pull/3 |
| Co-authored-by trailer | Korentsvit |

Claude authored the parent preview candidate (`452cafa2`). Cursor authored the production-activation commit on top of that parent. Live www is the Cursor SHA.

## Rollback retained

| Field | Value |
|---|---|
| **Rollback deploy ID** | **`ef7196a6-027d-475b-ae76-a707681b2865`** |
| **Rollback SHA** | **`fbd865d74fa7272f3eb06dd69c0c3a1c8fefe61d`** |
| Immutable | https://ef7196a6.nwpt-preview.pages.dev |

## What is open on www

- **Financing enquiry** — open when mode=`production` + secrets complete  
- **Programme updates** (confirm → unsubscribe; confirm-after-unsub does not re-subscribe) — open under the same gate  
- **Research `/api/enquiry`** — remains **`configured: false`** on www/apex (`ENQUIRY_TO` not set)

## Production verification — PASS

**Label:** `TEST-NWPT-PROD-20260929` — **exclude from campaign KPIs / enquiry and subscriber totals**

| Journey | Result | Key evidence |
|---|---|---|
| Financing | **PASS** | HTTP 202 · ref **FIN-220E436B** · Resend delivered · Reply-To = visitor · Outlook receipt |
| Updates confirm | **PASS** | ref **UPD-2799C3F6** · confirmed |
| Unsubscribe | **PASS** | opted out |
| Confirm-after-unsub | **PASS** | did **not** re-subscribe |
| Enquiry on www | **PASS** | `configured: false` |

Machine JSON (box copy): `prod-5591-results.json` beside this file. Full publish narrative: `17-PROD-PUBLISH-5591bede.md`.

## Pre-prod smoke (preview project)

| Field | Value |
|---|---|
| Preview deploy | `729a68cf-33bc-47d8-9970-2c1187a950e3` |
| Immutable | https://729a68cf.nwpt-837794c-preview.pages.dev |
| Mode on preview | `NWPT_CONVERSION_MODE=preview` |

## Launch-ops notes (Web PR standing)

- Continue approved X schedule; return published links when posts go live.  
- Campaign links must use **live** www financing and programme-updates journeys.  
- Exclude all labelled tests (`TEST-NWPT-*`) from enquiry and subscriber totals.  
- At campaign check-in: report actual spend, measurable site visits, genuine financing enquiries, confirmed subscribers; mark unavailable data clearly.  
- Flag genuine financing enquiries promptly for Filipp response.  
- LinkedIn ads remain **paused** pending workable spending control within existing authority.  
- Website conversion is **live** and no longer blocks outreach.

## Parent one-liner

**CLOSED.** Production baseline = `5591bede` / deploy `1828e642…` / 2026-09-29 12:30:37 CEST · mode production · rollback `ef7196a6` / `fbd865d` · TEST-NWPT-PROD-20260929 all PASS · authored by Cursor Agent (parent Claude `452cafa2`) · enquiry off · no further code for this release.
