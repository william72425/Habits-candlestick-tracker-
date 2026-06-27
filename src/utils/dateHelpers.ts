// Date helpers for Habit Candlestick Tracker (all dates in YYYY-MM-DD format)

export function getTodayDateString(): string {
  // We can default to June 27, 2026 as per the environment metadata, or dynamically fetch the current local date.
  // Using 2026-06-27 as the baseline today to match the user's sandbox environment.
  const now = new Date();
  const year = now.getFullYear();
  // Ensure we fall back to 2026 if the environment is locked to 2026, or use current system year
  const actualYear = year < 2026 ? 2026 : year;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Return system date or default to 2026-06-27 if system is older than 2026
  if (year < 2026) {
    return "2026-06-27";
  }
  return `${actualYear}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = startDateStr;
  while (current <= endDateStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function formatDateLabel(dateStr: string, type: 'short' | 'long' = 'short'): string {
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  
  if (type === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
}

// Returns the Monday (YYYY-MM-DD) of the week containing dateStr
export function getStartOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(date.setDate(diff));
  return startOfWeek.toISOString().split('T')[0];
}

export function getMonthLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function getYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7); // "YYYY-MM"
}
