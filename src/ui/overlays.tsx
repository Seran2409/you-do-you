import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribe } from '../data/feedback';
import { levelTitleKey, type LevelInfo } from '../game/level';
import { useTheme } from '../theme/ThemeProvider';
import { MAX_WIDTH, fonts } from '../theme/tokens';
import { HexBadge } from './graphics';
import { Button, IconButton } from './primitives';
import { maybeAskForReview } from './review';
import { Rich, T, safe } from './Text';

/* ============ sheet ============ */

type SheetRender = (close: () => void) => ReactNode;
interface SheetApi {
  open(render: SheetRender, label: string): void;
  close(): void;
}
const SheetCtx = createContext<SheetApi>({ open() {}, close() {} });
export const useSheet = () => useContext(SheetCtx);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<{ render: SheetRender; label: string; key: number } | null>(null);
  const counter = useRef(0);
  const close = useCallback(() => setSheet(null), []);
  const api = useMemo<SheetApi>(() => ({ open: (render, label) => setSheet({ render, label, key: ++counter.current }), close }), [close]);
  return (
    <SheetCtx.Provider value={api}>
      {children}
      <SheetModal sheet={sheet} close={close} />
    </SheetCtx.Provider>
  );
}

function SheetModal({ sheet, close }: { sheet: { render: SheetRender; label: string; key: number } | null; close: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={!!sheet} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Pressable accessibilityLabel="close" importantForAccessibility="no" style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={close} />
          {sheet ? (
            <Animated.View
              key={sheet.key}
              entering={FadeInDown.duration(220)}
              accessibilityViewIsModal
              accessibilityLabel={sheet.label}
              style={{
                width: '100%',
                maxWidth: MAX_WIDTH,
                maxHeight: height * 0.9,
                backgroundColor: c.bg,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
              }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 18, paddingBottom: 20 + insets.bottom }}
              >
                <View style={{ width: 40, height: 5, borderRadius: 9, backgroundColor: c.lineStrong, alignSelf: 'center', marginBottom: 12 }} />
                {sheet.render(close)}
              </ScrollView>
            </Animated.View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetHead({ title, onClose }: { title: string; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
      <T v="h2" accessibilityRole="header" style={{ flex: 1 }}>
        {title}
      </T>
      <IconButton icon="x" label={t('common.close')} onPress={onClose} />
    </View>
  );
}

/* ============ toasts ============ */

type ToastKind = 'xp' | 'warn' | undefined;
interface ToastItem {
  id: number;
  msg: string;
  kind: ToastKind;
}
const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const n = useRef(0);
  const show = useCallback((msg: string, kind?: ToastKind) => {
    const id = ++n.current;
    setItems((x) => [...x.slice(-3), { id, msg, kind }]);
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(msg);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === 'warn' ? 4200 : 2200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <Toasts items={items} />
    </ToastCtx.Provider>
  );
}

function Toasts({ items }: { items: ToastItem[] }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', left: 16, right: 16, bottom: 150 + insets.bottom, alignItems: 'center', gap: 8, zIndex: 50 }}
    >
      {items.map((i) => {
        const xp = i.kind === 'xp';
        const bg = xp ? c.hazard : i.kind === 'warn' ? c.danger : c.ink;
        const fg = xp ? c.hazardInk : i.kind === 'warn' ? '#FFFFFF' : c.bg;
        return (
          <Animated.View
            key={i.id}
            entering={FadeInDown.duration(250)}
            exiting={FadeOut.duration(250)}
            style={{
              maxWidth: 520,
              backgroundColor: bg,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 13,
              boxShadow: xp ? `0px 0px 0px 2px ${c.hazardInk}, ${c.shadow}` : c.shadow,
            }}
          >
            <T style={{ fontFamily: xp ? fonts.monoBold : fonts.bodyBold, fontSize: xp ? 16 : 14, color: fg }}>{i.msg}</T>
          </Animated.View>
        );
      })}
    </View>
  );
}

/* ============ confetti ============ */

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  r: number;
  vr: number;
}

const FRAMES = 80;

function Piece({ p, clock }: { p: Particle; clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const f = clock.value * FRAMES;
    // Closed form of the prototype's per-frame physics: vy += .33, vx *= .985.
    const x = p.x + (p.vx * (1 - Math.pow(0.985, f))) / 0.015;
    const y = p.y + p.vy * f + (0.33 * f * (f + 1)) / 2;
    const left = p.life - f;
    return {
      opacity: left <= 0 ? 0 : Math.min(1, left / 20),
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${p.r + p.vr * f}rad` }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: p.size, height: p.size * 0.66, backgroundColor: p.color }, style]} />;
}

function ConfettiBurst({ parts, onDone }: { parts: Particle[]; onDone: () => void }) {
  const clock = useSharedValue(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    clock.value = withTiming(1, { duration: (FRAMES / 60) * 1000, easing: Easing.linear });
    const t = setTimeout(() => done.current(), (FRAMES / 60) * 1000 + 50);
    return () => clearTimeout(t);
  }, [clock]);
  return (
    <>
      {parts.map((p) => (
        <Piece key={p.id} p={p} clock={clock} />
      ))}
    </>
  );
}

/* ============ feedback bridge ============ */

/** Last touch position, so confetti bursts from where the user tapped. */
export const lastTouch = { x: -1, y: -1 };

export function FxLayer() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const sheet = useSheet();
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [bursts, setBursts] = useState<{ id: number; parts: Particle[] }[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const h = (e: PointerEvent) => {
      lastTouch.x = e.clientX;
      lastTouch.y = e.clientY;
    };
    document.addEventListener('pointerdown', h, true);
    return () => document.removeEventListener('pointerdown', h, true);
  }, []);

  const burst = useCallback(
    (x: number, y: number, n: number) => {
      if (reduce) return;
      const cols = [c.hazard, c.go, c.flame, c.hazardInk];
      const parts: Particle[] = Array.from({ length: n }, (_, i) => ({
        id: ++seq.current,
        x,
        y,
        vx: (Math.random() - 0.5) * 9,
        vy: -Math.random() * 9 - 2,
        life: 50 + Math.random() * 30,
        color: cols[i % cols.length],
        size: 4 + Math.random() * 4,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
      }));
      const id = ++seq.current;
      setBursts((b) => [...b, { id, parts }]);
    },
    [c, reduce],
  );

  const showLevelUp = useCallback(
    (L: LevelInfo) => {
      sheet.open(
        (close) => (
          <View style={{ alignItems: 'center', gap: 12, paddingTop: 10, paddingBottom: 4 }}>
            <HexBadge level={L.level} size={110} />
            <T v="eyebrow" muted>
              {t('level.upEyebrow')}
            </T>
            <T v="h1" style={{ fontSize: 30, lineHeight: 34 }}>
              {t('level.upTitle', { level: L.level })}
            </T>
            <Rich text={t('level.upText', { title: safe(t(`titles.${levelTitleKey(L.level)}`)) })} muted style={{ textAlign: 'center' }} />
            <Button
              label={t('common.continue')}
              onPress={() => {
                close();
                maybeAskForReview(L.level);
              }}
              style={{ minWidth: 180 }}
            />
          </View>
        ),
        t('level.upEyebrow'),
      );
      burst(width / 2, height * 0.45, 70);
    },
    [sheet, t, burst, width, height],
  );

  useEffect(
    () =>
      subscribe((e) => {
        if (e.type === 'xp') {
          toast(t('toast.xp', { xp: e.amount }), 'xp');
          const x = lastTouch.x >= 0 ? lastTouch.x : width / 2;
          const y = lastTouch.y >= 0 ? lastTouch.y : height / 2;
          burst(x, y, 28);
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(12);
        } else if (e.type === 'levelUp') {
          setTimeout(() => showLevelUp(e.level), 450);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else if (e.type === 'badge') {
          setTimeout(() => toast(t('toast.badge', { name: t(`badges.${e.key}.name`) })), 900);
        } else if (e.type === 'toast') {
          toast(e.message, e.kind);
        }
      }),
    [toast, t, burst, showLevelUp, width, height],
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 45 }]} importantForAccessibility="no-hide-descendants">
      {bursts.map((b) => (
        <ConfettiBurst key={b.id} parts={b.parts} onDone={() => setBursts((x) => x.filter((y) => y.id !== b.id))} />
      ))}
    </View>
  );
}
