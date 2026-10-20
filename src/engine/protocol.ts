/**
 * Messages exchanged between the main thread (PascalRunner) and the worker.
 */

import type { CompileDiagnostic, RunOutcome } from './core';

export type WorkerRequest = {
    type: 'run';
    /** Correlates responses with the request */
    id: number;
    source: string;
    /** Full stdin text; a run is always replayed from the start */
    input: string;
    /** Show consumed input in the output (interactive sessions) */
    echoInput?: boolean;
    /** Seed for Random */
    seed?: number;
};

export type WorkerResponse =
    | { type: 'ready' }
    | { type: 'output'; id: number; text: string }
    | { type: 'compileError'; id: number; diagnostic: CompileDiagnostic; compileMs: number }
    | { type: 'finished'; id: number; outcome: RunOutcome; compileMs: number; runMs: number };
