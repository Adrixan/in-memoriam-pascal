/**
 * Tutorial Store - Manages tutorial progress and navigation
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TutorialLevel, LevelProgress } from '@/types';
import { tutorialStorage } from '@/lib/storage';

/** Default hint points for new users */
const DEFAULT_HINT_POINTS = 3;

interface TutorialState {
    /** All available levels */
    levels: TutorialLevel[];

    /** Current level ID */
    currentLevelId: string | null;

    /** Per-level progress */
    progress: Record<string, LevelProgress>;

    /** Revealed hints per level: levelId -> array of hint indices (0-based) */
    revealedHints: Record<string, number[]>;

    /** Remaining hint points */
    hintPoints: number;

    /** Actions */
    setLevels: (levels: TutorialLevel[]) => void;
    setCurrentLevel: (levelId: string) => void;
    recordAttempt: (levelId: string, code: string) => void;
    updateProgress: (levelId: string, progress: Partial<LevelProgress>) => void;
    saveCode: (levelId: string, code: string) => void;
    markCompleted: (levelId: string) => void;
    resetProgress: () => void;

    /** Hint actions */
    revealHint: (levelId: string, hintIndex: number, cost: number) => void;
    resetHints: (levelId: string) => void;
    getRevealedHints: (levelId: string) => number[];
    hasHintPoints: (cost: number) => boolean;
    addHintPoints: (points: number) => void;
}

const initialProgress: LevelProgress = {
    levelId: '',
    status: 'not_started',
    savedCode: '',
    hasSavedCode: false,
    attempts: 0,
    hintsUsed: [],
    lastAttemptAt: new Date().toISOString(),
};

export const useTutorialStore = create<TutorialState>()(
    persist(
        (set, get) => ({
            levels: [],
            currentLevelId: null,
            progress: {},
            revealedHints: {},
            hintPoints: DEFAULT_HINT_POINTS,

            setLevels: (levels) => {
                set({ levels });
            },

            setCurrentLevel: (levelId) => {
                const { levels, progress } = get();
                const level = levels.find((l) => l.id === levelId);

                if (!level) return;

                // Initialize progress if not exists
                if (!progress[levelId]) {
                    set({
                        currentLevelId: levelId,
                        progress: {
                            ...progress,
                            [levelId]: {
                                ...initialProgress,
                                levelId,
                                status: 'in_progress',
                                lastAttemptAt: new Date().toISOString(),
                            },
                        },
                    });
                } else {
                    set({ currentLevelId: levelId });
                }
            },

            recordAttempt: (levelId, code) => {
                const current = get().progress[levelId] ?? { ...initialProgress, levelId };
                set((state) => ({
                    progress: {
                        ...state.progress,
                        [levelId]: {
                            ...current,
                            savedCode: code,
                            attempts: current.attempts + 1,
                            status: current.status === 'completed' ? 'completed' : 'in_progress',
                            lastAttemptAt: new Date().toISOString(),
                            hasSavedCode: true,
                        },
                    },
                }));
            },

            updateProgress: (levelId, progressUpdate) => {
                const { progress } = get();
                const currentProgress = progress[levelId] || {
                    ...initialProgress,
                    levelId,
                };

                // If attempts is passed as 1, increment from current value
                const attemptsUpdate = progressUpdate.attempts === 1
                    ? { attempts: (currentProgress.attempts ?? 0) + 1 }
                    : progressUpdate.attempts !== undefined
                        ? { attempts: progressUpdate.attempts }
                        : {};

                set({
                    progress: {
                        ...progress,
                        [levelId]: {
                            ...currentProgress,
                            ...progressUpdate,
                            ...attemptsUpdate,
                            ...(Object.hasOwn(progressUpdate, 'savedCode') ? { hasSavedCode: true } : {}),
                            lastAttemptAt: new Date().toISOString(),
                        },
                    },
                });
            },

            saveCode: (levelId, code) => {
                set((state) => {
                    const current = state.progress[levelId] ?? { ...initialProgress, levelId };
                    return {
                        progress: {
                            ...state.progress,
                            [levelId]: { ...current, savedCode: code, hasSavedCode: true },
                        },
                    };
                });
            },

            markCompleted: (levelId) => {
                const { progress } = get();
                const currentProgress = progress[levelId];

                if (!currentProgress) return;

                set({
                    progress: {
                        ...progress,
                        [levelId]: {
                            ...currentProgress,
                            status: 'completed',
                            completedAt: new Date().toISOString(),
                            lastAttemptAt: new Date().toISOString(),
                        },
                    },
                });
            },

            resetProgress: () => {
                set({ progress: {}, currentLevelId: null, revealedHints: {}, hintPoints: DEFAULT_HINT_POINTS });
            },

            // Hint actions
            revealHint: (levelId, hintIndex, cost) => {
                const { revealedHints, hintPoints } = get();
                const currentRevealed = revealedHints[levelId] ?? [];

                // Don't reveal if already revealed or not enough points (first hint is free)
                if (currentRevealed.includes(hintIndex)) return;
                if (hintIndex > 0 && hintPoints < cost) return;

                const newHintPoints = hintIndex === 0 ? hintPoints : hintPoints - cost;

                set({
                    revealedHints: {
                        ...revealedHints,
                        [levelId]: [...currentRevealed, hintIndex].sort((a, b) => a - b),
                    },
                    hintPoints: newHintPoints,
                });
            },

            resetHints: (levelId) => {
                const { revealedHints } = get();
                const { [levelId]: _removed, ...remaining } = revealedHints;
                set({ revealedHints: remaining });
            },

            getRevealedHints: (levelId) => {
                return get().revealedHints[levelId] ?? [];
            },

            hasHintPoints: (cost) => {
                return get().hintPoints >= cost;
            },

            addHintPoints: (points) => {
                set((state) => ({ hintPoints: state.hintPoints + points }));
            },
        }),
        {
            name: 'tutorial-storage',
            storage: createJSONStorage(() => tutorialStorage),
            partialize: (state) => ({
                progress: state.progress,
                currentLevelId: state.currentLevelId,
                revealedHints: state.revealedHints,
                hintPoints: state.hintPoints,
            }),
        }
    )
);
