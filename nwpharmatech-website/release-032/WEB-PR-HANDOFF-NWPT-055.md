# NWPT-055: hand-off to Web Boss (production, fast-forward from live)

**Release:** the approved NWPT-055 finalisation (approved wording, `/api/event`, Cloudflare Web Analytics support, corrected privacy notice) on top of what is live.
**Live base:** `5c7af8d96aaef7f6d02b82aa9b705117733cb519` (deploy `59c3fea1`). That deployment already serves `/programme-financing` and `/funding/digital-programme-finance`.
**Branch:** `claude/nwpt-055-on-live` (a direct descendant of `5c7af8d`; a fast-forward from live).
**Candidate SHA:** the head of that branch, which Filipp relays with this hand-off. `ea97bff` on `claude/nwpt-digital-programme-finance` is **obsolete**; do not deploy it.
**Publish directory:** `nwpharmatech-website/release-032/site/`
**Approval:** Filipp approved the design, the architecture and the final wording on 30 September and 1 October 2026.
**Supersedes:** `records/PRODUCTION-READY-DPF.md` (Cursor, 30 September) for the next deploy. Its “do not attach an analytics sink” instruction is replaced by Filipp's analytics decision of 30 September (section 2).

## 1. Before deploying: confirm the live base (stop if it is not `5c7af8d`)

```sh
# the commit hash recorded on the live production deployment
npx wrangler@4 pages deployment list --project-name nwpt-preview --environment production | head
git merge-base --is-ancestor 5c7af8d96aaef7f6d02b82aa9b705117733cb519 <CANDIDATE SHA> && echo "fast-forward OK"
```

- **`5c7af8d…` (deploy `59c3fea1…`):** proceed. This deployment is a fast-forward of what is live.
- **Anything else:** do not deploy. Report the live hash; the candidate must be reconciled with it first.

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
npx wrangler@4 pages deploy . --project-name nwpt-preview --branch main --commit-hash <CANDIDATE SHA>
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
