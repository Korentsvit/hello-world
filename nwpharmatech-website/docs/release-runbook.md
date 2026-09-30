# Next NWPharmaTech website release: integration runbook

24 September 2026. Integration lead: Claude (code integration and release preparation). Baseline, assets and deployment
credentials: Grok team. No parallel edits to the same files while the release is being integrated.

## 1. Status: blocked on the baseline

The release is built on the **live site's own source**, not on the earlier staging site. None of the inputs below
could be obtained from this environment, so no integration has been done yet. Nothing has been deployed or changed
on the live site.

| Needed | What exactly | Checked, 24 Sep 2026 | Result |
|---|---|---|---|
| Live-site source | Repository URL (or a complete source export), the branch, the commit currently deployed, and the build and deploy commands (framework, Node version, output directory, Cloudflare Pages project name) | GitHub repositories this session can reach (`Korentsvit/hello-world`, `project-1`, `wdi-fundamentals-memorygame`); Drive; Gmail | Not found. Grok works through Cursor, and the repository connected there is not shared with this session |
| Live site, read access | To compare content and routes | `www.nwpharmatech.org` | Blocked by this environment's network egress proxy |
| First scientific portfolio | `NWPT-visual-portfolio-01.zip` (Manus); the DAO package was supplied separately and is integrated | Drive, Gmail | Not found |
| Portraits | Every authorised portrait, with who authorised it and when | Drive, Gmail | None supplied |
| Corporate biographies | The authorised published biographies to reuse | Live site (blocked) | Not reachable |
| Current CHR-P source | The CHR-P Phase 2B design document (the 300/600/900 mg range and the rest of the design) | Drive, Gmail | Not found. `NWPT Strategy Day Supporting Material` (Jul 2025) is not a design source: it covers schizophrenia relapse prevention and HIV, with unsupported efficacy claims |
| Programme Room | The actual component | Drive, Gmail, repositories | Not supplied; tracked separately, no substitute |

**Fastest way to unblock**, any one of:
1. Give the Claude GitHub App access to the live-site repository (claude.ai → Settings → Connectors → GitHub; install
   the app on that repository), and name the repository. I then create the integration branch `release/next`
   from the deployed commit.
2. Or put a complete source export (ZIP of the repository at the deployed commit, including build config and
   `package.json`/lock file) in Drive or attach it in this chat, with the deploy commands.

Assets: put `NWPT-visual-portfolio-01.zip`, the portraits and the CHR-P design document in Drive (or attach them).

## 2. Integration plan (once the baseline is in)

1. **Branch:** `release/next` from the deployed commit. Record that commit as the rollback point.
2. **Baseline run:** build it unchanged and run `tools/release-check.mjs` on the output. This is the "before"
   picture and proves the build works here. The homepage, navigation, Team and Updates pages are preserved as they are.
3. **Modules** (from commit `9159078`, `integration/modules/`), placed in the existing journey rather than as
   parallel pages:

   | Module | Placement | Avoiding duplication |
   |---|---|---|
   | Study progress | Beside the live programme-design section, on the same page or linked from it | The live design section stays and is reconciled with the CHR-P source (step 5). The module adds milestones, registrations and oversight only |
   | Phase 1 | Its own page, linked from the programme/pipeline page | Replaces any shorter Phase 1 summary only if the facts match; otherwise the difference is reported |
   | Formulation explainer | A section of the live science/technology page | Merged with existing formulation copy; no second explanation |
   | Evidence library | Its own page, linked from the science and study pages | One references list site-wide |
   | Family guide | Its own page, in the patient/family route | Its urgent-help link goes to the live urgent-help content (a dependency that blocks publication) |
   | Newsroom | The live news/press page | The live Updates list stays; the module adds the fact sheet and corrections log |

   Every link and download is rewritten to the live routes through `src/integration-routes.json`, then rebuilt. There are no hand edits to fragments.
4. **Theme:** the live site's fonts, colours and spacing are mapped once into `--nwpt-theme-*` (`integration/theme/nwpt-theme.css`).
5. **Clinical and commercial position:**
   - The live design is reconciled against the supplied CHR-P source, statement by statement (`CLINICAL-DESIGN-CHECK.md`).
   - Supported design details stay. Anything contradicted or unsupported is flagged, not silently deleted, and nothing from the schizophrenia studies is used.
   - The financing direction stays as agreed, and no investment transaction is activated.
6. **Assets:** portfolio images and portraits go through `tools/prepare-images.mjs` (step 4 below).
7. **Checks:** `tools/release-check.mjs` on the integrated build (step 5 below), plus the module suites.
8. **Handover:**
   - a preview build;
   - desktop and mobile screenshots of every page;
   - a change log;
   - exact test results;
   - a patch (`git format-patch` against the deployed commit) and the built output;
   - these rollback steps.

## 3. The Programme Room

It is tracked separately. If the actual component is supplied, it is integrated and checked like a module. Until then nothing stands in for it.

## 4. Assets

List every image in an intake file (example: `docs/asset-intake.example.json`), then run:

```
cd tools && node prepare-images.mjs ../assets-intake/intake.json ../assets-intake/out --base /assets/img/
```

Each image gets a purpose (hero, illustration, diagram, render, portrait or logo), alt text, and a caption that
describes what the image is conceptually (for example "Illustrative image", or "Diagram, not to scale").

The pipeline's output:
- AVIF, WebP and JPEG/PNG at the widths the purpose needs, never upscaled;
- `<picture>` markup with `width`, `height`, `sizes` and lazy loading;
- a report.

It refuses:
- a portrait without recorded authorisation;
- an image without alt text;
- a caption with claim wording (efficacy, safety, comparison or cure) until a reviewer is recorded.

A missing portrait is listed and skipped, and the rest of the release goes ahead: that person's card shows no image.

## 5. Release checks

```
cd tools && node release-check.mjs <built-site-dir> <out-dir> --modules study-hub,phase-1,formulation,evidence-library,family-guide,newsroom
```

It serves the build with Cloudflare's Pages runtime and crawls every page. It checks:
- routing, including redirect chains and a real 404;
- every internal link, anchor, image and download;
- `mailto:` and `tel:` links;
- no horizontal scroll at 390 and 1280 px;
- image loading, alt text and dimensions;
- console errors and CSP violations;
- axe WCAG 2.2 AA;
- one `h1` and a `nav` on every page;
- that each module is present and styled.

It also takes a desktop and a mobile screenshot of every page. External links are listed for a check after deploy.

## 6. Rollback

The domain has been on Cloudflare since 22 September 2026 (Cloudflare notification). The rollback depends on how Grok deploys:

- **Cloudflare Pages, direct upload or Git:** dashboard → Workers & Pages → the project → Deployments → the previous
  production deployment → "Rollback to this deployment". This is instant, with no rebuild and no DNS change.
- **Git integration:** alternatively revert the release merge on the production branch
  (`git revert -m 1 <merge-commit>`) and push; Pages rebuilds the previous state.
- **Other host:** redeploy the build of the recorded rollback commit.

Record the rollback commit and the deployment ID before deploying. After a rollback, run `release-check.mjs` on the
restored site's build to confirm.
