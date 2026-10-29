import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/*
 * Web-only document shell: viewport, theme colors, manifest and icons for "Add to Home Screen".
 * Since SDK 58 the template must render headNodes/bodyNodes itself (styles, bundle scripts, fonts).
 */
const BASE = '/you-do-you';

export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="de" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>You Do You</title>
        <meta name="description" content="To-dos, Routinen und Meditation als sanftes Spiel: XP, Level, Streaks und Abzeichen. / To-dos, routines and meditation as a gentle game." />
        <meta name="theme-color" content="#FFF8EF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1E1712" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="You Do You" />
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE}/icons/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${BASE}/icons/icon-192.png`} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const css = `
body { background-color: #FFF8EF; overscroll-behavior-y: none; }
@media (prefers-color-scheme: dark) { body { background-color: #1E1712; } }
input, textarea { outline: none; }
:focus-visible { outline: 2px solid #B5582F; outline-offset: 2px; }
`;
