/**
 * Pascal execution worker.
 *
 * Owns the engine bundle (compiler plus the runtime of compiled programs), so
 * every global that Emscripten style code creates stays out of the page, and so
 * the page can terminate a program that never ends.
 */

import engineBundle from '../generated/engine.bundle.js?raw';
import { executeProgram, toCompileDiagnostic, type ExecuteOptions, type PascalEngineApi } from '../core';
import type { WorkerRequest, WorkerResponse } from '../protocol';

interface WorkerScope {
    postMessage(message: WorkerResponse): void;
    onmessage: ((event: { data: WorkerRequest }) => void) | null;
}

const scope = self as unknown as WorkerScope & { PascalEngine?: PascalEngineApi };

// Evaluate the bundle in the worker's global scope.
(0, eval)(engineBundle);

const engine = scope.PascalEngine;
if (!engine) {
    throw new Error('Pascal engine bundle did not define PascalEngine');
}

// Replays of the same program (after the user typed input) skip the compile.
let cachedSource: string | null = null;
let cachedJs = '';

scope.onmessage = (event): void => {
    const request = event.data;
    if (request.type !== 'run') {
        return;
    }
    const { id, source, input, echoInput, seed } = request;

    let compileMs = 0;
    if (cachedSource !== source) {
        const started = performance.now();
        try {
            cachedJs = engine.compile(source);
            cachedSource = source;
        } catch (error) {
            cachedSource = null;
            compileMs = performance.now() - started;
            scope.postMessage({ type: 'compileError', id, diagnostic: toCompileDiagnostic(error, source), compileMs });
            return;
        }
        compileMs = performance.now() - started;
    }

    const started = performance.now();
    const options: ExecuteOptions = {};
    if (echoInput) {
        options.echoInput = true;
    }
    if (seed !== undefined) {
        options.seed = seed;
    }
    const outcome = executeProgram(
        engine,
        cachedJs,
        input,
        (text) => {
            scope.postMessage({ type: 'output', id, text });
        },
        options,
    );
    scope.postMessage({ type: 'finished', id, outcome, compileMs, runMs: performance.now() - started });
};

scope.postMessage({ type: 'ready' });
