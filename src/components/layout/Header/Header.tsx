/**
 * Header Component - Navigation and branding
 * 
 * Retro 80s styled header with:
 * - Animated logo with glow effect
 * - Terminal-style navigation
 * - Mobile hamburger menu
 * - Full accessibility support
 */

import { type ReactElement, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Header(): ReactElement {
    const { t } = useTranslation('common');
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen((prev) => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    return (
        <header
            className="border-b-2 border-[var(--color-primary)] bg-[var(--crt-dark)]"
            role="banner"
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 group"
                        aria-label={t('app.title')}
                    >
                        {/* Terminal prompt prefix */}
                        <span
                            className="font-terminal text-[var(--color-primary)] text-2xl terminal-glow group-hover:animate-pulse"
                            aria-hidden="true"
                        >
                            {'>'}_
                        </span>
                        {/* App title */}
                        <span
                            className="font-pixel text-[var(--color-primary)] text-sm terminal-glow group-hover:animate-pulse"
                        >
                            {t('app.title')}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav
                        className="hidden md:flex items-center gap-1"
                        aria-label="Main navigation"
                    >
                        <Link
                            to="/"
                            className={`retro-nav-link ${isActive('/') ? 'retro-nav-link-active' : ''}`}
                            aria-current={isActive('/') ? 'page' : undefined}
                        >
                            {t('navigation.home')}
                        </Link>
                        <Link
                            to="/tutorial/level-1"
                            className={`retro-nav-link ${location.pathname.startsWith('/tutorial') ? 'retro-nav-link-active' : ''}`}
                            aria-current={location.pathname.startsWith('/tutorial') ? 'page' : undefined}
                        >
                            {t('navigation.tutorial', 'Tutorial')}
                        </Link>
                        <Link
                            to="/editor"
                            className={`retro-nav-link ${isActive('/editor') ? 'retro-nav-link-active' : ''}`}
                            aria-current={isActive('/editor') ? 'page' : undefined}
                        >
                            {t('navigation.editor', 'Editor')}
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="md:hidden retro-btn px-3 py-2"
                        onClick={toggleMobileMenu}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobile-menu"
                        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {/* Hamburger icon */}
                        <span className="flex flex-col gap-1" aria-hidden="true">
                            <span
                                className={`block w-5 h-0.5 bg-[var(--color-primary)] transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                                    }`}
                            />
                            <span
                                className={`block w-5 h-0.5 bg-[var(--color-primary)] transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''
                                    }`}
                            />
                            <span
                                className={`block w-5 h-0.5 bg-[var(--color-primary)] transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                                    }`}
                            />
                        </span>
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav
                    id="mobile-menu"
                    className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-48 pb-4' : 'max-h-0'
                        }`}
                    aria-label="Mobile navigation"
                    aria-hidden={!isMobileMenuOpen}
                >
                    <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                        <Link
                            to="/"
                            className={`retro-nav-link ${isActive('/') ? 'retro-nav-link-active' : ''}`}
                            onClick={closeMobileMenu}
                            aria-current={isActive('/') ? 'page' : undefined}
                        >
                            {t('navigation.home')}
                        </Link>
                        <Link
                            to="/tutorial/level-1"
                            className={`retro-nav-link ${location.pathname.startsWith('/tutorial') ? 'retro-nav-link-active' : ''}`}
                            onClick={closeMobileMenu}
                            aria-current={location.pathname.startsWith('/tutorial') ? 'page' : undefined}
                        >
                            {t('navigation.tutorial', 'Tutorial')}
                        </Link>
                        <Link
                            to="/editor"
                            className={`retro-nav-link ${isActive('/editor') ? 'retro-nav-link-active' : ''}`}
                            onClick={closeMobileMenu}
                            aria-current={isActive('/editor') ? 'page' : undefined}
                        >
                            {t('navigation.editor', 'Editor')}
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Decorative scanline effect */}
            <div
                className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-primary)] opacity-30"
                aria-hidden="true"
            />
        </header>
    );
}

export default Header;
