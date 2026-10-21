# Session handoff: dependency security and sharp responsive UI

## CI follow-up (2026-10-21)
- Added `build:engine` and npm `predev`/`prebuild` hooks so clean checkouts generate the ignored Pascal engine bundle before Vite needs it.
- Aligned i18next 26.5.4 with react-i18next 17.1.0, upgraded jsdom to 30.1.3, grouped the coupled i18next updates in Dependabot, and set Node 22.22.2 as the supported minimum (including CI and README).
- Verified lint, typecheck, 121 unit tests, production build, and audit (0 findings). Focused interpreter E2E passed using system Chromium. The full 60-test E2E attempt exceeded the local five-minute limit. Preserve the pre-existing `external/pascal.js` modification; restore generated `playwright-report/index.html` before committing.

## Current state
- Previous production-readiness feature is merged to `main`; this follow-up is under verification before its commit/push.
- External `external/pascal.js` submodule remains unrelated and dirty. Keep its edits/untracked files isolated.

## This follow-up
- `npm audit` now reports 0 known vulnerabilities after compatible upgrades and overrides: Vite 6.4.4, Vitest 4.1.12, React Router 7.18.4, Monaco Editor 0.57.0, Jison 0.4.18; patched `underscore` and `dompurify` overrides.
- Removed unused direct dependencies: `framer-motion`, `idb`, `lucide-react`, `@axe-core/react`.
- Added `.agents/dependency-policy.md`, daily Dependabot npm/GitHub Actions updates including major-version PRs, and CI `npm audit --audit-level=low` gate.
- Refined CRT glow and anti-aliasing for sharper text. Tutorial content is capped and centered above 1600 px; added E2E viewport assertions at 1366, 1920, and 3840 CSS px.
- Switched Monaco to its tree-shakeable ESM entrypoint and worker import. Editor bundle fell from 3.66 MB / 917 KB gzip to 2.72 MB / 687 KB gzip while retaining offline editor support.

## Verification
- `npm audit --audit-level=low`: zero known advisories.
- `npm run typecheck`, `npm run lint`, `npm test -- --run`: pass (121 tests).
- `npm run build`: passes without chunk warnings; output has no empty React chunk.
- Full `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: 60/60 pass, including desktop responsive viewports, tutorial, mobile, and accessibility checks.
- This workstation's project-scoped npm `allow-scripts` setting can reject nested `npm audit` invoked through `npm run`; direct `npm audit --audit-level=low` works. CI runs the direct command.

## Dependency freshness notes
- `npm update` refreshes packages within declared semver ranges. Several majors remain newer than the selected compatible major (for example Vite 8, ESLint 10, TypeScript 7, Vitest 5, PWA plugin 2); Dependabot now opens major update PRs. Migrate these with compatibility fixes and CI, rather than broad unreviewed force upgrades.
- Zero audit findings means zero advisories known to the configured npm audit database at scan time. It cannot guarantee absence of undiscovered vulnerabilities.

## Next
- Inspect staged diff; exclude generated Playwright reports/maps and preserve the dirty Pascal.js submodule.
- Commit and push intended app, dependency, security policy, and responsive UI changes to `main`.
