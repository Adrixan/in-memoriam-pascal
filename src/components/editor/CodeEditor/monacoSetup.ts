/**
 * Monaco is bundled with the app (no CDN): offline use works and no third party
 * learns who is using the tutorial. Only the editor core and its standard
 * contributions are loaded; Pascal is the only language and needs nothing but
 * the base editor worker.
 */

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';

import { registerPascalLanguage } from './PascalLanguage';
import { registerPascalTheme } from './PascalTheme';

(self as unknown as { MonacoEnvironment: { getWorker: () => Worker } }).MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
};

loader.config({ monaco });
registerPascalLanguage(monaco);
registerPascalTheme(monaco);
