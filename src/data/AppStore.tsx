import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { compute, type Stats } from '../game/compute';
import { todayKey } from '../game/dates';
import * as M from '../game/mutations';
import { DEFAULT_GOAL, DEFAULT_MINDFUL_GOAL, MAX_GOAL } from '../game/rules';
import type { AppData, Day, Routine, Session, Settings, Todo } from '../game/types';
import i18n from '../i18n';
import { emit } from './feedback';
import { defaultSettings, emptyAppData, normalizeImport, toExport } from './schema';
import { localStore } from './storage';
import { SETTINGS_ID, type Collection } from './storage.types';

export type TodoDraft = Omit<Todo, 'id' | 'createdAt' | 'order' | 'done' | 'doneOn'> & Partial<Pick<Todo, 'done' | 'doneOn'>>;
export type RoutineDraft = Pick<Routine, 'title' | 'emoji' | 'scope' | 'target' | 'slot'>;

interface Store {
  ready: boolean;
  data: AppData;
  settings: Settings;
  today: string;
  goal: number;
  mindfulGoal: number;
  stats: Stats;
  actions: {
    toggleTodo(id: string): void;
    toggleSub(id: string, subId: string): void;
    addSub(id: string, title: string): void;
    saveTodo(id: string | null, draft: TodoDraft): void;
    moveTodoToCurrent(id: string): void;
    moveOverdueToToday(): number;
    deleteTodo(id: string): void;
    incRoutine(id: string): void;
    decRoutine(id: string): void;
    saveRoutine(id: string | null, draft: RoutineDraft): string;
    deleteRoutine(id: string): void;
    saveSettings(patch: Partial<Settings>): void;
    setGoal(goal: number): void;
    exportData(): ReturnType<typeof toExport>;
    importData(raw: unknown): Promise<void>;
    /** Deletes everything on this device and starts fresh (welcome screen included). */
    resetAll(): Promise<void>;
    /** Stores a finished (or ended early) meditation and reports XP. */
    saveSession(session: Omit<Session, 'id'>): string;
    setSessionMood(id: string, mood: number): void;
  };
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside AppStoreProvider');
  return s;
}

/** Day key of "now" in the user's time zone; re-checks every minute and when the app comes back. */
function useToday(timeZone: string | undefined): string {
  const [today, setToday] = useState(() => todayKey(timeZone));
  useEffect(() => {
    const check = () => setToday(todayKey(timeZone));
    check();
    const iv = setInterval(check, 60_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [timeZone]);
  return today;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(emptyAppData);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let alive = true;
    localStore
      .load()
      .then((loaded) => {
        if (!alive) return;
        if (loaded) setData({ ...loaded, sessions: loaded.sessions || {}, settings: { ...defaultSettings(), ...(loaded.settings || {}) } });
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const settings = data.settings;
  // Device zone for the local app; settings.timezone is kept for the server-side mail.
  const today = useToday(undefined);
  const goal = Number.isFinite(settings.dailyGoal) ? settings.dailyGoal : DEFAULT_GOAL;
  const mindfulGoal = settings.mindfulGoal ?? DEFAULT_MINDFUL_GOAL;
  const stats = useMemo(() => compute(data, today, goal, mindfulGoal), [data, today, goal, mindfulGoal]);

  const persist = useCallback((col: Collection, id: string, doc: unknown | null) => {
    const p = doc === null ? localStore.remove(col, id) : localStore.put(col, id, doc);
    p.catch(() => emit({ type: 'toast', message: i18n.t('toast.saveError'), kind: 'warn' }));
  }, []);

  /** Apply a change and report XP gained, level-ups and new badges. */
  const commit = useCallback(
    (change: (d: AppData) => { next: AppData; writes: [Collection, string, unknown | null][] } | null, withXp = true) => {
      const before = dataRef.current;
      const res = change(before);
      if (!res) return;
      dataRef.current = res.next;
      setData(res.next);
      for (const [col, id, doc] of res.writes) persist(col, id, doc);
      if (!withXp) return;
      const t = todayKey();
      const g = res.next.settings.dailyGoal || DEFAULT_GOAL;
      const mg = res.next.settings.mindfulGoal ?? DEFAULT_MINDFUL_GOAL;
      const a = compute(before, t, g, mg);
      const b = compute(res.next, t, g, mg);
      const gained = b.total - a.total;
      if (gained > 0) emit({ type: 'xp', amount: gained });
      if (b.level.level > a.level.level) emit({ type: 'levelUp', level: b.level });
      for (const k of b.unlocked) if (!a.unlocked.has(k)) emit({ type: 'badge', key: k });
    },
    [persist],
  );

  const putTodo = (d: AppData, t: Todo) => ({
    next: { ...d, todos: { ...d.todos, [t.id]: t } },
    writes: [['todos', t.id, stripId(t)]] as [Collection, string, unknown][],
  });

  const actions = useMemo<Store['actions']>(
    () => ({
      toggleTodo(id) {
        commit((d) => (d.todos[id] ? putTodo(d, M.toggleTodo(d.todos[id], todayKey())) : null));
      },
      toggleSub(id, subId) {
        commit((d) => (d.todos[id] ? putTodo(d, M.toggleSub(d.todos[id], subId, todayKey())) : null));
      },
      addSub(id, title) {
        commit((d) => (d.todos[id] && title.trim() ? putTodo(d, M.addSub(d.todos[id], title)) : null), false);
      },
      saveTodo(id, draft) {
        commit((d) => {
          const prev = id ? d.todos[id] : null;
          const t: Todo = prev
            ? { ...prev, ...draft, id: prev.id }
            : {
                ...draft,
                id: M.uid('t'),
                done: false,
                doneOn: null,
                createdAt: new Date().toISOString(),
                order: Date.now(),
              };
          // Adding new open subtasks to a done to-do reopens it.
          if (prev && t.done && t.subs.length > prev.subs.length && !t.subs.every((s) => s.done)) {
            t.done = false;
            t.doneOn = null;
          }
          return putTodo(d, t);
        });
      },
      moveTodoToCurrent(id) {
        commit((d) => (d.todos[id] ? putTodo(d, M.moveToCurrent(d.todos[id], todayKey())) : null), false);
      },
      moveOverdueToToday() {
        const t = todayKey();
        const ids = Object.values(dataRef.current.todos)
          .filter((x) => !x.archived && !x.done && x.scope === 'tag' && x.period && x.period < t)
          .map((x) => x.id);
        commit((d) => {
          const todos = { ...d.todos };
          const writes: [Collection, string, unknown][] = [];
          for (const id of ids) {
            todos[id] = { ...todos[id], period: t };
            writes.push(['todos', id, stripId(todos[id])]);
          }
          return { next: { ...d, todos }, writes };
        }, false);
        return ids.length;
      },
      deleteTodo(id) {
        commit((d) => {
          const t = d.todos[id];
          if (!t) return null;
          if (M.hasEarnedXp(t)) return putTodo(d, { ...t, archived: true });
          const { [id]: _gone, ...todos } = d.todos;
          return { next: { ...d, todos }, writes: [['todos', id, null]] };
        }, false);
      },
      incRoutine(id) {
        commit((d) => {
          const t = todayKey();
          const r = d.routines[id];
          if (!r) return null;
          const cur = d.days[t];
          // Daily routine with target 1 toggles like a checkbox.
          const day: Day | null =
            r.scope === 'tag' && Math.max(1, r.target) === 1 && (cur?.routines?.[id] || 0) > 0
              ? M.decRoutine(cur, t, id)
              : M.incRoutine(cur, t, id);
          if (!day) return null;
          return { next: { ...d, days: { ...d.days, [t]: day } }, writes: [['days', t, day]] };
        });
      },
      decRoutine(id) {
        commit((d) => {
          const t = todayKey();
          const day = M.decRoutine(d.days[t], t, id);
          if (!day) return null;
          return { next: { ...d, days: { ...d.days, [t]: day } }, writes: [['days', t, day]] };
        }, false);
      },
      saveRoutine(id, draft) {
        const newId = id || M.uid('r');
        commit((d) => {
          const prev = id ? d.routines[id] : null;
          const r: Routine = prev
            ? { ...prev, ...draft }
            : { ...draft, id: newId, createdAt: new Date().toISOString(), order: Date.now() };
          return { next: { ...d, routines: { ...d.routines, [r.id]: r } }, writes: [['routines', r.id, stripId(r)]] };
        });
        return newId;
      },
      deleteRoutine(id) {
        commit((d) => {
          const r = d.routines[id];
          if (!r) return null;
          const used = Object.values(d.days).some((x) => x.routines?.[id]);
          if (used) {
            const a = { ...r, archived: true };
            return { next: { ...d, routines: { ...d.routines, [id]: a } }, writes: [['routines', id, stripId(a)]] };
          }
          const { [id]: _gone, ...routines } = d.routines;
          return { next: { ...d, routines }, writes: [['routines', id, null]] };
        }, false);
      },
      saveSettings(patch) {
        commit((d) => {
          const s = { ...d.settings, ...patch };
          return { next: { ...d, settings: s }, writes: [['settings', SETTINGS_ID, s]] };
        });
      },
      setGoal(g) {
        actions.saveSettings({ dailyGoal: Math.min(MAX_GOAL, Math.max(1, g)) });
      },
      exportData() {
        return toExport(dataRef.current);
      },
      async importData(raw) {
        const next = normalizeImport(raw);
        await localStore.replaceAll(next);
        dataRef.current = next;
        setData(next);
      },
      saveSession(session) {
        const id = M.uid('m');
        commit((d) => {
          const s: Session = { ...session, id };
          return { next: { ...d, sessions: { ...d.sessions, [id]: s } }, writes: [['sessions', id, stripId(s)]] };
        });
        return id;
      },
      setSessionMood(id, mood) {
        commit((d) => {
          const s = d.sessions[id];
          if (!s) return null;
          const n = { ...s, moodAfter: Math.min(5, Math.max(1, Math.round(mood))) };
          return { next: { ...d, sessions: { ...d.sessions, [id]: n } }, writes: [['sessions', id, stripId(n)]] };
        }, false);
      },
      async resetAll() {
        const next = emptyAppData();
        await localStore.replaceAll(next);
        dataRef.current = next;
        setData(next);
      },
    }),
    [commit],
  );

  const value = useMemo(() => ({ ready, data, settings, today, goal, mindfulGoal, stats, actions }), [ready, data, settings, today, goal, mindfulGoal, stats, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function stripId<T extends { id: string }>(x: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = x;
  return rest;
}
