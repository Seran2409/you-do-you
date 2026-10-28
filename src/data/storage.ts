/*
 * Web store on IndexedDB (expo-sqlite on web needs COOP/COEP headers that GitHub Pages cannot send).
 * Native platforms resolve storage.native.ts instead.
 */
import type { AppData } from '../game/types';
import { assemble, documents, type Collection, type LocalStore } from './storage.types';

const DB_NAME = 'youdoyou';
const STORE = 'docs';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

const key = (col: Collection, id: string) => col + '/' + id;

export const localStore: LocalStore = {
  async load() {
    if (typeof indexedDB === 'undefined') return null;
    const rows = ((await tx('readonly', (s) => s.getAll())) || []) as { col: Collection; id: string; doc: unknown }[];
    return assemble(rows);
  },
  async put(col, id, doc) {
    await tx('readwrite', (s) => s.put({ key: key(col, id), col, id, doc, updatedAt: Date.now() }));
  },
  async remove(col, id) {
    await tx('readwrite', (s) => s.delete(key(col, id)));
  },
  async replaceAll(data: AppData) {
    const now = Date.now();
    await tx('readwrite', (s) => {
      s.clear();
      for (const d of documents(data)) s.put({ key: key(d.col, d.id), ...d, updatedAt: now });
    });
  },
};
