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
     * Get a user-friendly error message for a validation failure
     */
    static getErrorMessage(result: LevelValidationResult): string {
        if (result.success) {
            return '';
        }

        if (result.details?.failedRule) {
            switch (result.details.failedRule) {
                case 'output_match':
                    return `Expected output: "${result.details.expected}"\nActual output: "${result.details.actual}"`;
                case 'output_contains':
                    return `Output should contain: "${result.details.expected}"`;
                case 'code_contains':
                    return `Code should contain: "${result.details.expected}"`;
                case 'code_pattern':
                    return `Code should match pattern: ${result.details.expected}`;
                case 'compiles':
                    return 'Code has compilation errors';
                case 'no_runtime_error':
                    return 'Code has runtime errors';
                default:
                    return result.details.expected ?? 'Validation failed';
            }
        }

        return 'Validation failed';
    }
}

export default SolutionValidator;
