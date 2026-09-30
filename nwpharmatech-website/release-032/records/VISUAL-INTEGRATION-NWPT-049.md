# NWPT-049 Visual integration: Manus web-ready assets (preview candidate)

- **Base:** production `09492775653cda7bca4681b71103ef714eecad36` (deployment `aa482084-5cf2-47e8-b292-e239cd6bda3a`). The Manus handoff's own baseline references were not used.
- **Branch:** `claude/nwpt-visual-integration` (separate from the Science release branch).
- **Status:** preview only. Web Boss owns hosting; production publication follows preview review.
- **Unchanged:** enquiries remain disabled; privacy configuration unchanged.

## Receipt and checksums (27 Sep 2026)

| Item | SHA-256 | Result |
|---|---|---|
| `NWPT-WEB-READY-ASSETS.zip` (23,847,703 bytes) | `7736615d3ffec67d7e7dc2462494332982e6814fbca6639eb936b08e31571477` | Matches `DELIVERY-CHECKSUMS.txt` |
| `NWPT-VISUAL-ASSET-CONTACT-SHEET.pdf` | `6bbca96ff40bccfbd1cfe409928e62e6b10f9fced9648d5e6fb00469c8c8d9a8` | Matches |
| `ASSET-MANIFEST.json` (separate upload and copy inside the zip) | `f396a4ab43ce39b4a592f3721645e737557ffdd50829e06355df46561012b533` | Matches (both copies) |
| `ASSET-MANIFEST.csv` (inside the zip) | `b6db069aed318db1f232c4c6d352e6159b4ffa14b2c88a1ba7cde8b9306c2816` | Matches |
| 66 files listed in the zip's `SHA256SUMS.txt` | — | All 66 verified OK |
| Master archive `NWPT-CLAUDE-GROQ-INTEGRATION-PACK.zip` (`49c7461e…3c51`) | — | **Not received; not verifiable here.** Not needed: only web-ready files are used |
| `NWPharmaTech.md` handoff | — | Identical to `docs/NWPT-ASSET-INTEGRATION-HANDOFF.md` in the zip |

The zip, contact sheet, manifests and handoff documents are **not** in the repository or the deployable site. Only the six selected image files are deployed (checked by `tools/test-visuals.mjs`).

## Deployed files (`site/assets/visuals-049/`, byte-identical to the pack)

| File | SHA-256 |
|---|---|
| `17-uncertainty-map-1600w.webp` | `fa711115d051b8e80154c54df2a1e5159e49a08af67340d417727212ebcabf08` |
| `17-uncertainty-map-640w.webp` | `08502710100c9a0e313b91a2d7bd76db2295f2ab4416eb3e8ef02bbb4e1216b9` |
| `07-synaptic-cleft-observatory-1600w.webp` | `5cdf4b65b033b2dc336ef6dc97dcbf999c2d1c67ed38b503a14748932587b7c9` |
| `07-synaptic-cleft-observatory-640w.webp` | `5304a3a7444f3d6bafbcd48b973bafb14753612200e67a05120757886af97d9e` |
| `01-cbd-thc-molecular-architecture-1600w.webp` | `7ada971c07d89014380c49984f05678b7a1b30295083a5d828414a0320a2ad22` |
| `01-cbd-thc-molecular-architecture-640w.webp` | `837cf68ec15dd13e6f684812d67a14917cf31b204e5da8d23fe11f9218065718` |

## Asset-to-page map: used

New images go only into slots that had no imagery (the Science subpages). No existing image, video, portrait, anchor, citation or page text was replaced.

| Asset | Page and position | Loading | Phone layout | Caption (states the limit) |
|---|---|---|---|---|
| `general-17` Uncertainty Map | `/science/psychiatry`, page hero below the Science sub-navigation | LCP: `loading="eager"`, `fetchpriority="high"` | 3:2 crop on the focal side (`object-position: 78% 50%`) | “Conceptual illustration of open research questions. It is not an anatomical model and does not depict a treatment effect.” |
| `daylight-07` Synaptic Cleft Observatory | `/science/cannabinoids`, “A signalling system already present in the body” (above the Health Canada endocannabinoid text) | lazy | 3:2 crop on the focal side (`80% 50%`) | “Conceptual illustration of signalling between cells. It is not a molecular model and does not show where any compound binds or what it does.” |
| `molecular-01` CBD and Δ9-THC Molecular Architecture | `/science/cbd-thc`, “Two distinct compounds”, between the introduction and the comparison tabs | lazy | Full diagram, uncropped (`object-fit: contain`) | “Same molecular formula. Different three-dimensional architecture. CBD and delta-9-THC drawn from their PubChem records (CID 644019 and 16078): two-dimensional structures with computed three-dimensional shapes. The shapes are illustrations, not receptor-bound poses, and say nothing about effects.” |

- All three use `srcset` with the 640w and 1600w files, have intrinsic `width`/`height` of 1600 × 686 and `decoding="async"`.
- Each has descriptive alt text adapted from the manifest. The labels in the molecular image (C21H30O2, 314.5 g/mol, PubChem CID 644019 and 16078) were read from the image and match the public PubChem identities for CBD and Δ9-THC.
- The captions add no scientific claims. The page text and citations are unchanged; `tools/test-visuals.mjs` compares each page with production after removing the figure.

## Asset-to-page map: left out

| Asset | Reason |
|---|---|
| `ecs-dark-master`, `ecs-white-clean`, `ecs-white-labeled` (ECS masters) | They place THC inside a receptor (“orthosteric region”) and CBD at its edge (“possible allosteric region”). That implies binding sites and docking our pages do not claim, and the drawn molecules are not accurate structures |
| `daylight-09` Two Receptor Horizons | THC and CBD drawn in and beside a receptor: implied docking |
| `molecular-03` CB1 Orthosteric and Allosteric | A binding-site map. Our only receptor source (Laprairie 2015) is checked at abstract level for cell signalling, not for site locations |
| `molecular-04` Activation Versus Modulation | Depicts THC partial agonism and a modified signal with CBD. Partial agonism is not in our cited sources, and the figure reads as a mechanism claim |
| `daylight-06` Molecular Glass Pavilion | Sculptural molecules whose connectivity the manifest says is not exact; `molecular-01` gives accurate structures instead |
| `daylight-10` Formulation Translation Chamber | Inaccurate molecular forms plus a softgel and micelle, implying a product and a delivery route |
| `general-03` Formulation Craft, `general-19` Micellar Lightwell | Softgel and micelle imagery could imply a marketed product, a validated dose or bioavailability. The formulation section already has approved imagery |
| Brain–ECS–CBD cinematic video (`brain-ecs-cinematic`) | Conceptual journey from brain to CBD signalling; implies brain delivery and a mechanism that are not established for NWPT-SM32300 |
| Labeled dynamic ECS video (`ecs-labeled-dynamic`) | Same receptor/THC/CBD labelling as the labelled ECS master (implied binding sites) |
| `general-02` Neural Hero Ultrawide | The route map proposes it for the homepage hero, which would replace the published homepage video. Not done (see proposed replacements) |
| `general-05` Human Research Architecture, `general-20` Northwest Research Observatory | Fictional people with a model and softgels could be read as the NWPT team; the pavilion could be read as a real NWPT facility |
| `general-11` Listening Before Protocol, `general-13` Protocol Under Scrutiny | Fictional people reviewing a protocol could imply that community input or independent review of the study design took place |
| `general-14` Human Data Stewardship | Funding/governance imagery; the funding pages already have approved visuals |
| `general-10` Register Digital Twin | Already on production (`assets/dao/10-register-digital-twin-*`); the new file is the same composition |
| Funding/DAO connected-assembly video (6 files) | Already on production: all six files are byte-identical to `assets/funding-hero/` (SHA-256 compared). No change; the company-rights confirmation noted in the handoff remains Filipp's to confirm |

## Proposed replacements (not implemented; for Filipp's decision)

1. **Evidence library hero:** `general-01` Evidence Ledger Atrium could replace `visuals-037/33-open-evidence-horizon` (same concept, cleaner composition). The alt text and caption would carry over.
2. **Community page:** `general-15` Research Commons in Daylight could replace `dao/13-community-research-commons`. This would need a “fictional people; not an actual event, vote or investment forum” caption.
3. **Homepage:** `general-02` Neural Hero Ultrawide is the pack's proposed homepage primary. **Not recommended:** it would replace the approved homepage video.

## Motion and reduced motion

- No new video is added.
- The existing homepage and Funding videos, their posters, pause controls and reduced-motion behaviour are unchanged; the page files are identical apart from the stylesheet cache key.

## Preservation

- **Unchanged pages:** only the three Science subpages gain a figure. Every other page differs from production only in the stylesheet cache key (`nwpt049` → `nwpt050`). That covers the seven portraits, the homepage video, Science content and citations, anchors, Programme Room share links and briefs.
- **Stylesheet:** `styles.css` gains an appended NWPT-049 block only. `evidence.html` also carries the `module.css` key from the Science generator.

## Checks (27 Sep 2026)

- `tools/test-visuals.mjs`: 64 passed, 0 failed. At 390 × 844 (DPR 3) and 1363 × 936 it covers:
  - only the six selected files deployed;
  - no pack documents in the site;
  - the site otherwise identical to production;
  - on each page: one figure with intrinsic size, alt text, async decoding and a limiting caption;
  - eager loading only for the LCP image, with the others lazy;
  - the image loads, with the phone crop or uncropped diagram as intended;
  - only that page's selected asset requested, and no video requested;
  - CLS 0.0000;
  - no horizontal scroll;
  - axe WCAG 2.2 A/AA clean;
  - no page errors.
- `tools/test-science.mjs`: 106 passed, 0 failed. This covers the Science content, citations, focus and axe checks, and production evidence IDs preserved.
- **Transfer per page** (1600w at DPR ≥ 2): psychiatry 96 KB, cannabinoids 121 KB, CBD and THC 39 KB. A DPR-1 phone receives the 640w files (13–23 KB).
- **Screenshots:** `records/screens-nwpt049/` (desktop 1363 × 936 and phone 390 × 844, one per page).
- **Not tested:** Safari/iPhone, as before.

## Hosting handoff for Web Boss (preview only)

1. Deploy the candidate SHA from `claude/nwpt-visual-integration` to a preview branch (usual method; no environment variables change).
2. Hosted checks:
   - `/science/psychiatry`, `/science/cannabinoids` and `/science/cbd-thc` show one illustration each, with captions;
   - on a phone, the psychiatry and cannabinoids images crop to the right-hand subject, and the molecular diagram is uncropped;
   - no other page looks different.
3. Production publication follows Filipp's review of the preview.

## Follow-up after hosted review (Filipp, 27 Sep 2026)

- **Decision:** all three illustrations and layouts kept. The Evidence library and Community replacements stay unimplemented, and the homepage video stays.
- **One targeted change:** the image's own sentence “Same molecular formula. Different three-dimensional architecture.” now opens the readable HTML caption on `/science/cbd-thc`, because the text inside the image is small on phones. The compound names, PubChem IDs and illustration limit are unchanged. The sentence is set in `tools/build-science.py`, so regeneration keeps it.
- **Unchanged:** no image, layout or other page changed.
- **Checks:** `tools/test-visuals.mjs` now also checks this caption.

