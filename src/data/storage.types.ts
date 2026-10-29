import type { AppData } from '../game/types';

export type Collection = 'settings' | 'todos' | 'routines' | 'days' | 'sessions';
export const SETTINGS_ID = 'main';

/**
 * Local-first document store. One document per to-do / routine / day, plus settings/main.
 * Every write records updated_at so the sync in phase 2 can do "last change wins" per document.
 */
export interface LocalStore {
  load(): Promise<AppData | null>;
  put(col: Collection, id: string, doc: unknown): Promise<void>;
  remove(col: Collection, id: string): Promise<void>;
  replaceAll(data: AppData): Promise<void>;
}

/** Turn rows of a store into AppData (null when nothing was ever saved). */
export function assemble(rows: { col: Collection; id: string; doc: unknown }[]): AppData | null {
  if (!rows.length) return null;
  const data: { settings: unknown } & Record<Exclude<Collection, 'settings'>, Record<string, unknown>> = { settings: null, todos: {}, routines: {}, days: {}, sessions: {} };
  for (const r of rows) {
    if (r.col === 'settings') data.settings = r.doc;
    else data[r.col][r.id] = r.col === 'days' ? r.doc : { ...(r.doc as object), id: r.id };
  }
  // The documents were written by this app, so they already have the AppData shape.
  return data as unknown as AppData;
}

/** Flatten AppData into documents for replaceAll. */
export function documents(data: AppData): { col: Collection; id: string; doc: unknown }[] {
  const out: { col: Collection; id: string; doc: unknown }[] = [{ col: 'settings', id: SETTINGS_ID, doc: data.settings }];
  for (const col of ['todos', 'routines', 'days', 'sessions'] as const) {
    for (const [id, doc] of Object.entries(data[col])) out.push({ col, id, doc });
  }
  return out;
}
