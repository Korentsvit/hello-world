# NWPT-052 Endocannabinoid-system animation on `/science/cannabinoids` (preview candidate)

- **Base:** production `cfee45bdbe80701f98230dced8ec9953988d9ffb` (deployment `c5086d53-0cd3-47a0-80bf-f87808e29de3`).
- **Branch:** `claude/nwpt-ecs-video-052`.
- **Status:** preview only; not deployed. Enquiries remain disabled; privacy configuration and DNS are unchanged.
- **Label status:** **not corrected.** The labels are baked into the video and poster. The page shows a visible “Preview only” note, and a correction request for Manus is below. **This candidate is not for publication until a corrected render replaces the three files.**

## Files used (from `NWPT-WEB-READY-ASSETS.zip`, byte-identical, SHA-256 checked against the pack's `SHA256SUMS`)

| Site path | SHA-256 |
|---|---|
| `assets/ecs-video/NWPT-dynamic-ECS-hero-labeled-web.webm` (primary; 1280×720, 6 s, VP9, no audio) | `bf5ef91dcee7da48ed3ad0bd0495ce6fd930d0a7d7f89b4416fa6d3df11ff3be` |
| `assets/ecs-video/NWPT-dynamic-ECS-hero-labeled-web.mp4` (fallback) | `82497d2d6bdef606e3393b46b5f5a02d7577534186260c0e3de06aad1a690ef9` |
| `assets/ecs-video/NWPT-dynamic-ECS-hero-labeled-poster.webp` (poster, 1280×720) | `fbae218044367dc7367a37906ad4e95548e6449bf77fe9ee1956108a795128f9` |

No other file from the pack was added. **Complementary still:** none added. The candidates, `NWPT-endocannabinoid-system-master-white-labeled` and `…-clean`, draw THC inside a receptor and CBD docked at its edge, the same issue as the video. The existing Synaptic Cleft illustration (`07-synaptic-cleft-observatory`) stays in place further down the page. It shows signalling between cells, which complements the component view rather than repeating it; no removal is proposed.

## Placement and behaviour

- The animation sits in the page hero, directly below the introduction and the Science section navigation, as a full-width 16:9 figure with `object-fit: contain`, so no labels are cropped on phones or desktop.
- The poster is always in the page, with its width and height set and its aspect ratio reserved (no layout shift). The video is layered over it.
- `ecs-video.js` adds the WebM, then the MP4 source, only after the page has loaded, and only if reduced motion, reduced data and Save-Data are all off.
  - With reduced motion, reduced data, Save-Data or no JavaScript, visitors see the poster only, and no video is requested.
- The video is muted, has no audio track, plays inline and loops. It pauses while it is off screen or the tab is hidden.
- A visible Pause/Play button (`aria-pressed`) sits under the figure; the visitor's choice is remembered on that device.
- **Caption:** “Conceptual illustration of endocannabinoid-system components. It is not a molecular model and does not show a demonstrated mechanism of NWPT-SM32300.”
- **“What the labels show”** is an HTML list that explains each label: CB1/CB2 and AEA + 2-AG cite Health Canada 2018, and Δ9-THC and CBD cite Laprairie et al. 2015. It ends: “Where each molecule appears in the animation is illustrative, not a binding site.” These citations are existing evidence IDs; no new claims were added.
- **Unchanged:** the homepage hero, funding film, formulation clip, portraits, scientific claims, citations and navigation. Apart from `science/cannabinoids.html`, every page differs only in its `styles.css?v=` cache key (`nwpt052`→`nwpt053`).

## Label review (all frames, 0–6 s)

- The baked-in labels are “CB1 receptor”, “CB2 receptor”, “AEA + 2-AG / endogenous messengers”, “Δ9-THC / central region” and “CBD / peripheral region”.
- The sub-labels “central region” and “peripheral region” read as binding positions.
- The artwork itself also implies binding:
  - THC (orange) is drawn inside the CB1 helix bundle;
  - an orange molecule is drawn inside CB2 (about 3 s);
  - CBD (teal) is docked at CB1's outer edge.
- A disclaimer should not carry this correction, so the animation needs re-rendering.

**Correction request for Manus:**
> Please re-render NWPT-dynamic-ECS-hero-labeled (web WebM, MP4 and poster; same 1280×720, 6 s, silent) with the “central region” and “peripheral region” sub-labels removed from the Δ9-THC and CBD boxes. Show THC and CBD as free molecules in the space between the membranes, away from the CB1 and CB2 receptor bundles: no molecule drawn inside or docked at any receptor, including the orange molecule inside CB2 at about 3 s. Keep the CB1, CB2 and AEA + 2-AG labels, all label boxes, positions, camera motion and colours otherwise unchanged.

When the corrected files arrive:
1. Replace the three files (same names).
2. Set `ECS_LABELS_CORRECTED = True` in `tools/build-science.py`; this removes the preview note.
3. Re-run the generator and `tools/test-ecs-video.mjs`.

## Checks (27 Sep 2026)

**Setup:** Chromium 141.0.7390.37 (Playwright 1.56.1) on the Cloudflare Pages runtime, with mobile emulation. No physical devices were tested; Safari/iPhone remains untested.

| Test | Result |
|---|---|
| `tools/test-ecs-video.mjs` (new) | **50/50** |
| `tools/test-science.mjs` (regression) | **108/108** |

`test-ecs-video.mjs` checks:
- **Isolation:** only the expected files changed versus `cfee45b`.
- **At 390×844, 1363×936 and 844×390:**
  - placement after the Science navigation, with the Synaptic Cleft kept;
  - 16:9 composition, uncropped and within the screen;
  - the poster's reserved size and alt text;
  - WebM plays silently and loops, and only the WebM is downloaded;
  - no playback while off screen;
  - keyboard Pause and Play;
  - the caption, the label explanation with citations, and the preview note;
  - CLS < 0.01 and no horizontal scroll;
  - axe WCAG 2.2 A/AA clean, and no page errors.
- **Reduced motion:** poster only, no video requests, and the button hidden.
- **No JavaScript:** poster and explanation shown, no video requests.
- **200% text at 390 px:** fits the screen and is axe clean.

**Evidence:** `records/screens-nwpt052/` holds desktop (1363×936) and phone (390×844) screenshots, a reduced-motion poster screenshot, and `recording-ecs-video-play-pause-resume.webm` (playback, then Pause, then Play).
