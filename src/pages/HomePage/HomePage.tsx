/**
 * Home Page - Entry point for the application
 * 
 * Retro 80s styled landing page with:
 * - Hero section with Pascal historical context
 * - Animated terminal-style introduction
 * - Feature highlights
 * - Responsive design
 */

import { type ReactElement, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RetroButton, RetroPanel } from '@/components/common';

/**
 * TypingEffect Component - Animates text like a terminal
 */
function TypingEffect({
    text,
    speed = 50,
    className = ''
}: {
    text: string;
    speed?: number;
    className?: string;
}): ReactElement {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let index = 0;
        setDisplayedText('');
        setIsComplete(false);

        const timer = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1));
                index++;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return (
        <span className={className}>
            {displayedText}
            {!isComplete && (
                <span className="cursor-blink" aria-hidden="true">_</span>
            )}
        </span>
    );
}

/**
 * Feature Card Component
 */
function FeatureCard({
    icon,
    title,
    description
}: {
    icon: string;
    title: string;
    description: string;
}): ReactElement {
    return (
        <RetroPanel
            variant="default"
            hoverGlow
            className="p-6 h-full"
        >
            <div className="text-4xl mb-4 font-terminal text-[var(--color-primary)] terminal-glow">
                {icon}
            </div>
            <h3 className="font-pixel text-sm text-[var(--color-primary)] mb-3">
                {title}
            </h3>
            <p className="font-terminal text-lg text-[var(--color-text-muted)]">
                {description}
            </p>
        </RetroPanel>
    );
}

function HomePage(): ReactElement {
    const { t } = useTranslation('common');
    const [showSubtitle, setShowSubtitle] = useState(false);

    const handleTypingComplete = useCallback(() => {
        setTimeout(() => setShowSubtitle(true), 500);
    }, []);

    useEffect(() => {
        // Trigger subtitle after main title animation
        const timer = setTimeout(handleTypingComplete, 3000);
        return () => clearTimeout(timer);
    }, [handleTypingComplete]);

    return (
        <main className="min-h-screen" role="main">
            {/* Hero Section */}
            <section
                className="relative py-16 md:py-24 lg:py-32 overflow-hidden"
                aria-labelledby="hero-title"
            >
                {/* Background grid effect */}
                <div
                    className="absolute inset-0 opacity-10"
                    aria-hidden="true"
                    style={{
                        backgroundImage: `
                            linear-gradient(var(--color-primary) 1px, transparent 1px),
                            linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                    }}
                />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Terminal prompt */}
                        <div
                            className="font-terminal text-[var(--color-primary)] text-xl mb-4 terminal-glow"
                            aria-hidden="true"
                        >
                            C:\TURBO\PASCAL{'>'}
                        </div>

                        {/* Main title with typing effect */}
                        <h1
                            id="hero-title"
                            className="font-pixel text-2xl md:text-3xl lg:text-4xl text-[var(--color-primary)] mb-6 terminal-glow leading-relaxed"
                        >
                            <TypingEffect
                                text={t('app.title', 'In Memoriam Pascal')}
                                speed={80}
                            />
                        </h1>

                        {/* Subtitle */}
                        {showSubtitle && (
                            <p className="font-terminal text-xl md:text-2xl text-[var(--color-text-muted)] mb-8 animate-fade-in">
                                {t('app.description', 'Lerne Pascal programmieren - die Sprache der 80er Jahre')}
                            </p>
                        )}

                        {/* Historical context */}
                        <div className="font-terminal text-lg text-[var(--color-secondary)] mb-10 animate-slide-up">
                            <p>
                                {t('home.history', 'Turbo Pascal • 1983 • Das goldene Zeitalter der Programmierung')}
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
                            <Link to="/tutorial/hello-world">
                                <RetroButton
                                    variant="primary"
                                    pulseGlow
                                    icon={<span aria-hidden="true">▶</span>}
                                >
                                    {t('home.startLearning', 'Start Learning')}
                                </RetroButton>
                            </Link>
                            <a href="#features">
                                <RetroButton variant="outline">
                                    {t('home.learnMore', 'Learn More')}
                                </RetroButton>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Decorative CRT glow */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--crt-black)] to-transparent"
                    aria-hidden="true"
                />
            </section>

            {/* Features Section */}
            <section
                id="features"
                className="py-16 md:py-20 bg-[var(--crt-surface)]"
                aria-labelledby="features-title"
            >
                <div className="container mx-auto px-4">
                    <h2
                        id="features-title"
                        className="font-pixel text-xl md:text-2xl text-[var(--color-primary)] text-center mb-12 terminal-glow"
                    >
                        {t('home.features.title', 'Features')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <FeatureCard
                            icon="{'</>'}"
                            title={t('home.features.interactive.title', 'Interactive Editor')}
                            description={t(
                                'home.features.interactive.description',
                                'Write and run Pascal code directly in your browser with syntax highlighting.'
                            )}
                        />
                        <FeatureCard
                            icon="[▶]"
                            title={t('home.features.realtime.title', 'Real-time Execution')}
                            description={t(
                                'home.features.realtime.description',
                                'See your code execute instantly with our built-in Pascal interpreter.'
                            )}
                        />
                        <FeatureCard
                            icon="[?]"
                            title={t('home.features.guided.title', 'Guided Tutorials')}
                            description={t(
                                'home.features.guided.description',
                                'Learn step-by-step with structured lessons designed for beginners.'
                            )}
                        />
                        <FeatureCard
                            icon="[↻]"
                            title={t('home.features.progress.title', 'Track Progress')}
                            description={t(
                                'home.features.progress.description',
                                'Save your progress and pick up where you left off anytime.'
                            )}
                        />
                        <FeatureCard
                            icon="[🌐]"
                            title={t('home.features.multilang.title', 'Multi-language')}
                            description={t(
                                'home.features.multilang.description',
                                'Available in multiple languages for learners worldwide.'
                            )}
                        />
                        <FeatureCard
                            icon="[⚡]"
                            title={t('home.features.free.title', '100% Free')}
                            description={t(
                                'home.features.free.description',
                                'Open source and free to use. No account required.'
                            )}
                        />
                    </div>
                </div>
            </section>

            {/* About Pascal Section */}
            <section
                className="py-16 md:py-20"
                aria-labelledby="about-title"
            >
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <RetroPanel variant="terminal" title="ABOUT.PAS" className="p-6">
                            <div className="font-mono text-base leading-relaxed">
                                <p className="text-[var(--color-text)] mb-4">
                                    <span className="text-[var(--color-primary)]">{'{ '}Pascal</span> — eine Programmiersprache,
                                    die 1970 von Niklaus Wirth entwickelt wurde.
                                </p>
                                <p className="text-[var(--color-text-muted)] mb-4">
                                    <span className="text-[var(--color-secondary)]">Turbo Pascal</span>,
                                    veröffentlicht 1983 von Borland, machte Pascal zur dominierenden
                                    Sprache für PC-Entwicklung in den 1980er Jahren.
                                </p>
                                <p className="text-[var(--color-text-muted)] mb-4">
                                    Viele heutige Entwickler haben ihre ersten Schritte in Pascal gemacht.
                                    Diese Anwendung ist eine Hommage an diese Ära.
                                </p>
                                <p className="text-[var(--color-primary)]">
                                    {'}'} <span className="cursor-blink">_</span>
                                </p>
                            </div>
                        </RetroPanel>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section
                className="py-16 md:py-20 bg-[var(--crt-surface)] border-t-2 border-[var(--color-primary)]"
                aria-labelledby="cta-title"
            >
                <div className="container mx-auto px-4 text-center">
                    <h2
                        id="cta-title"
                        className="font-pixel text-xl md:text-2xl text-[var(--color-primary)] mb-6 terminal-glow"
                    >
                        {t('home.cta.title', 'Ready to Start?')}
                    </h2>
                    <p className="font-terminal text-xl text-[var(--color-text-muted)] mb-8 max-w-2xl mx-auto">
                        {t(
                            'home.cta.description',
                            'Begin your journey into the world of programming with Pascal.'
                        )}
                    </p>
                    <Link to="/tutorial/hello-world">
                        <RetroButton
                            variant="primary"
                            pulseGlow
                            icon={<span aria-hidden="true">→</span>}
                        >
                            {t('home.cta.button', 'Start Tutorial')}
                        </RetroButton>
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default HomePage;
