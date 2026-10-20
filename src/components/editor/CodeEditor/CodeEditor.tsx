/**
 * CodeEditor Component
 * Monaco editor with Pascal highlighting and the retro theme.
 *
 * The component is controlled: the parent owns the code. Keyboard shortcuts
 * always call the newest callbacks (they are read through refs), so Ctrl+Enter
 * runs the code that is in the editor right now.
 */

import { useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@/stores/settingsStore';
import { PASCAL_RETRO_THEME } from './PascalTheme';
import './monacoSetup';

export interface CodeEditorProps {
    /** Code to show */
    value: string;

    /** Called with the new code after every edit */
    onChange: (value: string) => void;

    /** Ctrl/Cmd+Enter */
    onRun?: () => void;

    /** Ctrl/Cmd+S */
    onSave?: () => void;

    /** Read-only mode */
    readOnly?: boolean;

    /** Editor height */
    height?: string | number;

    /** Additional CSS class names */
    className?: string;

    /** Called once the editor is ready */
    onReady?: () => void;
}

function EditorLoadingFallback(): ReactElement {
    const { t } = useTranslation();
    return (
        <div
            className="flex items-center justify-center bg-[var(--terminal-bg)] text-[var(--color-primary)] font-mono h-full min-h-[200px]"
            role="status"
        >
            <div className="animate-pulse text-lg">{t('editor.loadingEditor', 'Loading editor...')}</div>
        </div>
    );
}

export function CodeEditor({
    value,
    onChange,
    onRun,
    onSave,
    readOnly = false,
    height = '400px',
    className,
    onReady,
}: CodeEditorProps): ReactElement {
    const { t } = useTranslation();
    const fontSize = useSettingsStore((s) => s.fontSize);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // Shortcuts are registered once; refs give them the current callbacks.
    const onRunRef = useRef(onRun);
    const onSaveRef = useRef(onSave);
    const onReadyRef = useRef(onReady);
    useEffect(() => {
        onRunRef.current = onRun;
        onSaveRef.current = onSave;
        onReadyRef.current = onReady;
    }, [onRun, onSave, onReady]);

    const handleMount = useCallback<OnMount>((instance, monaco) => {
        editorRef.current = instance;
        instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRunRef.current?.());
        instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSaveRef.current?.());
        onReadyRef.current?.();
    }, []);

    const handleChange = useCallback(
        (newValue: string | undefined) => {
            onChange(newValue ?? '');
        },
        [onChange],
    );

    // The value is not part of the options: changing options re-configures
    // the editor, which must not happen on every keystroke.
    const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
        () => ({
            readOnly,
            fontSize,
            fontFamily: "'VT323', 'IBM Plex Mono', 'Courier New', monospace",
            fontLigatures: false,
            lineNumbers: 'on',
            lineNumbersMinChars: 4,
            renderLineHighlight: 'line',
            minimap: { enabled: false },
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
            automaticLayout: true,
            fixedOverflowWidgets: true,
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            wordWrap: 'off',
            cursorBlinking: 'smooth',
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            quickSuggestions: { other: true, comments: false, strings: false },
            wordBasedSuggestions: 'off',
            folding: true,
            foldingStrategy: 'indentation',
            padding: { top: 8, bottom: 8 },
            accessibilitySupport: 'auto',
            ariaLabel: t('editor.ariaLabel', 'Pascal code editor'),
            links: false,
            stickyScroll: { enabled: false },
            inlineSuggest: { enabled: false },
        }),
        [readOnly, fontSize, t],
    );

    return (
        <div className={`code-editor-wrapper ${className ?? ''}`} style={{ height }}>
            <Editor
                height="100%"
                language="pascal"
                theme={PASCAL_RETRO_THEME}
                value={value}
                onChange={handleChange}
                onMount={handleMount}
                options={options}
                loading={<EditorLoadingFallback />}
            />
        </div>
    );
}

export default CodeEditor;
