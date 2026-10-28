import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { breathPhase } from '../../game/breath';
import type { BreathPattern } from '../../game/types';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { T } from '../../ui/Text';

const SMALL = 0.62;

/** A soft sun that grows while you breathe in and shrinks while you breathe out. */
export function Breath({ pattern, elapsedMs, running, size = 240 }: { pattern: BreathPattern; elapsedMs: number; running: boolean; size?: number }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const reduce = useReducedMotion();
  const phase = breathPhase(pattern, elapsedMs);
  const scale = useSharedValue(SMALL);
  const big = phase.step === 'in' || phase.step === 'hold';
  const stepKey = `${phase.cycle}-${phase.index}-${running}`;

  useEffect(() => {
    if (!running || reduce) {
      scale.value = big ? 1 : SMALL;
      return;
    }
    if (phase.step === 'hold' || phase.step === 'rest') return;
    scale.value = withTiming(big ? 1 : SMALL, { duration: phase.remainingMs, easing: Easing.inOut(Easing.sin) });
    // Only when a new step starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, reduce]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const label = pattern === 'free' ? t('meditate.breath.free') : t(`meditate.breath.${phase.step}`);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', boxShadow: `0px 0px ${size / 4}px ${c.shadeB}` }, style]}>
        <LinearGradient colors={['#FFE3A6', '#FFC08A', '#F49A7A']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }} />
      </Animated.View>
      <View style={{ position: 'absolute', alignItems: 'center' }} accessibilityLiveRegion="polite">
        <T style={{ fontFamily: fonts.displayMedium, fontSize: 22, color: '#4A2E1F' }}>{label}</T>
        {pattern !== 'free' && running ? (
          <T v="monoBold" style={{ color: '#4A2E1F', fontSize: 15, marginTop: 2 }}>
            {Math.ceil(phase.remainingMs / 1000)}
          </T>
        ) : null}
      </View>
    </View>
  );
}
