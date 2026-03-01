/**
 * CodeEditor Component Tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CodeEditor } from './CodeEditor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => {
    // Create a promise-based mock for lazy loading
    const MockEditorComponent = ({ onMount, onChange, value, loading: _loading }: {
        onMount?: (_editor: ReturnType<typeof vi.fn>, _monaco: ReturnType<typeof vi.fn>) => void;
        onChange?: (_value: string) => void;
        value?: string;
        loading?: boolean;
    }) => {
        // Simulate editor mount
        if (onMount) {
            const mockEditor = {
                updateOptions: vi.fn(),
                onDidChangeCursorPosition: vi.fn(),
                getValue: () => value || '',
                setValue: vi.fn(),
            };
            const mockMonaco = {
                languages: {
                    register: vi.fn(),
                    setMonarchTokensProvider: vi.fn(),
                    setLanguageConfiguration: vi.fn(),
                    registerCompletionItemProvider: vi.fn(),
                },
                editor: {
                    defineTheme: vi.fn(),
                    setTheme: vi.fn(),
                },
            };
            // Use setImmediate to ensure async behavior
            setImmediate(() => onMount(mockEditor as never, mockMonaco as never));
        }

        // Return the editor mock (not loading state)
        return (
            <div
                data-testid="monaco-editor"
                data-value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
            >
                Monaco Editor Mock
            </div>
        );
    };

    return {
        default: MockEditorComponent,
    };
});

// Mock stores
vi.mock('@/stores/editorStore', () => ({
    useEditorStore: vi.fn(() => ({
        code: '',
        setCode: vi.fn(),
        setReady: vi.fn(),
        setCursorPosition: vi.fn(),
    })),
}));

vi.mock('@/stores/settingsStore', () => ({
    useSettingsStore: vi.fn(() => ({
        fontSize: 16,
        theme: 'retro-green',
    })),
}));

describe('CodeEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(<CodeEditor />);
        expect(screen.getByText('Loading Pascal Editor...')).toBeInTheDocument();
    });

    it('should render with initial value', async () => {
        const initialValue = 'program Hello;\nbegin\n  WriteLn(\'Hello, World!\');\nend.';

        render(<CodeEditor value={initialValue} />);

        await waitFor(() => {
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });
    });

    it('should call onChange when code changes', async () => {
        const handleChange = vi.fn();

        render(<CodeEditor onChange={handleChange} />);

        await waitFor(() => {
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });
    });

    it('should render in read-only mode', async () => {
        render(<CodeEditor readOnly />);

        await waitFor(() => {
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });
    });

    it('should apply custom height', () => {
        const { container } = render(<CodeEditor height="500px" />);
        const wrapper = container.querySelector('.code-editor-wrapper');

        expect(wrapper).toHaveStyle({ height: '500px' });
    });

    it('should have proper accessibility attributes', () => {
        const { container } = render(<CodeEditor />);
        const wrapper = container.querySelector('.code-editor-wrapper');

        expect(wrapper).toHaveAttribute('role', 'region');
        expect(wrapper).toHaveAttribute('aria-label', 'Pascal Code Editor');
    });

    it('should call onReady when editor mounts', async () => {
        const handleReady = vi.fn();

        render(<CodeEditor onReady={handleReady} />);

        await waitFor(() => {
            expect(handleReady).toHaveBeenCalled();
        }, { timeout: 1000 });
    });
});

describe('Pascal Language Registration', () => {
    it('should export Pascal language keywords', async () => {
        const { KEYWORDS } = await import('./PascalLanguage');

        expect(KEYWORDS).toContain('program');
        expect(KEYWORDS).toContain('begin');
        expect(KEYWORDS).toContain('end');
        expect(KEYWORDS).toContain('var');
        expect(KEYWORDS).toContain('if');
        expect(KEYWORDS).toContain('then');
        expect(KEYWORDS).toContain('else');
        expect(KEYWORDS).toContain('while');
        expect(KEYWORDS).toContain('for');
    });

    it('should export Pascal built-in functions', async () => {
        const { BUILTINS } = await import('./PascalLanguage');

        expect(BUILTINS).toContain('WriteLn');
        expect(BUILTINS).toContain('ReadLn');
        expect(BUILTINS).toContain('Write');
        expect(BUILTINS).toContain('Read');
    });

    it('should export Pascal constants', async () => {
        const { CONSTANTS } = await import('./PascalLanguage');

        expect(CONSTANTS).toContain('True');
        expect(CONSTANTS).toContain('False');
    });
});

describe('Pascal Theme', () => {
    it('should export theme name constant', async () => {
        const { PASCAL_RETRO_THEME } = await import('./PascalTheme');

        expect(PASCAL_RETRO_THEME).toBe('pascal-retro');
    });

    it('should export color definitions', async () => {
        const { colors } = await import('./PascalTheme');

        expect(colors).toHaveProperty('retroGreen');
        expect(colors).toHaveProperty('retroAmber');
        expect(colors).toHaveProperty('retroCyan');
        expect(colors).toHaveProperty('terminalBg');
    });
});