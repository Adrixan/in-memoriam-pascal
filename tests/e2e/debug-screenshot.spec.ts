import { test } from '@playwright/test';

test.setTimeout(60000);

test('debug - check interpreter initialization', async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
        console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    });

    // Capture errors
    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}`);
        console.log(`[PAGE ERROR STACK] ${error.stack}`);
    });

    // Navigate to tutorial page
    console.log('Navigating to tutorial page...');
    await page.goto('/tutorial/1', { timeout: 30000 });

    // Wait for React to render
    await page.waitForTimeout(3000);

    // Check if pascalJsReady function exists
    const pascalStatus = await page.evaluate(() => {
        const win = window as unknown as Record<string, unknown>;
        const readyCheck = win['pascalJsReady'] as (() => Record<string, boolean>) | undefined;
        if (readyCheck) {
            return readyCheck();
        }
        return { error: 'pascalJsReady not found' };
    });
    console.log('\n=== PASCAL.JS STATUS ===');
    console.log(JSON.stringify(pascalStatus, null, 2));

    // Check if interpreter is ready
    const interpreterStatus = await page.evaluate(() => {
        const win = window as unknown as Record<string, unknown>;
        return {
            parse: typeof win['parse'],
            IR: typeof win['IR'],
            llvmAs: typeof win['llvmAs'],
            llvmDis: typeof win['llvmDis'],
            compile: typeof win['compile'],
        };
    });
    console.log('\n=== INTERPRETER GLOBALS ===');
    console.log(JSON.stringify(interpreterStatus, null, 2));

    // Wait longer for LLVM.js to load
    console.log('\nWaiting 10 more seconds for LLVM.js...');
    await page.waitForTimeout(10000);

    // Check again
    const pascalStatusAfter = await page.evaluate(() => {
        const win = window as unknown as Record<string, unknown>;
        const readyCheck = win['pascalJsReady'] as (() => Record<string, boolean>) | undefined;
        if (readyCheck) {
            return readyCheck();
        }
        return { error: 'pascalJsReady not found' };
    });
    console.log('\n=== PASCAL.JS STATUS AFTER WAIT ===');
    console.log(JSON.stringify(pascalStatusAfter, null, 2));

    // Find the Run button
    const runButton = page.locator('button:has-text("Wird geladen"), button:has-text("Ausführen"), button:has-text("Run")').first();
    const buttonText = await runButton.innerText().catch(() => 'not found');
    console.log(`\nRun button text: "${buttonText}"`);
});
