import { router, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../data/AppStore';
import { headerDate } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, GUTTER, MAX_WIDTH } from '../../theme/tokens';
import { Glass, Logo } from '../../ui/graphics';
import { Icon, type IconName } from '../../ui/Icon';
import { useSheet } from '../../ui/overlays';
import { IconButton } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { SettingsSheet } from '../settings/SettingsSheet';

export const TOPBAR_H = 74;

export const TABS: { href: '/' | '/todos' | '/routines' | '/meditate' | '/level'; key: string; icon: IconName }[] = [
  { href: '/', key: 'home', icon: 'home' },
  { href: '/todos', key: 'todos', icon: 'todos' },
  { href: '/routines', key: 'routines', icon: 'repeat' },
  { href: '/meditate', key: 'meditate', icon: 'lotus' },
  { href: '/level', key: 'level', icon: 'trophy' },
];

export function TopBar() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { stats, today } = useStore();
  const sheet = useSheet();
  const cold = stats.streak === 0;
  return (
    <Glass tone="top" style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top, zIndex: 20 }}>
      <View
        style={{
          height: TOPBAR_H,
          width: '100%',
          maxWidth: MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: GUTTER,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <View style={{ flexShrink: 1, gap: 7 }}>
          <Logo label={t('app.name')} />
          <T v="tiny" muted style={{ fontSize: 12, paddingLeft: 3, letterSpacing: 0.2 }} numberOfLines={1}>
            {headerDate(today)}
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => router.navigate('/level')}
            accessibilityRole="button"
            accessibilityLabel={t('top.stat', { count: stats.streak, level: stats.level.level })}
            style={{ flexDirection: 'row', height: 32, borderRadius: 99, overflow: 'hidden', borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9 }}>
              <Icon name="flame" size={16} color={cold ? c.muted : c.flame} />
              <T v="monoBold">{stats.streak}</T>
            </View>
            <View style={{ justifyContent: 'center', paddingHorizontal: 9, backgroundColor: c.hazard }}>
              <T v="monoBold" color={c.hazardInk}>
                Lv {stats.level.level}
              </T>
            </View>
          </Pressable>
          <IconButton icon="sliders" label={t('top.settings')} onPress={() => sheet.open((close) => <SettingsSheet close={close} />, t('settings.title'))} />
        </View>
      </View>
    </Glass>
  );
}

export function TabBar() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingBottom: 10 + insets.bottom, zIndex: 26 }}>
      <Glass
        tone="bar"
        style={{ width: '100%', maxWidth: 430, alignSelf: 'center', borderRadius: 32, borderWidth: 1, borderColor: c.glassLine, boxShadow: c.glassShadow }}
      >
        <View accessibilityRole="tablist" accessibilityLabel={t('tabs.label')} style={{ flexDirection: 'row', gap: 4, padding: 6 }}>
          {TABS.map((tab) => {
            const on = path === tab.href;
            return (
              <Pressable
                key={tab.href}
                accessibilityRole="tab"
                aria-selected={on}
                onPress={() => router.navigate(tab.href)}
                style={({ pressed }) => [
                  { flex: 1, alignItems: 'center', gap: 2, paddingTop: 7, paddingBottom: 5, borderRadius: 26 },
                  on && { backgroundColor: c.tabActive },
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <Icon name={tab.icon} size={23} color={on ? c.tabActiveFg : c.muted} />
                <T v="tiny" color={on ? c.tabActiveFg : c.muted} style={{ fontSize: 11, lineHeight: 14, fontFamily: fonts.bodyBold }} numberOfLines={1}>
                  {t(`tabs.${tab.key}`)}
                </T>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

/** Scrollable page column (max 600 px) under the glass bars, with an optional floating add button. */
export function Screen({ children, fab }: { children: ReactNode; fab?: { label: string; a11y: string; onPress: () => void } }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: GUTTER,
          paddingTop: insets.top + TOPBAR_H + 6,
          paddingBottom: 150 + insets.bottom,
          gap: 22,
        }}
      >
        {children}
      </ScrollView>
      {fab ? <Fab {...fab} /> : null}
    </View>
  );
}

function Fab({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 92 + insets.bottom, zIndex: 25 }}>
      <View pointerEvents="box-none" style={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', alignItems: 'flex-end', paddingHorizontal: GUTTER }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={a11y}
          style={({ pressed }) => [
            {
              height: 54,
              paddingLeft: 16,
              paddingRight: 20,
              borderRadius: 17,
              backgroundColor: c.fabBg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              boxShadow: c.glassShadow,
            },
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Icon name="plus" size={22} color={c.fabFg} strokeWidth={2.6} />
          <T v="bold" color={c.fabFg}>
            {label}
          </T>
        </Pressable>
      </View>
    </View>
  );
}
