# NWPT-044: Funding page hero motion (`/funding-use`)

This is a video-only change on `claude/nwpt-funding-hero`, based on the completed candidate `9dffa1c`. It is for preview review only; production and enquiry configuration are unchanged.

## Route

`/funding-use` (`site/funding-use.html`) is the canonical Funding page; `/funding` and `/financing` 301 to it. Its page hero previously showed the DAO governance still. That still is replaced by the refined film; its files stay in `assets/dao/` and are no longer used on this page.

## What changed

**Assets.** The six supplied web files are in `site/assets/funding-hero/`, unchanged and checksum-verified:
- 21:9 WebM, MP4 and poster (1280×548);
- 4:3 WebM, MP4 and poster (768×576).

The manifest, brief, quality check and review material are in `records/funding-hero/`, outside the site directory.

**Markup (`funding-use.html`).**
- The approved eyebrow, heading, lede, "Last reviewed" line and resources navigation are unchanged.
- The media is a `<picture>` poster: 4:3 at 767px and below, 21:9 above. It is the no-JavaScript, reduced-motion and Save-Data fallback.
- Above the poster is a muted, inline, looping `<video>` with no sources until the script adds them. The film is decorative (`aria-hidden`); the substantive text stays in HTML.
- A visible **Pause/Play** button, keyboard operable, reuses the homepage control's look.
- One new caption for approval: "Conceptual animation. It does not depict real participants, investors, payments or outcomes." It is based on the brief's interpretation limits, and replaces the still's caption.

**Script (`funding-hero.js`, no framework).** It follows the homepage `hero-motion.js` pattern.
- It does nothing with reduced motion, reduced data or Save-Data, and without JavaScript the poster stays. No film is requested in any of these cases.
- It starts after the page load event and requests only the composition for the current width. Crossing 767px swaps it and keeps the play/pause state.
- The Pause/Play choice is remembered on this device (`localStorage` key `nwpt-funding-hero`, as the homepage does).
- It pauses when the hero is off screen or the tab is hidden.

**Layout (`styles.css`): composition over cropping.** The brief's sample CSS used `object-fit: cover`. Instead, the film's box always has the film's own aspect ratio, and the poster and video use `object-fit: contain`, so nothing is cropped or letterboxed.
- **1200px and wider:**
  - The heading sits in the film's protected dark left field, 36% wide with a max of 36rem, behind the first glass form.
  - A quiet veil runs only over that already-dark field.
  - The Pause/Play control sits in the same field, not over the film.
- **768–1199px:** the heading is stacked above the full 21:9 film, with the control on its own row below the film.
- **767px and below:** the heading is above the separately framed 4:3 film, with the control on its own row below.

The stylesheet key is `?v=nwpt044` on every page; the script key is `?v=nwpt044`.

## Checks

**`tools/test-funding-hero.mjs`: 45/45.**
- Only the matching composition is requested: 21:9 at 1363px, 4:3 at 390px. With reduced motion, Save-Data or no JavaScript at both widths, only the matching poster loads, no film is requested and no control shows.
- The film is muted, looping and inline, with a duration of 3.25 s. It plays through three loop boundaries without stopping or stalling.
- Pause/Play works with Enter and Space and updates its label and `aria-pressed`. The choice survives a reload.
- The film pauses off screen and in a hidden tab, and resumes after each.
- Crossing to phone width swaps to 4:3 while playing; crossing back swaps to 21:9 and keeps a pause.
- The film box matches the film's ratio with `contain` at both sizes. At 1200, 1280, 1363, 1440 and 1920px, the copy and control stay in the left 37% and inside the frame.
- **Contrast** was measured from the brightest 2% of film pixels behind each text line, over three frames (0.05, 1.1 and 2.2 s):

  | Text | Contrast | Needed |
  |---|---|---|
  | Eyebrow | 13.8:1 | 4.5:1 |
  | Heading | 20.4:1 | 3:1 |
  | Lede | 15.7:1 | 4.5:1 |
  | "Last reviewed" | 12.2:1 | 4.5:1 |

- Automated axe checks against WCAG 2.2 A/AA rules pass at both widths. The approved heading and navigation are unchanged.
- The homepage brain video still plays. The Science video is present and served. Neither page requests the funding film.

**Regression:**
- `check-pages.mjs`: 186/186 on `/funding-use`, `/`, `/science`, `/how-it-works`, `/programme-room` and `/work-with-us`.
- `test-nwpt034.mjs` (homepage video, menu, PDFs, redirects): 35/35.
- `test-programme-room.mjs`: 175/175.
- `test-work-with-us.mjs`: 172/172.
- `test-deploy-layout.mjs`: 4/4.

## Evidence

`records/screens-nwpt044/`:
- before and after screenshots at 1363×936, 1024×768 and 390×844;
- reduced-motion poster fallbacks at desktop and phone;
- playback recordings `playback-desktop-1363x936.mp4` and `playback-phone-390x844.mp4`, each about 10.7 s, three loops, recorded in headless Chromium.
