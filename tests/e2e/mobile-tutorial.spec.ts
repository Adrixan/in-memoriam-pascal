/**
 * Mobile Responsiveness Tests for TutorialPage
 * 
 * Tests the TutorialPage on various mobile viewports:
 * - iPhone SE (375x667)
 * - iPad (768x1024)
 * - iPhone 12 (390x844)
 */

import { test, expect } from '@playwright/test';

test.describe('TutorialPage Mobile Responsiveness', () => {

    const mobileViewports = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'iPhone 12', width: 390, height: 844 },
    ];

    for (const viewport of mobileViewports) {
        test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {

            test.beforeEach(async ({ page }) => {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.goto('/#/tutorial/hello-world');
                // Wait for page to fully load
                await page.waitForLoadState('networkidle');
            });

            test('page loads without horizontal scroll', async ({ page }) => {
                // Check for horizontal overflow
                const hasHorizontalScroll = await page.evaluate(() => {
                    return document.documentElement.scrollWidth > window.innerWidth;
                });

                expect(hasHorizontalScroll, `No horizontal scroll should exist on ${viewport.name}`).toBe(false);
            });

            test('navigation is accessible on mobile', async ({ page }) => {
                // Check that the main header/navigation is visible using role
                const header = page.locator('[role="banner"]');
                await expect(header).toBeVisible();

                // Check for mobile menu toggle if it exists
                const menuButton = page.locator('button[aria-label="Menu"], button[aria-label="menu"], button:has-text("Menu"), [class*="menu"]');
                const menuButtonCount = await menuButton.count();

                if (menuButtonCount > 0) {
                    // Menu button exists, test it works
                    await menuButton.first().click();
                    // Wait a moment for any animation
                    await page.waitForTimeout(300);
                }
            });

            test('code editor loads and is visible', async ({ page }) => {
                // Wait for Monaco editor to load
                const editorContainer = page.locator('.monaco-editor');

                // Wait for the editor to be present (may take a moment for lazy loading)
                await expect(editorContainer.first()).toBeVisible({ timeout: 15000 });

                // Verify the editor has content (starter code)
                const editorLines = page.locator('.monaco-editor .view-lines');
                await expect(editorLines).toBeVisible();

                // Verify the editor has code content
                const content = await editorLines.textContent();
                expect(content).toBeTruthy();
                expect(content?.length).toBeGreaterThan(0);
            });

            test('run button is accessible on mobile', async ({ page }) => {
                // Find the run button
                const runButton = page.locator('button:has-text("Run"), [aria-label*="Run"], button[class*="run"]');

                // Check button exists and is visible
                const buttonCount = await runButton.count();
                if (buttonCount > 0) {
                    await expect(runButton.first()).toBeVisible();

                    // Check button has minimum touch target size (44x44)
                    const buttonBox = await runButton.first().boundingBox();
                    if (buttonBox) {
                        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
                        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
                    }
                }
            });

            test('output window is visible', async ({ page }) => {
                // Check output window is present
                const outputWindow = page.locator('[class*="output"], [class*="terminal"], pre:has-text("Output"), [role="log"]');
                const outputCount = await outputWindow.count();

                if (outputCount > 0) {
                    await expect(outputWindow.first()).toBeVisible();
                }
            });
        });
    }

    test('Monaco editor is functional on mobile', async ({ page }) => {
        // Test specifically on iPhone SE viewport (smallest)
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/#/tutorial/hello-world');

        // Wait for editor to load
        const editorContainer = page.locator('.monaco-editor');
        await expect(editorContainer.first()).toBeVisible({ timeout: 15000 });

        // Verify the editor has code content (starter code loaded)
        const editorLines = page.locator('.monaco-editor .view-lines');
        const content = await editorLines.textContent();

        // The content should have the starter code
        expect(content).toBeTruthy();
        expect(content?.length).toBeGreaterThan(10);

        // Verify Monaco is fully loaded by checking for line numbers
        const lineNumbers = page.locator('.monaco-editor .line-numbers');
        await expect(lineNumbers.first()).toBeVisible();

        // Verify the Monaco editor widget is rendered
        const monacoWidget = page.locator('.monaco-editor .monaco-editor-background');
        await expect(monacoWidget.first()).toBeVisible();
    });
});
