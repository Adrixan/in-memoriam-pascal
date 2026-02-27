/**
 * Interpreter Store - Manages execution state and output
 */

import { create } from 'zustand';
import type { InterpreterState, OutputLine, InterpreterError } from '@/types';

interface InterpreterStore extends InterpreterState {
    /** Set execution status */
    setStatus: (status: InterpreterState['status']) => void;

    /** Add output line */
    addOutput: (content: string, type: OutputLine['type']) => void;

    /** Clear output */
    clearOutput: () => void;

    /** Set error */
    setError: (error: InterpreterError | undefined) => void;

    /** Set execution time */
    setExecutionTime: (time: number | undefined) => void;

    /** Reset interpreter state */
    reset: () => void;
}

const initialState: InterpreterState = {
    status: 'idle',
    output: [],
    error: undefined,
    executionTime: undefined,
};

export const useInterpreterStore = create<InterpreterStore>((set) => ({
    ...initialState,

    setStatus: (status) => {
        console.log('[InterpreterStore] setStatus:', status);
        set({ status });
    },

    addOutput: (content, type) => {
        console.log('[InterpreterStore] addOutput:', type, content?.substring(0, 50));
        set((state) => ({
            output: [
                ...state.output,
                {
                    content,
                    type,
                    timestamp: Date.now(),
                },
            ],
        }));
    },

    clearOutput: () => {
        console.log('[InterpreterStore] clearOutput called - clearing output array');
        set({ output: [] });
    },

    setError: (error) => {
        console.log('[InterpreterStore] setError:', error?.message);
        set({ error, status: error ? 'error' : 'idle' } as Partial<InterpreterStore>);
    },

    setExecutionTime: (executionTime) => {
        set({ executionTime });
    },

    reset: () => {
        console.log('[InterpreterStore] reset called');
        set(initialState);
    },
}));
