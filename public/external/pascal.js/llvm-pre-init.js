/**
 * LLVM.js Pre-Initialization Script
 * 
 * This script MUST be loaded BEFORE compiler.js to set up the correct
 * environment for browser-based execution.
 * 
 * The compiler.js file uses load('utility.js') and read('runtime.js') with
 * relative paths. In the browser, this would resolve relative to the
 * current page URL (e.g., /tutorial/utility.js) instead of the llvm.js
 * directory. This pre-init script uses Object.defineProperty to make
 * read() and load() non-writable, so compiler.js can't overwrite them.
 */

(function () {
    'use strict';

    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
        return;
    }

    // Base path for LLVM.js files
    var LLVM_BASE_PATH = '/external/pascal.js/llvm.js/';

    // Internal read function with correct base path
    function readWithBasePath(filename) {
        var xhr = new XMLHttpRequest();
        var url = LLVM_BASE_PATH + filename;
        xhr.open('GET', url, false); // Synchronous request
        xhr.send(null);

        if (xhr.status !== 200) {
            throw new Error('Failed to load: ' + url + ' (status: ' + xhr.status + ')');
        }

        return xhr.responseText;
    }

    // Define read() as non-writable so compiler.js can't overwrite it
    Object.defineProperty(window, 'read', {
        value: readWithBasePath,
        writable: false,
        configurable: false
    });

    // Define load() as non-writable so compiler.js can't overwrite it
    Object.defineProperty(window, 'load', {
        value: function (f) {
            var content = readWithBasePath(f);
            eval.call(null, content);
        },
        writable: false,
        configurable: false
    });

    // Set up print functions - use custom names to avoid conflicts with browser's native print
    // The OutputCapture module will manage window.print for output capture
    // Additionally, set global 'print' to no-op to prevent browser print dialog
    // (Emscripten/LLVM.js code uses global 'print' function)
    if (!window.pascalPrint) {
        window.pascalPrint = function (output) {
            console.log('[LLVM.js]', output);
        };
    }

    // CRITICAL: Set global print to no-op to prevent browser print dialog
    // LLVM.js/Emscripten code uses global 'print' function for output
    // Without this, it triggers the browser's native print dialog
    print = function () { };

    if (!window.printErr) {
        window.printErr = function (output) {
            console.error('[LLVM.js]', output);
        };
    }

    // Set up arguments array for Emscripten
    if (!window.arguments) {
        window.arguments = [];
    }

    console.log('[LLVM.js Pre-Init] Environment configured for browser (non-writable)');
})();
