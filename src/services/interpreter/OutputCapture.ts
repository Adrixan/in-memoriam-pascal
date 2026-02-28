/**
 * OutputCapture - Captures stdout/stderr from Pascal.js execution
 *
 * Pascal.js uses a global `print` function for output (WriteLn/Write).
 * This module provides a way to capture and manage that output.
 */

import type { OutputHandler } from './types';

/**
 * OutputCapture manages the capture of output from Pascal.js execution
 */
export class OutputCapture {
    private outputLines: string[] = [];
    private handlers: OutputHandler[] = [];
    private originalPrint: ((output: string) => void) | undefined;
    private originalModulePrint: ((output: string) => void) | undefined;
    private originalConsoleLog: ((...args: unknown[]) => void) | undefined;
    private isCapturing = false;

    /**
     * Start capturing output
     * Installs hooks into the global print function used by Pascal.js
     */
    startCapture(): void {
        if (this.isCapturing) {
            console.log('[OutputCapture] Already capturing, skipping startCapture');
            return;
        }

        this.outputLines = [];
        this.isCapturing = true;

        // Store and override both print function AND console.log
        if (typeof window !== 'undefined') {
            const win = window as unknown as Record<string, unknown>;

            // Also capture console.log output from Pascal.js
            // Pascal.js sometimes uses console.log directly
            this.originalConsoleLog = console.log.bind(console);
            const captureConsoleLog = (...args: unknown[]): void => {
                const output = args.map(arg => String(arg)).join(' ');
                // Directly add to array without any logging to avoid infinite recursion
                this.addOutput(output);
            };
            console.log = captureConsoleLog;

            // Check if the current print function is the browser's native print dialog
            // Native browser print has no custom properties and is a built-in function
            // We detect native by:
            // 1. Direct reference to window.print, OR
            // 2. The function's toString() includes '[native code]'
            const currentPrint = win['print'];
            const isNativePrint = currentPrint && (
                currentPrint === window.print ||
                (typeof currentPrint === 'function' && currentPrint.toString().includes('[native code]'))
            );

            // Only save non-native print functions (like our pascalPrint)
            // NEVER save the browser's native print dialog function
            if (currentPrint && !isNativePrint) {
                this.originalPrint = currentPrint as (output: string) => void;
                console.log('[OutputCapture] Saved custom print function:', typeof this.originalPrint);
            } else {
                // Clear any previously saved native print
                this.originalPrint = undefined;
                console.log('[OutputCapture] Not saving native browser print function');
            }

            // Create a custom print function that captures output
            const capturePrint = (output: string): void => {
                // Directly add to array without any logging to avoid infinite recursion
                this.addOutput(output);
            };

            // Make print available globally for Pascal.js
            win['print'] = capturePrint;
            console.log('[OutputCapture] Replaced window.print with capturePrint');

            // Also set up Module.print for LLVM.js
            if (!win['Module']) {
                win['Module'] = {};
            }
            (win['Module'] as Record<string, unknown>)['print'] = capturePrint;
        }
    }

    /**
     * Stop capturing output
     * Restores original print function
     */
    stopCapture(): void {
        if (!this.isCapturing) {
            console.log('[OutputCapture] Not capturing, skipping stopCapture');
            return;
        }

        console.log('[OutputCapture] Stopping capture');
        this.isCapturing = false;

        // Restore original console.log
        if (this.originalConsoleLog !== undefined) {
            console.log = this.originalConsoleLog;
            console.log('[OutputCapture] Restored console.log');
        }

        // Restore original print function
        if (typeof window !== 'undefined') {
            const win = window as unknown as Record<string, unknown>;

            // Restore the original print function ONLY if it was a custom function
            // NEVER restore the browser's native print dialog function
            if (this.originalPrint !== undefined) {
                console.log('[OutputCapture] Restoring custom print function');
                win['print'] = this.originalPrint;
            } else {
                // Set a no-op print function instead of restoring native print
                // This prevents the print dialog from opening
                console.log('[OutputCapture] Setting no-op print function to prevent print dialog');
                win['print'] = () => {
                    console.log('[OutputCapture] print called after capture stopped (no-op)');
                };
            }

            // Restore Module.print if we had one
            if (this.originalModulePrint !== undefined && win['Module']) {
                (win['Module'] as Record<string, unknown>)['print'] = this.originalModulePrint;
            }
        }
    }

    /**
     * Add an output handler
     * Handlers are called for each line of output
     */
    addHandler(handler: OutputHandler): void {
        this.handlers.push(handler);
    }

    /**
     * Remove an output handler
     */
    removeHandler(handler: OutputHandler): void {
        const index = this.handlers.indexOf(handler);
        if (index > -1) {
            this.handlers.splice(index, 1);
        }
    }

    /**
     * Get all captured output lines
     */
    getOutput(): string[] {
        return [...this.outputLines];
    }

    /**
     * Get output as a single string
     */
    getOutputString(): string {
        return this.outputLines.join('\n');
    }

    /**
     * Clear captured output
     */
    clear(): void {
        this.outputLines = [];
    }

    /**
     * Check if currently capturing
     */
    isActive(): boolean {
        return this.isCapturing;
    }

    /**
     * Add output line and notify handlers
     */
    private addOutput(output: string): void {
        this.outputLines.push(output);

        // Notify all handlers
        for (const handler of this.handlers) {
            try {
                handler(output);
            } catch (error) {
                console.error('Output handler error:', error);
            }
        }
    }
}

/**
 * Singleton instance for convenience
 */
let instance: OutputCapture | null = null;

/**
 * Get the singleton OutputCapture instance
 */
export function getOutputCapture(): OutputCapture {
    if (!instance) {
        instance = new OutputCapture();
    }
    return instance;
}

export default OutputCapture;
