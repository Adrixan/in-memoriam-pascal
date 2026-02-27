/**
 * HintSystem Component
 * 
 * Main hint container that manages progressive hint reveals.
 * Integrates with TutorialStore for state management.
 */

import { type ReactElement, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RetroPanel } from '@/components/common';
import HintDisplay from './HintDisplay';
import HintButton from './HintButton';
import type { Hint } from '@/types';
import type { AnalyzedError } from '@/services/validation/ErrorAnalyzer';

export interface HintSystemProps {
    /** Current level ID */
    levelId: string;
    /** Available hints for this level */
    hints: Hint[];
    /** Indices of revealed hints (0-based) */
    revealedHintIndices: number[];
    /** Remaining hint points */
    hintPoints: number;
    /** Analyzed error for context-aware hints */
    errorAnalysis?: AnalyzedError;
    /** Callback when a hint is revealed */
    onHintUsed: (hintIndex: number) => void;
    /** Whether hints should be shown */
    showError?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * HintSystem component
 * Manages the progressive reveal of hints with context-aware suggestions
 */
function HintSystem({
    levelId: _levelId,
    hints,
    revealedHintIndices,
    hintPoints,
    errorAnalysis,
    onHintUsed,
    showError = false,
    className = '',
}: HintSystemProps): ReactElement | null {
    const { t } = useTranslation();

    // Sort hints by level
    const sortedHints = useMemo(() => {
        return [...hints].sort((a, b) => a.level - b.level);
    }, [hints]);

    // Get next hint to reveal
    const nextHintIndex = useMemo(() => {
        for (let i = 0; i < sortedHints.length; i++) {
            if (!revealedHintIndices.includes(i)) {
                return i;
            }
        }
        return null;
    }, [sortedHints, revealedHintIndices]);

    // Check if all hints are revealed
    const allRevealed = nextHintIndex === null;

    // Get the next hint to potentially reveal
    const nextHint = nextHintIndex !== null ? sortedHints[nextHintIndex] : null;

    // Handle hint reveal
    const handleReveal = useCallback(() => {
        if (nextHintIndex !== null) {
            onHintUsed(nextHintIndex);
        }
    }, [nextHintIndex, onHintUsed]);

    // Don't render if no hints available or no error shown
    if (hints.length === 0 || (!showError && revealedHintIndices.length === 0)) {
        return null;
    }

    return (
        <RetroPanel
            variant="default"
            className={`hint-system p-4 ${className}`}
            aria-label={t('hints.section', 'Hinweise')}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-pixel text-sm text-[var(--color-secondary)]">
                    {t('hints.title', 'Hinweise')}
                </h3>
                <div className="font-terminal text-xs text-[var(--color-text-muted)]">
                    {t('hints.pointsRemaining', '{{count}} Punkte', { count: hintPoints })}
                </div>
            </div>

            {/* Error context (if available) */}
            {errorAnalysis && showError && (
                <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded">
                    <p className="font-terminal text-sm text-red-300">
                        {errorAnalysis.description}
                    </p>
                </div>
            )}

            {/* Revealed hints */}
            {revealedHintIndices.length > 0 && (
                <div className="revealed-hints mb-3">
                    {revealedHintIndices
                        .sort((a, b) => a - b)
                        .map((index) => {
                            const hint = sortedHints[index];
                            if (!hint) return null;
                            return (
                                <HintDisplay
                                    key={`hint-${index}`}
                                    hint={hint}
                                    animate={true}
                                />
                            );
                        })}
                </div>
            )}

            {/* Hint button for next hint */}
            {!allRevealed && nextHint && showError && (
                <HintButton
                    hintLevel={nextHint.level}
                    cost={nextHint.cost}
                    remainingPoints={hintPoints}
                    isRevealed={false}
                    onReveal={handleReveal}
                />
            )}

            {/* All hints revealed message */}
            {allRevealed && (
                <div className="mt-2 p-2 bg-[var(--crt-dark)] rounded border border-[var(--color-border)]">
                    <p className="font-terminal text-xs text-[var(--color-text-muted)]">
                        {t('hints.allRevealed', 'Alle Hinweise wurden angezeigt.')}
                    </p>
                </div>
            )}

            {/* Hint progress indicator */}
            <div className="mt-3 flex items-center gap-1">
                {sortedHints.map((hint, index) => (
                    <div
                        key={hint.level}
                        className={`
                            w-3 h-3 rounded-full border
                            ${revealedHintIndices.includes(index)
                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                                : 'bg-transparent border-[var(--color-border)]'
                            }
                        `}
                        aria-label={
                            revealedHintIndices.includes(index)
                                ? t('hints.revealed', 'Hinweis {{level}} angezeigt', { level: hint.level })
                                : t('hints.notRevealed', 'Hinweis {{level}} verfügbar', { level: hint.level })
                        }
                    />
                ))}
            </div>
        </RetroPanel>
    );
}

export default HintSystem;
