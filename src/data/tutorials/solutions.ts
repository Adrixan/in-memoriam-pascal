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
