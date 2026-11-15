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

## 2026-11-07: relicensed to PolyForm Noncommercial 1.0.0
- Peter's order: only he may make money from the games. `LICENSE` is the verbatim PolyForm Noncommercial 1.0.0 text with two Required Notice lines (copyright; selling or paid distribution needs a written licence from Peter); `package.json` license `PolyForm-Noncommercial-1.0.0`; README badge and licence section rewritten (content CC BY-NC-SA 4.0, contributions only with a written agreement). Versions before 2026-11-07 stay AGPL-3.0 for those who received them.
- Third-party parts stay under their own licences: submodule `external/pascal.js` and `public/external/pascal.js` (MPL-2.0), the forked compiler in `engine/` (MPL-2.0; long.js Apache-2.0, ieee754.js BSD-style). The README acknowledgement now links the real Pascal.js source (kanaka/pascal.js, as in `.gitmodules`).
- Added the missing OFL texts for the bundled @fontsource fonts in `public/fonts/` (shipped to `dist/fonts/`).
- Gates: `npm run audit` (accepted deepmerge exception only), lint, typecheck, 121 tests, build green; E2E left to CI (local full run is slow and flaky). The dirty `external/pascal.js` submodule stays untouched and uncommitted.

## 2026-11-15: Modern Web Guidance run (web-modernize timer)
- `legacy-scan` on `src/` and `index.html` (generated engine bundle, `engine/`, `public/external/`, submodule excluded): one finding, `ime-safe-enter-submit` in `OutputWindow.tsx`. Fixed by removing the custom keydown Enter handler on `#program-input`; the surrounding `<form>` with its submit button does the IME-safe native implicit submission (and the handler had called `onInputSubmit` twice per Enter).
- Commit `42ad112`, merge `149ad67` on `main`, pushed; "Notify Lernspiele site" dispatched the site release (success). Verified typecheck, lint, 121 tests, build, `npm run audit`, headless Chrome on `#/editor` (two readln, one line per Enter). CI run on `c86223e` passed including E2E.
- Report: `~/sync/ai/web-modernize/2026-11-15/in-memoriam-pascal.md`. No open proposals. Project still has no `AGENTS.md` (no browser policy, no named publish command; publish = push to `main` via the notify workflow).
- Note for later sessions: the app uses `HashRouter`, so the editor is at `/#/editor`; seed editor code through localStorage `editor-storage` (`state.freeCode`).

## 2026-11-15: i18n gaps, unused Pascal.js copy, Dependabot triage (rc code session of in-memoriam-pascal-android)
- i18n: 21 keys used in `src/` were in neither locale, so the English UI showed the German hint defaults and the German UI English validation and editor texts; the hint button's aria-label was the bare key `hints.revealHint`. All keys are in both `common.json` files (plurals via `count`), the ABOUT.PAS text on the home page and two English aria-labels go through i18n, `ErrorAnalyzer` returns a key of the new `errors:analysis` section instead of an English sentence, `HintDisplay` resolves the hint kind once (untyped level 2/3 hints were labelled "gentle") and translates its labels, and the tutorial page passes `error`/`keyword` to `validation.runtimeError`/`missingKeyword` (the panel showed `{{error}}`). Both locale files had a duplicate `tutorial` object (JSON kept the second; now the only one). New test `tests/unit/i18nKeys.test.ts`: every literal `t()` key and every `ErrorAnalyzer` description key exists in de and en, and both locales have the same keys. Template-literal keys are not covered by the test; keep them typed (as `ERROR_DESCRIPTION_KEYS`).
- Removed `public/external/pascal.js` (41 MB, 192 files, unused since the compiler fork in `engine/` ships in the worker chunk): `dist/` 47 MB -> 5.6 MB, precache 54 entries (5.1 MiB) instead of about 340. This also removes the underscore 1.1.7 advisory (GHSA-qpx9-hpmf-5gmw) the nightly scan reported. The service worker's `interpreter-cache` route is gone and `activate` deletes that cache from existing installs.
- Hint points (Peter, 2026-11-15): the first completion of a level awards 10 points (`HINT_POINTS_PER_LEVEL`); before, players had 3 points forever and hints 2 and 3 (10 and 15 points) were unreachable. No retroactive award for levels completed before this change (Peter, 2026-11-15: no back-pay).
- Dependabot: all 24 PRs handled. 17 patch/minor PRs closed by Dependabot after `npm update` plus raised minimums (b02b328); #25 closed as superseded; #51 i18next 27.1.1 and react-i18next 18.0.1 merged as dd2a08b (Peter's go; 27.1.2 was inside the cooldown); #1-#4 combined as e8a2b3d (checkout v7, setup-node v7, upload-artifact v7, download-artifact v8; Peter's go); #21 TypeScript 7 closed: typescript-eslint 8.72.2 still declares `typescript >=4.8.4 <6.1.0`.
- Merges `b63913b` and `5caa27a` on `main`, both pushed, CI green (all jobs including E2E with the new actions), "Notify Lernspiele site" succeeded for both. Local checks: typecheck, lint, 130 unit tests, build, `npm run audit` (accepted deepmerge exception only), E2E `tutorial-flow.spec.ts` 12/12 before the i18next bump and 10/12 after it with two Monaco timeouts at load 17, which passed 6/6 alone (`--repeat-each=3`), and a headless Chromium check of the hint panel and ABOUT.PAS in en and de on both versions.
- Local note: `@playwright/test` 1.65.1 has no downloaded browser here; local E2E and scripts use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` or `executablePath: '/usr/bin/chromium'`.
- Open: hardcoded English strings remain elsewhere (for example aria-labels outside the tutorial page and the `ErrorAnalyzer` suggestion texts, which no component renders today); the project still has no `AGENTS.md`.
