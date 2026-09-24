# Test results: module handoff (24 September 2026)

All results below are from one run on the committed tree (commit in `COMMIT.txt`), in the build environment:
Linux, Python 3, Node, Chromium (Playwright) and Cloudflare's Pages runtime (`wrangler pages dev`, workerd) run
locally. Nothing was deployed.

## Completed

### Tests of the handoff package
| Suite | Result | What it covers |
|---|---|---|
| `tools/test-integration.mjs` | **259 / 259** | The six modules: scoped CSS (every selector under the module wrapper, `nwpt-` classes), strict-CSP previews with no errors or other-origin requests, no horizontal scroll at 320 and 1280 px, axe WCAG 2.2 AA inside each module (preview, a hostile host page, and the example theme), collisions in both directions with a hostile host page, theme tokens (unthemed inheritance of font, size and colours; an example theme changes fonts, colours and spacing), manifests (complete, no internal fields, file hashes), links, anchors, downloads, dependencies, redirect safety (including trailing-slash forms, under the Cloudflare runtime), evidence filters by mouse and keyboard, links to cards hidden by a filter, and that `docs/integration.md` matches the manifests |
| `tools/test_content_rules.py` | **22 / 22** | The brief and the study module read the same content; crisis lines; PDF status and logo; source rules (no instruction or draft as a public source) |
| `tools/test_consistency.py` | **Pass** | One fact change reaches every page, every module fragment, the brief and its regenerated, checked PDF |
| `tools/test_build_gate.py` | **75 / 75** | A failed, refused or interrupted build (including a failed rollback) leaves every output, `integration/` included, unchanged |
| `tools/test_people.py` | **32 / 32** | The leadership rules: no date cutoff; Scott Woods's "CHR-P lead" is confirmed by the management instruction and refused without it; teaser-only and chair titles refused; consent and biography blockers |

### Tests of the staging site (not part of the handoff)
These cover the staging site the modules are generated from, and its restricted area. They are reported for completeness.
| Suite | Result |
|---|---|
| `tools/test-routes.mjs` (staging routes and redirects, Cloudflare runtime) | **175 / 175** |
| `tools/test-access.mjs` (restricted-area access guard) | **22 / 22** |
| `tools/test-signup.mjs --browser` (optional sign-up, off) | **99 / 99** |
| `tools/test-menu.mjs` (staging navigation) | **66 / 66** |
| `tools/qa.mjs` (every staging page) | **282 / 282** |

Screenshots from these runs: `module-<id>-desktop.png` and `module-<id>-320.png` for each module (unthemed, in the
plain stand-in host), and `module-study-hub-themed.png` and `module-evidence-library-themed.png` (example theme).

## Blocked by the environment (not done)
| Check | Why it could not be done | Who can do it |
|---|---|---|
| Compare each module with the live pages it overlaps, including the published proposed CHR-P design | The live site is blocked by the environment's network egress proxy (direct request and fetch both refused, 24 Sep 2026) | Grok team, using `MAPPING.md` and `CLINICAL-DESIGN-CHECK.md` |
| Test the modules inside the live site's real templates, stylesheet and CSP | Same; the live templates are not available here | Grok team, after import (checks in `docs/integration.md`, "Checks for every module") |
| Safari, Firefox, real devices, screen readers, Windows contrast themes | Only Chromium is available; no assistive technology | Grok team or an accessibility tester |
| Primary-source verification of references, registry and company facts | Publisher and registry pages were blocked; checks rest on search summaries (listed per module in `MAPPING.md`) | Scientific reviewer |
| Live email-provider test | No provider configured; sign-up stays off | Not needed unless sign-up is wanted |
| Behaviour on a real Cloudflare account | Not deployed, as instructed | Grok team |
