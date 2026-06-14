# Issue #219 phased implementation plan

Branch: `feat/issue-219`

## Why this is phased

Issue #219 touches some of the most TV-critical and oversized files in the repo, especially `js/ui/screens/player/playerScreen.js` and `js/ui/screens/home/homeScreen.js`. The branch work already started in that direction: repo guardrails are being added (`eslint.config.js`, `npm run lint`, `npm run format:check`) and the first logic splits are underway (`homeCollectionFolders.js`, `homeTrailerMedia.js`, `playerStreamCandidates.js`).

Doing this in small batches keeps playback, focus, back-navigation, and route-state behavior shippable while we reduce file size and tighten module boundaries.

## Current phased sequence

1. **Guardrails first**
   - Land lint/format tooling with a conservative baseline.
   - Catch obvious regressions before larger refactors expand.
2. **File splits next**
   - Keep runtime behavior stable while extracting cohesive helper modules from the largest screens.
   - Current in-progress examples: collection-folder helpers, trailer-media helpers, and player stream-candidate helpers.
3. **Incremental type-safety later**
   - Add type-safety only after the big files are split into smaller seams.
   - Prefer targeted typing around extracted modules instead of repo-wide conversion first.
4. **Explicit non-goals for this branch**
   - **No router replacement now.**
   - **No Tailwind migration now.**

## Why we are deferring bigger platform changes

- **No TypeScript big-bang migration now:** the repo is still JS-only today (no `tsconfig`, no `.ts`/`.tsx` sources). Converting the largest screens and their call sites in one pass would mix structural cleanup with broad syntax churn, making TV regressions harder to isolate.
- **No router replacement now:** `js/ui/navigation/router.js` is already deeply wired into screen mounting, back-stack handling, history sync, route-state restore, and TV exit behavior. Replacing it during file-splitting would expand the risk surface too far.
- **No Tailwind migration now:** the app currently relies on shared `css/` styles plus large screen files that render HTML strings directly. A styling-system migration would create wide churn without helping the immediate goal of making the largest modules safer to change.

## Largest current refactor targets

- `js/ui/screens/player/playerScreen.js` (~12.3k LOC) — first split already started via `playerStreamCandidates.js`
- `js/ui/screens/home/homeScreen.js` (~7.9k LOC) — first splits already started via `homeCollectionFolders.js` and `homeTrailerMedia.js`
- `js/ui/screens/detail/metaDetailsScreen.js` (~6.5k LOC) — likely next large screen after home/player stabilize
- `js/ui/screens/settings/settingsScreen.js` (~4.5k LOC) — large stateful screen, but lower priority than player/home

## Manual regression checklist (TV-critical)

- Launch to Home, move focus with the remote, and confirm focus/row restore still works after backing out of nested screens.
- Open collection-folder rows from Home and confirm posters, titles, and folder navigation still render correctly.
- Open a title with trailer support and confirm hero/trailer fallback behavior still works, including muted/unmuted preference handling.
- From Detail/Home, open stream selection and verify playable candidates still appear for normal, debrid, and platform-resolved streams.
- Start playback, then verify play/pause, seek, back, and resume/continue-watching behavior still works.
- Confirm back-navigation from Player/Detail/Home still follows expected TV behavior on webOS/Tizen-style flows.
