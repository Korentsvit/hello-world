# NWPT-034: hand-off to Web PR (preview deployment)

**Deploy to the existing preview only.** Production and DNS stay unchanged until Filipp approves.

## What to deploy

Use either source below; they are identical.

- **GitHub:** repository `Korentsvit/hello-world`, branch `claude/nwpharmatech-website-bs459b`, commit given in the package README. Deploy the folder `nwpharmatech-website/release-032/site/` exactly as it is.
- **ZIP:** `nwpt-034-public-<commit>.zip`. Deploy its `site/` folder. Its contents are identical to that GitHub folder at the same commit.

```
cd site            # or: cd nwpharmatech-website/release-032/site
npx wrangler pages deploy . --project-name=<the nwpt-837794c-preview project>
```

The folder holds only the public website: HTML, `assets/`, `downloads/`, `resources/`, `functions/api/subscribe.js` (fails closed without provider keys), `_headers` and `_redirects`. It has no source, tooling, restricted material or drafts.

## Verify on the hosted preview, then return the results

1. **Homepage hero, desktop.**
   - A video plays to the right of the headline and loops without a visible jump.
   - The Pause/Play button pauses and resumes it, by mouse and by keyboard (Tab to the button, then Enter).
   - With the OS "reduce motion" setting on, only the still shows and there is no button.
2. **Homepage hero, phone.**
   - The text comes first; a square video panel sits below the buttons.
   - The button works by tap.
   - In iOS Low Power Mode or Data Saver, the still shows.
3. **Navigation.**
   - Every top menu opens by click and by tap (desktop, tablet and phone), and by keyboard (Tab to a menu, then Enter; Escape closes it).
   - Hover is not needed.
4. **Images.** Home, Science, Team, Updates, Funding use, How it works, Governance, Community and DeSci all load their images.
5. **Downloads.** Each of these answers 200 with `application/pdf`:
   - `/downloads/nwpharmatech-programme-brief.pdf`
   - `/downloads/appointment-preparation-sheet.pdf`
   - `/resources/NWPharmaTech-CHRP-programme-brief-v2026-09-22.pdf`
6. **404 and redirects.**
   - `/no-such-page` answers 404 with the "Page not found" page.
   - `/updates/register`, `/financing` and `/clinical-need` each answer 301.
7. **Safari (macOS or iOS).** The hero plays; Safari may choose the MP4 source.

Return:
- the preview URL;
- the Cloudflare deployment ID;
- the deployed commit;
- the access status of the preview (Cloudflare Access on or off);
- any check above that fails.
