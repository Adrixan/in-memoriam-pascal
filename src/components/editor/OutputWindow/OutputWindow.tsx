/**
 * OutputWindow Component
 * Terminal-style output display for Pascal interpreter results
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { OutputLine } from '@/types';

/**
 * Props for the OutputWindow component
 */
export interface OutputWindowProps {
    /** Array of output lines */
    output: OutputLine[];

    /** Error message if any */
    error?: string | null;

    /** Additional CSS class names */
    className?: string;

    /** Height of the output window */
    height?: string | number;

    /** Show timestamp for each line */
    showTimestamp?: boolean;

    /** Called when user clears output */
    onClear?: () => void;

    /** Whether the program is waiting for input */
    isWaitingForInput?: boolean;

    /** Called when user submits input */
    onInputSubmit?: (input: string) => void;
}

/**
 * OutputWindow Component
 *
 * A terminal-style output display with:
 * - Dark background with green/amber text
 * - Scrollable output area
 * - CRT-style aesthetics
 * - Accessibility support
 */
export function OutputWindow({
    output,
    error,
    className,
    height = '200px',
    showTimestamp = false,
    isWaitingForInput = false,
    onInputSubmit,
}: OutputWindowProps): ReactElement {
    const outputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState('');

    // Log output changes for debugging
    useEffect(() => {
        console.log('[OutputWindow] output changed, length:', output?.length);
    }, [output]);

    // Auto-scroll to bottom when new output arrives
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, error]);

    // Focus input when waiting for input
    useEffect(() => {
        if (isWaitingForInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isWaitingForInput]);

    /**
     * Handle input submission
     */
    const handleInputSubmit = (): void => {
        if (inputValue.trim() && onInputSubmit) {
            onInputSubmit(inputValue);
            setInputValue('');
        }
    };

    /**
     * Handle key press in input field
     */
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleInputSubmit();
        }
    };

    /**
     * Get color class based on output type
     */
    const getTypeColor = (type: OutputLine['type']): string => {
        switch (type) {
            case 'error':
                return 'text-red-500';
            case 'info':
                return 'text-[var(--retro-cyan)]';
            case 'output':
            default:
                return 'text-[var(--retro-green)]';
        }
    };

    /**
     * Format timestamp
     */
    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div
            className={`output-window ${className ?? ''}`}
            style={{ height }}
            role="region"
            aria-label="Program Output"
            aria-live="polite"
            aria-atomic="false"
        >
            {/* Terminal header */}
            <div
                className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] rounded-t"
                role="presentation"
            >
                {/* Terminal dots */}
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true" />
                    <span className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
                </div>
                {/* Title */}
                <span className="ml-2 text-sm text-[var(--color-text-muted)] font-mono">
                    Output
                </span>
            </div>

            {/* Output content */}
            <div
                ref={outputRef}
                className="output-content h-[calc(100%-40px)] overflow-auto p-3 bg-[var(--terminal-bg)] font-mono text-sm"
                role="log"
                aria-label="Output content"
                tabIndex={0}
            >
                {/* Empty state */}
                {output.length === 0 && !error && (
                    <div className="text-[var(--color-text-muted)] italic">
                        No output yet. Run your program to see results.
                    </div>
                )}

                {/* Output lines */}
                {output.map((line, index) => (
                    <div
                        key={`${line.timestamp}-${index}`}
                        className={`output-line ${getTypeColor(line.type)} whitespace-pre-wrap break-words`}
                        role="listitem"
                    >
                        {showTimestamp && (
                            <span className="text-[var(--color-text-muted)] mr-2 text-xs">
                                [{formatTime(line.timestamp)}]
                            </span>
                        )}
                        <span className="terminal-glow">{line.content}</span>
                    </div>
                ))}

                {/* Error display */}
                {error && (
                    <div
                        className="output-line text-red-500 mt-2 pt-2 border-t border-red-500/30"
                        role="alert"
                        aria-label="Error message"
                    >
                        <span className="font-bold">Error: </span>
                        <span className="terminal-glow">{error}</span>
                    </div>
                )}

                {/* Input field */}
                {isWaitingForInput && (
                    <form
                        className="flex items-center gap-2 mt-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleInputSubmit();
                        }}
                        role="form"
                        aria-label="Program input form"
                    >
                        <span className="text-[var(--retro-green)] animate-pulse" aria-hidden="true">&gt;</span>
                        <label htmlFor="program-input" className="sr-only">
                            Enter input for program
                        </label>
                        <input
                            id="program-input"
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="flex-1 bg-transparent border-b border-[var(--retro-green)]/50 outline-none text-[var(--retro-green)] font-mono text-sm placeholder:text-[var(--retro-green)]/30 focus:border-[var(--retro-green)] transition-colors"
                            placeholder="Type input and press Enter..."
                            aria-label="Program input"
                            autoFocus
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            className="px-2 py-1 text-xs bg-[var(--retro-green)] text-[var(--terminal-bg)] font-mono rounded hover:bg-[var(--retro-green)]/80 transition-colors"
                            aria-label="Submit input"
                        >
                            Send
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default OutputWindow;