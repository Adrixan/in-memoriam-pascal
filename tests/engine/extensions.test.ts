// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { expectOutput, runPascal } from './harness';

const lines = (source: string, input?: string): string[] => {
    const out = expectOutput(source, input === undefined ? {} : { input });
    return out.split('\n').slice(0, -1);
};

describe('pointers', () => {
    it('allocates, assigns through and frees an integer pointer', () => {
        expect(
            lines(`program P; var p: ^Integer;
                begin New(p); p^ := 42; WriteLn('Value: ', p^); p^ := p^ + 1; WriteLn(p^); Dispose(p); end.`),
        ).toEqual(['Value: 42', '43']);
    });

    it('builds a linked list with records and forward pointer types', () => {
        const out = lines(`program P;
            type
              PNode = ^TNode;
              TNode = record
                value: Integer;
                next: PNode;
              end;
            var head, cur: PNode; i: Integer;
            begin
              head := nil;
              for i := 3 downto 1 do begin
                New(cur);
                cur^.value := i * 10;
                cur^.next := head;
                head := cur;
              end;
              cur := head;
              while cur <> nil do begin
                WriteLn(cur^.value);
                cur := cur^.next;
              end;
            end.`);
        expect(out).toEqual(['10', '20', '30']);
    });

    it('supports chained access like head^.next^.value', () => {
        const out = lines(`program P;
            type PNode = ^TNode; TNode = record value: Integer; next: PNode; end;
            var head: PNode;
            begin
              New(head); head^.value := 10; head^.next := nil;
              New(head^.next); head^.next^.value := 20; head^.next^.next := nil;
              WriteLn('Node 1: ', head^.value);
              WriteLn('Node 2: ', head^.next^.value);
            end.`);
        expect(out).toEqual(['Node 1: 10', 'Node 2: 20']);
    });

    it('stops with a run time error on a nil dereference', () => {
        const r = runPascal(`program P; var p: ^Integer; begin p := nil; p^ := 1; end.`);
        expect(r.outcome).toMatchObject({ kind: 'runtimeError', error: { code: 204 } });
    });
});

describe('sets', () => {
    it('handles membership, union, intersection and difference', () => {
        const out = lines(`program P;
            type TSet = set of 1..10;
            var a, b, c: TSet; i: Integer;
            begin
              a := [1, 2, 3, 4]; b := [3..6];
              c := a + b;
              for i := 1 to 10 do if i in c then Write(i, ' ');
              WriteLn;
              c := a * b;
              for i := 1 to 10 do if i in c then Write(i, ' ');
              WriteLn;
              c := a - b;
              for i := 1 to 10 do if i in c then Write(i, ' ');
              WriteLn;
            end.`);
        expect(out).toEqual(['1 2 3 4 5 6 ', '3 4 ', '1 2 ']);
    });

    it('compares sets', () => {
        const out = lines(`program P;
            var a, b: set of 0..9;
            begin
              a := [2, 4]; b := [0..9];
              if a <= b then WriteLn('subset');
              if b >= a then WriteLn('superset');
              if a = [2, 4] then WriteLn('equal');
              if a <> b then WriteLn('different');
              if not (7 in a) then WriteLn('7 missing');
            end.`);
        expect(out).toEqual(['subset', 'superset', 'equal', 'different', '7 missing']);
    });

    it('works with characters and Include/Exclude', () => {
        const out = lines(`program P;
            var vowels: set of Char; ch: Char; s: String; i, n: Integer;
            begin
              vowels := ['a', 'e', 'i', 'o', 'u'];
              Include(vowels, 'y'); Exclude(vowels, 'a');
              s := 'banana';
              n := 0;
              for i := 1 to Length(s) do if s[i] in vowels then n := n + 1;
              WriteLn(n);
              if 'a' in vowels then WriteLn('a is a vowel') else WriteLn('a removed');
            end.`);
        expect(out).toEqual(['0', 'a removed']);
    });

    it('uses a set of characters in a condition', () => {
        const out = lines(`program P; var c: Char; begin c := 'k';
            if c in ['a'..'z'] then WriteLn('lower'); end.`);
        expect(out).toEqual(['lower']);
    });
});

describe('text files', () => {
    it('writes a file and reads it back', () => {
        const out = lines(`program P;
            var f: Text; line: String;
            begin
              Assign(f, 'data.txt');
              Rewrite(f);
              WriteLn(f, 'Hello from Pascal!');
              WriteLn(f, 'second line');
              Close(f);
              Reset(f);
              while not Eof(f) do begin
                ReadLn(f, line);
                WriteLn('Read: ', line);
              end;
              Close(f);
            end.`);
        expect(out).toEqual(['Read: Hello from Pascal!', 'Read: second line']);
    });

    it('stores numbers in files and appends', () => {
        const out = lines(`program P;
            var f: Text; n, sum: Integer;
            begin
              Assign(f, 'numbers.txt');
              Rewrite(f);
              WriteLn(f, 10); WriteLn(f, 20);
              Close(f);
              Append(f); WriteLn(f, 30); Close(f);
              Reset(f); sum := 0;
              while not Eof(f) do begin ReadLn(f, n); sum := sum + n; end;
              Close(f);
              WriteLn('Sum: ', sum);
            end.`);
        expect(out).toEqual(['Sum: 60']);
    });

    it('reports a missing file', () => {
        const r = runPascal(`program P; var f: Text; begin Assign(f, 'missing.txt'); Reset(f); end.`);
        expect(r.outcome).toMatchObject({ kind: 'runtimeError', error: { code: 2 } });
    });
});

describe('records', () => {
    it('supports nested records and with statements', () => {
        const out = lines(`program P;
            type
              TDate = record day, month, year: Integer; end;
              TEvent = record name: String; date: TDate; end;
            var e: TEvent;
            begin
              e.name := 'New Year';
              e.date.day := 1; e.date.month := 1; e.date.year := 2025;
              WriteLn(e.name, ': ', e.date.day, '/', e.date.month, '/', e.date.year);
              with e do begin
                name := 'Changed';
                with date do year := 2030;
              end;
              WriteLn(e.name, ' ', e.date.year);
            end.`);
        expect(out).toEqual(['New Year: 1/1/2025', 'Changed 2030']);
    });

    it('copies records and arrays of records', () => {
        const out = lines(`program P;
            type TP = record x, y: Integer; end;
            var a, b: TP; list: array[1..2] of TP;
            begin
              a.x := 1; a.y := 2; b := a; b.x := 9;
              list[1] := a; list[2] := b;
              WriteLn(a.x, ' ', b.x, ' ', list[1].x, ' ', list[2].x);
            end.`);
        expect(out).toEqual(['1 9 1 9']);
    });

    it('supports variant records', () => {
        const out = lines(`program P;
            type
              Kind = (Circle, Rect);
              TShape = record
                name: String;
                case k: Kind of
                  Circle: (radius: Integer);
                  Rect: (w, h: Integer);
              end;
            var s: TShape;
            begin
              s.name := 'box'; s.k := Rect; s.w := 3; s.h := 4;
              WriteLn(s.name, ' ', s.w * s.h);
              s.k := Circle; s.radius := 5;
              WriteLn(s.radius);
            end.`);
        expect(out).toEqual(['box 12', '5']);
    });
});

describe('units', () => {
    it('uses a unit defined in the same source', () => {
        const out = lines(`unit MathUtils;
            interface
            function Square(x: Integer): Integer;
            procedure Greet(name: String);
            var counter: Integer;
            implementation
            function Square(x: Integer): Integer;
            begin Square := x * x; end;
            procedure Greet(name: String);
            begin counter := counter + 1; WriteLn('Hello, ', name, '!'); end;
            begin counter := 100; end.

            program UnitDemo;
            uses MathUtils;
            begin
              Greet('World');
              WriteLn(Square(7));
              WriteLn(MathUtils.Square(3));
              WriteLn(counter);
            end.`);
        expect(out).toEqual(['Hello, World!', '49', '9', '101']);
    });

    it('complains about unimplemented interface routines', () => {
        const r = runPascal(`unit U; interface procedure Missing; implementation end.
            program P; uses U; begin end.`);
        expect(r.compileError?.message).toMatch(/not implemented/);
    });
});
