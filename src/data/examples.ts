/**
 * Code Examples Gallery Data
 * 
 * Pre-loaded Pascal examples for users to explore
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CodeExample {
  id: string;
  titleKey: string;
  descriptionKey: string;
  title: string;
  description: string;
  code: string;
  expectedOutput: string;
  category: 'basic' | 'control-structures' | 'procedures-functions' | 'data-structures' | 'strings' | 'algorithms';
  difficulty: DifficultyLevel;
}

export const codeExamples: CodeExample[] = [
  // ============ BASIC EXAMPLES ============
  {
    id: 'hello-world',
    titleKey: 'examples.helloWorld.title',
    descriptionKey: 'examples.helloWorld.description',
    title: 'Hello World',
    description: 'A simple program that outputs "Hello World!" to the console. This is the traditional first program when learning a new language.',
    category: 'basic',
    difficulty: 'beginner',
    code: `program HelloWorld;
begin
  WriteLn('Hello World!');
end.`,
    expectedOutput: 'Hello World!',
  },
  {
    id: 'basic-calculations',
    titleKey: 'examples.basicCalculations.title',
    descriptionKey: 'examples.basicCalculations.description',
    title: 'Basic Calculations',
    description: 'Demonstrates variable declaration and basic arithmetic operations (addition, subtraction, multiplication).',
    category: 'basic',
    difficulty: 'beginner',
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
    expectedOutput: 'Sum: 15\nDifference: 5\nProduct: 50',
  },
  {
    id: 'variables-and-types',
    titleKey: 'examples.variablesAndTypes.title',
    descriptionKey: 'examples.variablesAndTypes.description',
    title: 'Variables and Data Types',
    description: 'Demonstrates different Pascal data types: Integer, Real, Boolean, Char, and String.',
    category: 'basic',
    difficulty: 'beginner',
    code: `program VariablesAndTypes;
var
  age: Integer;
  price: Real;
  isStudent: Boolean;
  grade: Char;
  name: String;
begin
  age := 25;
  price := 19.99;
  isStudent := true;
  grade := 'A';
  name := 'Pascal';
  
  WriteLn('Name: ', name);
  WriteLn('Age: ', age);
  WriteLn('Price: ', price:0:2);
  WriteLn('Is Student: ', isStudent);
  WriteLn('Grade: ', grade);
end.`,
    expectedOutput: 'Name: Pascal\nAge: 25\nPrice: 19.99\nIs Student: TRUE\nGrade: A',
  },
  // ============ CONTROL STRUCTURES ============
  {
    id: 'if-else-statement',
    titleKey: 'examples.ifElse.title',
    descriptionKey: 'examples.ifElse.description',
    title: 'If-Else Statement',
    description: 'Demonstrates conditional logic using if-then-else statements in Pascal.',
    category: 'control-structures',
    difficulty: 'beginner',
    code: `program IfElseExample;
var
  number: Integer;
begin
  number := 10;
  
  if number > 0 then
    WriteLn('Number is positive')
  else if number < 0 then
    WriteLn('Number is negative')
  else
    WriteLn('Number is zero');
    
  { Nested if example }
  if number > 0 then
  begin
    if number mod 2 = 0 then
      WriteLn('Number is positive and even')
    else
      WriteLn('Number is positive and odd');
  end;
end.`,
    expectedOutput: 'Number is positive\nNumber is positive and even',
  },
  {
    id: 'case-statement',
    titleKey: 'examples.caseStatement.title',
    descriptionKey: 'examples.caseStatement.description',
    title: 'Case Statement',
    description: 'Demonstrates the case statement for multi-way branching, including ranges and multiple values.',
    category: 'control-structures',
    difficulty: 'beginner',
    code: `program CaseExample;
var
  grade: Integer;
begin
  grade := 85;
  
  case grade of
    90..100: WriteLn('Grade: A - Excellent!');
    80..89:  WriteLn('Grade: B - Good job!');
    70..79:  WriteLn('Grade: C - Satisfactory');
    60..69:  WriteLn('Grade: D - Needs improvement');
    0..59:   WriteLn('Grade: F - Failed');
    otherwise WriteLn('Invalid grade');
  end;
  
  { Another case example with multiple values }
  WriteLn('');
  case grade div 10 of
    10, 9: WriteLn('A level');
    8:    WriteLn('B level');
    7:    WriteLn('C level');
    6:    WriteLn('D level');
    otherwise WriteLn('F level');
  end;
end.`,
    expectedOutput: 'Grade: B - Good job!\nB level',
  },
  {
    id: 'for-loop',
    titleKey: 'examples.forLoop.title',
    descriptionKey: 'examples.forLoop.description',
    title: 'For Loop',
    description: 'Demonstrates the for loop with both ascending and descending iterations.',
    category: 'control-structures',
    difficulty: 'beginner',
    code: `program ForLoopExample;
var
  i: Integer;
begin
  WriteLn('Counting up from 1 to 5:');
  for i := 1 to 5 do
    WriteLn(i);
    
  WriteLn('');
  WriteLn('Counting down from 5 to 1:');
  for i := 5 downto 1 do
    WriteLn(i);
    
  WriteLn('');
  WriteLn('Final value of i: ', i);
end.`,
    expectedOutput: 'Counting up from 1 to 5:\n1\n2\n3\n4\n5\n\nCounting down from 5 to 1:\n5\n4\n3\n2\n1\n\nFinal value of i: 0',
  },
  {
    id: 'while-loop',
    titleKey: 'examples.whileLoop.title',
    descriptionKey: 'examples.whileLoop.description',
    title: 'While Loop',
    description: 'Demonstrates the while loop for conditional iteration.',
    category: 'control-structures',
    difficulty: 'beginner',
    code: `program WhileLoopExample;
var
  i: Integer;
  sum: Integer;
begin
  i := 1;
  sum := 0;
  
  { Calculate sum of 1 to 10 }
  while i <= 10 do
  begin
    sum := sum + i;
    i := i + 1;
  end;
  
  WriteLn('Sum of 1 to 10: ', sum);
  WriteLn('Final i value: ', i);
end.`,
    expectedOutput: 'Sum of 1 to 10: 55\nFinal i value: 11',
  },
  {
    id: 'repeat-until',
    titleKey: 'examples.repeatUntil.title',
    descriptionKey: 'examples.repeatUntil.description',
    title: 'Repeat-Until Loop',
    description: 'Demonstrates the repeat-until loop, which executes at least once before checking the condition.',
    category: 'control-structures',
    difficulty: 'beginner',
    code: `program RepeatUntilExample;
var
  i: Integer;
  factorial: Integer;
begin
  i := 1;
  factorial := 1;
  
  { Calculate factorial of 5 }
  repeat
    factorial := factorial * i;
    i := i + 1;
  until i > 5;
  
  WriteLn('5! = ', factorial);
end.`,
    expectedOutput: '5! = 120',
  },
  // ============ PROCEDURES AND FUNCTIONS ============
  {
    id: 'simple-procedure',
    titleKey: 'examples.simpleProcedure.title',
    descriptionKey: 'examples.simpleProcedure.description',
    title: 'Simple Procedure',
    description: 'Demonstrates how to define and call a simple procedure in Pascal.',
    category: 'procedures-functions',
    difficulty: 'intermediate',
    code: `program SimpleProcedure;
procedure PrintHeader;
begin
  WriteLn('====================');
  WriteLn('   Pascal Program   ');
  WriteLn('====================');
  WriteLn('');
end;

procedure PrintMessage(msg: String);
begin
  WriteLn('Message: ', msg);
end;

begin
  PrintHeader;
  PrintMessage('Welcome to Pascal!');
  PrintMessage('Enjoy learning!');
end.`,
    expectedOutput: '====================\n   Pascal Program   \n====================\n\nMessage: Welcome to Pascal!\nMessage: Enjoy learning!',
  },
  {
    id: 'procedure-with-parameters',
    titleKey: 'examples.procedureWithParams.title',
    descriptionKey: 'examples.procedureWithParams.description',
    title: 'Procedure with Parameters',
    description: 'Demonstrates procedures with value parameters and local variables.',
    category: 'procedures-functions',
    difficulty: 'intermediate',
    code: `program ProcedureWithParams;
procedure AddNumbers(a, b: Integer);
var
  sum: Integer;
begin
  sum := a + b;
  WriteLn(a, ' + ', b, ' = ', sum);
end;

procedure SwapValues(x, y: Integer);
var
  temp: Integer;
begin
  WriteLn('Before swap: x=', x, ', y=', y);
  temp := x;
  x := y;
  y := temp;
  { Note: These changes won't affect the original variables }
  WriteLn('Inside procedure: x=', x, ', y=', y);
end;

var
  num1, num2: Integer;
begin
  AddNumbers(5, 3);
  WriteLn('');
  
  num1 := 10;
  num2 := 20;
  SwapValues(num1, num2);
  WriteLn('After call: num1=', num1, ', num2=', num2);
end.`,
    expectedOutput: '5 + 3 = 8\n\nBefore swap: x=10, y=20\nInside procedure: x=20, y=10\nAfter call: num1=10, num2=20',
  },
  {
    id: 'function-basics',
    titleKey: 'examples.functionBasics.title',
    descriptionKey: 'examples.functionBasics.description',
    title: 'Function Basics',
    description: 'Demonstrates how to define and use functions that return values.',
    category: 'procedures-functions',
    difficulty: 'intermediate',
    code: `program FunctionBasics;
function Square(n: Integer): Integer;
begin
  Square := n * n;
end;

function IsEven(n: Integer): Boolean;
begin
  IsEven := (n mod 2 = 0);
end;

function Max(a, b: Integer): Integer;
begin
  if a > b then
    Max := a
  else
    Max := b;
end;

var
  num: Integer;
begin
  num := 7;
  WriteLn('Square of ', num, ' is ', Square(num));
  
  WriteLn('Is ', num, ' even? ', IsEven(num));
  
  WriteLn('Max of 15 and 23 is ', Max(15, 23));
end.`,
    expectedOutput: 'Square of 7 is 49\nIs 7 even? FALSE\nMax of 15 and 23 is 23',
  },
  {
    id: 'recursive-function',
    titleKey: 'examples.recursiveFunction.title',
    descriptionKey: 'examples.recursiveFunction.description',
    title: 'Recursive Function',
    description: 'Demonstrates recursion with a factorial function.',
    category: 'procedures-functions',
    difficulty: 'intermediate',
    code: `program RecursiveFunction;
function Factorial(n: Integer): Integer;
begin
  if n <= 1 then
    Factorial := 1
  else
    Factorial := n * Factorial(n - 1);
end;

function Fibonacci(n: Integer): Integer;
begin
  if n <= 1 then
    Fibonacci := n
  else
    Fibonacci := Fibonacci(n - 1) + Fibonacci(n - 2);
end;

begin
  WriteLn('Factorial of 5: ', Factorial(5));
  WriteLn('Factorial of 10: ', Factorial(10));
  WriteLn('');
  WriteLn('Fibonacci sequence (first 10):');
  WriteLn('F(0)=', Fibonacci(0));
  WriteLn('F(1)=', Fibonacci(1));
  WriteLn('F(2)=', Fibonacci(2));
  WriteLn('F(3)=', Fibonacci(3));
  WriteLn('F(4)=', Fibonacci(4));
  WriteLn('F(5)=', Fibonacci(5));
  WriteLn('F(6)=', Fibonacci(6));
  WriteLn('F(7)=', Fibonacci(7));
  WriteLn('F(8)=', Fibonacci(8));
  WriteLn('F(9)=', Fibonacci(9));
end.`,
    expectedOutput: 'Factorial of 5: 120\nFactorial of 10: 3628800\n\nFibonacci sequence (first 10):\nF(0)=0\nF(1)=1\nF(2)=1\nF(3)=2\nF(4)=3\nF(5)=5\nF(6)=8\nF(7)=13\nF(8)=21\nF(9)=34',
  },
  {
    id: 'var-parameter',
    titleKey: 'examples.varParameter.title',
    descriptionKey: 'examples.varParameter.description',
    title: 'Variable Parameters (VAR)',
    description: 'Demonstrates how to use VAR parameters to allow procedures to modify the original variables.',
    category: 'procedures-functions',
    difficulty: 'intermediate',
    code: `program VarParameter;
procedure Swap(var x, y: Integer);
var
  temp: Integer;
begin
  temp := x;
  x := y;
  y := temp;
end;

procedure Increment(var count: Integer; amount: Integer);
begin
  count := count + amount;
end;

var
  a, b: Integer;
  counter: Integer;
begin
  a := 10;
  b := 20;
  WriteLn('Before swap: a=', a, ', b=', b);
  Swap(a, b);
  WriteLn('After swap: a=', a, ', b=', b);
  
  WriteLn('');
  counter := 5;
  Increment(counter, 3);
  WriteLn('After increment: counter=', counter);
end.`,
    expectedOutput: 'Before swap: a=10, b=20\nAfter swap: a=20, b=10\n\nAfter increment: counter=8',
  },
  // ============ DATA STRUCTURES ============
  {
    id: 'array-basics',
    titleKey: 'examples.arrayBasics.title',
    descriptionKey: 'examples.arrayBasics.description',
    title: 'Array Basics',
    description: 'Demonstrates declaring and using arrays in Pascal.',
    category: 'data-structures',
    difficulty: 'beginner',
    code: `program ArrayBasics;
var
  numbers: array[1..5] of Integer;
  i: Integer;
begin
  { Initialize array elements }
  numbers[1] := 10;
  numbers[2] := 20;
  numbers[3] := 30;
  numbers[4] := 40;
  numbers[5] := 50;
  
  { Access and display elements }
  WriteLn('Array elements:');
  for i := 1 to 5 do
    WriteLn('numbers[', i, '] = ', numbers[i]);
end.`,
    expectedOutput: 'Array elements:\nnumbers[1] = 10\nnumbers[2] = 20\nnumbers[3] = 30\nnumbers[4] = 40\nnumbers[5] = 50',
  },
  {
    id: 'array-manipulation',
    titleKey: 'examples.arrayManipulation.title',
    descriptionKey: 'examples.arrayManipulation.description',
    title: 'Array Manipulation',
    description: 'Demonstrates array operations: summing elements and finding maximum.',
    category: 'data-structures',
    difficulty: 'intermediate',
    code: `program ArrayManipulation;
var
  arr: array[1..6] of Integer;
  i, sum, max: Integer;
begin
  { Initialize array }
  arr[1] := 15;
  arr[2] := 27;
  arr[3] := 8;
  arr[4] := 42;
  arr[5] := 13;
  arr[6] := 31;
  
  { Calculate sum }
  sum := 0;
  for i := 1 to 6 do
    sum := sum + arr[i];
  WriteLn('Sum of elements: ', sum);
  
  { Find maximum }
  max := arr[1];
  for i := 2 to 6 do
    if arr[i] > max then
      max := arr[i];
  WriteLn('Maximum element: ', max);
end.`,
    expectedOutput: 'Sum of elements: 136\nMaximum element: 42',
  },
  {
    id: 'record-usage',
    titleKey: 'examples.recordUsage.title',
    descriptionKey: 'examples.recordUsage.description',
    title: 'Record Types',
    description: 'Demonstrates how to define and use record types in Pascal.',
    category: 'data-structures',
    difficulty: 'intermediate',
    code: `program RecordUsage;
type
  TPerson = record
    name: String;
    age: Integer;
    city: String;
    salary: Real;
  end;

var
  person: TPerson;
begin
  person.name := 'Alice';
  person.age := 30;
  person.city := 'Berlin';
  person.salary := 4500.50;
  
  WriteLn('Person Information:');
  WriteLn('Name: ', person.name);
  WriteLn('Age: ', person.age);
  WriteLn('City: ', person.city);
  WriteLn('Salary: ', person.salary:0:2);
end.`,
    expectedOutput: 'Person Information:\nName: Alice\nAge: 30\nCity: Berlin\nSalary: 4500.50',
  },
  {
    id: 'array-of-records',
    titleKey: 'examples.arrayOfRecords.title',
    descriptionKey: 'examples.arrayOfRecords.description',
    title: 'Array of Records',
    description: 'Demonstrates using arrays with record elements for more complex data structures.',
    category: 'data-structures',
    difficulty: 'intermediate',
    code: `program ArrayOfRecords;
type
  TStudent = record
    name: String;
    grade: Integer;
  end;

var
  students: array[1..3] of TStudent;
  i: Integer;
  total, average: Real;
begin
  { Initialize student records }
  students[1].name := 'Alice';
  students[1].grade := 95;
  
  students[2].name := 'Bob';
  students[2].grade := 87;
  
  students[3].name := 'Charlie';
  students[3].grade := 92;
  
  { Display students and calculate average }
  WriteLn('Student Grades:');
  total := 0;
  for i := 1 to 3 do
  begin
    WriteLn(students[i].name, ': ', students[i].grade);
    total := total + students[i].grade;
  end;
  
  average := total / 3;
  WriteLn('');
  WriteLn('Class Average: ', average:0:2);
end.`,
    expectedOutput: 'Student Grades:\nAlice: 95\nBob: 87\nCharlie: 92\n\nClass Average: 91.33',
  },
  // ============ STRINGS ============
  {
    id: 'string-basics',
    titleKey: 'examples.stringBasics.title',
    descriptionKey: 'examples.stringBasics.description',
    title: 'String Basics',
    description: 'Demonstrates basic string operations in Pascal.',
    category: 'strings',
    difficulty: 'beginner',
    code: `program StringBasics;
var
  str1, str2, result: String;
begin
  str1 := 'Hello';
  str2 := 'World';
  
  { String concatenation }
  result := str1 + ' ' + str2;
  WriteLn('Concatenation: ', result);
  
  { String assignment }
  result := 'Pascal Programming';
  WriteLn('String: ', result);
  
  { Using quotes in strings }
  WriteLn('Quoted text: ''This is in quotes''''');
end.`,
    expectedOutput: "Concatenation: Hello World\nString: Pascal Programming\nQuoted text: 'This is in quotes'",
  },
  {
    id: 'string-manipulation',
    titleKey: 'examples.stringManipulation.title',
    descriptionKey: 'examples.stringManipulation.description',
    title: 'String Manipulation',
    description: 'Demonstrates more advanced string operations and manipulation.',
    category: 'strings',
    difficulty: 'intermediate',
    code: `program StringManipulation;
var
  text: String;
  i, count: Integer;
begin
  text := 'Hello Pascal World';
  
  WriteLn('Original: ', text);
  WriteLn('Length: ', Length(text));
  
  { Count vowels }
  count := 0;
  for i := 1 to Length(text) do
  begin
    if (text[i] = 'a') or (text[i] = 'e') or (text[i] = 'i') or 
       (text[i] = 'o') or (text[i] = 'u') or (text[i] = 'A') or 
       (text[i] = 'E') or (text[i] = 'I') or (text[i] = 'O') or 
       (text[i] = 'U') then
      count := count + 1;
  end;
  
  WriteLn('Number of vowels: ', count);
end.`,
    expectedOutput: 'Original: Hello Pascal World\nLength: 18\nNumber of vowels: 5',
  },
  // ============ ALGORITHMS ============
  {
    id: 'bubble-sort',
    titleKey: 'examples.bubbleSort.title',
    descriptionKey: 'examples.bubbleSort.description',
    title: 'Bubble Sort',
    description: 'Demonstrates the bubble sort algorithm for sorting an array.',
    category: 'algorithms',
    difficulty: 'intermediate',
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
  
  WriteLn('Before sorting:');
  for i := 1 to 6 do
    Write(arr[i], ' ');
  WriteLn('');
  
  { Bubble sort algorithm }
  for i := 1 to 5 do
    for j := 1 to 6 - i do
      if arr[j] > arr[j + 1] then
      begin
        temp := arr[j];
        arr[j] := arr[j + 1];
        arr[j + 1] := temp;
      end;
  
  WriteLn('After sorting:');
  for i := 1 to 6 do
    Write(arr[i], ' ');
  WriteLn('');
end.`,
    expectedOutput: 'Before sorting:\n64 34 25 12 22 11 \nAfter sorting:\n11 12 22 25 34 64 ',
  },
  {
    id: 'linear-search',
    titleKey: 'examples.linearSearch.title',
    descriptionKey: 'examples.linearSearch.description',
    title: 'Linear Search',
    description: 'Demonstrates the linear search algorithm for finding an element in an array.',
    category: 'algorithms',
    difficulty: 'beginner',
    code: `program LinearSearch;
var
  arr: array[1..8] of Integer;
  target, i, position: Integer;
  found: Boolean;
begin
  { Initialize array }
  arr[1] := 23;
  arr[2] := 45;
  arr[3] := 12;
  arr[4] := 67;
  arr[5] := 89;
  arr[6] := 34;
  arr[7] := 56;
  arr[8] := 78;
  
  target := 34;
  found := false;
  position := -1;
  
  { Linear search }
  for i := 1 to 8 do
  begin
    if arr[i] = target then
    begin
      found := true;
      position := i;
      break;
    end;
  end;
  
  if found then
    WriteLn('Found ', target, ' at position ', position)
  else
    WriteLn(target, ' not found in the array');
    
  { Search for element not in array }
  target := 100;
  found := false;
  for i := 1 to 8 do
  begin
    if arr[i] = target then
    begin
      found := true;
      position := i;
    end;
  end;
  
  if found then
    WriteLn('Found ', target, ' at position ', position)
  else
    WriteLn(target, ' not found in the array');
end.`,
    expectedOutput: 'Found 34 at position 6\n100 not found in the array',
  },
  {
    id: 'binary-search',
    titleKey: 'examples.binarySearch.title',
    descriptionKey: 'examples.binarySearch.description',
    title: 'Binary Search',
    description: 'Demonstrates the binary search algorithm for finding an element in a sorted array.',
    category: 'algorithms',
    difficulty: 'advanced',
    code: `program BinarySearch;
var
  arr: array[1..10] of Integer;
  target, low, high, mid, position: Integer;
  found: Boolean;
begin
  { Initialize sorted array }
  arr[1] := 5;
  arr[2] := 12;
  arr[3] := 23;
  arr[4] := 34;
  arr[5] := 45;
  arr[6] := 56;
  arr[7] := 67;
  arr[8] := 78;
  arr[9] := 89;
  arr[10] := 100;
  
  target := 67;
  low := 1;
  high := 10;
  found := false;
  position := -1;
  
  { Binary search }
  while (low <= high) and (not found) do
  begin
    mid := (low + high) div 2;
    
    if arr[mid] = target then
    begin
      found := true;
      position := mid;
    end
    else if arr[mid] < target then
      low := mid + 1
    else
      high := mid - 1;
  end;
  
  if found then
    WriteLn('Found ', target, ' at position ', position)
  else
    WriteLn(target, ' not found in the array');
    
  { Search for element not in array }
  target := 50;
  low := 1;
  high := 10;
  found := false;
  while (low <= high) and (not found) do
  begin
    mid := (low + high) div 2;
    if arr[mid] = target then
      found := true
    else if arr[mid] < target then
      low := mid + 1
    else
      high := mid - 1;
  end;
  
  if found then
    WriteLn('Found ', target, ' at position ', mid)
  else
    WriteLn(target, ' not found in the array');
end.`,
    expectedOutput: 'Found 67 at position 7\n50 not found in the array',
  },
  {
    id: 'prime-check',
    titleKey: 'examples.primeCheck.title',
    descriptionKey: 'examples.primeCheck.description',
    title: 'Prime Number Check',
    description: 'Demonstrates checking if a number is prime using a simple algorithm.',
    category: 'algorithms',
    difficulty: 'beginner',
    code: `program PrimeCheck;
var
  n, i: Integer;
  isPrime: Boolean;
begin
  { Check multiple numbers }
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
    
  { Check another number }
  n := 15;
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
    expectedOutput: '17 is a prime number\n15 is not a prime number',
  },
  {
    id: 'hailstone',
    titleKey: 'examples.hailstone.title',
    descriptionKey: 'examples.hailstone.description',
    title: 'Hailstone Sequence',
    description: 'Demonstrates the famous Collatz (hailstone) sequence algorithm.',
    category: 'algorithms',
    difficulty: 'intermediate',
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
  X := 6;
  Write('Hailstone sequence for ', X, ': ');
  steps := Hail(X);
  WriteLn();
  WriteLn('Total steps: ', steps);
end.`,
    expectedOutput: 'Hailstone sequence for 6: 3, 10, 5, 16, 8, 4, 2, \nTotal steps: 7',
  },
  {
    id: 'fibonacci',
    titleKey: 'examples.fibonacci.title',
    descriptionKey: 'examples.fibonacci.description',
    title: 'Fibonacci Sequence',
    description: 'Demonstrates generating the Fibonacci sequence using iteration.',
    category: 'algorithms',
    difficulty: 'beginner',
    code: `program Fibonacci;
var
  n, a, b, c, i: Integer;
begin
  n := 10;
  a := 0;
  b := 1;
  
  WriteLn('Fibonacci sequence (first ', n, ' numbers):');
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
    expectedOutput: 'Fibonacci sequence (first 10 numbers):\n0\n1\n1\n2\n3\n5\n8\n13\n21\n34',
  },
  {
    id: 'selection-sort',
    titleKey: 'examples.selectionSort.title',
    descriptionKey: 'examples.selectionSort.description',
    title: 'Selection Sort',
    description: 'Demonstrates the selection sort algorithm for sorting an array.',
    category: 'algorithms',
    difficulty: 'intermediate',
    code: `program SelectionSort;
var
  arr: array[1..6] of Integer;
  i, j, minIdx, temp: Integer;
begin
  { Initialize unsorted array }
  arr[1] := 64;
  arr[2] := 25;
  arr[3] := 12;
  arr[4] := 22;
  arr[5] := 11;
  arr[6] := 90;
  
  WriteLn('Before sorting:');
  for i := 1 to 6 do
    Write(arr[i], ' ');
  WriteLn('');
  
  { Selection sort algorithm }
  for i := 1 to 5 do
  begin
    minIdx := i;
    for j := i + 1 to 6 do
    begin
      if arr[j] < arr[minIdx] then
        minIdx := j;
    end;
    
    { Swap }
    temp := arr[minIdx];
    arr[minIdx] := arr[i];
    arr[i] := temp;
  end;
  
  WriteLn('After sorting:');
  for i := 1 to 6 do
    Write(arr[i], ' ');
  WriteLn('');
end.`,
    expectedOutput: 'Before sorting:\n64 25 12 22 11 90 \nAfter sorting:\n11 12 22 25 64 90 ',
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

/**
 * Get examples by difficulty
 */
export function getExamplesByDifficulty(difficulty: DifficultyLevel): CodeExample[] {
  return codeExamples.filter((example) => example.difficulty === difficulty);
}

export default codeExamples;
