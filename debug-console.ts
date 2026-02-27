/**
 * Debug script to capture browser console logs and errors
 * when clicking the Run button in the Pascal tutorial app.
 */

import { chromium, Browser, Page } from 'playwright';

const url = 'http://localhost:5173';
const consoleLogs: string[] = [];
const pageErrors: string[] = [];

async function main() {
    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

        // Set up console log capture
        page.on('console', msg => {
            const logEntry = `[${msg.type()}] ${msg.text()}`;
            consoleLogs.push(logEntry);
            console.log(`Console: ${logEntry}`);
        });

        // Set up page error capture
        page.on('pageerror', error => {
            const errorEntry = `PageError: ${error.message}\nStack: ${error.stack}`;
            pageErrors.push(errorEntry);
            console.log(`Page Error: ${error.message}`);
        });

        // Navigate to home page first
        console.log('\n=== Navigating to home page ===');
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Take screenshot of home page
        await page.screenshot({ path: '/tmp/home_page.png' });
        console.log('Screenshot saved to /tmp/home_page.png');

        // Find and click on a tutorial link
        console.log('\n=== Looking for tutorial links ===');

        const links = await page.locator('a').all();
        console.log(`Found ${links.length} links on the page`);

        for (let i = 0; i < links.length; i++) {
            try {
                const href = await links[i].getAttribute('href');
                const text = await links[i].innerText();
                console.log(`  Link ${i}: href='${href}' text='${text}'`);
            } catch (e) {
                console.log(`  Link ${i}: Error getting attributes`);
            }
        }

        // Navigate directly to a tutorial page
        console.log('\n=== Navigating to tutorial page ===');
        await page.goto(`${url}/tutorial/1`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for code editor to load

        // Take screenshot of tutorial page
        await page.screenshot({ path: '/tmp/tutorial_page.png' });
        console.log('Screenshot saved to /tmp/tutorial_page.png');

        // Find the Run button (Ausführen)
        console.log('\n=== Looking for Run button ===');
        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on the page`);

        for (let i = 0; i < buttons.length; i++) {
            try {
                const text = await buttons[i].innerText();
                const disabled = await buttons[i].isDisabled();
                console.log(`  Button ${i}: text='${text}' disabled=${disabled}`);
            } catch (e) {
                console.log(`  Button ${i}: Error getting attributes`);
            }
        }

        // Click the Run button
        console.log('\n=== Clicking Run button ===');
        try {
            // Try to find button by German text
            const runButton = page.locator('button:has-text("Ausführen")');
            const count = await runButton.count();
            if (count > 0) {
                console.log("Found 'Ausführen' button, waiting for it to be enabled...");

                // Wait for the button to be enabled (up to 10 seconds)
                try {
                    await runButton.first().waitFor({ state: 'visible', timeout: 5000 });
                    // Wait for button to be enabled
                    await page.waitForFunction(
                        () => {
                            const btn = document.querySelector('button[aria-label="Ausführen"]');
                            return btn && !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true';
                        },
                        { timeout: 10000 }
                    );
                    console.log("Button is now enabled, clicking...");
                    await runButton.first().click();
                } catch (waitError) {
                    console.log(`Button did not become enabled: ${waitError}`);

                    // Check the button state
                    const btn = await runButton.first();
                    const isDisabled = await btn.isDisabled();
                    const ariaDisabled = await btn.getAttribute('aria-disabled');
                    const ariaLabel = await btn.getAttribute('aria-label');
                    console.log(`Button state: disabled=${isDisabled}, aria-disabled=${ariaDisabled}, aria-label=${ariaLabel}`);
                }
            } else {
                // Try English text
                const runButtonEn = page.locator('button:has-text("Run")');
                const countEn = await runButtonEn.count();
                if (countEn > 0) {
                    console.log("Found 'Run' button, clicking...");
                    await runButtonEn.first().click();
                } else {
                    console.log("Could not find Run button by text");
                }
            }
        } catch (e) {
            console.log(`Error clicking Run button: ${e}`);
        }

        // Wait for execution to complete
        await page.waitForTimeout(3000);

        // Take screenshot after clicking
        await page.screenshot({ path: '/tmp/after_run.png' });
        console.log('Screenshot saved to /tmp/after_run.png');

        // Check if error page is shown
        const pageContent = await page.content();
        if (pageContent.includes("Something went wrong")) {
            console.log("\n!!! ERROR PAGE DETECTED !!!");
            console.log("The ErrorBoundary caught an error");
        }

        // Check editor state
        console.log('\n=== Checking editor state ===');
        try {
            const editorState = await page.evaluate(() => {
                // Check if Monaco editor is loaded
                const monacoEditor = document.querySelector('.monaco-editor');
                const editorContainer = document.querySelector('#monaco-editor-container');

                // Check if there's code in the editor
                const viewLines = document.querySelectorAll('.view-line');
                let codeText = '';
                viewLines.forEach(line => {
                    codeText += line.textContent + '\n';
                });

                return {
                    hasMonacoEditor: !!monacoEditor,
                    hasEditorContainer: !!editorContainer,
                    viewLinesCount: viewLines.length,
                    codePreview: codeText.substring(0, 200)
                };
            });
            console.log('Editor state:', JSON.stringify(editorState, null, 2));
        } catch (e) {
            console.log(`Error checking editor state: ${e}`);
        }

        // Check React state via window
        console.log('\n=== Checking React/Store state ===');
        try {
            const storeState = await page.evaluate(() => {
                // Try to get Zustand state
                const getStoreState = (storeName: string) => {
                    try {
                        // Zustand stores state in internal properties
                        // We can try to find it via the window object
                        return null;
                    } catch {
                        return null;
                    }
                };

                return {
                    // We can't easily access Zustand state from outside
                    // But we can check if the scripts are loaded
                    hasParse: typeof (window as any).parse !== 'undefined',
                    hasIR: typeof (window as any).IR !== 'undefined',
                    hasLlvmAs: typeof (window as any).llvmAs !== 'undefined',
                    hasLlvmDis: typeof (window as any).llvmDis !== 'undefined',
                    hasCompile: typeof (window as any).compile !== 'undefined',
                };
            });
            console.log('Store state:', JSON.stringify(storeState, null, 2));
        } catch (e) {
            console.log(`Error checking store state: ${e}`);
        }

        // Get the current page URL
        console.log(`\nCurrent URL: ${page.url()}`);

    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`\nConsole logs captured: ${consoleLogs.length}`);
    for (const log of consoleLogs) {
        console.log(`  ${log}`);
    }

    console.log(`\nPage errors captured: ${pageErrors.length}`);
    for (const error of pageErrors) {
        console.log(`  ${error}`);
    }

    // Save logs to file
    const fs = await import('fs');
    fs.writeFileSync('/tmp/debug_console.log',
        "Console Logs:\n" + consoleLogs.join('\n') +
        "\n\nPage Errors:\n" + pageErrors.join('\n'));
    console.log('\nLogs saved to /tmp/debug_console.log');
}

main().catch(console.error);
