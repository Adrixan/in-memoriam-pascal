/**
 * PascalRunner
 *
 * Runs Pascal programs in a dedicated worker. A run executes a program once
 * from the start with a fixed stdin text. When the program wants more input
 * than supplied, the run ends with `needInput`; the caller asks the user and
 * runs again with the longer input (replay). A program that never ends is cut
 * off by terminating the worker.
 */

import type { CompileDiagnostic, RuntimeDiagnostic } from '@/engine/core';
import type { WorkerRequest, WorkerResponse } from '@/engine/protocol';

/** The subset of the Worker API the runner needs (replaceable in tests). */
export interface WorkerLike {
    postMessage(message: WorkerRequest): void;
    terminate(): void;
    onmessage: ((event: { data: WorkerResponse }) => void) | null;
    onerror: ((event: { message?: string }) => void) | null;
}

export type RunResult =
    | { status: 'finished'; exitCode: number; durationMs: number }
    | { status: 'compileError'; diagnostic: CompileDiagnostic }
    | { status: 'runtimeError'; error: RuntimeDiagnostic; durationMs: number }
    | { status: 'needInput'; durationMs: number }
    | { status: 'timeout'; timeoutMs: number }
    | { status: 'outputLimit'; limit: number }
    | { status: 'stopped' }
    | { status: 'crashed'; message: string };

export interface RunnerOptions {
    /** Wall-clock limit for one run (default 10 s) */
    timeoutMs?: number;
    /** Characters of output after which the run is cut off (default 200 000) */
    maxOutputChars?: number;
    /** Creates the worker; defaults to the bundled execution worker */
    createWorker?: () => WorkerLike;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_OUTPUT = 200_000;

function defaultWorkerFactory(): WorkerLike {
    return new Worker(new URL('../../engine/worker/pascal.worker.ts', import.meta.url), {
        type: 'module',
    }) as unknown as WorkerLike;
}

interface ActiveRun {
    id: number;
    resolve: (result: RunResult) => void;
    onOutput: ((text: string) => void) | undefined;
    outputChars: number;
    timer: ReturnType<typeof setTimeout> | undefined;
}

export class PascalRunner {
    private readonly timeoutMs: number;
    private readonly maxOutputChars: number;
    private readonly createWorker: () => WorkerLike;

    private worker: WorkerLike | null = null;
    private ready: Promise<void> | null = null;
    private nextId = 1;
    private active: ActiveRun | null = null;

    constructor(options: RunnerOptions = {}) {
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.maxOutputChars = options.maxOutputChars ?? DEFAULT_MAX_OUTPUT;
        this.createWorker = options.createWorker ?? defaultWorkerFactory;
    }

    /** Start the worker ahead of the first run. Resolves when it is ready. */
    warmUp(): Promise<void> {
        return this.ensureWorker();
    }

    /**
     * Run a program. A new run cancels a run that is still in progress.
     *
     * @param input text for stdin; use "\n" between lines
     * @param onOutput receives output as it is produced
     */
    async run(
        source: string,
        input: string,
        onOutput?: (text: string) => void,
        options: { echoInput?: boolean; seed?: number } = {},
    ): Promise<RunResult> {
        this.cancelActive('stopped');
        try {
            await this.ensureWorker();
        } catch (error) {
            return { status: 'crashed', message: error instanceof Error ? error.message : String(error) };
        }
        const worker = this.worker;
        if (!worker) {
            return { status: 'crashed', message: 'The execution worker is not available' };
        }

        const id = this.nextId++;
        return new Promise<RunResult>((resolve) => {
            const run: ActiveRun = {
                id,
                resolve,
                onOutput,
                outputChars: 0,
                timer: setTimeout(() => this.cutOff({ status: 'timeout', timeoutMs: this.timeoutMs }), this.timeoutMs),
            };
            this.active = run;
            const request: WorkerRequest = { type: 'run', id, source, input };
            if (options.echoInput) {
                request.echoInput = true;
            }
            if (options.seed !== undefined) {
                request.seed = options.seed;
            }
            worker.postMessage(request);
        });
    }

    /** Stop the run in progress, if any. */
    stop(): void {
        this.cancelActive('stopped');
    }

    /** Release the worker. */
    dispose(): void {
        this.cancelActive('stopped');
        this.discardWorker();
    }

    private ensureWorker(): Promise<void> {
        if (this.ready) {
            return this.ready;
        }
        const worker = this.createWorker();
        this.worker = worker;
        this.ready = new Promise<void>((resolve, reject) => {
            worker.onmessage = (event): void => {
                const message = event.data;
                if (message.type === 'ready') {
                    resolve();
                    return;
                }
                this.handleMessage(message);
            };
            worker.onerror = (event): void => {
                const message = event.message ?? 'The execution worker failed';
                reject(new Error(message));
                this.cancelActive('crashed', message);
                this.discardWorker();
            };
        });
        // A failed start must not stay cached.
        this.ready.catch(() => {
            if (this.worker === worker) {
                this.discardWorker();
            }
        });
        return this.ready;
    }

    private discardWorker(): void {
        this.worker?.terminate();
        this.worker = null;
        this.ready = null;
    }

    private handleMessage(message: WorkerResponse): void {
        const run = this.active;
        if (!run || message.type === 'ready' || message.id !== run.id) {
            return;
        }
        switch (message.type) {
            case 'output':
                run.outputChars += message.text.length;
                run.onOutput?.(message.text);
                if (run.outputChars > this.maxOutputChars) {
                    this.cutOff({ status: 'outputLimit', limit: this.maxOutputChars });
                }
                break;
            case 'compileError':
                this.settle({ status: 'compileError', diagnostic: message.diagnostic });
                break;
            case 'finished': {
                const outcome = message.outcome;
                if (outcome.kind === 'finished') {
                    this.settle({ status: 'finished', exitCode: outcome.exitCode, durationMs: message.runMs });
                } else if (outcome.kind === 'needInput') {
                    this.settle({ status: 'needInput', durationMs: message.runMs });
                } else {
                    this.settle({ status: 'runtimeError', error: outcome.error, durationMs: message.runMs });
                }
                break;
            }
        }
    }

    private settle(result: RunResult): void {
        const run = this.active;
        if (!run) {
            return;
        }
        this.active = null;
        clearTimeout(run.timer);
        run.resolve(result);
    }

    /** End the current run by terminating the worker (it may be stuck). */
    private cutOff(result: RunResult): void {
        this.settle(result);
        this.discardWorker();
    }

    private cancelActive(status: 'stopped' | 'crashed', message?: string): void {
        if (!this.active) {
            return;
        }
        const result: RunResult =
            status === 'crashed' ? { status: 'crashed', message: message ?? 'crashed' } : { status: 'stopped' };
        // The worker may be in the middle of a long run: replace it.
        this.cutOff(result);
    }
}
