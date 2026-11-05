import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { daysLeft } from '../../game/dates';
import { ROUTINE_SCOPES } from '../../game/rules';
import { activeRoutines, periodCount, scopeSummary, targetOf } from '../../game/routines';
import { SEP } from '../../i18n/format';
import { useSheet } from '../../ui/overlays';
import { Chip, Empty, OverviewTabs, SummaryCard } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { Screen } from '../shell/Shell';
import { GoalCard, RoutineGroups } from './RoutineCard';
import { RoutineForm, SUGGESTIONS } from './RoutineForm';

export default function RoutinesScreen() {
  const { t } = useTranslation();
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
        <OverviewTabs
          title={t('routines.overallTitle')}
          label={t('routines.pickScope')}
          sum={(met, total) => t('routines.overallSum', { met, total })}
          value={scope}
          onChange={(k) => ui.set({ routScope: k })}
          tabs={ROUTINE_SCOPES.map((k) => {
            const inScope = all.filter((r) => r.scope === k);
            return { key: k, label: t(`routines.scope.${k}`), total: inScope.length, done: inScope.filter((r) => periodCount(stats, r, today) >= targetOf(r)).length };
          })}
        />
      </View>
      {scope === 'tag' ? <GoalCard editable /> : null}
      {list.length ? (
        <View style={{ gap: 14 }}>
          <RoutineGroups list={list} />
          {/* Today and the look back come after the list, so the routines themselves are first. */}
          <SummaryCard
            pct={pct}
            title={t('routines.summary', { name: t(`routines.nowName.${scope}`), met: sum.metNow, total: sum.total })}
            sub={
              t('routines.lookback', { name: t(`routines.prevName.${scope}`), met: sum.metPrev, total: sum.total }) +
              (scope !== 'tag' ? SEP + t('routines.daysLeft', { count: dl }) : '')
            }
          />
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
