/**
 * Unit tests for cn utility function
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils/cn';

describe('cn', () => {
    describe('basic functionality', () => {
        it('should return empty string when no arguments provided', () => {
            expect(cn()).toBe('');
        });

        it('should join multiple class names with space', () => {
            expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
        });

        it('should return single class name unchanged', () => {
            expect(cn('single')).toBe('single');
        });
    });

    describe('filtering falsy values', () => {
        it('should filter out undefined values', () => {
            expect(cn('foo', undefined, 'bar')).toBe('foo bar');
        });

        it('should filter out null values', () => {
            expect(cn('foo', null, 'bar')).toBe('foo bar');
        });

        it('should filter out false values', () => {
            expect(cn('foo', false, 'bar')).toBe('foo bar');
        });

        it('should filter out all falsy values', () => {
            expect(cn(undefined, null, false)).toBe('');
        });

        it('should handle mixed truthy and falsy values', () => {
            expect(cn('a', undefined, 'b', null, 'c', false, 'd')).toBe('a b c d');
        });
    });

    describe('edge cases', () => {
        it('should handle empty strings', () => {
            // Note: empty string is falsy in JavaScript but Boolean('') is false
            // However, the filter(Boolean) will filter it out
            expect(cn('', 'foo', '')).toBe('foo');
        });

        it('should handle strings with spaces', () => {
            expect(cn('foo bar', 'baz')).toBe('foo bar baz');
        });

        it('should preserve whitespace in class names', () => {
            // cn joins with single space, so '  foo  ' + 'bar' = '  foo   bar'
            // (2 trailing spaces from 'foo  ' + 1 space from join = 3 spaces)
            expect(cn('  foo  ', 'bar')).toBe('  foo   bar');
        });
    });

    describe('type safety', () => {
        it('should accept string arguments', () => {
            const result: string = cn('a', 'b');
            expect(result).toBe('a b');
        });

        it('should accept mixed ClassValue types', () => {
            // Testing that the function accepts the union type
            const mixed: (string | undefined | null | false)[] = [
                'a',
                undefined,
                'b',
                null,
                'c',
                false,
            ];
            expect(cn(...mixed)).toBe('a b c');
        });
    });
});
