# NWPT-055: hand-off to Web Boss (production)

**Release:** `/funding/digital-programme-finance` (Digital programme finance) together with `/programme-financing`, in **one** production deployment. Do not deploy `ea97bff3f96db614429273ecb8c634f4bab8c780`. That commit is a parallel tip; `5c7af8d96aaef7f6d02b82aa9b705117733cb519` is not its ancestor.
**Branch:** `cursor/nwpt-055-rebase-onto-live-d653`
**Live production this candidate is rebased onto:** `5c7af8d96aaef7f6d02b82aa9b705117733cb519` (parent `15e38f117653603be24028a3747103f2ac36b7a9`). Cloudflare Pages project `nwpt-preview`, deployment `59c3fea1-7aea-4260-a69c-7f8da23cd126`.
**Candidate SHA:** `a2c65484c613ed7401c9c050c79f47f0a9d3f95b` is the rebase commit (privacy, `/api/event`, CSP, tests, and the first copy of this handoff). This file’s commit is its child and does not change `site/`. Deploy branch HEAD. Before deploy, `git rev-parse HEAD^` must print `a2c65484c613ed7401c9c050c79f47f0a9d3f95b`, `git merge-base --is-ancestor 5c7af8d96aaef7f6d02b82aa9b705117733cb519 HEAD` must succeed, and `git rev-parse HEAD` must match the pull request.
**Publish directory:** `nwpharmatech-website/release-032/site/`
**Page copy:** the Digital programme finance page is the copy live at `5c7af8d` (participant-eligibility sentence, published rails and returns wording). This candidate adds the privacy notice, the first-party `/api/event` path, and the Web Analytics CSP hosts. It does not replace the live page body with the parallel wording on `ea97bff3`.

## 1. Before deploying: confirm the live base (stop unless it is this)

The previous allowlist on `ea97bff3` was only `5591bede` or `1406893`. Production has since moved. Filipp directed a rebase onto the live tip rather than overwriting production with `ea97bff3`.

```sh
# the commit hash recorded on the live production deployment
npx wrangler@4 pages deployment list --project-name nwpt-preview --environment production | head
git merge-base --is-ancestor 5c7af8d96aaef7f6d02b82aa9b705117733cb519 HEAD && git rev-parse HEAD
```

- **`5c7af8d96aaef7f6d02b82aa9b705117733cb519`:** proceed, after Filipp’s plain GO, and only with the candidate HEAD recorded on the pull request. `5591bede` and `1406893` are ancestors of that live tip; they are not a second allowlist. Do not deploy this candidate onto them, and do not deploy `ea97bff3`.
- **Anything else:** do not deploy. Report the live hash; rebase this candidate onto it first.

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

Rollback target is the deployment that is live now, before this candidate ships:

- **Deployment ID:** `59c3fea1-7aea-4260-a69c-7f8da23cd126`
- **SHA:** `5c7af8d96aaef7f6d02b82aa9b705117733cb519`

Promote that deployment to roll back. This candidate does not change production bindings, `NWPT_EVENTS`, Web Analytics, DNS, or `NWPT_CONVERSION_MODE`. Those stay as they are until a separate, explicit change. The page at `5c7af8d` does not call `/api/event`. Do not treat a rollback as a reason to delete a binding that was never changed by this candidate.

## 6. Receipt to return

Production SHA, deployment ID, publish time (CEST), rollback deployment ID and SHA, the live base found in step 1, and the step 4 results (including one Analytics Engine row).

**Live-device check (yours):** Safari on iPhone is untested by Claude. Please open `/funding/digital-programme-finance` and `/privacy` on an iPhone and report anything that looks wrong.
