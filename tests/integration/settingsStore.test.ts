/**
 * Integration tests for settingsStore
 * Tests state management, actions, and persistence behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { UserSettings } from '@/types';

// Mock the storage adapter
vi.mock('@/lib/storage', () => ({
    settingsStorage: {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
    },
}));

describe('settingsStore', () => {
    const defaultSettings: UserSettings = {
        fontSize: 14,
        theme: 'retro-green',
        soundEnabled: true,
        reducedMotion: false,
        language: 'de',
    };

    // Reset store to initial state before each test
    beforeEach(() => {
        act(() => {
            useSettingsStore.setState(defaultSettings);
        });
    });

    describe('initial state', () => {
        it('should have correct default values', () => {
            const state = useSettingsStore.getState();

            expect(state.fontSize).toBe(14);
            expect(state.theme).toBe('retro-green');
            expect(state.soundEnabled).toBe(true);
            expect(state.reducedMotion).toBe(false);
            expect(state.language).toBe('de');
        });
    });

    describe('setFontSize', () => {
        it('should update font size', () => {
            act(() => {
                useSettingsStore.getState().setFontSize(18);
            });

            expect(useSettingsStore.getState().fontSize).toBe(18);
        });

        it('should allow minimum font size', () => {
            act(() => {
                useSettingsStore.getState().setFontSize(10);
            });

            expect(useSettingsStore.getState().fontSize).toBe(10);
        });

        it('should allow larger font sizes', () => {
            act(() => {
                useSettingsStore.getState().setFontSize(24);
            });

            expect(useSettingsStore.getState().fontSize).toBe(24);
        });
    });

    describe('setTheme', () => {
        it('should update theme to retro-amber', () => {
            act(() => {
                useSettingsStore.getState().setTheme('retro-amber');
            });

            expect(useSettingsStore.getState().theme).toBe('retro-amber');
        });

        it('should update theme to retro-cyan', () => {
            act(() => {
                useSettingsStore.getState().setTheme('retro-cyan');
            });

            expect(useSettingsStore.getState().theme).toBe('retro-cyan');
        });

        it('should update theme back to retro-green', () => {
            act(() => {
                useSettingsStore.getState().setTheme('retro-amber');
            });

            act(() => {
                useSettingsStore.getState().setTheme('retro-green');
            });

            expect(useSettingsStore.getState().theme).toBe('retro-green');
        });
    });

    describe('toggleSound', () => {
        it('should toggle sound from enabled to disabled', () => {
            expect(useSettingsStore.getState().soundEnabled).toBe(true);

            act(() => {
                useSettingsStore.getState().toggleSound();
            });

            expect(useSettingsStore.getState().soundEnabled).toBe(false);
        });

        it('should toggle sound from disabled to enabled', () => {
            act(() => {
                useSettingsStore.getState().toggleSound();
            });

            expect(useSettingsStore.getState().soundEnabled).toBe(false);

            act(() => {
                useSettingsStore.getState().toggleSound();
            });

            expect(useSettingsStore.getState().soundEnabled).toBe(true);
        });

        it('should not affect other settings when toggling', () => {
            act(() => {
                useSettingsStore.getState().setFontSize(20);
                useSettingsStore.getState().setTheme('retro-amber');
            });

            act(() => {
                useSettingsStore.getState().toggleSound();
            });

            const state = useSettingsStore.getState();
            expect(state.fontSize).toBe(20);
            expect(state.theme).toBe('retro-amber');
            expect(state.soundEnabled).toBe(false);
        });
    });

    describe('toggleReducedMotion', () => {
        it('should toggle reduced motion from false to true', () => {
            expect(useSettingsStore.getState().reducedMotion).toBe(false);

            act(() => {
                useSettingsStore.getState().toggleReducedMotion();
            });

            expect(useSettingsStore.getState().reducedMotion).toBe(true);
        });

        it('should toggle reduced motion from true to false', () => {
            act(() => {
                useSettingsStore.getState().toggleReducedMotion();
            });

            act(() => {
                useSettingsStore.getState().toggleReducedMotion();
            });

            expect(useSettingsStore.getState().reducedMotion).toBe(false);
        });
    });

    describe('setLanguage', () => {
        it('should update language', () => {
            act(() => {
                useSettingsStore.getState().setLanguage('de');
            });

            expect(useSettingsStore.getState().language).toBe('de');
        });
    });

    describe('reset', () => {
        it('should reset all settings to defaults', () => {
            // Modify all settings
            act(() => {
                useSettingsStore.getState().setFontSize(24);
                useSettingsStore.getState().setTheme('retro-amber');
                useSettingsStore.getState().toggleSound();
                useSettingsStore.getState().toggleReducedMotion();
            });

            // Reset
            act(() => {
                useSettingsStore.getState().reset();
            });

            const state = useSettingsStore.getState();
            expect(state.fontSize).toBe(14);
            expect(state.theme).toBe('retro-green');
            expect(state.soundEnabled).toBe(true);
            expect(state.reducedMotion).toBe(false);
            expect(state.language).toBe('de');
        });
    });

    describe('state independence', () => {
        it('should maintain independent state for each setting', () => {
            act(() => {
                useSettingsStore.getState().setFontSize(16);
            });

            act(() => {
                useSettingsStore.getState().setTheme('retro-cyan');
            });

            act(() => {
                useSettingsStore.getState().toggleSound();
            });

            const state = useSettingsStore.getState();
            expect(state.fontSize).toBe(16);
            expect(state.theme).toBe('retro-cyan');
            expect(state.soundEnabled).toBe(false);
            expect(state.reducedMotion).toBe(false);
            expect(state.language).toBe('de');
        });
    });
});
