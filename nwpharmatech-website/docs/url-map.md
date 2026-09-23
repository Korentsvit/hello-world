# Old-to-new URL map

## Draft v1 (commit b7ffb4b) to this build

All eleven page URLs are unchanged, so no redirects are needed for them.

| Old URL (draft v1) | New URL | Change |
|---|---|---|
| /index.html | / (and /index.html) | Programme brief added at /#programme-brief |
| /clinical-need.html | /clinical-need.html | — |
| /science.html | /science.html | Study summaries restructured |
| /evidence.html | /evidence.html | Anchors #need, #cbd, #psychosis, #programme-data; refs renumbered |
| /programme.html | /programme.html | New anchor #phase-1 |
| /people.html | /people.html | — |
| /updates.html | /updates.html | — |
| /financing.html | /financing.html | Shortened; detail moved to restricted staging |
| /faq.html | /faq.html | New anchor #urgent-help |
| /contact.html | /contact.html | — |
| /legal.html | /legal.html | — |
| (none) | /downloads/nwpharmatech-programme-brief.pdf | New download |
| (none) | restricted/financing-structure.html, restricted/interest-registration.html | Not public; separate Access-protected project |

Convenience redirects (in `public/_redirects`): /brief, /programme-brief, /study, /phase-2b, /team, /news, /references, /privacy, /accessibility, /invest, /investors.

## Live site to new site: NOT COMPLETED

I couldn't retrieve the URLs of the current live sites (nwpharmatech.org, nwpharmatech.com) or the Micelle site. The network policy blocks those hosts, and the `Korentsvit/nwpt-platform` repository is not accessible from this session.

To finish this map: export the live sitemap, or list the old paths, and add one line per path to `src/redirects.txt` in the form `/old-path  /new-page.html  301`. If an old URL has no equivalent, send it to the closest page.
