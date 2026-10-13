/**
 * Engine core
 *
 * Platform independent glue around the Pascal engine bundle (engine/host.js).
 * It is used by the execution worker and by the Node based engine tests, so the
 * semantics of "compile, then run with replayed input" are identical in both.
 */

/** Hooks the bundle invokes while a compiled program runs. */
export interface RunHooks {
    /** Next stdin character code, or null at end of input. May throw to abort. */
    stdin(): number | null;
    /** One stdout character code; null signals a flush. */
    stdout(code: number | null): void;
    stderr?(code: number | null): void;
}

/** The API exposed by the engine bundle as the global `PascalEngine`. */
export interface PascalEngineApi {
    compile(source: string): string;
    toIR(source: string): string;
    run(js: string, hooks: RunHooks): void;
}

/** Why a compile failed, in a form the UI can localise. */
export interface CompileDiagnostic {
    /** syntax errors come from the parser, semantic errors from code generation */
    kind: 'syntax' | 'semantic';
    message: string;
    /** 1-based line, when known */
    line?: number;
    /** 1-based column, when known */
    column?: number;
    /** Offending token for syntax errors */
    unexpected?: string;
    /** Token names the parser would have accepted */
    expected?: string[];
}

/** A runtime error raised by compiled code (division by zero, range errors, ...). */
export interface RuntimeDiagnostic {
    code: number;
    message: string;
    line?: number;
}

/** Result of running a compiled program once. */
export type RunOutcome =
    | { kind: 'finished'; exitCode: number }
    | { kind: 'needInput' }
    | { kind: 'runtimeError'; error: RuntimeDiagnostic };

/** Thrown by the stdin hook when the program reads past the supplied input. */
export class NeedInputSignal {
    readonly needInput = true;
}

interface JisonHash {
    text?: string;
    line?: number;
    token?: string | null;
    expected?: string[];
}

interface EngineError {
    name?: string;
    message?: string;
    lineno?: number;
    line?: number;
    column?: number;
    hash?: JisonHash;
}

function isEngineError(value: unknown): value is EngineError {
    return typeof value === 'object' && value !== null;
}

/**
 * Turn whatever the compiler threw into a structured diagnostic.
 *
 * @param source the program text, used to locate the column of a syntax error
 */
export function toCompileDiagnostic(error: unknown, source: string): CompileDiagnostic {
    if (!isEngineError(error)) {
        return { kind: 'semantic', message: String(error) };
    }

    if (error.name === 'PascalSyntaxError' && error.hash) {
        const hash = error.hash;
        const diagnostic: CompileDiagnostic = {
            kind: 'syntax',
            message: error.message?.split('\n')[0] ?? 'Syntax error',
        };
        if (typeof hash.line === 'number') {
            // jison counts lines from 0
            diagnostic.line = hash.line + 1;
        }
        if (hash.text) {
            diagnostic.unexpected = hash.text;
            const lineText = source.split(/\r?\n/)[hash.line ?? 0];
            const index = lineText?.toLowerCase().indexOf(hash.text.toLowerCase()) ?? -1;
            if (index >= 0) {
                diagnostic.column = index + 1;
            }
        }
        if (hash.expected) {
            diagnostic.expected = hash.expected.map((name) => name.replace(/^'|'$/g, ''));
        }
        return diagnostic;
    }

    const diagnostic: CompileDiagnostic = {
        kind: 'semantic',
        message: error.message ?? String(error),
    };
    if (typeof error.lineno === 'number') {
        diagnostic.line = error.lineno;
    }
    return diagnostic;
}

/** Decode a thrown value into a runtime diagnostic or an exit request. */
function classifyThrown(thrown: unknown): RunOutcome {
    if (thrown instanceof NeedInputSignal || (isEngineError(thrown) && (thrown as { needInput?: boolean }).needInput)) {
        return { kind: 'needInput' };
    }
    if (typeof thrown === 'string') {
        const exit = /^exit\((-?\d+)\)/.exec(thrown);
        if (exit) {
            return { kind: 'finished', exitCode: Number(exit[1]) };
        }
        return { kind: 'runtimeError', error: { code: 0, message: thrown.split('\n')[0] ?? thrown } };
    }
    if (isEngineError(thrown)) {
        const trap = thrown as { pascalRuntimeError?: boolean; code?: number; line?: number; message?: string };
        if (trap.pascalRuntimeError) {
            const error: RuntimeDiagnostic = { code: trap.code ?? 0, message: trap.message ?? 'Runtime error' };
            if (typeof trap.line === 'number' && trap.line > 0) {
                error.line = trap.line;
            }
            return { kind: 'runtimeError', error };
        }
        return { kind: 'runtimeError', error: { code: 0, message: thrown.message ?? String(thrown) } };
    }
    return { kind: 'runtimeError', error: { code: 0, message: String(thrown) } };
}

/**
 * Run compiled JavaScript once.
 *
 * stdin is served from `input`. Reading past the end aborts the run with
 * `needInput`; the caller asks the user for another line and runs again with
 * the extended input (replay model), so no blocking read is ever needed.
 *
 * @param onOutput receives text as the program produces it
 */
export function executeProgram(
    engine: PascalEngineApi,
    js: string,
    input: string,
    onOutput: (text: string) => void,
): RunOutcome {
    let position = 0;
    let pending = '';

    const flush = (): void => {
        if (pending) {
            onOutput(pending);
            pending = '';
        }
    };

    const hooks: RunHooks = {
        stdin(): number | null {
            if (position >= input.length) {
                throw new NeedInputSignal();
            }
            return input.charCodeAt(position++);
        },
        stdout(code: number | null): void {
            if (code === null) {
                flush();
                return;
            }
            pending += String.fromCharCode(code);
            if (code === 10) {
                flush();
            }
        },
    };
    hooks.stderr = hooks.stdout;

    try {
        engine.run(js, hooks);
        flush();
        return { kind: 'finished', exitCode: 0 };
    } catch (thrown) {
        flush();
        return classifyThrown(thrown);
    }
}
