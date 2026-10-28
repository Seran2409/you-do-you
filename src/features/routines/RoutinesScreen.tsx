import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { daysLeft } from '../../game/dates';
import { ROUTINE_SCOPES } from '../../game/rules';
import { activeRoutines, openRoutineCount, scopeSummary } from '../../game/routines';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { useSheet } from '../../ui/overlays';
import { Chip, Empty, ProgressBar, Segmented, TintCard } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { Screen } from '../shell/Shell';
import { GoalCard, RoutineGroups } from './RoutineCard';
import { RoutineForm, SUGGESTIONS } from './RoutineForm';

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
                  {scope !== 'tag' ? ' · ' + t('routines.daysLeft', { count: dl }) : ''}
                </T>
              </View>
            </View>
          </TintCard>
          <RoutineGroups list={list} />
        </View>
      ) : (
        <Empty title={t(`routines.empty.${scope}`)} text={t('routines.emptyText')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
