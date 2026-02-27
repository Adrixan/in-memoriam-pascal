/**
 * Custom hook for Pascal interpreter
 * Integrates with Pascal.js for browser-based Pascal execution
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterpreterStore } from '@/stores';
import { useEditorStore } from '@/stores';
import { getPascalInterpreter, type PascalInterpreter, type RunResult } from '@/services/interpreter';
import type { InterpreterError } from '@/types';

/**
 * Hook return type
 */
export interface UseInterpreterReturn {
    /** Current execution status */
    status: 'idle' | 'running' | 'success' | 'error';

    /** Output lines from execution */
    output: Array<{ content: string; type: 'output' | 'error' | 'info'; timestamp: number }>;

    /** Current error if any */
    error: InterpreterError | undefined;

    /** Execution time in milliseconds */
    executionTime: number | undefined;

    /** Whether the interpreter is ready to run code */
    isReady: boolean;

    /** Run the current code in the editor */
    runCode: () => Promise<void>;

    /** Run specific code (not from editor) */
    runCodeString: (code: string) => Promise<void>;

    /** Stop execution */
    stopExecution: () => void;

    /** Reset interpreter state */
    reset: () => void;

    /** Clear output */
    clearOutput: () => void;
}

/**
 * useInterpreter Hook
 *
 * Provides an interface to the Pascal.js interpreter for executing
 * Pascal code in the browser.
 *
 * @example
 * ```tsx
 * const { runCode, status, output, error, isReady } = useInterpreter();
 *
 * // Run code from editor store
 * await runCode();
 *
 * // Check status
 * if (status === 'running') {
 *   // Show loading state
 * }
 * ```
 */
export function useInterpreter(): UseInterpreterReturn {
    const {
        status,
        output,
        error,
        executionTime,
        setStatus,
        addOutput,
        clearOutput,
        setError,
        setExecutionTime,
        reset: resetStore,
    } = useInterpreterStore();

    const { code } = useEditorStore();
    const interpreterRef = useRef<PascalInterpreter | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize interpreter on mount
    useEffect(() => {
        const initInterpreter = async (): Promise<void> => {
            try {
                interpreterRef.current = getPascalInterpreter({
                    timeout: 10000, // 10 second timeout
                    maxOutputLines: 1000,
                    debug: false,
                });

                // Pre-load the interpreter scripts
                await interpreterRef.current.load();
                setIsReady(true);
            } catch (err) {
                console.error('Failed to initialize Pascal interpreter:', err);
                setError({
                    message: err instanceof Error ? err.message : 'Failed to initialize interpreter',
                    type: 'runtime',
                });
            }
        };

        void initInterpreter();

        // Cleanup on unmount
        return () => {
            if (interpreterRef.current) {
                interpreterRef.current.stop();
            }
        };
    }, [setError]);

    /**
     * Handle run result
     */
    const handleResult = useCallback(
        (result: RunResult): void => {
            // Add output lines
            for (const line of result.output) {
                addOutput(line, 'output');
            }

            // Set execution time
            if (result.executionTime !== undefined) {
                setExecutionTime(result.executionTime);
            }

            // Handle errors - always set a terminal status to prevent stuck 'running' state
            if (!result.success) {
                // Even if there are no errors in the array, we should set error status
                const firstError = result.errors[0];
                if (firstError) {
                    const errorObj: InterpreterError = {
                        message: firstError.message,
                        type: firstError.type,
                    };
                    if (firstError.line !== undefined) {
                        errorObj.line = firstError.line;
                    }
                    if (firstError.column !== undefined) {
                        errorObj.column = firstError.column;
                    }
                    setError(errorObj);
                } else {
                    // No error details provided, set a generic error
                    setError({
                        message: 'Execution failed with no error details',
                        type: 'runtime',
                    });
                }
                setStatus('error');
            } else {
                setStatus('success');
            }
        },
        [addOutput, setExecutionTime, setError, setStatus]
    );

    /**
     * Run code string
     */
    const runCodeString = useCallback(
        async (codeToRun: string): Promise<void> => {
            console.log('[useInterpreter] runCodeString called with code length:', codeToRun?.length);
            console.log('[useInterpreter] code preview (first 100 chars):', codeToRun?.substring(0, 100));

            if (!codeToRun.trim()) {
                setError({
                    message: 'No code to execute',
                    type: 'compilation',
                });
                return;
            }

            if (!interpreterRef.current || !isReady) {
                setError({
                    message: 'Interpreter not ready. Please wait...',
                    type: 'runtime',
                });
                return;
            }

            setStatus('running');
            clearOutput();
            setError(undefined);
            setExecutionTime(undefined);

            try {
                const result = await interpreterRef.current.run(codeToRun);
                handleResult(result);
            } catch (err) {
                setError({
                    message: err instanceof Error ? err.message : 'Unknown error during execution',
                    type: 'runtime',
                });
                setStatus('error');
            }
        },
        [isReady, setStatus, clearOutput, setError, setExecutionTime, handleResult]
    );

    /**
     * Run code from editor store
     */
    const runCode = useCallback(async (): Promise<void> => {
        await runCodeString(code);
    }, [code, runCodeString]);

    /**
     * Stop execution
     */
    const stopExecution = useCallback((): void => {
        if (interpreterRef.current) {
            interpreterRef.current.stop();
        }
        setStatus('idle');
    }, [setStatus]);

    /**
     * Reset interpreter state
     */
    const reset = useCallback((): void => {
        if (interpreterRef.current) {
            interpreterRef.current.reset();
        }
        resetStore();
    }, [resetStore]);

    return {
        status,
        output,
        error,
        executionTime,
        isReady,
        runCode,
        runCodeString,
        stopExecution,
        reset,
        clearOutput,
    };
}

export default useInterpreter;
