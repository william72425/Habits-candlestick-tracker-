import { Habit, Candle, DashboardMetrics } from '../types';
import { getTodayDateString, addDays, getDatesInRange, getStartOfWeek, getYearMonth, getMonthLabel, formatDateLabel } from './dateHelpers';

/**
 * Calculates the day-by-day Habit Performance Index score and OHLC candles.
 * 
 * MATH EXPLANATION FOR THE "HABIT STOCK MARKET" ALGORITHM:
 * 1. Base Value: Every user starts at a baseline index of 1000 points.
 * 2. Daily Delta: 
 *    - Each completed habit adds +50 points.
 *    - Each missed/uncompleted habit subtracts -50 points.
 * 3. Daily Intraday Path (Shadows/Wicks):
 *    To simulate trading activity within a single day, we process active habits in sequence.
 *    - Open: The score at the beginning of the day (previous day's close).
 *    - Path: [Open, Open + Delta_1, Open + Delta_1 + Delta_2, ...]
 *    - High: Peak index value reached during the day (Math.max of Path).
 *    - Low: Lowest index value dropped to during the day (Math.min of Path).
 *    - Close: Final index value at the end of the day.
 */
export function calculateDailyCandles(habits: Habit[], startDateStr: string, endDateStr: string): Candle[] {
  const dates = getDatesInRange(startDateStr, endDateStr);
  const candles: Candle[] = [];
  
  let currentScore = 1000; // Baseline index

  dates.forEach((date) => {
    const open = currentScore;
    
    // Only evaluate habits that were created on or before this date
    const activeHabits = habits.filter(h => h.createdDate <= date);
    
    if (activeHabits.length === 0) {
      // If no habits exist yet, index stays flat
      candles.push({
        timeLabel: date,
        open,
        high: open,
        low: open,
        close: open,
        volume: 0,
        totalActive: 0,
        isGreen: true,
        changePercent: 0,
        rawDate: date
      });
      return;
    }

    // Intraday path trace
    let tempScore = open;
    const pathScores = [tempScore];
    let completions = 0;

    // Sort habits deterministically by ID to ensure repeatable chart generations
    const sortedActive = [...activeHabits].sort((a, b) => a.id.localeCompare(b.id));

    sortedActive.forEach((habit) => {
      const isCompleted = habit.history[date] === true;
      if (isCompleted) {
        tempScore += 50;
        completions += 1;
      } else {
        tempScore -= 50;
      }
      pathScores.push(tempScore);
    });

    const close = tempScore;
    const high = Math.max(...pathScores);
    const low = Math.min(...pathScores);
    const isGreen = close >= open;
    const change = close - open;
    const changePercent = open === 0 ? 0 : (change / open) * 100;

    candles.push({
      timeLabel: date,
      open,
      high,
      low,
      close,
      volume: completions,
      totalActive: sortedActive.length,
      isGreen,
      changePercent,
      rawDate: date
    });

    currentScore = close; // Carry over close to next day's open
  });

  return candles;
}

/**
 * Aggregates daily candles into Weekly or Monthly intervals.
 * - Weekly: Combines days sharing the same Monday start-of-week.
 * - Monthly: Combines days sharing the same YYYY-MM year-month.
 */
export function aggregateCandles(
  dailyCandles: Candle[],
  timeframe: 'Daily' | 'Weekly' | 'Monthly'
): Candle[] {
  if (dailyCandles.length === 0) return [];
  if (timeframe === 'Daily') {
    return dailyCandles.map(c => ({
      ...c,
      timeLabel: formatDateLabel(c.rawDate, 'short')
    }));
  }

  const grouped: Record<string, Candle[]> = {};

  if (timeframe === 'Weekly') {
    dailyCandles.forEach((candle) => {
      const weekStart = getStartOfWeek(candle.rawDate);
      if (!grouped[weekStart]) {
        grouped[weekStart] = [];
      }
      grouped[weekStart].push(candle);
    });

    return Object.keys(grouped)
      .sort()
      .map((weekStart) => {
        const days = grouped[weekStart].sort((a, b) => a.rawDate.localeCompare(b.rawDate));
        const firstDay = days[0];
        const lastDay = days[days.length - 1];

        const open = firstDay.open;
        const close = lastDay.close;
        const high = Math.max(...days.map(d => d.high));
        const low = Math.min(...days.map(d => d.low));
        const volume = days.reduce((sum, d) => sum + d.volume, 0);
        const totalActive = days.reduce((sum, d) => sum + d.totalActive, 0);
        const isGreen = close >= open;
        const changePercent = open === 0 ? 0 : ((close - open) / open) * 100;

        // Label format: "Jun 01 - Jun 07"
        const startLabel = formatDateLabel(weekStart, 'short');
        const endLabel = formatDateLabel(addDays(weekStart, 6), 'short');

        return {
          timeLabel: `${startLabel} - ${endLabel}`,
          open,
          high,
          low,
          close,
          volume,
          totalActive,
          isGreen,
          changePercent,
          rawDate: weekStart
        };
      });
  } else {
    // Monthly aggregation
    dailyCandles.forEach((candle) => {
      const yearMonth = getYearMonth(candle.rawDate);
      if (!grouped[yearMonth]) {
        grouped[yearMonth] = [];
      }
      grouped[yearMonth].push(candle);
    });

    return Object.keys(grouped)
      .sort()
      .map((yearMonth) => {
        const days = grouped[yearMonth].sort((a, b) => a.rawDate.localeCompare(b.rawDate));
        const firstDay = days[0];
        const lastDay = days[days.length - 1];

        const open = firstDay.open;
        const close = lastDay.close;
        const high = Math.max(...days.map(d => d.high));
        const low = Math.min(...days.map(d => d.low));
        const volume = days.reduce((sum, d) => sum + d.volume, 0);
        const totalActive = days.reduce((sum, d) => sum + d.totalActive, 0);
        const isGreen = close >= open;
        const changePercent = open === 0 ? 0 : ((close - open) / open) * 100;

        return {
          timeLabel: getMonthLabel(firstDay.rawDate),
          open,
          high,
          low,
          close,
          volume,
          totalActive,
          isGreen,
          changePercent,
          rawDate: `${yearMonth}-01`
        };
      });
  }
}

/**
 * Calculates high-level metrics:
 * 1. Current Index Score & Percentage Change
 * 2. Total Win Rate (actual completions vs total daily opportunities since creation)
 * 3. Daily streaks (At least one habit completed)
 * 4. Most Volatile Habit (habit with the highest number of completion state toggles)
 */
export function calculateMetrics(habits: Habit[], dailyCandles: Candle[]): DashboardMetrics {
  const today = getTodayDateString();
  
  const currentScore = dailyCandles.length > 0 ? dailyCandles[dailyCandles.length - 1].close : 1000;
  const previousScore = dailyCandles.length > 1 ? dailyCandles[dailyCandles.length - 2].close : 1000;
  const scoreChange = currentScore - previousScore;
  const scoreChangePercent = previousScore === 0 ? 0 : (scoreChange / previousScore) * 100;

  // 1. Total Win Rate
  let totalOpportunities = 0;
  let totalCompletions = 0;

  habits.forEach((habit) => {
    // Opportunities = days from habit.createdDate to today
    const dates = getDatesInRange(habit.createdDate, today);
    totalOpportunities += dates.length;

    // Completions = occurrences of 'true' in history
    Object.keys(habit.history).forEach((date) => {
      // Only count if it falls within tracking range and is true
      if (date >= habit.createdDate && date <= today && habit.history[date] === true) {
        totalCompletions += 1;
      }
    });
  });

  const totalWinRate = totalOpportunities === 0 ? 100 : (totalCompletions / totalOpportunities) * 100;

  // 2. Streaks: Consecutive days (counting backwards) where at least one active habit is completed
  // Let's inspect the entire period of daily candles
  const streakDays = dailyCandles.map((c) => {
    const hasCompletion = c.volume > 0;
    return { date: c.rawDate, hasCompletion };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Longest Streak
  let longestStreak = 0;
  let runningStreak = 0;

  streakDays.forEach((day) => {
    if (day.hasCompletion) {
      runningStreak += 1;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  });

  // Current Streak (backwards from today)
  let currentStreak = 0;
  const reversedStreakDays = [...streakDays].reverse();
  
  // Find index of today in reversed list
  const todayIndex = reversedStreakDays.findIndex(d => d.date === today);
  
  if (todayIndex !== -1) {
    let checkIdx = todayIndex;
    
    // If today is NOT completed, check if yesterday was completed.
    // This allows the streak to persist "active" during today until the day completes.
    if (!reversedStreakDays[checkIdx].hasCompletion) {
      if (checkIdx + 1 < reversedStreakDays.length && reversedStreakDays[checkIdx + 1].hasCompletion) {
        // Today is not done, but yesterday was. Carry on from yesterday!
        checkIdx = checkIdx + 1;
      } else {
        // Neither today nor yesterday had any completions
        currentStreak = 0;
        checkIdx = -1; // Stop
      }
    }

    if (checkIdx !== -1) {
      for (let i = checkIdx; i < reversedStreakDays.length; i++) {
        if (reversedStreakDays[i].hasCompletion) {
          currentStreak += 1;
        } else {
          break;
        }
      }
    }
  }

  // 3. Most Volatile Habit
  // Volatility is defined by how many times a habit toggled between completed/uncompleted
  let mostVolatileHabitName = "None";
  let mostVolatileHabitSwitches = 0;

  habits.forEach((habit) => {
    const habitDates = getDatesInRange(habit.createdDate, today).sort();
    let switches = 0;
    let prevStatus: boolean | null = null;

    habitDates.forEach((date) => {
      const currentStatus = habit.history[date] === true;
      if (prevStatus !== null && currentStatus !== prevStatus) {
        switches += 1;
      }
      prevStatus = currentStatus;
    });

    if (switches > mostVolatileHabitSwitches) {
      mostVolatileHabitSwitches = switches;
      mostVolatileHabitName = habit.name;
    }
  });

  return {
    currentScore,
    previousScore,
    scoreChange,
    scoreChangePercent,
    totalWinRate,
    longestStreak,
    currentStreak,
    mostVolatileHabitName,
    mostVolatileHabitSwitches
  };
}
