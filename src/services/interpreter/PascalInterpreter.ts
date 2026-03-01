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
 * Callback type for when interpreter needs user input
 */
export type InputNeededCallback = () => void;

/**
 * Default interpreter configuration
 */
const DEFAULT_CONFIG: InterpreterConfig = {
    timeout: 10000, // 10 seconds
    maxOutputLines: 1000,
    debug: false,
    inputQueue: [],
};

/**
 * PascalInterpreter class
 * Manages the compilation and execution of Pascal code
 */

/**
 * Error message catalog with suggestions for common Pascal errors
 */
const ERROR_CATALOG: Record<string, { message: string; suggestion: string; code: string }> = {
    // Syntax errors
    'SYNTAX_UNEXPECTED_TOKEN': {
        message: 'Unexpected token found',
        suggestion: 'Check for typos, missing semicolons, or incorrect punctuation',
        code: 'syntax.unexpectedToken',
    },
    'SYNTAX_MISSING_SEMICOLON': {
        message: 'Semicolon expected',
        suggestion: 'Most statements in Pascal end with a semicolon (;)',
        code: 'syntax.missingSemicolon',
    },
    'SYNTAX_MISSING_END': {
        message: 'Missing END keyword',
        suggestion: 'Every BEGIN must have a matching END',
        code: 'syntax.missingEnd',
    },
    'SYNTAX_INVALID_IDENTIFIER': {
        message: 'Invalid identifier',
        suggestion: 'Variable names must start with a letter and contain only letters, numbers, and underscores',
        code: 'syntax.invalidIdentifier',
    },
    'SYNTAX_MISSING_THEN': {
        message: 'THEN keyword expected',
        suggestion: 'IF statements require THEN after the condition',
        code: 'syntax.missingThen',
    },
    'SYNTAX_MISSING_DO': {
        message: 'DO keyword expected',
        suggestion: 'Loops (FOR, WHILE) require DO after the condition',
        code: 'syntax.missingDo',
    },
    'SYNTAX_UNEXPECTED_END': {
        message: 'Unexpected END',
        suggestion: 'Check if there is a matching BEGIN or DO before this END',
        code: 'syntax.unexpectedEnd',
    },
    // Runtime errors
    'RUNTIME_DIVISION_ZERO': {
        message: 'Division by zero',
        suggestion: 'Check your divisor - it cannot be zero',
        code: 'runtime.divisionByZero',
    },
    'RUNTIME_ARRAY_BOUNDS': {
        message: 'Array index out of bounds',
        suggestion: 'Array indices must be within the declared range',
        code: 'runtime.arrayOutOfBounds',
    },
    'RUNTIME_TYPE_MISMATCH': {
        message: 'Type mismatch',
        suggestion: 'Make sure the data types are compatible',
        code: 'runtime.typeMismatch',
    },
    'RUNTIME_UNDEFINED_VARIABLE': {
        message: 'Undefined variable',
        suggestion: 'Declare the variable in the VAR section before using it',
        code: 'runtime.undefinedVariable',
    },
    'RUNTIME_STACK_OVERFLOW': {
        message: 'Stack overflow',
        suggestion: 'Your program may have too deep recursion or infinite loop',
        code: 'runtime.stackOverflow',
    },
    // Compilation errors
    'COMP_UNKNOWN_TYPE': {
        message: 'Unknown type',
        suggestion: 'Check the type name - common types are: Integer, Real, String, Boolean, Char',
        code: 'compilation.unknownType',
    },
    'COMP_DUPLICATE_IDENTIFIER': {
        message: 'Identifier already defined',
        suggestion: 'You cannot declare the same variable twice',
        code: 'compilation.duplicateIdentifier',
    },
    'COMP_MISSING_PROGRAM': {
        message: 'Program header missing',
        suggestion: 'Pascal programs should start with: program Name;',
        code: 'compilation.missingProgram',
    },
    // Generic errors
    'GENERIC_SYNTAX': {
        message: 'Syntax error',
        suggestion: 'Review your code for typos, missing punctuation, or incorrect structure',
        code: 'syntax.generic',
    },
    'GENERIC_RUNTIME': {
        message: 'Runtime error',
        suggestion: 'An error occurred while your program was running',
        code: 'runtime.generic',
    },
    'GENERIC_COMPILATION': {
        message: 'Compilation error',
        suggestion: 'Your code could not be compiled. Check for typos and syntax issues',
        code: 'compilation.generic',
    },
};

export class PascalInterpreter {
    private config: InterpreterConfig;
    private outputCapture: OutputCapture;
    private isLoaded = false;
    private loadPromise: Promise<void> | null = null;

    // Input handling
    private currentInputIndex = 0;
    private inputQueueData: string[] = [];
    private fsInitialized = false;
    private _isWaitingForInput = false;
    private onInputNeeded: InputNeededCallback | null = null;
    private resolveInputPromise: ((value: string) => void) | null = null;
    private scanfOverrideInstalled = false;

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
     * Initialize the filesystem with stdin/stdout handlers
     */
    private initFS(): void {
        if (this.fsInitialized) {
            return;
        }

        // Access FS from the global scope (exposed by Pascal.js)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FS = (window as any).FS;

        if (typeof FS !== 'undefined') {
            // Set up input callback - returns next character from input queue
            const inputCallback = (): number => {
                // Check if we have input available
                if (this.currentInputIndex >= this.inputQueueData.length) {
                    // No more input available - signal that we need input
                    this._isWaitingForInput = true;

                    // Trigger the callback if set
                    if (this.onInputNeeded) {
                        this.onInputNeeded();
                    }

                    // Return EOF to stop reading (program will handle this)
                    return -1;
                }

                const currentInput = this.inputQueueData[this.currentInputIndex];

                // If current input is exhausted, move to next
                if (!currentInput || currentInput.length === 0) {
                    this.currentInputIndex++;
                    return 10; // newline character
                }

                // Return first character and remove it from string
                const charCode = currentInput.charCodeAt(0);
                this.inputQueueData[this.currentInputIndex] = currentInput.slice(1);

                // If input is exhausted after this character, move to next
                if (this.inputQueueData[this.currentInputIndex]?.length === 0) {
                    this.currentInputIndex++;
                }

                return charCode;
            };

            try {
                // Initialize FS with input callback only
                // Output is already captured by OutputCapture through window.print
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (FS as any).init(inputCallback, undefined, undefined);
                this.fsInitialized = true;
                console.log('[PascalInterpreter] FS initialized with input support');
            } catch (error) {
                console.warn('[PascalInterpreter] Failed to initialize FS:', error);
            }
        }
    }

    /**
     * Provide input to the interpreter (for interactive mode)
     */
    provideInput(input: string): void {
        // Add input to the queue
        this.inputQueueData.push(input + '\n');

        // If we were waiting for input, clear the flag
        if (this._isWaitingForInput) {
            this._isWaitingForInput = false;
        }

        // If there's a pending promise, resolve it
        if (this.resolveInputPromise) {
            this.resolveInputPromise(input);
            this.resolveInputPromise = null;
        }
    }

    /**
     * Set callback for when input is needed
     */
    setOnInputNeeded(callback: InputNeededCallback): void {
        this.onInputNeeded = callback;
    }

    /**
     * Check if the interpreter is waiting for input
     */
    isWaitingForInput(): boolean {
        return this._isWaitingForInput || this.currentInputIndex >= this.inputQueueData.length;
    }

    /**
     * Reset input state
     */
    resetInput(): void {
        this.currentInputIndex = 0;
        this.inputQueueData = [];
        this._isWaitingForInput = false;
        this.resolveInputPromise = null;
    }

    /**
     * Run Pascal code and return the result
     */
    async run(code: string, inputQueue?: string[]): Promise<RunResult> {
        const startTime = performance.now();

        // Use provided input queue or fall back to config
        const inputs = inputQueue ?? this.config.inputQueue ?? [];
        // Reset input queue for this run
        this.currentInputIndex = 0;
        this.inputQueueData = [...inputs];

        try {
            // Ensure scripts are loaded
            await this.load();

            // Initialize FS with input callback
            this.initFS();

            // Start capturing output
            this.outputCapture.startCapture();
            this.outputCapture.clear();

            // Compile the Pascal code first (this creates the scanf function)
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

            // CRITICAL: Install scanf override AFTER compilation but BEFORE execution
            // The scanf function is only created when LLVM IR is compiled,
            // so we must install the override after compile() completes
            if (!this.scanfOverrideInstalled) {
                const maxRetries = 10;
                const retryDelay = 100;
                for (let i = 0; i < maxRetries && !this.scanfOverrideInstalled; i++) {
                    this.setupScanfOverride();
                    if (!this.scanfOverrideInstalled) {
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    }
                }
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
        //
        // CRITICAL: We must load system.js unit BEFORE IR is used, because IR tries to
        // load the SYSTEM unit from ./units/system.js path which doesn't exist.
        // By preloading it into window.SYSTEM, IR will use the preloaded version.
        const scripts = [
            '/external/pascal.js/parse.js',
            '/external/pascal.js/ieee754.js',
            '/external/pascal.js/ir.js',
            '/external/pascal.js/units/system.js', // Preload SYSTEM unit BEFORE IR is used
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
     * Override scanf to use prompt() for STRING input in browser environment.
     * This fixes the freeze that occurs when scanf tries to read from stdin
     * which blocks waiting for input that never comes.
     * 
     * NEW APPROACH: Instead of trying to override scanf, we inject a custom
     * __pascal_read_string function that the compiled code calls for STRING READ.
     * This function reads from our input queue instead of blocking on stdin.
     */
    private setupScanfOverride(): void {
        if (typeof window === 'undefined') return;

        const win = window as unknown as Record<string, unknown>;

        // Get Module - the compiled code runs inside Module
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = win['Module'] as Record<string, any> | undefined;

        if (!mod) {
            console.log('[PascalInterpreter] Module not found yet, will retry');
            return;
        }

        // Check if __pascal_read_string is already registered
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (mod['__pascal_read_string']) {
            console.log('[PascalInterpreter] __pascal_read_string already registered');
            this.scanfOverrideInstalled = true;
            return;
        }

        console.log('[PascalInterpreter] Installing __pascal_read_string custom function for STRING READ');

        // Create the custom string read function that reads from our input queue
        // This function has signature: int (i8* buffer, i32 maxLen)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pascalReadString = (bufferPtr: number, maxLen: number): number => {
            try {
                // Get required functions from Module
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const heapU8 = win['HEAPU8'] as Uint8Array | undefined;

                if (!heapU8) {
                    console.error('[PascalInterpreter] HEAPU8 not available');
                    return 0;
                }

                let input = '';

                // Check if we have queued input
                if (this.inputQueueData.length > 0 && this.currentInputIndex < this.inputQueueData.length) {
                    const queuedInput = this.inputQueueData[this.currentInputIndex];
                    if (queuedInput) {
                        // Remove the newline and get just the string
                        input = queuedInput.replace(/\n$/, '');
                        this.currentInputIndex++;
                        console.log('[PascalInterpreter] READ string from queue:', input);
                    }
                } else if (typeof window !== 'undefined' && window.prompt) {
                    // Fall back to prompt if no queued input
                    input = window.prompt('Enter a string:') ?? '';
                    console.log('[PascalInterpreter] READ string from prompt:', input);
                }

                // Truncate if necessary
                if (input.length >= maxLen) {
                    input = input.substring(0, maxLen - 1);
                }

                // Write the input to the buffer
                for (let i = 0; i < input.length; i++) {
                    heapU8[bufferPtr + i] = input.charCodeAt(i);
                }
                // Null terminate the string
                heapU8[bufferPtr + input.length] = 0;

                return input.length > 0 ? 1 : 0;
            } catch (error) {
                console.error('[PascalInterpreter] __pascal_read_string error:', error);
                return 0;
            }
        };

        // Add the function directly to Module - the compiled code will look for it there
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mod['__pascal_read_string'] = pascalReadString;

        this.scanfOverrideInstalled = true;
        console.log('[PascalInterpreter] __pascal_read_string function injected successfully');
    }

    /**
     * Parse Pascal code to AST
     */
    private parseCode(code: string): unknown {
        if (typeof window === 'undefined') {
            throw new Error('Parser not available outside browser environment');
        }

        const win = window as unknown as Record<string, unknown>;
        const parse = win['parse'] as PascalParser | undefined;

        if (!parse) {
            throw new Error('Parser not loaded. Call load() first.');
        }

        const parser = new parse.Parser();

        try {
            return parser.parse(code);
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
            throw new Error('Parser returned invalid AST object - missing node property');
        }

        if (typeof window === 'undefined') {
            throw new Error('IR module not available outside browser environment');
        }

        const win = window as unknown as Record<string, unknown>;

        // First try to use the standalone toIR export if available (from CommonJS)
        const toIRExport = win['toIR'] as ((ast: unknown) => string) | undefined;
        if (toIRExport) {
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
            // Inject the __pascal_read_string function into the compiled code
            // This function will be called by the compiled Pascal code for STRING READ operations
            const pascalReadStringImpl = `
                // Custom string READ function for Pascal STRING type
                // This bypasses scanf which blocks in the browser
                function __pascal_read_string(bufferPtr, maxLen) {
                    try {
                        var heapU8 = HEAPU8;
                        if (!heapU8) {
                            return 0;
                        }

                        var input = '';

                        // Access the input queue from closure
                        // The inputQueueData and currentInputIndex are available in the closure
                        if (typeof window !== 'undefined' && window.pascalInputQueue && window.pascalInputQueue.length > 0) {
                            var queuedInput = window.pascalInputQueue.shift();
                            if (queuedInput) {
                                input = queuedInput.toString().replace(/\\n$/, '');
                            }
                        } else if (typeof prompt !== 'undefined') {
                            // Fall back to prompt if no queued input
                            input = prompt('Enter a string:') || '';
                        }

                        // Truncate if necessary
                        if (input.length >= maxLen) {
                            input = input.substring(0, maxLen - 1);
                        }

                        // Write the input to the buffer
                        for (var i = 0; i < input.length; i++) {
                            heapU8[bufferPtr + i] = input.charCodeAt(i);
                        }
                        // Null terminate the string
                        heapU8[bufferPtr + input.length] = 0;

                        return input.length > 0 ? 1 : 0;
                    } catch (e) {
                        return 0;
                    }
                }
            `;

            // Inject the input queue into window for the custom function to access
            if (typeof window !== 'undefined') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).pascalInputQueue = [...this.inputQueueData];
                // Reset currentInputIndex since we're passing the queue to the function
                this.currentInputIndex = 0;
            }

            // Prepend our custom function to the compiled code
            const modifiedJsCode = pascalReadStringImpl + '\n' + jsCode;

            // Create a function from the compiled code and execute it
            // Using Function constructor to avoid direct eval
            const executeFunc = new Function(modifiedJsCode) as () => void;

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
        let errorMessage = '';
        let errorCode = 'GENERIC_SYNTAX';
        let suggestion = '';

        if (error instanceof Error) {
            errorMessage = error.message;

            // Match error message against known patterns
            const msgLower = errorMessage.toLowerCase();

            // Check for specific error patterns
            if (msgLower.includes('semicolon') || msgLower.includes(';')) {
                errorCode = 'SYNTAX_MISSING_SEMICOLON';
            } else if (msgLower.includes('end') && (msgLower.includes('expect') || msgLower.includes('missing'))) {
                errorCode = 'SYNTAX_MISSING_END';
            } else if (msgLower.includes('unexpected token') || msgLower.includes('unexpected')) {
                errorCode = 'SYNTAX_UNEXPECTED_TOKEN';
            } else if (msgLower.includes('identifier') && (msgLower.includes('invalid') || msgLower.includes('unknown'))) {
                errorCode = 'SYNTAX_INVALID_IDENTIFIER';
            } else if (msgLower.includes('then')) {
                errorCode = 'SYNTAX_MISSING_THEN';
            } else if (msgLower.includes('do')) {
                errorCode = 'SYNTAX_MISSING_DO';
            } else if (msgLower.includes('division') && msgLower.includes('zero')) {
                errorCode = 'RUNTIME_DIVISION_ZERO';
            } else if (msgLower.includes('array') && (msgLower.includes('bound') || msgLower.includes('range'))) {
                errorCode = 'RUNTIME_ARRAY_BOUNDS';
            } else if (msgLower.includes('type') && msgLower.includes('mismatch')) {
                errorCode = 'RUNTIME_TYPE_MISMATCH';
            } else if (msgLower.includes('undefined') || (msgLower.includes('unknown') && msgLower.includes('variable'))) {
                errorCode = 'RUNTIME_UNDEFINED_VARIABLE';
            } else if (msgLower.includes('stack') && msgLower.includes('overflow')) {
                errorCode = 'RUNTIME_STACK_OVERFLOW';
            } else if (msgLower.includes('unknown type')) {
                errorCode = 'COMP_UNKNOWN_TYPE';
            } else if (msgLower.includes('duplicate')) {
                errorCode = 'COMP_DUPLICATE_IDENTIFIER';
            } else if (msgLower.includes('program') && msgLower.includes('missing')) {
                errorCode = 'COMP_MISSING_PROGRAM';
            } else if (type === 'runtime') {
                errorCode = 'GENERIC_RUNTIME';
            } else if (type === 'compilation') {
                errorCode = 'GENERIC_COMPILATION';
            }

            const catalogEntry = ERROR_CATALOG[errorCode];
            if (catalogEntry) {
                suggestion = catalogEntry.suggestion;
            }
        } else {
            errorMessage = String(error);
            errorCode = type === 'runtime' ? 'GENERIC_RUNTIME' : type === 'compilation' ? 'GENERIC_COMPILATION' : 'GENERIC_SYNTAX';
        }

        // Try to extract line number from error message
        const lineMatch = errorMessage.match(/line (\d+)/i);
        const columnMatch = errorMessage.match(/column (\d+)/i);

        const result: InterpreterError = {
            message: errorMessage,
            type,
            originalError: error,
            errorCode,
            suggestion,
        };

        if (lineMatch && lineMatch[1]) {
            result.line = parseInt(lineMatch[1], 10);
        }

        if (columnMatch && columnMatch[1]) {
            result.column = parseInt(columnMatch[1], 10);
        }

        return result;
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
