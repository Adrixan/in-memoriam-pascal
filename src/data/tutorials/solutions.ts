/**
 * Solution code for each tutorial level
 * 
 * Contains the correct solutions that pass all validation rules.
 * Used for reference and testing.
 */

/**
 * Maps level IDs to their correct solution code
 */
export const solutions: Record<string, string> = {
    'hello-world': `program HelloWorld;
begin
  WriteLn('Hello World!');
end.`,

    'variables': `program Variables;
var
  number: Integer;
begin
  number := 42;
  WriteLn('Value: ', number);
end.`,

    'simple-math': `program Math;
var
  a, b, sum: Integer;
begin
  a := 5;
  b := 3;
  sum := a + b;
  WriteLn(a, ' + ', b, ' = ', sum);
end.`,

    'strings': `program Strings;
var
  name: String;
begin
  name := 'Pascal';
  WriteLn('Hello, ', name, '!');
end.`,

    'input-output': `program InputOutput;
var
  name: String;
begin
  Write('Enter your name: ');
  ReadLn(name);
  WriteLn('Hello, ', name, '!');
end.`,

    'conditionals': `program Conditionals;
var
  number: Integer;
begin
  number := -5;
  if number >= 0 then
    WriteLn('Positive')
  else
    WriteLn('Negative');
end.`,

    'for-loop': `program ForLoop;
var
  i: Integer;
begin
  for i := 1 to 5 do
    WriteLn(i);
end.`,

    'while-loop': `program WhileLoop;
var
  count: Integer;
begin
  count := 5;
  while count > 0 do
  begin
    WriteLn(count);
    count := count - 1;
  end;
  WriteLn('Liftoff!');
end.`,

    'procedures': `program Procedures;

procedure Greet(name: String);
begin
  WriteLn('Hello, ', name, '!');
end;

begin
  Greet('World');
end.`,

    'functions': `program Functions;

function Square(n: Integer): Integer;
begin
  Square := n * n;
end;

var
  result: Integer;
begin
  result := Square(5);
  WriteLn('5 squared is ', result);
end.`,

    'file-io': `program FileIO;
var
  f: Text;
begin
  Assign(f, 'hello.txt');
  Rewrite(f);
  WriteLn(f, 'Hello World!');
  Close(f);
  WriteLn('File written: hello.txt');
end.`,

    'sets': `program Sets;
type
  TNumberSet = set of 1..10;
var
  primes, numbers: TNumberSet;
begin
  primes := [2, 3, 5, 7];
  numbers := [1..10];
  if 5 in primes then
    WriteLn('5 is prime');
  if primes <= numbers then
    WriteLn('Primes subset of numbers');
end.`,

    'pointers': `program Pointers;
var
  p: ^Integer;
begin
  New(p);
  p^ := 42;
  WriteLn('Value: ', p^);
  Dispose(p);
end.`,

    'advanced-records': `program AdvancedRecords;
type
  TDate = record
    day: Integer;
    month: Integer;
    year: Integer;
  end;
  TEvent = record
    name: String;
    date: TDate;
  end;
var
  event: TEvent;
begin
  event.name := 'New Year';
  event.date.day := 1;
  event.date.month := 1;
  event.date.year := 2025;
  WriteLn(event.name, ': ', event.date.day, '/', event.date.month, '/', event.date.year);
end.`,

    'unit-system': `program UnitSystem;
procedure Greet(name: String);
begin
  WriteLn('Hello, ', name, '!');
end;
procedure Farewell(name: String);
begin
  WriteLn('Goodbye, ', name, '!');
end;
begin
  Greet('World');
  Farewell('World');
end.`,
};

/**
 * Get the solution for a specific level
 */
export function getSolution(levelId: string): string | undefined {
    return solutions[levelId];
}

/**
 * Get all solutions
 */
export function getAllSolutions(): Record<string, string> {
    return { ...solutions };
}

export default solutions;
