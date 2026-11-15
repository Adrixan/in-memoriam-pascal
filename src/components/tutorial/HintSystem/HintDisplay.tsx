/**
 * HintDisplay Component
 * 
 * Displays an individual hint with appropriate styling based on hint type.
 * Supports gentle, specific, and detailed hint levels with animations.
 */

import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { Hint } from '@/types';

export interface HintDisplayProps {
    /** The hint to display */
    hint: Hint;
    /** Whether to show animation on reveal */
    animate?: boolean;
    /** Additional CSS classes */
    className?: string;
}

type HintKind = NonNullable<Hint['type']>;

/** Hints without an explicit type take it from their level. */
function hintKind(hint: Hint): HintKind {
    return hint.type ?? (hint.level === 1 ? 'gentle' : hint.level === 2 ? 'specific' : 'detailed');
}

const HINT_STYLES: Record<HintKind, { borderColor: string; bgColor: string; icon: string }> = {
    gentle: { borderColor: 'border-[var(--color-primary)]', bgColor: 'bg-[var(--crt-dark)]', icon: '💡' },
    specific: { borderColor: 'border-[var(--color-secondary)]', bgColor: 'bg-[var(--crt-dark)]', icon: '🔍' },
    detailed: { borderColor: 'border-yellow-500', bgColor: 'bg-[var(--crt-dark)]', icon: '📖' },
};

/**
 * HintDisplay component
 * Renders a single hint with appropriate styling and optional code example
 */
function HintDisplay({ hint, animate = true, className = '' }: HintDisplayProps): ReactElement {
    const { t } = useTranslation();
    const kind = hintKind(hint);
    const style = HINT_STYLES[kind];
    const kindLabel = {
        gentle: t('hints.kind.gentle'),
        specific: t('hints.kind.specific'),
        detailed: t('hints.kind.detailed'),
    }[kind];

    return (
        <div
            className={`
                ${style.bgColor}
                ${style.borderColor}
                border-l-4
                rounded-r
                p-3
                mb-2
                ${animate ? 'animate-fadeIn' : ''}
                ${className}
            `}
            role="article"
            aria-label={t('hints.levelAria', { level: hint.level })}
        >
            {/* Hint header */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" aria-hidden="true">
                    {style.icon}
                </span>
                <span className="font-pixel text-xs text-[var(--color-text-muted)]">
                    {t('hints.levelLabel', { level: hint.level })}: {kindLabel}
                </span>
            </div>

            {/* Hint title (if available) */}
            {hint.titleKey && (
                <h4 className="font-pixel text-sm text-[var(--color-primary)] mb-1">
                    {t(`levels:${hint.titleKey}`, hint.titleKey)}
                </h4>
            )}

            {/* Hint content */}
            <p className="font-terminal text-[var(--color-text)] leading-relaxed">
                {t(`errors:${hint.contentKey}`, hint.contentKey)}
            </p>

            {/* Code example (if available) */}
            {hint.codeExample && (
                <pre className="mt-3 p-2 bg-black/30 rounded border border-[var(--color-border)] font-mono text-sm overflow-x-auto">
                    <code className="text-[var(--color-primary)]">{hint.codeExample}</code>
                </pre>
            )}
        </div>
    );
}

export default HintDisplay;
