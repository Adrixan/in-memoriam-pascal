/**
 * Test harness for the Pascal engine.
 *
 * Loads the generated engine bundle into an isolated `node:vm` context (the
 * same bundle the execution worker evaluates) and exposes `runPascal`.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import {
    executeProgram,
    toCompileDiagnostic,
    type CompileDiagnostic,
    type PascalEngineApi,
    type RunOutcome,
} from '../../src/engine/core';

const bundlePath = resolve(__dirname, '../../src/engine/generated/engine.bundle.js');
let bundleSource: string | undefined;

/** Create an engine instance in a fresh global scope. */
export function createEngine(): PascalEngineApi {
    bundleSource ??= readFileSync(bundlePath, 'utf8');
    const context = vm.createContext({ importScripts: () => undefined });
    vm.runInContext(bundleSource, context);
    return (context as unknown as { PascalEngine: PascalEngineApi }).PascalEngine;
}

export interface PascalResult {
    /** Everything the program wrote to stdout */
    output: string;
    /** Output split into lines (without the trailing empty line) */
    lines: string[];
    compileError?: CompileDiagnostic;
    outcome?: RunOutcome;
}

export interface RunOptions {
    /** Text supplied on stdin, lines separated by \n */
    input?: string;
}

/** Compile and run a Pascal program, capturing output and diagnostics. */
export function runPascal(source: string, options: RunOptions = {}): PascalResult {
    const engine = createEngine();
    let js: string;
    try {
        js = engine.compile(source);
    } catch (error) {
        return { output: '', lines: [], compileError: toCompileDiagnostic(error, source) };
    }

    let output = '';
    const outcome = executeProgram(engine, js, options.input ?? '', (text) => {
        output += text;
    });
    const lines = output.split('\n');
    if (lines[lines.length - 1] === '') {
        lines.pop();
    }
    return { output, lines, outcome };
}

/** Convenience: run and return stdout, failing loudly on any error. */
export function expectOutput(source: string, options: RunOptions = {}): string {
    const result = runPascal(source, options);
    if (result.compileError) {
        const { line, message } = result.compileError;
        throw new Error(`compile error${line ? ` (line ${line})` : ''}: ${message}`);
    }
    if (result.outcome?.kind !== 'finished') {
        throw new Error(`program did not finish: ${JSON.stringify(result.outcome)}\noutput so far: ${result.output}`);
    }
    return result.output;
}
