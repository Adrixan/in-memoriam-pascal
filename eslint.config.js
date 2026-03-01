import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    // Global ignores - must be first
    {
        ignores: [
            'dist/**',
            'dev-dist/**',
            'external/**',
            'node_modules/**',
            '.git/**',
            '.github/**',
            'coverage/**',
            'playwright-report/**',
            'test-results/**',
            '**/*.tsbuildinfo',
            '.cache/**',
            '.kilocode/**'
        ]
    },
    // Base TypeScript config
    ...tseslint.configs.recommended,
    // Base JS config
    js.configs.recommended,
    // Project-specific config
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    }
);
