import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { DEFAULT_MEDITATION, MINDFUL_GOAL_BONUS, sessionXp } from '../../game/rules';
import type { BreathPattern } from '../../game/types';
import { dayLabel, fmtNumber, SEP } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { Ring } from '../../ui/graphics';
import { Icon } from '../../ui/Icon';
import { Button, Card, Chip, IconButton, SectionHead, Segmented, Stepper, Switch, TintCard } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { Screen } from '../shell/Shell';
import { MOODS } from './SessionScreen';

const PRESETS = [1, 3, 5, 10, 15, 20, 30];

/** Today's mindful minutes against the goal; used here and on the home screen. */
export function MindfulCard({ quickStart }: { quickStart?: boolean }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { stats, today, mindfulGoal, actions } = useStore();
  const done = stats.mindfulByDay.get(today) || 0;
  const reached = done >= mindfulGoal;
  return (
    <TintCard tint="calm">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Ring value={done} goal={mindfulGoal} color={c.calm}>
          <View style={{ alignItems: 'center' }}>
            <T style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22 }}>
              {done}/{mindfulGoal}
            </T>
            <T v="tiny" muted style={{ fontSize: 11, lineHeight: 13, fontFamily: fonts.bodyBold }}>
              {t('meditate.minShort')}
            </T>
          </View>
        </Ring>
        <View style={{ flex: 1, gap: 6 }}>
          <T v="bold">{reached ? t('meditate.goalReached') : t('meditate.goalTitle')}</T>
          <T v="small" muted>
            {reached ? t('meditate.goalBonusDone', { xp: MINDFUL_GOAL_BONUS }) : t('meditate.goalRemaining', { count: mindfulGoal - done, xp: MINDFUL_GOAL_BONUS })}
          </T>
          {quickStart ? (
            <Button small icon="lotus" label={t('meditate.quick')} style={{ alignSelf: 'flex-start', marginTop: 2 }} onPress={() => router.push({ pathname: '/session', params: { minutes: '3' } })} />
          ) : (
            <Stepper value={mindfulGoal} min={1} max={120} onChange={(v) => actions.saveSettings({ mindfulGoal: v })} decLabel={t('meditate.goalDec')} incLabel={t('meditate.goalInc')} />
          )}
        </View>
      </View>
    </TintCard>
  );
}

export default function MeditateScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, settings, stats, today, actions } = useStore();
  const med = { ...DEFAULT_MEDITATION, ...settings.meditation };
  const setMed = (patch: Partial<typeof med>) => actions.saveSettings({ meditation: { ...med, ...patch } });
  const recent = Object.values(data.sessions || {})
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 5);
  const moods = Object.values(data.sessions || {}).filter((s) => s.moodAfter);
  const avgMood = moods.length ? Math.round(moods.reduce((a, s) => a + (s.moodAfter || 0), 0) / moods.length) : 0;

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <T v="h1" accessibilityRole="header">
          {t('meditate.title')}
        </T>
        <T muted>{t('meditate.subtitle')}</T>
      </View>

      <MindfulCard />

      <Card style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <IconButton icon="minus" size={46} color={c.ink} label={t('common.less')} disabled={med.minutes <= 1} onPress={() => setMed({ minutes: med.minutes - 1 })} style={{ borderRadius: 23, backgroundColor: c.track }} />
          <View style={{ alignItems: 'center', gap: 2, minWidth: 128 }}>
            <T style={{ fontFamily: fonts.displayHeavy, fontSize: 60, lineHeight: 66, color: c.ink, fontVariant: ['tabular-nums'] }}>{med.minutes}</T>
            <T v="smallBold" muted>
              {`${t('meditate.minutes', { count: med.minutes })}${SEP}+${sessionXp(med.minutes)}\u00A0XP`}
            </T>
          </View>
          <IconButton icon="plus" size={46} color={c.ink} label={t('common.more')} disabled={med.minutes >= 120} onPress={() => setMed({ minutes: med.minutes + 1 })} style={{ borderRadius: 23, backgroundColor: c.track }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {PRESETS.map((m) => (
            <Chip key={m} label={`${m}`} selected={med.minutes === m} onPress={() => setMed({ minutes: m })} />
          ))}
        </View>
        <View style={{ gap: 8 }}>
          <T v="tiny" muted style={{ fontFamily: fonts.bodyBold }}>
            {t('meditate.breathing')}
          </T>
          <Segmented<BreathPattern>
            label={t('meditate.breathing')}
            value={med.pattern}
            onChange={(v) => setMed({ pattern: v })}
            options={(['free', 'calm', 'box'] as BreathPattern[]).map((k) => ({ key: k, label: t(`meditate.pattern.${k}`) }))}
          />
          <T v="tiny" muted>
            {t(`meditate.patternHint.${med.pattern}`)}
          </T>
        </View>
        <Button icon="lotus" label={t('meditate.start')} onPress={() => router.push('/session')} />
      </Card>

      <Switch on={med.bell} onToggle={() => setMed({ bell: !med.bell })} title={t('meditate.bell')} text={t('meditate.bellText')} />

      <View style={{ gap: 10 }}>
        <SectionHead title={t('meditate.statsTitle')} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            [fmtNumber(stats.mindfulMinutes), t('meditate.statMinutes')],
            [fmtNumber(stats.sessionsDone), t('meditate.statSessions')],
            [String(stats.medStreak), t('meditate.statStreak', { count: stats.medStreak })],
          ].map(([n, l]) => (
            <TintCard key={l} tint="calm" pad={12} style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <T style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28 }}>{n}</T>
              <T v="tiny" muted>
                {l}
              </T>
            </TintCard>
          ))}
        </View>
        {avgMood ? (
          <T v="small" muted>
            {t('meditate.avgMood', { mood: MOODS[avgMood - 1] })}
          </T>
        ) : null}
        {recent.length ? (
          <Card pad={0} style={{ paddingHorizontal: 14 }}>
            {recent.map((s, i) => (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: i < recent.length - 1 ? 1 : 0, borderBottomColor: c.line }}>
                <Icon name="lotus" size={20} color={c.calm} />
                <View style={{ flex: 1 }}>
                  <T v="bold">{t('meditate.minutes', { count: Math.floor(s.seconds / 60) })}</T>
                  <T v="tiny" muted>
                    {dayLabel(s.date, today)}
                    {SEP}
                    {t(`meditate.pattern.${s.pattern}`)}
                  </T>
                </View>
                {s.moodAfter ? <T style={{ fontSize: 20 }}>{MOODS[s.moodAfter - 1]}</T> : null}
              </View>
            ))}
          </Card>
        ) : (
          <Pressable onPress={() => router.push({ pathname: '/session', params: { minutes: '3' } })} accessibilityRole="button">
            <T v="small" muted>
              {t('meditate.empty')}
            </T>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
