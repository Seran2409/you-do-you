import { LinearGradient } from 'expo-linear-gradient';
import type { TFunction } from 'i18next';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { hourNow } from '../../game/dates';
import { daySlot } from '../../game/greeting';
import { hints, type Hint } from '../../game/hints';
import { quoteIndex } from '../../game/quotes';
import { activeRoutines } from '../../game/routines';
import { aktuellLists, activeTodos, openInCurrent, todoXp } from '../../game/todos';
import type { Todo } from '../../game/types';
import i18n from '../../i18n';
import { joinList } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/tokens';
import { SunMark } from '../../ui/graphics';
import { Icon } from '../../ui/Icon';
import { useSheet, useToast } from '../../ui/overlays';
import { Button, Card, Checkbox, LinkButton, SectionHead, TintCard } from '../../ui/primitives';
import { Rich, T, safe } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { PlayerCard } from '../level/LevelScreen';
import { GoalCard, RoutineGroups } from '../routines/RoutineCard';
import { MindfulCard } from '../meditate/MeditateScreen';
import { Screen } from '../shell/Shell';
import { TodoForm } from '../todos/sheets';

function Greeting() {
  const { t } = useTranslation();
  const { settings } = useStore();
  const slot = daySlot(hourNow());
  const name = settings.name.trim();
  return (
    <View style={{ gap: 4 }}>
      <T v="h1" accessibilityRole="header">
        {name ? t(`greeting.${slot}_name`, { name }) : t(`greeting.${slot}`)}
      </T>
      <T muted>{t(`greeting.${slot}_sub`)}</T>
    </View>
  );
}

function QuoteCard() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { today } = useStore();
  const quotes = i18n.t('quotes', { returnObjects: true }) as string[];
  const i = quoteIndex(today, quotes.length);
  return (
    <View accessibilityLabel={t('quote.label')} style={{ borderRadius: radius.r, overflow: 'hidden', boxShadow: c.shadow }}>
      <LinearGradient colors={[c.plum, c.plum2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}>
        {/* A soft sun rising in the corner. */}
        <View style={{ position: 'absolute', right: -34, bottom: -40, opacity: 0.5 }} importantForAccessibility="no" accessibilityElementsHidden>
          <SunMark size={110} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <T v="eyebrow" color={c.plumLabel}>
            {t('quote.label')}
          </T>
          <T v="mono" color={c.plumLabel} style={{ fontSize: 12 }}>
            {t('quote.number', { n: i + 1 })}
          </T>
        </View>
        <T style={{ fontFamily: fonts.displayMedium, fontSize: 21, lineHeight: 28, letterSpacing: -0.2, color: c.onPlum, paddingRight: 36 }}>{quotes[i]}</T>
      </LinearGradient>
    </View>
  );
}

function StartRow({ todo, last }: { todo: Todo; last: boolean }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { today, actions } = useStore();
  const late = todo.scope === 'tag' && (todo.period || '') < today;
  const where = late
    ? t('todos.overdue')
    : (todo.scope === 'tag' ? t('day.today') : t('todos.noDate')) +
      (todo.subs.length ? ' · ' + t('todos.subsSummary', { done: todo.subs.filter((s) => s.done).length, total: todo.subs.length }) : '');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <Checkbox checked={false} onPress={() => actions.toggleTodo(todo.id)} label={t('todos.check', { title: todo.title })} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T>{todo.title}</T>
        <T v="tiny" color={late ? c.flame : c.muted} style={late && { fontFamily: fonts.bodyBold }}>
          {where}
        </T>
      </View>
      <View style={{ backgroundColor: c.hazardSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
        <T v="monoBold" color={c.hazardText} style={{ fontSize: 12 }}>
          +{todoXp(todo)}
        </T>
      </View>
    </View>
  );
}

function hintText(h: Hint, t: TFunction): string {
  switch (h.kind) {
    case 'overdue':
      return t('hints.overdue', { count: h.count });
    case 'routineTight':
      return t('hints.routineTight', { emoji: h.emoji, title: safe(h.title), remaining: h.remaining, count: h.daysLeft });
    case 'routineOpen':
      return t(`hints.routineOpen.${h.scope}`, { emoji: h.emoji, title: safe(h.title), remaining: h.remaining });
    case 'listEnding':
      return t('hints.listEnding', { count: h.daysLeft, what: t(`hints.what.${h.scope}`, { count: h.open }) });
  }
}

function Hints() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, stats, today, actions } = useStore();
  const toast = useToast();
  const list = hints(data, stats, today);
  if (!list.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {list.map((h, i) => (
        <TintCard key={i} tint={h.hot ? 'orange' : 'plum'} pad={0} style={{ borderRadius: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14 }}>
            <View style={{ marginTop: 2 }}>
              <Icon name={h.hot ? 'warn' : 'bell'} color={h.hot ? c.flame : c.plumText} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Rich text={hintText(h, t)} style={{ fontSize: 15 }} />
              {h.kind === 'overdue' ? (
                <Button
                  small
                  kind="ghost"
                  label={t('hints.overdueAction')}
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() => toast(t('toast.movedToday', { count: actions.moveOverdueToToday() }))}
                />
              ) : null}
            </View>
          </View>
        </TintCard>
      ))}
    </View>
  );
}

function TodaySection() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, today } = useStore();
  const sheet = useSheet();
  const ui = useUi();
  const open = aktuellLists(data.todos, today).open;
  const n = open.length;
  const any = activeTodos(data.todos).length > 0;
  const more = (
    [
      ['woche', 'moreWeek'],
      ['monat', 'moreMonth'],
      ['jahr', 'moreYear'],
    ] as const
  )
    .map(([s, k]) => {
      const cnt = openInCurrent(data.todos, s, today);
      return cnt ? t(`start.${k}`, { count: cnt }) : null;
    })
    .filter((x): x is string => !!x);
  const moreTxt = more.length ? t('start.more', { list: joinList(more) }) : '';
  const daily = activeRoutines(data.routines).filter((r) => r.scope === 'tag');
  const goTodos = () => {
    ui.set({ todoTab: 'aktuell', todoCursor: null });
    router.navigate('/todos');
  };

  return (
    <View style={{ gap: 10 }}>
      <SectionHead title={t('start.today')} right={<LinkButton label={t('start.allTodos')} onPress={goTodos} />} />
      <Card pad={0} style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {n || !any ? (
            <T style={{ fontFamily: fonts.displayHeavy, fontSize: 42, lineHeight: 46 }}>{n}</T>
          ) : (
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.goSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={24} color={c.go} strokeWidth={3} />
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <T v="bold" style={{ fontSize: 17 }}>
              {n ? t('start.waiting', { count: n }) : any ? t('start.nothingLeft') : t('start.noTodos')}
            </T>
            {n ? (
              moreTxt ? (
                <T v="small" muted>
                  {moreTxt}
                </T>
              ) : null
            ) : (
              <T v="small" muted>
                {any ? moreTxt || t('start.enjoy') : t('start.noTodosSub')}
              </T>
            )}
          </View>
        </View>
        {n ? (
          <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
            {open.slice(0, 5).map((x, i, arr) => (
              <StartRow key={x.id} todo={x} last={i === arr.length - 1} />
            ))}
          </View>
        ) : null}
        {n > 5 ? <LinkButton label={t('start.andMore', { count: n - 5 })} onPress={goTodos} /> : null}
        {!any ? (
          <Button small icon="plus" label={t('start.firstTodo')} style={{ alignSelf: 'flex-start' }} onPress={() => sheet.open((cl) => <TodoForm id={null} close={cl} />, t('todoForm.newTitle'))} />
        ) : null}
      </Card>
      <Hints />
      <GoalCard />
      <RoutineGroups list={daily} mini />
      <MindfulCard quickStart />
    </View>
  );
}

export default function StartScreen() {
  return (
    <Screen>
      <Greeting />
      <QuoteCard />
      <TodaySection />
      <PlayerCard />
    </Screen>
  );
}
