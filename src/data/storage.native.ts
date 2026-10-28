/* Android/iOS store on SQLite. Same documents as the web store. */
import * as SQLite from 'expo-sqlite';
import type { AppData } from '../game/types';
import { assemble, documents, type Collection, type LocalStore } from './storage.types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('youdoyou.db').then(async (d) => {
      await d.execAsync(
        'PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS docs (col TEXT NOT NULL, id TEXT NOT NULL, doc TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (col, id));',
      );
      return d;
    });
  }
  return dbPromise;
}

export const localStore: LocalStore = {
  async load() {
    const rows = await (await db()).getAllAsync<{ col: Collection; id: string; doc: string }>('SELECT col, id, doc FROM docs');
    return assemble(rows.map((r) => ({ col: r.col, id: r.id, doc: JSON.parse(r.doc) })));
  },
  async put(col, id, doc) {
    await (await db()).runAsync(
      'INSERT OR REPLACE INTO docs (col, id, doc, updated_at) VALUES (?, ?, ?, ?)',
      col,
      id,
      JSON.stringify(doc),
      Date.now(),
    );
  },
  async remove(col, id) {
    await (await db()).runAsync('DELETE FROM docs WHERE col = ? AND id = ?', col, id);
  },
  async replaceAll(data: AppData) {
    const d = await db();
    const now = Date.now();
    await d.withTransactionAsync(async () => {
      await d.runAsync('DELETE FROM docs');
      for (const x of documents(data)) {
        await d.runAsync('INSERT INTO docs (col, id, doc, updated_at) VALUES (?, ?, ?, ?)', x.col, x.id, JSON.stringify(x.doc), now);
      }
    });
  },
};
