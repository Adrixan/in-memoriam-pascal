/**
 * PascalInterpreter - Wrapper for Pascal.js compiler/interpreter
 *
 * Provides a clean API for compiling and executing Pascal code in the browser.
 * Uses the Pascal.js compiler pipeline:
 * 1. Parse Pascal source → AST
 * 2. AST → LLVM IR
 * 3. LLVM IR → JavaScript
 * 4. Execute JavaScript
 */

import { OutputCapture, getOutputCapture } from './OutputCapture';
import type {
    RunResult,
    InterpreterError,
    InterpreterConfig,
    CompilationResult,
    PascalParser,
    IRModule,
} from './types';

/**
 * Default interpreter configuration
 */
const DEFAULT_CONFIG: Required<InterpreterConfig> = {
    timeout: 10000, // 10 seconds
    maxOutputLines: 1000,
    debug: false,
};

/**
 * PascalInterpreter class
 * Manages the compilation and execution of Pascal code
 */
export class PascalInterpreter {
    private config: Required<InterpreterConfig>;
    private outputCapture: OutputCapture;
    private isLoaded = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Create a new PascalInterpreter instance
     */
    constructor(config: InterpreterConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.outputCapture = getOutputCapture();
    }

    /**
     * Check if the Pascal.js scripts are loaded
     */
    isReady(): boolean {
        return this.isLoaded;
    }

    /**
     * Load Pascal.js scripts
     * Must be called before running code
     */
    async load(): Promise<void> {
        if (this.isLoaded) {
            return;
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this.loadScripts();
        await this.loadPromise;
        this.isLoaded = true;
    }

    /**
     * Run Pascal code and return the result
     */
    async run(code: string): Promise<RunResult> {
        const startTime = performance.now();

        console.log('[PascalInterpreter] run() called with code length:', code?.length);
        console.log('[PascalInterpreter] code preview (first 100 chars):', code?.substring(0, 100));

        try {
            // Ensure scripts are loaded
            await this.load();

            // Start capturing output
            this.outputCapture.startCapture();
            this.outputCapture.clear();

            // Compile and execute
            const compilation = this.compile(code);

            if (!compilation.success) {
                return {
                    success: false,
                    output: [],
                    errors: compilation.errors,
                    exitCode: 1,
                    executionTime: performance.now() - startTime,
                };
            }

            // Execute the compiled JavaScript
            const executionErrors = await this.execute(compilation.jsCode ?? '');

            const endTime = performance.now();
            const output = this.outputCapture.getOutput();

            // Stop capturing
            this.outputCapture.stopCapture();

            if (executionErrors.length > 0) {
                return {
                    success: false,
                    output,
                    errors: executionErrors,
                    exitCode: 1,
                    executionTime: endTime - startTime,
                };
            }

            return {
                success: true,
                output,
                errors: [],
                exitCode: 0,
                executionTime: endTime - startTime,
            };
        } catch (error) {
            this.outputCapture.stopCapture();

            return {
                success: false,
                output: this.outputCapture.getOutput(),
                errors: [this.parseError(error)],
                exitCode: 1,
                executionTime: performance.now() - startTime,
            };
        }
    }

    /**
     * Compile Pascal code to JavaScript
     */
    compile(code: string): CompilationResult {
        try {
            // Step 1: Parse Pascal to AST
            const ast = this.parseCode(code);

            // Step 2: Convert AST to LLVM IR
            const ir = this.toIR(ast);

            // Step 3: Optimize IR (optional but recommended)
            const optimizedIR = this.optimizeIR(ir);

            // Step 4: Compile IR to JavaScript
            const jsCode = this.compileIR(optimizedIR);

            return {
                success: true,
                jsCode,
                errors: [],
                ast: this.config.debug ? ast : undefined,
            };
        } catch (error) {
            return {
                success: false,
                errors: [this.parseError(error)],
            };
        }
    }

    /**
     * Stop any running execution
     */
    stop(): void {
        this.outputCapture.stopCapture();
    }

    /**
     * Reset the interpreter state
     */
    reset(): void {
        this.outputCapture.clear();
        this.outputCapture.stopCapture();
    }

    /**
     * Load required Pascal.js scripts dynamically
     */
    private async loadScripts(): Promise<void> {
        // Scripts are served from /external/pascal.js/ (symlinked/submodule in project root)
        // The public/external/pascal.js/pascal-init.js provides browser-compatible globals
        // IMPORTANT: llvm-pre-init.js MUST be loaded before compiler.js to set up the
        // correct read()/load() functions for browser environment using Object.defineProperty
        // to prevent compiler.js from overwriting them.
        const scripts = [
            '/external/pascal.js/parse.js',
            '/external/pascal.js/ieee754.js',
            '/external/pascal.js/ir.js',
            '/external/pascal.js/llvm.js/llvm-as.js',
            '/external/pascal.js/llvm.js/llvm-dis.js',
            '/external/pascal.js/llvm-pre-init.js', // Pre-init for browser environment (MUST be before compiler.js)
            '/external/pascal.js/llvm.js/compiler.js',
            '/external/pascal.js/pascal-init.js', // Our init script to expose globals
        ];

        const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                // Check if script is already loaded
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                document.head.appendChild(script);
            });
        };

        // Load scripts sequentially (order matters for dependencies)
        for (const script of scripts) {
            try {
                await loadScript(script);
            } catch (error) {
                console.error(`[PascalInterpreter] Failed to load: ${script}`, error);
                throw error;
            }
        }

        // Wait for scripts to initialize by polling for globals
        // LLVM.js scripts are large (~12MB each) and take time to execute after download
        const maxWaitTime = 30000; // 30 seconds max
        const pollInterval = 100; // Check every 100ms
        const startTime = Date.now();

        const waitForGlobals = async (): Promise<void> => {
            return new Promise((resolve, reject) => {
                const check = (): void => {
                    if (typeof window === 'undefined') {
                        resolve();
                        return;
                    }

                    const win = window as unknown as Record<string, unknown>;
                    const elapsed = Date.now() - startTime;

                    // Check if all required globals are available
                    const parse = win['parse'];
                    const IR = win['IR'];
                    const llvmAs = win['llvmAs'];
                    const llvmDis = win['llvmDis'];
                    const compile = win['compile'];

                    const hasCore = typeof parse !== 'undefined' && typeof IR !== 'undefined';
                    const hasLLVM = typeof llvmAs !== 'undefined' && typeof llvmDis !== 'undefined' && typeof compile !== 'undefined';

                    if (hasCore && hasLLVM) {
                        console.log('[PascalInterpreter] All scripts loaded and initialized', {
                            parse: typeof parse,
                            IR: typeof IR,
                            llvmAs: typeof llvmAs,
                            llvmDis: typeof llvmDis,
                            compile: typeof compile,
                            elapsed: `${elapsed}ms`,
                        });
                        resolve();
                        return;
                    }

                    if (elapsed >= maxWaitTime) {
                        console.error('[PascalInterpreter] Timeout waiting for scripts', {
                            parse: typeof parse,
                            IR: typeof IR,
                            llvmAs: typeof llvmAs,
                            llvmDis: typeof llvmDis,
                            compile: typeof compile,
                            elapsed: `${elapsed}ms`,
                        });

                        // If core scripts are available but LLVM is not, we can still proceed
                        // with limited functionality
                        if (hasCore) {
                            console.warn('[PascalInterpreter] LLVM functions not available, some features may be limited');
                            resolve();
                            return;
                        }

                        reject(new Error('Timeout waiting for Pascal.js scripts to initialize'));
                        return;
                    }

                    // Poll again
                    setTimeout(check, pollInterval);
                };

                // Start checking after a short delay
                setTimeout(check, 100);
            });
        };

        await waitForGlobals();
    }

    /**
     * Parse Pascal code to AST
     */
    private parseCode(code: string): unknown {
        console.log('[PascalInterpreter] parseCode called with code length:', code?.length);
        console.log('[PascalInterpreter] parseCode code preview (first 100 chars):', code?.substring(0, 100));

        if (typeof window === 'undefined') {
            throw new Error('Parser not available outside browser environment');
        }

        const win = window as unknown as Record<string, unknown>;
        const parse = win['parse'] as PascalParser | undefined;

        if (!parse) {
            console.error('[PascalInterpreter] Parser not found on window.parse');
            console.log('[PascalInterpreter] Available globals:', Object.keys(win).filter(k => k.includes('parse') || k.includes('Parser')));
            throw new Error('Parser not loaded. Call load() first.');
        }

        console.log('[PascalInterpreter] parse object type:', typeof parse);
        console.log('[PascalInterpreter] parse.Parser type:', typeof parse?.Parser);

        const parser = new parse.Parser();
        console.log('[PascalInterpreter] parser created, type:', typeof parser);
        console.log('[PascalInterpreter] parser.parse type:', typeof parser?.parse);

        try {
            const result = parser.parse(code);
            console.log('[PascalInterpreter] parseCode successful, result type:', typeof result);
            console.log('[PascalInterpreter] result is object:', result !== null && typeof result === 'object');
            if (result && typeof result === 'object') {
                console.log('[PascalInterpreter] result has node property:', 'node' in result);
                console.log('[PascalInterpreter] result.node value:', (result as Record<string, unknown>)['node']);
            } else if (typeof result === 'string') {
                console.error('[PascalInterpreter] WARNING: parse returned a string instead of AST!');
                console.error('[PascalInterpreter] string result (first 200 chars):', result.substring(0, 200));
            }
            return result;
        } catch (error) {
            console.error('[PascalInterpreter] parseCode error:', error);
            throw error;
        }
    }

    /**
     * Convert AST to LLVM IR
     * 
     * Note: The IR constructor accepts AST as parameter. The exported toIR function
     * (which may not be available in browser) creates: new IR(ast).toIR()
     * But we can also use the instance method toIR(ast) directly.
     */
    private toIR(ast: unknown): string {
        // Validate AST input
        if (ast === null || ast === undefined) {
            throw new Error('AST is null or undefined - parser may have failed');
        }

        if (typeof ast === 'string') {
            console.error('[PascalInterpreter] AST is a string, not an object!');
            console.error('[PascalInterpreter] String content (first 200 chars):', ast.substring(0, 200));
            throw new Error('Parser returned a string instead of AST object. This may indicate a script loading issue.');
        }

        if (typeof ast !== 'object') {
            console.error('[PascalInterpreter] AST is not an object, type:', typeof ast);
            throw new Error(`Parser returned unexpected type: ${typeof ast}`);
        }

        const astObj = ast as Record<string, unknown>;
        if (!('node' in astObj)) {
            console.error('[PascalInterpreter] AST object does not have node property');
            console.error('[PascalInterpreter] AST keys:', Object.keys(astObj));
            throw new Error('Parser returned invalid AST object - missing node property');
        }

        console.log('[PascalInterpreter] toIR received valid AST with node:', astObj['node']);

        if (typeof window === 'undefined') {
            throw new Error('IR module not available outside browser environment');
        }

        const win = window as unknown as Record<string, unknown>;

        // First try to use the standalone toIR export if available (from CommonJS)
        const toIRExport = win['toIR'] as ((ast: unknown) => string) | undefined;
        if (toIRExport) {
            console.log('[PascalInterpreter] Using exported toIR function');
            try {
                return toIRExport(ast);
            } catch (e) {
                console.error('[PascalInterpreter] toIR export failed:', e);
                // Fall through to try other methods
            }
        }

        // Use IR constructor with AST passed to it (like the exported toIR does)
        // IR can be called with AST as first argument: new IR(ast)
        const IRAny = win['IR'] as unknown;
        if (typeof IRAny === 'function') {
            console.log('[PascalInterpreter] Creating IR instance with AST in constructor');
            try {
                // Call IR constructor with AST - this is what the exported toIR does
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const irInstance = new (IRAny as any)(ast);
                // Call toIR() without arguments - it uses the AST from constructor
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const irResult = (irInstance as any).toIR();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (irInstance as any).normalizeIR(irResult);
            } catch (e) {
                console.error('[PascalInterpreter] IR with AST constructor failed:', e);
                throw e;
            }
        }

        // Fallback: Use IR constructor without AST, pass to toIR method
        const IRConstructor = win['IR'] as (new () => IRModule) | undefined;
        if (!IRConstructor) {
            throw new Error('IR module not loaded. Call load() first.');
        }

        console.log('[PascalInterpreter] Using fallback: IR constructor without AST');
        const irInstance: IRModule = new IRConstructor();
        return irInstance.normalizeIR(irInstance.toIR(ast));
    }

    /**
     * Optimize LLVM IR
     */
    private optimizeIR(ir: string): string {
        if (typeof window === 'undefined') {
            throw new Error('LLVM not available outside browser environment');
        }

        const win = window as unknown as Record<string, unknown>;
        const llvmAs = win['llvmAs'] as ((ir: string) => number) | undefined;
        const llvmDis = win['llvmDis'] as ((module: number) => string) | undefined;

        if (!llvmAs || !llvmDis) {
            throw new Error('LLVM modules not loaded. Call load() first.');
        }

        const module = llvmAs(ir);
        return llvmDis(module);
    }

    /**
     * Compile LLVM IR to JavaScript
     */
    private compileIR(ir: string): string {
        if (typeof window === 'undefined') {
            throw new Error('Compiler not available outside browser environment');
        }

        const win = window as unknown as Record<string, unknown>;
        const compile = win['compile'] as ((ir: string) => void) | undefined;

        if (!compile) {
            throw new Error('Compiler not loaded. Call load() first.');
        }

        let jsCode = '';
        const winRecord = win as Record<string, unknown>;
        const originalPrint = winRecord['print'] as ((output: string) => void) | undefined;

        // Capture compiled JS output
        winRecord['print'] = (output: string) => {
            jsCode += output;
        };

        try {
            compile(ir);
        } finally {
            // Restore original print
            if (originalPrint) {
                winRecord['print'] = originalPrint;
            }
        }

        return jsCode;
    }

    /**
     * Execute compiled JavaScript code
     */
    private async execute(jsCode: string): Promise<InterpreterError[]> {
        const errors: InterpreterError[] = [];

        if (!jsCode) {
            return errors;
        }

        try {
            // Create a function from the compiled code and execute it
            // Using Function constructor to avoid direct eval
            const executeFunc = new Function(jsCode) as () => void;

            // Execute with timeout protection
            await this.executeWithTimeout(executeFunc);
        } catch (error) {
            errors.push(this.parseError(error, 'runtime'));
        }

        return errors;
    }

    /**
     * Execute a function with timeout protection
     */
    private executeWithTimeout(fn: () => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Execution timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);

            try {
                fn();
                clearTimeout(timeoutId);
                resolve();
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Parse an error into an InterpreterError
     */
    private parseError(error: unknown, type: InterpreterError['type'] = 'compilation'): InterpreterError {
        if (error instanceof Error) {
            // Try to extract line number from error message
            const lineMatch = error.message.match(/line (\d+)/i);
            const columnMatch = error.message.match(/column (\d+)/i);

            const result: InterpreterError = {
                message: error.message,
                type,
                originalError: error,
            };

            if (lineMatch && lineMatch[1]) {
                result.line = parseInt(lineMatch[1], 10);
            }

            if (columnMatch && columnMatch[1]) {
                result.column = parseInt(columnMatch[1], 10);
            }

            return result;
        }

        return {
            message: String(error),
            type,
        };
    }
}

/**
 * Singleton instance for convenience
 */
let instance: PascalInterpreter | null = null;

/**
 * Get the singleton PascalInterpreter instance
 */
export function getPascalInterpreter(config?: InterpreterConfig): PascalInterpreter {
    if (!instance) {
        instance = new PascalInterpreter(config);
    }
    return instance;
}

export default PascalInterpreter;
