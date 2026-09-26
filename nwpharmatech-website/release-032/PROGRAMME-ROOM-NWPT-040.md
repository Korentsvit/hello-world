# NWPT-040: Programme Room experience upgrade

This is a separate commit on `claude/nwpt-programme-room`, after `06f3a2f`. Production is unchanged. Grok deploys previews.

## Changes

1. **Explorer on the first screen.** The large introductory figure is gone. A compact introduction is followed directly by the explorer.
   - At 1363×936, the first stage control now starts at **486 px** (was 1,652 px).
   - At 390×844, it starts at **644 px** (was 2,357 px).
2. **"Explore the programme"** replaces "Study timeline". The introduction says these are research topics and development stages, not a schedule. Dated milestones now sit in their own table under "Where are we now?". There are six rows, taken from Study progress, and no dates remain inside the explorer panels.
3. **Two separate label sets.** A "What the labels mean" key under the stage strip defines both.
   - **Work status**, per stage: Background, Completed, In progress (reported), Proposed, Open question. Each stage gives its dated note, such as "Reported as in progress on 23 February 2026".
   - **Source type**, per source: Published research, Published guidance, Registry information, Company records.
   - **Approval wording.** No approval status is inferred. The room now uses the Study page's approved wording: "It can start only after regulatory and research ethics approval." It no longer says "approvals not confirmed in public materials" or "before any approvals are sought". The published programme brief still contains the older phrase and is unchanged.
4. **Three opening shortcuts.**
   - "Where are we now?" goes to `#now`.
   - "What has been studied?" goes to `#stage-phase-1`.
   - "What would Phase 2B investigate?" goes to `#stage-phase-2b`.

   Each shortcut moves focus to its target and creates a history entry, so Back returns to the previous topic. Following the current topic's link again still works.
5. **Consistent panels.** Every panel has the same sections:
   - The question.
   - What is known.
   - What further research would establish.
   - A "Work status / Sources used" summary at the top.

   Material limitations and approved scientific wording are kept.
6. **Open questions are links.** Each opens the relevant stage and its "What supports this?" disclosure (`#stage-…-sources`), with focus on the disclosure. Deep links to a disclosure also work on page load.
   - **Link to each topic.** Each panel has a plain "Link to this topic" anchor. With JavaScript it becomes a "Copy link to this topic" button, with a spoken "Link copied" confirmation. If copying fails, the status message shows the URL instead.
7. **Source dates and links.**
   - Every source date is either a verified date or an explicit "Not available" / "Not shown on the page". The earlier non-dates ("Study report", "Current page", "Current version", "Last reviewed with the study records") are gone.
   - Source dates (Source date, Record date) are labelled separately from website review dates (Website page reviewed).
   - Each library-backed source links to both its Evidence library entry and the original source: DOI, PubMed, NICE or registry.
   - NICE CG155 and CG178 are now separate sources, dated 2013/2016 and 2014.
   - The CANTOP-RCT report date is "Not available", because the library gives none.

No new images were added; one was removed from the introduction. No sponsor, participant-number or dose details were added. The stylesheet and script cache keys are now `?v=nwpt040`.

## Checks (targeted)

- `test-programme-room.mjs`: **173/173**, at 390×844 and 1363×936. It covers:
  - the new opening, shortcuts, focus and history;
  - the open-question links and disclosure deep links;
  - the copy link, read back from the clipboard;
  - the label sets, panel structure, source dates and both-link sources;
  - milestones kept apart from the explorer;
  - keyboard tabs, Previous/Next, and each stage's image with automated axe checks against WCAG 2.2 A/AA rules;
  - the page without JavaScript, reduced motion, and the content guards.
- `check-pages.mjs`: **184/184**. Programme Room, Programme, Study, Evidence, Phase 1 and Science at 390 and 1280 px; 77 internal links and anchors, including `evidence.html#ref-nice-cg178`.
- `test-image-checks.mjs`: **8/8**.
- `test-nwpt034.mjs`: **35/35**.

## Screenshots

`records/screens-nwpt040/`: before (`06f3a2f`) and after, at 1363×936 and 390×844. For each: the opening screen, and the Phase 2B panel with "What supports this?" expanded.
