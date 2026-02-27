/**
 * Unit tests for IndexedDB storage wrapper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    IndexedDBError,
    QuotaExceededError,
    DatabaseUnavailableError,
    get,
    set,
    remove,
    clear,
    getAllKeys,
    getAll,
    isAvailable,
    deleteDatabase,
    resetDatabaseConnection,
    localStorageFallback,
    createHybridStorage,
    type StoreName,
} from '../../src/lib/storage/indexeddb';

describe('IndexedDB Error Classes', () => {
    describe('IndexedDBError', () => {
        it('should create error with message', () => {
            const error = new IndexedDBError('Test error');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(IndexedDBError);
            expect(error.name).toBe('IndexedDBError');
            expect(error.message).toBe('Test error');
            expect(error.originalError).toBeUndefined();
        });

        it('should create error with original error', () => {
            const originalError = new Error('Original');
            const error = new IndexedDBError('Test error', originalError);
            expect(error.originalError).toBe(originalError);
        });
    });

    describe('QuotaExceededError', () => {
        it('should create error with default message', () => {
            const error = new QuotaExceededError();
            expect(error).toBeInstanceOf(IndexedDBError);
            expect(error.name).toBe('QuotaExceededError');
            expect(error.message).toBe('Storage quota exceeded');
        });

        it('should create error with custom message', () => {
            const error = new QuotaExceededError('Custom message');
            expect(error.message).toBe('Custom message');
        });

        it('should create error with original error', () => {
            const originalError = new Error('Original');
            const error = new QuotaExceededError('Custom', originalError);
            expect(error.originalError).toBe(originalError);
        });
    });

    describe('DatabaseUnavailableError', () => {
        it('should create error with default message', () => {
            const error = new DatabaseUnavailableError();
            expect(error).toBeInstanceOf(IndexedDBError);
            expect(error.name).toBe('DatabaseUnavailableError');
            expect(error.message).toBe('IndexedDB is not available');
        });

        it('should create error with custom message', () => {
            const error = new DatabaseUnavailableError('Custom message');
            expect(error.message).toBe('Custom message');
        });

        it('should create error with original error', () => {
            const originalError = new Error('Original');
            const error = new DatabaseUnavailableError('Custom', originalError);
            expect(error.originalError).toBe(originalError);
        });
    });
});

describe('localStorageFallback', () => {
    let store: Record<string, string>;

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] ?? null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
            length: 0,
            key: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('get', () => {
        it('should return undefined for non-existent key', () => {
            const result = localStorageFallback.get<string>('nonexistent');
            expect(result).toBeUndefined();
        });

        it('should return parsed value for existing key', () => {
            store['test-key'] = JSON.stringify({ name: 'test' });
            const result = localStorageFallback.get<{ name: string }>('test-key');
            expect(result).toEqual({ name: 'test' });
        });

        it('should return undefined on JSON parse error', () => {
            store['invalid'] = 'not json';
            const result = localStorageFallback.get('invalid');
            expect(result).toBeUndefined();
        });

        it('should handle primitive values', () => {
            store['number'] = JSON.stringify(42);
            const result = localStorageFallback.get<number>('number');
            expect(result).toBe(42);
        });

        it('should handle arrays', () => {
            store['array'] = JSON.stringify([1, 2, 3]);
            const result = localStorageFallback.get<number[]>('array');
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe('set', () => {
        it('should store value as JSON', () => {
            localStorageFallback.set('test-key', { value: 42 });
            expect(store['test-key']).toBe(JSON.stringify({ value: 42 }));
        });

        it('should store primitive values', () => {
            localStorageFallback.set('string', 'hello');
            expect(store['string']).toBe(JSON.stringify('hello'));
        });

        it('should throw QuotaExceededError on QuotaExceededError DOMException', () => {
            const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
            vi.mocked(localStorage.setItem).mockImplementation(() => {
                throw quotaError;
            });

            expect(() => localStorageFallback.set('key', 'value')).toThrow(QuotaExceededError);
        });

        it('should throw QuotaExceededError on Firefox NS_ERROR_DOM_QUOTA_REACHED', () => {
            // Firefox uses a different error name - but it must be a DOMException
            const quotaError = new DOMException('Quota exceeded', 'NS_ERROR_DOM_QUOTA_REACHED');
            vi.mocked(localStorage.setItem).mockImplementation(() => {
                throw quotaError;
            });

            expect(() => localStorageFallback.set('key', 'value')).toThrow(QuotaExceededError);
        });

        it('should rethrow non-quota errors', () => {
            const otherError = new Error('Other error');
            vi.mocked(localStorage.setItem).mockImplementation(() => {
                throw otherError;
            });

            expect(() => localStorageFallback.set('key', 'value')).toThrow('Other error');
        });
    });

    describe('remove', () => {
        it('should remove item from localStorage', () => {
            store['test-key'] = 'value';
            localStorageFallback.remove('test-key');
            expect(store['test-key']).toBeUndefined();
        });

        it('should not throw when removing non-existent key', () => {
            expect(() => localStorageFallback.remove('nonexistent')).not.toThrow();
        });
    });

    describe('clear', () => {
        it('should clear localStorage', () => {
            store['key1'] = 'value1';
            store['key2'] = 'value2';
            localStorageFallback.clear();
            expect(Object.keys(store)).toHaveLength(0);
        });
    });
});

describe('createHybridStorage', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        resetDatabaseConnection();
    });

    it('should create storage with default options', () => {
        const storage = createHybridStorage();
        expect(storage).toBeDefined();
        expect(storage.isUsingIndexedDB()).toBe(true);
    });

    it('should create storage with custom options', () => {
        const storage = createHybridStorage({
            useFallback: false,
            fallbackPrefix: 'custom-',
        });
        expect(storage).toBeDefined();
        expect(storage.isUsingIndexedDB()).toBe(true);
    });

    it('should have all required methods', () => {
        const storage = createHybridStorage();
        expect(typeof storage.get).toBe('function');
        expect(typeof storage.set).toBe('function');
        expect(typeof storage.remove).toBe('function');
        expect(typeof storage.clear).toBe('function');
        expect(typeof storage.isUsingIndexedDB).toBe('function');
    });
});

describe('IndexedDB Operations (unavailable scenarios)', () => {
    beforeEach(() => {
        vi.stubGlobal('indexedDB', undefined);
        resetDatabaseConnection();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        resetDatabaseConnection();
    });

    describe('isAvailable', () => {
        it('should return false when IndexedDB is not available', async () => {
            const result = await isAvailable();
            expect(result).toBe(false);
        });
    });

    describe('get', () => {
        it('should throw DatabaseUnavailableError when IndexedDB is not available', async () => {
            await expect(get('user-code', 'test-key')).rejects.toThrow(DatabaseUnavailableError);
        });
    });

    describe('set', () => {
        it('should throw DatabaseUnavailableError when IndexedDB is not available', async () => {
            await expect(set('user-code', 'test-key', 'value')).rejects.toThrow(
                DatabaseUnavailableError
            );
        });
    });

    describe('remove', () => {
        it('should throw DatabaseUnavailableError when IndexedDB is not available', async () => {
            await expect(remove('user-code', 'test-key')).rejects.toThrow(DatabaseUnavailableError);
        });
    });

    describe('clear', () => {
        it('should throw DatabaseUnavailableError when IndexedDB is not available', async () => {
            await expect(clear('user-code')).rejects.toThrow(DatabaseUnavailableError);
        });
    });

    describe('getAllKeys', () => {
        it('should throw DatabaseUnavailableError when IndexedDB is not available', async () => {
            await expect(getAllKeys('user-code')).rejects.toThrow(DatabaseUnavailableError);
        });
    });

    describe('getAll', () => {
        it('should throw DatabaseUnavailableError when IndexedDB is not available', async () => {
            await expect(getAll('user-code')).rejects.toThrow(DatabaseUnavailableError);
        });
    });

    describe('deleteDatabase', () => {
        it('should throw DatabaseUnavailableError when IndexedDB is not available', async () => {
            await expect(deleteDatabase()).rejects.toThrow(DatabaseUnavailableError);
        });
    });
});

describe('resetDatabaseConnection', () => {
    it('should reset the database connection without throwing', () => {
        expect(() => resetDatabaseConnection()).not.toThrow();
    });

    it('should allow multiple calls', () => {
        expect(() => {
            resetDatabaseConnection();
            resetDatabaseConnection();
            resetDatabaseConnection();
        }).not.toThrow();
    });
});

describe('StoreName type', () => {
    it('should accept valid store names', () => {
        const validStores: StoreName[] = [
            'user-code',
            'user-progress',
            'user-settings',
            'app-state',
        ];
        expect(validStores).toHaveLength(4);
    });
});

describe('Error inheritance', () => {
    it('QuotaExceededError should be instance of IndexedDBError', () => {
        const error = new QuotaExceededError();
        expect(error instanceof IndexedDBError).toBe(true);
        expect(error instanceof Error).toBe(true);
    });

    it('DatabaseUnavailableError should be instance of IndexedDBError', () => {
        const error = new DatabaseUnavailableError();
        expect(error instanceof IndexedDBError).toBe(true);
        expect(error instanceof Error).toBe(true);
    });
});
