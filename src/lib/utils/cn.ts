/**
 * Utility function to merge class names
 * Simple implementation - can be replaced with clsx or tailwind-merge if needed
 */

type ClassValue = string | undefined | null | false;

export function cn(...classes: ClassValue[]): string {
    return classes.filter(Boolean).join(' ');
}
