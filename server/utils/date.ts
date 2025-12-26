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

/**
 * Create a Date object for a specific date/time in Brazil timezone (America/Sao_Paulo)
 * This ensures dates are stored correctly regardless of server timezone
 * 
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12, NOT 0-indexed)
 * @param day - Day of month (1-31)
 * @param hour - Hour (0-23), defaults to 0
 * @param minute - Minute (0-59), defaults to 0
 * @param second - Second (0-59), defaults to 0
 * @returns Date object representing the specified time in Brazil timezone
 */
export function createBrazilDate(
  year: number, 
  month: number, 
  day: number, 
  hour: number = 0, 
  minute: number = 0, 
  second: number = 0
): Date {
  // Format: YYYY-MM-DDTHH:mm:ss-03:00 for São Paulo (standard time)
  // Note: Brazil doesn't observe DST since 2019, so -03:00 is always correct
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}-03:00`;
  return new Date(dateStr);
}
