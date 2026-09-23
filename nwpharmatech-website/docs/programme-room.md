# Programme Room: not in this package

**Status (23 September 2026): not supplied.** The interactive Programme Room component was not built in this workspace, and it could not be found anywhere this session can reach. The following were checked:

- this repository;
- the shared Google Drive and Gmail (searches for "Programme Room", "Program Room" and "programme-room");
- the account's published Claude artifacts. The two artifacts there are "NWPT Platform Back End" and "Interaction Records for Approval". Neither is the Programme Room.

If it was built in another workspace, attach it from there. It may be in the `nwpt-platform` repository, which this session is not authorised to read.

**The study hub is not the Programme Room.** `/study` (module `study-hub` in `integration/`) is a static page: summary, public synopsis, milestones, registrations, sponsor and oversight. It has no interactive component and no risk chart. Nothing in this package should be described as delivering the Programme Room.

## When the component is supplied

To be accepted alongside these modules, it should:

1. **Use one consistently labelled risk series.** The only transition-risk series prepared here is `content/graphics.json` → `transition`: cumulative transition risk at 6, 12, 24, 36 and 48 months, pooled meta-analytic estimates with 95% confidence intervals, from Salazar de Pablo et al., *JAMA Psychiatry* 2021.
   - Every label, axis, legend, tooltip and data table must name that measure in the same words.
   - Kaplan–Meier estimates must not be mixed into the same series.
   - The series is **unpublished**: its values are verified only against search summaries. `verification_needed` in that file says exactly what must be checked against the paper before any version of it is shown publicly.
2. **Work under the site's Content Security Policy** (`script-src 'self'`, `style-src 'self'`, `connect-src 'self'`, no `unsafe-inline` or `unsafe-eval`). That means:
   - self-hosted scripts, styles and fonts only;
   - no inline `<script>`, `style` attributes or event-handler attributes;
   - no CDN requests;
   - no runtime fetches to other origins.
3. **Package like the other modules** (see `docs/integration.md`):
   - a fragment wrapped in `.nwpt-module`, with `nwpt-`-prefixed classes and scoped CSS;
   - a manifest listing the facts and sources it uses;
   - an accessible data-table alternative to the chart;
   - a reduced-motion behaviour.
