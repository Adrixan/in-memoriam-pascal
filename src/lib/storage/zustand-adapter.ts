/**
 * Zustand Persist Adapter for IndexedDB
 * Provides a custom storage adapter for Zustand's persist middleware
 */

import type { StateStorage } from 'zustand/middleware';
import { storage, type StoreName, QuotaExceededError, DatabaseUnavailableError } from './indexeddb';

/** Map of Zustand store names to IndexedDB store names */
const STORE_MAPPING: Record<string, StoreName> = {
    'editor-storage': 'app-state',
    'settings-storage': 'user-settings',
    'tutorial-storage': 'user-progress',
    'interpreter-storage': 'app-state',
};

/**
 * Create a Zustand persist storage adapter using IndexedDB
 * @param storeName - The Zustand persist name (e.g., 'editor-storage')
 * @param dbStore - Optional explicit IndexedDB store name
 */
export function createIndexedDBStorage(
    storeName: string,
    dbStore?: StoreName
): StateStorage {
    const targetStore = dbStore ?? STORE_MAPPING[storeName] ?? 'app-state';

    return {
        /**
         * Get persisted state from IndexedDB
         */
        getItem: async (name: string): Promise<string | null> => {
            try {
                const value = await storage.get<string>(targetStore, name);
                return value ?? null;
            } catch (error) {
                // Log error but don't throw - Zustand expects null for missing values
                console.error(`[IndexedDB Storage] Failed to get item "${name}":`, error);
                return null;
            }
        },

        /**
         * Persist state to IndexedDB
         */
        setItem: async (name: string, value: string): Promise<void> => {
            try {
                await storage.set(targetStore, name, value);
            } catch (error) {
                if (error instanceof QuotaExceededError) {
                    console.error('[IndexedDB Storage] Storage quota exceeded. Consider clearing old data.');
                    // Optionally notify user
                } else if (error instanceof DatabaseUnavailableError) {
                    console.warn('[IndexedDB Storage] IndexedDB unavailable, using localStorage fallback');
                } else {
                    console.error(`[IndexedDB Storage] Failed to set item "${name}":`, error);
                }
                // Don't throw - persist failures shouldn't break the app
            }
        },

        /**
         * Remove persisted state from IndexedDB
         */
        removeItem: async (name: string): Promise<void> => {
            try {
                await storage.remove(targetStore, name);
            } catch (error) {
                console.error(`[IndexedDB Storage] Failed to remove item "${name}":`, error);
            }
        },
    };
}

/**
 * Create a hybrid storage adapter that falls back to localStorage
 * This is useful for stores that need to work even if IndexedDB is unavailable
 */
export function createHybridStorage(storeName: string, dbStore?: StoreName): StateStorage {
    const indexedDBStorage = createIndexedDBStorage(storeName, dbStore);

    // LocalStorage fallback
    const localStorageFallback: StateStorage = {
        getItem: (name: string): string | null => {
            try {
                return localStorage.getItem(`${storeName}:${name}`);
            } catch {
                return null;
            }
        },
        setItem: (name: string, value: string): void => {
            try {
                localStorage.setItem(`${storeName}:${name}`, value);
            } catch (error) {
                console.error('[LocalStorage] Failed to set item:', error);
            }
        },
        removeItem: (name: string): void => {
            try {
                localStorage.removeItem(`${storeName}:${name}`);
            } catch {
                // Ignore errors
            }
        },
    };

    return {
        getItem: async (name: string): Promise<string | null> => {
            // Try IndexedDB first
            const indexedDBValue = await indexedDBStorage.getItem(name);
            if (indexedDBValue !== null) {
                return indexedDBValue;
            }

            // Fall back to localStorage
            return localStorageFallback.getItem(name);
        },

        setItem: async (name: string, value: string): Promise<void> => {
            // Save to both storages
            await indexedDBStorage.setItem(name, value);
            localStorageFallback.setItem(name, value);
        },

        removeItem: async (name: string): Promise<void> => {
            await indexedDBStorage.removeItem(name);
            localStorageFallback.removeItem(name);
        },
    };
}

/**
 * Pre-configured storage adapters for each store
 */
export const editorStorage = createHybridStorage('editor-storage', 'app-state');
export const settingsStorage = createHybridStorage('settings-storage', 'user-settings');
export const tutorialStorage = createHybridStorage('tutorial-storage', 'user-progress');
export const interpreterStorage = createHybridStorage('interpreter-storage', 'app-state');

/**
 * Clear all persisted data for a specific store
 */
export async function clearStoreData(storeName: string): Promise<void> {
    const targetStore = STORE_MAPPING[storeName] ?? 'app-state';
    await storage.clear(targetStore);

    // Also clear localStorage fallback
    const prefix = `${storeName}:`;
    Object.keys(localStorage)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => localStorage.removeItem(key));
}

/**
 * Clear all persisted data (all stores)
 */
export async function clearAllPersistedData(): Promise<void> {
    const storeNames = Object.keys(STORE_MAPPING);
    await Promise.all(storeNames.map((name) => clearStoreData(name)));
}

/**
 * Export/Import persisted state for backup/restore
 */
export async function exportPersistedState(): Promise<Record<string, unknown>> {
    const state: Record<string, unknown> = {};

    for (const [storeName, dbStore] of Object.entries(STORE_MAPPING)) {
        try {
            const data = await storage.get(dbStore, storeName);
            if (data !== undefined) {
                state[storeName] = data;
            }
        } catch (error) {
            console.error(`Failed to export ${storeName}:`, error);
        }
    }

    return state;
}

/**
 * Import persisted state from backup
 */
export async function importPersistedState(state: Record<string, unknown>): Promise<void> {
    for (const [storeName, data] of Object.entries(state)) {
        const dbStore = STORE_MAPPING[storeName];
        if (dbStore && data !== undefined) {
            try {
                await storage.set(dbStore, storeName, data);
            } catch (error) {
                console.error(`Failed to import ${storeName}:`, error);
            }
        }
    }
}
