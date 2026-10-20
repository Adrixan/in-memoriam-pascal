/**
 * Test Setup
 *
 * Browser mocks are only installed in DOM environments; the engine tests run
 * under the node environment and skip them.
 */
import '@testing-library/jest-dom';

if (typeof window !== 'undefined') {
    // Mock matchMedia for tests
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => { },
            removeListener: () => { },
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false,
        }),
    });

    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
        readonly root: Element | null = null;
        readonly rootMargin: string = '';
        readonly thresholds: ReadonlyArray<number> = [];

        observe() { }
        unobserve() { }
        disconnect() { }
        takeRecords(): IntersectionObserverEntry[] {
            return [];
        }
    };
}

export {};
