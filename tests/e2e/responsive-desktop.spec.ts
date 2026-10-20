import { expect, test } from '@playwright/test';

const viewports = [
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'Full HD', width: 1920, height: 1080 },
    { name: '4K', width: 3840, height: 2160 },
];

for (const viewport of viewports) {
    test(`key pages remain sharp and fit at ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const route of ['/', '/#/tutorial/hello-world', '/#/editor']) {
            await page.goto(route);
            await expect(page.locator('main h1').first()).toBeVisible({ timeout: 15000 });

            const measurements = await page.evaluate(() => {
                const heading = document.querySelector('h1');
                const tutorial = document.querySelector('.tutorial-main-content');
                const headingShadow = heading ? getComputedStyle(heading).textShadow : 'none';
                const shadowBlur = headingShadow.match(/0px 0px ([\d.]+)px/);
                const blur = Number.parseFloat(shadowBlur?.[1] ?? '0');
                return {
                    viewport: window.innerWidth,
                    documentWidth: document.documentElement.scrollWidth,
                    tutorialWidth: tutorial?.getBoundingClientRect().width ?? null,
                    headingShadow,
                    headingBlurPx: Number.isFinite(blur) ? blur : 0,
                };
            });

            expect(measurements.documentWidth, `${route} overflows at ${viewport.width}px`).toBeLessThanOrEqual(
                measurements.viewport,
            );
            expect(measurements.headingBlurPx, `${route} heading glow is too diffuse`).toBeLessThanOrEqual(3);
            if (route.includes('/tutorial/')) {
                expect(measurements.tutorialWidth).not.toBeNull();
                expect(measurements.tutorialWidth!).toBeLessThanOrEqual(1800);
            }
        }
    });
}
