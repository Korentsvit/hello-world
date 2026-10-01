# NWPT-055: hand-off to Web Boss (production)

**Release:** `/funding/digital-programme-finance` (Digital programme finance) together with `/programme-financing`, in **one** production deployment.
**Branch:** `claude/nwpt-digital-programme-finance`
**Candidate SHA:** the head of that branch, which Filipp relays with this hand-off. The site files at that head are exactly those checked in `records/DIGITAL-PROGRAMME-FINANCE-NWPT-055.md`.
**Publish directory:** `nwpharmatech-website/release-032/site/`
**Approval:** Filipp approved the design, the architecture and the final wording on 30 September 2026.

## 1. Before deploying: confirm the live base (stop if it is neither of these)

The repository's lineage is `5591bede` (NWPT-054 production record) → `1406893` (`/programme-financing`) → this candidate. The candidate is correct if production is **either** `5591bede` **or** `1406893`.

```sh
# the commit hash recorded on the live production deployment
npx wrangler@4 pages deployment list --project-name <production project> --environment production | head
```

- **`1406893…` or `5591bede…`:** proceed. This one deployment ships whatever is missing (`/programme-financing` if production is `5591bede`) plus the new page. Do not deploy `1406893` separately.
- **Anything else:** do not deploy. Report the live hash; the candidate must be rebased onto it first.

## 2. Project settings (production and preview environments)

The production project is **`nwpt-preview`** (aliases `www.nwpharmatech.org` and `nwpharmatech.org`), per `docs/production/PRODUCTION-BASELINE-5591bede/` on `830f086`.

1. **Workers Analytics Engine binding.** Pages project → Settings → Functions (Bindings) → *Analytics Engine*:
   - Variable name: **`NWPT_EVENTS`**
   - Dataset: **`nwpt_events`**

   Without this binding `/api/event` stores nothing and answers 503. The page works either way.
2. **Cloudflare Web Analytics.** Pages project → *Metrics* → enable Web Analytics (automatic beacon injection). No token goes in the repository. The CSP in `_headers` already allows `static.cloudflareinsights.com` (script) and `cloudflareinsights.com` (connect).
3. **No other settings change.** Keep `NWPT_CONVERSION_MODE`, the Resend/Turnstile settings, DNS and the production branch exactly as they are.

**What `/api/event` guarantees (tested in `tools/test-digital-finance.mjs`):**
- No `NWPT_EVENTS` binding means nothing is stored (503).
- Malformed or oversized requests (400, 413, 415) and cross-origin posts (403) are rejected.
- Fields not on the allowlist are discarded.
- A UTM value containing `@` is discarded whole.
- No IP address, user agent, cookie or fingerprint is read or stored.
- The page sends nothing when the browser signals Global Privacy Control or Do Not Track.

## 3. Deploy (from inside the publish directory, so `functions/` is compiled)

```sh
git clone https://github.com/Korentsvit/hello-world.git nwpt-deploy
cd nwpt-deploy
git checkout --detach <CANDIDATE SHA>
git rev-parse HEAD
git status --porcelain --untracked-files=all   # must print nothing
cd nwpharmatech-website/release-032/site
npx wrangler@4 pages deploy . --project-name <project> --branch <branch> --commit-hash <CANDIDATE SHA>
```

The output must include “Compiled Worker successfully” and “Uploading Functions bundle”. Do not use `--commit-dirty`.

## 4. After deploying: spot checks on www

| Check | Expected |
|---|---|
| `/funding/digital-programme-finance` | 200; dark page; Funding menu shows “Digital programme finance” (current) |
| `/funding/digital-programme-finance.html` | redirects to the extensionless URL |
| `/funding` and `/funding/` | still redirect to `/funding-use` |
| `/programme-financing`, `/funding-use`, `/desci` | 200; each has one link to the new page |
| Hero “Request a programme-financing conversation” | goes to `/contact#financing` |
| Browser console on the new page and on `/contact` | no CSP errors; Web Analytics beacon loads |
| DevTools → Network on the new page | `POST /api/event` → **204** on load and on CTA clicks (503 means the binding is missing) |
| A visit with `?utm_source=test&utm_content=a@b.com` | after a few minutes, Analytics Engine shows the event with `utm_source=test` and an **empty** `utm_content` |
| `/privacy` | describes the two live forms, Cloudflare Web Analytics, the event endpoint and its limited fields; “Last updated: 1 October 2026” |
| `/api/financing` and `/api/subscribe` GET | unchanged from NWPT-054 |
| Reduced motion (OS setting) | the page is static and every section is shown |

Analytics Engine query (SQL API):

```sql
SELECT blob1 AS event, blob3 AS link, blob4 AS utm_source, count() AS n
FROM nwpt_events
WHERE timestamp > NOW() - INTERVAL '1' DAY
GROUP BY event, link, utm_source
```

## 5. Rollback

Promote the previous production deployment (record its deployment ID before deploying). The new analytics binding and the Web Analytics toggle can stay; the previous code does not call `/api/event`.

## 6. Receipt to return

Production SHA, deployment ID, publish time (CEST), rollback deployment ID and SHA, the live base found in step 1, and the step 4 results (including one Analytics Engine row).

**Live-device check (yours):** Safari on iPhone is untested by Claude. Please open `/funding/digital-programme-finance` and `/privacy` on an iPhone and report anything that looks wrong.
