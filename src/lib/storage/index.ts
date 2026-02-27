/**
 * Storage module exports
 * IndexedDB-based persistence with localStorage fallback
 */

// Core IndexedDB operations
export {
    get,
    set,
    remove,
    clear,
    getAllKeys,
    getAll,
    isAvailable,
    deleteDatabase,
    resetDatabaseConnection,
    storage,
    createHybridStorage,
    localStorageFallback,
    IndexedDBError,
    QuotaExceededError,
    DatabaseUnavailableError,
    type StoreName,
    type StorageOptions,
} from './indexeddb';

// Zustand persist adapters
export {
    createIndexedDBStorage,
    createHybridStorage as createHybridZustandStorage,
    editorStorage,
    settingsStorage,
    tutorialStorage,
    interpreterStorage,
    clearStoreData,
    clearAllPersistedData,
    exportPersistedState,
    importPersistedState,
} from './zustand-adapter';
