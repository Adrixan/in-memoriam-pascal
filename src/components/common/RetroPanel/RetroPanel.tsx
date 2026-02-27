/**
 * RetroPanel Component - Retro-styled container panel
 * 
 * Provides authentic 80s terminal-style panels with:
 * - Optional glow border
 * - Terminal-style header bar
 * - Various visual variants
 */

import { type ReactElement, type HTMLAttributes } from 'react';

export type RetroPanelVariant = 'default' | 'glow' | 'terminal' | 'header';

export interface RetroPanelProps extends HTMLAttributes<HTMLDivElement> {
    /** Panel visual variant */
    variant?: RetroPanelVariant;
    /** Panel title (shown in terminal variant) */
    title?: string;
    /** Enable glow effect on hover */
    hoverGlow?: boolean;
    /** Child content */
    children: React.ReactNode;
}

function RetroPanel({
    variant = 'default',
    title,
    hoverGlow = false,
    children,
    className = '',
    ...props
}: RetroPanelProps): ReactElement {
    const baseClasses = 'retro-panel';

    const variantClasses: Record<RetroPanelVariant, string> = {
        default: '',
        glow: 'retro-panel-glow',
        terminal: 'retro-panel-terminal',
        header: 'retro-panel-header',
    };

    const classes = [
        baseClasses,
        variantClasses[variant],
        hoverGlow && 'hover:shadow-glow-green transition-shadow',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    // Terminal variant has a header bar
    if (variant === 'terminal') {
        return (
            <div className={classes} {...props}>
                {title && (
                    <div
                        className="absolute top-0 left-0 right-0 h-6 flex items-center px-3 text-sm font-terminal text-[var(--color-primary)]"
                        style={{
                            background: 'var(--color-surface-light)',
                            borderBottom: '1px solid var(--color-border)',
                            marginTop: 0,
                            paddingTop: '2px',
                        }}
                    >
                        <span className="terminal-glow">{title}</span>
                    </div>
                )}
                <div
                    className={title ? 'pt-8' : ''}
                    style={{ minHeight: title ? 'calc(100% - 24px)' : '100%' }}
                >
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}

export default RetroPanel;
