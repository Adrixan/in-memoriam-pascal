/**
 * Tests for PascalInterpreter Service
 *
 * Note: These tests require a browser environment to load Pascal.js scripts.
 * In Node.js environment, they will test the service structure but not actual execution.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PascalInterpreter } from './PascalInterpreter';
import { OutputCapture, getOutputCapture } from './OutputCapture';

// Mock the browser environment
const mockWindow = {
    parse: {
        Parser: class Parser {
            parse(source: string): unknown {
                // Simple mock parser that returns a basic AST
                if (source.includes('Hello')) {
                    return { type: 'Program', name: 'HelloWorld' };
                }
                throw new Error('Parse error');
            }
        },
    },
    IR: {
        toIR: (ast: unknown): string => `; Mock IR for ${JSON.stringify(ast)}`,
        normalizeIR: (ir: string): string => ir,
    },
    llvmAs: (_ir: string): number => {
        // Mock LLVM assembly - return a module handle
        return 1;
    },
    llvmDis: (module: number): string => {
        // Mock LLVM disassembly - return optimized IR
        return `; Optimized IR (module ${module})`;
    },
    compile: (_ir: string): void => {
        // Mock compile - outputs JS via print
        if (typeof window !== 'undefined') {
            const win = window as unknown as Record<string, unknown>;
            if (typeof win['print'] === 'function') {
                (win['print'] as (output: string) => void)('console.log("Hello World!");');
            }
        }
    },
};

describe('OutputCapture', () => {
    let outputCapture: OutputCapture;

    beforeEach(() => {
        outputCapture = new OutputCapture();
    });

    afterEach(() => {
        outputCapture.stopCapture();
    });

    describe('startCapture', () => {
        it('should start capturing output', () => {
            outputCapture.startCapture();
            expect(outputCapture.isActive()).toBe(true);
        });

        it('should not start twice', () => {
            outputCapture.startCapture();
            outputCapture.startCapture();
            expect(outputCapture.isActive()).toBe(true);
        });
    });

    describe('stopCapture', () => {
        it('should stop capturing output', () => {
            outputCapture.startCapture();
            outputCapture.stopCapture();
            expect(outputCapture.isActive()).toBe(false);
        });

        it('should handle stop without start', () => {
            outputCapture.stopCapture();
            expect(outputCapture.isActive()).toBe(false);
        });
    });

    describe('getOutput', () => {
        it('should return empty array initially', () => {
            expect(outputCapture.getOutput()).toEqual([]);
        });

        it('should return captured output', () => {
            outputCapture.startCapture();
            // Simulate output being added
            const win = window as unknown as Record<string, unknown>;
            const print = win['print'] as ((output: string) => void) | undefined;
            if (print) {
                print('Hello World!');
            }
            expect(outputCapture.getOutput()).toContain('Hello World!');
        });
    });

    describe('clear', () => {
        it('should clear captured output', () => {
            outputCapture.startCapture();
            outputCapture.clear();
            expect(outputCapture.getOutput()).toEqual([]);
        });
    });

    describe('handlers', () => {
        it('should call output handlers', () => {
            const handler = vi.fn();
            outputCapture.addHandler(handler);
            outputCapture.startCapture();

            // Simulate output
            const win = window as unknown as Record<string, unknown>;
            const print = win['print'] as ((output: string) => void) | undefined;
            if (print) {
                print('Test output');
            }

            expect(handler).toHaveBeenCalledWith('Test output');
        });

        it('should remove handlers', () => {
            const handler = vi.fn();
            outputCapture.addHandler(handler);
            outputCapture.removeHandler(handler);
            outputCapture.startCapture();

            const win = window as unknown as Record<string, unknown>;
            const print = win['print'] as ((output: string) => void) | undefined;
            if (print) {
                print('Test output');
            }

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('singleton', () => {
        it('should return the same instance', () => {
            const instance1 = getOutputCapture();
            const instance2 = getOutputCapture();
            expect(instance1).toBe(instance2);
        });
    });
});

describe('PascalInterpreter', () => {
    let interpreter: PascalInterpreter;

    beforeEach(() => {
        interpreter = new PascalInterpreter({
            timeout: 5000,
            maxOutputLines: 100,
            debug: false,
        });

        // Mock window globals
        if (typeof window !== 'undefined') {
            const win = window as unknown as Record<string, unknown>;
            win['parse'] = mockWindow.parse;
            win['IR'] = mockWindow.IR;
            win['llvmAs'] = mockWindow.llvmAs;
            win['llvmDis'] = mockWindow.llvmDis;
            win['compile'] = mockWindow.compile;
        }
    });

    afterEach(() => {
        interpreter.reset();
    });

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const defaultInterpreter = new PascalInterpreter();
            expect(defaultInterpreter.isReady()).toBe(false);
        });

        it('should create instance with custom config', () => {
            const customInterpreter = new PascalInterpreter({
                timeout: 10000,
                debug: true,
            });
            expect(customInterpreter.isReady()).toBe(false);
        });
    });

    describe('isReady', () => {
        it('should return false before loading', () => {
            expect(interpreter.isReady()).toBe(false);
        });
    });

    describe('compile', () => {
        it('should fail when scripts not loaded', () => {
            // In Node.js environment, this will fail
            const result = interpreter.compile('program Test; begin end.');
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('run', () => {
        // Skip tests that require script loading in jsdom environment
        it.skip('should return error result when scripts not loaded', async () => {
            // The run method tries to load scripts which will fail in jsdom
            // We test that it handles this gracefully
            const result = await interpreter.run('program Test; begin end.');
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it.skip('should handle empty code', async () => {
            const result = await interpreter.run('');
            expect(result.success).toBe(false);
        });
    });

    describe('reset', () => {
        it('should reset interpreter state', () => {
            interpreter.reset();
            expect(interpreter.isReady()).toBe(false);
        });
    });

    describe('stop', () => {
        it('should stop execution without error', () => {
            expect(() => interpreter.stop()).not.toThrow();
        });
    });
});

describe('PascalInterpreter Error Handling', () => {
    let interpreter: PascalInterpreter;

    beforeEach(() => {
        interpreter = new PascalInterpreter();
    });

    describe('parseError', () => {
        // Skip tests that require script loading in jsdom environment
        it.skip('should parse Error objects', async () => {
            const result = await interpreter.run('invalid pascal code');
            expect(result.success).toBe(false);
            expect(result.errors[0]?.type).toBeDefined();
        });

        it.skip('should handle non-Error errors', async () => {
            const result = await interpreter.run('');
            expect(result.success).toBe(false);
        });
    });
});

describe('Integration Tests (Browser Environment)', () => {
    // These tests will only work in a browser environment
    // They are skipped in Node.js

    it.skip('should execute Hello World program', async () => {
        const interpreter = new PascalInterpreter();
        await interpreter.load();

        const code = `
program HelloWorld;
begin
  WriteLn('Hello World!');
end.
`;

        const result = await interpreter.run(code);

        // This will only pass in browser environment
        expect(result.success).toBe(true);
        expect(result.output).toContain('Hello World!');
        expect(result.exitCode).toBe(0);
    });

    it.skip('should capture multiple WriteLn outputs', async () => {
        const interpreter = new PascalInterpreter();
        await interpreter.load();

        const code = `
program MultiOutput;
begin
  WriteLn('Line 1');
  WriteLn('Line 2');
  WriteLn('Line 3');
end.
`;

        const result = await interpreter.run(code);

        expect(result.success).toBe(true);
        expect(result.output).toHaveLength(3);
        expect(result.output[0]).toBe('Line 1');
        expect(result.output[1]).toBe('Line 2');
        expect(result.output[2]).toBe('Line 3');
    });

    it.skip('should handle syntax errors', async () => {
        const interpreter = new PascalInterpreter();
        await interpreter.load();

        const code = `
program SyntaxError;
begin
  WriteLn('Missing semicolon'
end.
`;

        const result = await interpreter.run(code);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]?.type).toBe('syntax');
    });

    it.skip('should handle runtime errors', async () => {
        const interpreter = new PascalInterpreter();
        await interpreter.load();

        const code = `
program RuntimeError;
var
  x: Integer;
begin
  x := 10 div 0;  { Division by zero }
end.
`;

        const result = await interpreter.run(code);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it.skip('should timeout on infinite loops', async () => {
        const interpreter = new PascalInterpreter({ timeout: 1000 });
        await interpreter.load();

        const code = `
program InfiniteLoop;
begin
  while true do
    ;  { Infinite loop }
end.
`;

        const result = await interpreter.run(code);

        expect(result.success).toBe(false);
        expect(result.errors[0]?.message).toContain('timeout');
    }, 10000);
});
