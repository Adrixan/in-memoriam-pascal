import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            registerType: 'prompt',
            injectRegister: 'auto',

            // PWA manifest - inline configuration (public/manifest.json is for static serving)
            manifest: {
                name: 'In Memoriam Pascal',
                short_name: 'Pascal Tutorial',
                description: 'Lerne Pascal programmieren mit interaktiven Tutorials',
                start_url: './',
                display: 'standalone',
                background_color: '#0D0D0D',
                theme_color: '#33FF33',
                orientation: 'any',
                icons: [
                    {
                        src: './icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: './icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: './icons/maskable-icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
                categories: ['education', 'productivity'],
                lang: 'de',
            },

            // injectManifest strategy: workbox options for the build process
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                // Exclude large LLVM files - they're handled by runtime caching in sw.ts
                globIgnores: [
                    '**/llvm.js/llvm-*.js',
                    '**/llvm.js/*.js',
                ],
                // Increase limit to accommodate Monaco editor TypeScript worker (7+ MB)
                maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB
            },

            devOptions: {
                enabled: true,
            },
        }),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    // Configure how external files are served
    assetsInclude: ['**/*.wasm'],

    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'i18next', 'react-i18next'],
        // Don't pre-bundle external pascal.js files
        exclude: [],
    },

    // Serve external directory as static files
    server: {
        fs: {
            // Allow serving files from project root
            allow: ['..'],
        },
    },

    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    'monaco-editor': ['monaco-editor'],
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-router': ['react-router-dom'],
                    'vendor-i18n': ['i18next', 'react-i18next'],
                    'vendor-state': ['zustand'],
                },
                // Ensure CSS is code-split alongside JS chunks
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        sourcemap: false,
        // Minify for smaller bundle size
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        // Enable CSS code splitting
        cssCodeSplit: true,
    },

    // Preview server configuration for caching
    preview: {
        headers: {
            'Cache-Control': 'public, max-age=31536000',
        },
    },
});
