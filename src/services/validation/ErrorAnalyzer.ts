/**
 * ErrorAnalyzer Service
 * 
 * Analyzes validation errors to suggest relevant hints.
 * Maps error types to hint categories for context-aware hint suggestions.
 */

import type { ValidationResult } from '@/data/tutorials/validation';

/**
 * Error type classification
 */
export type ErrorCategory =
    | 'syntax_error'
    | 'runtime_error'
    | 'output_mismatch'
    | 'missing_keyword'
    | 'compilation_error'
    | 'logic_error'
    | 'unknown';

/**
 * Analyzed error result with hint suggestions
 */
export interface AnalyzedError {
    /** Classified error category */
    category: ErrorCategory;

    /** User-friendly error description */
    description: string;

    /** Suggested hint indices (0-based) */
    suggestedHintIndices: number[];

    /** Original error message */
    originalMessage: string;

    /** Whether this error is recoverable */
    isRecoverable: boolean;

    /** Error code from interpreter */
    errorCode: string;

    /** Suggested fix from interpreter */
    suggestion: string;
}

/**
 * Context-aware suggestions for common errors
 */
interface ErrorSuggestion {
    pattern: RegExp;
    suggestion: string;
}

const ERROR_SUGGESTIONS: ErrorSuggestion[] = [
    // Syntax errors
    { pattern: /semicolon/i, suggestion: 'Did you forget a semicolon at the end of the statement?' },
    { pattern: /unexpected token/i, suggestion: 'Check for typos or missing punctuation marks.' },
    { pattern: /missing end/i, suggestion: 'Every BEGIN needs a matching END.' },
    { pattern: /invalid identifier/i, suggestion: 'Variable names must start with a letter and contain only letters, numbers, and underscores.' },
    { pattern: /then/i, suggestion: 'IF statements require THEN after the condition.' },
    { pattern: /do/i, suggestion: 'Loops (FOR, WHILE) require DO after the condition.' },
    { pattern: /begin/i, suggestion: 'Multiple statements need to be wrapped in BEGIN...END.' },
    // Runtime errors
    { pattern: /division by zero/i, suggestion: 'Check your divisor - it cannot be zero.' },
    { pattern: /array.*bound/i, suggestion: 'Array indices must be within the declared range.' },
    { pattern: /type mismatch/i, suggestion: 'Make sure the data types are compatible.' },
    { pattern: /undefined.*variable/i, suggestion: 'Declare the variable in the VAR section before using it.' },
    { pattern: /overflow/i, suggestion: 'The value is too large for the variable type.' },
    // Compilation errors
    { pattern: /unknown type/i, suggestion: 'Check the type name - use Integer, Real, String, Boolean, or Char.' },
    { pattern: /duplicate/i, suggestion: 'You cannot declare the same variable twice.' },
    { pattern: /unknown.*procedure/i, suggestion: 'Make sure the procedure is defined before it is called.' },
    { pattern: /unknown.*function/i, suggestion: 'Make sure the function is defined before it is called.' },
    { pattern: /parameter/i, suggestion: 'Check the number of parameters passed to the procedure/function.' },
    // Output errors
    { pattern: /output.*mismatch/i, suggestion: 'Check the exact output format - capitalization and spacing matter.' },
    { pattern: /expected.*got/i, suggestion: 'The output does not match. Compare expected vs actual carefully.' },
];

/**
 * Error pattern definitions for classification
 */
const ERROR_PATTERNS: Record<ErrorCategory, RegExp[]> = {
    syntax_error: [
        /unexpected token/i,
        /missing semicolon/i,
        /missing end/i,
        /invalid identifier/i,
        /syntax error/i,
        /unexpected/i,
        /expected/i,
        /parse error/i,
        /begin/i,
        /then/i,
    ],
    runtime_error: [
        /division by zero/i,
        /array out of bounds/i,
        /type mismatch/i,
        /undefined variable/i,
        /runtime error/i,
        /overflow/i,
        /nil pointer/i,
    ],
    compilation_error: [
        /unknown type/i,
        /duplicate identifier/i,
        /missing program/i,
        /compilation failed/i,
        /compile error/i,
        /unknown procedure/i,
        /unknown function/i,
    ],
    output_mismatch: [
        /output.*mismatch/i,
        /expected output/i,
        /actual output/i,
        /output does not match/i,
        /expected.*got/i,
    ],
    missing_keyword: [
        /missing.*keyword/i,
        /keyword.*missing/i,
        /should contain/i,
        /code should contain/i,
        /missing/i,
    ],
    logic_error: [
        /logic error/i,
        /incorrect result/i,
        /wrong value/i,
    ],
    unknown: [],
};

/**
 * Map validation rule types to error categories
 */
const RULE_TYPE_TO_CATEGORY: Record<string, ErrorCategory> = {
    'output_match': 'output_mismatch',
    'output_contains': 'output_mismatch',
    'code_contains': 'missing_keyword',
    'code_pattern': 'syntax_error',
    'compiles': 'compilation_error',
    'no_runtime_error': 'runtime_error',
};

/**
 * ErrorAnalyzer class
 * Provides static methods for analyzing validation errors
 */
export class ErrorAnalyzer {
    /**
     * Analyze a validation result to determine error category and suggest hints
     */
    static analyzeError(result: ValidationResult, interpreterErrorCode?: string, interpreterSuggestion?: string): AnalyzedError {
        if (result.success) {
            return {
                category: 'unknown',
                description: '',
                suggestedHintIndices: [],
                originalMessage: '',
                isRecoverable: true,
                errorCode: '',
                suggestion: '',
            };
        }

        const category = this.classifyError(result, interpreterErrorCode);
        const description = this.generateDescription(result, category);
        const suggestedHintIndices = this.suggestHints(category, result);
        const isRecoverable = this.isRecoverableError(category, result);
        const suggestion = interpreterSuggestion || this.getSuggestion(result.messageKey, category);

        return {
            category,
            description,
            suggestedHintIndices,
            originalMessage: result.messageKey,
            isRecoverable,
            errorCode: interpreterErrorCode ?? '',
            suggestion: suggestion ?? '',
        };
    }

    /**
     * Classify error into a category based on patterns and rule types
     */
    static classifyError(result: ValidationResult, interpreterErrorCode?: string): ErrorCategory {
        // First check interpreter error code if available
        if (interpreterErrorCode) {
            if (interpreterErrorCode.startsWith('SYNTAX_')) return 'syntax_error';
            if (interpreterErrorCode.startsWith('RUNTIME_')) return 'runtime_error';
            if (interpreterErrorCode.startsWith('COMP_')) return 'compilation_error';
        }

        // Check by failed rule type
        if (result.details?.failedRule) {
            const ruleCategory = RULE_TYPE_TO_CATEGORY[result.details.failedRule];
            if (ruleCategory) {
                return ruleCategory;
            }
        }

        // Check error message against patterns
        const message = result.messageKey.toLowerCase();
        for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
            if (category === 'unknown') continue;

            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    return category as ErrorCategory;
                }
            }
        }

        return 'unknown';
    }

    /**
     * Generate a user-friendly description of the error
     */
    static generateDescription(result: ValidationResult, category: ErrorCategory): string {
        const details = result.details;

        switch (category) {
            case 'syntax_error':
                return 'Your code contains a syntax error. Check the spelling and structure.';

            case 'runtime_error':
                return 'Your code caused a runtime error. Check calculations and variables.';

            case 'output_mismatch':
                if (details?.expected && details?.actual) {
                    return `Output mismatch. Expected: "${details.expected}", got: "${details.actual}"`;
                }
                return 'The output does not match the expected result.';

            case 'missing_keyword':
                if (details?.expected) {
                    return `Your code must contain "${details.expected}".`;
                }
                return 'Your code is missing a required keyword.';

            case 'compilation_error':
                return 'Your code could not be compiled. Check the declarations.';

            case 'logic_error':
                return 'The program runs, but the result is not correct.';

            default:
                return 'An error occurred. Check your code.';
        }
    }

    /**
     * Get a context-aware suggestion for the error
     */
    static getSuggestion(message: string, category: ErrorCategory): string | undefined {
        const msgLower = message.toLowerCase();

        // Check against specific patterns first
        for (const { pattern, suggestion } of ERROR_SUGGESTIONS) {
            if (pattern.test(msgLower)) {
                return suggestion;
            }
        }

        // Return category-based generic suggestion
        switch (category) {
            case 'syntax_error':
                return 'Review your code for typos and missing punctuation.';
            case 'runtime_error':
                return 'Check variable values and calculations.';
            case 'output_mismatch':
                return 'Compare your output with the expected format carefully.';
            case 'missing_keyword':
                return 'Make sure to include the required keyword in your code.';
            case 'compilation_error':
                return 'Check all declarations and make sure they are correct.';
            case 'logic_error':
                return 'Review your algorithm and logic.';
            default:
                return undefined;
        }
    }

    /**
     * Suggest which hints might be most helpful
     */
    static suggestHints(category: ErrorCategory, _result: ValidationResult): number[] {
        // Suggest hints based on error category
        switch (category) {
            case 'syntax_error':
                return [0, 1, 2];
            case 'output_mismatch':
                return [0, 1, 2];
            case 'missing_keyword':
                return [0, 1, 2];
            case 'runtime_error':
                return [0, 1, 2];
            case 'compilation_error':
                return [0, 1, 2];
            default:
                return [0, 1, 2];
        }
    }

    /**
     * Determine if the error is recoverable with hints
     */
    static isRecoverableError(category: ErrorCategory, result: ValidationResult): boolean {
        if (category === 'syntax_error') {
            const message = result.messageKey.toLowerCase();
            if (message.includes('fatal') || message.includes('critical')) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get a hint relevance score for a specific error category
     */
    static getHintRelevance(hintIndex: number, category: ErrorCategory): number {
        if (category === 'output_mismatch') {
            return hintIndex + 1;
        }
        return 3 - hintIndex;
    }

    /**
     * Check if an error type matches hint's target error types
     */
    static matchesErrorType(hintErrorTypes: string[] | undefined, category: ErrorCategory): boolean {
        if (!hintErrorTypes || hintErrorTypes.length === 0) {
            return true;
        }
        return hintErrorTypes.includes(category);
    }
}

export default ErrorAnalyzer;
