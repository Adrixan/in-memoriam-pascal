/*
 * Engine host (In Memoriam Pascal)
 *
 * This file is the template for the self-contained engine bundle produced by
 * scripts/build-engine.mjs. The builder replaces the two placeholders below with
 * JSON objects holding the source text of the forked Pascal.js compiler and the
 * LLVM.js compiler files.
 *
 * Evaluate the bundle in a global scope (a dedicated worker, or a node:vm
 * context in tests). It defines one global, PascalEngine, with:
 *
 *   PascalEngine.compile(source)  -> string   JavaScript for the program
 *   PascalEngine.run(js, hooks)   -> void     executes compiled JavaScript
 *
 * compile() throws an Error carrying line/column when the Pascal source is
 * rejected. Each compile re-evaluates the LLVM.js compiler, which resets all
 * of its global state and keeps repeated compiles deterministic.
 */
(function (G) {
  'use strict';

  var MODULES = /*__MODULES__*/ {};
  var FILES = /*__FILES__*/ {};

  var cache = {};

  // Minimal CommonJS loader for the Pascal.js compiler modules.
  function requireModule(name) {
    var key = String(name).replace(/^\.\//, '').replace(/\.js$/, '');
    if (cache[key]) {
      return cache[key].exports;
    }
    if (!Object.prototype.hasOwnProperty.call(MODULES, key)) {
      throw new Error("Engine module '" + name + "' not found");
    }
    var module = { exports: {} };
    cache[key] = module;
    new Function('module', 'exports', 'require', MODULES[key])(module, module.exports, requireModule);
    return module.exports;
  }

  var Parse = requireModule('parse');
  var IR = requireModule('ir');

  // jison throws a non-Error object from its default parseError; replace it
  // with a real Error that keeps jison's position information.
  Parse.parser.yy.parseError = function (message, hash) {
    var err = new Error(message);
    err.name = 'PascalSyntaxError';
    err.hash = hash;
    if (hash && hash.loc) {
      err.line = hash.loc.first_line;
      err.column = hash.loc.first_column;
    } else if (hash && typeof hash.line === 'number') {
      err.line = hash.line + 1;
    }
    throw err;
  };

  function compileIR(ir) {
    var out = '';
    G.print = function (x) { out += x + '\n'; };
    G.printErr = function () {};
    G.read = function (file) {
      var key = 'llvm.js/' + file;
      if (!Object.prototype.hasOwnProperty.call(FILES, key)) {
        throw new Error("Engine file '" + file + "' not found");
      }
      return FILES[key];
    };
    G.load = function (file) {
      (0, eval)(G.read(file));
    };
    // A fresh evaluation of the compiler resets every piece of its state.
    (0, eval)(FILES['llvm.js/compiler.js']);
    G.compile(ir);
    return out;
  }

  /**
   * Compile Pascal source text to JavaScript.
   */
  function compile(source) {
    var ast = Parse.parser.parse(source);
    var ir = IR.toIR(ast);
    return compileIR(ir);
  }

  /**
   * Compile Pascal source text to LLVM IR text (diagnostics and tests).
   */
  function toIR(source) {
    return IR.toIR(Parse.parser.parse(source));
  }

  /**
   * Run compiled JavaScript synchronously.
   *
   * hooks.stdin()  -> char code, or null at end of input (may throw to abort)
   * hooks.stdout(c) char code, or null when the stream is flushed
   * hooks.stderr(c) same as stdout
   */
  var TRAP_MESSAGES = {
    2: 'File not found',
    5: 'File could not be opened for writing',
    100: 'Read past the end of the file',
    102: 'File not assigned',
    103: 'File not open',
    106: 'Invalid numeric format',
    200: 'Division by zero',
    201: 'Range check error',
    204: 'Invalid pointer operation (nil pointer)',
    207: 'Invalid floating point operation'
  };

  // JavaScript functions the generated IR calls (names get a leading '_').
  // They run inside the scope of the compiled program.
  var RUNTIME_PREFIX = [
    'function __pascal_trap(code, line) { throw Module.__trap(code, line); }',
    'function __pascal_need_input() { throw Module.__needInput; }'
  ].join('\n');

  function run(js, hooks) {
    var Module = {
      arguments: [],
      stdin: hooks.stdin,
      stdout: hooks.stdout,
      stderr: hooks.stderr || hooks.stdout,
      print: function () {},
      printErr: function () {},
      __needInput: { needInput: true },
      __trap: function (code, line) {
        return {
          pascalRuntimeError: true,
          code: code,
          line: line,
          message: TRAP_MESSAGES[code] || ('Runtime error ' + code)
        };
      }
    };
    new Function('Module', RUNTIME_PREFIX + '\n' + js)(Module);
  }

  G.PascalEngine = { compile: compile, toIR: toIR, run: run };
})(typeof globalThis !== 'undefined' ? globalThis : self);
