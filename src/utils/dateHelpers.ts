// Date helpers for Habit Candlestick Tracker (all dates in YYYY-MM-DD format)

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Ensure we fall back to 2026 if the environment is locked to 2026, or use current system year
  const actualYear = year < 2026 ? 2026 : year;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${actualYear}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
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
  const date = new Date(dateStr + "T00:00:00Z");
  if (isNaN(date.getTime())) return dateStr;
  
  if (type === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
}

// Returns the Monday (YYYY-MM-DD) of the week containing dateStr
export function getStartOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  const day = date.getUTCDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setUTCDate(diff);
  return date.toISOString().split('T')[0];
}

export function getMonthLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function getYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7); // "YYYY-MM"
}

export function getAdjustedTodayDateString(timezoneOffsetHours: number = 6.5, nightOwlOffsetHours: number = 0): string {
  const now = new Date();
  
  // 1. Get the current UTC time in milliseconds
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  
  // 2. Adjust to the selected timezone offset
  const targetTimeMs = utcMs + (timezoneOffsetHours * 60 * 60 * 1000);
  const targetDate = new Date(targetTimeMs);
  
  // 3. Apply Night Owl Offset
  const targetHours = targetDate.getHours();
  if (targetHours < nightOwlOffsetHours) {
    targetDate.setDate(targetDate.getDate() - 1);
  }
  
  const year = targetDate.getFullYear();
  const actualYear = year < 2026 ? 2026 : year;
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  
  return `${actualYear}-${month}-${day}`;
}

