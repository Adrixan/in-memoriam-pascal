# Session handoff: production-readiness changes

## Current intent
- Continue making the Pascal tutorial PWA production-ready, with its worker-based Pascal.js engine and coherent tutorial/editor execution flow.
- Current work is on `feat/production-readiness`; `main` remains at `5e8e736` and has not been merged or updated.

## Changes and verification
- Reconnected `TutorialPage` to the worker runner; added a stable run ID, draft autosave/restore, attempt counting on run, test-input vs interactive-input separation, and empty stdin support.
- Added reference solutions for all 15 levels and a contract test that executes every solution and validates its output. Corrected the nested-record validation rule.
- Fixed tutorial navigation and test routes for the app's `HashRouter`; E2E tests now verify actual tutorial/editor behavior rather than silently falling back to the home page. Updated local Monaco content inspection.
- Added localized interpreter diagnostics and waiting/input/progress labels; fixed the unlabeled progressbar, input submission, timestamps, and stray UI debug logging.
- Free editor code now persists separately. Header tutorial links point to the actual first level. README now describes 15 levels, current localStorage use, and corrected repository details.
- Disabled Vite PWA dev-service-worker registration, which failed in the Vite test server; production service worker build remains enabled.
- Verification passed: `npm run typecheck`, `npm run lint`, `npm test -- --run` (121 tests), `npm run build`, and full Playwright suite (57 tests) using `/usr/bin/chromium`.
- Build still reports the large Monaco bundle (about 3.7 MB, 917 KB gzip) and an empty `vendor-react` chunk. These were not changed in this pass.

## Important repository state
- Work is on `feat/production-readiness`; changes need review, commit, push, and merge into `main`.
- The main repo's Pascal compiler sources are under `engine/`; `scripts/build-engine.mjs` builds the app bundle from those sources.
- `external/pascal.js` remains separately dirty with source edits and untracked files on its own `master` branch. Its upstream is `kanaka/pascal.js`; do not stage or push these submodule edits as part of the app merge without separate authorization/review.
- Playwright generated reports and TypeScript declaration maps should remain excluded from the commit. Four tracked `test-results/debug-*.png` deletions predated this implementation; decide whether to include them as intended cleanup when reviewing the staged diff.
- Remote: `origin` is `git@github.com:Adrixan/in-memoriam-pascal.git`; `main` tracks `origin/main`.

## Next steps
- Confirm exact staged file scope and keep generated reports/maps and external submodule work out of the app commit.
- Commit and push `feat/production-readiness`, fast-forward update `main`, merge with `--no-ff`, and push `main`.
- Delete only the feature branch after successful merge/push. Preserve other branches and the dirty submodule working tree.
