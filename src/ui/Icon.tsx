import { cloneElement, type ReactElement } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/* Line icons from the prototype (24×24, stroke 2, round caps). */
const P = (d: string) => <Path d={d} />;

const ICONS: Record<string, ReactElement[]> = {
  home: [P('M3 11l9-7 9 7'), P('M5 10v10h14V10'), P('M10 20v-6h4v6')],
  todos: [P('M10 6h11M10 12h11M10 18h11'), P('M3.5 6l1.6 1.6L8 4.7M3.5 12l1.6 1.6L8 10.7M3.5 18l1.6 1.6L8 16.7')],
  repeat: [P('M17 2l3 3-3 3'), P('M4 11V9a4 4 0 0 1 4-4h12'), P('M7 22l-3-3 3-3'), P('M20 13v2a4 4 0 0 1-4 4H4')],
  trophy: [P('M8 4h8v5a4 4 0 0 1-8 0z'), P('M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4'), P('M12 13v4M8 21h8M10 17h4')],
  sliders: [P('M4 7h9M18 7h2M4 17h3M12 17h8'), <Circle cx={15.5} cy={7} r={2.3} />, <Circle cx={9.5} cy={17} r={2.3} />],
  plus: [P('M12 5v14M5 12h14')],
  minus: [P('M5 12h14')],
  left: [P('M15 6l-6 6 6 6')],
  right: [P('M9 6l6 6-6 6')],
  dots: [],
  flame: [P('M12 3c1 3.6 5 5.4 5 10a5 5 0 0 1-10 0c0-2.4 1.4-4 2.4-5 .3 1.5 1 2.6 2.1 3.1.5-3-.5-5.4.5-8.1z')],
  check: [P('M5 12.5l4.5 4.5L19 7.5')],
  x: [P('M6 6l12 12M18 6L6 18')],
  mail: [<Rect x={3} y={5} width={18} height={14} rx={2} />, P('M3 7l9 6 9-6')],
  bell: [P('M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z'), P('M10 21h4')],
  warn: [P('M12 3.5l9.5 16.5h-19z'), P('M12 10v4.5M12 17.4v.1')],
  star: [P('M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z')],
  bolt: [P('M13 2L4 14h7l-1 8 9-12h-7z')],
  cal: [<Rect x={3} y={5} width={18} height={16} rx={2} />, P('M3 10h18M8 3v4M16 3v4')],
  layers: [P('M12 3l9 5-9 5-9-5z'), P('M3 13l9 5 9-5')],
  crown: [P('M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z')],
  flag: [P('M5 21V4M5 4h11l-2 4 2 4H5')],
  trash: [P('M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13')],
  edit: [P('M4 20h4L19 9l-4-4L4 16z'), P('M13.5 6.5l4 4')],
  move: [P('M5 12h14M13 6l6 6-6 6')],
  chev: [P('M9 6l6 6-6 6')],
  download: [P('M12 4v11M7 10l5 5 5-5'), P('M5 20h14')],
  sunrise: [P('M12 3v4'), P('M5.6 9.6l1.4 1.4M18.4 9.6l-1.4 1.4'), P('M3 18h18'), P('M7 18a5 5 0 0 1 10 0'), P('M8 21h8')],
  sun: [<Circle cx={12} cy={12} r={4} />, P('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4')],
  moon: [P('M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z')],
  clock: [<Circle cx={12} cy={12} r={9} />, P('M12 7v5l3 2')],
  lotus: [
    P('M12 4c2.2 2.4 3 5 3 7.5S13.6 16 12 17c-1.6-1-3-3-3-5.5S9.8 6.4 12 4z'),
    P('M4.5 9.5c2.8.3 5 1.8 6.5 4.2-.4 1.6-1.2 2.6-2.5 3.3-2.6-.6-4-3.2-4-7.5z'),
    P('M19.5 9.5c-2.8.3-5 1.8-6.5 4.2.4 1.6 1.2 2.6 2.5 3.3 2.6-.6 4-3.2 4-7.5z'),
    P('M5 19.5c2 .8 4.4 1 7 1s5-.2 7-1'),
  ],
  play: [P('M8 5.5v13l10.5-6.5z')],
  pause: [P('M9 5v14M15 5v14')],
  upload: [P('M12 20V9M7 14l5-5 5 5'), P('M5 4h14')],
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const { c } = useTheme();
  const col = color ?? c.ink;
  if (name === 'dots') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G fill={col}>
          <Circle cx={5} cy={12} r={1.7} />
          <Circle cx={12} cy={12} r={1.7} />
          <Circle cx={19} cy={12} r={1.7} />
        </G>
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={col} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {ICONS[name].map((el, i) => cloneElement(el, { key: i }))}
      </G>
    </Svg>
  );
}
