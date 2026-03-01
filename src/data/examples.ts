/**
 * Code Examples Gallery Data
 * 
 * Pre-loaded Pascal examples for users to explore
 */

export interface CodeExample {
    id: string;
    titleKey: string;
    descriptionKey: string;
    code: string;
    category: 'basic' | 'algorithms' | 'data-structures' | 'file-io';
}

export const codeExamples: CodeExample[] = [
    {
        id: 'hello-world',
        titleKey: 'examples.helloWorld.title',
        descriptionKey: 'examples.helloWorld.description',
        category: 'basic',
        code: `program HelloWorld;
begin
  WriteLn('Hello World!');
end.`,
    },
    {
        id: 'basic-calculations',
        titleKey: 'examples.basicCalculations.title',
        descriptionKey: 'examples.basicCalculations.description',
        category: 'basic',
        code: `program BasicCalculations;
var
  a, b, sum, diff, product: Integer;
begin
  a := 10;
  b := 5;
  
  sum := a + b;
  diff := a - b;
  product := a * b;
  
  WriteLn('Sum: ', sum);
  WriteLn('Difference: ', diff);
  WriteLn('Product: ', product);
end.`,
    },
    {
        id: 'array-manipulation',
        titleKey: 'examples.arrayManipulation.title',
        descriptionKey: 'examples.arrayManipulation.description',
        category: 'data-structures',
        code: `program ArrayManipulation;
var
  numbers: array[1..5] of Integer;
  i: Integer;
begin
  { Initialize array }
  numbers[1] := 10;
  numbers[2] := 20;
  numbers[3] := 30;
  numbers[4] := 40;
  numbers[5] := 50;
  
  { Print array elements }
  for i := 1 to 5 do
    WriteLn('Element ', i, ': ', numbers[i]);
end.`,
    },
    {
        id: 'record-usage',
        titleKey: 'examples.recordUsage.title',
        descriptionKey: 'examples.recordUsage.description',
        category: 'data-structures',
        code: `program RecordUsage;
type
  TPerson = record
    name: String;
    age: Integer;
    city: String;
  end;

var
  person: TPerson;
begin
  person.name := 'Alice';
  person.age := 30;
  person.city := 'Berlin';
  
  WriteLn('Name: ', person.name);
  WriteLn('Age: ', person.age);
  WriteLn('City: ', person.city);
end.`,
    },
    {
        id: 'hailstone',
        titleKey: 'examples.hailstone.title',
        descriptionKey: 'examples.hailstone.description',
        category: 'algorithms',
        code: `Program Hailstone;

function Hail(N: Integer): Integer;
var
  cnt: Integer;
begin
  cnt := 0;
  while N <> 1 do
  begin
    if Odd(N) then
      N := (3 * N) + 1
    else
      N := N div 2;
    Write(N, ', ');
    cnt := cnt + 1;
  end;
  Hail := cnt;
end;

var
  X, steps: Integer;

begin
  X := 27;
  Write('Hailstone sequence for ', X, ': ');
  steps := Hail(X);
  WriteLn();
  WriteLn('Steps: ', steps);
end.`,
    },
    {
        id: 'fibonacci',
        titleKey: 'examples.fibonacci.title',
        descriptionKey: 'examples.fibonacci.description',
        category: 'algorithms',
        code: `program Fibonacci;
var
  n, a, b, c, i: Integer;
begin
  n := 10;
  a := 0;
  b := 1;
  
  WriteLn('Fibonacci sequence:');
  WriteLn(a);
  WriteLn(b);
  
  for i := 3 to n do
  begin
    c := a + b;
    WriteLn(c);
    a := b;
    b := c;
  end;
end.`,
    },
    {
        id: 'bubble-sort',
        titleKey: 'examples.bubbleSort.title',
        descriptionKey: 'examples.bubbleSort.description',
        category: 'algorithms',
        code: `program BubbleSort;
var
  arr: array[1..6] of Integer;
  i, j, temp: Integer;
begin
  { Initialize unsorted array }
  arr[1] := 64;
  arr[2] := 34;
  arr[3] := 25;
  arr[4] := 12;
  arr[5] := 22;
  arr[6] := 11;
  
  { Bubble sort }
  for i := 1 to 5 do
    for j := 1 to 6 - i do
      if arr[j] > arr[j + 1] then
      begin
        temp := arr[j];
        arr[j] := arr[j + 1];
        arr[j + 1] := temp;
      end;
  
  { Print sorted array }
  WriteLn('Sorted array:');
  for i := 1 to 6 do
    WriteLn(arr[i]);
end.`,
    },
    {
        id: 'prime-check',
        titleKey: 'examples.primeCheck.title',
        descriptionKey: 'examples.primeCheck.description',
        category: 'algorithms',
        code: `program PrimeCheck;
var
  n, i: Integer;
  isPrime: Boolean;
begin
  n := 17;
  isPrime := true;
  
  if n <= 1 then
    isPrime := false
  else
    for i := 2 to n - 1 do
      if n mod i = 0 then
      begin
        isPrime := false;
        break;
      end;
  
  if isPrime then
    WriteLn(n, ' is a prime number')
  else
    WriteLn(n, ' is not a prime number');
end.`,
    },
];

/**
 * Get example by ID
 */
export function getExampleById(id: string): CodeExample | undefined {
    return codeExamples.find((example) => example.id === id);
}

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: CodeExample['category']): CodeExample[] {
    return codeExamples.filter((example) => example.category === category);
}

export default codeExamples;
