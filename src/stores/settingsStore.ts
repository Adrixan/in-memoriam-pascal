/**
 * Settings Store - Manages user preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserSettings } from '@/types';
import { settingsStorage } from '@/lib/storage';

interface SettingsStore extends UserSettings {
    /** Set font size */
    setFontSize: (size: number) => void;

    /** Set editor theme */
    setTheme: (theme: UserSettings['theme']) => void;

    /** Toggle sound effects */
    toggleSound: () => void;

    /** Toggle reduced motion */
    toggleReducedMotion: () => void;

    /** Set language */
    setLanguage: (language: UserSettings['language']) => void;

    /** Reset to defaults */
    reset: () => void;
}

const defaultSettings: UserSettings = {
    fontSize: 14,
    theme: 'retro-green',
    soundEnabled: true,
    reducedMotion: false,
    language: 'de',
};

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            ...defaultSettings,

            setFontSize: (fontSize) => {
                set({ fontSize });
            },

            setTheme: (theme) => {
                set({ theme });
            },

            toggleSound: () => {
                set((state) => ({ soundEnabled: !state.soundEnabled }));
            },

            toggleReducedMotion: () => {
                set((state) => ({ reducedMotion: !state.reducedMotion }));
            },

            setLanguage: (language) => {
                set({ language });
            },

            reset: () => {
                set(defaultSettings);
            },
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => settingsStorage),
        }
    )
);
