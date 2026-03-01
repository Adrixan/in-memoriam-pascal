/**
 * Tutorial Page - Displays tutorial content and code editor
 * 
 * Responsive layout:
 * - Desktop: Split view with sidebar navigation
 * - Tablet: Collapsible sidebar
 * - Mobile: Stacked layout with collapsible level nav
 * 
 * Integrates CodeEditor, RunButton, OutputWindow, LevelNav, LevelInstructions, and HintSystem
 */

import { type ReactElement, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CodeEditor } from '@/components/editor/CodeEditor';
import { RunButton } from '@/components/editor/RunButton';
import { OutputWindow } from '@/components/editor/OutputWindow';
import { RetroPanel, RetroButton } from '@/components/common';
import { LevelNav, LevelInstructions, HintSystem } from '@/components/tutorial';
import { useInterpreter } from '@/hooks/useInterpreter';
import { useEditorStore, useTutorialStore } from '@/stores';
import { tutorialLevels, getLevelById } from '@/data/tutorials';
import { SolutionValidator, type LevelValidationResult } from '@/services/validation';
import ErrorAnalyzer, { type AnalyzedError } from '@/services/validation/ErrorAnalyzer';

/**
 * TutorialPage Component
 *
 * Main page for interactive Pascal tutorials featuring:
 * - Monaco code editor with Pascal syntax highlighting
 * - Run button to execute code
 * - Output window to display results
 * - Level navigation sidebar
 * - Level instructions with concepts and examples
 * - Solution validation
 * - Responsive design
 */
function TutorialPage(): ReactElement {
    const { levelId } = useParams<{ levelId: string }>();
    const { t } = useTranslation();

    const { code, setCode, isReady: editorReady } = useEditorStore();
    const {
        levels,
        currentLevelId,
        setCurrentLevel,
        setLevels,
        markCompleted,
        updateProgress,
        progress,
        revealedHints,
        hintPoints,
        revealHint,
    } = useTutorialStore();

    const {
        status,
        output,
        error,
        executionTime,
        isReady: interpreterReady,
        isWaitingForInput,
        provideInput,
        runCode,
        clearOutput,
    } = useInterpreter();

    // Validation state
    const [validationResult, setValidationResult] = useState<LevelValidationResult | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Error analysis state for context-aware hints
    const [errorAnalysis, setErrorAnalysis] = useState<AnalyzedError | null>(null);

    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Track which level's starter code has been initialized to prevent infinite loops
    const initializedLevelRef = useRef<string | null>(null);

    // Track if we've already processed the current execution to prevent infinite loops
    const lastProcessedStatusRef = useRef<{ status: string; timestamp: number } | null>(null);

    // Toast notification state for visual feedback
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen((prev) => !prev);
    }, []);

    const closeSidebar = useCallback(() => {
        setIsSidebarOpen(false);
    }, []);

    // Initialize levels from tutorial data on mount
    // Empty dependency array ensures this runs once when component mounts
    useEffect(() => {
        const { levels: storeLevels } = useTutorialStore.getState();
        if (storeLevels.length === 0) {
            setLevels(tutorialLevels);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get current level - use getLevelById directly to bypass store issues
    // This ensures level is always available regardless of store state
    const currentLevel = useMemo(() => {
        if (!levelId) return null;
        // Try to get from store first, then fallback to direct lookup
        if (currentLevelId && levels.length > 0) {
            return levels.find((level) => level.id === currentLevelId) ?? null;
        }
        // Direct lookup from tutorial data - this is guaranteed to work
        return getLevelById(levelId) ?? null;
    }, [levelId, currentLevelId, levels]);

    // Get current level index for navigation
    const currentLevelIndex = useMemo(() => {
        return levels.findIndex((level) => level.id === currentLevelId);
    }, [levels, currentLevelId]);

    // Get previous/next level
    const prevLevel = useMemo(() => {
        if (currentLevelIndex <= 0) return null;
        return levels[currentLevelIndex - 1];
    }, [levels, currentLevelIndex]);

    const nextLevel = useMemo(() => {
        if (currentLevelIndex < 0 || currentLevelIndex >= levels.length - 1) return null;
        return levels[currentLevelIndex + 1];
    }, [levels, currentLevelIndex]);

    // Set current level when levelId changes - use getState to avoid dependency issues
    useEffect(() => {
        if (!levelId) return;

        // Get fresh state from store to check levels
        const storeState = useTutorialStore.getState();
        const storeLevels = storeState.levels;

        if (storeLevels.length === 0) return;

        if (levelId !== storeState.currentLevelId) {
            setCurrentLevel(levelId);
            // Clear output when changing levels
            clearOutput();
            // Reset validation state when changing levels
            setValidationResult(null);
            setShowSuccess(false);
        }
    }, [levelId, setCurrentLevel, setValidationResult, setShowSuccess, clearOutput]);

    // Separate effect to handle level setting when levels become available
    // This ensures we re-run when levels are loaded
    useEffect(() => {
        if (!levelId || levels.length === 0) return;
        if (levelId === currentLevelId) return;

        setCurrentLevel(levelId);
        clearOutput();
        setValidationResult(null);
        setShowSuccess(false);
    }, [levels.length, levelId, currentLevelId, setCurrentLevel, clearOutput, setValidationResult, setShowSuccess]);

    // Set starter code when level is loaded
    // Use currentLevelId as dependency to avoid infinite loops from object reference changes
    useEffect(() => {
        if (currentLevelId && currentLevel?.starterCode) {
            // Only set starter code once per level
            if (initializedLevelRef.current !== currentLevelId) {
                setCode(currentLevel.starterCode);
                initializedLevelRef.current = currentLevelId;
            }
        }
    }, [currentLevelId, currentLevel?.starterCode, setCode]);

    // Handle hint reveal
    const handleHintReveal = useCallback((hintLevel: number) => {
        if (!currentLevel) return;

        const currentProgress = progress[currentLevel.id];
        const usedHints = currentProgress?.hintsUsed ?? [];

        if (!usedHints.includes(hintLevel)) {
            updateProgress(currentLevel.id, {
                hintsUsed: [...usedHints, hintLevel],
            });
        }
    }, [currentLevel, progress, updateProgress]);

    // Interactive mode state - when enabled, user can enter their own input
    const [interactiveMode, setInteractiveMode] = useState(false);

    // Handle code execution with validation
    const handleRunCode = useCallback(async () => {
        // Clear previous validation
        setValidationResult(null);
        setShowSuccess(false);

        // Show running indicator
        setToast({ message: 'Running code...', type: 'info' });

        // Run the code:
        // - If interactiveMode is true: use empty array (user enters input manually)
        // - Otherwise: use testInput from level (for automated testing)
        const inputQueue = interactiveMode ? [] : currentLevel?.testInput;
        await runCode(inputQueue);
    }, [runCode, currentLevel, interactiveMode]);

    // Save progress handler (Ctrl+S)
    const handleSaveProgress = useCallback(() => {
        if (currentLevelId && code) {
            updateProgress(currentLevelId, { savedCode: code });
            setToast({ message: 'Progress saved!', type: 'success' });
            // Clear toast after 2 seconds
            setTimeout(() => setToast(null), 2000);
        }
    }, [currentLevelId, code, updateProgress]);

    // Keyboard shortcut handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S or Cmd+S to save progress
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSaveProgress();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSaveProgress]);

    // Validate solution when execution completes
    useEffect(() => {
        if (status === 'success' || status === 'error') {
            if (currentLevel) {
                // Create a unique key for this execution to prevent re-processing
                const executionKey = `${status}-${executionTime ?? 0}`;
                const lastProcessed = lastProcessedStatusRef.current;

                // Skip if we've already processed this exact execution
                if (lastProcessed &&
                    lastProcessed.status === executionKey) {
                    return;
                }

                // Mark this execution as processed
                lastProcessedStatusRef.current = { status: executionKey, timestamp: Date.now() };

                const executionOutput = {
                    output: output.map((line) => line.content),
                    errors: error ? [error.message] : [],
                    success: status === 'success',
                    executionTime: executionTime ?? 0,
                };

                const result = SolutionValidator.validateLevel(
                    currentLevel,
                    code,
                    executionOutput
                );

                setValidationResult(result);

                if (result.levelCompleted) {
                    setShowSuccess(true);
                    markCompleted(currentLevel.id);
                    // Reset error analysis on success
                    setErrorAnalysis(null);
                } else {
                    // Analyze error for context-aware hints
                    const analysis = ErrorAnalyzer.analyzeError(result);
                    setErrorAnalysis(analysis);
                }

                // Update progress - use functional approach to avoid dependency on progress object
                updateProgress(currentLevel.id, {
                    savedCode: code,
                    attempts: 1, // Will be incremented by store's updateProgress
                });
            }
        }
    }, [status, currentLevel, code, output, error, executionTime, markCompleted, updateProgress]);

    const isRunning = status === 'running';

    // Get error message for display
    const errorMessage = error?.message ?? null;

    // Get revealed hints for current level (from new hint system)
    const currentLevelRevealedHints = currentLevel ? (revealedHints[currentLevel.id] ?? []) : [];

    // Handle hint reveal with new hint system
    const handleHintUsed = useCallback((hintIndex: number) => {
        if (!currentLevel) return;
        const hint = currentLevel.hints[hintIndex];
        if (hint) {
            revealHint(currentLevel.id, hintIndex, hint.cost);
        }
    }, [currentLevel, revealHint]);

    return (
        <main
            className="min-h-screen"
            role="main"
            aria-label="Tutorial page"
        >
            <div className="flex flex-col lg:flex-row">
                {/* Sidebar - Desktop */}
                <aside
                    className="hidden lg:block w-72 flex-shrink-0 p-4 border-r border-[var(--color-border)] bg-[var(--crt-surface)]"
                    aria-label="Level navigation"
                >
                    <LevelNav />
                </aside>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={closeSidebar}
                        aria-hidden="true"
                    />
                )}

                {/* Mobile Sidebar */}
                <aside
                    className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-[var(--crt-dark)] z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                    aria-label="Level navigation"
                    aria-hidden={!isSidebarOpen}
                >
                    <div className="p-4 h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-pixel text-sm text-[var(--color-primary)]">
                                {t('tutorial.levels', 'Levels')}
                            </h2>
                            <button
                                type="button"
                                onClick={closeSidebar}
                                className="retro-btn px-2 py-1"
                                aria-label="Close navigation"
                            >
                                ✕
                            </button>
                        </div>
                        <LevelNav />
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-grow p-4 lg:p-6">
                    {/* Mobile menu button */}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="lg:hidden retro-btn mb-4"
                        aria-label="Open level navigation"
                        aria-expanded={isSidebarOpen}
                    >
                        <span className="flex items-center gap-2">
                            <span aria-hidden="true">☰</span>
                            <span className="font-terminal">{t('tutorial.levels', 'Levels')}</span>
                        </span>
                    </button>

                    {/* Header */}
                    <header className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            {currentLevelIndex >= 0 && (
                                <span className="font-terminal text-sm text-[var(--color-text-muted)]">
                                    LEVEL {String(currentLevelIndex + 1).padStart(2, '0')}
                                </span>
                            )}
                        </div>
                        <h1 className="font-pixel text-xl md:text-2xl text-[var(--color-primary)] terminal-glow mb-2">
                            {currentLevel?.titleKey
                                ? t(`levels:${currentLevel.titleKey}`)
                                : `Tutorial: ${levelId}`}
                        </h1>
                        {currentLevel?.descriptionKey && (
                            <p className="font-terminal text-lg text-[var(--color-text-muted)]">
                                {t(`levels:${currentLevel.descriptionKey}`)}
                            </p>
                        )}
                    </header>

                    {/* Toast notification for keyboard shortcuts */}
                    {toast && (
                        <div
                            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded font-terminal text-sm animate-fade-in ${toast.type === 'success'
                                ? 'bg-green-900/90 text-green-200 border border-green-500'
                                : 'bg-blue-900/90 text-blue-200 border border-blue-500'
                                }`}
                            role="status"
                            aria-live="polite"
                        >
                            {toast.message}
                        </div>
                    )}

                    {/* Success notification */}
                    {showSuccess && (
                        <RetroPanel variant="header" className="p-4 mb-6 border-2 border-[var(--color-primary)]">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl" role="img" aria-label="Success">✓</span>
                                <div>
                                    <h3 className="font-pixel text-lg text-[var(--color-primary)]">
                                        {t('validation.levelComplete', 'Level Complete!')}
                                    </h3>
                                    <p className="font-terminal text-sm text-[var(--color-text-muted)]">
                                        {t('validation.congratulations', 'Congratulations! You have completed this level.')}
                                    </p>
                                </div>
                            </div>
                        </RetroPanel>
                    )}

                    {/* Validation error */}
                    {validationResult && !validationResult.success && (
                        <RetroPanel variant="default" className="p-4 mb-6 border-l-4 border-red-500">
                            <h3 className="font-pixel text-sm text-red-400 mb-2">
                                {t('validation.failed', 'Validation Failed')}
                            </h3>
                            <p className="font-terminal text-sm text-[var(--color-text-muted)]">
                                {t(`errors:${validationResult.messageKey}`, SolutionValidator.getErrorMessage(validationResult))}
                            </p>
                        </RetroPanel>
                    )}

                    {/* Hint System - Show when validation fails */}
                    {currentLevel && validationResult && !validationResult.success && (
                        <HintSystem
                            levelId={currentLevel.id}
                            hints={currentLevel.hints}
                            revealedHintIndices={currentLevelRevealedHints}
                            hintPoints={hintPoints}
                            {...(errorAnalysis && { errorAnalysis })}
                            onHintUsed={handleHintUsed}
                            showError={true}
                            className="mb-6"
                        />
                    )}

                    {/* Main content grid - Responsive */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Left column: Editor */}
                        <section
                            className="flex flex-col gap-4 order-2 xl:order-1"
                            aria-label="Code editor section"
                        >
                            {/* Editor toolbar */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <h2 className="font-pixel text-sm text-[var(--color-primary)]">
                                    {t('editor.title', 'Editor')}
                                </h2>
                                <RunButton
                                    onRun={handleRunCode}
                                    isRunning={isRunning}
                                    isReady={interpreterReady && editorReady}
                                    disabled={!code.trim()}
                                />
                                {/* Interactive mode toggle */}
                                <label
                                    className="flex items-center gap-2 cursor-pointer text-sm"
                                    title={t('editor.interactiveMode', 'Enter your own input instead of using test data')}
                                >
                                    <input
                                        type="checkbox"
                                        checked={interactiveMode}
                                        onChange={(e) => setInteractiveMode(e.target.checked)}
                                        className="w-4 h-4 accent-[var(--color-primary)]"
                                    />
                                    <span className="font-terminal text-[var(--color-text-muted)]">
                                        {t('editor.interactive', 'Interactive')}
                                    </span>
                                </label>
                            </div>

                            {/* Code editor */}
                            <RetroPanel variant="terminal" title="CODE.PAS" className="p-0 overflow-hidden">
                                <div className="pt-6">
                                    <CodeEditor
                                        value={code}
                                        onChange={setCode}
                                        onRun={handleRunCode}
                                        height="350px"
                                        readOnly={isRunning}
                                    />
                                </div>
                            </RetroPanel>

                            {/* Execution info */}
                            {executionTime !== undefined && (
                                <div className="font-terminal text-sm text-[var(--color-text-muted)]">
                                    {t('editor.executionTime', {
                                        time: executionTime.toFixed(2),
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Right column: Output */}
                        <section
                            className="flex flex-col gap-4 order-3"
                            aria-label="Output section"
                        >
                            {/* Output header */}
                            <div className="flex items-center justify-between">
                                <h2 className="font-pixel text-sm text-[var(--color-secondary)]">
                                    {t('editor.output', 'Output')}
                                </h2>
                                <button
                                    type="button"
                                    onClick={clearOutput}
                                    className="retro-btn retro-btn-ghost text-sm"
                                    aria-label={t('editor.clearOutput', 'Clear')}
                                >
                                    {t('editor.clearOutput', 'Clear')}
                                </button>
                            </div>

                            {/* Output window */}
                            <RetroPanel variant="terminal" title="OUTPUT.TXT" className="p-0 overflow-hidden">
                                <div className="pt-6">
                                    <OutputWindow
                                        output={output}
                                        error={errorMessage}
                                        height="350px"
                                        isWaitingForInput={isWaitingForInput}
                                        onInputSubmit={provideInput}
                                    />
                                </div>
                            </RetroPanel>

                            {/* Status indicator */}
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full ${isRunning
                                        ? 'bg-yellow-500 animate-pulse'
                                        : status === 'error'
                                            ? 'bg-red-500'
                                            : status === 'success'
                                                ? 'bg-green-500'
                                                : 'bg-gray-500'
                                        }`}
                                    aria-hidden="true"
                                />
                                <span className="font-terminal text-sm text-[var(--color-text-muted)]">
                                    {isRunning
                                        ? t('status.running', 'Running...')
                                        : status === 'error'
                                            ? t('status.error', 'Error')
                                            : status === 'success'
                                                ? t('status.success', 'Success')
                                                : t('status.idle', 'Ready')}
                                </span>
                            </div>
                        </section>
                    </div>

                    {/* Tutorial content - Level Instructions */}
                    {currentLevel && (
                        <section className="mt-8 order-4" aria-label="Tutorial content">
                            <LevelInstructions
                                level={currentLevel}
                                showExpectedOutput={true}
                                showHints={true}
                                onHintReveal={handleHintReveal}
                                revealedHints={currentLevelRevealedHints}
                            />
                        </section>
                    )}

                    {/* Navigation buttons */}
                    <nav
                        className="mt-8 flex flex-col sm:flex-row gap-4 justify-between order-5"
                        aria-label="Level navigation"
                    >
                        {prevLevel ? (
                            <Link to={`/tutorial/${prevLevel.id}`}>
                                <RetroButton variant="outline" icon={<span aria-hidden="true">←</span>}>
                                    {t('navigation.previous', 'Previous Level')}
                                </RetroButton>
                            </Link>
                        ) : (
                            <div />
                        )}

                        {nextLevel ? (
                            <Link to={`/tutorial/${nextLevel.id}`}>
                                <RetroButton
                                    variant="primary"
                                    iconAfter={<span aria-hidden="true">→</span>}
                                >
                                    {t('navigation.next', 'Next Level')}
                                </RetroButton>
                            </Link>
                        ) : (
                            <Link to="/">
                                <RetroButton variant="secondary">
                                    {t('navigation.home', 'Back to Home')}
                                </RetroButton>
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </main>
    );
}

export default TutorialPage;
