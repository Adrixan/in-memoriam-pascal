/**
 * RetroButton Component - Retro-styled button
 * 
 * Provides authentic 80s terminal-style buttons with:
 * - Multiple color variants (primary, secondary, accent)
 * - Glow effects on hover
 * - Ghost variant for minimal styling
 * - Full accessibility support
 * 
 * Touch-friendly: min 44x44px
 */

import { type ReactElement, type ButtonHTMLAttributes, forwardRef } from 'react';

export type RetroButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';

export interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button visual variant */
    variant?: RetroButtonVariant;
    /** Enable pulse glow animation */
    pulseGlow?: boolean;
    /** Icon to display before text */
    icon?: React.ReactNode;
    /** Icon to display after text */
    iconAfter?: React.ReactNode;
    /** Full width button */
    fullWidth?: boolean;
}

const RetroButton = forwardRef<HTMLButtonElement, RetroButtonProps>(
    (
        {
            variant = 'primary',
            pulseGlow = false,
            icon,
            iconAfter,
            fullWidth = false,
            children,
            className = '',
            disabled,
            ...props
        },
        ref
    ): ReactElement => {
        const baseClasses = 'retro-btn';

        const variantClasses: Record<RetroButtonVariant, string> = {
            primary: 'retro-btn-primary',
            secondary: 'retro-btn-secondary',
            accent: 'retro-btn-accent',
            ghost: 'retro-btn-ghost',
            outline: '', // Uses base retro-btn styles
        };

        const classes = [
            baseClasses,
            variantClasses[variant],
            pulseGlow && 'animate-pulse-glow',
            fullWidth && 'w-full',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled}
                {...props}
            >
                {icon && <span className="flex-shrink-0">{icon}</span>}
                {children}
                {iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
            </button>
        );
    }
);

RetroButton.displayName = 'RetroButton';

export default RetroButton;
