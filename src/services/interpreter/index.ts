/**
 * Pascal Interpreter Service
 *
 * Provides a clean API for compiling and executing Pascal code in the browser
 * using the Pascal.js compiler.
 */

export { PascalInterpreter, getPascalInterpreter } from './PascalInterpreter';
export { OutputCapture, getOutputCapture } from './OutputCapture';
export type {
    RunResult,
    InterpreterError,
    InterpreterConfig,
    CompilationResult,
    OutputHandler,
    PascalParser,
    IRModule,
    LLVMModule,
    PascalJsGlobals,
} from './types';
