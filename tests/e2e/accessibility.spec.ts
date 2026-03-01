/**
 * Accessibility Audit Tests using axe-core
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
            console.log('Critical violations:', criticalViolations);
        }
        if (seriousViolations.length > 0) {
            console.log('Serious violations:', seriousViolations);
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
            console.log('Critical violations:', criticalViolations);
        }
        if (seriousViolations.length > 0) {
            console.log('Serious violations:', seriousViolations);
        }

        // Expect no critical violations
        expect(criticalViolations.length).toBe(0);
    });
});
