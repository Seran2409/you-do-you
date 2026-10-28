import Constants from 'expo-constants';

/** Public website (GitHub Pages). Legal pages and the web version live here. */
export const SITE_URL = 'https://seran2409.github.io/you-do-you';

export const LEGAL = {
  de: { privacy: `${SITE_URL}/legal/datenschutz.html`, terms: `${SITE_URL}/legal/agb.html`, imprint: `${SITE_URL}/legal/impressum.html`, support: `${SITE_URL}/legal/hilfe.html` },
  en: { privacy: `${SITE_URL}/legal/privacy.html`, terms: `${SITE_URL}/legal/terms.html`, imprint: `${SITE_URL}/legal/imprint.html`, support: `${SITE_URL}/legal/support.html` },
};

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
