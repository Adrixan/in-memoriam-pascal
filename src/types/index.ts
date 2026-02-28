/**
 * Core type definitions for In Memoriam Pascal
 */

// ============================================
// Tutorial Types
// ============================================

export interface TutorialLevel {
    /** Unique identifier for the level */
    id: string;

    /** Level number for ordering */
    number: number;

    /** Difficulty track classification */
    track: 'basic' | 'beginner' | 'intermediate' | 'advanced';

    /** i18n key for level title */
    titleKey: string;

    /** i18n key for level description */
    descriptionKey: string;

    /** i18n key for task description - explains what program to write */
    taskDescriptionKey?: string;

    /** Learning objectives (i18n keys) */
    objectives: string[];

    /** Concept explanations with i18n keys */
    concepts: ConceptExplanation[];

    /** Code examples */
    examples: CodeExample[];

    /** Initial code template shown in editor */
    starterCode: string;

    /** Expected output for validation */
    expectedOutput?: string;

    /** Test input for validation (fed to ReadLn/Read) */
    testInput?: string[];

    /** Validation rules */
    validation: ValidationRule[];

    /** Available hints */
    hints: Hint[];

    /** Estimated completion time in minutes */
    estimatedTime: number;

    /** Prerequisites (level IDs) */
    prerequisites: string[];
}

export interface ConceptExplanation {
    /** i18n key for concept title */
    titleKey: string;

    /** i18n key for concept content */
    contentKey: string;

    /** Optional code illustration */
    codeExample?: string;
}

export interface CodeExample {
    /** Pascal code snippet */
    code: string;

    /** i18n key for explanation */
    explanationKey: string;

    /** Whether code is editable */
    editable: boolean;
}

export interface ValidationRule {
    type: 'output_match' | 'contains_keyword' | 'compiles' | 'custom';

    /** Rule-specific configuration */
    config: Record<string, unknown>;

    /** i18n key for error message */
    errorKey: string;
}

export interface Hint {
    /** Unique identifier for the hint */
    id?: string;

    /** Level ID this hint belongs to */
    levelId?: string;

    /** Hint level (1 = gentle, 3 = explicit) */
    level: 1 | 2 | 3;

    /** Order for display (same as level for backward compatibility) */
    order?: number;

    /** Type of hint for styling */
    type?: 'gentle' | 'specific' | 'detailed';

    /** i18n key for hint title */
    titleKey?: string;

    /** i18n key for hint content */
    contentKey: string;

    /** Optional code example to show */
    codeExample?: string;

    /** Error types this hint helps with */
    errorTypes?: string[];

    /** Points cost for using this hint */
    cost: number;
}

// ============================================
// Progress Types
// ============================================

export interface UserProgress {
    /** Unique user ID (generated locally) */
    userId: string;

    /** Creation timestamp */
    createdAt: string;

    /** Last activity timestamp */
    lastActiveAt: string;

    /** Per-level progress */
    levels: Record<string, LevelProgress>;

    /** Overall statistics */
    statistics: ProgressStatistics;

    /** User settings */
    settings: UserSettings;
}

export interface LevelProgress {
    /** Level ID */
    levelId: string;

    /** Completion status */
    status: 'not_started' | 'in_progress' | 'completed';

    /** User's saved code */
    savedCode: string;

    /** Number of attempts */
    attempts: number;

    /** Hints used */
    hintsUsed: number[];

    /** Best execution time (ms) */
    bestExecutionTime?: number;

    /** First completion timestamp */
    completedAt?: string;

    /** Last attempt timestamp */
    lastAttemptAt: string;
}

export interface ProgressStatistics {
    /** Total levels completed */
    completedLevels: number;

    /** Total code executions */
    totalExecutions: number;

    /** Total time spent (minutes) */
    totalTimeSpent: number;

    /** Current streak (days) */
    currentStreak: number;

    /** Longest streak (days) */
    longestStreak: number;
}

export interface UserSettings {
    /** Editor font size */
    fontSize: number;

    /** Editor theme */
    theme: 'retro-green' | 'retro-amber' | 'retro-cyan';

    /** Sound effects enabled */
    soundEnabled: boolean;

    /** Reduced motion preference */
    reducedMotion: boolean;

    /** Language preference */
    language: 'de';
}

// ============================================
// Interpreter Types
// ============================================

export interface InterpreterState {
    /** Current execution status */
    status: 'idle' | 'running' | 'success' | 'error';

    /** Output lines */
    output: OutputLine[];

    /** Error information */
    error: InterpreterError | undefined;

    /** Execution time in milliseconds */
    executionTime: number | undefined;

    /** Whether the interpreter is waiting for user input */
    isWaitingForInput: boolean;
}

export interface OutputLine {
    /** Line content */
    content: string;

    /** Line type */
    type: 'output' | 'error' | 'info';

    /** Timestamp */
    timestamp: number;
}

export interface InterpreterError {
    /** Error message */
    message: string;

    /** Line number (1-based) */
    line?: number;

    /** Column number (1-based) */
    column?: number;

    /** Error type */
    type: 'syntax' | 'runtime' | 'compilation';
}

// ============================================
// Editor Types
// ============================================

export interface EditorState {
    /** Current code content */
    code: string;

    /** Current level ID */
    currentLevelId: string | null;

    /** Editor is ready */
    isReady: boolean;

    /** Cursor position */
    cursorPosition: {
        line: number;
        column: number;
    };
}

// ============================================
// Hint System Types
// ============================================

export interface HintState {
    /** Current level ID */
    levelId: string;

    /** Hints already revealed */
    revealedHints: number[];

    /** Total hint points available */
    totalPoints: number;

    /** Points remaining */
    remainingPoints: number;
}

export interface HintConfig {
    /** Points awarded per level completion */
    completionBonus: number;

    /** Points per hint level */
    hintCosts: {
        1: number;  // Gentle hint
        2: number;  // Moderate hint
        3: number;  // Explicit hint
    };
}

// ============================================
// IndexedDB Schema Types
// ============================================

export interface CodeSnapshot {
    levelId: string;
    timestamp: string;
    code: string;
    output?: string;
}

export interface DBSchema {
    progress: {
        key: string;
        value: UserProgress;
        indexes: {
            'by-lastActive': string;
        };
    };
    codeSnapshots: {
        key: [string, string];
        value: CodeSnapshot;
        indexes: {
            'by-level': string;
        };
    };
    tutorials: {
        key: string;
        value: TutorialLevel;
    };
    appState: {
        key: string;
        value: unknown;
    };
}
