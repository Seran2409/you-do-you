export type DaySlot = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export function daySlot(hour: number): DaySlot {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}
