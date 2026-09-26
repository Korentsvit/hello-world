# NWPT-034 website improvement release: change list

26 September 2026. Built on NWPT-033 (`837794c`), which is itself the production source NWPT-032 plus the reconciliation. The source is `release-032/site/`. "Before" screenshots are production NWPT-032, the live site; "after" is this release, at identical widths (1280 and 390 px) and capture settings.

## Status

| | State |
|---|---|
| Built | NWPT-034 on GitHub `Korentsvit/hello-world`, branch `claude/nwpharmatech-website-bs459b` (final commit in the package README) |
| On preview | NWPT-033 (`837794c`) at https://nwpt-837794c-preview.pages.dev/, as reported by Web PR and Codex. I cannot reach the preview from this environment, so I have not verified it myself |
| Live | NWPT-032 at www.nwpharmatech.org, unchanged |

## Changes

### Homepage
- **Hero video.**
  - **File used:** `nwpt-brain-ecs-hero-21x9.webm`, 1280×548, 12 s, SHA-256 `4d9317519657ddd9e0e1…`.
  - **Clip content:** brain, then neural tissue, then cell-membrane receptors with a small molecule nearby, then back to the brain.
  - **Loop:** the file jumped back visibly when it looped, so it is re-cut as a seamless 11 s loop (the last second cross-fades into the first).
  - **Desktop:** 1280×548 in WebM (1.6 MB) and MP4 (1.8 MB). It plays in a feathered 4:3 window to the right of the text, over a solid veil; the background still dims while it plays.
  - **Phones:** a 540 px square crop in WebM (0.8 MB) and MP4 (0.9 MB), shown in a panel below the buttons, never behind the text.
  - **Behaviour:** muted, inline and looping. It is fetched only after the page has loaded. A visible Pause/Play button works by keyboard, and the choice is remembered on the device. Playback pauses when the hero is off screen or the tab is hidden.
  - **Fallback:** the existing neural still, Manus 01, stays as the immediate image and the fallback. It is the only image shown with reduced motion, Save-Data or reduced-data preferences; no video is fetched in those cases.
  - **Caption:** "conceptual … not evidence of a mechanism, of brain delivery or of clinical benefit".
- **Programme-brief panel.** Uses the first page of the PDF as a cover, with *Read the brief* and *Download PDF* buttons (version 2026-09-22, 2 pages, 5 KB).
- **Three illustrated routes:**
  - **Clinical need:** pooled one-in-four estimate, most do not transition, NICE position.
  - **Science:** investigational formulation; effectiveness not established.
  - **Proposed study:** aims; planned, not recruiting; prevention not the primary aim.
  - All copy is taken from existing approved text.
- **Updates cards.** Now image-led, each with its type (Programme news or Explainer) and original publication date.

### Updates
- **Sections:**
  - **Programme news:** the Phase 2B overview (21 September 2026) and the DeSci financing note (20 September 2026).
  - **Documented milestones:** five dated records from Study progress, running from Phase 1 consent (27 August 2025) to analysis outputs delivered (30 March 2026). It adds that no funding milestones have been published.
  - **Explainers:** evergreen pieces.
- **Dates:** every card keeps its original publication date. No new announcements were written.
- **Menu:** the Updates menu on every page links to Programme news, Milestones and Explainers.
- **Email signup:** it is not live end to end (the provider credentials are absent and no live test has been recorded). All public "coming soon" text is removed from Updates, Contact, FAQ, Community, How it works, Privacy and DeSci. `/updates/register` redirects to `/updates/`.

### Team
- No authorised portraits exist, so the initials remain. Nothing was generated or substituted.
- `tools/add-portraits.mjs` publishes whichever authorised files are placed in `assets/team/`. It makes consistent square crops and updates the Team cards and the homepage leadership cards; people without a file keep their initials.

### Visual integration
- **Programme page:** the pipeline and research-network figures now sit beside "What must happen next?" and "Collaboration context", instead of being full-width image-only sections.
- **Updates:** the horizon figure sits beside the milestones.
- **Kept:** all NWPT-032 assets and the NWPT-033 additions.

### Navigation
- **The bug (live on NWPT-032):** at desktop and tablet widths, focusing a menu button opened its dropdown, and the click, tap or Enter that followed closed it again. The menus therefore worked only by hover.
- **The fix:** focus no longer opens a menu. Click, tap and Enter/Space open and close it; Escape closes it and returns focus; hover is still a convenience.
- **Programme brief:** reachable from the header, the phone menu, the hero and the homepage panel.

## Checks (final, on the packaged files)

| Check | Result |
|---|---|
| `release-check.mjs --stub-external` (Cloudflare Pages runtime; 30 pages at 390 and 1280 px) | **4,520 / 4,520**: routing 1,857 · links 2,289 · downloads 10 · contact 15 · layout 58 · images 117 · pages 87 · accessibility (axe WCAG 2.2 AA) 58 · navigation 29 |
| `test-nwpt034.mjs` | **33 / 33** |
| NWPT-032 baseline, same checker | 4,133 / 4,195 |

**What `test-nwpt034.mjs` covers:**
- menus by keyboard and by touch at 1180 and 390 px;
- the programme brief at both widths;
- the hero video: plays, pauses, resumes by keyboard, and the choice is remembered;
- reduced motion and Save-Data fetch no video;
- the video is requested only after the load event;
- the phone-only still loads at 390 px;
- a genuine 404, the PDFs, and the register redirect.

**Image rule:** every rendered image must load. The checker skips only an image the site itself sets to `display: none` at that width, and lists it in the report. There was one: the phone-only neural still at 1280 px, which is tested at 390 px instead.

**Limits:** these are automated checks, not a WCAG audit. Only Chromium is available here, so Safari, the MP4 fallback and real devices are for Web PR to confirm on the preview.

## Outstanding
- **Portraits (0 of 8).** Exact files, to save in `assets/team/`:

  | Person | File |
  |---|---|
  | Filipp Korentsvit | `filipp-korentsvit.jpg` |
  | Daud Gutseriev | `daud-gutseriev.jpg` |
  | Dr Grace Blest-Hopley | `grace-blest-hopley.jpg` |
  | Professor Scott Woods | `scott-woods.jpg` |
  | Dr John Kane | `john-kane.jpg` |
  | Prof. Richard Barker | `richard-barker.jpg` |
  | Prof. Trevor Jones | `trevor-jones.jpg` |
  | Gillian Cannon | `gillian-cannon.jpg` |

  Each needs an authorisation record.
- **Correction to NWPT-033.** All three supplied video files (the WebM, the MP4 and production's `cns-motion-1280.webm`) are the same clip. I said last round that the MP4 was a different clip; my frame check then had failed to seek.
- **The same clip twice.** The homepage hero and Science's "Conceptual delivery motif" now show the same clip. The Science placement is an NWPT-032 asset and was kept. Decide whether Science should show its still instead.
- **Open factual items carried over from NWPT-033:** sponsor wording, the two programme briefs, the Phase 2B design source, and ~US$10m authorisation.
- **Programme Room:** a separate handoff.
- **Access on the preview:** Cloudflare Access is not set by me. Web PR should state the preview's access status.
