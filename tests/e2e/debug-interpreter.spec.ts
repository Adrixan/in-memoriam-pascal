/**
 * Debug test for interpreter initialization
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from '@playwright/test';

test.describe('Interpreter Debug', () => {
    test('capture interpreter initialization errors', async ({ page }) => {
        // Capture console messages
        const consoleMessages: { type: string; text: string }[] = [];
        page.on('console', msg => {
            consoleMessages.push({ type: msg.type(), text: msg.text() });
        });

        // Capture page errors
        const pageErrors: Error[] = [];
        page.on('pageerror', error => {
            pageErrors.push(error);
        });

        // Navigate to tutorial page
        await page.goto('http://localhost:5173/tutorial/1', { waitUntil: 'domcontentloaded' });

        // Wait for page to render
        await page.waitForTimeout(2000);

        // Check if error page is shown
        const errorPage = await page.locator('text=Something went wrong').isVisible().catch(() => false);
        console.log('Error page visible:', errorPage);

        // Check interpreter globals
        const globals = await page.evaluate(() => {
            return {
                parse: typeof (window as any).parse,
                IR: typeof (window as any).IR,
                llvmAs: typeof (window as any).llvmAs,
                llvmDis: typeof (window as any).llvmDis,
                compile: typeof (window as any).compile,
                pascalJsReady: typeof (window as any).pascalJsReady,
            };
        });
        console.log('Globals:', JSON.stringify(globals, null, 2));

        // Check if Run button is enabled
        const isLoading = await page.locator('button:has-text("Wird geladen")').isVisible().catch(() => false);
        console.log('Run button loading:', isLoading);

        // Wait longer for LLVM.js to initialize
        await page.waitForTimeout(5000);

        // Check globals again
        const globalsAfter = await page.evaluate(() => {
            return {
                parse: typeof (window as any).parse,
                IR: typeof (window as any).IR,
                llvmAs: typeof (window as any).llvmAs,
                llvmDis: typeof (window as any).llvmDis,
                compile: typeof (window as any).compile,
            };
        });
        console.log('Globals after 5s:', JSON.stringify(globalsAfter, null, 2));

        // Print console messages
        console.log('\n=== Console Messages ===');
        for (const msg of consoleMessages) {
            console.log(`[${msg.type}] ${msg.text}`);
        }

        // Print page errors
        if (pageErrors.length > 0) {
            console.log('\n=== Page Errors ===');
            for (const error of pageErrors) {
                console.log(error.message);
            }
        }

        // Take screenshot
        await page.screenshot({ path: 'test-results/debug-interpreter.png', fullPage: true });

        // Check if scripts are loaded
        const scripts = await page.evaluate(() => {
            const scriptTags = Array.from(document.querySelectorAll('script[src]'));
            return scriptTags.map(s => s.getAttribute('src'));
        });
        console.log('\n=== Loaded Scripts ===');
        console.log(scripts);
    });
});
