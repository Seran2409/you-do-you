import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { daysLeft } from '../../game/dates';
import { ROUTINE_SCOPES } from '../../game/rules';
import { activeRoutines, periodCount, scopeSummary, targetOf } from '../../game/routines';
import type { Routine, RoutineScope } from '../../game/types';
import { SEP } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { useSheet } from '../../ui/overlays';
import { Card, Chip, Empty, PressScale, ProgressBar, TintCard } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { Screen } from '../shell/Shell';
import { GoalCard, RoutineGroups } from './RoutineCard';
import { RoutineForm, SUGGESTIONS } from './RoutineForm';

/**
 * Tabs for day, week, month and year that double as the overview: each shows how many routines are met in
 * its current period. Above them the total across all rhythms.
 */
function ScopeTabs({ all, scope, onPick }: { all: Routine[]; scope: RoutineScope; onPick: (scope: RoutineScope) => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { stats, today } = useStore();
  const rows = ROUTINE_SCOPES.map((k) => {
    const list = all.filter((r) => r.scope === k);
    return { k, total: list.length, met: list.filter((r) => periodCount(stats, r, today) >= targetOf(r)).length };
  });
  const total = rows.reduce((a, r) => a + r.total, 0);
  const met = rows.reduce((a, r) => a + r.met, 0);
  return (
    <Card pad={12} style={{ gap: 10 }}>
      {total ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingHorizontal: 2 }}>
          <T v="bold">{t('routines.overallTitle')}</T>
          <T v="smallBold" muted>
            {t('routines.overallSum', { met, total })}
          </T>
        </View>
      ) : null}
      <View accessibilityRole="tablist" accessibilityLabel={t('routines.pickScope')} style={{ flexDirection: 'row', gap: 6 }}>
        {rows.map((r) => {
          const on = r.k === scope;
          const full = r.total > 0 && r.met === r.total;
          return (
            <PressScale
              key={r.k}
              onPress={() => onPick(r.k)}
              accessibilityRole="tab"
              aria-selected={on}
              accessibilityLabel={`${t(`routines.scope.${r.k}`)}, ${t('routines.overallSum', { met: r.met, total: r.total })}`}
              style={{
                flex: 1,
                minWidth: 0,
                gap: 6,
                paddingVertical: 9,
                paddingHorizontal: 10,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: on ? (full ? c.go : c.accent) : 'transparent',
                backgroundColor: on ? c.surface : full ? c.goSoft : c.surface2,
                boxShadow: on ? c.shadow : undefined,
              }}
            >
              <T v="tiny" numberOfLines={1} color={on ? c.ink : c.muted} style={{ fontFamily: fonts.bodyBold }}>
                {t(`routines.scope.${r.k}`)}
              </T>
              <T v="monoBold" color={full ? c.go : on ? c.ink : c.muted} style={{ fontSize: 16, lineHeight: 20 }}>
                {r.total ? `${r.met}/${r.total}` : '–'}
              </T>
              <ProgressBar small pct={r.total ? (r.met / r.total) * 100 : 0} color={full ? c.go : undefined} />
            </PressScale>
          );
        })}
      </View>
    </Card>
  );
}

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, stats, today } = useStore();
  const ui = useUi();
  const sheet = useSheet();
  const scope = ui.routScope;
  const all = activeRoutines(data.routines);
  const list = all.filter((r) => r.scope === scope);
  const openForm = () => sheet.open((cl) => <RoutineForm id={null} close={cl} />, t('routineForm.newTitle'));

  const sum = scopeSummary(stats, list, scope, today);
  const pct = list.length ? (sum.metNow / list.length) * 100 : 0;
  const dl = daysLeft(scope, today);

  return (
    <Screen fab={{ label: t('routines.fab'), a11y: t('routines.fabLabel'), onPress: openForm }}>
      <View style={{ gap: 10 }}>
        <T v="h1" accessibilityRole="header">
          {t('routines.title')}
        </T>
        <ScopeTabs all={all} scope={scope} onPick={(k) => ui.set({ routScope: k })} />
      </View>
      {scope === 'tag' ? <GoalCard editable /> : null}
      {list.length ? (
        <View style={{ gap: 14 }}>
          <RoutineGroups list={list} />
          {/* Today and the look back come after the list, so the routines themselves are first. */}
          <TintCard tint="black">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <T style={{ fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 38, color: c.onBlack }}>
                {Math.round(pct)}
                <T style={{ fontFamily: fonts.displayHeavy, fontSize: 18, color: c.onBlack }}>%</T>
              </T>
              <View style={{ flex: 1, gap: 7 }}>
                <T v="bold" color={c.onBlack}>
                  {t('routines.summary', { name: t(`routines.nowName.${scope}`), met: sum.metNow, total: sum.total })}
                </T>
                <ProgressBar pct={pct} color={c.onBlack} />
                <T v="small" color={c.onBlackMuted}>
                  {t('routines.lookback', { name: t(`routines.prevName.${scope}`), met: sum.metPrev, total: sum.total })}
                  {scope !== 'tag' ? SEP + t('routines.daysLeft', { count: dl }) : ''}
                </T>
              </View>
            </View>
          </TintCard>
        </View>
      ) : (
        <Empty title={t(`routines.empty.${scope}`)} text={t('routines.emptyText')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {SUGGESTIONS.map((s) => {
              const title = t(`routines.suggest.${s.key}`);
              return (
                <Chip
                  key={s.key}
                  label={t('routines.suggestion', { emoji: s.emoji, title, target: s.target, per: t(`routines.per.${s.scope}`) })}
                  onPress={() => sheet.open((cl) => <RoutineForm id={null} preset={{ ...s, title }} close={cl} />, t('routineForm.newTitle'))}
                />
              );
            })}
          </View>
        </Empty>
      )}
    </Screen>
  );
}
