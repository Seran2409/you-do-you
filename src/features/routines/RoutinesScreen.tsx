import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { daysLeft } from '../../game/dates';
import { ROUTINE_SCOPES } from '../../game/rules';
import { activeRoutines, openRoutineCount, periodCount, scopeSummary, targetOf } from '../../game/routines';
import type { Routine, RoutineScope } from '../../game/types';
import { SEP } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { useSheet } from '../../ui/overlays';
import { Card, Chip, Empty, PressScale, ProgressBar, Segmented, TintCard } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { Screen } from '../shell/Shell';
import { GoalCard, RoutineGroups } from './RoutineCard';
import { RoutineForm, SUGGESTIONS } from './RoutineForm';

/** All rhythms at a glance: routines met in their current day, week, month and year. Tapping one opens its tab. */
function OverallCard({ all, onPick }: { all: Routine[]; onPick: (scope: RoutineScope) => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { stats, today } = useStore();
  const rows = ROUTINE_SCOPES.map((k) => {
    const list = all.filter((r) => r.scope === k);
    return { k, total: list.length, met: list.filter((r) => periodCount(stats, r, today) >= targetOf(r)).length };
  });
  const total = rows.reduce((a, r) => a + r.total, 0);
  const met = rows.reduce((a, r) => a + r.met, 0);
  if (!total) return null;
  return (
    <Card pad={12} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingHorizontal: 2 }}>
        <T v="bold">{t('routines.overallTitle')}</T>
        <T v="smallBold" muted>
          {t('routines.overallSum', { met, total })}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {rows.map((r) => {
          const full = r.total > 0 && r.met === r.total;
          return (
            <PressScale
              key={r.k}
              onPress={() => onPick(r.k)}
              accessibilityRole="button"
              accessibilityLabel={`${t(`routines.scope.${r.k}`)}: ${t('routines.overallSum', { met: r.met, total: r.total })}`}
              style={{ flex: 1, minWidth: 0, gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: full ? c.goSoft : c.surface2 }}
            >
              <T v="tiny" muted numberOfLines={1} style={{ fontFamily: fonts.bodyBold }}>
                {t(`routines.scope.${r.k}`)}
              </T>
              <T v="monoBold" color={full ? c.go : c.ink} style={{ fontSize: 16, lineHeight: 20 }}>
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
        <OverallCard all={all} onPick={(k) => ui.set({ routScope: k })} />
        <Segmented
          label={t('routines.pickScope')}
          value={scope}
          onChange={(k) => ui.set({ routScope: k })}
          options={ROUTINE_SCOPES.map((k) => ({ key: k, label: t(`routines.scope.${k}`), count: openRoutineCount(stats, all, k, today) }))}
        />
      </View>
      {scope === 'tag' ? <GoalCard editable /> : null}
      {list.length ? (
        <View style={{ gap: 10 }}>
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
          <RoutineGroups list={list} />
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
