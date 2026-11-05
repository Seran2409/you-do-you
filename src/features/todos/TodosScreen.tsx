import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { addDays, daysLeft, periodKey, shiftPeriod } from '../../game/dates';
import { TODO_TABS } from '../../game/rules';
import { aktuellLists, periodLists, periodTally } from '../../game/todos';
import { periodLabel, SEP } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { useSheet } from '../../ui/overlays';
import { Button, Empty, OverviewTabs, SummaryCard } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { Screen } from '../shell/Shell';
import { PeriodNav, TodoForm } from './sheets';
import { TodoCard } from './TodoCard';

export function Collapser({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      aria-expanded={open}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 2, alignSelf: 'flex-start' }}
    >
      <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
        <Icon name="chev" size={16} color={c.muted} />
      </View>
      <T v="smallBold" muted>
        {label}
      </T>
    </Pressable>
  );
}

export default function TodosScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, today } = useStore();
  const ui = useUi();
  const sheet = useSheet();
  const tab = ui.todoTab;
  const cursor = ui.todoCursor ?? today;
  const openForm = () => sheet.open((cl) => <TodoForm id={null} close={cl} />, t('todoForm.newTitle'));

  // Each tile shows the list as it is today (Now) or in the current week, month and year.
  const tiles = TODO_TABS.map((k) => {
    const l = k === 'aktuell' ? aktuellLists(data.todos, today) : periodLists(data.todos, k, periodKey(k, today)!);
    return { key: k, label: t(`todos.tab.${k}`), done: l.done.length, total: l.open.length + l.done.length };
  });

  const lists = tab === 'aktuell' ? aktuellLists(data.todos, today) : periodLists(data.todos, tab, periodKey(tab, cursor)!);
  const all = [...lists.open, ...lists.done];
  const listName = t(`todos.listName.${tab}`);
  const isCurrent = tab !== 'aktuell' && periodKey(tab, cursor) === periodKey(tab, today);
  const pct = all.length ? (lists.done.length / all.length) * 100 : 0;
  // Summary like Routines: this list now, and the period before (Now looks back at yesterday's day to-dos).
  const nowName = tab === 'aktuell' ? listName : isCurrent ? t(`routines.nowName.${tab}`) : periodLabel(tab, cursor, today);
  const prevScope = tab === 'aktuell' ? 'tag' : tab;
  const prevDay = tab === 'aktuell' ? addDays(today, -1) : shiftPeriod(tab, cursor, -1);
  const prev = periodTally(data.todos, prevScope, periodKey(prevScope, prevDay)!);
  const prevName = tab === 'aktuell' || isCurrent ? t(`routines.prevName.${prevScope}`) : periodLabel(tab, prevDay, today);
  const lookback = prev.total ? t('todos.lookback', { name: prevName, done: prev.done, total: prev.total }) : t('todos.lookbackNone', { name: prevName });

  return (
    <Screen fab={{ label: t('todos.fab'), a11y: t('todos.fabLabel'), onPress: openForm }}>
      <View style={{ gap: 10 }}>
        <T v="h1" accessibilityRole="header">
          {t('todos.title')}
        </T>
        <OverviewTabs
          title={t('todos.overallTitle')}
          label={t('todos.pickList')}
          sum={(done, total) => t('routines.overallSum', { met: done, total })}
          value={tab}
          onChange={(k) => ui.set({ todoTab: k, todoCursor: null, showDone: false, showPlanned: false })}
          tabs={tiles}
        />
        {tab === 'aktuell' ? (
          <T v="small" muted>
            {t('todos.nowIntro')}
          </T>
        ) : (
          <PeriodNav
            label={periodLabel(tab, cursor, today)}
            prevLabel={t('todos.prevPeriod')}
            nextLabel={t('todos.nextPeriod')}
            onPrev={() => ui.set({ todoCursor: shiftPeriod(tab, cursor, -1) })}
            onNext={() => ui.set({ todoCursor: shiftPeriod(tab, cursor, 1) })}
            sub={
              isCurrent ? (
                <T v="tiny" muted>
                  {t('todos.current', { count: daysLeft(tab, today) })}
                </T>
              ) : (
                <Pressable onPress={() => ui.set({ todoCursor: null })} accessibilityRole="button" hitSlop={8}>
                  <T v="tiny" color={c.accent} style={{ fontFamily: fonts.bodyBold, textDecorationLine: 'underline' }}>
                    {t('todos.backToNow')}
                  </T>
                </Pressable>
              )
            }
          />
        )}
      </View>

      {!all.length ? (
        <Empty
          title={tab === 'aktuell' ? listName : `${t(`todos.tab.${tab}`)}${SEP}${periodLabel(tab, cursor, today)}`}
          text={tab === 'aktuell' ? t('todos.emptyNow') : t('todos.emptyPeriod')}
        >
          <Button small icon="plus" label={t('todos.newTodo')} onPress={openForm} />
        </Empty>
      ) : (
        <View style={{ gap: 10 }}>
          {lists.open.map((x) => (
            <TodoCard key={x.id} todo={x} />
          ))}
          {!lists.open.length ? (
            <T v="small" muted>
              {t('todos.allDoneList')}
            </T>
          ) : null}
        </View>
      )}

      {lists.planned.length ? (
        <View style={{ gap: 10 }}>
          <Collapser label={t('todos.planned', { count: lists.planned.length })} open={ui.showPlanned} onToggle={() => ui.set({ showPlanned: !ui.showPlanned })} />
          {ui.showPlanned ? lists.planned.map((x) => <TodoCard key={x.id} todo={x} />) : null}
        </View>
      ) : null}
      {lists.done.length ? (
        <View style={{ gap: 10 }}>
          <Collapser label={t('todos.done', { count: lists.done.length })} open={ui.showDone} onToggle={() => ui.set({ showDone: !ui.showDone })} />
          {ui.showDone ? lists.done.map((x) => <TodoCard key={x.id} todo={x} />) : null}
        </View>
      ) : null}
      {/* Like Routines: the summary and the look back come after the list. */}
      {all.length ? (
        <SummaryCard
          pct={pct}
          title={lists.done.length === all.length ? t('todos.progressAll') : t('todos.summary', { name: nowName, done: lists.done.length, total: all.length })}
          sub={lookback}
        />
      ) : null}
    </Screen>
  );
}
