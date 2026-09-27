# NWPT-052 Endocannabinoid-system animation on `/science/cannabinoids` (preview candidate)

- **Base:** production `cfee45bdbe80701f98230dced8ec9953988d9ffb` (deployment `c5086d53-0cd3-47a0-80bf-f87808e29de3`).
- **Branch:** `claude/nwpt-ecs-video-052`.
- **Status:** preview only; not deployed. Enquiries remain disabled; privacy configuration and DNS are unchanged.
- **Label status:** **corrected** (Manus `NWPT-dynamic-ECS-hero-labeled-CORRECTED-v2.zip`). The preview-only note is removed. See “Correction rounds” below.
- **Candidates:** `c4a66d0540df5786d2fd1a53754cd970b3c05080` (placement preview with the draft animation; kept frozen), and the corrected-media candidate committed on top of it.
- **Publication:** on hold until the corrected preview is reviewed.

## Files used

**Current (corrected, Manus `NWPT-dynamic-ECS-hero-labeled-CORRECTED-v2.zip`, ZIP SHA-256 `a5ee37acfd8c95485f20ffde608a873c4a65a9a78bb2e47474fc37edc238df58`; files byte-identical and checked against its `SHA256SUMS.txt`).** They are published under versioned names, so no browser or CDN cache can keep serving the draft artwork, including the poster.

| Site path | Delivered as | SHA-256 |
|---|---|---|
| `assets/ecs-video/NWPT-dynamic-ECS-hero-labeled-v2-web.webm` (primary; 1280×720, 6 s, 24 fps, VP9, no audio track) | `NWPT-dynamic-ECS-hero-labeled-CORRECTED-v2.webm` | `58f10185b8d5e71ac39aa76d63afd411f1eb1df75c85d1654fafeb6f41b27d98` |
| `assets/ecs-video/NWPT-dynamic-ECS-hero-labeled-v2-web.mp4` (fallback; 1280×720, 6 s, 24 fps, H.264, no audio track) | `NWPT-dynamic-ECS-hero-labeled-CORRECTED-v2.mp4` | `2d62c8c6dba7d3f8d3cfc23400818204782f99cb1f5ce0cd90979823f6993950` |
| `assets/ecs-video/NWPT-dynamic-ECS-hero-labeled-v2-poster.webp` (1280×720; the first frame of the animation) | `NWPT-dynamic-ECS-hero-labeled-CORRECTED-v2-poster.webp` | `9a600d1e99898c4d2e0f0ce44716e53e25a0e63c7d3b5656f13e2ed80717b26f` |

**Removed** (the draft from `NWPT-WEB-READY-ASSETS.zip`, used in `c4a66d0`):
- `NWPT-dynamic-ECS-hero-labeled-web.webm` (`bf5ef91d…`)
- `NWPT-dynamic-ECS-hero-labeled-web.mp4` (`82497d2d…`)
- `NWPT-dynamic-ECS-hero-labeled-poster.webp` (`fbae2180…`)

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

## Label review of the draft (all frames, 0–6 s; historical)

- The baked-in labels are “CB1 receptor”, “CB2 receptor”, “AEA + 2-AG / endogenous messengers”, “Δ9-THC / central region” and “CBD / peripheral region”.
- The sub-labels “central region” and “peripheral region” read as binding positions.
- The artwork itself also implies binding:
  - THC (orange) is drawn inside the CB1 helix bundle;
  - an orange molecule is drawn inside CB2 (about 3 s);
  - CBD (teal) is docked at CB1's outer edge.
- A disclaimer should not carry this correction, so the animation needs re-rendering.

**Correction request for Manus:**
> Please re-render NWPT-dynamic-ECS-hero-labeled (web WebM, MP4 and poster; same 1280×720, 6 s, silent) with the “central region” and “peripheral region” sub-labels removed from the Δ9-THC and CBD boxes. Show THC and CBD as free molecules in the space between the membranes, away from the CB1 and CB2 receptor bundles: no molecule drawn inside or docked at any receptor, including the orange molecule inside CB2 at about 3 s. Keep the CB1, CB2 and AEA + 2-AG labels, all label boxes, positions, camera motion and colours otherwise unchanged.

**Done in the corrected candidate:**
- The three files are replaced under versioned `-v2-` names; `ECS_BASE` in `tools/build-science.py` points to them.
- `ECS_LABELS_CORRECTED = True` removes the preview note.
- Only `/science/cannabinoids` was regenerated.
- `tools/test-ecs-video.mjs` was re-run.

## Correction rounds

| Round | Delivery | Result |
|---|---|---|
| Draft | `NWPT-WEB-READY-ASSETS.zip` | Placement shown with a “Preview only” note (`c4a66d0`). |
| 1 | `NWPT-dynamic-ECS-hero-labeled-CORRECTED.zip` (`724b4dd3…`) | **Rejected**, not used. See below. |
| 2 | `NWPT-dynamic-ECS-hero-labeled-CORRECTED-v2.zip` (`a5ee37ac…`) | **Accepted**. Media replaced and the note removed. |

**Round 1 was rejected because:**
- The sub-labels had been removed, and the orange molecule inside CB2 was gone.
- But:
  - the CB2 pointer landed on the messenger molecules or on empty space (about 0.8–1.6 s and 4.2–5.2 s);
  - grey retouching patches remained inside CB1 and CB2, and teal fragments were still visible at CB2's base (about 1.6–4.2 s);
  - CBD overlapped CB1's outer helix at the start and end of the loop, and in the poster;
  - the AEA + 2-AG pointer ended between the two molecules.

**Round 2 review.** Every 0.2 s of both the WebM and the MP4, the poster, and full-size close-ups of both receptors were checked:
- The component names are unchanged: CB1 receptor, CB2 receptor, AEA + 2-AG / endogenous messengers, Δ9-THC and CBD. There are no “central region”/“peripheral region” sub-labels.
- CB1 and CB2 are clean, empty helix bundles in every frame, with no retouching patches and no molecule or fragment inside or at a receptor. The orange molecule previously inside CB2 is absent throughout.
- THC and CBD are free molecules, clear of both receptors throughout the loop and in the poster.
- Every pointer lands on its target in every frame:
  - CB1 and CB2 on their bundles;
  - Δ9-THC and CBD on their molecules;
  - AEA + 2-AG has one leader to each messenger.
- The camera is now nearly static, with slight drift.
- The poster matches the first frame (PSNR 46.5 dB). The MP4 matches the WebM in every sampled frame (PSNR ≥ 38 dB; encoding differences only).

## Checks (27 Sep 2026)

**Setup:** Chromium 141.0.7390.37 (Playwright 1.56.1) on the Cloudflare Pages runtime, with mobile emulation. No physical devices were tested; Safari/iPhone remains untested.

| Test | Result |
|---|---|
| `tools/test-ecs-video.mjs` (new) | **50/50** on `c4a66d0` (draft media); **52/52** with the corrected media. The corrected run replaces the preview-note check with a no-note check and adds checks that the media are byte-identical to the v2 delivery and that the page references only the versioned v2 files. |
| `tools/test-science.mjs` (regression) | **108/108** on `c4a66d0`. Not re-run for the media swap, which changed only this page's three media paths and the note. |

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

**Evidence:** `records/screens-nwpt052-v2/` (corrected media: same set of screenshots and recording) and `records/screens-nwpt052/` (draft) holds desktop (1363×936) and phone (390×844) screenshots, a reduced-motion poster screenshot, and `recording-ecs-video-play-pause-resume.webm` (playback, then Pause, then Play).
