/**
 * Integration tests for editorStore (the free editor's program)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

vi.mock('@/lib/storage', () => ({
    editorStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    },
}));

import { DEFAULT_FREE_CODE, useEditorStore } from '@/stores/editorStore';

describe('editorStore', () => {
    beforeEach(() => {
        act(() => {
            useEditorStore.getState().resetFreeCode();
        });
    });

    it('starts with the welcome program', () => {
        expect(useEditorStore.getState().freeCode).toBe(DEFAULT_FREE_CODE);
    });

    it('stores the code the user writes', () => {
        act(() => {
            useEditorStore.getState().setFreeCode("program X; begin WriteLn('x'); end.");
        });
        expect(useEditorStore.getState().freeCode).toContain('program X');
    });

    it('can be reset to the welcome program', () => {
        act(() => {
            useEditorStore.getState().setFreeCode('something else');
            useEditorStore.getState().resetFreeCode();
        });
        expect(useEditorStore.getState().freeCode).toBe(DEFAULT_FREE_CODE);
    });
});
