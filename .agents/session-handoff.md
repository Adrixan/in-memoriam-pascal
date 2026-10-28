# Session handoff: dependency security and sharp responsive UI

## 2026-10-28 audit gate, major upgrades, supply-chain cooldown
- Audit gate: Peter accepted GHSA-gcqx-w48m-w2h4 (deepmerge, no fixed release, build time only via vite-plugin-pwa > workbox-build > @rollup/plugin-node-resolve) on 2026-10-28; recorded in `audit-exceptions.json`. `npm run audit` (`scripts/audit.mjs`) fails on every other advisory and fails closed (exit 2) when npm audit itself errors; CI runs it instead of `npm audit --audit-level=low`. Verified: exit 0 with the exception, 1 with an empty list, 2 with an unreachable registry. Remove the exception once deepmerge ships a fix or workbox-build drops it.
- Majors moved (latest major per Peter's named targets): vite 6 -> 8.3.5, vitest 4 -> 5.0.5, vite-plugin-pwa 0.21 -> 2.0.0, @vitejs/plugin-react 4 -> 6.1.2 (6 is the line for Vite 8), eslint and @eslint/js 9 -> 10, eslint-plugin-react-hooks 5 -> 7.1.1, eslint-plugin-react-refresh 0.4 -> 0.5.7, globals 16 -> 17, typescript 5 -> 6.0.3, @testing-library/jest-dom 6 -> 7.0.1, @types/node 25 -> 26. Explicit devDependencies added: `terser` (Vite 8 needs it for `minify: 'terser'`, it was only present transitively) and `@testing-library/dom` (required peer of jest-dom 7 and Testing Library React).
- Blocked: TypeScript 7 (typescript-eslint 8.72.1 peer `typescript >=4.8.4 <6.1.0`).
- Refactors: Rolldown `codeSplitting.groups` replace object-form `manualChunks` (`rolldownOptions`); `import.meta.dirname` in Vite/Vitest configs; tsconfig drops deprecated `baseUrl` and lists `types: ["node"]` (TS 6 no longer loads all @types); IntersectionObserver mock gains `scrollMargin`; ESLint flat config via `defineConfig`/`globalIgnores`, `reactHooks.configs.flat.recommended` (all React Compiler rules) and `reactRefresh.configs.vite()`. Code fixed for `set-state-in-effect`: HomePage TypingEffect restarts through a `key` and counts steps in one state; TutorialPage resets per-level validation while rendering a new `levelId` and validates runs from an interpreter-store subscription (`useEffectEvent`) on the transition into success/error. One deliberate difference: a stale finished run from before the page mounted is no longer validated on mount (it was validated against empty code). `preserve-caught-error`: test error now carries `cause`.
- Cooldown: every `^x.y.z` minimum (and override) is at least 24 h old; react-router-dom stays at `^7.18.4` (7.18.5 was under 24 h). Dependabot npm and github-actions entries have `cooldown: default-days: 1`. `.agents/dependency-policy.md` updated.
- Verified after `npm ci`: typecheck, lint, 121 unit tests, build, `npm run audit`, E2E 60/60 in the first full run; the second full run had one Monaco typing timeout in `tutorial-flow.spec.ts` ("complete a level"), which passed alone 12/12 and 5/5 with `--repeat-each=5` (known load flakiness).

## 2026-10-28 unpinned dependencies
- New policy (global rules): no exact pins; manifests name the latest release as the minimum. `@fontsource/ibm-plex-mono`, `@fontsource/press-start-2p` and `@fontsource/vt323` went from exact `5.3.0` to `^5.3.0` (5.3.0 is latest). `typescript` went from `~5.7.3` to `^5.9.3` (installed 5.9.3).
- Kept cap: TypeScript stays on major 5 (`^5.9.3`). TypeScript 7.0.2 was tried and breaks the project: typescript-eslint 8.72.1 throws "does not support TS 7.0" (peer `typescript >=4.8.4 <6.1.0`) and `tsc` rejects the removed `baseUrl` option in `tsconfig.json`. TypeScript 6.0.3 is inside the typescript-eslint peer range but was not tried (major upgrade, needs approval).
- Lockfile refreshed with `npm update` (in-range updates such as i18next 26.5.11, react-i18next 17.1.9, react-router-dom 7.18.5, vite 6.4.5, zustand 5.0.16, typescript-eslint 8.72.1).
- Verified: typecheck, lint, 121 unit tests, production build, `npm ci`. E2E with system Chromium: 58/60 in the full run (two Monaco typing tests in `tutorial-flow.spec.ts` timed out under load), then `tutorial-flow.spec.ts` alone 12/12.
- Branch `chore/unpin-deps` pushed but not merged to `main` because the audit gate fails. Open audit finding (not fixable): GHSA-gcqx-w48m-w2h4 (CVE-2026-93753, low) in `deepmerge` 4.3.1 via vite-plugin-pwa > workbox-build > @rollup/plugin-node-resolve; every deepmerge release is affected and upstream has no fix; GitHub reviewed it on 2026-10-27, so the CI `npm audit --audit-level=low` gate fails on `main` too. Build-time only path on trusted config. Needs Peter's decision (accept with an audit exception, or wait for upstream).

## 2026-10-24 release audit remediation
- Patched transitive serialize-javascript to 7.1.4. Clean install, zero-finding audit, lint, typecheck, 121 tests and production build passed. Main `3daac4b` merged/pushed. Verification used the site `.scratch/remediation/in-memoriam-pascal` worktree; pre-existing local Pascal.js submodule changes remain untouched.

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
