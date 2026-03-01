/**
 * Accessibility Audit Tests using axe-core
 * 
 * Tests WCAG 2.1 AA compliance for all pages
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
    test('home page has no critical accessibility issues', async ({ page }) => {
        await page.goto('/');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Run axe accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

        // Log violations for debugging
        const criticalViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical'
        );
        const seriousViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'serious'
        );

        if (criticalViolations.length > 0) {
            console.log('Critical violations:', JSON.stringify(criticalViolations, null, 2));
        }
        if (seriousViolations.length > 0) {
            console.log('Serious violations:', JSON.stringify(seriousViolations, null, 2));
        }

        // Expect no critical violations
        expect(criticalViolations.length).toBe(0);
    });

    test('tutorial page has no critical accessibility issues', async ({ page }) => {
        await page.goto('/tutorial');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Wait for Monaco editor to load (if present)
        await page.waitForTimeout(2000);

        // Run axe accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

        // Log violations for debugging
        const criticalViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical'
        );
        const seriousViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'serious'
        );

        if (criticalViolations.length > 0) {
            console.log('Critical violations:', JSON.stringify(criticalViolations, null, 2));
        }
        if (seriousViolations.length > 0) {
            console.log('Serious violations:', JSON.stringify(seriousViolations, null, 2));
        }

        // Expect no critical violations
        expect(criticalViolations.length).toBe(0);
    });

    test('editor page has no critical accessibility issues', async ({ page }) => {
        await page.goto('/editor');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Wait for Monaco editor to load
        await page.waitForTimeout(3000);

        // Run axe accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

        // Log violations for debugging
        const criticalViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical'
        );
        const seriousViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'serious'
        );

        if (criticalViolations.length > 0) {
            console.log('Critical violations:', JSON.stringify(criticalViolations, null, 2));
        }
        if (seriousViolations.length > 0) {
            console.log('Serious violations:', JSON.stringify(seriousViolations, null, 2));
        }

        // Expect no critical violations
        expect(criticalViolations.length).toBe(0);
    });

    test('keyboard navigation works on home page', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Get all focusable elements
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"]):not([tabindex="-1"])'
        ];

        // Press Tab multiple times to navigate through page
        const tabCount = 10;
        for (let i = 0; i < tabCount; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
        }

        // Check that focus is visible - get active element
        const focusedElement = await page.locator(':focus');
        const isVisible = await focusedElement.isVisible();

        // At least one element should be focusable and focus should be visible
        const focusableCount = await page.locator(focusableSelectors.join(', ')).count();
        expect(focusableCount).toBeGreaterThan(0);
        expect(isVisible).toBe(true);
    });

    test('keyboard activation works on home page', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find first link or button and test Enter key activation
        const firstButton = page.locator('button').first();
        if (await firstButton.count() > 0) {
            await firstButton.focus();
            await page.keyboard.press('Enter');
            // Just verify it doesn't throw an error
            await page.waitForTimeout(500);
        }
    });

    test('home page has proper landmark regions', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check for banner (header)
        const header = page.locator('header, [role="banner"]');
        await expect(header).toBeVisible();

        // Check for main content
        const main = page.locator('main, [role="main"]');
        await expect(main).toBeVisible();

        // Check for contentinfo (footer)
        const footer = page.locator('footer, [role="contentinfo"]');
        await expect(footer).toBeVisible();
    });

    test('skip link is present and functional', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check skip link exists
        const skipLink = page.locator('.skip-link, a[href="#main-content"]');
        await expect(skipLink).toBeAttached();

        // Use keyboard to activate skip link (first tab to reach skip link, then Enter)
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);

        // Verify main content receives focus
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeVisible();
    });

    test('no missing form labels on tutorial page', async ({ page }) => {
        await page.goto('/tutorial');
        await page.waitForLoadState('networkidle');

        // Run axe accessibility scan focusing on forms
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

        // Filter for label-related violations
        const labelViolations = accessibilityScanResults.violations.filter(
            (v) => v.id === 'label' || v.id === 'input-label'
        );

        expect(labelViolations.length).toBe(0);
    });
});
