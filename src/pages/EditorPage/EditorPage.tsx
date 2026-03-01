/**
 * Editor Page - Free-form Pascal code editor
 * 
 * A standalone editor for writing and running Pascal code without
 * tutorial constraints. Features:
 * - Monaco code editor with Pascal syntax highlighting
 * - Output window for code execution results
 * - Run/Reset buttons
 * - User input handling (ReadLn/Read)
 * - Responsive layout
 */

import { type ReactElement, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeEditor } from '@/components/editor/CodeEditor';
import { RunButton } from '@/components/editor/RunButton';
import { OutputWindow } from '@/components/editor/OutputWindow';
import { RetroButton, RetroPanel } from '@/components/common';
import { useInterpreter } from '@/hooks/useInterpreter';

// Default starter code for new users
const DEFAULT_CODE = `program HelloWorld;
{ Welcome to the Free Editor! }

begin
  WriteLn('Hello, World!');
  WriteLn('Welcome to the Pascal Editor!');
  WriteLn('Feel free to experiment with your own code.');
end.
`;

/**
 * EditorPage Component
 *
 * Standalone page for free-form Pascal coding with:
 * - Monaco editor with Pascal syntax highlighting
 * - Run and Reset buttons
 * - Output display window
 * - User input handling for ReadLn/Read
 * - Responsive split-pane layout
 */
function EditorPage(): ReactElement {
    const { t } = useTranslation();

    // Local state for code (separate from tutorial editor store)
    const [code, setCode] = useState<string>(DEFAULT_CODE);

    // Interpreter state
    const {
        status,
        output,
        error,
        executionTime,
        isReady: interpreterReady,
        isWaitingForInput,
        runCodeString,
        provideInput,
        clearOutput,
        reset,
    } = useInterpreter();

    // Handle code changes
    const handleCodeChange = useCallback((newCode: string) => {
        setCode(newCode);
    }, []);

    // Handle run button click
    const handleRun = useCallback(async () => {
        await runCodeString(code);
    }, [code, runCodeString]);

    // Handle reset button click
    const handleReset = useCallback(() => {
        reset();
        clearOutput();
        setCode(DEFAULT_CODE);
    }, [reset, clearOutput]);

    // Handle clear output
    const handleClearOutput = useCallback(() => {
        clearOutput();
    }, [clearOutput]);

    // Check if code is running
    const isRunning = status === 'running';

    // Get error message string for OutputWindow
    const errorMessage = error?.message ?? null;

    return (
        <main
            className="flex flex-col h-[calc(100vh-var(--header-height))] p-4 gap-4"
            role="main"
            aria-label="Free Pascal Editor"
        >
            {/* Page Header */}
            <header className="flex-shrink-0">
                <h1 className="text-2xl font-terminal text-[var(--color-primary)] terminal-glow">
                    {t('editor.title', 'Free Editor')}
                </h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Write and run Pascal code freely
                </p>
            </header>

            {/* Editor and Output Container */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                {/* Code Editor Panel */}
                <RetroPanel
                    className="flex-1 flex flex-col min-h-[300px] lg:min-h-0"
                    variant="terminal"
                >
                    <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
                        <span className="font-mono text-sm text-[var(--color-text-muted)]">
                            Pascal
                        </span>
                        <div className="flex items-center gap-2">
                            <RunButton
                                onRun={handleRun}
                                isRunning={isRunning}
                                isReady={interpreterReady}
                                disabled={!code.trim()}
                            />
                            <RetroButton
                                variant="outline"
                                onClick={handleReset}
                                disabled={isRunning}
                                aria-label={t('actions.reset', 'Reset')}
                            >
                                {t('actions.reset', 'Reset')}
                            </RetroButton>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            value={code}
                            onChange={handleCodeChange}
                        />
                    </div>
                </RetroPanel>

                {/* Output Panel */}
                <RetroPanel
                    className="flex-1 flex flex-col min-h-[200px] lg:min-h-0"
                    variant="terminal"
                >
                    <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
                        <span className="font-mono text-sm text-[var(--color-text-muted)]">
                            {t('editor.output', 'Output')}
                        </span>
                        <div className="flex items-center gap-2">
                            {executionTime !== undefined && (
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {t('editor.executionTime', { time: executionTime })}
                                </span>
                            )}
                            <RetroButton
                                variant="ghost"
                                onClick={handleClearOutput}
                                aria-label={t('editor.clearOutput', 'Clear output')}
                            >
                                {t('actions.clear', 'Clear')}
                            </RetroButton>
                        </div>
                    </div>

                    {/* Output Window */}
                    <div className="flex-1 min-h-0 overflow-auto">
                        <OutputWindow
                            output={output}
                            error={errorMessage}
                            isWaitingForInput={isWaitingForInput}
                            onInputSubmit={provideInput}
                        />
                    </div>
                </RetroPanel>
            </div>
        </main>
    );
}

export default EditorPage;
