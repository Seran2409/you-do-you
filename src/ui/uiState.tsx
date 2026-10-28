import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { TodoTab } from '../game/rules';
import type { DayKey, RoutineScope } from '../game/types';

/** View state that survives switching tabs (like the prototype's UI object). */
interface UiState {
  todoTab: TodoTab;
  /** a day inside the period shown in week/month/year; null = current */
  todoCursor: DayKey | null;
  showDone: boolean;
  showPlanned: boolean;
  routScope: RoutineScope;
  expanded: Set<string>;
  set(patch: Partial<Omit<UiState, 'set' | 'toggleExpanded'>>): void;
  toggleExpanded(id: string): void;
}

const Ctx = createContext<UiState | null>(null);

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState({
    todoTab: 'aktuell' as TodoTab,
    todoCursor: null as DayKey | null,
    showDone: false,
    showPlanned: false,
    routScope: 'tag' as RoutineScope,
    expanded: new Set<string>(),
  });
  const value = useMemo<UiState>(
    () => ({
      ...s,
      set: (patch) => setS((x) => ({ ...x, ...patch })),
      toggleExpanded: (id) =>
        setS((x) => {
          const e = new Set(x.expanded);
          if (e.has(id)) e.delete(id);
          else e.add(id);
          return { ...x, expanded: e };
        }),
    }),
    [s],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): UiState {
  const s = useContext(Ctx);
  if (!s) throw new Error('useUi outside UiStateProvider');
  return s;
}
