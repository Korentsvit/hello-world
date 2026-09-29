# 17 — Production publish PASS (SHA 5591bede · conversion production mode)

**When:** 2026-09-29 ~12:26–12:42 CEST (Europe/Vienna UTC+2)  
**Operator:** Grok Bot Web PR executor  
**Authorisation:** Filipp standing approval — after production-activation SHA passes relevant preview checks, publish that exact SHA to www without another approval ask.  
**Reviewed/coordinated for deploy by:** DAO Web PR Boss  

## Authorship (accurate)

| Item | Value |
|---|---|
| Activation commit | `5591bede41b5f0a471d1ca954f184cae532828f6` |
| **Authored by** | **Cursor Agent** `<cursoragent@cursor.com>` via cloud agent https://cursor.com/agents/bc-fec14051-b171-5df4-897e-569af4c40c63 — **NOT Claude Code** |
| Subject | `NWPT-054: open financing and programme updates on www when mode is production` |
| Parent (Claude lineage) | `452cafa20a582f999af536b7b3afbbdda092c525` (preview final candidate) |
| Branch / PR | `cursor/nwpt-production-conversion-0c63` · https://github.com/Korentsvit/hello-world/pull/3 |
| Co-authored-by trailer | Korentsvit |

## Phase A — Preview-only (PASS)

| Field | Value |
|---|---|
| Checkout | `/workspace/nwpt/conversion-preview-dc81a1d/hello-world` @ exact `5591bede…` (porcelain clean) |
| Project | **`nwpt-837794c-preview` only** |
| **Preview deploy ID** | **`729a68cf-33bc-47d8-9970-2c1187a950e3`** |
| **Immutable preview URL** | **https://729a68cf.nwpt-837794c-preview.pages.dev** |
| Alias | https://nwpt-837794c-preview.pages.dev |
| Preview env | `NWPT_CONVERSION_MODE=preview` retained; secrets names: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `FINANCING_TO`, `UPDATES_TO`, `UPDATES_SIGNING_SECRET`; plain: `TURNSTILE_SITE_KEY`, `UPDATES_TOPIC_ID`, `ENQUIRY_FROM` |
| Smoke | GET financing + subscribe → `configured:true` `activation:preview` (immutable + alias) |
| Tag | `TEST-NWPT-PREVIEW-20260929-PRODOPEN` (config endpoints trusted before prod) |
| www during Phase A | Still rollback `ef7196a6` / `fbd865d` |

## Phase B — Production publish (PASS)

| Field | Value |
|---|---|
| Project | **`nwpt-preview`** (serves www.nwpharmatech.org + apex) |
| **Production full SHA** | **`5591bede41b5f0a471d1ca954f184cae532828f6`** |
| **Production deploy ID** | **`1828e642-7999-4865-b092-554517b54f4f`** |
| Immutable | https://1828e642.nwpt-preview.pages.dev |
| Aliases | `www.nwpharmatech.org`, `nwpharmatech.org` |
| **Europe/Vienna timestamp** | **2026-09-29 12:30:37 CEST** (deploy complete); journeys finished **12:41:51 CEST** |
| Mode | `NWPT_CONVERSION_MODE=production` |
| Secrets set (names only) | `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `FINANCING_TO`, `UPDATES_TO`, `UPDATES_SIGNING_SECRET` |
| Plain vars | `TURNSTILE_SITE_KEY`, `UPDATES_TOPIC_ID=54be4246-0e01-4798-9284-a4558732f19b`, `ENQUIRY_FROM` |
| **Not set** | `ENQUIRY_TO` (research enquiry stays unconfigured) |
| Recipients | `FINANCING_TO` / `UPDATES_TO` → filipp.korentsvit@nwpharmatech.com |
| pages.dev host | financing/subscribe correctly **held** under mode=production (www/apex only open) |

### Turnstile hostname fix (required for www)

Widget **NWPT enquiry preview** `0x4AAAAAAFEugrIHKzvfIiyX` initially allowed only `nwpt-837794c-preview.pages.dev` → Turnstile error **110200** on www.  
Updated via Cloudflare dashboard API (session) to:

- `nwpt-837794c-preview.pages.dev` (kept)
- `www.nwpharmatech.org` (added)
- `nwpharmatech.org` (added)

Evidence: `/workspace/nwpt/conversion-preview-dc81a1d/journeys/turnstile-host-update.json`

## Rollback retained

| Field | Value |
|---|---|
| **Rollback deploy ID** | **`ef7196a6-027d-475b-ae76-a707681b2865`** |
| **Rollback SHA** | **`fbd865d74fa7272f3eb06dd69c0c3a1c8fefe61d`** |
| Immutable | https://ef7196a6.nwpt-preview.pages.dev |

## Phase C — Production verification (PASS)

**Label:** `TEST-NWPT-PROD-20260929` — **exclude from campaign KPIs**  
Host: https://www.nwpharmatech.org  
Machine JSON: `/workspace/nwpt/conversion-preview-dc81a1d/journeys/prod-5591-results.json`

| Check | Result | Evidence |
|---|---|---|
| API financing GET | **PASS** | `configured:true` `activation:production` |
| API subscribe GET | **PASS** | `configured:true` `activation:production` |
| Research `/api/enquiry` | **PASS** | `configured:false` (stays off on www) |
| Financing Turnstile | **PASS** | token length 730 (after hostname fix) |
| Financing POST | **PASS** | HTTP **202** · ref **`FIN-220E436B`** |
| Financing Resend delivery | **PASS** | id `01a0ecc1-63a3-7323-ac1e-0461677b29cb` · `last_event=delivered` |
| **Reply-To** | **PASS** | Resend `reply_to` = `filipp.korentsvit+finprod-2e2525@nwpharmatech.com` (visitor) |
| Outlook financing receipt | **PASS** | Inbox · subject `Programme financing enquiry — TEST-NWPT-PROD-20260929 Org` · body ref `FIN-220E436B` · visitor email in body |
| Updates request | **PASS** | HTTP **202** · ref **`UPD-2799C3F6`** · `registered:false` |
| Updates confirm | **PASS** | HTTP 200 · **Programme updates confirmed** · topic `opt_in` · `nwpt_updates=confirmed` |
| Unsubscribe | **PASS** | HTTP 200 · **Programme updates stopped** · topic `opt_out` · `nwpt_updates=unsubscribed` |
| Confirm-after-unsub | **PASS** | HTTP 200 · **This address was unsubscribed** · still opted out · **did not** re-subscribe |
| LinkedIn / X / DNS | **NOT TOUCHED** | — |

### Concise PASS/FAIL table

| Journey | Result |
|---|---|
| Financing 202 + Resend delivered | **PASS** |
| Reply-To = visitor | **PASS** |
| Outlook financing receipt | **PASS** |
| Updates confirm | **PASS** |
| Unsubscribe | **PASS** |
| Confirm-after-unsub guard | **PASS** |
| Enquiry disabled on www | **PASS** |

## Critical failure handling

None required after Turnstile hostname update. First journey attempt failed Turnstile (110200) **before** hostnames were added; production mode was left in place only after domains were fixed and full Phase C re-run passed. Forms were not left broken: post-fix journeys all green.

## Artefacts

| Path | Role |
|---|---|
| `/workspace/nwpt/pilot-30d-2026-09-28/17-PROD-PUBLISH-5591bede.md` | This report |
| `/workspace/nwpt/conversion-preview-dc81a1d/wrangler-5591bede-preview-deploy.log` | Phase A deploy log |
| `/workspace/nwpt/conversion-preview-dc81a1d/wrangler-5591bede-prod-deploy.log` | Phase B deploy log |
| `/workspace/nwpt/conversion-preview-dc81a1d/journeys/prod-5591-results.json` | Phase C machine results |
| `/workspace/nwpt/conversion-preview-dc81a1d/journeys/prod-5591-run2.log` | Phase C run log (green) |
| `/workspace/nwpt/conversion-preview-dc81a1d/journeys/turnstile-host-update.json` | Turnstile domain update receipt |
| `/workspace/nwpt/conversion-preview-dc81a1d/prod-secrets-names-final.txt` | Prod secret names only |

## Parent one-liner

**SUCCESS.** www live on `5591bede` / deploy `1828e642-7999-4865-b092-554517b54f4f` with `NWPT_CONVERSION_MODE=production` (2026-09-29 12:30:37 CEST). Preview `729a68cf…`. Rollback retained `ef7196a6` / `fbd865d`. Journeys `TEST-NWPT-PROD-20260929` all PASS (FIN-220E436B Reply-To + Outlook; UPD confirm→unsub→guard). Enquiry off. Authored by Cursor Agent (not Claude). LinkedIn/X/DNS untouched.
