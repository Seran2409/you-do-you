import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../data/AppStore';
import { pad } from '../../game/dates';
import { planReminders, type Reminder } from '../../game/reminders';
import { GOAL_BONUS } from '../../game/rules';
import { remindersSupported, syncReminders } from '../../notifications';

export function reminderText(r: Reminder, t: TFunction): { title: string; body: string } {
  if (r.kind === 'evening') return { title: t('notify.eveningTitle'), body: t('notify.eveningBody', { count: r.remaining, xp: GOAL_BONUS }) };
  if (r.kind === 'mindful') return { title: t('notify.mindfulTitle'), body: t('notify.mindfulBody') };
  return {
    title: r.doneYesterday ? t('notify.doneTitle', { count: r.doneYesterday }) : t('notify.newDayTitle'),
    body: r.open ? t('notify.openBody', { count: r.open }) : t('notify.noneOpenBody'),
  };
}

/** Reschedules local reminders shortly after every change (data, settings, language, new day). */
export function ReminderSync() {
  const { ready, data, settings, goal, mindfulGoal, today } = useStore();
  const { t, i18n } = useTranslation();
  useEffect(() => {
    if (!ready || !remindersSupported) return;
    const timer = setTimeout(() => {
      const now = new Date();
      const plan = planReminders(data, settings.push, goal, today, pad(now.getHours()) + ':' + pad(now.getMinutes()), mindfulGoal);
      syncReminders(plan, (r) => reminderText(r, t), t('notify.channel')).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [ready, data, settings.push, goal, mindfulGoal, today, t, i18n.language]);
  return null;
}
