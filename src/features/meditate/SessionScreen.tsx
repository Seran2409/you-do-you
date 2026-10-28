import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../data/AppStore';
import { clock } from '../../game/breath';
import { todayKey } from '../../game/dates';
import { MED_XP_PER_MIN } from '../../game/rules';
import { playGong } from '../../meditation/sound';
import { cancelOnce, pauseRemindersBetween, scheduleOnce } from '../../notifications';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, MAX_WIDTH } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { Button } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { Breath } from './Breath';

export const MOODS = ['😣', '🙁', '😐', '🙂', '😊'];
const END_ID = 'session-end';

type Status = 'running' | 'paused' | 'done';

export default function SessionScreen() {
  useKeepAwake();
  const { t } = useTranslation();
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, actions } = useStore();
  const params = useLocalSearchParams<{ minutes?: string }>();
  const med = settings.meditation ?? { minutes: 10, pattern: 'calm' as const, bell: true };
  const minutes = Math.max(1, Math.min(120, Number(params.minutes) || med.minutes));
  const total = minutes * 60_000;

  const [status, setStatus] = useState<Status>('running');
  const [remaining, setRemaining] = useState(total);
  const [result, setResult] = useState<{ id: string | null; seconds: number; completed: boolean } | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const endAt = useRef(Date.now() + total);
  const left = useRef(total);
  const started = useRef(new Date());
  const finished = useRef(false);

  const endText = useCallback(() => [t('meditate.endTitle'), t('meditate.endBody'), t('notify.channel')] as const, [t]);

  /** Side effects of ending; safe to call from cleanup (no state updates). */
  const wrapUp = useCallback(
    (completed: boolean) => {
      if (finished.current) return null;
      finished.current = true;
      cancelOnce(END_ID).catch(() => {});
      const seconds = completed ? minutes * 60 : Math.round((total - Math.max(0, left.current)) / 1000);
      if (seconds < 60) return { id: null, seconds, completed };
      const id = actions.saveSession({ date: todayKey(), startedAt: started.current.toISOString(), minutes, seconds, completed, pattern: med.pattern });
      return { id, seconds, completed };
    },
    [actions, med.pattern, minutes, total],
  );

  const finish = useCallback(
    (completed: boolean) => {
      const r = wrapUp(completed);
      if (!r) return;
      if (completed && med.bell) playGong();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setResult(r);
      setStatus('done');
    },
    [wrapUp, med.bell],
  );

  // Start: gong, pause own reminders, backup notification for the end.
  useEffect(() => {
    if (med.bell) playGong();
    const [title, body, channel] = endText();
    pauseRemindersBetween(Date.now(), endAt.current + 60_000).catch(() => {});
    scheduleOnce(END_ID, new Date(endAt.current), title, body, channel).catch(() => {});
    return () => {
      wrapUp(false);
    };
    // Once per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== 'running') return;
    const iv = setInterval(() => {
      const r = endAt.current - Date.now();
      left.current = r;
      setRemaining(r);
      if (r <= 0) finish(true);
    }, 250);
    return () => clearInterval(iv);
  }, [status, finish]);

  const pause = () => {
    left.current = endAt.current - Date.now();
    setStatus('paused');
    cancelOnce(END_ID).catch(() => {});
  };
  const resume = () => {
    endAt.current = Date.now() + left.current;
    setStatus('running');
    const [title, body, channel] = endText();
    scheduleOnce(END_ID, new Date(endAt.current), title, body, channel).catch(() => {});
  };

  const bg: [string, string, string] = dark ? ['#2A2019', '#2B2236', '#1E1712'] : ['#FFF3E4', '#FBE3D2', '#EFE4F7'];
  const elapsed = total - Math.max(0, remaining);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={bg} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28, paddingHorizontal: 24, justifyContent: 'space-between', alignItems: 'center' }}>
        {status !== 'done' ? (
          <>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <T v="eyebrow" color={c.plumText}>
                {t(`meditate.pattern.${med.pattern}`)}
              </T>
              <T style={{ fontFamily: fonts.displayHeavy, fontSize: 52, lineHeight: 60, color: c.ink, fontVariant: ['tabular-nums'] }} accessibilityLabel={t('meditate.remaining', { time: clock(remaining) })}>
                {clock(remaining)}
              </T>
              {status === 'paused' ? (
                <T v="small" muted>
                  {t('meditate.paused')}
                </T>
              ) : null}
            </View>
            <Breath pattern={med.pattern} elapsedMs={elapsed} running={status === 'running'} size={250} />
            <View style={{ alignItems: 'center', gap: 16, width: '100%' }}>
              <Pressable
                onPress={status === 'running' ? pause : resume}
                accessibilityRole="button"
                accessibilityLabel={status === 'running' ? t('meditate.pause') : t('meditate.resume')}
                style={({ pressed }) => [
                  { width: 76, height: 76, borderRadius: 38, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', boxShadow: c.glassShadow },
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}
              >
                <Icon name={status === 'running' ? 'pause' : 'play'} size={30} color={c.onAccent} strokeWidth={2.6} />
              </Pressable>
              <Pressable onPress={() => finish(false)} accessibilityRole="button" hitSlop={10}>
                <T v="smallBold" muted style={{ textDecorationLine: 'underline' }}>
                  {t('meditate.end')}
                </T>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, width: '100%' }}>
            <Breath pattern="free" elapsedMs={0} running={false} size={140} />
            {result && result.seconds >= 60 ? (
              <>
                <T v="h1" style={{ textAlign: 'center' }}>
                  {result.completed ? t('meditate.doneTitle') : t('meditate.endedTitle')}
                </T>
                <T muted style={{ textAlign: 'center' }}>
                  {t('meditate.doneText', { count: Math.floor(result.seconds / 60), xp: Math.min(60, Math.floor(result.seconds / 60)) * MED_XP_PER_MIN })}
                </T>
                <T v="bold" style={{ marginTop: 6 }}>
                  {t('meditate.moodQuestion')}
                </T>
                <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
                  {MOODS.map((m, i) => {
                    const on = mood === i + 1;
                    return (
                      <Pressable
                        key={m}
                        accessibilityRole="radio"
                        aria-checked={on}
                        accessibilityLabel={t(`meditate.mood.${i + 1}`)}
                        onPress={() => {
                          setMood(i + 1);
                          if (result.id) actions.setSessionMood(result.id, i + 1);
                        }}
                        style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.wPlum2 : c.surface, borderWidth: 1.5, borderColor: on ? c.plumText : c.line }}
                      >
                        <T style={{ fontSize: 24, lineHeight: 30 }}>{m}</T>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <T v="h1" style={{ textAlign: 'center' }}>
                  {t('meditate.tooShortTitle')}
                </T>
                <T muted style={{ textAlign: 'center' }}>
                  {t('meditate.tooShortText')}
                </T>
              </>
            )}
            <Button label={t('meditate.back')} onPress={() => router.replace('/meditate')} style={{ minWidth: 200, marginTop: 10 }} />
          </View>
        )}
      </View>
    </View>
  );
}
