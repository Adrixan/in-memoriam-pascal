/**
 * Pascal execution service.
 *
 * Programs run in a worker (see src/engine); the runner is shared by all
 * pages so the worker and its compile cache survive navigation.
 */

import { PascalRunner } from './PascalRunner';

export { PascalRunner, type RunResult, type RunnerOptions, type WorkerLike } from './PascalRunner';
export {
    compileDiagnosticToError,
    runResultToError,
    runtimeDiagnosticToError,
} from './diagnostics';

let shared: PascalRunner | null = null;

/** The runner used by the application. */
export function getPascalRunner(): PascalRunner {
    shared ??= new PascalRunner();
    return shared;
}
