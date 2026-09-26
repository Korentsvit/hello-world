# Preview handoff: differences from production, and what Grok needs to supply

24 September 2026. Internal.

## What the preview is

It is a complete static build of the staging site: 16 pages, the six modules in place, the DAO visual tranche, and working navigation, mobile menus and downloads.

- **Review copy:** a private Claude artifact (`tools/make-preview.py` output). It uses relative links and inlined CSS and JS. The artifact viewer may not open downloads.
- **Deployable output:** `public/`, for Cloudflare Pages. Its extensionless routes, `_redirects` and `_headers` are tested under Cloudflare's own runtime.

It is **not** built on the production source, which has not been supplied. `www.nwpharmatech.org` is unchanged.

## Access still needed

| For | Exactly what | Who |
|---|---|---|
| A real preview address | A Cloudflare API token limited to **Account → Cloudflare Pages → Edit**, stored in this environment's settings as `CLOUDFLARE_API_TOKEN`, with `CLOUDFLARE_ACCOUNT_ID`. Also `api.cloudflare.com` allowed in the environment's network access. I would then run `wrangler pages deploy public --project-name nwpharmatech-preview --branch preview`, giving a `*.pages.dev` address separate from the production domain. Alternatively Grok deploys `public/` from the output ZIP to a new Pages project | Owner of the Cloudflare account |
| Reconciling with production | The live-site repository (Claude GitHub App access or a complete source ZIP at the deployed commit), the branch, the deployed commit, and the build and deploy commands: framework, Node version, output directory, Pages project name, environment variables, `_headers`, `_redirects` | Grok |
| Current financing content | The live pages the DAO brief cites (`/how-it-works`, `/proposed-token`, `/updates/how-desci-could-help`, `/about`, `/faq`), with their current status and which wording is agreed | Grok, management |
| Old live addresses | The list of live URLs, for redirects | Grok |
| Visuals | The first scientific portfolio, `NWPT-visual-portfolio-01.zip` (Manus). The DAO package, `NWPT-DAO-visual-tranche-01.zip`, is already integrated | Manus / management |
| Portraits | Authorised headshots (list below) | Management |
| CHR-P design | The current CHR-P Phase 2B design source | Management |

## Differences from production (known without seeing it)

- **Baseline.** The preview is built on the staging site, not on Grok's current homepage, navigation, Team and Updates. Those improvements are not in the preview, and the preview is not meant to replace them.
- **Routes.** The live site has routes the preview lacks, such as `/how-it-works`, `/proposed-token`, `/about` and `/updates/<post>`. The preview's routes (`/financing`, `/people`, `/study` …) may not match the live ones. `src/integration-routes.json` maps them once the live list is known.
- **Financing wording.** The preview uses the agreed public statements only: the platform-integrated objective, the register-first fallback, and proposed milestone release. Detailed mechanics live on the production site are not reproduced, and none were invented: release approvers, custody, dual control and qualifying receipts.
- **Sponsor.** The preview says: "NWPharmaTech is developing the proposed CHR-P programme. Formal study responsibilities will be documented before the study begins." See the sponsorship question below.
- **Visuals.** The DAO package (`NWPT-DAO-visual-tranche-01.zip`) is integrated. The first scientific portfolio (`NWPT-visual-portfolio-01.zip`) and the portraits are missing, and nothing stands in for them.
- **Staging markers.** Every preview page carries the staging banner and `noindex`; the production build removes them (`python3 build.py --env production`, which is refused while publication blockers remain).

## Sponsorship question (for reconciliation, not published)

Earlier management instructions identified NWPharmaTech as the pharmaceutical sponsor of the proposed company-sponsored CHR-P programme. The records this build can see name NWPharmaTech Ltd as sponsor of the completed Phase 1 study only.

To settle:
1. Is the planned Phase 2B the company-sponsored programme, or a separate investigator-led or grant-funded study with its own sponsor?
2. For the company programme, confirm NWPharmaTech Ltd as sponsor, and when the formal responsibilities (sponsor, CRO, investigators) will be documented.

Until then the preview uses the wording above. It does not imply that submissions, approvals or trial initiation have happened.

## Missing headshots

**Roster reconciliation: nine profiles on staging, eight on the existing roster.** The additional person is **Professor Trevor Jones CBE** (Senior Adviser). He was not among the eight profiles in increment C (`a4e31c4`). He was added in the correction release because management's round-4 instruction (23 Sep 2026, source `brief-2026-09-c`) said the output "omits Trevor Jones" and asked for him not to be omitted.

His records:
- 2023 pitch deck: "Partner & Senior Regulatory and Clinical Advisor";
- October 2025 draft deck: "Senior Advisors";
- July 2026 board circulation email: a recipient, with no title stated;
- August 2026 teaser: not listed.

The other eight profiles are the eight in the existing roster. Nobody has been added or removed silently since. **Decision for management and Grok:** keep him (the round-4 instruction), or align with the live eight-person roster. Until someone decides, the staging profile stays as it is.

No portrait has been supplied or authorised. Each profile shows no image until one is: there are no initials or empty frames.

| Person | Portrait file expected | Status |
|---|---|---|
| Dr Scott W. Woods | `assets/img/people/scott-woods.jpg` | Missing |
| Dr John M. Kane | `assets/img/people/john-kane.jpg` | Missing |
| Dr Grace Blest-Hopley | `assets/img/people/grace-blest-hopley.jpg` | Missing |
| Filipp Korentsvit | `assets/img/people/filipp-korentsvit.jpg` | Missing |
| Daud Gutseriev | `assets/img/people/daud-gutseriev.jpg` | Missing |
| William Jarosz | `assets/img/people/william-jarosz.jpg` | Missing |
| Professor Richard Barker OBE | `assets/img/people/richard-barker.jpg` | Missing |
| Dr Gillian Cannon | `assets/img/people/gillian-cannon.jpg` | Missing |
| Professor Trevor Jones CBE | `assets/img/people/trevor-jones.jpg` | Missing |

Each portrait needs a record of who authorised it and when (`tools/prepare-images.mjs` refuses it otherwise). A missing portrait never blocks the release.
