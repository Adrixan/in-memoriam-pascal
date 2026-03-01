/**
 * CodeEditor component exports
 */

// Configure Monaco to use local workers for better reliability in CI environments
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco environment for web workers
// This ensures Monaco uses local workers instead of loading from CDN
// This is the standard way to configure Monaco workers in Vite
(self as unknown as { MonacoEnvironment: { getWorker: (module: unknown, label: string) => Worker } }).MonacoEnvironment = {
    getWorker(_module: unknown, label: string): Worker {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

export { CodeEditor, type CodeEditorProps } from './CodeEditor';
export { registerPascalLanguage, KEYWORDS, BUILTINS, CONSTANTS, OPERATORS } from './PascalLanguage';
export { registerPascalTheme, PASCAL_RETRO_THEME, colors } from './PascalTheme';
export { default } from './CodeEditor';
