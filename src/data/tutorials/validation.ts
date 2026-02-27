/**
 * Validation rules and utilities for tutorial levels
 * 
 * Provides validation logic for checking Pascal code solutions
 * against expected outputs and code patterns.
 */

import type { ValidationRule } from '@/types';

/**
 * Validation details for error reporting
 */
export interface ValidationDetails {
    expected?: string;
    actual?: string;
    failedRule?: string;
}

/**
 * Validation result returned after checking a solution
 */
export interface ValidationResult {
    /** Whether validation passed */
    success: boolean;

    /** i18n key for success/error message */
    messageKey: string;

    /** Additional details about the validation */
    details?: ValidationDetails;
}

/**
 * Extended validation rule types for more granular control
 */
export type ValidationType =
    | 'output_match'      // Exact output match
    | 'output_contains'   // Output contains substring
    | 'output_pattern'    // Output matches regex pattern
    | 'code_contains'     // Code contains keyword/phrase
    | 'code_pattern'      // Code matches regex pattern
    | 'compiles'          // Code compiles without errors
    | 'no_runtime_error'; // Code runs without runtime errors

/**
 * Extended validation rule interface with additional configuration
 */
export interface ExtendedValidationRule extends Omit<ValidationRule, 'type'> {
    type: ValidationType;
    /** Optional description for debugging */
    description?: string;
}

/**
 * Predefined validation rules for common checks
 */
export const ValidationPresets = {
    /**
     * Check if output matches exactly (ignoring trailing whitespace)
     */
    outputMatch: (expected: string, errorKey: string): ExtendedValidationRule => ({
        type: 'output_match',
        config: { expected: expected.trim() },
        errorKey,
        description: `Output must match: "${expected.trim()}"`,
    }),

    /**
     * Check if output contains a specific string
     */
    outputContains: (substring: string, errorKey: string): ExtendedValidationRule => ({
        type: 'output_contains',
        config: { substring },
        errorKey,
        description: `Output must contain: "${substring}"`,
    }),

    /**
     * Check if output matches a regex pattern
     */
    outputPattern: (pattern: RegExp, errorKey: string): ExtendedValidationRule => ({
        type: 'output_pattern',
        config: { pattern: pattern.source, flags: pattern.flags },
        errorKey,
        description: `Output must match pattern: ${pattern.source}`,
    }),

    /**
     * Check if code contains a specific keyword or phrase
     */
    codeContains: (keyword: string, errorKey: string, caseSensitive = false): ExtendedValidationRule => ({
        type: 'code_contains',
        config: { keyword, caseSensitive },
        errorKey,
        description: `Code must contain: "${keyword}"`,
    }),

    /**
     * Check if code matches a regex pattern
     */
    codePattern: (pattern: RegExp, errorKey: string): ExtendedValidationRule => ({
        type: 'code_pattern',
        config: { pattern: pattern.source, flags: pattern.flags },
        errorKey,
        description: `Code must match pattern: ${pattern.source}`,
    }),

    /**
     * Check if code compiles without errors
     */
    compiles: (errorKey: string): ExtendedValidationRule => ({
        type: 'compiles',
        config: {},
        errorKey,
        description: 'Code must compile without errors',
    }),

    /**
     * Check if code runs without runtime errors
     */
    noRuntimeError: (errorKey: string): ExtendedValidationRule => ({
        type: 'no_runtime_error',
        config: {},
        errorKey,
        description: 'Code must run without errors',
    }),
} as const;

/**
 * Creates a failed validation result with details
 */
function createFailureResult(
    errorKey: string,
    expected: string,
    actual: string,
    failedRule: string
): ValidationResult {
    return {
        success: false,
        messageKey: errorKey,
        details: {
            expected,
            actual,
            failedRule,
        },
    };
}

/**
 * Creates a success validation result
 */
function createSuccessResult(): ValidationResult {
    return {
        success: true,
        messageKey: 'validation.success',
    };
}

/**
 * Validates output against a rule
 */
export function validateOutput(
    output: string,
    rule: ExtendedValidationRule
): ValidationResult {
    const normalizedOutput = output.trim();
    const config = rule.config as Record<string, unknown>;

    switch (rule.type) {
        case 'output_match': {
            const expected = String(config['expected']).trim();
            const success = normalizedOutput === expected;
            return success
                ? createSuccessResult()
                : createFailureResult(rule.errorKey, expected, normalizedOutput, 'output_match');
        }

        case 'output_contains': {
            const substring = String(config['substring']);
            const success = normalizedOutput.includes(substring);
            return success
                ? createSuccessResult()
                : createFailureResult(
                    rule.errorKey,
                    `Output containing "${substring}"`,
                    normalizedOutput,
                    'output_contains'
                );
        }

        case 'output_pattern': {
            const pattern = new RegExp(
                String(config['pattern']),
                String(config['flags'] || '')
            );
            const success = pattern.test(normalizedOutput);
            return success
                ? createSuccessResult()
                : createFailureResult(
                    rule.errorKey,
                    `Output matching pattern ${pattern.source}`,
                    normalizedOutput,
                    'output_pattern'
                );
        }

        default:
            return {
                success: false,
                messageKey: 'validation.unknownRule',
                details: { failedRule: rule.type },
            };
    }
}

/**
 * Validates code against a rule
 */
export function validateCode(
    code: string,
    rule: ExtendedValidationRule
): ValidationResult {
    const normalizedCode = code.trim();
    const config = rule.config as Record<string, unknown>;

    switch (rule.type) {
        case 'code_contains': {
            const keyword = String(config['keyword']);
            const caseSensitive = Boolean(config['caseSensitive']);
            const codeToCheck = caseSensitive ? normalizedCode : normalizedCode.toLowerCase();
            const keywordToCheck = caseSensitive ? keyword : keyword.toLowerCase();
            const success = codeToCheck.includes(keywordToCheck);
            return success
                ? createSuccessResult()
                : createFailureResult(
                    rule.errorKey,
                    `Code containing "${keyword}"`,
                    normalizedCode,
                    'code_contains'
                );
        }

        case 'code_pattern': {
            const pattern = new RegExp(
                String(config['pattern']),
                String(config['flags'] || '')
            );
            const success = pattern.test(normalizedCode);
            return success
                ? createSuccessResult()
                : createFailureResult(
                    rule.errorKey,
                    `Code matching pattern ${pattern.source}`,
                    normalizedCode,
                    'code_pattern'
                );
        }

        default:
            return {
                success: false,
                messageKey: 'validation.unknownRule',
                details: { failedRule: rule.type },
            };
    }
}

/**
 * Validates execution result (compilation/runtime errors)
 */
export function validateExecution(
    hasError: boolean,
    errorMessage: string | undefined,
    rule: ExtendedValidationRule
): ValidationResult {
    switch (rule.type) {
        case 'compiles': {
            const success = !hasError || !errorMessage?.includes('syntax');
            return success
                ? createSuccessResult()
                : createFailureResult(
                    rule.errorKey,
                    'No compilation errors',
                    errorMessage || 'None',
                    'compiles'
                );
        }

        case 'no_runtime_error': {
            const success = !hasError;
            return success
                ? createSuccessResult()
                : createFailureResult(
                    rule.errorKey,
                    'No runtime errors',
                    errorMessage || 'None',
                    'no_runtime_error'
                );
        }

        default:
            return createSuccessResult();
    }
}

/**
 * Runs all validation rules against code and output
 */
export function validateSolution(
    code: string,
    output: string,
    hasError: boolean,
    errorMessage: string | undefined,
    rules: ExtendedValidationRule[]
): ValidationResult {
    // Run all rules in order
    for (const rule of rules) {
        let result: ValidationResult;

        switch (rule.type) {
            case 'output_match':
            case 'output_contains':
            case 'output_pattern':
                result = validateOutput(output, rule);
                break;

            case 'code_contains':
            case 'code_pattern':
                result = validateCode(code, rule);
                break;

            case 'compiles':
            case 'no_runtime_error':
                result = validateExecution(hasError, errorMessage, rule);
                break;

            default:
                continue;
        }

        // Return first failure
        if (!result.success) {
            return result;
        }
    }

    // All rules passed
    return createSuccessResult();
}

export default {
    ValidationPresets,
    validateOutput,
    validateCode,
    validateExecution,
    validateSolution,
};
