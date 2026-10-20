// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { executeProgram, toCompileDiagnostic } from '@/engine/core';
import { tutorialLevels, solutions } from '@/data/tutorials';
import { createEngine } from './harness';
import { SolutionValidator } from '@/services/validation/SolutionValidator';

describe('tutorial solution contracts', () => {
    it('every level has a reference solution that passes its own validation', () => {
        const engine = createEngine();
        for (const level of tutorialLevels) {
            const code = solutions[level.id];
            expect(code, `${level.id} needs a reference solution`).toBeTruthy();

            let compiled: string;
            try {
                compiled = engine.compile(code!);
            } catch (error) {
                throw new Error(`${level.id} reference solution does not compile: ${toCompileDiagnostic(error, code!).message}`);
            }

            let output = '';
            const outcome = executeProgram(engine, compiled, (level.testInput ?? []).map((line) => `${line}\n`).join(''), (chunk) => {
                output += chunk;
            });
            const result = SolutionValidator.validateLevel(level, code!, {
                output: output.split('\n').filter((line, index, lines) => !(index === lines.length - 1 && line === '')),
                errors: outcome.kind === 'runtimeError' ? [outcome.error.message] : [],
                success: outcome.kind === 'finished',
                executionTime: 0,
            });
            expect(result.levelCompleted, `${level.id} failed: ${JSON.stringify(result)}`).toBe(true);
        }
    });
});
