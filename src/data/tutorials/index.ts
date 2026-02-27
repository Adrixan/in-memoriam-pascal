/**
 * Tutorial data index
 * Exports all tutorial levels, solutions, and validation utilities
 */

export { tutorialLevels, getLevelById, getLevelByNumber, getNextLevel, getPreviousLevel } from './levels';
export { solutions, getSolution, getAllSolutions } from './solutions';
export {
    ValidationPresets,
    validateOutput,
    validateCode,
    validateExecution,
    validateSolution,
    type ValidationResult,
    type ValidationDetails,
    type ValidationType,
    type ExtendedValidationRule,
} from './validation';

import { tutorialLevels } from './levels';

// Re-export tutorialLevels as default for backward compatibility
export default tutorialLevels;
