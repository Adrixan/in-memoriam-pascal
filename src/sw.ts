/**
 * Service Worker for PWA
 * This file is used by vite-plugin-pwa with injectManifest strategy
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import type { WorkboxPlugin } from 'workbox-core';

// Clean up old caches
cleanupOutdatedCaches();

// Precache all assets (injected by Vite build)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
precacheAndRoute((self as any).__WB_MANIFEST);

// Navigation route for SPA - NetworkFirst for offline support
// Matches all navigation requests (all SPA routes)
registerRoute(
    new NavigationRoute(
        new NetworkFirst({
            cacheName: 'navigation-cache',
            networkTimeoutSeconds: 3,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [200],
                }) as WorkboxPlugin,
                new ExpirationPlugin({
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24, // 1 day
                }) as WorkboxPlugin,
            ],
        }),
        {
            // Allow all navigation requests - matches root and all SPA routes
            // This includes: /, /tutorial, /tutorial/1, /tutorial/any-path, etc.
            allowlist: [/^\/.*$/],
        }
    )
);

// Cache Monaco Editor chunks (large, rarely changes)
registerRoute(
    /monaco-editor/,
    new CacheFirst({
        cacheName: 'monaco-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }) as WorkboxPlugin,
            new ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            }) as WorkboxPlugin,
        ],
    })
);

// Cache Pascal.js interpreter files from external directory
registerRoute(
    /external\/pascal\.js/,
    new CacheFirst({
        cacheName: 'interpreter-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }) as WorkboxPlugin,
            new ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            }) as WorkboxPlugin,
        ],
    })
);

// Cache static assets (images, fonts)
registerRoute(
    /\.(?:png|jpg|jpeg|svg|webp|woff2?)$/,
    new CacheFirst({
        cacheName: 'assets-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }) as WorkboxPlugin,
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            }) as WorkboxPlugin,
        ],
    })
);

// Cache JS/CSS chunks
registerRoute(
    /\.(?:js|css)$/,
    new CacheFirst({
        cacheName: 'static-resources',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }) as WorkboxPlugin,
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            }) as WorkboxPlugin,
        ],
    })
);

// Skip waiting on update
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).addEventListener('message', (event: MessageEvent) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (self as any).skipWaiting();
    }
});

// Claim clients immediately after activation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).addEventListener('activate', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).clients.claim();
});
