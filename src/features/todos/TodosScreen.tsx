import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { daysLeft, periodKey, shiftPeriod } from '../../game/dates';
import { TODO_TABS } from '../../game/rules';
import { aktuellLists, listProgress, openInCurrent, periodLists } from '../../game/todos';
import { periodLabel, SEP } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { useSheet } from '../../ui/overlays';
import { Button, Empty, ProgressBar, Segmented, TintCard } from '../../ui/primitives';
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

  const counts: Record<string, number> = {};
  for (const k of TODO_TABS) counts[k] = k === 'aktuell' ? aktuellLists(data.todos, today).open.length : openInCurrent(data.todos, k, today);

  const lists = tab === 'aktuell' ? aktuellLists(data.todos, today) : periodLists(data.todos, tab, periodKey(tab, cursor)!);
  const all = [...lists.open, ...lists.done];
  const listName = t(`todos.listName.${tab}`);
  const isCurrent = tab !== 'aktuell' && periodKey(tab, cursor) === periodKey(tab, today);
  const prog = listProgress(all);
  const sTot = all.reduce((a, x) => a + x.subs.length, 0);
  const sDone = all.reduce((a, x) => a + x.subs.filter((s) => s.done).length, 0);

  return (
    <Screen fab={{ label: t('todos.fab'), a11y: t('todos.fabLabel'), onPress: openForm }}>
      <View style={{ gap: 10 }}>
        <T v="h1" accessibilityRole="header">
          {t('todos.title')}
        </T>
        <Segmented
          label={t('todos.pickList')}
          value={tab}
          onChange={(k) => ui.set({ todoTab: k, todoCursor: null, showDone: false, showPlanned: false })}
          options={TODO_TABS.map((k) => ({ key: k, label: t(`todos.tab.${k}`), count: counts[k] }))}
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
          <TintCard tint="black">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <T style={{ fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 38, color: c.onBlack }}>
                {Math.round(prog)}
                <T style={{ fontFamily: fonts.displayHeavy, fontSize: 18, color: c.onBlack }}>%</T>
              </T>
              <View style={{ flex: 1, gap: 7 }}>
                <T v="bold" color={c.onBlack}>
                  {prog >= 100 ? t('todos.progressAll') : t('todos.progressIn', { list: listName })}
                </T>
                <ProgressBar pct={prog} color={c.onBlack} label={t('todos.progressIn', { list: listName })} />
                <T v="small" color={c.onBlackMuted}>
                  {t('todos.progressSummary', { done: lists.done.length, total: all.length })}
                  {sTot ? SEP + t('todos.subsSummary', { done: sDone, total: sTot }) : ''}
                </T>
              </View>
            </View>
          </TintCard>
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
    </Screen>
  );
}
