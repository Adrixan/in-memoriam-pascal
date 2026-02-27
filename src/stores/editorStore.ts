/**
 * Editor Store - Manages code content and editor state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EditorState } from '@/types';
import { editorStorage } from '@/lib/storage';

interface EditorStore extends EditorState {
    /** Set code content */
    setCode: (code: string) => void;

    /** Set current level */
    setCurrentLevelId: (levelId: string | null) => void;

    /** Set editor ready state */
    setReady: (isReady: boolean) => void;

    /** Update cursor position */
    setCursorPosition: (line: number, column: number) => void;

    /** Reset editor state */
    reset: () => void;
}

const initialState: EditorState = {
    code: '',
    currentLevelId: null,
    isReady: false,
    cursorPosition: {
        line: 1,
        column: 1,
    },
};

export const useEditorStore = create<EditorStore>()(
    persist(
        (set) => ({
            ...initialState,

            setCode: (code) => {
                console.log('[EditorStore] setCode called with code length:', code?.length);
                console.log('[EditorStore] code preview (first 100 chars):', code?.substring(0, 100));
                set({ code });
            },

            setCurrentLevelId: (currentLevelId) => {
                set({ currentLevelId });
            },

            setReady: (isReady) => {
                set({ isReady });
            },

            setCursorPosition: (line, column) => {
                set({ cursorPosition: { line, column } });
            },

            reset: () => {
                set(initialState);
            },
        }),
        {
            name: 'editor-storage',
            storage: createJSONStorage(() => editorStorage),
            partialize: (state) => ({
                code: state.code,
                currentLevelId: state.currentLevelId,
            }),
        }
    )
);
