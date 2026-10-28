import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from '../../locales/de.json';
import en from '../../locales/en.json';
import type { Language } from '../game/types';

export type Lang = 'de' | 'en';

/** Device language German -> German, everything else -> English. */
export function deviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'de' ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

export function resolveLang(pref: Language | undefined): Lang {
  return pref === 'de' || pref === 'en' ? pref : deviceLang();
}

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: deviceLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
