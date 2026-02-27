/**
 * Main Application Component
 */

import { Suspense, lazy, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const TutorialPage = lazy(() => import('@/pages/TutorialPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Layout components
import Layout from '@/components/layout/Layout/Layout';

// Loading fallback component
function LoadingFallback() {
    const { t } = useTranslation('common');

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
                <div className="animate-pulse text-2xl font-mono text-[var(--color-primary)]">
                    {t('status.loading')}
                </div>
            </div>
        </div>
    );
}

// Error boundary component
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Log the error for debugging
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error stack:', error.stack);
        return { hasError: true, error };
    }

    override componentDidCatch(_error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    override render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-[var(--retro-amber)] mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-[var(--color-text-muted)] mb-4">
                            Please refresh the page to try again.
                        </p>
                        <details className="text-left text-sm text-[var(--color-text-muted)] bg-gray-900 p-4 rounded max-w-2xl overflow-auto">
                            <summary className="cursor-pointer font-bold mb-2">Error Details</summary>
                            <pre className="whitespace-pre-wrap">{this.state.error?.message}</pre>
                            <pre className="whitespace-pre-wrap mt-2 text-xs">{this.state.error?.stack}</pre>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/tutorial/:levelId" element={<TutorialPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </Suspense>
                </Layout>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
