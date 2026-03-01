/**
 * SolutionValidator Service
 * 
 * Validates user solutions against tutorial level requirements.
 * Integrates with PascalInterpreter to run code and check outputs.
 */

import type { TutorialLevel, ValidationRule } from '@/types';
import { validateSolution, type ValidationResult, type ExtendedValidationRule } from '@/data/tutorials/validation';

/**
 * Result of validating a level solution
 */
export interface LevelValidationResult extends ValidationResult {
    /** Whether the level was completed successfully */
    levelCompleted: boolean;
    /** The level ID that was validated */
    levelId: string;
    /** Number of attempts made */
    attempts?: number;
    /** Time taken to solve (ms) */
    timeTaken?: number;
}

/**
 * Output from code execution
 */
export interface ExecutionOutput {
    /** Standard output lines */
    output: string[];
    /** Error messages */
    errors: string[];
    /** Whether execution succeeded */
    success: boolean;
    /** Execution time in ms */
    executionTime: number;
}

/**
 * Detailed error information for better debugging
 */
export interface ValidationErrorDetail {
    /** Error category */
    category: string;
    /** User-friendly message */
    message: string;
    /** Suggested fix */
    suggestion: string;
    /** Expected value */
    expected: string;
    /** Actual value */
    actual: string;
}

/**
 * SolutionValidator class
 * Validates user code against level requirements
 */
export class SolutionValidator {
    /**
     * Validate user code against a level's requirements
     */
    static validateLevel(
        level: TutorialLevel,
        code: string,
        executionOutput: ExecutionOutput
    ): LevelValidationResult {
        // Combine output lines into a single string
        const output = executionOutput.output.join('\n');
        const hasError = !executionOutput.success || executionOutput.errors.length > 0;
        const errorMessage = executionOutput.errors.join('\n');

        // Check for runtime errors first - if code fails to execute, level is not complete
        if (hasError) {
            return {
                success: false,
                levelCompleted: false,
                levelId: level.id,
                messageKey: 'validation.runtimeError',
                details: {
                    failedRule: 'no_runtime_error',
                    expected: 'Code should execute without errors',
                    actual: errorMessage || 'Execution failed',
                },
            };
        }

        // Convert validation rules to extended format
        const extendedRules = this.convertValidationRules(level.validation);

        // Run validation
        const validationResult = validateSolution(
            code,
            output,
            hasError,
            errorMessage,
            extendedRules
        );

        return {
            ...validationResult,
            levelCompleted: validationResult.success,
            levelId: level.id,
        };
    }

    /**
     * Check if code compiles without errors
     */
    static checkCompilation(executionOutput: ExecutionOutput): boolean {
        return executionOutput.success && executionOutput.errors.length === 0;
    }

    /**
     * Check if output matches expected output
     */
    static checkOutputMatch(actual: string, expected: string): boolean {
        // Normalize whitespace for comparison
        const normalizeOutput = (str: string) => str.trim().replace(/\r\n/g, '\n');
        return normalizeOutput(actual) === normalizeOutput(expected);
    }

    /**
     * Check if code contains required keywords
     */
    static checkKeywords(code: string, keywords: string[], caseSensitive = false): boolean {
        const codeToCheck = caseSensitive ? code : code.toLowerCase();
        return keywords.every((keyword) => {
            const keywordToCheck = caseSensitive ? keyword : keyword.toLowerCase();
            return codeToCheck.includes(keywordToCheck);
        });
    }

    /**
     * Check if code matches a pattern
     */
    static checkPattern(code: string, pattern: RegExp): boolean {
        return pattern.test(code);
    }

    /**
     * Convert ValidationRule[] to ExtendedValidationRule[]
     */
    private static convertValidationRules(rules: ValidationRule[]): ExtendedValidationRule[] {
        return rules.map((rule) => {
            // Map the existing validation rule types to extended types
            const typeMap: Record<string, ExtendedValidationRule['type']> = {
                'output_match': 'output_match',
                'contains_keyword': 'code_contains',
                'compiles': 'compiles',
                'custom': 'output_contains', // Default fallback
            };

            const extendedType = typeMap[rule.type] ?? 'output_contains';

            return {
                type: extendedType,
                config: rule.config,
                errorKey: rule.errorKey,
            };
        });
    }

    /**
     * Get detailed error information for a validation failure
     */
    static getErrorDetail(result: LevelValidationResult): ValidationErrorDetail {
        const details = result.details;
        const defaultValues = { suggestion: '', expected: '', actual: '' };

        if (result.success) {
            return {
                category: 'success',
                message: 'Validation passed',
                ...defaultValues,
            };
        }

        const category = details?.failedRule || 'unknown';

        switch (category) {
            case 'output_match':
                return {
                    category: 'output_mismatch',
                    message: 'Output mismatch',
                    suggestion: 'Check the exact format of your output - capitalization and spacing matter.',
                    expected: details?.expected ?? '',
                    actual: details?.actual ?? '',
                };
            case 'output_contains':
                return {
                    category: 'output_mismatch',
                    message: `Output should contain: "${details?.expected ?? ''}"`,
                    suggestion: 'Make sure your output includes the required text.',
                    expected: details?.expected ?? '',
                    actual: details?.actual ?? '',
                };
            case 'code_contains':
                return {
                    category: 'missing_keyword',
                    message: `Code should contain: "${details?.expected ?? ''}"`,
                    suggestion: 'Make sure to include the required keyword in your code.',
                    expected: details?.expected ?? '',
                    actual: '',
                };
            case 'code_pattern':
                return {
                    category: 'syntax_error',
                    message: `Code should match pattern: ${details?.expected ?? ''}`,
                    suggestion: 'Check the syntax of your code.',
                    expected: details?.expected ?? '',
                    actual: '',
                };
            case 'compiles':
                return {
                    category: 'compilation_error',
                    message: 'Code has compilation errors',
                    suggestion: 'Review your code for syntax errors.',
                    expected: '',
                    actual: details?.actual ?? '',
                };
            case 'no_runtime_error':
                return {
                    category: 'runtime_error',
                    message: 'Code has runtime errors',
                    suggestion: 'Check your calculations and variable values.',
                    expected: '',
                    actual: details?.actual ?? '',
                };
            default:
                return {
                    category: 'unknown',
                    message: details?.expected ?? 'Validation failed',
                    suggestion: 'Review your code and try again.',
                    expected: details?.expected ?? '',
                    actual: '',
                };
        }
    }

    /**
     * Get a user-friendly error message for a validation failure
     */
    static getErrorMessage(result: LevelValidationResult): string {
        const errorDetail = this.getErrorDetail(result);

        let message = errorDetail.message;

        if (errorDetail.expected && errorDetail.actual) {
            message += `\nExpected: "${errorDetail.expected}"`;
            message += `\nActual: "${errorDetail.actual}"`;
        }

        if (errorDetail.suggestion) {
            message += `\nHint: ${errorDetail.suggestion}`;
        }

        return message;
    }
}

export default SolutionValidator;
