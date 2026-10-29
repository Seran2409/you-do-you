import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'de' }] }));

const { default: i18n, resolveLang } = await import('../index');
const { fmtNumber, headerDate, periodLabel, dayLabel, joinList } = await import('../format');
const { compareLocales } = await import('../../../scripts/check-locales');
const de = (await import('../../../locales/de.json')).default;
const en = (await import('../../../locales/en.json')).default;

const TODAY = '2026-10-26';

describe('languages', () => {
  it('starts in German for a German device, explicit choice wins', () => {
    expect(i18n.language).toBe('de');
    expect(resolveLang('system')).toBe('de');
    expect(resolveLang('en')).toBe('en');
  });

  it('has the same keys in de.json and en.json', () => {
    expect(compareLocales(de, en)).toEqual({ onlyA: [], onlyB: [] });
    expect(compareLocales({ a: 1, b_one: 1, b_other: 1 }, { a: 1 })).toEqual({ onlyA: ['b'], onlyB: [] });
  });

  it.each([
    ['de', 0, '0 To-dos auf heute geholt'],
    ['de', 1, '1 To-do auf heute geholt'],
    ['de', 2, '2 To-dos auf heute geholt'],
    ['en', 0, 'Moved 0 to-dos to today'],
    ['en', 1, 'Moved 1 to-do to today'],
    ['en', 2, 'Moved 2 to-dos to today'],
  ])('plural %s %i', async (lang, count, text) => {
    await i18n.changeLanguage(lang);
    expect(i18n.t('toast.movedToday', { count })).toBe(text);
  });

  it('formats dates and numbers per language', async () => {
    await i18n.changeLanguage('de');
    expect(headerDate(TODAY)).toBe('Montag, 26. Oktober');
    expect(periodLabel('woche', TODAY, TODAY)).toBe('KW 44 · 26.10.–1.11.');
    expect(periodLabel('monat', TODAY, TODAY)).toBe('Oktober 2026');
    expect(dayLabel('2026-10-27', TODAY)).toBe('Morgen');
    expect(fmtNumber(1635)).toBe('1.635');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b und c');

    await i18n.changeLanguage('en');
    expect(headerDate(TODAY)).toBe('Monday, October 26');
    expect(periodLabel('woche', TODAY, TODAY)).toBe('Week 44 · 10/26–11/1');
    expect(fmtNumber(1635)).toBe('1,635');
    expect(joinList(['a', 'b'])).toBe('a and b');
  });

  it('has a quote list per language', () => {
    expect(de.quotes.length).toBeGreaterThanOrEqual(30);
    expect(en.quotes.length).toBeGreaterThanOrEqual(30);
  });
});
