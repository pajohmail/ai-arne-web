/**
 * Time utility-funktioner
 * 
 * Denna modul tillhandahåller helper-funktioner för tidsrelaterade operationer:
 * - Veckonummer-beräkningar
 * - Datum-filtrering (senaste veckan)
 * 
 * @module time
 */

/**
 * Kontrollerar om ett datum är i en jämn vecka (för biweekly triggers)
 * 
 * Funktionen beräknar veckonumret enligt ISO 8601-standard och returnerar
 * true om veckonumret är jämnt (användbart för varannan vecka-triggers).
 * 
 * @param date - Datum att kontrollera (default: nu)
 * @param weekStart - Veckans startdag (default: 1 = måndag)
 * @returns true om veckonumret är jämnt, annars false
 * 
 * @example
 * const isEvenWeek = isBiweeklyTrigger(new Date());
 * if (isEvenWeek) {
 *   // Kör varannan vecka
 * }
 */
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
 * 
 * @returns Date-objekt för exakt en vecka sedan
 * 
 * @example
 * const oneWeekAgo = getOneWeekAgo();
 * console.log(oneWeekAgo); // Date för 7 dagar sedan
 */
export function getOneWeekAgo(): Date {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  return oneWeekAgo;
}

/**
 * Kontrollerar om ett datum är inom senaste veckan
 * 
 * Funktionen jämför ett datum med datumet för en vecka sedan och returnerar
 * true om datumet är nyare eller lika med en vecka sedan.
 * 
 * @param date - Datum att kontrollera (kan vara Date, ISO string, null eller undefined)
 * @returns true om datumet är inom senaste veckan, annars false
 * 
 * @example
 * const isRecent = isWithinLastWeek('2024-01-01T12:00:00Z');
 * if (isRecent) {
 *   // Hantera som ny release
 * }
 */
export function isWithinLastWeek(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;
  
  const oneWeekAgo = getOneWeekAgo();
  return dateObj >= oneWeekAgo;
}
