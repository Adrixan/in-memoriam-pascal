/**
 * Persistent storage for the Zustand stores.
 *
 * The persisted state is a few kilobytes of JSON (progress, settings, the
 * free-editor buffer), so localStorage is sufficient. Writes are coalesced:
 * typing in the editor changes state on every keystroke, but the browser
 * storage is written once things settle, and when the page is hidden.
 */

import type { StateStorage } from 'zustand/middleware';

const DEFAULT_DELAY_MS = 400;

export interface PersistentStorage extends StateStorage {
    /** Write everything that is still waiting to be written */
    flush(): void;
}

const instances = new Set<PersistentStorage>();
let listenersInstalled = false;

function installFlushListeners(): void {
    if (listenersInstalled || typeof window === 'undefined') {
        return;
    }
    listenersInstalled = true;
    const flushAll = (): void => {
        instances.forEach((instance) => instance.flush());
    };
    window.addEventListener('pagehide', flushAll);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushAll();
        }
    });
}

function readItem(name: string): string | null {
    try {
        // Data written by earlier versions lives under "<name>:<name>".
        return localStorage.getItem(name) ?? localStorage.getItem(`${name}:${name}`);
    } catch {
        return null;
    }
}

export function createPersistentStorage(delayMs: number = DEFAULT_DELAY_MS): PersistentStorage {
    const pending = new Map<string, string>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = (): void => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
        for (const [name, value] of pending) {
            try {
                localStorage.setItem(name, value);
            } catch (error) {
                // Storage full or blocked: progress keeps working in memory.
                console.warn(`[storage] could not save "${name}":`, error);
            }
        }
        pending.clear();
    };

    const storage: PersistentStorage = {
        getItem(name) {
            // A value that is waiting to be written is the current one.
            return pending.get(name) ?? readItem(name);
        },
        setItem(name, value) {
            pending.set(name, value);
            timer ??= setTimeout(flush, delayMs);
        },
        removeItem(name) {
            pending.delete(name);
            try {
                localStorage.removeItem(name);
                localStorage.removeItem(`${name}:${name}`);
            } catch {
                // ignore
            }
        },
        flush,
    };

    instances.add(storage);
    installFlushListeners();
    return storage;
}

/** Storage used by the individual stores. */
export const editorStorage = createPersistentStorage();
export const settingsStorage = createPersistentStorage();
export const tutorialStorage = createPersistentStorage();
