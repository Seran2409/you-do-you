import { Fragment } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';

export type Variant = 'h1' | 'h2' | 'body' | 'bold' | 'small' | 'smallBold' | 'tiny' | 'eyebrow' | 'mono' | 'monoBold' | 'display';

const base: Record<Variant, TextStyle> = {
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, letterSpacing: -0.2 },
  display: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 36 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bold: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 20 },
  tiny: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 1.1, textTransform: 'uppercase' },
  mono: { fontFamily: fonts.mono, fontSize: 13, fontVariant: ['tabular-nums'] },
  monoBold: { fontFamily: fonts.monoBold, fontSize: 13, fontVariant: ['tabular-nums'] },
};

interface Props extends TextProps {
  v?: Variant;
  muted?: boolean;
  color?: string;
}

export function T({ v = 'body', muted, color, style, ...rest }: Props) {
  const { c } = useTheme();
  return <Text {...rest} style={[base[v], { color: color ?? (muted ? c.muted : c.ink) }, style]} />;
}

/** Render a translated string containing <b>…</b> with bold spans. */
export function Rich({ text, v = 'body', boldFont = fonts.bodyBold, ...rest }: Props & { text: string; boldFont?: string }) {
  const parts = text.split(/<b>(.*?)<\/b>/);
  return (
    <T v={v} {...rest}>
      {parts.map((p, i) =>
        i % 2 ? (
          <Text key={i} style={{ fontFamily: boldFont }}>
            {p}
          </Text>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </T>
  );
}

/** User text going into a <b>-template must not be parsed as markup. */
export const safe = (s: string) => s.replace(/</g, '‹');
