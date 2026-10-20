/**
 * Turns engine diagnostics into InterpreterError values the UI can translate.
 *
 * Every error carries an English message and, where there is one, a key in
 * the "errors" namespace (under "interpreter.") plus the values it needs.
 */

import type { CompileDiagnostic, RuntimeDiagnostic } from '@/engine/core';
import type { InterpreterError } from '@/types';
import type { RunResult } from './PascalRunner';

/** How the parser's token names read in Pascal source. */
const TOKEN_TEXT: Record<string, string> = {
    SEMI: ';',
    COLON: ':',
    COMMA: ',',
    DOT: '.',
    DOTDOT: '..',
    LPAREN: '(',
    RPAREN: ')',
    LBRACK: '[',
    RBRACK: ']',
    ASSIGN: ':=',
    EQ: '=',
    NEQ: '<>',
    LEQ: '<=',
    GEQ: '>=',
    LT: '<',
    GT: '>',
    PLUS: '+',
    MINUS: '-',
    STAR: '*',
    SLASH: '/',
    CARET: '^',
    ID: 'identifier',
    INTEGER_LITERAL: 'number',
    REAL_LITERAL: 'number',
    STRING_LITERAL: 'string',
    CHARACTER_LITERAL: 'character',
    EOF: 'end of file',
};

function tokenText(token: string): string {
    return TOKEN_TEXT[token] ?? token.toLowerCase();
}

function withPosition(error: InterpreterError, line: number | undefined, column?: number | undefined): InterpreterError {
    if (line !== undefined) {
        error.line = line;
    }
    if (column !== undefined) {
        error.column = column;
    }
    return error;
}

function syntaxError(d: CompileDiagnostic): InterpreterError {
    const unexpected = d.unexpected ?? '';
    const expected = d.expected ?? [];

    if (d.token === 'EOF' || unexpected === '') {
        return withPosition(
            {
                type: 'syntax',
                message: "The program ends too early. A 'end' or the final '.' may be missing.",
                messageKey: 'interpreter.syntax.unexpectedEnd',
            },
            d.line,
            d.column,
        );
    }

    if (d.token === 'INVALID') {
        return withPosition(
            {
                type: 'syntax',
                message: `Unexpected character '${unexpected}'.`,
                messageKey: 'interpreter.syntax.invalidCharacter',
                params: { token: unexpected },
            },
            d.line,
            d.column,
        );
    }

    // The most common slip: a statement that is not closed with ';'. The
    // parser only notices at the start of the next statement.
    if (expected.includes('SEMI') && (d.token === 'ID' || d.token === 'BEGIN' || d.token === 'END')) {
        return withPosition(
            {
                type: 'syntax',
                message: `Unexpected '${unexpected}'. A semicolon (;) may be missing at the end of the previous statement.`,
                messageKey: 'interpreter.syntax.missingSemicolon',
                params: { token: unexpected },
            },
            d.line,
            d.column,
        );
    }

    const names = [...new Set(expected.map(tokenText))];
    if (names.length > 0 && names.length <= 4) {
        const list = names.map((n) => `'${n}'`).join(', ');
        return withPosition(
            {
                type: 'syntax',
                message: `Unexpected '${unexpected}'. Expected ${list}.`,
                messageKey: 'interpreter.syntax.expected',
                params: { token: unexpected, expected: list },
            },
            d.line,
            d.column,
        );
    }

    return withPosition(
        {
            type: 'syntax',
            message: `Unexpected '${unexpected}'.`,
            messageKey: 'interpreter.syntax.unexpected',
            params: { token: unexpected },
        },
        d.line,
        d.column,
    );
}

interface SemanticPattern {
    pattern: RegExp;
    key: string;
    /** Names of the capture groups, in order */
    params: string[];
}

const SEMANTIC_PATTERNS: SemanticPattern[] = [
    { pattern: /^Variable '([^']+)' not found/, key: 'interpreter.semantic.unknownIdentifier', params: ['name'] },
    { pattern: /^Name '([^']+)' not found/, key: 'interpreter.semantic.unknownIdentifier', params: ['name'] },
    { pattern: /^Unknown function '([^']+)'/, key: 'interpreter.semantic.unknownRoutine', params: ['name'] },
    { pattern: /^Unknown type '([^']+)'/, key: 'interpreter.semantic.unknownType', params: ['name'] },
    {
        pattern: /^Type of lvalue and expression do not match: (\w+) vs (\w+)/,
        key: 'interpreter.semantic.typeMismatch',
        params: ['expected', 'actual'],
    },
    { pattern: /^Parameter mismatch calling (\w+)/, key: 'interpreter.semantic.parameterMismatch', params: ['name'] },
    { pattern: /^Record has no field '([^']+)'/, key: 'interpreter.semantic.noSuchField', params: ['name'] },
    {
        pattern: /^Unit '([^']+)' not found/,
        key: 'interpreter.semantic.unknownUnit',
        params: ['name'],
    },
    {
        pattern: /^'([^']+)' is declared in the interface of unit (\w+) but not implemented/,
        key: 'interpreter.semantic.unitNotImplemented',
        params: ['name', 'unit'],
    },
];

function semanticError(d: CompileDiagnostic): InterpreterError {
    for (const { pattern, key, params } of SEMANTIC_PATTERNS) {
        const match = pattern.exec(d.message);
        if (match) {
            const values: Record<string, string> = {};
            params.forEach((name, index) => {
                values[name] = match[index + 1] ?? '';
            });
            return withPosition(
                { type: 'compilation', message: d.message, messageKey: key, params: values },
                d.line,
                d.column,
            );
        }
    }
    return withPosition(
        {
            type: 'compilation',
            message: d.message,
            messageKey: 'interpreter.semantic.generic',
            params: { message: d.message },
        },
        d.line,
        d.column,
    );
}

export function compileDiagnosticToError(d: CompileDiagnostic): InterpreterError {
    return d.kind === 'syntax' ? syntaxError(d) : semanticError(d);
}

const RUNTIME_CODES = new Set([2, 5, 100, 102, 103, 106, 200, 201, 204, 207]);

export function runtimeDiagnosticToError(d: RuntimeDiagnostic): InterpreterError {
    const error: InterpreterError = { type: 'runtime', message: d.message };
    if (RUNTIME_CODES.has(d.code)) {
        error.messageKey = `interpreter.runtime.code${d.code}`;
    } else {
        error.messageKey = 'interpreter.runtime.generic';
        error.params = { message: d.message };
    }
    return withPosition(error, d.line);
}

/** The error to show for a run result, or undefined when the run was fine. */
export function runResultToError(result: RunResult): InterpreterError | undefined {
    switch (result.status) {
        case 'compileError':
            return compileDiagnosticToError(result.diagnostic);
        case 'runtimeError':
            return runtimeDiagnosticToError(result.error);
        case 'timeout':
            return {
                type: 'system',
                message: `The program ran for more than ${Math.round(result.timeoutMs / 1000)} seconds and was stopped. It may contain an endless loop.`,
                messageKey: 'interpreter.timeout',
                params: { seconds: Math.round(result.timeoutMs / 1000) },
            };
        case 'outputLimit':
            return {
                type: 'system',
                message: 'The program produced too much output and was stopped.',
                messageKey: 'interpreter.outputLimit',
            };
        case 'crashed':
            return {
                type: 'system',
                message: `The execution environment failed: ${result.message}`,
                messageKey: 'interpreter.crashed',
                params: { message: result.message },
            };
        default:
            return undefined;
    }
}
