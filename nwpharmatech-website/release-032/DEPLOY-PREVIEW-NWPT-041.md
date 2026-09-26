# Deploying the NWPT-041 integrated preview (Programme Room + Work with us)

This deploys to the **existing preview project**. Do not deploy it to production. Leave online enquiries **unconfigured**.

## Where `functions/` is

`functions/` is **inside** the site directory, not beside it:

```
nwpharmatech-website/release-032/site/          <- deploy this directory, and run the command from inside it
├── index.html, work-with-us.html, programme-room.html, … (static site)
├── _headers, _redirects
└── functions/                                   <- Pages Functions, compiled at deploy time
    ├── api/enquiry.js                           -> /api/enquiry
    ├── api/subscribe.js                         -> /api/subscribe (unchanged, unused)
    ├── api/_lib/wwu-cards.js                    helper module, bundled into the function, not a route
    └── functions/[[path]].js                    guard: /functions and /functions/* always answer 404
```

Cloudflare Pages compiles `functions/` only from the directory the deploy runs in.
- **Deploying from `release-032/` with `pages deploy site`** uploads the static files but **no Functions**. `/api/enquiry` would then be missing, and the page would report enquiries as unavailable for the wrong reason. `tools/test-deploy-layout.mjs` demonstrates both cases.
- **wrangler never uploads the top-level `functions/` folder as static files.** Its upload ignore list in wrangler 4.40 is `_worker.js`, `_redirects`, `_headers`, `_routes.json`, `functions`, `.DS_Store`, `node_modules` and `.git`. The guard route covers any other deploy path too.

## Commands

**Direct upload with wrangler** (the method used so far):

```sh
git fetch origin claude/nwpt-work-with-us
git checkout <FULL SHA from the handoff>
cd nwpharmatech-website/release-032/site
npx wrangler@4 pages deploy . --project-name <existing preview project> --branch <preview branch name> --commit-hash <FULL SHA> --commit-dirty=true
```

The deploy output must include **"Compiled Worker successfully"** and **"Uploading Functions bundle"**. If it doesn't, the command ran from the wrong directory.

**Git integration** (if the preview project builds from the repository):
- Root directory: `nwpharmatech-website/release-032/site`
- Build command: *(empty)*
- Build output directory: `.`
- Production branch: unchanged. Deploy the branch `claude/nwpt-work-with-us` as a preview.

## Environment variables for this preview

Set **none** of these in the preview project:
- `ENQUIRY_TO`, `ENQUIRY_FROM`, `RESEND_API_KEY`
- `TURNSTILE_SITE_KEY`
- `ENQUIRY_TEST_MODE`, `ENQUIRY_PROVIDER_URL`, `TURNSTILE_VERIFY_URL`

An existing `TURNSTILE_SECRET_KEY` on its own does not switch the form on; all five production settings are required.

## Verification after deploying

Replace `$P` with the deployment URL.

| Command | Expected |
|---|---|
| `curl -si $P/api/enquiry` | `200`, `content-type: application/json`, body `{"configured":false,"turnstileSiteKey":null,"version":"wwu-1","testMode":false}`. This proves the function executes |
| `curl -si -X POST -H 'content-type: application/json' -d '{}' $P/api/enquiry` | `503`, body contains `"code":"not_configured"` |
| `curl -si $P/functions/api/enquiry.js` | `404`, `text/plain`, body `Not found`. No JavaScript |
| `curl -si $P/functions/api/_lib/wwu-cards.js` | `404`, `Not found` |
| `curl -si $P/api/_lib/wwu-cards.js` | `404`, the site's 404 page, not JavaScript |
| `curl -si $P/source/work-with-us.json` and `$P/tools/build-work-with-us.py` | `404` |
| `curl -sI $P/work-with-us` | `200`; exactly one `content-security-policy` header, and it contains `https://challenges.cloudflare.com` |
| `curl -sI $P/programme` | CSP **without** `challenges.cloudflare.com` |
| `curl -sI $P/work-with-us.html` | `308` to `/work-with-us` |

**In a browser:**
- `/work-with-us` says "Online enquiries are not available yet … Nothing has been sent".
- Cards can be added to the agenda.
- The phone agenda drawer opens and closes.
- "Copy link to these topics and cards" recreates the cards in a new tab.
- "Print or save as PDF" prints only the brief.
- The Programme menu and the footer show "Work with us".
- On `/programme-room`, pressing Shift+Tab never leaves the focused element under the sticky header.
