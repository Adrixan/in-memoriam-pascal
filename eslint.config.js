import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig(
    globalIgnores([
        'dist/**',
        'src/engine/generated/**',
        'dev-dist/**',
        'external/**',
        'node_modules/**',
        '.git/**',
        '.github/**',
        '.scratch/**',
        'coverage/**',
        'playwright-report/**',
        'test-results/**',
        '**/*.tsbuildinfo',
        '.cache/**',
    ]),
    // Base TypeScript config
    tseslint.configs.recommended,
    // Base JS config
    js.configs.recommended,
    // Test files config with node globals
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'tests/**/*.ts'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    // Project-specific config
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            // Hooks rules plus the React Compiler rules (purity, refs, set-state-in-effect, ...)
            reactHooks.configs.flat.recommended,
            // Fast Refresh boundaries as supported by @vitejs/plugin-react
            reactRefresh.configs.vite(),
        ],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-unused-vars': 'off',
        },
    }
);
