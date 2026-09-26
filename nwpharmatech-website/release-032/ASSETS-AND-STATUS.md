# Assets and release status: record

Updated 26 September 2026.

## Release status

| Stage | State |
|---|---|
| Reviewed baseline | NWPT-034 at `f99ee77` (GitHub `Korentsvit/hello-world`, branch `claude/nwpharmatech-website-bs459b`). A local tag, `nwpt-034-reviewed`, marks it; this session can push its branch but not tags |
| Preview | Web PR deployed `f99ee77` to https://nwpt-837794c-preview.pages.dev/ and confirmed the hero video, navigation, images and downloads |
| Production | Filipp approved production deployment of NWPT-034 with the portrait addition. Web PR owns that deployment. **Completion is not yet confirmed** |
| Grok's portrait commit | Not yet visible: `origin` carries only `master` and this branch. It will be reconciled when it is pushed or exported |

**Correction to the NWPT-034 status report.** I wrote that the navigation fix was "also live on production now". That was wrong. The navigation *bug* was live on production (NWPT-032). The *fix* was in NWPT-034: built in `f99ee77`, then on preview only once Web PR deployed it. It reaches production only with the approved deployment.

## Team portraits

| Person | File | Supplied to Grok (per Filipp) | Received in this workspace | Integrated by me |
|---|---|---|---|---|
| Filipp Korentsvit | `filipp-korentsvit.jpg` | Yes, from the corporate pitch deck | Yes: chat attachment, 123×123 px | No: Grok is integrating |
| Daud Gutseriev | `daud-gutseriev.jpg` | Yes | Yes, 123×123 px | No |
| Dr Grace Blest-Hopley | `grace-blest-hopley.jpg` | Yes | Yes, 123×123 px | No |
| Professor Scott Woods | `scott-woods.jpg` | Yes | Yes, 150×150 px | No |
| Dr John Kane | `john-kane.jpg` | Yes | Yes, 150×150 px | No |
| Prof. Richard Barker | `richard-barker.jpg` | Yes | Yes, 84×88 px | No |
| Prof. Trevor Jones | `trevor-jones.jpg` | Yes | Yes, 150×150 px | No |
| Gillian Cannon | `gillian-cannon.jpg` | **No: outstanding** | No | No |

**Notes**
- **Low resolution.** The largest file is 150 px. The cards show photos at 80 CSS px (Team) and 64 px (homepage), so they look soft on high-density screens. Barker's 84×88 file is below even 1× size on Team. Higher-resolution originals would help, but they are not blocking.
- **One check.** Please confirm that the Grace Blest-Hopley image is her own photograph. It has the look of a stock portrait, and pitch decks sometimes carry placeholders.
- **Hand-off rules.** Home and Team are not being edited here while Grok integrates. When Grok's commit arrives, its photographs, markup and styles will be taken over exactly as deployed. `tools/add-portraits.mjs` is not run over them.

## Other assets

- **Programme Room:** not supplied; a separate hand-off. Nothing on the site replaces it.
- **Hero video:** integrated from `nwpt-brain-ecs-hero-21x9.webm`. It stays on both Home and Science, per Filipp.
