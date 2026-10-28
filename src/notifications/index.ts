/* Web: no local notifications. Android/iOS use index.native.ts. */
import type { Reminder } from '../game/reminders';

export const remindersSupported = false;

export async function ensurePermission(): Promise<boolean> {
  return false;
}

export async function syncReminders(_plan: Reminder[], _text: (r: Reminder) => { title: string; body: string }, _channelName: string): Promise<void> {}

export async function pauseRemindersBetween(_from: number, _to: number): Promise<void> {}
export async function scheduleOnce(_id: string, _at: Date, _title: string, _body: string, _channelName: string): Promise<void> {}
export async function cancelOnce(_id: string): Promise<void> {}
