import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { ACHIEVEMENTS } from '../../game/achievements';
import { addDays, monday } from '../../game/dates';
import { levelTitleKey } from '../../game/level';
import { GOAL_BONUS, MED_XP_PER_MIN, MINDFUL_GOAL_BONUS, SUB_XP } from '../../game/rules';
import { fmtDay, fmtNumber } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, type Tint } from '../../theme/tokens';
import { HexBadge, Heatmap, XpBar } from '../../ui/graphics';
import { Icon } from '../../ui/Icon';
import { Card, LinkButton, SectionHead, TintCard } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { Screen } from '../shell/Shell';

/** Black score card used on Home. */
export function PlayerCard() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { stats, today } = useStore();
  const L = stats.level;
  return (
    <View style={{ gap: 10 }}>
      <SectionHead title={t('start.level')} right={<LinkButton label={t('start.details')} onPress={() => router.navigate('/level')} />} />
      <TintCard tint="black">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HexBadge level={L.level} />
          <View style={{ flex: 1, gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <T style={{ fontFamily: fonts.display, fontSize: 16, color: c.onBlack }}>{t(`titles.${levelTitleKey(L.level)}`)}</T>
              <T v="mono" color={c.onBlackMuted}>
                {fmtNumber(stats.total)} XP
              </T>
            </View>
            <XpBar pct={L.pct} label={t('level.progressLabel', { level: L.level + 1 })} />
            <T v="tiny" color={c.onBlackMuted}>
              {t('start.playerSub', { left: L.need - L.into, next: L.level + 1, today: stats.xpByDay.get(today) || 0, count: stats.streak })}
            </T>
          </View>
        </View>
      </TintCard>
    </View>
  );
}

function Tile({ tint, num, label, numColor }: { tint: Tint; num: number; label: string; numColor?: string }) {
  const { c } = useTheme();
  return (
    <TintCard tint={tint} pad={14} style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <T style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: numColor ?? c.ink }}>{fmtNumber(num)}</T>
      <T v="tiny" muted>
        {label}
      </T>
    </TintCard>
  );
}

export default function LevelScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { stats, today } = useStore();
  const L = stats.level;

  const weeks = 18;
  const start = addDays(monday(today), -7 * (weeks - 1));
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const k = addDays(start, i);
    const x = stats.xpByDay.get(k) || 0;
    const level = (k > today ? -1 : x === 0 ? 0 : x < 20 ? 1 : x < 50 ? 2 : x < 100 ? 3 : 4) as -1 | 0 | 1 | 2 | 3 | 4;
    return { key: k, level, today: k === today };
  });

  const rules: [string, string][] = [
    [t('level.rules.todoA'), '+10 · +15 · +25'],
    [t('level.rules.todoB'), '+50 · +120'],
    [t('level.rules.diff'), t('level.rules.diffValue')],
    [t('level.rules.sub'), '+' + SUB_XP],
    [t('level.rules.routine'), '+10 · +15 · +25 · +60'],
    [t('level.rules.routineGoal'), t('level.rules.routineGoalValue')],
    [t('level.rules.dailyGoal'), '+' + GOAL_BONUS],
    [t('level.rules.meditation'), '+' + MED_XP_PER_MIN],
    [t('level.rules.mindfulGoal'), '+' + MINDFUL_GOAL_BONUS],
  ];

  return (
    <Screen>
      <TintCard tint="black" style={{ alignItems: 'center', gap: 10, paddingTop: 22, paddingBottom: 18 }}>
        <HexBadge level={L.level} size={92} />
        <T style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: c.onBlack, textAlign: 'center' }}>{t(`titles.${levelTitleKey(L.level)}`)}</T>
        <T v="mono" color={c.onBlackMuted}>
          {t('level.total', { level: L.level, xp: fmtNumber(stats.total) })}
        </T>
        <View style={{ alignSelf: 'stretch' }}>
          <XpBar pct={L.pct} height={14} label={t('level.progressLabel', { level: L.level + 1 })} />
        </View>
        <T v="small" color={c.onBlackMuted} style={{ textAlign: 'center' }}>
          {t('level.progress', { into: L.into, need: L.need, left: L.need - L.into, next: L.level + 1, title: t(`titles.${levelTitleKey(L.level + 1)}`) })}
        </T>
      </TintCard>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile tint="orange" num={stats.streak} numColor={c.flame} label={t('level.streakTile', { count: stats.streak, best: stats.best })} />
          <Tile tint="yellow" num={stats.perfectDays} label={t('level.perfectTile')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile tint="green" num={stats.todosDone} label={t('level.todosTile', { count: stats.subsDone })} />
          <Tile tint="plum" num={stats.checkins} label={t('level.routinesTile')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile tint="calm" num={stats.mindfulMinutes} label={t('level.mindfulTile')} />
          <Tile tint="calm" num={stats.medBest} label={t('level.medBestTile', { count: stats.medBest })} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHead title={t('level.heatTitle')} />
        <Card>
          <Heatmap cells={cells} label={t('level.heatLabel')} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <T v="tiny" muted style={{ fontSize: 12 }}>
              {fmtDay(start, { day: 'numeric', month: 'short' })}
            </T>
            <T v="tiny" muted style={{ fontSize: 12 }}>
              {t('level.heatLegend')}
            </T>
            <T v="tiny" muted style={{ fontSize: 12 }}>
              {t('level.heatToday')}
            </T>
          </View>
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHead
          title={t('level.badges')}
          right={
            <T v="mono" muted>
              {stats.unlocked.size}/{ACHIEVEMENTS.length}
            </T>
          }
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {ACHIEVEMENTS.map((a) => {
            const ok = stats.unlocked.has(a.key);
            const inner = (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: ok ? c.hazard : c.surface2,
                    boxShadow: ok ? `inset 0px 0px 0px 2px ${c.hazardInk}` : undefined,
                  }}
                >
                  <Icon name={a.icon} size={18} color={ok ? c.hazardInk : c.muted} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="smallBold" color={ok ? c.ink : c.muted} style={{ lineHeight: 18 }}>
                    {t(`badges.${a.key}.name`)}
                  </T>
                  <T v="tiny" muted style={{ fontSize: 12, lineHeight: 16, marginTop: 2 }}>
                    {t(`badges.${a.key}.desc`)}
                  </T>
                </View>
              </View>
            );
            const box = { flexGrow: 1, flexBasis: 148, borderRadius: 14 };
            return ok ? (
              <TintCard key={a.key} tint="yellow" pad={12} style={box}>
                {inner}
              </TintCard>
            ) : (
              <View key={a.key} style={[box, { padding: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }]}>
                {inner}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHead title={t('level.rulesTitle')} />
        <Card>
          {rules.map(([k, v], i) => (
            <View
              key={k}
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 7, borderBottomWidth: i < rules.length - 1 ? 1 : 0, borderBottomColor: c.line }}
            >
              <T v="small" style={{ flex: 1 }}>
                {k}
              </T>
              <T v="monoBold" color={c.hazardText} style={{ fontSize: 14 }}>
                {v}
              </T>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}
