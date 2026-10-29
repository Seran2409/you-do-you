import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { OnBlack, useTheme } from '../theme/ThemeProvider';
import { fonts, radius, tintColors, type Tint } from '../theme/tokens';
import { EmptyArt } from './graphics';
import { Icon, type IconName } from './Icon';
import { T } from './Text';

/* ---------- surfaces ---------- */

export function Card({ style, children, pad = 16 }: { style?: StyleProp<ViewStyle>; children: ReactNode; pad?: number }) {
  const { c } = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.r, padding: pad, boxShadow: c.shadow }, style]}>
      {children}
    </View>
  );
}

/** Overview widget with a soft gradient in one color family (.w-yellow, .w-plum, .w-black …). */
export function TintCard({ tint, style, children, pad = 16 }: { tint: Tint; style?: StyleProp<ViewStyle>; children: ReactNode; pad?: number }) {
  const { c } = useTheme();
  const body = (
    <LinearGradient
      colors={tintColors(c, tint)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { borderRadius: radius.r, padding: pad, boxShadow: c.shadow, borderWidth: 1, borderColor: tint === 'black' ? c.wBlackLine : 'transparent' },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
  return tint === 'black' ? <OnBlack>{body}</OnBlack> : body;
}

/* ---------- buttons ---------- */

function Press({ style, children, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.96 }] }, rest.disabled && { opacity: 0.35 }]}>
      {children}
    </Pressable>
  );
}

type BtnKind = 'primary' | 'ghost' | 'dangerGhost' | 'danger';

export function Button({
  label,
  onPress,
  icon,
  kind = 'primary',
  small,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  kind?: BtnKind;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const bg = { primary: c.hazard, ghost: c.surface2, dangerGhost: c.surface2, danger: c.danger }[kind];
  const fg = { primary: c.hazardInk, ghost: c.ink, dangerGhost: c.danger, danger: '#FFFFFF' }[kind];
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.btn,
        { backgroundColor: bg, height: small ? 38 : 48, paddingHorizontal: small ? 14 : 18, borderRadius: small ? 11 : 13 },
        kind === 'primary' && { boxShadow: 'inset 0px -3px 0px rgba(0,0,0,0.18)' },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <T v={small ? 'smallBold' : 'bold'} color={fg} numberOfLines={1}>
        {label}
      </T>
    </Press>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 38,
  color,
  disabled,
  style,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={[{ width: size, height: size, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Icon name={icon} size={20} color={color ?? c.muted} />
    </Press>
  );
}

export function LinkButton({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={[{ alignSelf: 'flex-start' }, style]}>
      <T v="smallBold" color={c.accent} style={{ textDecorationLine: 'underline' }}>
        {label}
      </T>
    </Pressable>
  );
}

export function Chip({ label, onPress, icon, selected }: { label: string; onPress: () => void; icon?: IconName; selected?: boolean }) {
  const { c } = useTheme();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.chip,
        { backgroundColor: selected ? c.wPlum : c.surface, borderColor: selected ? c.plumText : c.line },
      ]}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      <T v="smallBold">{label}</T>
    </Press>
  );
}

/* ---------- segmented control ---------- */

export interface SegOption<K extends string | number> {
  key: K;
  label: string;
  count?: number;
  sub?: string;
}

export function Segmented<K extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegOption<K>[];
  value: K | null;
  onChange: (k: K) => void;
  label: string;
}) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.seg, { backgroundColor: c.surface2 }]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            aria-checked={on}
            style={[styles.segBtn, on && { backgroundColor: c.surface, boxShadow: '0px 1px 3px rgba(0,0,0,0.12)' }]}
          >
            <T v="smallBold" color={on ? c.ink : c.muted} numberOfLines={1}>
              {o.label}
            </T>
            {o.sub ? (
              <T v="mono" color={on ? c.ink : c.muted} style={{ fontSize: 11, opacity: 0.75 }}>
                {o.sub}
              </T>
            ) : null}
            {o.count ? (
              <View style={[styles.count, { backgroundColor: c.accent }]}>
                <T v="monoBold" color={c.onAccent} style={{ fontSize: 11 }}>
                  {o.count}
                </T>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- progress ---------- */

export function ProgressBar({ pct, small, color, label }: { pct: number; small?: boolean; color?: string; label?: string }) {
  const { c } = useTheme();
  const reduce = useReducedMotion();
  const w = useSharedValue(pct);
  useEffect(() => {
    w.value = reduce ? pct : withTiming(pct, { duration: 500 });
  }, [pct, reduce, w]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, w.value))}%` }));
  const h = small ? 6 : 10;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
      style={{ height: h, borderRadius: 99, backgroundColor: c.track, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height: h, borderRadius: 99, backgroundColor: color ?? c.accent }, fill]} />
    </View>
  );
}

/** Segmented routine progress (2/3). */
export function SegBar({ target, count, met }: { target: number; count: number; met: boolean }) {
  const { c } = useTheme();
  if (target > 14) return <ProgressBar pct={(count / target) * 100} small color={met ? c.go : undefined} />;
  return (
    <View style={{ flexDirection: 'row', gap: 3, marginTop: 5 }}>
      {Array.from({ length: target }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: i < count ? (met ? c.go : c.accent) : c.track }} />
      ))}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 30,
  decLabel,
  incLabel,
  style,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  decLabel: string;
  incLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.stepper, { backgroundColor: c.track }, style]}>
      <IconButton icon="minus" size={32} color={c.ink} label={decLabel} disabled={value <= min} onPress={() => onChange(value - 1)} />
      <T v="monoBold" style={{ minWidth: 28, textAlign: 'center', fontSize: 15 }}>
        {value}
      </T>
      <IconButton icon="plus" size={32} color={c.ink} label={incLabel} disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

export function Switch({ on, onToggle, title, text, disabled }: { on: boolean; onToggle: () => void; title: string; text?: string; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="switch"
      aria-checked={on} aria-disabled={disabled}
      style={[styles.switch, { backgroundColor: c.surface, borderColor: c.line }, disabled && { opacity: 0.6 }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <T v="bold">{title}</T>
        {text ? (
          <T v="small" muted>
            {text}
          </T>
        ) : null}
      </View>
      <View style={[styles.knobTrack, { backgroundColor: on ? c.accent : c.lineStrong }]}>
        <View style={[styles.knob, { transform: [{ translateX: on ? 20 : 0 }], backgroundColor: on ? c.onAccent : '#FFFFFF' }]} />
      </View>
    </Pressable>
  );
}

/* ---------- checkbox ---------- */

export function Checkbox({ checked, onPress, label, small }: { checked: boolean; onPress: () => void; label: string; small?: boolean }) {
  const { c } = useTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    p.value = reduce ? (checked ? 1 : 0) : withTiming(checked ? 1 : 0, { duration: 150 });
  }, [checked, reduce, p]);
  const mark = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.5 + p.value * 0.5 }] }));
  const s = small ? 22 : 28;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      aria-checked={checked}
      accessibilityLabel={label}
      hitSlop={small ? 11 : 8}
      style={({ pressed }) => [
        {
          width: s,
          height: s,
          borderRadius: s / 2,
          borderWidth: 2,
          borderColor: checked ? c.go : c.lineStrong,
          backgroundColor: checked ? c.go : c.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { transform: [{ scale: 0.88 }] },
      ]}
    >
      <Animated.View style={mark}>
        <Icon name="check" size={small ? 14 : 17} color={c.onGo} strokeWidth={3.2} />
      </Animated.View>
    </Pressable>
  );
}

/* ---------- small bits ---------- */

export function XpTag({ xp, suffix }: { xp: number; suffix?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.hazardSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
      <T v="monoBold" color={c.hazardText} style={{ fontSize: 12 }}>
        +{xp}
        {suffix ? ' XP' : ''}
      </T>
    </View>
  );
}

export function Pips({ diff, label }: { diff: number; label: string }) {
  const { c } = useTheme();
  return (
    <View accessible accessibilityLabel={label} style={{ flexDirection: 'row', gap: 2, alignItems: 'flex-end' }}>
      {[6, 9, 12].map((h, i) => (
        <View key={i} style={{ width: 4, height: h, borderRadius: 2, backgroundColor: i < diff ? c.ink : c.lineStrong }} />
      ))}
    </View>
  );
}

export function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <T v="h2" accessibilityRole="header">
        {title}
      </T>
      {right}
    </View>
  );
}

export function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.r, boxShadow: c.shadow }}>
      <EmptyArt ground={c.surface} width={156} />
      <T v="h2" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T v="body" muted style={{ fontSize: 15, textAlign: 'center', maxWidth: 420 }}>
        {text}
      </T>
      {children ? <View style={{ alignSelf: 'stretch', alignItems: 'center', marginTop: 4 }}>{children}</View> : null}
    </View>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 7 }}>
      <T v="tiny" muted style={{ fontFamily: fonts.bodyBold, letterSpacing: 0.3 }}>
        {label}
        {hint ? <T v="tiny" muted>{' · ' + hint}</T> : null}
      </T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  seg: { flexDirection: 'row', gap: 3, padding: 4, borderRadius: 13 },
  segBtn: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minHeight: 36, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  count: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, padding: 3, alignSelf: 'flex-start' },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 13, borderWidth: 1 },
  knobTrack: { width: 48, height: 28, borderRadius: 99, padding: 3 },
  knob: { width: 22, height: 22, borderRadius: 11 },
});
