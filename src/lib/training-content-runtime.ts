/** Shuffle / pool selection for training content attempts (deterministic with seed). */

export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rand = mulberry32(seed);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickQuestionPool<T extends { id: string }>(
  all: T[],
  count: number,
  seedStr: string,
): T[] {
  const shuffled = shuffleWithSeed(all, seedStr);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function shuffleOptionIds(optionIds: string[], seedStr: string): string[] {
  return shuffleWithSeed(optionIds, seedStr);
}
