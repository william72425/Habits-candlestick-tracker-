import { Habit, Candle, DashboardMetrics, UserTerminalConfig } from '../types';
import { getTodayDateString, addDays, getDatesInRange, getStartOfWeek, getYearMonth, getMonthLabel, formatDateLabel } from './dateHelpers';

/**
 * Helper to dynamically calculate reward points and miss penalties based on
 * difficulty, importance, and "best to do" status.
 */
export function getHabitPoints(habit: Habit) {
  const difficulty = habit.difficulty ?? 'Medium';
  const baseReward = difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 30 : 50;
  
  const importance = habit.importance ?? 'Medium';
  const importanceMult = importance === 'Low' ? 1.0 : importance === 'Medium' ? 1.5 : 2.0;
  
  const reward = habit.weight ?? Math.round(baseReward * importanceMult);
  
  const bestToDoMult = habit.isBestToDo ? 2.0 : 1.0;
  const penalty = habit.penalty ?? Math.round(baseReward * importanceMult * bestToDoMult);
  
  return { reward, penalty };
}

/**
 * Checks if a habit is active on a specific date based on weekend and custom selective day settings.
 */
export function isHabitActiveOnDate(habit: Habit, dateStr: string): boolean {
  const dateObj = new Date(dateStr + "T00:00:00Z");
  const dayOfWeek = dateObj.getUTCDay(); // 0 is Sunday, 1 is Monday, etc.
  
  if (habit.selectiveDays && habit.selectiveDays.length > 0) {
    return habit.selectiveDays.includes(dayOfWeek);
  }
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) {
    return habit.isActiveOnWeekends !== false;
  }
  
  return true;
}

/**
 * PUBG-Style rank tiers and corresponding missed-habit penalty multipliers,
 * wager limits, and metadata.
 */
export function getTierInfo(points: number) {
  if (points >= 12000) {
    return {
      name: 'Conqueror (ဂုဏ်သရေရှိအနိုင်ရသူ)',
      color: 'text-amber-400 border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      badge: '👑',
      nextPoints: Infinity,
      prevPoints: 12000,
      desc: 'Ultimate rank. Top tier consistency master.',
      multiplier: 1.5,
      label: 'Legendary Rank (150% Penalty)',
      maxBet: 12000,
      maxLeverage: 15
    };
  } else if (points >= 8000) {
    return {
      name: 'Ace (ကြယ်ပွင့်ပညာရှင်)',
      color: 'text-rose-400 border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      badge: '⭐️ Ace',
      nextPoints: 12000,
      prevPoints: 8000,
      desc: 'Elite discipline level. Unstoppable momentum.',
      multiplier: 1.3,
      label: 'Extreme Rank (130% Penalty)',
      maxBet: 6000,
      maxLeverage: 10
    };
  } else if (points >= 5000) {
    return {
      name: 'Crown (သရဖူအဆင့်)',
      color: 'text-violet-400 border-violet-500 bg-violet-500/10',
      badge: '💎 Crown',
      nextPoints: 8000,
      prevPoints: 5000,
      desc: 'Sovereign tier tracking. Mindset locked.',
      multiplier: 1.2,
      label: 'Elite Rank (120% Penalty)',
      maxBet: 3000,
      maxLeverage: 8
    };
  } else if (points >= 3000) {
    return {
      name: 'Diamond (စိန်အဆင့်)',
      color: 'text-sky-400 border-sky-500 bg-sky-500/10',
      badge: '💠 Diamond',
      nextPoints: 5000,
      prevPoints: 3000,
      desc: 'Brilliant habit consistency and predictions.',
      multiplier: 0.8,
      label: 'High Standard (80% Penalty)',
      maxBet: 1500,
      maxLeverage: 5
    };
  } else if (points >= 1500) {
    return {
      name: 'Platinum (ပလက်တီနမ်အဆင့်)',
      color: 'text-teal-400 border-teal-500 bg-teal-500/10',
      badge: '🛡️ Plat',
      nextPoints: 3000,
      prevPoints: 1500,
      desc: 'Strong foundational discipline established.',
      multiplier: 0.8,
      label: 'Standard Rank (80% Penalty)',
      maxBet: 800,
      maxLeverage: 3
    };
  } else if (points >= 500) {
    return {
      name: 'Silver (ငွေရောင်အဆင့်)',
      color: 'text-slate-300 border-slate-400 bg-slate-400/5',
      badge: '🥈 Silver',
      nextPoints: 1500,
      prevPoints: 500,
      desc: 'Rising consistent action-taker.',
      multiplier: 0.3,
      label: 'Newbie Protection (30% Penalty)',
      maxBet: 300,
      maxLeverage: 2
    };
  } else {
    return {
      name: 'Bronze (ကြေးဝါအဆင့်)',
      color: 'text-amber-600 border-amber-700 bg-amber-700/5',
      badge: '🥉 Bronze',
      nextPoints: 500,
      prevPoints: 0,
      desc: 'Discipline apprentice. Keep building active assets.',
      multiplier: 0.3,
      label: 'Newbie Protection (30% Penalty)',
      maxBet: 100,
      maxLeverage: 1
    };
  }
}

/**
 * Calculates 7-day retrospective completion rate (K/D winrate style)
 */
export function getWeeklyConsistency(habits: Habit[], todayStr: string): number {
  let totalOpportunities = 0;
  let totalCompletions = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(todayStr, -i);
    const activeHabits = habits.filter(h => h.createdDate <= date && (!h.archived || !h.archivedDate || h.archivedDate > date));
    
    activeHabits.forEach(habit => {
      totalOpportunities++;
      if (habit.history[date] === true) {
        totalCompletions++;
      }
    });
  }
  
  return totalOpportunities === 0 ? 100 : Math.round((totalCompletions / totalOpportunities) * 100);
}

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
export function calculateDailyCandles(
  habits: Habit[],
  startDateStr: string,
  endDateStr: string,
  config?: { leverage?: number; ignoreWeekends?: boolean; totalPoints?: number }
): Candle[] {
  const dates = getDatesInRange(startDateStr, endDateStr);
  const candles: Candle[] = [];
  
  let currentScore = 1000; // Baseline index
  const leverage = config?.leverage ?? 1;
  const ignoreWeekends = config?.ignoreWeekends ?? false;

  dates.forEach((date) => {
    const open = currentScore;
    
    // Only evaluate habits that were created on or before this date AND not archived/deleted before this date
    const activeHabits = habits.filter(h => {
      const wasCreated = h.createdDate <= date;
      const wasNotArchivedYet = !h.archived || !h.archivedDate || h.archivedDate > date;
      return wasCreated && wasNotArchivedYet;
    });
    
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

    // Calculate rolling 7-day consistency for dynamic multipliers
    let rollingComps = 0;
    let rollingOps = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = addDays(date, -i);
      const histHabits = habits.filter(h => h.createdDate <= checkDate && (!h.archived || !h.archivedDate || h.archivedDate > checkDate));
      histHabits.forEach(h => {
        rollingOps++;
        if (h.history[checkDate] === true) {
          rollingComps++;
        }
      });
    }
    const rollingConsistency = rollingOps === 0 ? 100 : (rollingComps / rollingOps) * 100;

    // Consistency multipliers (KD Style)
    let rewardMult = 1.0;
    let penaltyMult = 1.0;
    if (rollingConsistency >= 90) {
      rewardMult = 1.2; // 20% Bonus for win-streak
    } else if (rollingConsistency < 50) {
      penaltyMult = 1.5; // 50% Penalty increase for loss-streak
    }

    // Tier-based multiplier
    const tierInfo = getTierInfo(config?.totalPoints ?? 1000);
    const tierPenaltyMult = tierInfo.multiplier;

    // Check if weekend (Saturday=6 or Sunday=0 UTC)
    const dateObj = new Date(date + "T00:00:00Z");
    const isWeekend = dateObj.getUTCDay() === 0 || dateObj.getUTCDay() === 6;

    // Intraday path trace
    let tempScore = open;
    const pathScores = [tempScore];
    let completions = 0;

    // Sort habits deterministically by ID to ensure repeatable chart generations
    const sortedActive = [...activeHabits].sort((a, b) => a.id.localeCompare(b.id));

    sortedActive.forEach((habit) => {
      // Check if habit is active on weekends or has selective days
      const isActiveToday = isHabitActiveOnDate(habit, date);
      const isWeekendGrace = ignoreWeekends && isWeekend && !isActiveToday;

      const isCompleted = habit.history[date] === true;
      const points = getHabitPoints(habit);
      
      const positiveImpact = points.reward * rewardMult;
      const negativeImpact = points.penalty * penaltyMult * tierPenaltyMult;

      if (isCompleted) {
        tempScore += positiveImpact * leverage;
        completions += 1;
      } else {
        // If weekend grace is active or habit is not active today, missed habits do not penalize the score
        if (isActiveToday && !isWeekendGrace) {
          tempScore -= negativeImpact * leverage;
        }
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
 * Overlay technical indicators onto candle arrays (e.g., SMA, EMA)
 */
export function injectIndicators(candles: Candle[], smaPeriod: number, emaPeriod: number): void {
  const len = candles.length;
  if (len === 0) return;

  // 1. Calculate SMA
  for (let i = 0; i < len; i++) {
    if (i < smaPeriod - 1) {
      candles[i].sma = undefined;
    } else {
      let sum = 0;
      for (let j = i - smaPeriod + 1; j <= i; j++) {
        sum += candles[j].close;
      }
      candles[i].sma = Number((sum / smaPeriod).toFixed(2));
    }
  }

  // 2. Calculate EMA
  const k = 2 / (emaPeriod + 1);
  let prevEma = candles[0].close;
  candles[0].ema = prevEma;
  for (let i = 1; i < len; i++) {
    const curClose = candles[i].close;
    const curEma = curClose * k + prevEma * (1 - k);
    candles[i].ema = Number(curEma.toFixed(2));
    prevEma = curEma;
  }
}

/**
 * Calculates Maximum Drawdown over the active candles timeline
 */
export function calculateMaxDrawdown(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  let peak = candles[0].close;
  let maxDrawdown = 0;

  candles.forEach((candle) => {
    if (candle.close > peak) {
      peak = candle.close;
    }
    const drawdown = peak === 0 ? 0 : ((peak - candle.close) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return Number(maxDrawdown.toFixed(1));
}

/**
 * Calculates a consistency Sharpe-like ratio representing steady risk-adjusted progress
 */
export function calculateSharpeRatio(candles: Candle[]): number {
  if (candles.length <= 1) return 0;
  const returns: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev !== 0) {
      returns.push(((candles[i].close - prev) / prev) * 100);
    }
  }

  if (returns.length === 0) return 0;

  const sum = returns.reduce((a, b) => a + b, 0);
  const mean = sum / returns.length;

  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return mean > 0 ? 4.5 : 0; // high score if steady progress with zero deviations
  }

  const dailySharpe = mean / stdDev;
  const scaledSharpe = Number.isNaN(dailySharpe) ? 0 : dailySharpe * 2.2;
  return Number(Math.max(-5, Math.min(5, scaledSharpe)).toFixed(2));
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

  const maxDrawdown = calculateMaxDrawdown(dailyCandles);
  const sharpeRatio = calculateSharpeRatio(dailyCandles);

  return {
    currentScore,
    previousScore,
    scoreChange,
    scoreChangePercent,
    totalWinRate,
    longestStreak,
    currentStreak,
    mostVolatileHabitName,
    mostVolatileHabitSwitches,
    maxDrawdown,
    sharpeRatio
  };
}

/**
 * Helper to identify the next tier point threshold that requires promotion series.
 */
export function getNextTierThreshold(points: number) {
  if (points < 500) {
    return { name: 'Silver (ငွေရောင်အဆင့်)', points: 500 };
  } else if (points < 1500) {
    return { name: 'Platinum (ပလက်တီနမ်အဆင့်)', points: 1500 };
  } else if (points < 3000) {
    return { name: 'Diamond (စိန်အဆင့်)', points: 3000 };
  } else if (points < 5000) {
    return { name: 'Crown (သရဖူအဆင့်)', points: 5000 };
  } else if (points < 8000) {
    return { name: 'Ace (ကြယ်ပွင့်ပညာရှင်)', points: 8000 };
  } else if (points < 12000) {
    return { name: 'Conqueror (ဂုဏ်သရေရှိအနိုင်ရသူ)', points: 12000 };
  }
  return null;
}

/**
 * Daily promotion auditing engine. Checks scheduled/active promotions and logs daily performance.
 */
export function auditPromotionState(
  today: string,
  config: UserTerminalConfig,
  habits: Habit[]
): {
  nextConfig: UserTerminalConfig;
} {
  const promo = config.promotion;
  if (!promo || promo.status === 'NONE' || promo.status === 'COMPLETED' || promo.status === 'FAILED') {
    return { nextConfig: config };
  }

  const dailyPerformance = promo.dailyPerformance ? { ...promo.dailyPerformance } : {};
  let status: 'NONE' | 'ELIGIBLE' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' = promo.status;
  let pointsHistory = config.pointsHistory ? [...config.pointsHistory] : [];
  let totalPoints = config.totalPoints;
  let configChanged = false;

  // 1. Scheduled promotion starts today
  if (status === 'SCHEDULED' && promo.startDate && today >= promo.startDate) {
    status = 'ACTIVE';
    configChanged = true;
  }

  // 2. Active promotion audits previous days
  if (status === 'ACTIVE' && promo.startDate && promo.endDate) {
    const dates = getDatesInRange(promo.startDate, promo.endDate);
    let anyDayFailed = false;
    let allDaysProcessed = true;
    let updatedPerformance = false;

    dates.forEach((day) => {
      if (day < today) {
        if (!dailyPerformance[day]) {
          const activeOnDay = habits.filter(h => 
            h.createdDate <= day && 
            (!h.archived || !h.archivedDate || h.archivedDate > day) &&
            isHabitActiveOnDate(h, day)
          );
          
          if (activeOnDay.length === 0) {
            dailyPerformance[day] = {
              completedCount: 0,
              totalActiveCount: 0,
              pointsEarned: 0,
              totalPointsPossible: 0,
              percentage: 100,
              passed: true
            };
          } else {
            const completedOnDay = activeOnDay.filter(h => h.history[day] === true);
            const pointsEarned = completedOnDay.reduce((sum, h) => sum + getHabitPoints(h).reward, 0);
            const totalPointsPossible = activeOnDay.reduce((sum, h) => sum + getHabitPoints(h).reward, 0);
            
            const percentage = totalPointsPossible === 0 ? 100 : Math.round((pointsEarned / totalPointsPossible) * 100);
            const passed = percentage >= 75;

            dailyPerformance[day] = {
              completedCount: completedOnDay.length,
              totalActiveCount: activeOnDay.length,
              pointsEarned,
              totalPointsPossible,
              percentage,
              passed
            };
          }
          updatedPerformance = true;
        }

        if (dailyPerformance[day] && !dailyPerformance[day].passed) {
          anyDayFailed = true;
        }
      } else {
        allDaysProcessed = false;
      }
    });

    if (anyDayFailed) {
      status = 'FAILED';
      const penalty = 50;
      totalPoints = Math.max(0, config.totalPoints - penalty);
      pointsHistory.unshift({
        id: `promo_fail_${Date.now()}`,
        date: today,
        type: 'HABIT_MISS' as const,
        description: `❌ Promotion Trials to ${promo.targetTier} Failed. You did not meet the 75% consistency requirement. Penalty: -${penalty} PTS.`,
        points: -penalty
      });
      configChanged = true;
    } else if (allDaysProcessed || today > promo.endDate) {
      const evaluatedDays = Object.keys(dailyPerformance).filter(d => d >= promo.startDate! && d <= promo.endDate!);
      if (evaluatedDays.length === 3) {
        status = 'COMPLETED';
        const bonus = 100;
        totalPoints = promo.targetPoints + bonus; // promoted successfully!
        pointsHistory.unshift({
          id: `promo_success_${Date.now()}`,
          date: today,
          type: 'BONUS_REWARD' as const,
          description: `👑 Rank Promotion Match Successful! Promoted to ${promo.targetTier}! Awarded +${bonus} PTS Champion bonus!`,
          points: bonus
        });
        configChanged = true;
      }
    }

    if (updatedPerformance) {
      configChanged = true;
    }
  }

  if (configChanged) {
    return {
      nextConfig: {
        ...config,
        totalPoints,
        pointsHistory,
        promotion: {
          ...promo,
          status,
          dailyPerformance
        }
      }
    };
  }

  return { nextConfig: config };
}


