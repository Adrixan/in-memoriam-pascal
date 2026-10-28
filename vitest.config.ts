import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        // Builds the Pascal engine bundle when it is missing or outdated
        globalSetup: ['./tests/globalSetup.ts'],
        include: [
            'src/**/*.{test,spec}.{ts,tsx}',
            'tests/{unit,integration,engine}/**/*.{test,spec}.{ts,tsx}',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/index.ts',
                'src/engine/generated/',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
});
