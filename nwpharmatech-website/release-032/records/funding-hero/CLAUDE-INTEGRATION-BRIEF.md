# Claude Integration Brief — Refined NWPharmaTech Funding/DAO Hero

## Selected direction

This delivery refines the user-selected `nwpt-collective-funding-hero-21x9.webm`. It supersedes the unrelated glass-architecture redesign brief.

Only the original connected-assembly scene is used. The apparatus, capsule, and capsule-to-brain portions are excluded. No new scene, person, coin, logo, text, or biological image has been introduced.

## Final edit

- **Source interval:** 0.0–4.0 seconds of the selected original.
- **Final loop:** 3.25 seconds at 24 fps.
- **Loop construction:** gradual 0.8-second forward light-release blend over camera-aligned glass geometry.
- **Retiming:** none.
- **Audio:** none.
- **Finishing:** subtle deflicker, temporal denoise, glass-edge refinement, restrained contrast and saturation correction, camera-path alignment, and protected navy gradients.
- **Meaning:** independent participants remain visibly distinct while connections gather around a shared purpose.

The shorter duration is intentional. It preserves the original energy rather than stretching approximately four usable seconds into an empty sequence.

## Website files

| File | Dimensions | Codec | Duration | Size |
|---|---:|---|---:|---:|
| `nwpt-collective-funding-hero-refined-21x9.webm` | 1280 × 548 | VP9 | 3.25 s | 1.142 MB |
| `nwpt-collective-funding-hero-refined-21x9.mp4` | 1280 × 548 | H.264 | 3.25 s | 1.278 MB |
| `nwpt-collective-funding-hero-refined-4x3.webm` | 768 × 576 | VP9 | 3.25 s | 0.488 MB |
| `nwpt-collective-funding-hero-refined-4x3.mp4` | 768 × 576 | H.264 | 3.25 s | 0.861 MB |
| `nwpt-collective-funding-hero-refined-21x9-poster.webp` | 1280 × 548 | WebP | — | 84 KB |
| `nwpt-collective-funding-hero-refined-4x3-poster.webp` | 768 × 576 | WebP | — | 66 KB |

## Editing master

`nwpt-collective-funding-hero-refined-master-prores.mov` is a 1280 × 548 ProRes 422 HQ master at 24 fps. It is derived directly from the new refined edit and has not been upscaled.

## Responsive placement

### Desktop

Use the 21:9 film as the Funding/DAO hero media layer. The left approximately 42% stays dark and quiet throughout. Place the HTML headline and calls to action within that field. Do not mirror, horizontally reposition, or centre-crop the video; those changes would move the assembly into the copy area.

Recommended overlay headline demonstrated in the review preview:

> Many contributions.  
> Shared research purpose.

The headline is not embedded in any delivered website asset.

### Phone

Use the separately framed 4:3 file in a media panel below the headline. It removes most of the desktop copy void and keeps the connected assembly and its relationships intact. Do not substitute a centre crop of the desktop file.

Use `aspect-ratio: 4 / 3` and avoid `object-fit: cover`, which could remove edge contributors. `object-fit: contain` is safe.

## React behavior

Render only one composition at a time so the browser does not download both media sets.

```tsx
const isMobile = useMediaQuery('(max-width: 767px)');
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

const asset = isMobile
  ? {
      webm: '/static/video/nwpt-collective-funding-hero-refined-4x3.webm',
      mp4: '/static/video/nwpt-collective-funding-hero-refined-4x3.mp4',
      poster: '/static/video/nwpt-collective-funding-hero-refined-4x3-poster.webp',
      width: 768,
      height: 576,
    }
  : {
      webm: '/static/video/nwpt-collective-funding-hero-refined-21x9.webm',
      mp4: '/static/video/nwpt-collective-funding-hero-refined-21x9.mp4',
      poster: '/static/video/nwpt-collective-funding-hero-refined-21x9-poster.webp',
      width: 1280,
      height: 548,
    };

return reducedMotion ? (
  <img
    src={asset.poster}
    width={asset.width}
    height={asset.height}
    alt=""
    aria-hidden="true"
  />
) : (
  <video
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    poster={asset.poster}
    width={asset.width}
    height={asset.height}
    aria-hidden="true"
  >
    <source src={asset.webm} type="video/webm" />
    <source src={asset.mp4} type="video/mp4" />
  </video>
);
```

## Playback and accessibility

- Use `autoplay`, `muted`, `loop`, and `playsInline`.
- Do not add audio.
- Do not add a JavaScript crossfade, reverse segment, or delayed restart; the seamless cycle is already inside the file.
- Pause when the document is hidden or the hero is well outside the viewport.
- Provide a visible pause/play control for WCAG-friendly motion control.
- For `prefers-reduced-motion: reduce`, render the matching WebP poster and do not request the video.
- Treat the media as decorative with `aria-hidden="true"`; communicate any substantive funding language in real HTML.

## CSS guidance

```css
.funding-hero {
  position: relative;
  overflow: hidden;
  background: #020712;
}

.funding-hero__media {
  display: block;
  width: 100%;
  height: auto;
}

@media (min-width: 768px) {
  .funding-hero__media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .funding-hero__copy {
    position: relative;
    z-index: 1;
    width: min(40%, 35rem);
    padding: clamp(4rem, 8vw, 8rem) 0 clamp(4rem, 8vw, 8rem) clamp(1.5rem, 6vw, 6rem);
  }
}

@media (max-width: 767px) {
  .funding-hero__copy {
    padding: 2.5rem 1.25rem 1.5rem;
  }

  .funding-hero__media {
    aspect-ratio: 4 / 3;
    object-fit: contain;
  }
}
```

## Interpretation boundaries

The connected forms are an artistic metaphor. Do not label individual forms as investors, token holders, patients, clinicians, DAO voters, or real institutions. Do not describe the turquoise lines as payment rails, guaranteed capital flow, clinical control, or proof that financing produces a medicine or outcome.

## Review evidence

The review package contains:

- Desktop three-loop playback
- Mobile three-loop playback
- Opening, midpoint, and final-frame comparison
- Desktop and phone composition preview
- Temporary headline-overlay video and still
- Machine-readable final QC results

The website files remain completely clean and contain no text overlays.
