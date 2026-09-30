# Test results: navigable preview (24 September 2026)

All results come from one run on the committed tree (commit in `COMMIT.txt`), in the build environment: Linux, Python 3, Node, Chromium (Playwright), and Cloudflare's Pages runtime (`wrangler pages dev`, workerd) run locally. Nothing was deployed.

## Completed

| Suite | Result | What it covers |
|---|---|---|
| `tools/release-check.mjs` on `public/` | **2,014 / 2,014** | Every page crawled under Cloudflare's runtime: routing (no redirect chains, a real 404), 956 internal links and anchors, 22 download checks, contact links, no sideways scroll at 390 and 1280 px, 60 image checks (loading, alt text, dimensions), console and CSP errors, axe at both widths, one `h1` and a `nav` per page; desktop and mobile screenshots of all 15 pages |
| `tools/test-funding.mjs` | **72 / 72** | Funding, Programme governance and Updates. The "Who does what" buttons with mouse and keyboard (arrows, Home/End, Enter, Space), visible focus, a static version without JavaScript, reduced motion. The diagram: real text, legible sizes, lanes side by side or stacked. Image loading and phone crops. Content length. Expandable sections closed by default. Essential qualifications visible. No investment controls, no retired routes, no repeated boundary statements |
| `tools/qa.mjs` | **282 / 282** | Every page at two widths: axe, links, downloads, content rules, restricted area |
| `tools/test-integration.mjs` | **259 / 259** | The six modules: scoping, theme tokens, CSP, axe, collisions, routes, redirects, dependencies |
| `tools/test-menu.mjs` | **66 / 66** | Mobile menu: one group at a time, keyboard, narrow and short screens, forced colours (Chromium emulation) |
| `tools/test-routes.mjs` | **181 / 181** | Routes, aliases, headers and the restricted guard under Cloudflare's runtime |
| `tools/test_build_gate.py` | **75 / 75** | A failed, refused or interrupted build leaves every output unchanged |
| `tools/test-access.mjs` | **22 / 22** | Restricted-area access guard |
| `tools/test-signup.mjs --browser` | **99 / 99** | Optional sign-up (off) |
| `tools/test_people.py` | **32 / 32** | Leadership rules |
| `tools/test_content_rules.py` | **22 / 22** | Shared content, crisis lines, PDF status, source rules |
| `tools/test_consistency.py` | **Pass** | One fact change reaches pages, modules and PDFs |
| `tools/test-images.mjs` | **7 / 7** | Image and portrait pipeline |
| `tools/test-release-check.mjs` | **10 / 10** | Negative controls: the release checker catches each planted defect |

The navigable preview's link structure was also checked, since preview hosts serve plain files: 799 local links, every target file and `#fragment` present.

## How to read these results

- **Accessibility.** These are automated checks: axe-core (WCAG 2.2 A and AA rules), keyboard paths, focus visibility, reflow, reduced motion, and forced colours in Chromium emulation. They find many issues but not all. They are **not** a WCAG conformance audit or certification. Screen-reader testing, other browsers, real devices and a manual audit have not been done.
- **Performance.** Timings were measured locally on an uncached, unthrottled connection (Funding: 46 KB of images on phones, 115 KB on desktop). They are diagnostic only and do not predict field performance.

## Blocked by the environment (not done)

| Check | Why | Who can do it |
|---|---|---|
| A deployed preview address, and behaviour on a real Cloudflare account | No Cloudflare credentials here, and `api.cloudflare.com` is blocked by the environment's network policy | Cloudflare account owner (`docs/preview-handoff.md`) |
| Comparison with the production site and source | The live site is blocked, and the source has not been supplied | Grok |
| Safari, Firefox, real devices, screen readers | Only Chromium is available | Accessibility tester |
| External links (58) | No general internet access | After deployment |
