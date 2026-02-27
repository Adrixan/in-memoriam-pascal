import { test } from '@playwright/test';

// Increase timeout for this debug test
test.describe('Run Button Debug', () => {
    test.setTimeout(120000); // 2 minutes

    test('wait for interpreter and click run button', async ({ page }) => {
        // Capture console messages
        const consoleMessages: { type: string; text: string }[] = [];
        page.on('console', (msg) => {
            consoleMessages.push({ type: msg.type(), text: msg.text() });
            console.log(`[Browser ${msg.type()}] ${msg.text()}`);
        });

        // Capture page errors
        const pageErrors: Error[] = [];
        page.on('pageerror', (error) => {
            pageErrors.push(error);
            console.log(`[Page Error] ${error.message}`);
        });

        // Navigate to tutorial page
        console.log('Navigating to tutorial page...');
        await page.goto('http://localhost:5173/tutorial/hello-world', {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        // Wait for React to render
        await page.waitForTimeout(2000);

        // Take a screenshot
        await page.screenshot({ path: 'test-results/debug-01-initial.png', fullPage: true });

        // Check for error boundary
        const errorBoundary = await page.locator('text=/something went wrong/i').count();
        console.log('Error boundary count:', errorBoundary);

        // Check for Monaco editor
        const monacoEditor = await page.locator('.monaco-editor').count();
        console.log('Monaco editor count:', monacoEditor);

        // Check for infinite loop error
        const hasInfiniteLoop = consoleMessages.some(
            (msg) => msg.text.includes('Maximum update depth exceeded')
        );
        console.log('Has infinite loop error:', hasInfiniteLoop);

        // Wait for the run button to be enabled (interpreter ready)
        console.log('\n=== Waiting for interpreter to be ready ===');
        const runButton = page.locator('button.run-button');

        // Wait up to 60 seconds for the button to be enabled
        try {
            await runButton.waitFor({ state: 'visible', timeout: 5000 });

            // Check button state
            const isDisabled = await runButton.isDisabled();
            console.log('Run button disabled:', isDisabled);

            const buttonText = await runButton.textContent();
            console.log('Run button text:', buttonText);

            // Wait for button to be enabled (interpreter ready)
            if (isDisabled) {
                console.log('Waiting for interpreter to load...');

                // Poll for button to be enabled
                for (let i = 0; i < 60; i++) {
                    await page.waitForTimeout(1000);
                    const stillDisabled = await runButton.isDisabled();
                    if (!stillDisabled) {
                        console.log(`Interpreter ready after ${i + 1} seconds`);
                        break;
                    }
                    if (i % 5 === 0) {
                        console.log(`Still waiting... ${i + 1}s`);
                    }
                }
            }

            // Check if button is now enabled
            const isNowDisabled = await runButton.isDisabled();
            console.log('Run button disabled after wait:', isNowDisabled);

            // Take screenshot before click
            await page.screenshot({ path: 'test-results/debug-02-before-click.png', fullPage: true });

            if (!isNowDisabled) {
                console.log('\n=== Clicking Run Button ===');
                await runButton.click();
                await page.waitForTimeout(5000);

                // Take screenshot after click
                await page.screenshot({ path: 'test-results/debug-03-after-click.png', fullPage: true });

                // Check for output
                const outputWindow = await page.locator('.output-window, [data-testid="output"]').count();
                console.log('Output window count:', outputWindow);

                // Check for any output text
                const outputLines = await page.locator('.output-line').allTextContents();
                console.log('Output lines:', outputLines);
            } else {
                console.log('Button still disabled after 60 seconds - interpreter may have failed to load');
            }
        } catch (err) {
            console.log('Error waiting for run button:', err);
        }

        // Log all console messages
        console.log('\n=== All Console Messages ===');
        consoleMessages.forEach((msg) => {
            console.log(`[${msg.type}] ${msg.text}`);
        });

        // Log all page errors
        if (pageErrors.length > 0) {
            console.log('\n=== Page Errors ===');
            pageErrors.forEach((err) => {
                console.log(err.message);
            });
        }

        // Check for error page
        const errorPageVisible = await page.locator('text=/something went wrong/i').isVisible().catch(() => false);
        console.log('\nError page visible:', errorPageVisible);
    });
});
