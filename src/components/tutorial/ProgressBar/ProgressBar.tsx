/**
 * ProgressBar Component - Retro progress indicator
 * 
 * Displays progress with authentic 80s styling:
 * - Terminal-style progress bar
 * - Optional animation
 * - Glow effect
 */

import { type ReactElement } from 'react';

export interface ProgressBarProps {
    /** Current progress value (0-100) */
    value: number;
    /** Maximum value (default: 100) */
    max?: number;
    /** Enable animated shine effect */
    animated?: boolean;
    /** Show percentage label */
    showLabel?: boolean;
    /** Label text */
    label?: string;
    /** Additional CSS classes */
    className?: string;
}

function ProgressBar({
    value,
    max = 100,
    animated = false,
    showLabel = true,
    label,
    className = '',
}: ProgressBarProps): ReactElement {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={`w-full ${className}`}>
            {/* Label */}
            {(showLabel || label) && (
                <div className="flex justify-between items-center mb-2">
                    {label && (
                        <span className="font-terminal text-sm text-[var(--color-text)]">
                            {label}
                        </span>
                    )}
                    {showLabel && (
                        <span
                            className="font-terminal text-sm text-[var(--color-primary)] terminal-glow"
                            aria-live="polite"
                        >
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            {/* Progress bar container */}
            <div
                className="retro-progress"
                role="progressbar"
                aria-valuenow={Math.round(percentage)}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={`retro-progress-bar ${animated ? 'retro-progress-animated' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default ProgressBar;
