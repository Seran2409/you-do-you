export interface LevelInfo {
  level: number;
  /** XP collected inside the current level */
  into: number;
  /** XP needed from this level to the next */
  need: number;
  pct: number;
}

/** From level L to L+1 you need 100 + 50·(L−1) XP. */
export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let acc = 0;
  let need = 100;
  while (xp >= acc + need) {
    acc += need;
    level++;
    need = 100 + 50 * (level - 1);
  }
  return { level, into: xp - acc, need, pct: Math.min(100, ((xp - acc) / need) * 100) };
}

/** Total XP needed to reach a level. */
export function levelThreshold(level: number): number {
  let acc = 0;
  for (let l = 1; l < level; l++) acc += 100 + 50 * (l - 1);
  return acc;
}

/** [from level, i18n key under "titles."] */
export const TITLES: [number, string][] = [
  [1, 'rookie'],
  [2, 'tracker'],
  [3, 'goGetter'],
  [4, 'sureFooted'],
  [5, 'pathfinder'],
  [7, 'summitSeeker'],
  [9, 'trailblazer'],
  [12, 'pioneer'],
  [15, 'unshakable'],
  [20, 'legend'],
];

export function levelTitleKey(level: number): string {
  let key = TITLES[0][1];
  for (const [from, k] of TITLES) if (level >= from) key = k;
  return key;
}
