// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { expectOutput, runPascal } from './harness';

describe('engine basics', () => {
    it('runs a program that writes output', () => {
        expect(expectOutput(`program P; begin WriteLn('Hello World!'); end.`)).toBe('Hello World!\n');
    });

    it('reports a syntax error with the right line', () => {
        const result = runPascal(`program P;\nbegin\n  WriteLn('a')\n  WriteLn('b');\nend.\n`);
        expect(result.compileError?.kind).toBe('syntax');
        expect(result.compileError?.line).toBe(4);
    });

    it('reads integers from stdin', () => {
        const source = `program P; var a, b: Integer; begin ReadLn(a); ReadLn(b); WriteLn(a + b); end.`;
        expect(expectOutput(source, { input: '3\n4\n' })).toBe('7\n');
    });

    it('asks for more input instead of reading past the end', () => {
        const source = `program P; var a: Integer; begin Write('n: '); ReadLn(a); WriteLn(a); end.`;
        const result = runPascal(source, { input: '' });
        expect(result.outcome).toEqual({ kind: 'needInput' });
        expect(result.output).toBe('n: ');
    });
});
