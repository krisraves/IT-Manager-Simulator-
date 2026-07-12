import type { GameState } from './types';

const DATABASE_NAME = 'it-manager-simulator';
const STORE_NAME = 'saves';
const SAVE_KEY = 'autosave';

export class SaveStore {
  public async save(state: GameState): Promise<void> {
    try {
      const database = await this.openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(state, SAVE_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB save failed.'));
      });
      database.close();
    } catch (error) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (!(error instanceof DOMException)) console.warn('IndexedDB unavailable; used localStorage fallback.', error);
    }
  }

  public async load(): Promise<GameState | null> {
    try {
      const database = await this.openDatabase();
      const state = await new Promise<GameState | null>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(SAVE_KEY);
        request.onsuccess = () => resolve((request.result as GameState | undefined) ?? null);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB load failed.'));
      });
      database.close();
      return state;
    } catch {
      const fallback = localStorage.getItem(SAVE_KEY);
      if (!fallback) return null;
      return JSON.parse(fallback) as GameState;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB.'));
    });
  }
}
