# TV router and focus invariants

See also: [Issue #219 phased plan](../roadmaps/issue-219-phased-plan.md)

Relevant implementation:
- `js/ui/navigation/router.js`
- `js/ui/navigation/focusEngine.js`
- `js/ui/navigation/routeStateStore.js`

## Why this router exists

Nuvio is a TV-first app, not a URL-first web SPA. The current `Router` owns imperative screen mount/cleanup, browser-history bridging, platform exit behavior, and per-screen route-state restore. `FocusEngine` sits beside it so remote keys, back keys, and webOS pointer input all target the active screen through one contract.

## Current invariants

### Back and exit

- Back is screen-first. `FocusEngine.handleBack()` normalizes platform back keys, de-dupes rapid presses, and asks `currentScreen.consumeBackRequest()` before `Router.back()`. This is how `PlayerScreen` closes overlays/panels before leaving playback and how `HomeScreen` opens the sidebar before exiting.
- Consumed back must not pop history. `Router.suppressNextPopstate()` and `skipConsumeNextPopstate` prevent a browser `popstate` from causing a second back.
- `home` is the real root, but Home back is not “always exit”: `HomeScreen.consumeBackRequest()` first closes menus/poster flows, then opens the sidebar; only sidebar-focused Home back exits.
- Auth/profile routes in `NON_BACKSTACK_ROUTES` (`profileSelection`, `authQrSignIn`, `authSignIn`, `syncCode`) are not normal back-stack entries. Root back from them should not reopen auth/profile loops.
- If history cannot satisfy back, `Router.back()` falls back to mounting `home`; only the real root path calls `Platform.exitApp()`.

### Route-state restore

- Restore is opt-in per screen via `getRouteStateKey()`, `captureRouteState()`, and optional `clearRouteStateOnMount()`.
- On navigation, the router captures current state before cleanup, stores it in `RouteStateStore`, then passes `restoredState`, `routeStateKey`, `fromHistory`, and `isBackNavigation` into the next screen `mount()`.
- Screens already relying on this contract include `home`, `detail`, `search`, `discover`, `catalogSeeAll`, and `stream`.
- Restored state includes focus and viewport state, not just fetched data:
  - `HomeScreen` restores row/item focus, track scroll, main scroll, and a `sessionStorage` return-focus fallback.
  - `MetaDetailsScreen` restores pending focus descriptors, vertical/horizontal scroll, tab/season state, and loaded detail payload.
  - `SearchScreen` clears stale snapshots when a new explicit query arrives.
- `Router.navigate()` only writes history after `await Screen.mount(...)` if the same route/params are still current. Async mount races must not leave extra history entries.

### Focus and navigation integration

- `FocusEngine` is the input boundary. It normalizes remote keys with `Platform.normalizeKey()` and forwards `onKeyDown()` / `onKeyUp()` only to the active route.
- On webOS pointer remotes, `FocusEngine` also keeps DOM focus and `.focused` state in sync, then calls `onPointerFocus()` / `onPointerActivate()`. `PlayerScreen` depends on this for scrubbing and control activation.
- Back navigation restores prior focus instead of first-entry defaults. The screen owns the exact restore logic; the router provides the timing and `isBackNavigation` signal.

## Why router replacement is deferred for #219

Issue #219 is currently reducing file size and splitting TV-critical screens. Replacing the router in the same branch would mix structural refactors with the highest-risk behavior surface: back handling, exit behavior, history/popstate, and focus restore across Home/Detail/Player/Search/Stream. The phased plan intentionally keeps the current router in place for now.

## Before a future migration is reconsidered

A replacement must preserve, in tests or verified manual flows, all of the following:

1. Screen-first `consumeBackRequest()` interception before any history or stack mutation.
2. Home root semantics: sidebar-first back, then exit via `Platform.exitApp()`.
3. Non-backstack auth/profile flows and their replace-history behavior.
4. Per-route snapshots keyed by route identity, including scroll/focus restore and invalidating stale snapshots when params materially change.
5. The `mount(params, navigationContext)` contract (`restoredState`, `fromHistory`, `isBackNavigation`).
6. Unified remote and pointer focus handling for the active screen only.
7. Guards against double-back and stale history writes during async mounts.
