# Change log: module handoff for the Grok team

Date: 24 September 2026. Base: correction release `d7be151`. Scope set by management on 24 September 2026: the Grok
team leads the live website; this work supplies six additive modules for it to integrate. No homepage, navigation,
Team page or competing design is delivered, and nothing is deployed.

## Theme tokens (matching the live site)
- `module.css` no longer carries the staging design. Every colour, font and size is an optional `--nwpt-theme-*`
  custom property, with the default written inline (`buildlib/export.py`, `THEME_TOKENS`).
- Unset, a module inherits the live page's font family, font size, line height, text and heading colour; its
  background is transparent; it spans the live column with no gutter or maximum width of its own. Brand blues remain
  the defaults only for links, evidence labels, lines and the focus ring.
- `--nwpt-theme-space` multiplies every margin, padding and gap; `gutter` and `h1-size` to `h3-size` are separate.
- New `integration/theme/nwpt-theme.css` lists every token with its default. Previews use a plain stand-in host
  (`theme/preview-host.css`) instead of staging styling.
- Tests: unthemed inheritance, an example theme (fonts, colours, spacing halved) and axe under that theme, for all
  six modules.

## Mapping and scope
- New `integration/MAPPING.md`: for each module, what it adds, where it belongs, which live content it overlaps, its
  files and dependencies, and the source checks still open (generated from the manifests; the descriptive part is in
  `src/integration-mapping.json`).
- README and `docs/integration.md` state the scope. The Programme Room is named once, as a separately supplied
  component that no module depends on.
- `study-hub` is titled "Study progress".

## Clinical design
- The live site's published proposed CHR-P design could not be read (the environment's egress proxy blocks the
  site). `CLINICAL-DESIGN-CHECK.md` sets out what each module says about Phase 2B and its basis, and what was
  deliberately not taken from schizophrenia studies.
- The study page's "Proposed design" heading and its "Population and aims" card are removed. The synopsis already gives
  population and aims, and the module no longer presents an incomplete account as the design.
- Each manifest now has `clinical_design` (the module's Phase 2B statements; `replaces_live_design: false`). Each
  module with Phase 2B statements carries a publication blocker until they are compared with the live design.
- Evidence library, CANTOP-RCT card (another sponsor's planned CHR-P trial): product "CBD 600 mg/day vs placebo for 6
  months (planned)" → "(planned; not NWPT-SM32300)"; limitations add "and not the NWPharmaTech Phase 2B study".

## Leadership (for the Grok team's Team page; no module shows people)
- The confirmation-date cutoff is removed. A management instruction or confirmation confirms the title it names,
  whatever its date; an instruction that predates a build needs no fresh approval.
- Scott Woods: "CHR-P lead", "Leads the CHR-P programme.", confirmed by the management instructions "Scott Woods leads
  CHR-P." (24 Sep 2026) and "Make Scott Woods's CHR-P role prominent." (round 3). `leadership-reconciliation.md`
  updated.

## Not changed
Module content apart from the items above, routes, redirects, CSP, downloads and PDFs (their content did not change).
