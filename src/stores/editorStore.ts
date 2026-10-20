/**
 * Editor Store - the free editor's program
 *
 * The tutorial keeps the code of each level in the tutorial store; this store
 * only remembers what the user was writing in the free editor.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { editorStorage } from '@/lib/storage';

export const DEFAULT_FREE_CODE = `program HelloWorld;
{ Welcome to the free editor! }

begin
  WriteLn('Hello, World!');
end.
`;

interface EditorStore {
    /** Program in the free editor */
    freeCode: string;

    /** Replace the program */
    setFreeCode: (code: string) => void;

    /** Back to the welcome program */
    resetFreeCode: () => void;
}

export const useEditorStore = create<EditorStore>()(
    persist(
        (set) => ({
            freeCode: DEFAULT_FREE_CODE,

            setFreeCode: (freeCode) => {
                set({ freeCode });
            },

            resetFreeCode: () => {
                set({ freeCode: DEFAULT_FREE_CODE });
            },
        }),
        {
            name: 'editor-storage',
            storage: createJSONStorage(() => editorStorage),
            partialize: (state) => ({ freeCode: state.freeCode }),
        },
    ),
);
