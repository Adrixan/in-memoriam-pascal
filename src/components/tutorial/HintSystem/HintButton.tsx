/**
 * HintButton Component
 * 
 * Retro-styled button to reveal the next hint.
 * Shows remaining hint points and requires confirmation before revealing.
 */

import { type ReactElement, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RetroButton } from '@/components/common';

export interface HintButtonProps {
    /** Hint level to reveal (1-based) */
    hintLevel: number;
    /** Cost in points for this hint (0 for first hint) */
    cost: number;
    /** Remaining hint points */
    remainingPoints: number;
    /** Whether this hint has already been revealed */
    isRevealed: boolean;
    /** Callback when user confirms hint reveal */
    onReveal: () => void;
    /** Whether the button should be disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * HintButton component
 * Displays a button to reveal a hint with confirmation dialog
 */
function HintButton({
    hintLevel,
    cost,
    remainingPoints,
    isRevealed,
    onReveal,
    disabled = false,
    className = '',
}: HintButtonProps): ReactElement | null {
    const { t } = useTranslation();
    const [showConfirmation, setShowConfirmation] = useState(false);

    const isFree = hintLevel === 1 || cost === 0;
    const canAfford = isFree || remainingPoints >= cost;
    const isDisabled = disabled || isRevealed || !canAfford;

    const handleClick = useCallback(() => {
        if (isFree) {
            // First hint is free, no confirmation needed
            onReveal();
        } else {
            // Show confirmation dialog for costly hints
            setShowConfirmation(true);
        }
    }, [isFree, onReveal]);

    const handleConfirm = useCallback(() => {
        setShowConfirmation(false);
        onReveal();
    }, [onReveal]);

    const handleCancel = useCallback(() => {
        setShowConfirmation(false);
    }, []);

    if (isRevealed) {
        return null;
    }

    return (
        <div className={`hint-button ${className}`}>
            {!showConfirmation ? (
                <RetroButton
                    variant={isFree ? 'secondary' : 'outline'}
                    onClick={handleClick}
                    disabled={isDisabled}
                    icon={<span aria-hidden="true">💡</span>}
                >
                    <span className="flex items-center gap-2">
                        <span>
                            {t('hints.showHint', { level: hintLevel })}
                        </span>
                        {!isFree && (
                            <span className="text-xs text-[var(--color-text-muted)]">
                                ({t('hints.cost', { count: cost })})
                            </span>
                        )}
                        {isFree && (
                            <span className="text-xs text-[var(--color-primary)]">
                                ({t('hints.free')})
                            </span>
                        )}
                    </span>
                </RetroButton>
            ) : (
                <div className="flex flex-col gap-2 p-3 bg-[var(--crt-dark)] rounded border border-[var(--color-border)]">
                    <p className="font-terminal text-sm text-[var(--color-text)]">
                        {t('hints.confirmMessage', { count: cost })}
                    </p>
                    <div className="flex gap-2">
                        <RetroButton
                            variant="primary"
                            onClick={handleConfirm}
                        >
                            {t('hints.confirm')}
                        </RetroButton>
                        <RetroButton
                            variant="ghost"
                            onClick={handleCancel}
                        >
                            {t('hints.cancel')}
                        </RetroButton>
                    </div>
                </div>
            )}

            {/* Remaining points indicator */}
            {!showConfirmation && (
                <div className="mt-2 font-terminal text-xs text-[var(--color-text-muted)]">
                    {t('hints.remainingPoints', { count: remainingPoints })}
                </div>
            )}
        </div>
    );
}

export default HintButton;
