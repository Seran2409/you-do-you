import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import type { ThemePref } from '../game/types';
import { dark, light, onBlackColors, type Colors } from './tokens';

interface Theme {
  c: Colors;
  dark: boolean;
}

const Ctx = createContext<Theme>({ c: light, dark: false });

export function ThemeProvider({ pref, children }: { pref: ThemePref | undefined; children: ReactNode }) {
  const system = useColorScheme();
  const isDark = pref === 'dark' || (pref !== 'light' && system === 'dark');
  const value = useMemo(() => ({ c: isDark ? dark : light, dark: isDark }), [isDark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Inside black widgets ink/muted/track/accent flip to light values, like .w-black in the prototype. */
export function OnBlack({ children }: { children: ReactNode }) {
  const t = useContext(Ctx);
  const value = useMemo(() => ({ ...t, c: onBlackColors(t.c) }), [t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
