/**
 * Not Found Page - 404 error page
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function NotFoundPage() {
    const { t } = useTranslation('common');

    return (
        <main className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-6xl font-bold text-[var(--retro-amber)] mb-4">
                404
            </h1>
            <p className="text-xl text-[var(--color-text-muted)] mb-8">
                Page not found
            </p>
            <Link
                to="/"
                className="inline-block px-6 py-3 bg-[var(--color-primary)] text-[var(--terminal-bg)] font-bold rounded hover:opacity-90 transition-opacity"
            >
                {t('navigation.home')}
            </Link>
        </main>
    );
}

export default NotFoundPage;