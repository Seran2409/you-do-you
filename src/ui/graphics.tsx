import { BlurView } from 'expo-blur';
import { useEffect, useId, type ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { T } from './Text';

/* ---------- color helpers ---------- */

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** color-mix(in srgb, a p, b) */
export function mix(a: string, b: string, p: number): string {
  const x = hexRgb(a);
  const y = hexRgb(b);
  return '#' + x.map((v, i) => Math.round(v * p + y[i] * (1 - p)).toString(16).padStart(2, '0')).join('');
}

/** '#RRGGBB' with alpha, e.g. so fades end in the page color instead of transparent black. */
export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Split "rgba(r,g,b,a)" for SVG stops, which take color and opacity separately. */
function rgba(s: string): { color: string; opacity: number } {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return { color: s, opacity: 1 };
  const [r, g, b, a = '1'] = m[1].split(',').map((x) => x.trim());
  return { color: `rgb(${r},${g},${b})`, opacity: Number(a) };
}

/* ---------- sun mark and logo ---------- */

const RAYS = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);

/** The sun: warm gradient disc with soft rays. Used in the logo, the level emblem and the icons. */
export function SunMark({ size = 28, rays = true }: { size?: number; rays?: boolean }) {
  const { c } = useTheme();
  const id = 'sun' + useId().replace(/:/g, '');
  const disc = rays ? 6.2 : 10;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD36B" />
          <Stop offset="1" stopColor={c.flame} />
        </LinearGradient>
      </Defs>
      {rays ? (
        <G stroke="#F2A33A" strokeWidth={1.7} strokeLinecap="round">
          {RAYS.map((a, i) => (
            <Line key={i} x1={12 + Math.cos(a) * 8.6} y1={12 + Math.sin(a) * 8.6} x2={12 + Math.cos(a) * (i % 2 ? 10.4 : 11.2)} y2={12 + Math.sin(a) * (i % 2 ? 10.4 : 11.2)} />
          ))}
        </G>
      ) : null}
      <Circle cx={12} cy={12} r={disc} fill={`url(#${id})`} />
    </Svg>
  );
}

const HILL = 'M0 70 C 30 58, 52 63, 72 66 S 116 59, 140 64';

/** Empty-state picture: the sun rising behind a hill with a little sprout. `ground` matches the card behind it. */
export function EmptyArt({ ground, width = 140 }: { ground?: string; width?: number }) {
  const { c } = useTheme();
  const id = 'rise' + useId().replace(/:/g, '');
  const up = [200, 223, 246, 270, 294, 317, 340].map((d) => (d * Math.PI) / 180);
  return (
    <Svg width={width} height={(width * 90) / 140} viewBox="0 0 140 90" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD978" />
          <Stop offset="1" stopColor={c.flame} />
        </LinearGradient>
        <RadialGradient id={id + 'g'} cx={70} cy={64} r={44} gradientUnits="userSpaceOnUse">
          <Stop offset="0.4" stopColor={c.hazard} stopOpacity={0.3} />
          <Stop offset="1" stopColor={c.hazard} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={70} cy={64} r={44} fill={`url(#${id}g)`} />
      <G stroke="#F2A33A" strokeWidth={3.4} strokeLinecap="round">
        {up.map((a, i) => (
          <Line key={i} x1={70 + Math.cos(a) * 27} y1={64 + Math.sin(a) * 27} x2={70 + Math.cos(a) * (i % 2 ? 33 : 36)} y2={64 + Math.sin(a) * (i % 2 ? 33 : 36)} />
        ))}
      </G>
      <Circle cx={70} cy={64} r={20} fill={`url(#${id})`} />
      <Path d={`${HILL} V90 H0 Z`} fill={ground ?? c.surface} />
      <Path d={HILL} fill="none" stroke={c.lineStrong} strokeWidth={2} strokeLinecap="round" />
      <G>
        <Line x1={106} y1={62} x2={106} y2={50} stroke={c.go} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M106 55 C 100 55, 97 51, 98 47 C 102 47, 106 50, 106 55 Z" fill={c.go} />
        <Path d="M106 52 C 112 52, 115 48, 114 44 C 110 44, 106 47, 106 52 Z" fill={c.go} opacity={0.8} />
      </G>
    </Svg>
  );
}

/** "you do you" wordmark next to the sun. Brand name, same in every language. */
export function Logo({ label, scale = 1 }: { label: string; scale?: number }) {
  const { c } = useTheme();
  const fs = 21 * scale;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 * scale, alignSelf: 'flex-start' }}>
      <SunMark size={30 * scale} />
      <T style={{ fontFamily: fonts.displayMedium, fontSize: fs, lineHeight: fs * 1.2, color: c.ink, letterSpacing: -0.3 }}>
        you do <T style={{ fontFamily: fonts.displayItalic, fontSize: fs, color: c.accent }}>you</T>
      </T>
    </View>
  );
}

/* ---------- level emblem ---------- */

/** Level number on a little sun. */
export function HexBadge({ level, size = 56 }: { level: number; size?: number }) {
  const { c } = useTheme();
  const fs = (level > 99 ? 13 : level > 9 ? 17 : 21) * (size / 56);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={StyleSheet.absoluteFill}>
        <SunMark size={size} />
      </View>
      <T style={{ fontFamily: fonts.displayHeavy, fontSize: fs, lineHeight: fs * 1.25, color: c.hazardInk }}>{level}</T>
    </View>
  );
}

/* ---------- daily goal ring ---------- */

export function Ring({ value, goal, children, color }: { value: number; goal: number; children?: ReactNode; color?: string }) {
  const { c } = useTheme();
  const r = 34;
  const circ = 2 * Math.PI * r;
  const p = goal ? Math.min(1, value / goal) : 0;
  return (
    <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={84} height={84} viewBox="0 0 84 84" style={StyleSheet.absoluteFill}>
        <Circle cx={42} cy={42} r={r} fill="none" stroke={c.track} strokeWidth={9} />
        {p > 0 ? (
          <Circle
            cx={42}
            cy={42}
            r={r}
            fill="none"
            stroke={p >= 1 ? c.go : (color ?? c.accent)}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${(circ * p).toFixed(1)} ${circ.toFixed(1)}`}
            transform="rotate(-90 42 42)"
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

/* ---------- XP bar ---------- */

/** Sunny gradient XP bar (game layer). */
export function XpBar({ pct, height = 12, label }: { pct: number; height?: number; label?: string }) {
  const { c } = useTheme();
  const reduce = useReducedMotion();
  const w = useSharedValue(pct);
  useEffect(() => {
    w.value = reduce ? pct : withTiming(pct, { duration: 600 });
  }, [pct, reduce, w]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, w.value))}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      style={{ height, borderRadius: 99, backgroundColor: c.track, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height, borderRadius: 99, overflow: 'hidden' }, fill]}>
        <ExpoLinearGradient colors={['#FFD36B', c.hazard, c.flame]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

/* ---------- heatmap ---------- */

export function Heatmap({ cells, label }: { cells: { key: string; level: 0 | 1 | 2 | 3 | 4 | -1; today: boolean }[]; label: string }) {
  const { c } = useTheme();
  const colors = [c.surface2, c.heat1, c.heat2, c.heat3, c.heat4];
  const weeks = Math.ceil(cells.length / 7);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: weeks }, (_, wi) => (
        <View key={wi} style={{ flex: 1, gap: 3 }}>
          {cells.slice(wi * 7, wi * 7 + 7).map((cell) => (
            <View
              key={cell.key}
              style={{
                aspectRatio: 1,
                borderRadius: 3,
                backgroundColor: cell.level < 0 ? 'transparent' : colors[cell.level],
                boxShadow: cell.today ? `0px 0px 0px 2px ${c.hazard}` : undefined,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/* ---------- background ---------- */

/** Very soft color blobs behind everything: plum top left, yellow top right, plum bottom. Fixed while scrolling. */
export function Backdrop() {
  const { c } = useTheme();
  const { width: w, height: h } = useWindowDimensions();
  const blobs = [
    { id: 'a', col: rgba(c.shadeA), cx: 0, cy: 0, rx: 1.1 * w, ry: 0.55 * h, stop: 0.62 },
    { id: 'b', col: rgba(c.shadeB), cx: w, cy: 0.04 * h, rx: 0.85 * w, ry: 0.45 * h, stop: 0.64 },
    { id: 'c', col: rgba(c.shadeC), cx: w / 2, cy: 1.08 * h, rx: 0.9 * w, ry: 0.5 * h, stop: 0.7 },
  ];
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>
      <Svg width={w} height={h}>
        <Defs>
          {blobs.map((b) => (
            <RadialGradient key={b.id} id={'bg' + b.id} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fx={b.cx} fy={b.cy} gradientUnits="userSpaceOnUse">
              <Stop offset={0} stopColor={b.col.color} stopOpacity={b.col.opacity} />
              <Stop offset={b.stop} stopColor={b.col.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {blobs.map((b) => (
          <Ellipse key={b.id} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={`url(#bg${b.id})`} />
        ))}
      </Svg>
    </View>
  );
}

/* ---------- glass ---------- */

/** Translucent surface with blur behind it. Android gets the opaque fallback (blur there is experimental). */
export function Glass({ tone, style, children }: { tone: 'bar' | 'top'; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { c, dark } = useTheme();
  const canBlur = Platform.OS !== 'android';
  const bg = canBlur ? (tone === 'bar' ? c.glass : c.glassTop) : c.glassSolid;
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      {canBlur ? <BlurView intensity={40} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />
      {children}
    </View>
  );
}
