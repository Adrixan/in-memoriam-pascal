/**
 * LevelInstructions Component
 * 
 * Displays level description, objectives, concepts, and expected output.
 * Provides contextual learning information for each tutorial level.
 */

import { type ReactElement, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RetroPanel, RetroButton } from '@/components/common';
import type { TutorialLevel, ConceptExplanation, CodeExample, Hint } from '@/types';

export interface LevelInstructionsProps {
    /** The level to display instructions for */
    level: TutorialLevel;
    /** Whether to show the expected output section */
    showExpectedOutput?: boolean;
    /** Whether to show hints section */
    showHints?: boolean;
    /** Callback when a hint is requested */
    onHintReveal?: (level: number) => void;
    /** Which hints have been revealed */
    revealedHints?: number[];
}

/**
 * Renders a code example block with syntax highlighting
 */
function CodeBlock({ code, explanationKey }: { code: string; explanationKey: string }): ReactElement {
    const { t } = useTranslation();

    return (
        <div className="my-3">
            <pre className="bg-[var(--crt-dark)] p-3 rounded border border-[var(--color-border)] font-mono text-sm overflow-x-auto">
                <code className="text-[var(--color-primary)]">{code}</code>
            </pre>
            <p className="font-terminal text-sm text-[var(--color-text-muted)] mt-1">
                {t(`levels:${explanationKey}`, explanationKey)}
            </p>
        </div>
    );
}

/**
 * Renders a concept explanation section
 */
function ConceptSection({ concept, index }: { concept: ConceptExplanation; index: number }): ReactElement {
    const { t } = useTranslation();

    return (
        <div className="mb-4">
            <h4 className="font-pixel text-sm text-[var(--color-secondary)] mb-2">
                {index + 1}. {t(`levels:${concept.titleKey}`, concept.titleKey)}
            </h4>
            <p className="font-terminal text-[var(--color-text-muted)] mb-2">
                {t(`levels:${concept.contentKey}`, concept.contentKey)}
            </p>
            {concept.codeExample && (
                <pre className="bg-[var(--crt-dark)] p-2 rounded border border-[var(--color-border)] font-mono text-xs overflow-x-auto">
                    <code className="text-[var(--color-primary)]">{concept.codeExample}</code>
                </pre>
            )}
        </div>
    );
}

/**
 * Renders a code example section
 */
function ExampleSection({ example }: { example: CodeExample }): ReactElement {
    const { t } = useTranslation();

    return (
        <RetroPanel variant="default" className="p-3 mb-4">
            <h4 className="font-pixel text-xs text-[var(--color-text-muted)] mb-2">
                {t('tutorials:example', 'Example')}
            </h4>
            <CodeBlock code={example.code} explanationKey={example.explanationKey} />
        </RetroPanel>
    );
}

/**
 * Renders the hints section with progressive reveal
 */
function HintsSection({
    hints,
    revealedHints = [],
    onReveal,
}: {
    hints: Hint[];
    revealedHints?: number[];
    onReveal?: (level: number) => void;
}): ReactElement | null {
    const { t } = useTranslation();

    if (hints.length === 0) {
        return null;
    }

    const availableHints = hints.filter((hint) => !revealedHints.includes(hint.level));

    return (
        <RetroPanel variant="default" className="p-4 mt-4">
            <h3 className="font-pixel text-sm text-[var(--color-secondary)] mb-3">
                {t('tutorials:hints', 'Hints')}
            </h3>

            {/* Revealed hints */}
            {hints
                .filter((hint) => revealedHints.includes(hint.level))
                .sort((a, b) => a.level - b.level)
                .map((hint) => (
                    <div
                        key={hint.level}
                        className="mb-2 p-2 bg-[var(--crt-dark)] rounded border-l-2 border-[var(--color-secondary)]"
                    >
                        <span className="font-terminal text-xs text-[var(--color-text-muted)] mr-2">
                            [{t('tutorials:hintLevel', { level: hint.level })}]
                        </span>
                        <span className="font-terminal text-[var(--color-text)]">
                            {t(`levels:${hint.contentKey}`, hint.contentKey)}
                        </span>
                    </div>
                ))}

            {/* Available hints to reveal */}
            {availableHints.length > 0 && onReveal && (
                <div className="mt-3">
                    <p className="font-terminal text-xs text-[var(--color-text-muted)] mb-2">
                        {t('tutorials:hintsAvailable', { count: availableHints.length })}
                    </p>
                    {availableHints
                        .sort((a, b) => a.level - b.level)
                        .map((hint) => (
                            <RetroButton
                                key={hint.level}
                                variant="ghost"
                                onClick={() => onReveal(hint.level)}
                                className="mr-2 mb-2 text-sm px-2 py-1"
                            >
                                {t('tutorials:revealHint', { level: hint.level, cost: hint.cost })}
                            </RetroButton>
                        ))}
                </div>
            )}
        </RetroPanel>
    );
}

/**
 * Renders the expected output section
 */
function ExpectedOutputSection({ output }: { output: string }): ReactElement {
    const { t } = useTranslation();

    return (
        <RetroPanel variant="terminal" title="EXPECTED.OUT" className="p-0 mt-4">
            <div className="pt-6 p-3">
                <h3 className="font-pixel text-xs text-[var(--color-text-muted)] mb-2">
                    {t('tutorials:expectedOutput', 'Expected Output')}
                </h3>
                <pre className="bg-[var(--crt-dark)] p-3 rounded border border-[var(--color-border)] font-mono text-sm">
                    <code className="text-[var(--color-secondary)]">{output}</code>
                </pre>
            </div>
        </RetroPanel>
    );
}

function LevelInstructions({
    level,
    showExpectedOutput = true,
    showHints = true,
    onHintReveal,
    revealedHints = [],
}: LevelInstructionsProps): ReactElement {
    const { t } = useTranslation();
    const [showAllExamples, setShowAllExamples] = useState(false);

    const toggleExamples = useCallback(() => {
        setShowAllExamples((prev) => !prev);
    }, []);

    return (
        <div className="level-instructions">
            {/* Level description */}
            <RetroPanel variant="header" className="p-4 mb-4">
                <p className="font-terminal text-lg text-[var(--color-text)]">
                    {t(`levels:${level.descriptionKey}`, level.descriptionKey)}
                </p>
                <div className="mt-2 font-terminal text-sm text-[var(--color-text-muted)]">
                    {t('tutorials:estimatedTime', { time: level.estimatedTime })}
                </div>
            </RetroPanel>

            {/* Learning objectives */}
            {level.objectives.length > 0 && (
                <RetroPanel variant="default" className="p-4 mb-4">
                    <h3 className="font-pixel text-sm text-[var(--color-primary)] mb-3">
                        {t('tutorials:objectives', 'Learning Objectives')}
                    </h3>
                    <ul className="space-y-2">
                        {level.objectives.map((objectiveKey, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 font-terminal text-[var(--color-text-muted)]"
                            >
                                <span className="text-[var(--color-primary)] flex-shrink-0">{'>'}</span>
                                <span>{t(`levels:${objectiveKey}`, objectiveKey)}</span>
                            </li>
                        ))}
                    </ul>
                </RetroPanel>
            )}

            {/* Concepts */}
            {level.concepts.length > 0 && (
                <RetroPanel variant="default" className="p-4 mb-4">
                    <h3 className="font-pixel text-sm text-[var(--color-primary)] mb-3">
                        {t('tutorials:concepts', 'Concepts')}
                    </h3>
                    {level.concepts.map((concept, index) => (
                        <ConceptSection key={index} concept={concept} index={index} />
                    ))}
                </RetroPanel>
            )}

            {/* Code examples */}
            {level.examples.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-pixel text-sm text-[var(--color-primary)]">
                            {t('tutorials:examples', 'Examples')}
                        </h3>
                        {level.examples.length > 1 && (
                            <RetroButton variant="ghost" onClick={toggleExamples} className="text-sm px-2 py-1">
                                {showAllExamples
                                    ? t('tutorials:showLess', 'Show Less')
                                    : t('tutorials:showAll', `Show All (${level.examples.length})`, { count: level.examples.length })}
                            </RetroButton>
                        )}
                    </div>
                    {(showAllExamples ? level.examples : level.examples.slice(0, 1)).map((example, index) => (
                        <ExampleSection key={index} example={example} />
                    ))}
                </div>
            )}

            {/* Expected output */}
            {showExpectedOutput && level.expectedOutput && (
                <ExpectedOutputSection output={level.expectedOutput} />
            )}

            {/* Hints */}
            {showHints && (
                <HintsSection
                    hints={level.hints}
                    revealedHints={revealedHints}
                    {...(onHintReveal ? { onReveal: onHintReveal } : {})}
                />
            )}
        </div>
    );
}

export default LevelInstructions;
