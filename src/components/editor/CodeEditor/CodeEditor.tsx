/**
 * CodeEditor Component
 * Monaco Editor wrapper with Pascal syntax highlighting and retro theme
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react';
import type * as Monaco from 'monaco-editor';
import type { editor } from 'monaco-editor';

import { useEditorStore } from '@/stores/editorStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { registerPascalLanguage } from './PascalLanguage';
import { PASCAL_RETRO_THEME, registerPascalTheme } from './PascalTheme';

// Lazy load Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

/**
 * Props for the CodeEditor component
 */
export interface CodeEditorProps {
    /** Initial code content */
    value?: string;

    /** Callback when code changes */
    onChange?: (value: string) => void;

    /** Callback when code should be run (Ctrl+Enter) */
    onRun?: () => void;

    /** Read-only mode */
    readOnly?: boolean;

    /** Editor height */
    height?: string | number;

    /** Additional CSS class names */
    className?: string;

    /** Called when editor is ready */
    onReady?: () => void;
}

/**
 * Loading fallback component
 */
function EditorLoadingFallback(): ReactElement {
    return (
        <div
            className="flex items-center justify-center bg-[var(--terminal-bg)] text-[var(--color-primary)] font-mono"
            style={{ height: '100%', minHeight: '200px' }}
            role="status"
            aria-label="Loading editor"
        >
            <div className="flex flex-col items-center gap-2">
                <div className="animate-pulse text-lg">Loading Pascal Editor...</div>
                <div className="text-sm text-[var(--color-text-muted)]">
                    Initializing Monaco...
                </div>
            </div>
        </div>
    );
}

/**
 * CodeEditor Component
 *
 * A Monaco Editor wrapper with:
 * - Pascal syntax highlighting (Turbo Pascal dialect)
 * - Retro 80s CRT theme
 * - Integration with editorStore
 * - Accessibility support
 * - Responsive design
 */
export function CodeEditor({
    value,
    onChange,
    onRun,
    readOnly = false,
    height = '400px',
    className,
    onReady,
}: CodeEditorProps): ReactElement {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof Monaco | null>(null);
    const isInitializedRef = useRef(false);

    // Store access
    const { code, setCode, setReady, setCursorPosition } = useEditorStore();
    const { fontSize, theme } = useSettingsStore();

    // Determine the effective code value
    const effectiveValue = useMemo(() => {
        return value ?? code ?? '';
    }, [value, code]);

    /**
     * Handle editor mount
     */
    const handleEditorDidMount = useCallback(
        (editor: editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Register Pascal language and theme only once
            if (!isInitializedRef.current) {
                registerPascalLanguage(monaco);
                registerPascalTheme(monaco);
                isInitializedRef.current = true;
            }

            // Set the theme
            monaco.editor.setTheme(PASCAL_RETRO_THEME);

            // Configure editor accessibility
            editor.updateOptions({
                accessibilitySupport: 'auto',
            });

            // Listen for cursor position changes
            editor.onDidChangeCursorPosition((e) => {
                setCursorPosition(e.position.lineNumber, e.position.column);
            });

            // Add custom action for Ctrl+Enter to run code
            if (onRun) {
                editor.addAction({
                    id: 'run-code',
                    label: 'Run Code',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                    run: () => {
                        onRun();
                    },
                });
            }

            // Prevent browser's default print dialog (Ctrl+P) when editor is focused
            // Monaco uses Ctrl+P for Quick Open, but we want to prevent browser print
            const editorDom = editor.getDomNode?.();
            if (editorDom) {
                editorDom.addEventListener('keydown', (e: KeyboardEvent) => {
                    // Prevent Ctrl+P (or Cmd+P on Mac) from triggering browser print
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                        e.stopPropagation();
                        // Let Monaco handle it for Quick Open instead
                    }
                }, true); // Use capture phase to intercept before Monaco
            }

            // Mark editor as ready
            setReady(true);
            onReady?.();
        },
        [setCursorPosition, setReady, onReady, onRun]
    );

    /**
     * Handle code changes
     */
    const handleChange = useCallback(
        (newValue: string | undefined) => {
            const newCode = newValue ?? '';
            setCode(newCode);
            onChange?.(newCode);
        },
        [setCode, onChange]
    );

    /**
     * Editor options
     */
    const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
        () => ({
            // Language
            language: 'pascal',

            // Theme is set dynamically
            theme: PASCAL_RETRO_THEME,

            // Value
            value: effectiveValue,

            // Read-only
            readOnly,

            // Font settings
            fontSize: fontSize,
            fontFamily: "'VT323', 'Share Tech Mono', 'Courier New', monospace",
            fontLigatures: false,
            fontWeight: 'normal',

            // Line numbers
            lineNumbers: 'on',
            lineNumbersMinChars: 4,
            renderLineHighlight: 'line',

            // Minimap (disabled for retro feel)
            minimap: {
                enabled: false,
            },

            // Scrollbar
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                useShadows: false,
            },

            // Tab settings
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,

            // Word wrap
            wordWrap: 'off',

            // Cursor
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            cursorWidth: 2,

            // Selection
            selectionHighlight: true,
            occurrencesHighlight: 'singleFile',

            // Bracket matching
            matchBrackets: 'always',
            bracketPairColorization: {
                enabled: false, // Keep simple for retro feel
            },

            // Auto-closing
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoClosingDelete: 'always',
            autoClosingOvertype: 'always',
            autoIndent: 'full',

            // Suggestions
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'off',

            // Find
            find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: 'multiline',
                seedSearchStringFromSelection: 'selection',
            },

            // Folding
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'mouseover',

            // Guides
            guides: {
                indentation: false,
                bracketPairs: false,
            },

            // Padding
            padding: {
                top: 8,
                bottom: 8,
            },

            // Accessibility
            accessibilitySupport: 'auto',
            ariaLabel: 'Pascal Code Editor',
            screenReaderAnnounceInlineLabel: true,

            // Performance
            fastScrollSensitivity: 5,
            smoothScrolling: true,

            // Context menu
            contextmenu: true,

            // Copy/paste
            copyWithSyntaxHighlighting: false,

            // Links
            links: false,

            // Render whitespace
            renderWhitespace: 'selection',

            // Rulers
            rulers: [],

            // Stop rendering line when too long (performance)
            stopRenderingLineAfter: 10000,

            // Large file optimizations
            largeFileOptimizations: true,

            // Unusual line terminators
            unusualLineTerminators: 'auto',

            // Drag and drop
            dragAndDrop: true,

            // Linked editing
            linkedEditing: true,

            // Sticky scroll
            stickyScroll: {
                enabled: false,
            },

            // Drop into editor
            dropIntoEditor: {
                enabled: true,
            },

            // Multi cursor
            multiCursorMergeOverlapping: true,
            multiCursorModifier: 'alt',

            // Inline suggest
            inlineSuggest: {
                enabled: false,
            },

            // DOM
            fixedOverflowWidgets: false,
        }),
        [effectiveValue, fontSize, readOnly]
    );

    /**
     * Update theme when settings change
     */
    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(PASCAL_RETRO_THEME);
        }
    }, [theme]);

    /**
     * Update font size when settings change
     */
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.updateOptions({ fontSize });
        }
    }, [fontSize]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            setReady(false);
        };
    }, [setReady]);

    return (
        <div
            className={`code-editor-wrapper ${className ?? ''}`}
            style={{ height }}
            role="region"
            aria-label="Pascal Code Editor"
        >
            <Suspense fallback={<EditorLoadingFallback />}>
                <MonacoEditor
                    height="100%"
                    language="pascal"
                    theme={PASCAL_RETRO_THEME}
                    value={effectiveValue}
                    onChange={handleChange}
                    onMount={handleEditorDidMount}
                    options={options}
                    loading={<EditorLoadingFallback />}
                    // Accessibility
                    aria-label="Pascal Code Editor"
                />
            </Suspense>
        </div>
    );
}

export default CodeEditor;