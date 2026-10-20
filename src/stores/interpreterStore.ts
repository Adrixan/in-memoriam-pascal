/**
 * Interpreter Store - execution status and output of the current program
 */

import { create } from 'zustand';
import type { InterpreterError, InterpreterState, OutputLine } from '@/types';

interface InterpreterStore extends InterpreterState {
    /** Start a run: clears output, error and timing */
    begin: () => void;

    /** Replace the output lines */
    setOutput: (output: OutputLine[]) => void;

    /** Finish a run with a terminal status */
    finish: (result: {
        status: 'success' | 'error' | 'idle';
        error?: InterpreterError | undefined;
        executionTime?: number | undefined;
    }) => void;

    /** The program stopped to ask for input */
    awaitInput: (executionTime?: number) => void;

    /** Clear the output panel without touching the status */
    clearOutput: () => void;

    /** Return to the initial state */
    reset: () => void;
}

const initialState: InterpreterState = {
    status: 'idle',
    output: [],
    error: undefined,
    executionTime: undefined,
    isWaitingForInput: false,
    runId: 0,
};

export const useInterpreterStore = create<InterpreterStore>((set) => ({
    ...initialState,

    begin: () => {
        set((state) => ({
            status: 'running',
            output: [],
            error: undefined,
            executionTime: undefined,
            isWaitingForInput: false,
            runId: state.runId + 1,
        }));
    },

    setOutput: (output) => {
        set({ output });
    },

    finish: ({ status, error, executionTime }) => {
        set({ status, error, executionTime, isWaitingForInput: false });
    },

    awaitInput: (executionTime) => {
        set({ status: 'waiting', isWaitingForInput: true, executionTime });
    },

    clearOutput: () => {
        set({ output: [] });
    },

    reset: () => {
        set((state) => ({ ...initialState, runId: state.runId + 1 }));
    },
}));
