# NWPT-051 Science gateway and enlarged-text fixes (preview candidate)

- **Base:** production `af4ab606a16813252fda4bd6c280afaa1f473974` (deployment `1329321b-8006-4761-8c06-e1ad92f5a0e7`).
- **Branch:** `claude/nwpt-science-gateway-051`.
- **Status:** preview only; not deployed. Enquiries remain disabled; privacy configuration and DNS are unchanged.
- **Decision (Filipp, this pass):** the deeper formulation material moves unchanged to a new generated page, `/science/formulation`. No standalone formulation page existed before; `/formulation` redirected to `/science#formulation`.

## 1. `/science` as a concise gateway

**New order on `/science`:**
1. Both learning routes, unchanged (Psychiatry & evidence; Understanding cannabinoids).
2. A short **“Our programme”** introduction, built only from existing sentences. It links to NWPT formulation and the Programme Room.
3. **Evidence library · Glossary · Programme brief.**
4. Further reading (CannabinoidEvidence.org, with its disclosure) and the ongoing-review note, both unchanged.

The page's main text falls from about 1,900 words to about 450 (measured in the test).

**Moved, verbatim, to `/science/formulation`:** everything that followed the routes block on production `/science`.
- The source is `release-032/source/science-formulation.html`, and the test confirms it is byte-identical to the production section.
- `tools/build-science.py` renders it. Relative paths gain `../`. The capsule-to-measurement diagram's `<figure>` gains `id="capsule-diagram"`; no text changes.
- The page has the Science hero and section navigation, and ends with the ongoing-review note.

**Links:**
- `/formulation` now redirects (301) to `/science/formulation`.
- The menu item “NWPT formulation” on all pages, the `/science` and Science-subpage section navigation, and the programme note and formulation-explainer links on the Science subpages all point to the new page.
- Programme Room: the “Science and formulation” explore card, and the source “Science — what is known and what remains open”, which Work with us also uses, now point to `science/formulation.html#investigating`. They are regenerated from `source/*.json`, and the enquiry server copy `functions/api/_lib/wwu-cards.js` is regenerated with them. Only those URLs changed.

**Homepage Science card:** it now reads “Two routes into the science”, describing Psychiatry & evidence and Understanding cannabinoids. The same image and link are used.

### Moved sections and their preserved links

| Production location | Content | Now | Old link behaviour |
|---|---|---|---|
| `/science#chrp-title` | What CHR-P means; Why earlier intervention research matters | `/science/formulation#chrp-title` | forwarded to the same heading; without JavaScript it lands on a link to it |
| `/science#investigating` | The investigational formulation (softgel illustration) | `/science/formulation#investigating` | forwarded; without JavaScript it lands on the “Our programme” introduction on `/science`, which links onward |
| (no id) | The unanswered question (membrane illustration); What is known vs what remains open; NWPharmaTech's role as sponsor | `/science/formulation`, same order | — |
| `/science#formulation`, `#q2-h` | Why investigate a micellar softgel? (evidence rows and citations) | `/science/formulation#formulation`, `#q2-h` | forwarded; without JavaScript `#formulation` lands on the introduction |
| `/science#dg-title`, `#dg-desc`, `#ar` | Capsule-to-measurement diagram (ids inside the SVG, which browsers cannot scroll to) | `/science/formulation#capsule-diagram` | forwarded to the diagram's figure |
| `/science#conceptual-platform` | Conceptual delivery motif (platform image, CNS motion clip) | `/science/formulation#conceptual-platform` | forwarded to the same heading |
| (no id) | Science roadmap (figure and table) | `/science/formulation`, end | — |
| `/formulation` | redirect | `/science/formulation` (301) | — |

Forwarding is done by `science-forward.js` on `/science`: `location.replace` for those ids, including on in-page hash changes.

**Without JavaScript:** every one of the 8 old ids exists on `/science` as a visible element carrying an onward link.
- `#investigating` is the “Our programme” section.
- `#formulation` is its NWPT formulation link.
- `#chrp-title`, `#q2-h`, `#dg-title`/`#dg-desc`/`#ar` and `#conceptual-platform` are entries in a short “On the formulation page” list in that introduction. Each links to the matching section on `/science/formulation` (the diagram entries link to `#capsule-diagram`).

*(Added after review: the first candidate `dc73a5a` covered only `#investigating` and `#formulation` without JavaScript.)*

**Unchanged:**
- all Science URLs, and the ids on the Science subpages;
- the three NWPT-049 illustrations;
- the homepage video, the funding film and the portraits;
- evidence IDs and the citation downloads;
- Programme Room share links and briefs.

## 2. Enlarged text on narrow screens

At 150–200% text these components made phones lay the page out wider than the screen, so readers had to pan sideways. All fixes are phone-width CSS rules; layout at default text size and on desktop is unchanged.

| Where | Cause | Fix |
|---|---|---|
| Shared footer (320 px at 200%) | monospace meta line with long strings | long strings may break |
| Families, Evidence library, `/science/formulation` | evidence-module citations and tags set to `nowrap` | they may wrap on phones (shared component) |
| Homepage people cards | single-column grid sized to its longest word; “Individual capacity” badge `nowrap` | `minmax(0, 1fr)` column; the badge wraps |
| Homepage brief panel, hero heading, study-flow diagram | 1fr column and 7.5rem step minimum sized to their content | `minmax(0, 1fr)` column; no step minimum on phones; long words break as a last resort |
| Open phone menu (320 px at 200%, exposed once pages fit) | side padding in rem doubled with the text | padding capped at its normal 20 px; long words break as a last resort |

The NWPT-050 menu behaviour is unchanged: independent scrolling, the first and last links reachable, keyboard access, and scroll restoration.

## Checks (27 Sep 2026)

**Browser:** Chromium 141.0.7390.37 (Playwright 1.56.1) with mobile emulation, on the Cloudflare Pages runtime. Larger text was emulated through the root font size. This is not browser zoom or the operating-system setting, and no physical devices were tested.

| Test | Result |
|---|---|
| `tools/test-science-gateway.mjs` (new) | The moved section is byte-identical to production and every sentence appears on the new page. Every link, citation, image and video from production `/science` is kept. All 8 old anchors reach the same section, below the header, at 390 and 1363 px. Without JavaScript, all 8 old anchors land on a visible link to the moved content. Also covers: `/formulation` → 301; gateway order; both routes prominent; concise; images load, the video is present and axe is clean on `/science` and `/science/formulation`; the homepage card; Programme Room links; the menu link on every page; and no sideways panning for `/`, `/families`, `/science`, `/science/formulation` and `/evidence` at 320/360/390 px with 150/200% text. **74/74** (after the no-JavaScript fallback links were added). |
| `tools/test-mobile-nav.mjs` (NWPT-050 regression) | **23/23 checks, 1,246 runs.** Production had 24 checks. The “anchored Science destinations land below the header” check runs only for menu links that include a `#`, and the only one (`science.html#investigating`) is now `science/formulation.html`. This run found one issue: the open menu overflowed by 17 px at 320 px with 200% text once pages fit the screen. It was fixed (padding cap) and re-run clean. |
| `tools/test-science.mjs` | 108/108. Anchor checks were updated to the new locations: ids on `/science/formulation`, the fallbacks and the forwarder on `/science`, and `/formulation` → `/science/formulation`. |
| `tools/test-science-phone.mjs` (with `/science/formulation` added) | 8/8 |
| `tools/test-homepage-discoverability.mjs` | 41/41 |
| `tools/test-nwpt034.mjs` (desktop and phone navigation) | 35/35 |
| `tools/test-programme-room.mjs` (share links, brief) | **175/175.** The check “links into science.html” now expects `science/formulation.html`. |
| `tools/test-work-with-us.mjs` (share links, brief generation, enquiry card sources) | 185/185 |

**Screenshots:** `records/screens-nwpt051/`, `before-*` (production `af4ab60`) and `after-*`.

## Not changed (recorded)
- The About (`www.nwpharmatech.org` text) and Team (cards, “Individual capacity” badge) pages also widen at 150–200% text. They are outside this pass; Team also holds the portraits.
