/** ISO-like week label `YYYY-Www` for bucketing weekly actions. */
export function getIsoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const weekNo = Math.ceil((d.getTime() - yearStart.getTime()) / 86400000 / 7);
  const clamped = Math.max(1, Math.min(53, weekNo));
  return `${year}-W${String(clamped).padStart(2, "0")}`;
}

export function parseWeekKey(wk: string): { year: number; week: number } {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(wk.trim());
  if (!m) return { year: new Date().getFullYear(), week: 1 };
  return { year: Number(m[1]), week: Number(m[2]) };
}

export function previousWeekKey(wk: string): string {
  let { year, week } = parseWeekKey(wk);
  if (week <= 1) {
    year -= 1;
    week = 52;
  } else {
    week -= 1;
  }
  return `${year}-W${String(week).padStart(2, "0")}`;
}
