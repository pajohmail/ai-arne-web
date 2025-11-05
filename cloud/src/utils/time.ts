export function isBiweeklyTrigger(date = new Date(), weekStart = 1) {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const weekNo = 1 + Math.round(((+tmp - +firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return weekNo % 2 === 0;
}

/**
 * Returnerar datumet för en vecka sedan från nu
 */
export function getOneWeekAgo(): Date {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  return oneWeekAgo;
}

/**
 * Kontrollerar om ett datum är inom senaste veckan
 */
export function isWithinLastWeek(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;
  
  const oneWeekAgo = getOneWeekAgo();
  return dateObj >= oneWeekAgo;
}
