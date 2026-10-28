/*
 * Design tokens for "You Do You": warm, cozy, sunny.
 * Roles: marigold = game layer (XP, level, badges), terracotta = actions and progress,
 * sunrise peach = quote and highlights, cocoa = hero cards, sage = done, coral = streak,
 * lavender = meditation. Dark mode is a warm espresso, never cold black.
 * Key names are shared with the sister app so the building blocks stay the same.
 */

export const light = {
  bg: '#FFF8EF',
  surface: '#FFFFFF',
  surface2: '#F8EDE1',
  ink: '#3B2A21',
  muted: '#8B7264',
  line: '#F0E2D2',
  lineStrong: '#D9C2AE',
  hazard: '#F7B544',
  hazardInk: '#4A2E1F',
  hazardSoft: '#FFF0D4',
  hazardText: '#9A5B12',
  go: '#4E8A5E',
  goSoft: '#E2F1E2',
  onGo: '#FFFFFF',
  flame: '#E8734A',
  danger: '#C4513A',
  accent: '#B5582F',
  accentSoft: '#F8EDE1',
  onAccent: '#FFFFFF',
  plum: '#FFE3C8',
  plum2: '#FFCBA4',
  plumText: '#B5582F',
  onPlum: '#4A2E1F',
  plumLabel: '#B5582F',
  fabBg: '#B5582F',
  fabFg: '#FFFFFF',
  tabActiveFg: '#B5582F',
  tabActive: 'rgba(242,140,90,0.16)',
  wYellow: '#FFF6DF',
  wYellow2: '#FFEBC2',
  wPlum: '#FFF0E6',
  wPlum2: '#FFE0CF',
  wBlack: '#9A5A3C',
  wBlack2: '#6E3B27',
  wBlackLine: 'transparent',
  onBlack: '#FFF6EC',
  onBlackMuted: '#F3D9C6',
  trackOnBlack: 'rgba(255,246,236,0.22)',
  wGreen: '#EEF6EA',
  wGreen2: '#DDEDD5',
  wOrange: '#FFEDE2',
  wOrange2: '#FFDCC7',
  heat1: '#FDE6D2',
  heat2: '#F8BF93',
  heat3: '#EE9260',
  heat4: '#C8643B',
  track: 'rgba(59,42,33,0.10)',
  shadeA: 'rgba(255,170,120,0.22)',
  shadeB: 'rgba(255,205,110,0.32)',
  shadeC: 'rgba(240,150,130,0.16)',
  quoteShine: 'rgba(255,255,255,0.35)',
  glass: 'rgba(255,250,243,0.80)',
  glassSolid: '#FFFAF3',
  glassLine: 'rgba(74,46,31,0.08)',
  glassTop: 'rgba(255,248,239,0.82)',
  glassShadow: '0px 10px 30px rgba(120,70,40,0.14), 0px 1px 3px rgba(74,46,31,0.08)',
  focus: '#B5582F',
  shadow: '0px 1px 2px rgba(120,70,40,0.05), 0px 8px 22px rgba(120,70,40,0.08)',
  scrim: 'rgba(60,35,20,0.45)',
  calm: '#6F5BA8',
  calmSoft: '#EFEAF8',
  wCalm: '#F4EFFC',
  wCalm2: '#E6DCF7',
};

export type Colors = typeof light;

export const dark: Colors = {
  bg: '#1E1712',
  surface: '#2A2019',
  surface2: '#352920',
  ink: '#FBEEDF',
  muted: '#C4AD9B',
  line: '#3D3027',
  lineStrong: '#5C4A3D',
  hazard: '#F7B544',
  hazardInk: '#3A2414',
  hazardSoft: '#3F2F18',
  hazardText: '#F7C46A',
  go: '#7CC08C',
  goSoft: '#203A28',
  onGo: '#1E1712',
  flame: '#F28A60',
  danger: '#F08068',
  accent: '#F0A070',
  accentSoft: '#352920',
  onAccent: '#1E1712',
  plum: '#4A3123',
  plum2: '#33221A',
  plumText: '#F5B38E',
  onPlum: '#FBEEDF',
  plumLabel: '#F7C46A',
  fabBg: '#F0A070',
  fabFg: '#1E1712',
  tabActiveFg: '#F5B38E',
  tabActive: 'rgba(245,179,142,0.16)',
  wYellow: '#3A2E18',
  wYellow2: '#2E2412',
  wPlum: '#3A271E',
  wPlum2: '#2E1F18',
  wBlack: '#5A3423',
  wBlack2: '#3A2116',
  wBlackLine: 'rgba(255,255,255,0.06)',
  onBlack: '#FFF1E2',
  onBlackMuted: '#E3C6B1',
  trackOnBlack: 'rgba(255,241,226,0.18)',
  wGreen: '#1F3324',
  wGreen2: '#18291C',
  wOrange: '#3F2618',
  wOrange2: '#321E13',
  heat1: '#3D2A1F',
  heat2: '#7A4A30',
  heat3: '#C47A4E',
  heat4: '#F5B38E',
  track: 'rgba(255,241,226,0.12)',
  shadeA: 'rgba(240,140,80,0.14)',
  shadeB: 'rgba(247,181,68,0.10)',
  shadeC: 'rgba(200,100,80,0.10)',
  quoteShine: 'rgba(255,255,255,0.06)',
  glass: 'rgba(42,32,25,0.74)',
  glassSolid: '#2A2019',
  glassLine: 'rgba(255,255,255,0.07)',
  glassTop: 'rgba(30,23,18,0.80)',
  glassShadow: '0px 10px 30px rgba(0,0,0,0.45), 0px 1px 3px rgba(0,0,0,0.3)',
  focus: '#F5B38E',
  shadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 8px 22px rgba(0,0,0,0.25)',
  scrim: 'rgba(0,0,0,0.55)',
  calm: '#B6A6E6',
  calmSoft: '#2E2740',
  wCalm: '#2F2840',
  wCalm2: '#252033',
};

/** Colors inside the cocoa hero cards (ink/muted/track/accent flip to light values). */
export function onBlackColors(c: Colors): Colors {
  return { ...c, ink: c.onBlack, muted: c.onBlackMuted, track: c.trackOnBlack, accent: c.onBlack, onAccent: c.wBlack2 };
}

export type Tint = 'yellow' | 'plum' | 'black' | 'green' | 'orange' | 'calm';

export function tintColors(c: Colors, tint: Tint): [string, string] {
  switch (tint) {
    case 'yellow':
      return [c.wYellow, c.wYellow2];
    case 'plum':
      return [c.wPlum, c.wPlum2];
    case 'black':
      return [c.wBlack, c.wBlack2];
    case 'green':
      return [c.wGreen, c.wGreen2];
    case 'orange':
      return [c.wOrange, c.wOrange2];
    case 'calm':
      return [c.wCalm, c.wCalm2];
  }
}

export const fonts = {
  display: 'Fraunces_700Bold',
  displayMedium: 'Fraunces_600SemiBold',
  displayHeavy: 'Fraunces_800ExtraBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  body: 'Nunito_400Regular',
  bodyBold: 'Nunito_700Bold',
  mono: 'Nunito_600SemiBold',
  monoBold: 'Nunito_800ExtraBold',
  tape: 'Fraunces_600SemiBold',
};

export const radius = { r: 22, sm: 14 };
export const MAX_WIDTH = 600;
export const GUTTER = 16;
