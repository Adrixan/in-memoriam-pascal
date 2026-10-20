/**
 * Hook for running Pascal programs.
 *
 * A program runs in a worker. When it asks for input the run ends and the hook
 * waits for the user; once the user answers, the program runs again from the
 * start with all answers so far (the engine is deterministic, see
 * PascalRunner). Output of the previous attempt is replaced, so the user sees
 * one continuous transcript.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterpreterStore } from '@/stores/interpreterStore';
import { getPascalRunner, runResultToError, type PascalRunner } from '@/services/interpreter';
import type { InterpreterError, OutputLine } from '@/types';

export interface UseInterpreterReturn {
    /** Current execution status */
    status: 'idle' | 'running' | 'waiting' | 'success' | 'error';

    /** Output lines from execution */
    output: OutputLine[];

    /** Current error if any */
    error: InterpreterError | undefined;

    /** Execution time in milliseconds */
    executionTime: number | undefined;

    /** Whether the execution environment is ready */
    isReady: boolean;

    /** Whether the program is waiting for the user to type input */
    isWaitingForInput: boolean;

    /**
     * Run a program.
     *
     * @param inputQueue fixed test input. An empty array means no input is
     *   available and should produce a missing-input error.
     */
    runCodeString: (code: string, inputQueue?: string[]) => Promise<void>;
    latestRunId: number;

    /** Answer the input the program is waiting for */
    provideInput: (input: string) => void;

    /** Stop execution */
    stopExecution: () => void;

    /** Reset state and output */
    reset: () => void;

    /** Clear output */
    clearOutput: () => void;
}

interface Session {
    source: string;
    /** Lines typed or supplied so far */
    inputs: string[];
    /** Test input: running out of it is an error instead of a question */
    fixed: boolean;
    seed: number;
}

/** Split program output into display lines (a trailing newline adds none). */
export function toOutputLines(text: string): OutputLine[] {
    if (text === '') {
        return [];
    }
    const parts = text.split('\n');
    if (parts[parts.length - 1] === '') {
        parts.pop();
    }
    const timestamp = Date.now();
    return parts.map((content) => ({ content, type: 'output' as const, timestamp }));
}

export function useInterpreter(runner: PascalRunner = getPascalRunner()): UseInterpreterReturn {
    const status = useInterpreterStore((s) => s.status);
    const output = useInterpreterStore((s) => s.output);
    const error = useInterpreterStore((s) => s.error);
    const executionTime = useInterpreterStore((s) => s.executionTime);
    const isWaitingForInput = useInterpreterStore((s) => s.isWaitingForInput);
    const latestRunId = useInterpreterStore((s) => s.runId);

    const [isReady, setIsReady] = useState(false);
    const sessionRef = useRef<Session | null>(null);
    // identifies the latest run; results of superseded runs are ignored
    const runIdRef = useRef(0);

    useEffect(() => {
        let cancelled = false;
        runner
            .warmUp()
            .then(() => {
                if (!cancelled) {
                    setIsReady(true);
                }
            })
            .catch((reason: unknown) => {
                if (!cancelled) {
                    useInterpreterStore.getState().finish({
                        status: 'error',
                        error: {
                            type: 'system',
                            message: `The execution environment could not be started: ${String(reason)}`,
                            messageKey: 'interpreter.crashed',
                            params: { message: String(reason) },
                        },
                    });
                }
            });
        return () => {
            cancelled = true;
            // leaving the page ends a program that is still running
            runIdRef.current += 1;
            runner.stop();
        };
    }, [runner]);

    const execute = useCallback(
        async (session: Session): Promise<void> => {
            const store = useInterpreterStore.getState();
            const runId = ++runIdRef.current;
            store.begin();

            let text = '';
            let flushTimer: ReturnType<typeof setTimeout> | undefined;
            const flush = (): void => {
                flushTimer = undefined;
                if (runId === runIdRef.current) {
                    useInterpreterStore.getState().setOutput(toOutputLines(text));
                }
            };

            const input = session.inputs.map((line) => `${line}\n`).join('');
            const result = await runner.run(
                session.source,
                input,
                (chunk) => {
                    text += chunk;
                    flushTimer ??= setTimeout(flush, 16);
                },
                // Typed input is echoed; test input is not (it is not typed)
                { echoInput: !session.fixed, seed: session.seed },
            );

            if (flushTimer !== undefined) {
                clearTimeout(flushTimer);
            }
            if (runId !== runIdRef.current) {
                return;
            }
            useInterpreterStore.getState().setOutput(toOutputLines(text));

            const finishWith = (runError: InterpreterError | undefined, durationMs?: number): void => {
                useInterpreterStore.getState().finish({
                    status: runError ? 'error' : 'success',
                    error: runError,
                    executionTime: durationMs,
                });
            };

            switch (result.status) {
                case 'finished':
                    finishWith(undefined, result.durationMs);
                    break;
                case 'needInput':
                    if (session.fixed) {
                        finishWith(
                            {
                                type: 'runtime',
                                message: 'The program reads more input than the test provides.',
                                messageKey: 'interpreter.needsMoreInput',
                            },
                            result.durationMs,
                        );
                    } else {
                        useInterpreterStore.getState().awaitInput(result.durationMs);
                    }
                    break;
                case 'stopped':
                    useInterpreterStore.getState().finish({ status: 'idle' });
                    break;
                case 'runtimeError':
                    finishWith(runResultToError(result), result.durationMs);
                    break;
                default:
                    finishWith(runResultToError(result));
                    break;
            }
        },
        [runner],
    );

    const runCodeString = useCallback(
        async (code: string, inputQueue?: string[]): Promise<void> => {
            if (!code.trim()) {
                useInterpreterStore.getState().begin();
                useInterpreterStore.getState().finish({
                    status: 'error',
                    error: {
                        type: 'compilation',
                        message: 'There is no code to run.',
                        messageKey: 'interpreter.noCode',
                    },
                });
                return;
            }
            const fixed = inputQueue !== undefined;
            const session: Session = {
                source: code,
                inputs: fixed ? [...inputQueue] : [],
                fixed,
                seed: Math.floor(Math.random() * 0xffffffff),
            };
            sessionRef.current = session;
            await execute(session);
        },
        [execute],
    );

    const provideInput = useCallback(
        (input: string): void => {
            const session = sessionRef.current;
            if (!session || session.fixed || useInterpreterStore.getState().status !== 'waiting') {
                return;
            }
            session.inputs.push(input);
            void execute(session);
        },
        [execute],
    );

    const stopExecution = useCallback((): void => {
        runIdRef.current += 1;
        runner.stop();
        sessionRef.current = null;
        useInterpreterStore.getState().finish({ status: 'idle' });
    }, [runner]);

    const reset = useCallback((): void => {
        runIdRef.current += 1;
        runner.stop();
        sessionRef.current = null;
        useInterpreterStore.getState().reset();
    }, [runner]);

    const clearOutput = useCallback((): void => {
        useInterpreterStore.getState().clearOutput();
    }, []);

    return {
        status,
        output,
        error,
        executionTime,
        isReady,
        isWaitingForInput,
        runCodeString,
        latestRunId,
        provideInput,
        stopExecution,
        reset,
        clearOutput,
    };
}

export default useInterpreter;
