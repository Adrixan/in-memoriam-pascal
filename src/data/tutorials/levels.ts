/**
 * Tutorial Level Definitions
 * 
 * 10 progressive levels teaching Pascal programming fundamentals
 * from "Hello World" to functions.
 */

import type { TutorialLevel, ValidationRule, Hint } from '@/types';

/**
 * Level 1: Hello World
 * 
 * Teaches: Program structure, begin/end, WriteLn
 * Historical note: First program tradition since Bell Labs
 */
const level1: TutorialLevel = {
    id: 'hello-world',
    number: 1,
    track: 'basic',
    titleKey: 'level1.title',
    descriptionKey: 'level1.description',
    taskDescriptionKey: 'level1.task',
    objectives: [
        'level1.objective1',
        'level1.objective2',
        'level1.objective3',
    ],
    concepts: [
        {
            titleKey: 'level1.concept1.title',
            contentKey: 'level1.concept1.content',
            codeExample: `program Name;
begin
  { statements }
end.`,
        },
        {
            titleKey: 'level1.concept2.title',
            contentKey: 'level1.concept2.content',
            codeExample: `WriteLn('Hello World!');`,
        },
    ],
    examples: [
        {
            code: `program HelloWorld;
begin
  WriteLn('Hello World!');
end.`,
            explanationKey: 'level1.example1',
            editable: false,
        },
    ],
    starterCode: `program HelloWorld;
begin
  { Write your code here }
end.`,
    expectedOutput: 'Hello World!',
    validation: [
        {
            type: 'output_match',
            config: { expected: 'Hello World!' },
            errorKey: 'validation.level1.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'WriteLn' },
            errorKey: 'validation.level1.missingWriteLn',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level1.1', cost: 5 },
        { level: 2, contentKey: 'hints.level1.2', cost: 10 },
        { level: 3, contentKey: 'hints.level1.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 5,
    prerequisites: [],
};

/**
 * Level 2: Variables
 * 
 * Teaches: var section, Integer type, assignment (:=)
 */
const level2: TutorialLevel = {
    id: 'variables',
    number: 2,
    track: 'basic',
    titleKey: 'level2.title',
    descriptionKey: 'level2.description',
    taskDescriptionKey: 'level2.task',
    objectives: [
        'level2.objective1',
        'level2.objective2',
        'level2.objective3',
    ],
    concepts: [
        {
            titleKey: 'level2.concept1.title',
            contentKey: 'level2.concept1.content',
            codeExample: `var
  number: Integer;
  name: String;`,
        },
        {
            titleKey: 'level2.concept2.title',
            contentKey: 'level2.concept2.content',
            codeExample: `number := 42;`,
        },
    ],
    examples: [
        {
            code: `program Variables;
var
  number: Integer;
begin
  number := 42;
  WriteLn('Value: ', number);
end.`,
            explanationKey: 'level2.example1',
            editable: false,
        },
    ],
    starterCode: `program Variables;
var
  number: Integer;
begin
  { Assign a value to number and print it }
end.`,
    expectedOutput: 'Value: 42',
    validation: [
        {
            type: 'output_match',
            config: { expected: 'Value: 42' },
            errorKey: 'validation.level2.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'var' },
            errorKey: 'validation.level2.missingVar',
        },
        {
            type: 'contains_keyword',
            config: { keyword: ':=' },
            errorKey: 'validation.level2.missingAssignment',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level2.1', cost: 5 },
        { level: 2, contentKey: 'hints.level2.2', cost: 10 },
        { level: 3, contentKey: 'hints.level2.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 7,
    prerequisites: ['hello-world'],
};

/**
 * Level 3: Simple Math
 * 
 * Teaches: Arithmetic operators, multiple WriteLn arguments
 */
const level3: TutorialLevel = {
    id: 'simple-math',
    number: 3,
    track: 'basic',
    titleKey: 'level3.title',
    descriptionKey: 'level3.description',
    taskDescriptionKey: 'level3.task',
    objectives: [
        'level3.objective1',
        'level3.objective2',
        'level3.objective3',
    ],
    concepts: [
        {
            titleKey: 'level3.concept1.title',
            contentKey: 'level3.concept1.content',
            codeExample: `sum := a + b;
diff := a - b;
product := a * b;
quotient := a div b; { integer division }`,
        },
    ],
    examples: [
        {
            code: `program Math;
var
  a, b, sum: Integer;
begin
  a := 5;
  b := 3;
  sum := a + b;
  WriteLn(a, ' + ', b, ' = ', sum);
end.`,
            explanationKey: 'level3.example1',
            editable: false,
        },
    ],
    starterCode: `program Math;
var
  a, b, sum: Integer;
begin
  a := 5;
  b := 3;
  { Calculate the sum and print the result }
end.`,
    expectedOutput: '5 + 3 = 8',
    validation: [
        {
            type: 'output_match',
            config: { expected: '5 + 3 = 8' },
            errorKey: 'validation.level3.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: '+' },
            errorKey: 'validation.level3.missingOperator',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level3.1', cost: 5 },
        { level: 2, contentKey: 'hints.level3.2', cost: 10 },
        { level: 3, contentKey: 'hints.level3.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 8,
    prerequisites: ['variables'],
};

/**
 * Level 4: Strings
 * 
 * Teaches: String type, string literals
 */
const level4: TutorialLevel = {
    id: 'strings',
    number: 4,
    track: 'basic',
    titleKey: 'level4.title',
    descriptionKey: 'level4.description',
    taskDescriptionKey: 'level4.task',
    objectives: [
        'level4.objective1',
        'level4.objective2',
        'level4.objective3',
    ],
    concepts: [
        {
            titleKey: 'level4.concept1.title',
            contentKey: 'level4.concept1.content',
            codeExample: `var
  name: String;
begin
  name := 'Pascal';
end.`,
        },
    ],
    examples: [
        {
            code: `program Strings;
var
  name: String;
begin
  name := 'Pascal';
  WriteLn('Hello, ', name, '!');
end.`,
            explanationKey: 'level4.example1',
            editable: false,
        },
    ],
    starterCode: `program Strings;
var
  name: String;
begin
  { Assign your name and print a greeting }
end.`,
    expectedOutput: 'Hello, Pascal!',
    validation: [
        {
            type: 'output_contains',
            config: { substring: 'Hello,' },
            errorKey: 'validation.level4.missingGreeting',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'String' },
            errorKey: 'validation.level4.missingStringType',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level4.1', cost: 5 },
        { level: 2, contentKey: 'hints.level4.2', cost: 10 },
        { level: 3, contentKey: 'hints.level4.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 6,
    prerequisites: ['simple-math'],
};

/**
 * Level 5: Input/Output
 * 
 * Teaches: ReadLn, Write (without newline)
 * Note: Uses simulated input for browser execution
 */
const level5: TutorialLevel = {
    id: 'input-output',
    number: 5,
    track: 'basic',
    titleKey: 'level5.title',
    descriptionKey: 'level5.description',
    taskDescriptionKey: 'level5.task',
    objectives: [
        'level5.objective1',
        'level5.objective2',
        'level5.objective3',
    ],
    concepts: [
        {
            titleKey: 'level5.concept1.title',
            contentKey: 'level5.concept1.content',
            codeExample: `Write('Enter name: ');  { no newline }
ReadLn(name);           { reads input }`,
        },
    ],
    examples: [
        {
            code: `program InputOutput;
var
  name: String;
begin
  Write('Enter your name: ');
  ReadLn(name);
  WriteLn('Hello, ', name, '!');
end.`,
            explanationKey: 'level5.example1',
            editable: false,
        },
    ],
    starterCode: `program InputOutput;
var
  name: String;
begin
  { Ask for name and greet the user }
  WriteLn('Hello, World!');
end.`,
    expectedOutput: 'Hello, World!',
    testInput: ['World'],
    validation: [
        {
            type: 'contains_keyword',
            config: { keyword: 'ReadLn' },
            errorKey: 'validation.level5.missingReadLn',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'Write' },
            errorKey: 'validation.level5.missingWrite',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level5.1', cost: 5 },
        { level: 2, contentKey: 'hints.level5.2', cost: 10 },
        { level: 3, contentKey: 'hints.level5.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 8,
    prerequisites: ['strings'],
};

/**
 * Level 6: Conditionals
 * 
 * Teaches: if-then-else, comparison operators
 */
const level6: TutorialLevel = {
    id: 'conditionals',
    number: 6,
    track: 'basic',
    titleKey: 'level6.title',
    descriptionKey: 'level6.description',
    taskDescriptionKey: 'level6.task',
    objectives: [
        'level6.objective1',
        'level6.objective2',
        'level6.objective3',
    ],
    concepts: [
        {
            titleKey: 'level6.concept1.title',
            contentKey: 'level6.concept1.content',
            codeExample: `if number >= 0 then
  WriteLn('Positive')
else
  WriteLn('Negative');`,
        },
    ],
    examples: [
        {
            code: `program Conditionals;
var
  number: Integer;
begin
  number := -5;
  if number >= 0 then
    WriteLn('Positive')
  else
    WriteLn('Negative');
end.`,
            explanationKey: 'level6.example1',
            editable: false,
        },
    ],
    starterCode: `program Conditionals;
var
  number: Integer;
begin
  number := -5;
  { Check if number is positive or negative }
end.`,
    expectedOutput: 'Negative',
    validation: [
        {
            type: 'output_match',
            config: { expected: 'Negative' },
            errorKey: 'validation.level6.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'if' },
            errorKey: 'validation.level6.missingIf',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'else' },
            errorKey: 'validation.level6.missingElse',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level6.1', cost: 5 },
        { level: 2, contentKey: 'hints.level6.2', cost: 10 },
        { level: 3, contentKey: 'hints.level6.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 10,
    prerequisites: ['input-output'],
};

/**
 * Level 7: For Loop
 * 
 * Teaches: for-do, to/downto
 */
const level7: TutorialLevel = {
    id: 'for-loop',
    number: 7,
    track: 'basic',
    titleKey: 'level7.title',
    descriptionKey: 'level7.description',
    taskDescriptionKey: 'level7.task',
    objectives: [
        'level7.objective1',
        'level7.objective2',
        'level7.objective3',
    ],
    concepts: [
        {
            titleKey: 'level7.concept1.title',
            contentKey: 'level7.concept1.content',
            codeExample: `for i := 1 to 5 do
  WriteLn(i);`,
        },
        {
            titleKey: 'level7.concept2.title',
            contentKey: 'level7.concept2.content',
            codeExample: `for i := 5 downto 1 do
  WriteLn(i);`,
        },
    ],
    examples: [
        {
            code: `program ForLoop;
var
  i: Integer;
begin
  for i := 1 to 5 do
    WriteLn(i);
end.`,
            explanationKey: 'level7.example1',
            editable: false,
        },
    ],
    starterCode: `program ForLoop;
var
  i: Integer;
begin
  { Use a for loop to print numbers 1 to 5 }
end.`,
    expectedOutput: '1\n2\n3\n4\n5',
    validation: [
        {
            type: 'output_match',
            config: { expected: '1\n2\n3\n4\n5' },
            errorKey: 'validation.level7.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'for' },
            errorKey: 'validation.level7.missingFor',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'to' },
            errorKey: 'validation.level7.missingTo',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level7.1', cost: 5 },
        { level: 2, contentKey: 'hints.level7.2', cost: 10 },
        { level: 3, contentKey: 'hints.level7.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 10,
    prerequisites: ['conditionals'],
};

/**
 * Level 8: While Loop
 * 
 * Teaches: while-do, compound statements
 */
const level8: TutorialLevel = {
    id: 'while-loop',
    number: 8,
    track: 'basic',
    titleKey: 'level8.title',
    descriptionKey: 'level8.description',
    taskDescriptionKey: 'level8.task',
    objectives: [
        'level8.objective1',
        'level8.objective2',
        'level8.objective3',
    ],
    concepts: [
        {
            titleKey: 'level8.concept1.title',
            contentKey: 'level8.concept1.content',
            codeExample: `while count > 0 do
begin
  WriteLn(count);
  count := count - 1;
end;`,
        },
    ],
    examples: [
        {
            code: `program WhileLoop;
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
            explanationKey: 'level8.example1',
            editable: false,
        },
    ],
    starterCode: `program WhileLoop;
var
  count: Integer;
begin
  count := 5;
  { Use a while loop to count down from 5 to 1 }
  WriteLn('Liftoff!');
end.`,
    expectedOutput: '5\n4\n3\n2\n1\nLiftoff!',
    validation: [
        {
            type: 'output_match',
            config: { expected: '5\n4\n3\n2\n1\nLiftoff!' },
            errorKey: 'validation.level8.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'while' },
            errorKey: 'validation.level8.missingWhile',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level8.1', cost: 5 },
        { level: 2, contentKey: 'hints.level8.2', cost: 10 },
        { level: 3, contentKey: 'hints.level8.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 10,
    prerequisites: ['for-loop'],
};

/**
 * Level 9: Procedures
 * 
 * Teaches: Procedure declaration, parameters
 */
const level9: TutorialLevel = {
    id: 'procedures',
    number: 9,
    track: 'basic',
    titleKey: 'level9.title',
    descriptionKey: 'level9.description',
    taskDescriptionKey: 'level9.task',
    objectives: [
        'level9.objective1',
        'level9.objective2',
        'level9.objective3',
    ],
    concepts: [
        {
            titleKey: 'level9.concept1.title',
            contentKey: 'level9.concept1.content',
            codeExample: `procedure Greet(name: String);
begin
  WriteLn('Hello, ', name, '!');
end;`,
        },
    ],
    examples: [
        {
            code: `program Procedures;

procedure Greet(name: String);
begin
  WriteLn('Hello, ', name, '!');
end;

begin
  Greet('World');
end.`,
            explanationKey: 'level9.example1',
            editable: false,
        },
    ],
    starterCode: `program Procedures;

{ Define a procedure called Greet that takes a name parameter }

begin
  { Call your procedure }
end.`,
    expectedOutput: 'Hello, World!',
    validation: [
        {
            type: 'output_match',
            config: { expected: 'Hello, World!' },
            errorKey: 'validation.level9.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'procedure' },
            errorKey: 'validation.level9.missingProcedure',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level9.1', cost: 5 },
        { level: 2, contentKey: 'hints.level9.2', cost: 10 },
        { level: 3, contentKey: 'hints.level9.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 12,
    prerequisites: ['while-loop'],
};

/**
 * Level 10: Functions
 * 
 * Teaches: Function declaration, return value assignment
 */
const level10: TutorialLevel = {
    id: 'functions',
    number: 10,
    track: 'basic',
    titleKey: 'level10.title',
    descriptionKey: 'level10.description',
    taskDescriptionKey: 'level10.task',
    objectives: [
        'level10.objective1',
        'level10.objective2',
        'level10.objective3',
    ],
    concepts: [
        {
            titleKey: 'level10.concept1.title',
            contentKey: 'level10.concept1.content',
            codeExample: `function Square(n: Integer): Integer;
begin
  Square := n * n;
end;`,
        },
    ],
    examples: [
        {
            code: `program Functions;

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
            explanationKey: 'level10.example1',
            editable: false,
        },
    ],
    starterCode: `program Functions;

{ Define a function called Square that returns n * n }

var
  result: Integer;
begin
  { Call your function and print the result }
end.`,
    expectedOutput: '5 squared is 25',
    validation: [
        {
            type: 'output_match',
            config: { expected: '5 squared is 25' },
            errorKey: 'validation.level10.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'function' },
            errorKey: 'validation.level10.missingFunction',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level10.1', cost: 5 },
        { level: 2, contentKey: 'hints.level10.2', cost: 10 },
        { level: 3, contentKey: 'hints.level10.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 12,
    prerequisites: ['procedures'],
};

/**
 * Level 11: File I/O
 * 
 * Teaches: Reading and writing files using Assign, Reset, Rewrite, Close
 */
const level11: TutorialLevel = {
    id: 'file-io',
    number: 11,
    track: 'intermediate',
    titleKey: 'level11.title',
    descriptionKey: 'level11.description',
    taskDescriptionKey: 'level11.task',
    objectives: [
        'level11.objective1',
        'level11.objective2',
        'level11.objective3',
    ],
    concepts: [
        {
            titleKey: 'level11.concept1.title',
            contentKey: 'level11.concept1.content',
            codeExample: `var
  f: Text;
begin
  Assign(f, 'data.txt');
  Rewrite(f);
  WriteLn(f, 'Hello File');
  Close(f);
end.`,
        },
    ],
    examples: [
        {
            code: `program FileIO;
var
  f: Text;
  line: String;
begin
  { Write to a file }
  Assign(f, 'output.txt');
  Rewrite(f);
  WriteLn(f, 'Hello from Pascal!');
  Close(f);
  
  { Read from the file }
  Reset(f);
  ReadLn(f, line);
  WriteLn('Read: ', line);
  Close(f);
end.`,
            explanationKey: 'level11.example1',
            editable: false,
        },
    ],
    starterCode: `program FileIO;
var
  f: Text;
begin
  { Write 'Hello World!' to a file }
  Assign(f, 'hello.txt');
  Rewrite(f);
  { Write your text here }
  Close(f);
end.`,
    expectedOutput: 'File written: hello.txt',
    validation: [
        {
            type: 'contains_keyword',
            config: { keyword: 'Assign' },
            errorKey: 'validation.level11.missingAssign',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'Rewrite' },
            errorKey: 'validation.level11.missingRewrite',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'Close' },
            errorKey: 'validation.level11.missingClose',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level11.1', cost: 5 },
        { level: 2, contentKey: 'hints.level11.2', cost: 10 },
        { level: 3, contentKey: 'hints.level11.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 15,
    prerequisites: ['functions'],
};

/**
 * Level 12: Sets
 * 
 * Teaches: Set types and operations (union, intersection, difference)
 */
const level12: TutorialLevel = {
    id: 'sets',
    number: 12,
    track: 'intermediate',
    titleKey: 'level12.title',
    descriptionKey: 'level12.description',
    taskDescriptionKey: 'level12.task',
    objectives: [
        'level12.objective1',
        'level12.objective2',
        'level12.objective3',
    ],
    concepts: [
        {
            titleKey: 'level12.concept1.title',
            contentKey: 'level12.concept1.content',
            codeExample: `type
  TCharSet = set of 'A'..'Z';

var
  vowels, letters: TCharSet;
begin
  vowels := ['A', 'E', 'I', 'O', 'U'];
  letters := ['A'..'Z'];
end.`,
        },
    ],
    examples: [
        {
            code: `program Sets;
type
  TDigit = set of 0..9;

var
  even, digits: TDigit;
  i: Integer;
begin
  even := [0, 2, 4, 6, 8];
  digits := [0..9];
  
  { Check set membership }
  if 4 in even then
    WriteLn('4 is even');
  
  { Set operations }
  if even <= digits then
    WriteLn('Even is subset of digits');
end.`,
            explanationKey: 'level12.example1',
            editable: false,
        },
    ],
    starterCode: `program Sets;
type
  TNumberSet = set of 1..10;

var
  primes, numbers: TNumberSet;
begin
  { Define a set of prime numbers: 2, 3, 5, 7 }
  primes := [2, 3, 5, 7];
  
  { Define a set of numbers 1-10 }
  numbers := [1..10];
  
  { Check if 5 is in primes and if primes is subset of numbers }
end.`,
    expectedOutput: '5 is prime\nPrimes subset of numbers',
    validation: [
        {
            type: 'contains_keyword',
            config: { keyword: 'set of' },
            errorKey: 'validation.level12.missingSetOf',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'in' },
            errorKey: 'validation.level12.missingIn',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level12.1', cost: 5 },
        { level: 2, contentKey: 'hints.level12.2', cost: 10 },
        { level: 3, contentKey: 'hints.level12.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 15,
    prerequisites: ['file-io'],
};

/**
 * Level 13: Pointers
 * 
 * Teaches: Dynamic memory allocation with New and Dispose
 */
const level13: TutorialLevel = {
    id: 'pointers',
    number: 13,
    track: 'advanced',
    titleKey: 'level13.title',
    descriptionKey: 'level13.description',
    taskDescriptionKey: 'level13.task',
    objectives: [
        'level13.objective1',
        'level13.objective2',
        'level13.objective3',
    ],
    concepts: [
        {
            titleKey: 'level13.concept1.title',
            contentKey: 'level13.concept1.content',
            codeExample: `var
  p: ^Integer;
begin
  New(p);      { Allocate memory }
  p^ := 42;    { Store value }
  WriteLn(p^); { Access value }
  Dispose(p);  { Free memory }
end.`,
        },
    ],
    examples: [
        {
            code: `program Pointers;
type
  PNode = ^TNode;
  TNode = record
    value: Integer;
    next: PNode;
  end;

var
  head: PNode;
begin
  { Create first node }
  New(head);
  head^.value := 10;
  head^.next := nil;
  
  { Create second node }
  New(head^.next);
  head^.next^.value := 20;
  head^.next^.next := nil;
  
  WriteLn('Node 1: ', head^.value);
  WriteLn('Node 2: ', head^.next^.value);
end.`,
            explanationKey: 'level13.example1',
            editable: false,
        },
    ],
    starterCode: `program Pointers;
var
  p: ^Integer;
begin
  { Allocate memory for an integer pointer }
  New(p);
  
  { Assign value 42 to the pointer }
  p^ := 42;
  
  { Print the value }
  WriteLn('Value: ', p^);
  
  { Free the allocated memory }
  Dispose(p);
end.`,
    expectedOutput: 'Value: 42',
    validation: [
        {
            type: 'contains_keyword',
            config: { keyword: 'New(' },
            errorKey: 'validation.level13.missingNew',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'Dispose(' },
            errorKey: 'validation.level13.missingDispose',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level13.1', cost: 5 },
        { level: 2, contentKey: 'hints.level13.2', cost: 10 },
        { level: 3, contentKey: 'hints.level13.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 20,
    prerequisites: ['sets'],
};

/**
 * Level 14: Advanced Records
 * 
 * Teaches: Variant records and nested structures
 */
const level14: TutorialLevel = {
    id: 'advanced-records',
    number: 14,
    track: 'advanced',
    titleKey: 'level14.title',
    descriptionKey: 'level14.description',
    taskDescriptionKey: 'level14.task',
    objectives: [
        'level14.objective1',
        'level14.objective2',
        'level14.objective3',
    ],
    concepts: [
        {
            titleKey: 'level14.concept1.title',
            contentKey: 'level14.concept1.content',
            codeExample: `type
  TPerson = record
    name: String;
    age: Integer;
    case kind: (student, teacher) of
      student: (grade: Integer;);
      teacher: (subject: String; salary: Real);
  end;`,
        },
    ],
    examples: [
        {
            code: `program AdvancedRecords;
type
  TAddress = record
    street: String;
    city: String;
    zip: String;
  end;

  TPerson = record
    name: String;
    age: Integer;
    address: TAddress;  { Nested record }
  end;

var
  person: TPerson;
begin
  person.name := 'John';
  person.age := 30;
  person.address.street := 'Main St';
  person.address.city := 'Berlin';
  person.address.zip := '10115';
  
  WriteLn(person.name, ' lives in ', person.address.city);
end.`,
            explanationKey: 'level14.example1',
            editable: false,
        },
    ],
    starterCode: `program AdvancedRecords;
type
  TDate = record
    day: Integer;
    month: Integer;
    year: Integer;
  end;

  TEvent = record
    name: String;
    date: TDate;  { Nested record }
  end;

var
  event: TEvent;
begin
  { Create an event for New Year's Day }
  event.name := 'New Year';
  event.date.day := 1;
  event.date.month := 1;
  event.date.year := 2025;
  
  WriteLn(event.name, ': ', event.date.day, '/', event.date.month, '/', event.date.year);
end.`,
    expectedOutput: 'New Year: 1/1/2025',
    validation: [
        {
            type: 'contains_keyword',
            config: { keyword: 'record' },
            errorKey: 'validation.level14.missingRecord',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'nested' },
            errorKey: 'validation.level14.missingNested',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level14.1', cost: 5 },
        { level: 2, contentKey: 'hints.level14.2', cost: 10 },
        { level: 3, contentKey: 'hints.level14.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 20,
    prerequisites: ['pointers'],
};

/**
 * Level 15: Unit System
 * 
 * Teaches: Using and creating units/modules for code organization
 */
const level15: TutorialLevel = {
    id: 'unit-system',
    number: 15,
    track: 'advanced',
    titleKey: 'level15.title',
    descriptionKey: 'level15.description',
    taskDescriptionKey: 'level15.task',
    objectives: [
        'level15.objective1',
        'level15.objective2',
        'level15.objective3',
    ],
    concepts: [
        {
            titleKey: 'level15.concept1.title',
            contentKey: 'level15.concept1.content',
            codeExample: `unit MyUnit;

interface
procedure DoSomething;

implementation

procedure DoSomething;
begin
  WriteLn('Hello from unit!');
end;

end.`,
        },
    ],
    examples: [
        {
            code: `program UnitSystem;
{ Simulated unit usage - in browser Pascal we use procedures }

procedure MathUtils_Add(a, b: Integer);
begin
  WriteLn('Sum: ', a + b);
end;

procedure MathUtils_Multiply(a, b: Integer);
begin
  WriteLn('Product: ', a * b);
end;

begin
  MathUtils_Add(5, 3);
  MathUtils_Multiply(4, 7);
end.`,
            explanationKey: 'level15.example1',
            editable: false,
        },
    ],
    starterCode: `program UnitSystem;

{ Create a simple utility module with two procedures }

procedure Greet(name: String);
begin
  WriteLn('Hello, ', name, '!');
end;

procedure Farewell(name: String);
begin
  WriteLn('Goodbye, ', name, '!');
end;

begin
  { Call both procedures with 'World' }
  Greet('World');
  Farewell('World');
end.`,
    expectedOutput: 'Hello, World!\nGoodbye, World!',
    validation: [
        {
            type: 'output_match',
            config: { expected: 'Hello, World!\nGoodbye, World!' },
            errorKey: 'validation.level15.outputMismatch',
        },
        {
            type: 'contains_keyword',
            config: { keyword: 'procedure' },
            errorKey: 'validation.level15.missingProcedure',
        },
    ] as ValidationRule[],
    hints: [
        { level: 1, contentKey: 'hints.level15.1', cost: 5 },
        { level: 2, contentKey: 'hints.level15.2', cost: 10 },
        { level: 3, contentKey: 'hints.level15.3', cost: 15 },
    ] as Hint[],
    estimatedTime: 25,
    prerequisites: ['advanced-records'],
};

/**
 * All tutorial levels in order
 */
export const tutorialLevels: TutorialLevel[] = [
    level1,
    level2,
    level3,
    level4,
    level5,
    level6,
    level7,
    level8,
    level9,
    level10,
    level11,
    level12,
    level13,
    level14,
    level15,
];

/**
 * Get a level by its ID
 */
export function getLevelById(id: string): TutorialLevel | undefined {
    return tutorialLevels.find((level) => level.id === id);
}

/**
 * Get a level by its number (1-based)
 */
export function getLevelByNumber(number: number): TutorialLevel | undefined {
    return tutorialLevels.find((level) => level.number === number);
}

/**
 * Get the next level after the given level ID
 */
export function getNextLevel(currentId: string): TutorialLevel | undefined {
    const currentIndex = tutorialLevels.findIndex((level) => level.id === currentId);
    if (currentIndex < 0 || currentIndex >= tutorialLevels.length - 1) {
        return undefined;
    }
    return tutorialLevels[currentIndex + 1];
}

/**
 * Get the previous level before the given level ID
 */
export function getPreviousLevel(currentId: string): TutorialLevel | undefined {
    const currentIndex = tutorialLevels.findIndex((level) => level.id === currentId);
    if (currentIndex <= 0) {
        return undefined;
    }
    return tutorialLevels[currentIndex - 1];
}

export default tutorialLevels;
