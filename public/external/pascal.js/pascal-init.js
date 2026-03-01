/**
 * Pascal.js Initialization Script
 * 
 * This script ensures that all Pascal.js globals are properly exposed
 * for browser-based execution. The original scripts use CommonJS pattern
 * which doesn't expose globals in the browser.
 * 
 * This must be loaded after all other Pascal.js scripts.
 */

(function () {
    'use strict';

    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
        return;
    }

    // The parse.js script already exposes 'parse' as a global via:
    // var parse = (function(){...})();
    // So window.parse should already be available

    // The ir.js script defines 'IR' as a function at global scope
    // function IR(theAST) {...}
    // So window.IR should already be available

    // However, ir.js also has a CommonJS export block that won't run in browser
    // We need to ensure the IR constructor and its methods are available

    // For LLVM.js, the functions are exposed via Emscripten
    // llvmAs and llvmDis should be globals after loading llvm-as.js and llvm-dis.js
    // compile should be a global after loading compiler.js

    // Set up XHR_PREFIX for LLVM.js to load its internal files
    window.XHR_PREFIX = '';

    // Set up Module object for LLVM.js/Emscripten
    if (!window.Module) {
        window.Module = {};
    }

    // Set up a default print function that can be overridden
    // IMPORTANT: We use a custom name to avoid conflicting with browser's native print()
    // Also set global 'print' to no-op as a fallback to prevent browser print dialog
    if (!window.pascalPrint) {
        window.pascalPrint = function (output) {
            console.log('[Pascal.js]', output);
        };
    }

    // CRITICAL: Ensure global print is set to no-op to prevent browser print dialog
    // This is a fallback in case llvm-pre-init.js didn't run or wasn't effective
    if (typeof print === 'undefined') {
        print = function () { };
    }

    // Set up arguments array for Emscripten
    if (!window.arguments) {
        window.arguments = [];
    }

    // Verify that required globals are available
    var requiredGlobals = ['parse', 'IR'];
    var missingGlobals = requiredGlobals.filter(function (g) { return typeof window[g] === 'undefined'; });

    if (missingGlobals.length > 0) {
        console.warn('[Pascal.js Init] Missing globals:', missingGlobals.join(', '));
        console.warn('[Pascal.js Init] Make sure parse.js and ir.js are loaded before pascal-init.js');
    }

    // Verify LLVM globals (these may take time to initialize)
    var llvmGlobals = ['llvmAs', 'llvmDis', 'compile'];

    // Log status for debugging
    console.log('[Pascal.js Init] Initialization complete');
    console.log('[Pascal.js Init] parse:', typeof window.parse);
    console.log('[Pascal.js Init] IR:', typeof window.IR);
    console.log('[Pascal.js Init] llvmAs:', typeof window.llvmAs);
    console.log('[Pascal.js Init] llvmDis:', typeof window.llvmDis);
    console.log('[Pascal.js Init] compile:', typeof window.compile);

    // Export a readiness check function
    window.pascalJsReady = function () {
        return {
            parse: typeof window.parse !== 'undefined',
            IR: typeof window.IR !== 'undefined',
            llvmAs: typeof window.llvmAs !== 'undefined',
            llvmDis: typeof window.llvmDis !== 'undefined',
            compile: typeof window.compile !== 'undefined',
        };
    };

})();
