// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { executeProgram, toCompileDiagnostic } from '@/engine/core';
import type { WorkerRequest, WorkerResponse } from '@/engine/protocol';
import { createEngine } from '../../../tests/engine/harness';
import { PascalRunner, type WorkerLike } from './PascalRunner';

/** In-process stand-in for the execution worker, backed by the real engine. */
class FakeWorker implements WorkerLike {
    static created: FakeWorker[] = [];
    onmessage: ((event: { data: WorkerResponse }) => void) | null = null;
    onerror: ((event: { message?: string }) => void) | null = null;
    terminated = false;
    private readonly engine = createEngine();

    constructor(private readonly hang = false) {
        FakeWorker.created.push(this);
        queueMicrotask(() => this.emit({ type: 'ready' }));
    }

    postMessage(request: WorkerRequest): void {
        if (this.hang || this.terminated) {
            return; // never answers, like a program stuck in a loop
        }
        queueMicrotask(() => {
            let js: string;
            try {
                js = this.engine.compile(request.source);
            } catch (error) {
                this.emit({
                    type: 'compileError',
                    id: request.id,
                    diagnostic: toCompileDiagnostic(error, request.source),
                    compileMs: 0,
                });
                return;
            }
            const options = { echoInput: request.echoInput === true, ...(request.seed !== undefined ? { seed: request.seed } : {}) };
            const outcome = executeProgram(
                this.engine,
                js,
                request.input,
                (text) => this.emit({ type: 'output', id: request.id, text }),
                options,
            );
            this.emit({ type: 'finished', id: request.id, outcome, compileMs: 0, runMs: 1 });
        });
    }

    terminate(): void {
        this.terminated = true;
    }

    private emit(data: WorkerResponse): void {
        if (!this.terminated) {
            this.onmessage?.({ data });
        }
    }
}

beforeEach(() => {
    FakeWorker.created = [];
});

afterEach(() => {
    vi.useRealTimers();
});

describe('PascalRunner', () => {
    it('runs a program and streams its output', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        let text = '';
        const result = await runner.run(`program P; begin WriteLn('hi'); Write('there'); end.`, '', (chunk) => {
            text += chunk;
        });
        expect(result).toMatchObject({ status: 'finished', exitCode: 0 });
        expect(text).toBe('hi\nthere');
        runner.dispose();
    });

    it('reports compile errors with a position', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        const result = await runner.run(`program P;\nbegin\n  WriteLn('a')\n  WriteLn('b');\nend.\n`, '');
        expect(result.status).toBe('compileError');
        if (result.status === 'compileError') {
            expect(result.diagnostic).toMatchObject({ kind: 'syntax', line: 4 });
        }
    });

    it('asks for input and completes when replayed with it', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        const source = `program P; var a, b: Integer; begin Write('a? '); ReadLn(a); Write('b? '); ReadLn(b); WriteLn(a + b); end.`;
        const first = await runner.run(source, '');
        expect(first.status).toBe('needInput');
        const second = await runner.run(source, '4\n');
        expect(second.status).toBe('needInput');
        let out = '';
        const third = await runner.run(source, '4\n5\n', (t) => (out += t));
        expect(third.status).toBe('finished');
        expect(out).toBe('a? b? 9\n');
        // one worker served all three runs
        expect(FakeWorker.created).toHaveLength(1);
    });

    it('accepts an empty input line for ReadLn', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        let output = '';
        const result = await runner.run(
            `program P; var value: String; begin ReadLn(value); end.`,
            '\n',
            (text) => (output += text),
        );
        expect(result.status).toBe('finished');
        expect(output).toBe('');
    });

    it('preserves whitespace in an empty-looking input line', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        const result = await runner.run(`program P; var value: String; begin ReadLn(value); end.`, '   \n');
        expect(result.status).toBe('finished');
    });

    it('reports run time errors', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        const result = await runner.run(`program P; var a: Integer; begin a := 0; WriteLn(1 div a); end.`, '');
        expect(result).toMatchObject({ status: 'runtimeError', error: { code: 200 } });
    });

    it('terminates a program that does not finish and starts a fresh worker next time', async () => {
        vi.useFakeTimers();
        let count = 0;
        const runner = new PascalRunner({
            timeoutMs: 1000,
            createWorker: () => new FakeWorker(count++ === 0),
        });
        const pending = runner.run(`program P; begin while true do; end.`, '');
        await vi.advanceTimersByTimeAsync(1001);
        await expect(pending).resolves.toEqual({ status: 'timeout', timeoutMs: 1000 });
        expect(FakeWorker.created[0]?.terminated).toBe(true);

        const next = await runner.run(`program P; begin WriteLn('again'); end.`, '');
        expect(next.status).toBe('finished');
        expect(FakeWorker.created).toHaveLength(2);
    });

    it('cuts off runaway output', async () => {
        const runner = new PascalRunner({ maxOutputChars: 50, createWorker: () => new FakeWorker() });
        const result = await runner.run(
            `program P; var i: Integer; begin for i := 1 to 1000 do WriteLn('line ', i); end.`,
            '',
        );
        expect(result).toEqual({ status: 'outputLimit', limit: 50 });
    });

    it('can be stopped', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker(true) });
        const pending = runner.run(`program P; begin end.`, '');
        await Promise.resolve();
        await Promise.resolve();
        runner.stop();
        await expect(pending).resolves.toEqual({ status: 'stopped' });
    });
});

describe('PascalRunner options', () => {
    it('echoes consumed input like a terminal', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        let out = '';
        await runner.run(
            `program P; var n: String; begin Write('Name: '); ReadLn(n); WriteLn('Hello ', n); end.`,
            'Anna\n',
            (t) => (out += t),
            { echoInput: true },
        );
        expect(out).toBe('Name: Anna\nHello Anna\n');
    });

    it('repeats Random numbers for the same seed', async () => {
        const runner = new PascalRunner({ createWorker: () => new FakeWorker() });
        const source = `program P; begin WriteLn(Random(1000), ' ', Random(1000)); end.`;
        const outputs: string[] = [];
        for (const seed of [7, 7, 8]) {
            let out = '';
            await runner.run(source, '', (t) => (out += t), { seed });
            outputs.push(out);
        }
        expect(outputs[0]).toBe(outputs[1]);
        expect(outputs[0]).not.toBe(outputs[2]);
    });
});
