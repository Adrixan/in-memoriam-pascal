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
}

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
    ],
    runtime_error: [
        /division by zero/i,
        /array out of bounds/i,
        /type mismatch/i,
        /undefined variable/i,
        /runtime error/i,
        /overflow/i,
        /null pointer/i,
    ],
    compilation_error: [
        /unknown type/i,
        /duplicate identifier/i,
        /missing program/i,
        /compilation failed/i,
        /compile error/i,
    ],
    output_mismatch: [
        /output.*mismatch/i,
        /expected output/i,
        /actual output/i,
        /output does not match/i,
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
    static analyzeError(result: ValidationResult): AnalyzedError {
        if (result.success) {
            return {
                category: 'unknown',
                description: '',
                suggestedHintIndices: [],
                originalMessage: '',
                isRecoverable: true,
            };
        }

        const category = this.classifyError(result);
        const description = this.generateDescription(result, category);
        const suggestedHintIndices = this.suggestHints(category, result);
        const isRecoverable = this.isRecoverableError(category, result);

        return {
            category,
            description,
            suggestedHintIndices,
            originalMessage: result.messageKey,
            isRecoverable,
        };
    }

    /**
     * Classify error into a category based on patterns and rule types
     */
    static classifyError(result: ValidationResult): ErrorCategory {
        // First, check by failed rule type
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
                return 'Dein Code enthält einen Syntaxfehler. Überprüfe die Schreibweise und Struktur.';

            case 'runtime_error':
                return 'Dein Code hat einen Laufzeitfehler verursacht. Überprüfe Berechnungen und Variablen.';

            case 'output_mismatch':
                if (details?.expected && details?.actual) {
                    return `Die Ausgabe stimmt nicht überein. Erwartet: "${details.expected}", erhalten: "${details.actual}"`;
                }
                return 'Die Ausgabe stimmt nicht mit dem erwarteten Ergebnis überein.';

            case 'missing_keyword':
                if (details?.expected) {
                    return `Dein Code muss "${details.expected}" enthalten.`;
                }
                return 'Deinem Code fehlt ein erforderliches Schlüsselwort.';

            case 'compilation_error':
                return 'Dein Code konnte nicht kompiliert werden. Überprüfe die Deklarationen.';

            case 'logic_error':
                return 'Das Programm läuft, aber das Ergebnis ist nicht korrekt.';

            default:
                return 'Ein Fehler ist aufgetreten. Überprüfe deinen Code.';
        }
    }

    /**
     * Suggest which hints might be most helpful
     */
    static suggestHints(category: ErrorCategory, _result: ValidationResult): number[] {
        // Suggest hints based on error category
        // Return indices 0, 1, 2 in order of relevance
        switch (category) {
            case 'syntax_error':
                // Syntax errors: start with gentle hints about structure
                return [0, 1, 2];

            case 'output_mismatch':
                // Output mismatch: hints about logic
                return [0, 1, 2];

            case 'missing_keyword':
                // Missing keyword: specific hints about what's missing
                return [0, 1, 2];

            case 'runtime_error':
                // Runtime errors: hints about common pitfalls
                return [0, 1, 2];

            case 'compilation_error':
                // Compilation errors: hints about declarations
                return [0, 1, 2];

            default:
                return [0, 1, 2];
        }
    }

    /**
     * Determine if the error is recoverable with hints
     */
    static isRecoverableError(category: ErrorCategory, result: ValidationResult): boolean {
        // Most errors are recoverable with proper guidance
        // Only critical syntax errors might not be
        if (category === 'syntax_error') {
            // Check for specific unrecoverable patterns
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
        // Higher score = more relevant
        // For most errors, the first hint is most relevant
        // For output mismatches, more specific hints might be better

        if (category === 'output_mismatch') {
            // For output issues, more specific hints are better
            return hintIndex + 1; // 1, 2, 3
        }

        // For other errors, gentle hints are preferred
        return 3 - hintIndex; // 3, 2, 1
    }

    /**
     * Check if an error type matches hint's target error types
     */
    static matchesErrorType(hintErrorTypes: string[] | undefined, category: ErrorCategory): boolean {
        if (!hintErrorTypes || hintErrorTypes.length === 0) {
            return true; // No specific error types = matches all
        }

        return hintErrorTypes.includes(category);
    }
}

export default ErrorAnalyzer;
