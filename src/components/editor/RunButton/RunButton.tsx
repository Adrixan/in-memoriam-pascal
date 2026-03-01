/**
 * RunButton Component
 * Retro-styled button to execute Pascal code
 */

import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the RunButton component
 */
export interface RunButtonProps {
    /** Callback when button is clicked */
    onRun: () => void;

    /** Whether code is currently running */
    isRunning?: boolean;

    /** Whether button is disabled */
    disabled?: boolean;

    /** Whether interpreter is ready */
    isReady?: boolean;

    /** Additional CSS classes */
    className?: string;
}

/**
 * RunButton Component
 *
 * A retro-styled button for executing Pascal code with:
 * - Loading spinner during execution
 * - Disabled state when interpreter not ready
 * - Keyboard accessible
 * - German localization
 */
export function RunButton({
    onRun,
    isRunning = false,
    disabled = false,
    isReady = true,
    className = '',
}: RunButtonProps): ReactElement {
    const { t } = useTranslation();

    const handleClick = (): void => {
        if (!disabled && !isRunning && isReady) {
            onRun();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent): void => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
        }
    };

    const isDisabled = disabled || isRunning || !isReady;

    return (
        <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            className={`
                run-button
                inline-flex items-center justify-center gap-2
                px-4 py-3
                min-h-11
                font-mono text-sm font-bold
                border-2 border-[var(--retro-green)]
                bg-[var(--color-surface)]
                text-[var(--retro-green)]
                rounded
                transition-all duration-200
                hover:bg-[var(--retro-green)] hover:text-[var(--color-surface)]
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-[var(--retro-green)] focus:ring-offset-2
                ${isRunning ? 'animate-pulse' : ''}
                ${className}
            `}
            aria-label={isRunning ? t('editor.running') : t('editor.run')}
            aria-busy={isRunning}
            aria-disabled={isDisabled}
        >
            {/* Play/Loading Icon */}
            {isRunning ? (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            ) : (
                <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M8 5v14l11-7z" />
                </svg>
            )}

            {/* Button Text */}
            <span className="terminal-glow">
                {isRunning
                    ? t('editor.running')
                    : !isReady
                        ? t('editor.loading')
                        : t('editor.run')}
            </span>
        </button>
    );
}

export default RunButton;
