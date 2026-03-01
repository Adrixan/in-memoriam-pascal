/**
 * CRTOverlay Component - Optional CRT scanline effect overlay
 * 
 * Provides authentic 80s CRT monitor visual effects:
 * - Scanlines
 * - Screen glow
 * - Optional flicker
 * 
 * Accessibility: Respects prefers-reduced-motion
 */

import { type ReactElement, type ReactNode } from 'react';

export interface CRTOverlayProps {
    /** Enable scanline effect */
    scanlines?: boolean;
    /** Enable screen glow effect */
    glow?: boolean;
    /** Enable subtle flicker animation */
    flicker?: boolean;
    /** Child content to wrap */
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}

function CRTOverlay({
    scanlines = true,
    glow = false,
    flicker = false,
    children,
    className = '',
}: CRTOverlayProps): ReactElement {
    const classes = [
        'relative',
        scanlines && 'crt-scanlines',
        glow && 'crt-glow',
        flicker && 'crt-flicker',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes}>
            {children}
        </div>
    );
}

export default CRTOverlay;
