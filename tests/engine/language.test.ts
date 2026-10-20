// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { expectOutput, runPascal } from './harness';

const lines = (source: string, input?: string): string[] => {
    const out = expectOutput(source, input === undefined ? {} : { input });
    return out.split('\n').slice(0, -1);
};

describe('expressions and formatting', () => {
    it('does integer arithmetic with signed div and mod', () => {
        expect(
            lines(`program P; begin WriteLn(7 div 2, ' ', -7 div 2, ' ', 7 mod 3, ' ', -7 mod 3); end.`),
        ).toEqual(['3 -3 1 -1']);
    });

    it('compares and prints reals', () => {
        const out = lines(`program P; var x: Real; begin x := 2.5;
            if x > 2 then WriteLn('gt');
            if x < 3.5 then WriteLn('lt');
            WriteLn(x * 2:0:2); WriteLn(10 / 4:6:1); end.`);
        expect(out).toEqual(['gt', 'lt', '5.00', '   2.5']);
    });

    it('supports field widths for integers and strings', () => {
        expect(lines(`program P; begin WriteLn(42:6, '|', 'ab':4, '|'); end.`)).toEqual(['    42|  ab|']);
    });

    it('compares strings by content', () => {
        const out = lines(`program P; var a, b: String; begin a := 'abc'; b := 'abc';
            if a = b then WriteLn('equal'); if a <> 'xyz' then WriteLn('different');
            if a < 'b' then WriteLn('less'); end.`);
        expect(out).toEqual(['equal', 'different', 'less']);
    });

    it('assigns a character to a string and concatenates', () => {
        expect(lines(`program P; var s: String; begin s := 'a'; s := s + 'b' + 'c'; WriteLn(s); end.`)).toEqual(['abc']);
    });

    it('provides standard routines', () => {
        const out = lines(`program P; var s: String;
            begin s := 'Hello';
              WriteLn(Length(s), ' ', Abs(-5), ' ', Sqr(4), ' ', Round(2.5), ' ', Trunc(2.9));
              WriteLn(UpCase('a'), ' ', Copy(s, 2, 3), ' ', Pos('ll', s), ' ', Odd(3));
              WriteLn(Succ(5), ' ', Pred(5));
            end.`);
        expect(out).toEqual(['5 5 16 3 2', 'A ell 3 TRUE', '6 4']);
    });

    it('increments and decrements', () => {
        expect(lines(`program P; var i: Integer; begin i := 5; Inc(i); Inc(i, 3); Dec(i); WriteLn(i); end.`)).toEqual(['8']);
    });
});

describe('control flow', () => {
    it('loops over characters and uses case with characters and enums', () => {
        const out = lines(`program P;
            type Color = (Red, Green, Blue);
            var c: Char; k: Color;
            begin
              for c := 'a' to 'c' do Write(c);
              WriteLn;
              for k := Red to Blue do
                case k of
                  Red: Write('R');
                  Green: Write('G');
                  Blue: Write('B');
                end;
              WriteLn;
              case 'x' of 'a'..'m': WriteLn('first half'); 'n'..'z': WriteLn('second half'); end;
            end.`);
        expect(out).toEqual(['abc', 'RGB', 'second half']);
    });

    it('counts down and supports repeat/while', () => {
        const out = lines(`program P; var i, n: Integer;
            begin
              for i := 3 downto 1 do Write(i, ' ');
              WriteLn;
              n := 0; repeat n := n + 2 until n >= 5; WriteLn(n);
              while n > 0 do n := n - 3;
              WriteLn(n);
            end.`);
        expect(out).toEqual(['3 2 1 ', '6', '0']);
    });
});

describe('runtime checks', () => {
    it('reports division by zero with the line', () => {
        const r = runPascal(`program P;\nvar a, b: Integer;\nbegin\n  b := 0;\n  a := 10 div b;\nend.\n`);
        expect(r.outcome).toMatchObject({ kind: 'runtimeError', error: { code: 200, line: 5 } });
    });

    it('checks array bounds', () => {
        const r = runPascal(`program P; var a: array[1..3] of Integer; i: Integer;
            begin i := 7; a[i] := 1; end.`);
        expect(r.outcome).toMatchObject({ kind: 'runtimeError', error: { code: 201 } });
    });

    it('rejects malformed numeric input', () => {
        const r = runPascal(`program P; var a: Integer; begin ReadLn(a); end.`, { input: 'abc\n' });
        expect(r.outcome).toMatchObject({ kind: 'runtimeError', error: { code: 106 } });
    });
});

describe('input', () => {
    it('reads strings, numbers and reals line by line', () => {
        const out = lines(
            `program P; var n: String; a: Integer; r: Real;
             begin ReadLn(n); ReadLn(a); ReadLn(r); WriteLn(n, ':', a, ':', r:0:1); end.`,
            'Anna Lee\n42\n2.5\n',
        );
        expect(out).toEqual(['Anna Lee:42:2.5']);
    });

    it('reads several values from one line', () => {
        expect(lines(`program P; var a, b: Integer; begin ReadLn(a, b); WriteLn(a * b); end.`, '6 7\n')).toEqual(['42']);
    });

    it('reads a character', () => {
        expect(lines(`program P; var c: Char; begin Read(c); WriteLn(c); end.`, 'x\n')).toEqual(['x']);
    });
});

describe('exit and case else', () => {
    it('leaves procedures and the program with Exit', () => {
        const out = lines(`program P;
            procedure Check(n: Integer);
            begin
              if n < 0 then begin WriteLn('negative'); Exit; end;
              WriteLn('ok');
            end;
            begin
              Check(-1); Check(1);
              WriteLn('before');
              Exit;
              WriteLn('after');
            end.`);
        expect(out).toEqual(['negative', 'ok', 'before']);
    });

    it('supports else in a case statement', () => {
        const out = lines(`program P; var n: Integer;
            begin
              for n := 1 to 3 do
                case n of
                  1: WriteLn('one');
                  2: WriteLn('two')
                else WriteLn('many');
                end;
            end.`);
        expect(out).toEqual(['one', 'two', 'many']);
    });

    it('names the program and a variable alike', () => {
        const out = lines(`program Counter; var counter: Integer;
            begin counter := 3; WriteLn(counter); end.`);
        expect(out).toEqual(['3']);
    });
});
