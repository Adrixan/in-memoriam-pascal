/**
 * Types for the Pascal Interpreter Service
 */

/**
 * Result of running Pascal code
 */
export interface RunResult {
    /** Whether execution was successful */
    success: boolean;

    /** Captured output lines */
    output: string[];

    /** Errors encountered during execution */
    errors: InterpreterError[];

    /** Exit code (0 for success, non-zero for errors) */
    exitCode: number;

    /** Execution time in milliseconds */
    executionTime?: number;
}

/**
 * Interpreter error details
 */
export interface InterpreterError {
    /** Error message */
    message: string;

    /** Line number (1-based) */
    line?: number;

    /** Column number (1-based) */
    column?: number;

    /** Error type */
    type: 'syntax' | 'runtime' | 'compilation';

    /** Original error if available */
    originalError?: unknown;
}

/**
 * Output capture handler
 */
export type OutputHandler = (output: string) => void;

/**
 * Interpreter configuration
 */
export interface InterpreterConfig {
    /** Maximum execution time in milliseconds */
    timeout?: number;

    /** Maximum output lines to capture */
    maxOutputLines?: number;

    /** Whether to include debug information */
    debug?: boolean;
}

/**
 * Compilation phase result
 */
export interface CompilationResult {
    /** Whether compilation was successful */
    success: boolean;

    /** Generated JavaScript code (if successful) */
    jsCode?: string;

    /** Compilation errors */
    errors: InterpreterError[];

    /** Abstract Syntax Tree (for debugging) */
    ast?: unknown;
}

/**
 * Parser module interface
 */
export interface PascalParser {
    Parser: new () => {
        parse: (source: string) => unknown;
    };
}

/**
 * IR module interface
 * 
 * Note: IR is a constructor function in pascal.js. Usage:
 *   const irInstance = new IR();  // Create instance without AST
 *   const ir = irInstance.toIR(ast);  // Pass AST to toIR
 *   const normalized = irInstance.normalizeIR(ir);
 */
export interface IRModule {
    toIR: (ast: unknown) => string;
    normalizeIR: (ir: string) => string;
}

/**
 * LLVM module interface (from llvm.js)
 */
export interface LLVMModule {
    llvmAs: (ir: string) => number;
    llvmDis: (module: number) => string;
    compile: (ir: string) => void;
}

/**
 * Pascal.js global functions (loaded via scripts)
 */
export interface PascalJsGlobals {
    parse: PascalParser;
    IR: IRModule;
    llvmAs: (ir: string) => number;
    llvmDis: (module: number) => string;
    compile: (ir: string) => void;
}

/**
 * Module object used by LLVM.js
 */
export interface LLVMModule {
    print: (output: string) => void;
}
