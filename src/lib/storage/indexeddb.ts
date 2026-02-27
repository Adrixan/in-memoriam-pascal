/**
 * IndexedDB Storage Wrapper
 * Provides type-safe CRUD operations with error handling and localStorage fallback
 */

const DB_NAME = 'in-memoriam-pascal';
const DB_VERSION = 1;

/** Storage store names */
export type StoreName = 'user-code' | 'user-progress' | 'user-settings' | 'app-state';

/** Error types for IndexedDB operations */
export class IndexedDBError extends Error {
    /** Original error that caused this error */
    readonly originalError: unknown | undefined;

    constructor(message: string, originalError?: unknown) {
        super(message);
        this.name = 'IndexedDBError';
        this.originalError = originalError;
    }
}

/** Quota exceeded error */
export class QuotaExceededError extends IndexedDBError {
    constructor(message = 'Storage quota exceeded', originalError?: unknown) {
        super(message, originalError);
        this.name = 'QuotaExceededError';
    }
}

/** Database not available error */
export class DatabaseUnavailableError extends IndexedDBError {
    constructor(message = 'IndexedDB is not available', originalError?: unknown) {
        super(message, originalError);
        this.name = 'DatabaseUnavailableError';
    }
}

/** Check if IndexedDB is available */
function isIndexedDBAvailable(): boolean {
    try {
        return (
            typeof indexedDB !== 'undefined' &&
            indexedDB !== null &&
            typeof indexedDB.open === 'function'
        );
    } catch {
        return false;
    }
}

/** Check if error is a quota exceeded error */
function isQuotaError(error: unknown): boolean {
    if (error instanceof DOMException) {
        return (
            error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED' // Firefox
        );
    }
    return false;
}

/** Promise-based IDBRequest wrapper */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Open database and create object stores */
async function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new DatabaseUnavailableError('Failed to open database', request.error));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // User code store - stores code per level
            if (!db.objectStoreNames.contains('user-code')) {
                db.createObjectStore('user-code', { keyPath: 'levelId' });
            }

            // User progress store - stores completion status, scores, hints
            if (!db.objectStoreNames.contains('user-progress')) {
                const progressStore = db.createObjectStore('user-progress', {
                    keyPath: 'id',
                });
                progressStore.createIndex('by-lastActive', 'lastActiveAt', {
                    unique: false,
                });
            }

            // User settings store - theme, language, preferences
            if (!db.objectStoreNames.contains('user-settings')) {
                db.createObjectStore('user-settings', { keyPath: 'id' });
            }

            // Generic app state store
            if (!db.objectStoreNames.contains('app-state')) {
                db.createObjectStore('app-state', { keyPath: 'key' });
            }
        };
    });
}

/** Database connection singleton */
let dbPromise: Promise<IDBDatabase> | null = null;

/** Get database connection (singleton) */
async function getDatabase(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = openDatabase();
    }
    return dbPromise;
}

/** Reset database connection (for testing) */
export function resetDatabaseConnection(): void {
    dbPromise = null;
}

/**
 * Get a value from a store
 * @param storeName - The object store name
 * @param key - The key to look up
 * @returns The value or undefined if not found
 */
export async function get<T>(storeName: StoreName, key: string): Promise<T | undefined> {
    if (!isIndexedDBAvailable()) {
        throw new DatabaseUnavailableError();
    }

    try {
        const db = await getDatabase();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const result = await promisifyRequest(store.get(key));

        // Handle stored objects with value property
        if (result && typeof result === 'object' && 'value' in result) {
            return result.value as T;
        }
        return result as T | undefined;
    } catch (error) {
        if (error instanceof IndexedDBError) {
            throw error;
        }
        throw new IndexedDBError(`Failed to get value from ${storeName}`, error);
    }
}

/**
 * Set a value in a store
 * @param storeName - The object store name
 * @param key - The key to set
 * @param value - The value to store
 */
export async function set<T>(storeName: StoreName, key: string, value: T): Promise<void> {
    if (!isIndexedDBAvailable()) {
        throw new DatabaseUnavailableError();
    }

    try {
        const db = await getDatabase();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // Store in format that works with keyPath
        const record = {
            key,
            value,
            updatedAt: new Date().toISOString(),
        };

        // Handle special keyPath for each store
        if (storeName === 'user-code') {
            await promisifyRequest(
                store.put({
                    levelId: key,
                    code: value,
                    updatedAt: record.updatedAt,
                })
            );
        } else if (storeName === 'user-settings') {
            await promisifyRequest(
                store.put({
                    id: key,
                    value,
                    updatedAt: record.updatedAt,
                })
            );
        } else if (storeName === 'user-progress') {
            await promisifyRequest(
                store.put({
                    id: key,
                    value,
                    updatedAt: record.updatedAt,
                })
            );
        } else {
            await promisifyRequest(store.put(record));
        }

        // Wait for transaction to complete
        await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        if (isQuotaError(error)) {
            throw new QuotaExceededError('Storage quota exceeded', error);
        }
        if (error instanceof IndexedDBError) {
            throw error;
        }
        throw new IndexedDBError(`Failed to set value in ${storeName}`, error);
    }
}

/**
 * Delete a value from a store
 * @param storeName - The object store name
 * @param key - The key to delete
 */
export async function remove(storeName: StoreName, key: string): Promise<void> {
    if (!isIndexedDBAvailable()) {
        throw new DatabaseUnavailableError();
    }

    try {
        const db = await getDatabase();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        await promisifyRequest(store.delete(key));

        // Wait for transaction to complete
        await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        if (error instanceof IndexedDBError) {
            throw error;
        }
        throw new IndexedDBError(`Failed to delete value from ${storeName}`, error);
    }
}

/**
 * Clear all values from a store
 * @param storeName - The object store name
 */
export async function clear(storeName: StoreName): Promise<void> {
    if (!isIndexedDBAvailable()) {
        throw new DatabaseUnavailableError();
    }

    try {
        const db = await getDatabase();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        await promisifyRequest(store.clear());

        // Wait for transaction to complete
        await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        if (error instanceof IndexedDBError) {
            throw error;
        }
        throw new IndexedDBError(`Failed to clear ${storeName}`, error);
    }
}

/**
 * Get all keys from a store
 * @param storeName - The object store name
 * @returns Array of keys
 */
export async function getAllKeys(storeName: StoreName): Promise<string[]> {
    if (!isIndexedDBAvailable()) {
        throw new DatabaseUnavailableError();
    }

    try {
        const db = await getDatabase();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        const keys = await promisifyRequest(store.getAllKeys());
        return keys as string[];
    } catch (error) {
        if (error instanceof IndexedDBError) {
            throw error;
        }
        throw new IndexedDBError(`Failed to get keys from ${storeName}`, error);
    }
}

/**
 * Get all values from a store
 * @param storeName - The object store name
 * @returns Array of values
 */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
    if (!isIndexedDBAvailable()) {
        throw new DatabaseUnavailableError();
    }

    try {
        const db = await getDatabase();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        const results = await promisifyRequest(store.getAll());

        // Extract values from stored records
        return results.map((result: unknown) => {
            if (result && typeof result === 'object' && 'value' in result) {
                return (result as { value: T }).value;
            }
            return result as T;
        });
    } catch (error) {
        if (error instanceof IndexedDBError) {
            throw error;
        }
        throw new IndexedDBError(`Failed to get all values from ${storeName}`, error);
    }
}

/**
 * Check if IndexedDB is available and working
 * @returns true if IndexedDB is available
 */
export async function isAvailable(): Promise<boolean> {
    if (!isIndexedDBAvailable()) {
        return false;
    }

    try {
        await getDatabase();
        return true;
    } catch {
        return false;
    }
}

/**
 * Delete the entire database
 */
export async function deleteDatabase(): Promise<void> {
    if (!isIndexedDBAvailable()) {
        throw new DatabaseUnavailableError();
    }

    // Reset connection first
    resetDatabaseConnection();

    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);

        request.onsuccess = () => resolve();
        request.onerror = () =>
            reject(new IndexedDBError('Failed to delete database', request.error));
        request.onblocked = () => {
            // Database is blocked, but we can still resolve
            // as the delete will happen when connections close
            resolve();
        };
    });
}

// ============================================
// LocalStorage Fallback
// ============================================

/** LocalStorage fallback implementation */
export const localStorageFallback = {
    get: <T>(key: string): T | undefined => {
        try {
            const item = localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : undefined;
        } catch {
            return undefined;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            if (isQuotaError(error)) {
                throw new QuotaExceededError('localStorage quota exceeded', error);
            }
            throw error;
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore errors on removal
        }
    },

    clear: (): void => {
        try {
            localStorage.clear();
        } catch {
            // Ignore errors on clear
        }
    },
};

// ============================================
// Hybrid Storage (IndexedDB with localStorage fallback)
// ============================================

/** Storage options */
export interface StorageOptions {
    /** Use localStorage as fallback if IndexedDB unavailable */
    useFallback?: boolean;
    /** Prefix for localStorage keys */
    fallbackPrefix?: string;
}

const DEFAULT_OPTIONS: StorageOptions = {
    useFallback: true,
    fallbackPrefix: 'imp-',
};

/**
 * Hybrid storage that uses IndexedDB with localStorage fallback
 */
export function createHybridStorage(options: StorageOptions = DEFAULT_OPTIONS) {
    const { useFallback, fallbackPrefix } = { ...DEFAULT_OPTIONS, ...options };
    let useIndexedDB = true;

    return {
        /**
         * Get a value from storage
         */
        async get<T>(storeName: StoreName, key: string): Promise<T | undefined> {
            if (useIndexedDB) {
                try {
                    return await get<T>(storeName, key);
                } catch (error) {
                    if (error instanceof DatabaseUnavailableError && useFallback) {
                        useIndexedDB = false;
                        return localStorageFallback.get<T>(`${fallbackPrefix}${storeName}:${key}`);
                    }
                    throw error;
                }
            }

            if (useFallback) {
                return localStorageFallback.get<T>(`${fallbackPrefix}${storeName}:${key}`);
            }

            throw new DatabaseUnavailableError();
        },

        /**
         * Set a value in storage
         */
        async set<T>(storeName: StoreName, key: string, value: T): Promise<void> {
            if (useIndexedDB) {
                try {
                    return await set(storeName, key, value);
                } catch (error) {
                    if (error instanceof DatabaseUnavailableError && useFallback) {
                        useIndexedDB = false;
                        localStorageFallback.set(`${fallbackPrefix}${storeName}:${key}`, value);
                        return;
                    }
                    throw error;
                }
            }

            if (useFallback) {
                localStorageFallback.set(`${fallbackPrefix}${storeName}:${key}`, value);
                return;
            }

            throw new DatabaseUnavailableError();
        },

        /**
         * Delete a value from storage
         */
        async remove(storeName: StoreName, key: string): Promise<void> {
            if (useIndexedDB) {
                try {
                    return await remove(storeName, key);
                } catch (error) {
                    if (error instanceof DatabaseUnavailableError && useFallback) {
                        useIndexedDB = false;
                        localStorageFallback.remove(`${fallbackPrefix}${storeName}:${key}`);
                        return;
                    }
                    throw error;
                }
            }

            if (useFallback) {
                localStorageFallback.remove(`${fallbackPrefix}${storeName}:${key}`);
                return;
            }

            throw new DatabaseUnavailableError();
        },

        /**
         * Clear all values from a store
         */
        async clear(storeName: StoreName): Promise<void> {
            if (useIndexedDB) {
                try {
                    return await clear(storeName);
                } catch (error) {
                    if (error instanceof DatabaseUnavailableError && useFallback) {
                        useIndexedDB = false;
                        // Clear localStorage keys with this prefix
                        const prefix = `${fallbackPrefix}${storeName}:`;
                        Object.keys(localStorage)
                            .filter((k) => k.startsWith(prefix))
                            .forEach((k) => localStorage.removeItem(k));
                        return;
                    }
                    throw error;
                }
            }

            if (useFallback) {
                const prefix = `${fallbackPrefix}${storeName}:`;
                Object.keys(localStorage)
                    .filter((k) => k.startsWith(prefix))
                    .forEach((k) => localStorage.removeItem(k));
                return;
            }

            throw new DatabaseUnavailableError();
        },

        /**
         * Check if using IndexedDB or fallback
         */
        isUsingIndexedDB(): boolean {
            return useIndexedDB;
        },
    };
}

// Default hybrid storage instance
export const storage = createHybridStorage();
