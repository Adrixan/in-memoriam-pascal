/**
 * Monaco is bundled with the app (no CDN): offline use works and no third party
 * learns who is using the tutorial. Only the editor core and its standard
 * contributions are loaded; Pascal is the only language and needs nothing but
 * the base editor worker.
 */

import { loader, type Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';

import { registerPascalLanguage } from './PascalLanguage';
import { registerPascalTheme } from './PascalTheme';

(self as unknown as { MonacoEnvironment: { getWorker: () => Worker } }).MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
};

const monacoApi = monaco as unknown as Monaco;
loader.config({ monaco: monacoApi });
registerPascalLanguage(monacoApi);
registerPascalTheme(monacoApi);
