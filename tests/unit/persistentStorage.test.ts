import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPersistentStorage } from '@/lib/storage/persistentStorage';

/** Minimal in-memory Storage (Node's own experimental localStorage shadows jsdom's). */
function memoryStorage(): Storage {
    const data = new Map<string, string>();
    return {
        get length() {
            return data.size;
        },
        clear: () => data.clear(),
        getItem: (key: string) => data.get(key) ?? null,
        key: (index: number) => [...data.keys()][index] ?? null,
        removeItem: (key: string) => void data.delete(key),
        setItem: (key: string, value: string) => void data.set(key, value),
    };
}

describe('persistentStorage', () => {
    let backing: Storage;

    beforeEach(() => {
        backing = memoryStorage();
        vi.stubGlobal('localStorage', backing);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('coalesces writes made in quick succession', () => {
        const spy = vi.spyOn(backing, 'setItem');
        const storage = createPersistentStorage(100);
        storage.setItem('k', '1');
        storage.setItem('k', '2');
        storage.setItem('k', '3');
        expect(spy).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('k')).toBe('3');
        spy.mockRestore();
    });

    it('returns a value that has not been written yet', () => {
        const storage = createPersistentStorage(100);
        storage.setItem('k', 'fresh');
        expect(storage.getItem('k')).toBe('fresh');
    });

    it('flushes on demand', () => {
        const storage = createPersistentStorage(10_000);
        storage.setItem('k', 'v');
        storage.flush();
        expect(localStorage.getItem('k')).toBe('v');
    });

    it('reads data written by earlier versions', () => {
        localStorage.setItem('tutorial-storage:tutorial-storage', '{"state":{}}');
        const storage = createPersistentStorage(100);
        expect(storage.getItem('tutorial-storage')).toBe('{"state":{}}');
    });

    it('removes items', () => {
        const storage = createPersistentStorage(100);
        storage.setItem('k', 'v');
        storage.flush();
        storage.removeItem('k');
        expect(storage.getItem('k')).toBeNull();
    });
});
