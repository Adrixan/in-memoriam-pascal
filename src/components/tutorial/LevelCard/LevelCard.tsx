/**
 * LevelCard Component - Individual level display card
 * 
 * Displays a single tutorial level with:
 * - Level number and title
 * - Completion status
 * - Active state styling
 * - Retro terminal aesthetic
 */

import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';

export interface LevelCardProps {
    /** Level ID (used in URL) */
    id: string;
    /** Level number for display */
    number: number;
    /** Level title translation key */
    titleKey: string;
    /** Whether this level is completed */
    isCompleted?: boolean;
    /** Whether this is the current active level */
    isActive?: boolean;
    /** Whether this level is locked/unavailable */
    isLocked?: boolean;
    /** Base path for tutorial routes */
    basePath?: string;
}

function LevelCard({
    id,
    number,
    titleKey,
    isCompleted = false,
    isActive = false,
    isLocked = false,
    basePath = '/tutorial',
}: LevelCardProps): ReactElement {
    const cardClasses = [
        'retro-card',
        'p-4',
        'cursor-pointer',
        'transition-all',
        isActive && 'retro-card-active',
        isLocked && 'opacity-50 cursor-not-allowed',
    ]
        .filter(Boolean)
        .join(' ');

    const statusIcon = isCompleted ? (
        <span className="text-[var(--color-primary)] terminal-glow" aria-label="Completed">
            [✓]
        </span>
    ) : isLocked ? (
        <span className="text-[var(--color-text-dim)]" aria-label="Locked">
            [🔒]
        </span>
    ) : isActive ? (
        <span className="text-[var(--color-secondary)] terminal-glow-amber" aria-label="Current">
            [▶]
        </span>
    ) : (
        <span className="text-[var(--color-text-muted)]" aria-label="Not started">
            [ ]
        </span>
    );

    const content = (
        <div className={cardClasses}>
            <div className="flex items-center gap-3">
                {/* Status icon */}
                <div className="flex-shrink-0 font-terminal text-lg">
                    {statusIcon}
                </div>

                {/* Level info */}
                <div className="flex-grow min-w-0">
                    <div className="font-terminal text-sm text-[var(--color-text-muted)] mb-1">
                        {`LEVEL ${number.toString().padStart(2, '0')}`}
                    </div>
                    <div
                        className={`font-terminal text-lg truncate ${isActive
                                ? 'text-[var(--color-primary)] terminal-glow'
                                : 'text-[var(--color-text)]'
                            }`}
                    >
                        {titleKey}
                    </div>
                </div>

                {/* Arrow indicator */}
                {!isLocked && (
                    <div className="flex-shrink-0 font-terminal text-[var(--color-primary)]">
                        {'>'}
                    </div>
                )}
            </div>
        </div>
    );

    if (isLocked) {
        return (
            <div aria-disabled="true" aria-label={`Level ${number}: ${titleKey} (Locked)`}>
                {content}
            </div>
        );
    }

    return (
        <Link
            to={`${basePath}/${id}`}
            aria-current={isActive ? 'step' : undefined}
            aria-label={`Level ${number}: ${titleKey}${isCompleted ? ' (Completed)' : ''}`}
        >
            {content}
        </Link>
    );
}

export default LevelCard;
