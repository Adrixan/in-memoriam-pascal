/**
 * Integration tests for tutorialStore
 * Tests state management, actions, and persistence behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useTutorialStore } from '@/stores/tutorialStore';
import type { TutorialLevel } from '@/types';

// Mock the storage adapter
vi.mock('@/lib/storage', () => ({
    tutorialStorage: {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
    },
}));

describe('tutorialStore', () => {
    const mockLevels: TutorialLevel[] = [
        {
            id: 'level-1',
            number: 1,
            track: 'basic',
            titleKey: 'tutorial.level1.title',
            descriptionKey: 'tutorial.level1.description',
            objectives: ['objective1'],
            concepts: [],
            examples: [],
            starterCode: 'program Hello;',
            validation: [],
            hints: [
                { level: 1, contentKey: 'hint1', cost: 1 },
                { level: 2, contentKey: 'hint2', cost: 2 },
            ],
            estimatedTime: 10,
            prerequisites: [],
        },
        {
            id: 'level-2',
            number: 2,
            track: 'beginner',
            titleKey: 'tutorial.level2.title',
            descriptionKey: 'tutorial.level2.description',
            objectives: ['objective2'],
            concepts: [],
            examples: [],
            starterCode: 'program World;',
            validation: [],
            hints: [{ level: 1, contentKey: 'hint1', cost: 1 }],
            estimatedTime: 15,
            prerequisites: ['level-1'],
        },
    ];

    // Reset store to initial state before each test
    beforeEach(() => {
        act(() => {
            useTutorialStore.setState({
                levels: [],
                currentLevelId: null,
                progress: {},
                revealedHints: {},
                hintPoints: 3,
            });
        });
    });

    describe('initial state', () => {
        it('should have correct default values', () => {
            const state = useTutorialStore.getState();

            expect(state.levels).toEqual([]);
            expect(state.currentLevelId).toBeNull();
            expect(state.progress).toEqual({});
            expect(state.revealedHints).toEqual({});
            expect(state.hintPoints).toBe(3);
        });
    });

    describe('setLevels', () => {
        it('should set levels array', () => {
            act(() => {
                useTutorialStore.getState().setLevels(mockLevels);
            });

            expect(useTutorialStore.getState().levels).toEqual(mockLevels);
        });

        it('should replace existing levels', () => {
            act(() => {
                useTutorialStore.getState().setLevels(mockLevels);
            });

            const singleLevel: TutorialLevel[] = [mockLevels[0]!];
            act(() => {
                useTutorialStore.getState().setLevels(singleLevel);
            });

            expect(useTutorialStore.getState().levels).toHaveLength(1);
            expect(useTutorialStore.getState().levels[0]?.id).toBe('level-1');
        });
    });

    describe('setCurrentLevel', () => {
        beforeEach(() => {
            act(() => {
                useTutorialStore.getState().setLevels(mockLevels);
            });
        });

        it('should set current level ID', () => {
            act(() => {
                useTutorialStore.getState().setCurrentLevel('level-1');
            });

            expect(useTutorialStore.getState().currentLevelId).toBe('level-1');
        });

        it('should initialize progress for new level', () => {
            act(() => {
                useTutorialStore.getState().setCurrentLevel('level-1');
            });

            const progress = useTutorialStore.getState().progress['level-1'];
            expect(progress).toBeDefined();
            expect(progress?.status).toBe('in_progress');
            expect(progress?.levelId).toBe('level-1');
        });

        it('should not reinitialize progress for existing level', () => {
            // First set
            act(() => {
                useTutorialStore.getState().setCurrentLevel('level-1');
            });

            // Modify progress
            act(() => {
                useTutorialStore.getState().updateProgress('level-1', { attempts: 5 });
            });

            // Set again
            act(() => {
                useTutorialStore.getState().setCurrentLevel('level-1');
            });

            const progress = useTutorialStore.getState().progress['level-1'];
            expect(progress?.attempts).toBe(5);
        });

        it('should not set level if it does not exist', () => {
            act(() => {
                useTutorialStore.getState().setCurrentLevel('non-existent');
            });

            expect(useTutorialStore.getState().currentLevelId).toBeNull();
        });
    });

    describe('updateProgress', () => {
        it('should create progress entry if not exists', () => {
            act(() => {
                useTutorialStore.getState().updateProgress('level-1', { savedCode: 'test code' });
            });

            const progress = useTutorialStore.getState().progress['level-1'];
            expect(progress).toBeDefined();
            expect(progress?.savedCode).toBe('test code');
        });

        it('should update existing progress', () => {
            act(() => {
                useTutorialStore.getState().updateProgress('level-1', { attempts: 1 });
            });

            act(() => {
                useTutorialStore.getState().updateProgress('level-1', { attempts: 2 });
            });

            const progress = useTutorialStore.getState().progress['level-1'];
            expect(progress?.attempts).toBe(2);
        });

        it('should merge partial updates', () => {
            act(() => {
                useTutorialStore.getState().updateProgress('level-1', {
                    savedCode: 'first code',
                    attempts: 1
                });
            });

            act(() => {
                useTutorialStore.getState().updateProgress('level-1', { attempts: 2 });
            });

            const progress = useTutorialStore.getState().progress['level-1'];
            expect(progress?.savedCode).toBe('first code');
            expect(progress?.attempts).toBe(2);
        });

        it('should update lastAttemptAt timestamp', () => {
            const beforeTime = new Date().toISOString();

            act(() => {
                useTutorialStore.getState().updateProgress('level-1', { attempts: 1 });
            });

            const progress = useTutorialStore.getState().progress['level-1'];
            expect(progress?.lastAttemptAt).toBeDefined();
            // Timestamp should be >= beforeTime
            expect(new Date(progress!.lastAttemptAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime() - 1000);
        });
    });

    describe('markCompleted', () => {
        it('should mark level as completed', () => {
            act(() => {
                useTutorialStore.getState().updateProgress('level-1', { status: 'in_progress' });
            });

            act(() => {
                useTutorialStore.getState().markCompleted('level-1');
            });

            const progress = useTutorialStore.getState().progress['level-1'];
            expect(progress?.status).toBe('completed');
            expect(progress?.completedAt).toBeDefined();
        });

        it('should not modify progress if level has no progress', () => {
            act(() => {
                useTutorialStore.getState().markCompleted('non-existent');
            });

            expect(useTutorialStore.getState().progress['non-existent']).toBeUndefined();
        });
    });

    describe('resetProgress', () => {
        it('should reset all progress', () => {
            act(() => {
                useTutorialStore.getState().setLevels(mockLevels);
                useTutorialStore.getState().setCurrentLevel('level-1');
                useTutorialStore.getState().updateProgress('level-1', { attempts: 5 });
            });

            act(() => {
                useTutorialStore.getState().resetProgress();
            });

            const state = useTutorialStore.getState();
            expect(state.progress).toEqual({});
            expect(state.currentLevelId).toBeNull();
            expect(state.revealedHints).toEqual({});
            expect(state.hintPoints).toBe(3);
        });
    });

    describe('revealHint', () => {
        it('should reveal first hint for free', () => {
            act(() => {
                useTutorialStore.getState().revealHint('level-1', 0, 1);
            });

            const state = useTutorialStore.getState();
            expect(state.revealedHints['level-1']).toContain(0);
            expect(state.hintPoints).toBe(3); // No cost for first hint
        });

        it('should deduct points for subsequent hints', () => {
            act(() => {
                useTutorialStore.getState().revealHint('level-1', 0, 1);
            });

            act(() => {
                useTutorialStore.getState().revealHint('level-1', 1, 2);
            });

            const state = useTutorialStore.getState();
            expect(state.revealedHints['level-1']).toContain(1);
            expect(state.hintPoints).toBe(1); // 3 - 2 = 1
        });

        it('should not reveal hint if not enough points', () => {
            act(() => {
                useTutorialStore.setState({ hintPoints: 1 });
            });

            act(() => {
                useTutorialStore.getState().revealHint('level-1', 1, 2);
            });

            expect(useTutorialStore.getState().revealedHints['level-1']).toBeUndefined();
        });

        it('should not reveal same hint twice', () => {
            act(() => {
                useTutorialStore.getState().revealHint('level-1', 0, 1);
            });

            act(() => {
                useTutorialStore.getState().revealHint('level-1', 0, 1);
            });

            expect(useTutorialStore.getState().revealedHints['level-1']).toEqual([0]);
        });

        it('should sort revealed hints', () => {
            act(() => {
                useTutorialStore.getState().revealHint('level-1', 2, 1);
            });

            act(() => {
                useTutorialStore.getState().revealHint('level-1', 0, 1);
            });

            expect(useTutorialStore.getState().revealedHints['level-1']).toEqual([0, 2]);
        });
    });

    describe('resetHints', () => {
        it('should reset hints for a specific level', () => {
            act(() => {
                useTutorialStore.getState().revealHint('level-1', 0, 1);
                useTutorialStore.getState().revealHint('level-2', 0, 1);
            });

            act(() => {
                useTutorialStore.getState().resetHints('level-1');
            });

            const state = useTutorialStore.getState();
            expect(state.revealedHints['level-1']).toBeUndefined();
            expect(state.revealedHints['level-2']).toBeDefined();
        });
    });

    describe('getRevealedHints', () => {
        it('should return revealed hints for a level', () => {
            act(() => {
                useTutorialStore.getState().revealHint('level-1', 0, 1);
                useTutorialStore.getState().revealHint('level-1', 1, 1);
            });

            const hints = useTutorialStore.getState().getRevealedHints('level-1');
            expect(hints).toEqual([0, 1]);
        });

        it('should return empty array if no hints revealed', () => {
            const hints = useTutorialStore.getState().getRevealedHints('level-1');
            expect(hints).toEqual([]);
        });
    });

    describe('hasHintPoints', () => {
        it('should return true when enough points', () => {
            expect(useTutorialStore.getState().hasHintPoints(2)).toBe(true);
        });

        it('should return false when not enough points', () => {
            act(() => {
                useTutorialStore.setState({ hintPoints: 1 });
            });

            expect(useTutorialStore.getState().hasHintPoints(2)).toBe(false);
        });

        it('should return true when exactly enough points', () => {
            act(() => {
                useTutorialStore.setState({ hintPoints: 2 });
            });

            expect(useTutorialStore.getState().hasHintPoints(2)).toBe(true);
        });
    });

    describe('addHintPoints', () => {
        it('should add hint points', () => {
            act(() => {
                useTutorialStore.getState().addHintPoints(2);
            });

            expect(useTutorialStore.getState().hintPoints).toBe(5);
        });

        it('should accumulate points', () => {
            act(() => {
                useTutorialStore.getState().addHintPoints(1);
            });

            act(() => {
                useTutorialStore.getState().addHintPoints(2);
            });

            expect(useTutorialStore.getState().hintPoints).toBe(6);
        });
    });

    describe('state independence', () => {
        it('should maintain independent state for different levels', () => {
            act(() => {
                useTutorialStore.getState().setLevels(mockLevels);
                useTutorialStore.getState().setCurrentLevel('level-1');
                useTutorialStore.getState().updateProgress('level-1', { attempts: 3 });
                useTutorialStore.getState().setCurrentLevel('level-2');
            });

            const state = useTutorialStore.getState();
            expect(state.progress['level-1']?.attempts).toBe(3);
            expect(state.progress['level-2']?.status).toBe('in_progress');
            expect(state.currentLevelId).toBe('level-2');
        });
    });
});
