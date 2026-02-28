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

    /** Whether the interpreter is waiting for user input */
    isWaitingForInput: boolean;

    /** Run the current code in the editor */
    runCode: (inputQueue?: string[]) => Promise<void>;

    /** Run specific code (not from editor) */
    runCodeString: (code: string, inputQueue?: string[]) => Promise<void>;

    /** Provide input to the interpreter */
    provideInput: (input: string) => void;

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
    const [isWaitingForInput, setIsWaitingForInput] = useState(false);
    // Track if prompt was called during execution (for re-run logic)
    const promptCalledRef = useRef(false);
    // Store the code being run for potential re-run
    const pendingCodeRef = useRef<string>('');

    // Initialize interpreter on mount
    useEffect(() => {
        const initInterpreter = async (): Promise<void> => {
            try {
                interpreterRef.current = getPascalInterpreter({
                    timeout: 10000, // 10 second timeout
                    maxOutputLines: 1000,
                    debug: false,
                });

                // Set up the input needed callback
                interpreterRef.current.setOnInputNeeded(() => {
                    console.log('[useInterpreter] Input needed callback triggered');
                    setIsWaitingForInput(true);
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
    }, [setError, setIsWaitingForInput]);

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
        async (codeToRun: string, inputQueue?: string[]): Promise<void> => {
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

            // Store code for potential re-run
            pendingCodeRef.current = codeToRun;

            setStatus('running');
            clearOutput();
            setError(undefined);
            setExecutionTime(undefined);
            setIsWaitingForInput(false);

            // Reset prompt tracking
            promptCalledRef.current = false;

            // Override window.prompt to prevent the popup dialog
            // Instead, it will set a flag and return empty string
            const originalPrompt = window.prompt;
            window.prompt = () => {
                console.log('[useInterpreter] window.prompt called - blocking popup');
                promptCalledRef.current = true;
                return ''; // Return empty string, our FS callback will handle the rest
            };

            try {
                const result = await interpreterRef.current.run(codeToRun, inputQueue);

                // Check if we need more input after execution
                if (promptCalledRef.current) {
                    console.log('[useInterpreter] Input was needed during execution - showing input UI');
                    setIsWaitingForInput(true);
                    // Don't set status to success/error yet - wait for input
                    return;
                }

                handleResult(result);
            } catch (err) {
                setError({
                    message: err instanceof Error ? err.message : 'Unknown error during execution',
                    type: 'runtime',
                });
                setStatus('error');
            } finally {
                // Restore original prompt
                window.prompt = originalPrompt;
            }
        },
        [isReady, setStatus, clearOutput, setError, setExecutionTime, handleResult, setIsWaitingForInput]
    );

    /**
     * Run code from editor store
     */
    const runCode = useCallback(async (inputQueue?: string[]): Promise<void> => {
        await runCodeString(code, inputQueue);
    }, [code, runCodeString]);

    /**
     * Provide input to the interpreter
     */
    const provideInput = useCallback((input: string): void => {
        if (interpreterRef.current) {
            console.log('[useInterpreter] provideInput:', input);
            // Provide the input
            interpreterRef.current.provideInput(input);
            setIsWaitingForInput(false);

            // Re-run the code with the provided input
            const codeToRun = pendingCodeRef.current;
            if (codeToRun) {
                console.log('[useInterpreter] Re-running code with input');
                // Clear output for fresh run
                clearOutput();
                // Run with the input
                interpreterRef.current.run(codeToRun, [input]).then(handleResult);
            }
        }
    }, [clearOutput, handleResult]);

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
            interpreterRef.current.resetInput();
        }
        setIsWaitingForInput(false);
        pendingCodeRef.current = '';
        promptCalledRef.current = false;
        resetStore();
    }, [resetStore]);

    return {
        status,
        output,
        error,
        executionTime,
        isReady,
        isWaitingForInput,
        runCode,
        runCodeString,
        provideInput,
        stopExecution,
        reset,
        clearOutput,
    };
}

export default useInterpreter;
