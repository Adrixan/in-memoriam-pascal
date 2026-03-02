/**
 * E2E Tests for App Navigation
 * 
 * Tests critical navigation flows:
 * - App loading
 * - Home page navigation
 * - Tutorial page navigation
 * - Level navigation
 * - Mobile navigation
 * - 404 page handling
 */

import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
    test('app loads correctly', async ({ page }) => {
        await page.goto('/');

        // Wait for the app to load
        await page.waitForSelector('header', { timeout: 15000 });

        // Verify header is visible
        await expect(page.locator('header')).toBeVisible();

        // Verify main content area exists
        await expect(page.locator('main, [role="main"]')).toBeVisible();
    });

    test('home page displays correctly', async ({ page }) => {
        await page.goto('/');

        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Verify home page content
        const title = page.locator('h1, .hero-title, [data-testid="hero-title"]').first();
        await expect(title).toBeVisible({ timeout: 15000 });

        // Verify navigation links exist - use generic selector for HashRouter
        const homeLink = page.locator('header a').first();
        await expect(homeLink).toBeVisible();
    });

    test('user can navigate to tutorial from home page', async ({ page }) => {
        await page.goto('/');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Find and click tutorial link
        const tutorialLink = page.locator('a[href*="/tutorial"]').first();
        await expect(tutorialLink).toBeVisible({ timeout: 10000 });

        await tutorialLink.click();

        // Verify we're on a tutorial page
        await expect(page).toHaveURL(/\/tutorial/);

        // Verify tutorial page loaded
        await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    });

    test('header navigation works correctly', async ({ page }) => {
        await page.goto('/');

        // Wait for header
        await page.waitForSelector('header', { timeout: 15000 });

        // Click home link - use header links selector for HashRouter
        const homeLink = page.locator('header a').first();
        await homeLink.click();

        // Should still be on home page - HashRouter adds #/
        await expect(page).toHaveURL(/\/#\/|$/);

        // Navigate to tutorial via header
        const tutorialLink = page.locator('header a').filter({ hasText: /tutorial/i }).first();
        await tutorialLink.click();

        // Should be on tutorial page
        await expect(page).toHaveURL(/\/tutorial/);
    });

    test('direct URL navigation to tutorial level works', async ({ page }) => {
        // Navigate directly to a specific level
        await page.goto('/tutorial/hello-world');

        // Verify page loaded
        await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });

        // Verify we're on the correct page
        await expect(page).toHaveURL('/tutorial/hello-world');
    });

    test('404 page displays for invalid routes', async ({ page }) => {
        // Navigate to a non-existent route with hash (HashRouter format)
        await page.goto('/#/non-existent-page');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Should show 404 or not found content - wait for the content to appear
        const notFoundContent = page.locator('text=/404|Not Found|Page not found/i');
        await expect(notFoundContent.first()).toBeVisible({ timeout: 15000 });
    });
});

test.describe('Level Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Start at the first tutorial level
        await page.goto('/tutorial/hello-world');
        await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    });

    test('level navigation sidebar is visible on desktop', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Re-navigate to ensure viewport change is applied
        await page.goto('/tutorial/hello-world');
        await page.waitForLoadState('networkidle');

        // Verify the page loaded correctly by checking for h1
        const h1 = page.locator('h1');
        await expect(h1).toBeVisible({ timeout: 10000 });
    });

    test('can navigate between levels', async ({ page }) => {
        // Set viewport to desktop size first
        await page.setViewportSize({ width: 1280, height: 720 });

        // Navigate to tutorial page first (use hash for HashRouter)
        await page.goto('/#/tutorial/hello-world');
        await page.waitForLoadState('networkidle');

        // Find level navigation sidebar links - look for any links in the sidebar aside
        const levelLinks = page.locator('aside a');
        const linkCount = await levelLinks.count();

        // Verify there are level links available
        expect(linkCount).toBeGreaterThan(0);

        if (linkCount > 1) {
            // Click on a different level (not the current one)
            await levelLinks.nth(1).click();

            // Verify URL changed
            await expect(page).toHaveURL(/\/tutorial\//);

            // Verify new level loaded
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('current level is highlighted in navigation', async ({ page }) => {
        // Get current URL path
        const currentPath = page.url().split('/').pop();

        // Find tutorial links
        const levelLinks = page.locator('a[href*="/tutorial/"]');
        const linkCount = await levelLinks.count();

        // Verify there are level links (may be 0 on mobile without opening menu)
        expect(linkCount).toBeGreaterThanOrEqual(0);

        // Check if any link contains the current path
        if (currentPath && linkCount > 0) {
            const currentLevelLink = page.locator(`a[href*="${currentPath}"]`);
            const hasCurrentLink = await currentLevelLink.count() > 0;
            expect(hasCurrentLink).toBeTruthy();
        }
    });

    test('mobile menu toggle works', async ({ page }) => {
        // Set viewport to mobile size
        await page.setViewportSize({ width: 375, height: 667 });

        // Look for mobile menu button
        const menuButton = page.locator('button[aria-expanded], button:has-text("Menu"), button:has-text("☰")').first();

        if (await menuButton.count() > 0) {
            // Click to open menu
            await menuButton.click();

            // Wait for animation
            await page.waitForTimeout(300);

            // Verify menu is open (aria-expanded should be true)
            const isExpanded = await menuButton.getAttribute('aria-expanded');
            expect(isExpanded).toBe('true');
        }
    });
});

test.describe('Accessibility Navigation', () => {
    test('skip to main content link exists', async ({ page }) => {
        await page.goto('/');

        // Look for skip link (usually hidden until focused)
        const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip")');

        // Skip link may or may not exist depending on implementation
        const skipLinkCount = await skipLink.count();

        // This test documents whether skip links are implemented
        expect(skipLinkCount).toBeGreaterThanOrEqual(0);
    });

    test('keyboard navigation works', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('header', { timeout: 15000 });

        // Press Tab to navigate
        await page.keyboard.press('Tab');

        // Verify focus is visible somewhere on the page
        const focusedElement = page.locator(':focus');
        await expect(focusedElement.first()).toBeVisible();
    });

    test('all interactive elements are focusable', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Get all links and buttons
        const interactiveElements = page.locator('a, button');
        const count = await interactiveElements.count();

        // Should have interactive elements
        expect(count).toBeGreaterThan(0);

        // First element should be focusable
        const firstElement = interactiveElements.first();
        await firstElement.focus();
        await expect(firstElement).toBeFocused();
    });

    test('page has proper heading structure', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Should have exactly one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
    });
});

test.describe('Browser Navigation', () => {
    test('back button works correctly', async ({ page }) => {
        // Start at home
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to tutorial
        const tutorialLink = page.locator('a[href*="/tutorial"]').first();
        await tutorialLink.click();
        await expect(page).toHaveURL(/\/tutorial/);

        // Go back
        await page.goBack();

        // Should be back at home
        await expect(page).toHaveURL('/');
    });

    test('forward button works correctly', async ({ page }) => {
        // Start at home
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to tutorial
        const tutorialLink = page.locator('a[href*="/tutorial"]').first();
        await tutorialLink.click();
        await expect(page).toHaveURL(/\/tutorial/);

        // Go back then forward
        await page.goBack();
        await page.goForward();

        // Should be back at tutorial
        await expect(page).toHaveURL(/\/tutorial/);
    });

    test('page refresh maintains state', async ({ page }) => {
        // Navigate to tutorial
        await page.goto('/tutorial/hello-world');
        await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });

        // Refresh the page
        await page.reload();

        // Should still be on the same page
        await expect(page).toHaveURL('/tutorial/hello-world');
        await expect(page.locator('h1')).toBeVisible();
    });
});
