/**
 * Date utility functions for handling Brazil timezone (America/Sao_Paulo)
 */

/**
 * Get today's date in Brazil timezone (America/Sao_Paulo)
 * Returns a string in YYYY-MM-DD format
 * 
 * This is important because toISOString() returns UTC date,
 * which can be a day ahead when it's late evening in Brazil (UTC-3)
 */
export function getTodayBrazilDate(): string {
  const now = new Date();
  // Use Intl.DateTimeFormat to get the date in Brazil timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA format returns YYYY-MM-DD
  return formatter.format(now);
}

/**
 * Check if an event date is in the past based on Brazil timezone
 * @param eventDate - Date string in YYYY-MM-DD format
 * @returns true if the event date is before today in Brazil timezone
 */
export function isEventPast(eventDate: string): boolean {
  const today = getTodayBrazilDate();
  return eventDate < today;
}

/**
 * Check if an event date is today or in the future based on Brazil timezone
 * @param eventDate - Date string in YYYY-MM-DD format
 * @returns true if the event date is today or after in Brazil timezone
 */
export function isEventUpcoming(eventDate: string): boolean {
  const today = getTodayBrazilDate();
  return eventDate >= today;
}
