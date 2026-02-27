/**
 * Integration tests for editorStore
 * Tests state management, actions, and persistence behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useEditorStore } from '@/stores/editorStore';

// Mock the storage adapter
vi.mock('@/lib/storage', () => ({
    editorStorage: {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
    },
}));

describe('editorStore', () => {
    // Reset store to initial state before each test
    beforeEach(() => {
        act(() => {
            useEditorStore.setState({
                code: '',
                currentLevelId: null,
                isReady: false,
                cursorPosition: { line: 1, column: 1 },
            });
        });
    });

    describe('initial state', () => {
        it('should have correct default values', () => {
            const state = useEditorStore.getState();

            expect(state.code).toBe('');
            expect(state.currentLevelId).toBeNull();
            expect(state.isReady).toBe(false);
            expect(state.cursorPosition).toEqual({ line: 1, column: 1 });
        });
    });

    describe('setCode', () => {
        it('should update code content', () => {
            act(() => {
                useEditorStore.getState().setCode('program test;');
            });

            expect(useEditorStore.getState().code).toBe('program test;');
        });

        it('should replace existing code', () => {
            act(() => {
                useEditorStore.getState().setCode('first code');
            });

            act(() => {
                useEditorStore.getState().setCode('second code');
            });

            expect(useEditorStore.getState().code).toBe('second code');
        });

        it('should handle empty string', () => {
            act(() => {
                useEditorStore.getState().setCode('some code');
            });

            act(() => {
                useEditorStore.getState().setCode('');
            });

            expect(useEditorStore.getState().code).toBe('');
        });

        it('should handle multiline code', () => {
            const multilineCode = `program HelloWorld;
begin
  WriteLn('Hello, World!');
end.`;

            act(() => {
                useEditorStore.getState().setCode(multilineCode);
            });

            expect(useEditorStore.getState().code).toBe(multilineCode);
        });
    });

    describe('setCurrentLevelId', () => {
        it('should set current level ID', () => {
            act(() => {
                useEditorStore.getState().setCurrentLevelId('level-1');
            });

            expect(useEditorStore.getState().currentLevelId).toBe('level-1');
        });

        it('should allow null value', () => {
            act(() => {
                useEditorStore.getState().setCurrentLevelId('level-1');
            });

            act(() => {
                useEditorStore.getState().setCurrentLevelId(null);
            });

            expect(useEditorStore.getState().currentLevelId).toBeNull();
        });
    });

    describe('setReady', () => {
        it('should set ready state to true', () => {
            act(() => {
                useEditorStore.getState().setReady(true);
            });

            expect(useEditorStore.getState().isReady).toBe(true);
        });

        it('should set ready state to false', () => {
            act(() => {
                useEditorStore.getState().setReady(true);
            });

            act(() => {
                useEditorStore.getState().setReady(false);
            });

            expect(useEditorStore.getState().isReady).toBe(false);
        });
    });

    describe('setCursorPosition', () => {
        it('should update cursor position', () => {
            act(() => {
                useEditorStore.getState().setCursorPosition(5, 10);
            });

            expect(useEditorStore.getState().cursorPosition).toEqual({ line: 5, column: 10 });
        });

        it('should replace previous cursor position', () => {
            act(() => {
                useEditorStore.getState().setCursorPosition(1, 1);
            });

            act(() => {
                useEditorStore.getState().setCursorPosition(20, 15);
            });

            expect(useEditorStore.getState().cursorPosition).toEqual({ line: 20, column: 15 });
        });
    });

    describe('reset', () => {
        it('should reset all state to initial values', () => {
            // Set various state values
            act(() => {
                useEditorStore.getState().setCode('some code');
                useEditorStore.getState().setCurrentLevelId('level-5');
                useEditorStore.getState().setReady(true);
                useEditorStore.getState().setCursorPosition(10, 20);
            });

            // Reset
            act(() => {
                useEditorStore.getState().reset();
            });

            const state = useEditorStore.getState();
            expect(state.code).toBe('');
            expect(state.currentLevelId).toBeNull();
            expect(state.isReady).toBe(false);
            expect(state.cursorPosition).toEqual({ line: 1, column: 1 });
        });
    });

    describe('state independence', () => {
        it('should not affect other state when updating single property', () => {
            act(() => {
                useEditorStore.getState().setCode('test code');
                useEditorStore.getState().setReady(true);
            });

            act(() => {
                useEditorStore.getState().setCursorPosition(5, 5);
            });

            const state = useEditorStore.getState();
            expect(state.code).toBe('test code');
            expect(state.isReady).toBe(true);
            expect(state.cursorPosition).toEqual({ line: 5, column: 5 });
        });
    });
});
