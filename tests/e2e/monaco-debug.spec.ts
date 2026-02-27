import { test, expect } from '@playwright/test';

test.describe('Monaco Debug', () => {
    test('check monaco loading state', async ({ page }) => {
        // Collect console messages
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(`[${msg.type()}] ${msg.text}`);
        });

        // Collect errors
        const errors: string[] = [];
        page.on('pageerror', error => {
            errors.push(error.message);
        });

        // Navigate to tutorial page
        await page.goto('/tutorial/hello-world');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Wait additional time for Monaco
        await page.waitForTimeout(5000);

        // Check for Monaco editor element
        const monacoEditor = await page.locator('.monaco-editor').count();
        const loadingFallback = await page.locator('text=Loading').count();

        // Check editor store state
        const storeState = await page.evaluate(() => {
            // Check if monaco global exists
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hasMonacoGlobal = typeof (window as any).monaco !== 'undefined';

            // Check for editor models
            let modelCount = 0;
            let editorValue = '';
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const win = window as any;
                if (win.monaco?.editor?.getModels) {
                    const models = win.monaco.editor.getModels();
                    modelCount = models.length;
                    if (models[0]) {
                        editorValue = models[0].getValue();
                    }
                }
            } catch {
                // ignore
            }

            // Check for Zustand store state via React DevTools hook
            // Or check localStorage for persisted state
            let editorIsReady = false;
            try {
                const stored = localStorage.getItem('editor-storage');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    editorIsReady = parsed?.state?.isReady ?? false;
                }
            } catch {
                // ignore
            }

            // Check run button state
            const runButtons = document.querySelectorAll('button');
            let runButtonDisabled = false;
            let runButtonText = '';
            let runButtonFound = false;

            for (const btn of runButtons) {
                const text = btn.textContent || '';
                if (text.includes('Run') || text.includes('Ausführen') || text.includes('Loading') || text.includes('Wird geladen')) {
                    runButtonDisabled = (btn as HTMLButtonElement).disabled;
                    runButtonText = text;
                    runButtonFound = true;
                    break;
                }
            }

            return {
                hasMonacoGlobal,
                modelCount,
                editorValue: editorValue.substring(0, 200),
                editorIsReady,
                runButtonDisabled,
                runButtonText,
                runButtonFound
            };
        });

        console.log('=== Console Messages ===');
        consoleMessages.forEach(m => console.log(m));

        console.log('\n=== Page Errors ===');
        errors.forEach(e => console.log(e));

        console.log('\n=== Monaco State ===');
        console.log('Monaco editor elements:', monacoEditor);
        console.log('Loading fallbacks:', loadingFallback);
        console.log('Store state:', JSON.stringify(storeState, null, 2));

        // Take screenshot
        await page.screenshot({ path: '/tmp/monaco_debug.png', fullPage: true });

        // Basic assertion
        expect(monacoEditor).toBeGreaterThan(0);
    });
});
