import { Platform } from 'react-native';
import Dnd from '../../modules/dnd-control';

/*
 * "Do not disturb" during a session. Android: the app switches the system mode itself after the
 * user granted access once. iOS does not let apps change Focus, so we show a hint instead.
 */

/** Android's INTERRUPTION_FILTER_ALARMS: only alarms get through. */
const ALARMS_ONLY = 4;

export type QuietSupport = 'system' | 'ios-hint' | 'none';
export const quietSupport: QuietSupport = Dnd ? 'system' : Platform.OS === 'ios' ? 'ios-hint' : 'none';

export function quietAccess(): boolean {
  try {
    return !!Dnd?.hasAccess();
  } catch {
    return false;
  }
}

export function openQuietAccess(): void {
  try {
    Dnd?.openAccessSettings();
  } catch {
    // Settings screen missing on this device; nothing else to do.
  }
}

/** Turns on "alarms only"; returns the previous mode to restore later, or null if not possible. */
export function startQuiet(): number | null {
  try {
    if (!Dnd || !Dnd.hasAccess()) return null;
    const prev = Dnd.getFilter();
    Dnd.setFilter(ALARMS_ONLY);
    return prev;
  } catch {
    return null;
  }
}

export function endQuiet(prev: number | null | undefined): void {
  try {
    if (Dnd && prev != null && prev > 0) Dnd.setFilter(prev);
  } catch {
    // Access was revoked meanwhile; the system keeps its current mode.
  }
}
