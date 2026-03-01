/**
 * Layout Component - Main application layout wrapper
 * 
 * Provides:
 * - Skip link for accessibility
 * - Header with navigation
 * - Main content area
 * - Footer with retro styling
 */

import type { ReactNode, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../Header';

interface LayoutProps {
    children: ReactNode;
}

function Layout({ children }: LayoutProps): ReactElement {
    const { t } = useTranslation('common');

    return (
        <div className="min-h-screen bg-[var(--crt-black)] text-[var(--color-text)] flex flex-col overflow-x-hidden">
            {/* Skip link for accessibility */}
            <a
                href="#main-content"
                className="skip-link"
            >
                {t('accessibility.skipToContent', 'Skip to content')}
            </a>

            {/* Header */}
            <Header />

            {/* Main content */}
            <div id="main-content" className="flex-grow">
                {children}
            </div>

            {/* Footer */}
            <footer
                className="border-t-2 border-[var(--color-primary)] bg-[var(--crt-dark)] py-6 mt-auto"
                role="contentinfo"
            >
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Copyright */}
                        <p className="font-terminal text-sm text-[var(--color-text-muted)]">
                            © 2026 In Memoriam Pascal
                        </p>

                        {/* Tagline */}
                        <p className="font-terminal text-sm text-[var(--color-primary)] terminal-glow">
                            {t('footer.tagline', 'Turbo Pascal • 1983 • Forever in our hearts')}
                        </p>

                        {/* Links */}
                        <nav aria-label="Footer navigation">
                            <ul className="flex items-center gap-4">
                                <li>
                                    <a
                                        href="https://github.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-terminal text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        GitHub
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* Decorative element */}
                    <div
                        className="mt-4 pt-4 border-t border-[var(--color-border)] text-center"
                        aria-hidden="true"
                    >
                        <span className="font-terminal text-xs text-[var(--color-text-dim)]">
                            C:\TURBO\PASCAL{'>'}_
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Layout;
