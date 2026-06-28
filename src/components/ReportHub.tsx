import { useState, useMemo } from 'react';
import { Habit, Candle, DashboardMetrics, UserTerminalConfig } from '../types';
import { addDays, getDatesInRange, formatDateLabel } from '../utils/dateHelpers';
import { getHabitPoints, isHabitActiveOnDate, getTierInfo } from '../utils/financeEngine';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  Calendar, 
  Flame, 
  FileText, 
  BarChart3, 
  Zap, 
  HelpCircle,
  ChevronRight,
  Info
} from 'lucide-react';

interface ReportHubProps {
  habits: Habit[];
  config: UserTerminalConfig;
  dailyCandles: Candle[];
  metrics: DashboardMetrics;
  today: string;
}

export default function ReportHub({ habits, config, dailyCandles, metrics, today }: ReportHubProps) {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0); // 0 = Last 7 days, 1 = Week 2 (8-14 days ago), 2 = Week 3 (15-21 days ago)
  const [showExplanationModal, setShowExplanationModal] = useState<string | null>(null);

  // 1. Calculate weekly date windows
  const weeks = useMemo(() => {
    const todayObj = new Date(today + "T00:00:00Z");
    
    // Generate 3 past weekly segments (each segment represents 7 days)
    return Array.from({ length: 3 }).map((_, idx) => {
      const endOffset = -(idx * 7);
      const startOffset = -((idx + 1) * 7 - 1);
      
      const segmentEnd = addDays(today, endOffset);
      const segmentStart = addDays(today, startOffset);
      
      const dateList = getDatesInRange(segmentStart, segmentEnd).sort();
      
      const startLabel = formatDateLabel(segmentStart, 'short');
      const endLabel = formatDateLabel(segmentEnd, 'short');
      const label = idx === 0 
        ? `Current Week (${startLabel} - ${endLabel})` 
        : `Week -${idx} (${startLabel} - ${endLabel})`;

      return {
        label,
        startDate: segmentStart,
        endDate: segmentEnd,
        dates: dateList
      };
    });
  }, [today]);

  const activeWeek = weeks[selectedWeekIndex] || weeks[0];

  // 2. Compute rich weekly statistics for the selected week
  const weeklyStats = useMemo(() => {
    if (!activeWeek || habits.length === 0) return null;

    const { dates } = activeWeek;
    let opportunities = 0;
    let completions = 0;
    
    // Category tracking
    const categories: Record<string, { opportunities: number; completions: number }> = {
      Health: { opportunities: 0, completions: 0 },
      Work: { opportunities: 0, completions: 0 },
      Learning: { opportunities: 0, completions: 0 },
      Life: { opportunities: 0, completions: 0 }
    };

    // Weekday vs Weekend tracking
    let weekdayOps = 0;
    let weekdayComps = 0;
    let weekendOps = 0;
    let weekendComps = 0;

    // Best-To-Do performance
    let bestToDoOps = 0;
    let bestToDoComps = 0;

    // Volatility tracking: switches inside this week
    const habitSwitches: Record<string, number> = {};

    // Dynamic daily performance tracking for consistency calculations
    const dailyCompletionPercentages: number[] = [];

    dates.forEach((date) => {
      const dateObj = new Date(date + "T00:00:00Z");
      const dayOfWeek = dateObj.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Find active habits on this specific date
      const activeOnDate = habits.filter(h => {
        const wasCreated = h.createdDate <= date;
        const wasNotArchivedYet = !h.archived || !h.archivedDate || h.archivedDate > date;
        return wasCreated && wasNotArchivedYet && isHabitActiveOnDate(h, date);
      });

      let dailyOps = 0;
      let dailyComps = 0;

      activeOnDate.forEach((habit) => {
        const completed = habit.history[date] === true;
        const cat = habit.category;
        
        // Update general counters
        opportunities++;
        dailyOps++;
        if (completed) {
          completions++;
          dailyComps++;
        }

        // Update category counters
        if (categories[cat]) {
          categories[cat].opportunities++;
          if (completed) categories[cat].completions++;
        }

        // Update weekday vs weekend counters
        if (isWeekend) {
          weekendOps++;
          if (completed) weekendComps++;
        } else {
          weekdayOps++;
          if (completed) weekdayComps++;
        }

        // Update Best-to-Do counters
        if (habit.isBestToDo) {
          bestToDoOps++;
          if (completed) bestToDoComps++;
        }
      });

      if (dailyOps > 0) {
        dailyCompletionPercentages.push((dailyComps / dailyOps) * 100);
      } else {
        dailyCompletionPercentages.push(100); // flat day counts as perfect default
      }
    });

    // Calculate individual habit volatility inside this week
    habits.forEach((habit) => {
      let switches = 0;
      let prevVal: boolean | null = null;
      dates.forEach((date) => {
        const wasCreated = habit.createdDate <= date;
        const wasNotArchivedYet = !habit.archived || !habit.archivedDate || habit.archivedDate > date;
        if (wasCreated && wasNotArchivedYet && isHabitActiveOnDate(habit, date)) {
          const completed = habit.history[date] === true;
          if (prevVal !== null && completed !== prevVal) {
            switches++;
          }
          prevVal = completed;
        }
      });
      if (switches > 0) {
        habitSwitches[habit.name] = switches;
      }
    });

    // 1. Overall Completion %
    const completionRate = opportunities === 0 ? 0 : Math.round((completions / opportunities) * 100);

    // 2. Discipline Grade
    let grade = 'F';
    let gradeColor = 'text-rose-500 border-rose-500/20 bg-rose-500/5';
    let gradeLabel = 'Deficit/Liquidated';
    if (completionRate >= 90) {
      grade = 'A';
      gradeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      gradeLabel = 'Elite Trader Consistency';
    } else if (completionRate >= 75) {
      grade = 'B';
      gradeColor = 'text-teal-400 border-teal-500/20 bg-teal-500/5';
      gradeLabel = 'Stable Portfolio Growth';
    } else if (completionRate >= 60) {
      grade = 'C';
      gradeColor = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      gradeLabel = 'Standard Consolidation';
    } else if (completionRate >= 45) {
      grade = 'D';
      gradeColor = 'text-orange-500 border-orange-500/20 bg-orange-500/5';
      gradeLabel = 'High Speculative Risk';
    }

    // 3. Volatility / Standard Deviation of completion rate
    const mean = dailyCompletionPercentages.reduce((a, b) => a + b, 0) / (dailyCompletionPercentages.length || 1);
    const variance = dailyCompletionPercentages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dailyCompletionPercentages.length || 1);
    const volatilityIndex = Number(Math.sqrt(variance).toFixed(1));

    // 4. Weekend vs Weekday Bias Analysis
    const weekdayRate = weekdayOps === 0 ? 0 : Math.round((weekdayComps / weekdayOps) * 100);
    const weekendRate = weekendOps === 0 ? 0 : Math.round((weekendComps / weekendOps) * 100);
    const weekendBiasDiff = weekdayRate - weekendRate;

    // 5. Category Breakdowns
    const categoryRates = Object.keys(categories).map(cat => {
      const ops = categories[cat].opportunities;
      const comps = categories[cat].completions;
      const rate = ops === 0 ? 0 : Math.round((comps / ops) * 100);
      return { category: cat, rate, opportunities: ops };
    });

    // 6. Leverage & Wagers Analysis for this week
    // Filter config predictions created during this week
    const weekPredictions = (config.predictions || []).filter(
      p => p.entryDate >= activeWeek.startDate && p.entryDate <= activeWeek.endDate
    );
    const wagersPlaced = weekPredictions.length;
    const wagersWon = weekPredictions.filter(p => p.status === 'WON').length;
    const wagersLost = weekPredictions.filter(p => p.status === 'LOST').length;
    const wagersPending = weekPredictions.filter(p => p.status === 'PENDING').length;
    const winRate = wagersPlaced === 0 ? 0 : Math.round(((wagersWon) / (wagersWon + wagersLost || 1)) * 100);

    const pointsHistoryThisWeek = (config.pointsHistory || []).filter(
      h => h.date >= activeWeek.startDate && h.date <= activeWeek.endDate
    );
    const netPointsThisWeek = pointsHistoryThisWeek.reduce((sum, item) => sum + item.points, 0);

    return {
      opportunities,
      completions,
      completionRate,
      grade,
      gradeColor,
      gradeLabel,
      volatilityIndex,
      weekdayRate,
      weekendRate,
      weekendBiasDiff,
      categoryRates,
      bestToDoRate: bestToDoOps === 0 ? 100 : Math.round((bestToDoComps / bestToDoOps) * 100),
      bestToDoOps,
      wagersPlaced,
      wagersWon,
      wagersLost,
      wagersPending,
      wagerWinRate: winRate,
      netPointsThisWeek,
      habitSwitches: Object.entries(habitSwitches)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3) // Top 3 most volatile
    };
  }, [activeWeek, habits, config.predictions, config.pointsHistory]);

  // 3. Compute drawdown metrics
  const { drawdownPercent, historicalMaxPoints } = useMemo(() => {
    const currentPoints = config.totalPoints || 0;
    const peak = (config.pointsHistory || []).reduce((max, item) => {
      const rollingSum = (config.pointsHistory || [])
        .filter(h => h.id !== 'init' && h.date <= item.date)
        .reduce((sum, h) => sum + h.points, 1000);
      return rollingSum > max ? rollingSum : max;
    }, 1000);

    const dd = peak > currentPoints 
      ? Math.round(((peak - currentPoints) / peak) * 100)
      : 0;
    return { drawdownPercent: dd, historicalMaxPoints: peak };
  }, [config.totalPoints, config.pointsHistory]);

  // 4. Compute Real-time Risk Alerts & Warnings (Discipline Audit Guard)
  const activeDisciplineAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      level: 'CRITICAL' | 'WARNING' | 'NOTICE';
      titleEn: string;
      titleMy: string;
      descEn: string;
      descMy: string;
      recommendationEn: string;
      recommendationMy: string;
    }> = [];

    if (drawdownPercent >= 20) {
      alerts.push({
        id: 'drawdown',
        level: 'CRITICAL',
        titleEn: 'Severe Account Drawdown Alert',
        titleMy: 'အကောင့်အရင်းအနှီး ဆိုးရွားစွာလျော့ကျနေမှု သတိပေးချက်',
        descEn: `Your points balance has dropped by ${drawdownPercent}% from its historical peak of ${historicalMaxPoints} PTS. You are in a deep capital correction phase.`,
        descMy: `သင်၏စုစုပေါင်းရမှတ်သည် သမိုင်းတစ်လျှောက်အမြင့်ဆုံးဖြစ်ခဲ့သော ${historicalMaxPoints} PTS မှစတင်ကာ ${drawdownPercent}% အထိ ကျဆင်းသွားခဲ့ပြီး ဆိုးရွားသော စည်းကမ်းပျက်ကွက်မှုအဆင့်သို့ ရောက်နေပါသည်။`,
        recommendationEn: 'Reduce your Index leverage multiplier to 1x immediately and avoid placing new prediction wagers until you recover above 80% completion consistency.',
        recommendationMy: 'အညွှန်းကိန်း လီဗာရေ့ဂျ် (Leverage) ကို ၁ ဆ (1x) သို့ ချက်ချင်းလျှော့ချပါ၊ နေ့စဉ်ပြီးမြောက်မှု ၈၀% ကျော်သို့ ပြန်လည်မရောက်မချင်း စိန်ခေါ်ခန့်မှန်းချက်အသစ်များအားလုံးကို ရပ်ဆိုင်းထားပါ။'
      });
    } else if (drawdownPercent >= 10) {
      alerts.push({
        id: 'drawdown',
        level: 'WARNING',
        titleEn: 'Moderate Portfolio Drawdown',
        titleMy: 'အကောင့်အတွင်း ရမှတ်များ ပျမ်းမျှလျော့ကျနေမှု',
        descEn: `Your portfolio index is experiencing a ${drawdownPercent}% drawdown from peak values. Standard discipline is slipping.`,
        descMy: `သင်၏အကောင့်သည် peak တန်ဖိုးများမှ ${drawdownPercent}% လျော့ကျနေပါသည်။ နေ့စဉ် အလေ့အကျင့်အချို့ ပျက်ကွက်နေခြင်းကို ပြသနေသည်။`,
        recommendationEn: 'Audit your habit load. Archive inactive or unrealistic habit assets to build steady daily compound streaks.',
        recommendationMy: 'လုပ်ဆောင်ရန်ခက်ခဲသော အလေ့အကျင့်အချို့ကို Archive ပြုလုပ်ကာ သေးငယ်သော အလေ့အကျင့်ငယ်များဖြင့် Streak သေချာပြန်လည်တည်ဆောက်ပါ။'
      });
    }

    // ALERT 2: Consecutive Miss Streak (Consecutive days with 0 completions in last 3 days)
    // Check if yesterday and today have zero volume in candles
    const recentCandles = dailyCandles.slice(-3);
    const consecutiveMissCount = recentCandles.filter(c => c.volume === 0).length;
    if (consecutiveMissCount >= 2) {
      alerts.push({
        id: 'miss_streak',
        level: 'CRITICAL',
        titleEn: 'Discipline Freeze / High-Risk Inactivity',
        titleMy: 'စည်းကမ်းပိုင်းဆိုင်ရာ လုံးဝရပ်တန့်နေမှု (အန္တရာယ်ရှိ)',
        descEn: `No habits were completed for ${consecutiveMissCount} of the last 3 days. Your stock index is bleeding points rapidly due to successive miss penalties.`,
        descMy: `လွန်ခဲ့သော ၃ ရက်အတွင်း နေ့စဉ် ပြီးမြောက်မှု လုံးဝမရှိသောရက် ${consecutiveMissCount} ရက်အထိ ရှိနေပါသည်။ မလုပ်မိသည့်အတွက် ပယ်ဖြတ်ရမှတ် (Penalty) များ နေ့စဉ် နှစ်ဆတိုးတက်နေပါသည်။`,
        recommendationEn: 'Unfreeze immediately. Trigger the "Best to Do" habit check-in first thing tomorrow to arrest the points drop.',
        recommendationMy: 'မနက်ဖြန်မနက်တွင် အလွယ်ကူဆုံးဖြစ်သော "Best to Do" အလေ့အကျင့်ကို အရင်ဆုံးပြီးမြောက်အောင်လုပ်ဆောင်ပြီး ရမှတ်များ စဉ်ဆက်မပြတ် ဆုံးရှုံးနေမှုကို ချက်ချင်းတားဆီးပါ။'
      });
    }

    // ALERT 3: High Leverage Warning (Multiplier >= 5x with low win rate)
    if (config.leverage >= 5 && metrics.totalWinRate < 70) {
      alerts.push({
        id: 'high_leverage',
        level: 'WARNING',
        titleEn: 'Excessive Portfolio Leverage Risk',
        titleMy: 'အန္တရာယ်ကြီးမားသော လီဗာရေ့ဂျ်အသုံးပြုနေမှု',
        descEn: `You are trading habits on ${config.leverage}x leverage while maintaining a lower-tier win rate of ${Math.round(metrics.totalWinRate)}%. This is highly speculative and easily leads to rank liquidation.`,
        descMy: `သင်သည် ပြီးမြောက်မှုအချိုး ${Math.round(metrics.totalWinRate)}% သာရှိသော်လည်း Leverage အား ${config.leverage}x အထိ အသုံးပြုနေသည်။ စက္ကန့်ပိုင်းအတွင်း ရာထူးကျဆင်းသွားနိုင်သည့် အလွန်အန္တရာယ်ကြီးသော အပြုအမူဖြစ်သည်။`,
        recommendationEn: 'Lower your terminal leverage setup to 2x or 3x in the Settings tab to safeguard your points.',
        recommendationMy: 'သင်၏ရမှတ်များအား ဆုံးရှုံးမှုမှကာကွယ်ရန် ဆက်တင်များ (Settings) တွင် လီဗာရေ့ဂျ်ကို ၂ ဆ သို့မဟုတ် ၃ ဆ သို့ လျှော့ချသတ်မှတ်ပါ။'
      });
    }

    // ALERT 4: Weekend Slump Hazard
    if (weeklyStats && weeklyStats.weekendBiasDiff >= 20) {
      alerts.push({
        id: 'weekend_slump',
        level: 'WARNING',
        titleEn: 'Severe Weekend Performance Bias',
        titleMy: 'စနေ၊ တနင်္ဂနွေရက်များတွင် လုပ်ဆောင်နိုင်စွမ်းကျဆင်းမှု',
        descEn: `Your habit completion rate drops by ${weeklyStats.weekendBiasDiff}% on weekends (${weeklyStats.weekendRate}%) compared to weekdays (${weeklyStats.weekdayRate}%).`,
        descMy: `ရက်သတ္တပတ်ရက်များ (${weeklyStats.weekdayRate}%) နှင့် နှိုင်းယှဉ်ပါက စနေ၊ တနင်္ဂနွေရက်များတွင် ပြီးမြောက်မှုနှုန်း (${weeklyStats.weekendRate}%) အထိ (${weeklyStats.weekendBiasDiff}%) ဆိုးရွားစွာကျဆင်းသွားပါသည်။`,
        recommendationEn: 'Enable "Ignore Weekends" in system settings, or adjust selective habit active days to un-track heavy work habits on Saturdays and Sundays.',
        recommendationMy: 'ဆက်တင်များတွင် "Ignore Weekends" ကို ဖွင့်ထားပါ၊ သို့မဟုတ် အလုပ်နှင့်ပတ်သက်သော အလေ့အကျင့်များအား စနေ၊ တနင်္ဂနွေတွင် မခြေရာခံမိစေရန် ရက်အလိုက် သတ်မှတ်ပါ။'
      });
    }

    // ALERT 5: Best-To-Do Vulnerability
    if (weeklyStats && weeklyStats.bestToDoRate < 60 && weeklyStats.bestToDoOps > 0) {
      alerts.push({
        id: 'best_todo_failure',
        level: 'WARNING',
        titleEn: 'Core Asset "Best-to-Do" Misses',
        titleMy: 'အရေးကြီးဆုံးအလေ့အကျင့်များ ပျက်ကွက်နေခြင်း',
        descEn: `You missed ${100 - weeklyStats.bestToDoRate}% of your designated "Best-to-Do" core habits this week. These carry double miss penalties and are actively liquidating your tier.`,
        descMy: `ယခုအပတ်အတွင်း "Best-to-Do" ဟု သတ်မှတ်ထားသော အဓိကအလေ့အကျင့်များ၏ ${100 - weeklyStats.bestToDoRate}% အထိ ပျက်ကွက်ခဲ့ပါသည်။ ၎င်းတို့သည် နှစ်ဆဖြတ်တောက်သဖြင့် အကောင့်ကိုမြန်မြန်ကျဆင်းစေသည်။`,
        recommendationEn: 'Focus entire willpower allocation strictly on "Best-to-Do" designated items before checking any other habits.',
        recommendationMy: 'အခြားအလေ့အကျင့်များကို မလုပ်ဆောင်မီ "Best-to-Do" ဟုသတ်မှတ်ထားသောအရာများကိုသာ အဓိကထား၍ ဦးစွာအပြီးသတ်ပါ။'
      });
    }

    // ALERT 6: AFK Penalty / timezone alert
    if ((config.consecutiveAfkCount ?? 0) > 0) {
      alerts.push({
        id: 'afk_alert',
        level: 'WARNING',
        titleEn: 'Consecutive Inactivity Punishments Active',
        titleMy: 'ရက်ကျော်အလေ့အကျင့်မမှတ်တမ်းတင်မှု ပြစ်ဒဏ်သက်ရောက်နေခြင်း',
        descEn: `You have accumulated ${config.consecutiveAfkCount} consecutive AFK/unreported periods. AFK penalties have reduced retroactive reward conversion to ${Math.round(Math.max(0.5, 1 - ((config.consecutiveAfkCount ?? 1) * 0.15)) * 100)}%.`,
        descMy: `သင်သည် အလေ့အကျင့်များကို ရက်ကျော်မှ နောက်ပြန်လိုက်မှတ်တမ်းတင်မှု ${config.consecutiveAfkCount} ကြိမ်ဆက်တိုက် ပြုလုပ်ခဲ့ပါသည်။ သင့်၏ retroactive ဆုလာဘ်ရမှတ်များကို ${Math.round(Math.max(0.5, 1 - ((config.consecutiveAfkCount ?? 1) * 0.15)) * 100)}% သို့ စနစ်မှလျှော့ချလိုက်ပါပြီ။`,
        recommendationEn: 'Set a daily reminder at 9:00 PM to log completions live on the active trade date. Avoid retrospective logs.',
        recommendationMy: 'နေ့စဉ် ည ၉ နာရီတွင် အလေ့အကျင့်များကို ရက်မကျော်ဘဲ မှတ်တမ်းတင်ရန် ဖုန်းမော်နီတာသတ်မှတ်ထားပါ။ နောက်ပြန်မှတ်တမ်းတင်ခြင်းကို အတတ်နိုင်ဆုံးရှောင်ကြဉ်ပါ။'
      });
    }

    // Default safe state message if zero alerts
    if (alerts.length === 0) {
      alerts.push({
        id: 'safe',
        level: 'NOTICE',
        titleEn: 'Elite Portfolio Discipline Maintained',
        titleMy: 'အကောင့်စည်းကမ်းပိုင်းဆိုင်ရာ အထူးကောင်းမွန်နေမှု',
        descEn: 'Zero critical risks detected. Your consistency standard satisfies all financial system audits. Capital is compounding cleanly.',
        descMy: 'အကောင့်ထိခိုက်နိုင်သည့် ဆိုးရွားသောအန္တရာယ်များ မရှိပါ။ သင်၏အလေ့အကျင့်ထိန်းသိမ်းမှုသည် စနစ်သတ်မှတ်ချက်အားလုံးနှင့် ကိုက်ညီပြီး ရမှတ်များ စဉ်ဆက်မပြတ်တိုးပွားနေပါသည်။',
        recommendationEn: 'Excellent execution. Maintain current risk limits or activate rank promotion trials if eligible!',
        recommendationMy: 'အလွန်ကောင်းမွန်ပါသည်။ လက်ရှိစံနှုန်းကို ဆက်လက်ထိန်းသိမ်းထားပြီး အရည်အချင်းပြည့်မီပါက ရာထူးတိုးမြှင့်ရန် စိန်ခေါ်မှုကို စတင်ပါ။'
      });
    }

    return alerts;
  }, [config, dailyCandles, metrics, weeklyStats, drawdownPercent, historicalMaxPoints]);

  // Help descriptors
  const helpTexts: Record<string, { title: string; desc: string }> = {
    disciplineGrade: {
      title: "Weekly Discipline Grade (အဆင့်သတ်မှတ်ချက်)",
      desc: "Calculated from your overall habit completion rate during the 7-day period. Grade A (>=90%) boosts points. Grade B (75-89%) maintains steady rank. Grades C, D, and F signify increasing levels of inconsistency, causing portfolio drawdowns and eventual tier liquidations."
    },
    volatilityIndex: {
      title: "Consistency Volatility Index (တည်ငြိမ်မှုမတည်ငြိမ်ညွှန်းကိန်း)",
      desc: "Measures the day-to-day stability of your performance. A low Volatility Index (0 - 15) means you perform consistently every day. A high Volatility Index (> 30) indicates 'yo-yo' performance (100% on one day, 0% on the next), which triggers high system instability and risks."
    },
    weekendBias: {
      title: "Weekend Bias Audit (စနေ၊ တနင်္ဂနွေ အားနည်းချက် စစ်ဆေးမှု)",
      desc: "Compares your weekday (Mon-Fri) completion rate against your weekend (Sat-Sun) rate. A positive bias means you perform much worse on weekends. This allows you to pinpoint exact structural calendar failures and adjust selective habit schedules accordingly."
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* 1. TAB HEADER INTRO */}
      <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-black text-white text-lg flex items-center gap-2.5 uppercase tracking-wider">
            <FileText className="w-5 h-5 text-emerald-400 animate-pulse" />
            Performance Reports & Discipline Audits
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            သင်၏ ကိုယ်ပိုင် အလေ့အကျင့် ပြီးမြောက်မှု သမိုင်းကြောင်းအား သင်္ချာနှင့် စာရင်းအင်းနည်းပညာများဖြင့် စေ့စပ်စွာစစ်ဆေးကာ၊ အပတ်စဉ် စွမ်းဆောင်ရည် အစီရင်ခံစာနှင့် လိုက်နာမှု အန္တရာယ် သတိပေးချက်များကို ဤနေရာတွင် ကြည့်ရှုနိုင်ပါသည်။
          </p>
        </div>
        
        {/* Week Selector Button Group */}
        <div className="flex bg-slate-900/80 p-1 border border-slate-800/60 rounded-xl shrink-0">
          {weeks.map((week, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedWeekIndex(idx)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all duration-200 ${
                selectedWeekIndex === idx
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {idx === 0 ? 'Current Week' : `Week -${idx}`}
            </button>
          ))}
        </div>
      </div>

      {/* 2. STATS & GRADES ROW */}
      {weeklyStats && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: WEEKLY AUDIT REPORT PANEL (invoice/terminal style document) (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-slate-900/20 border border-slate-850/60 rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden shadow-xl">
            {/* Ambient watermarks */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-emerald-400 tracking-wider font-bold uppercase">Weekly Performance Audit Report</span>
                <h3 className="text-white font-extrabold text-base uppercase mt-1">
                  DISCIPLINE LEDGER AUDIT
                </h3>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                  AUDITED TIMELINE: {activeWeek.startDate} to {activeWeek.endDate}
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[9px] font-mono text-slate-500 uppercase">SYSTEM ID / CLIENT</span>
                <span className="text-white font-mono text-[10px] font-bold">TERMINAL-CLIENT-99</span>
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[8px] text-emerald-400 font-bold mt-1 uppercase tracking-widest">
                  STATUS: AUDITED
                </span>
              </div>
            </div>

            {/* Main stats layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box A: Discipline Grade */}
              <div className={`border rounded-2xl p-5 flex flex-col items-center text-center justify-between gap-3 ${weeklyStats.gradeColor}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Weekly Grade</span>
                  <button 
                    onClick={() => setShowExplanationModal('disciplineGrade')}
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-5xl font-sans font-black tracking-tight leading-none">
                    {weeklyStats.grade}
                  </span>
                  <span className="text-[10px] font-bold uppercase mt-2 tracking-wide block">
                    {weeklyStats.completionRate}% Done
                  </span>
                </div>

                <span className="text-[9px] font-mono tracking-normal leading-tight opacity-90 uppercase max-w-[150px]">
                  {weeklyStats.gradeLabel}
                </span>
              </div>

              {/* Box B: Volatility Index */}
              <div className="border border-slate-850 bg-slate-950/20 rounded-2xl p-5 flex flex-col items-center text-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Consistency Volatility</span>
                  <button 
                    onClick={() => setShowExplanationModal('volatilityIndex')}
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <span className={`text-4xl font-mono font-black tracking-tight leading-none ${
                    weeklyStats.volatilityIndex < 15 
                      ? 'text-emerald-400' 
                      : weeklyStats.volatilityIndex < 30 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                  }`}>
                    {weeklyStats.volatilityIndex}%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wide">
                    {weeklyStats.volatilityIndex < 15 ? 'Steady Progress' : weeklyStats.volatilityIndex < 30 ? 'Moderate Waves' : 'Extreme Fluctuation'}
                  </span>
                </div>

                <span className="text-[8.5px] font-sans text-slate-500 leading-normal">
                  Lower percentage represents reliable, disciplined performance.
                </span>
              </div>

              {/* Box C: Weekend Bias */}
              <div className="border border-slate-850 bg-slate-950/20 rounded-2xl p-5 flex flex-col items-center text-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Weekend Bias</span>
                  <button 
                    onClick={() => setShowExplanationModal('weekendBias')}
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1 w-full font-mono text-[10px] px-2 text-left">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">WEEKDAYS:</span>
                    <span className="text-white font-bold">{weeklyStats.weekdayRate}%</span>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span className="text-slate-500">WEEKENDS:</span>
                    <span className={`font-bold ${weeklyStats.weekendRate < weeklyStats.weekdayRate - 15 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {weeklyStats.weekendRate}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-850 px-2 py-1 rounded-lg w-full justify-center">
                  {weeklyStats.weekendBiasDiff > 15 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-[8.5px] text-rose-400 uppercase font-black tracking-wider">Slump Detected</span>
                    </>
                  ) : weeklyStats.weekendBiasDiff < -5 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                      <span className="text-[8.5px] text-emerald-400 uppercase font-black tracking-wider">Weekend Surge</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold">Neutral Balance</span>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Category Consistency Breakdowns */}
            <div className="flex flex-col gap-3.5 border-t border-slate-800/60 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-xs uppercase tracking-wider font-sans">
                  Category Consistency Audits (ကဏ္ဍအလိုက်ပြီးမြောက်မှုများ)
                </span>
                <span className="text-[9px] font-mono text-slate-500">Target Benchmark: &ge; 75%</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {weeklyStats.categoryRates.map((cat) => {
                  const isHealthy = cat.rate >= 75;
                  const isDeteriorating = cat.rate < 50;

                  return (
                    <div key={cat.category} className="bg-slate-950/20 border border-slate-900 rounded-xl p-3.5 flex flex-col gap-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">{cat.category}</span>
                        <span className={`text-xs font-mono font-bold ${
                          isHealthy ? 'text-emerald-400' : isDeteriorating ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {cat.rate}%
                        </span>
                      </div>

                      {/* Custom styled progress bar */}
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHealthy ? 'bg-emerald-400' : isDeteriorating ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${cat.rate}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>{cat.opportunities} Opportunities</span>
                        <span className="uppercase font-bold tracking-wider">
                          {isHealthy ? 'PASSING' : isDeteriorating ? 'LIQUID RISK' : 'CONSOLIDATING'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Ledger Balance Impact & Speculation Audit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-5">
              
              {/* Left Segment: Core Asset Performance */}
              <div className="bg-slate-950/30 border border-slate-900 p-4 rounded-xl flex flex-col gap-3 font-sans">
                <span className="text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Asset Allocation & Efficiency
                </span>
                
                <div className="flex flex-col gap-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Best-to-Do Success Rate:</span>
                    <span className={`font-bold ${weeklyStats.bestToDoRate >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {weeklyStats.bestToDoRate}%
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Most Volatile Asset:</span>
                    <span className="text-slate-300 font-bold">
                      {weeklyStats.habitSwitches[0] ? weeklyStats.habitSwitches[0][0] : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max switches recorded:</span>
                    <span className="text-amber-400 font-bold">
                      {weeklyStats.habitSwitches[0] ? `${weeklyStats.habitSwitches[0][1]} state changes` : '0 switches'}
                    </span>
                  </div>
                </div>
                
                <p className="text-[9px] text-slate-500 leading-normal mt-1 italic">
                  * "Best-to-Do" habits carry twice the score penalty weight. High state switching (volatility) on habits reflects poor routine planning.
                </p>
              </div>

              {/* Right Segment: Leveraged Predictions Audit */}
              <div className="bg-slate-950/30 border border-slate-900 p-4 rounded-xl flex flex-col gap-3 font-sans">
                <span className="text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                  Speculation & Leverage Audit
                </span>

                <div className="flex flex-col gap-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Wagers Active This Week:</span>
                    <span className="text-slate-300 font-bold">
                      {weeklyStats.wagersPlaced} predictions
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Wagers Win Rate (Won/Lost):</span>
                    <span className="text-emerald-400 font-bold">
                      {weeklyStats.wagerWinRate}% ({weeklyStats.wagersWon}W - {weeklyStats.wagersLost}L)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Week Portfolio Net Change:</span>
                    <span className={`font-bold ${weeklyStats.netPointsThisWeek >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {weeklyStats.netPointsThisWeek >= 0 ? '+' : ''}{weeklyStats.netPointsThisWeek} PTS
                    </span>
                  </div>
                </div>

                <p className="text-[9px] text-slate-500 leading-normal mt-1 italic">
                  * Leveraged prediction trades multiply point growth but deplete capital buffers exponentially upon misses. Keep wagers focused.
                </p>
              </div>

            </div>

            {/* Scientific Statistical Insights Box */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex items-start gap-3 mt-1.5">
              <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex flex-col gap-1 text-left">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wide">Data-Driven Recommendation</span>
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  {weeklyStats.completionRate >= 90 ? (
                    "Your consistency is at elite standard. Your weekend tracking matches weekday performance. Recommendation: You have the margin to active higher leverage or test rank promotion matches securely."
                  ) : weeklyStats.weekendBiasDiff > 15 ? (
                    `Weekly statistics detect a weekend consistency dip of ${weeklyStats.weekendBiasDiff}%. Recommendation: Turn off Saturday and Sunday tracking for hard habits to secure your portfolio index against weekend liquidations, or prioritize weekend morning wagers.`
                  ) : weeklyStats.volatilityIndex > 25 ? (
                    `Your routine is suffering from high daily volatility (${weeklyStats.volatilityIndex}% standard deviation). Recommendation: Reduce your list of active habit assets. Focus strictly on executing 2-3 'Best-to-Do' items perfectly for a week to build baseline momentum.`
                  ) : weeklyStats.bestToDoRate < 70 ? (
                    "Your core Best-to-Do habits have been slipping, causing double penalty impacts. Recommendation: Lower the difficulty weights of non-essential habits so you don't bleed energy before attacking these primary tasks."
                  ) : (
                    "Stable, moderate growth patterns observed. Continue current routine setups, but audit categories with <75% win-rate. Lowering difficulties of failing categories by 1 tier will help secure compound progress."
                  )}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT: REAL-TIME RISK WARNING ALERTS PANEL (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-slate-900/20 border border-slate-850/60 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-sans font-black text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Discipline Warning Center
                </h3>
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 font-mono text-[9px] font-bold rounded">
                  {activeDisciplineAlerts.filter(a => a.level !== 'NOTICE').length} Risk Triggers
                </span>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                စနစ်စည်းကမ်းစောင့်ကြည့်ရေး ဗဟိုဌာနမှ သင့်အကောင့်၏ ဆုံးရှုံးနိုင်ခြေများကို အချိန်နှင့်တပြေးညီ စောင့်ကြည့်နေပြီး စည်းကမ်းပျက်ကွက်မှုများကို သတိပေးတားဆီးပေးမည်ဖြစ်သည်။
              </p>

              {/* Active alerts display container */}
              <div className="flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {activeDisciplineAlerts.map((alert) => {
                  const isCritical = alert.level === 'CRITICAL';
                  const isWarning = alert.level === 'WARNING';
                  const isNotice = alert.level === 'NOTICE';

                  return (
                    <div 
                      key={alert.id}
                      className={`border p-4 rounded-xl flex flex-col gap-3.5 transition-all relative overflow-hidden ${
                        isCritical 
                          ? 'border-rose-500/30 bg-rose-950/10' 
                          : isWarning 
                          ? 'border-amber-500/20 bg-amber-950/10' 
                          : 'border-slate-800/60 bg-slate-900/20'
                      }`}
                    >
                      {/* Top color tag */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />

                      {/* Title row */}
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isCritical 
                            ? 'bg-rose-500/10 text-rose-400' 
                            : isWarning 
                            ? 'bg-amber-500/10 text-amber-400' 
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isCritical ? (
                            <XCircle className="w-4 h-4" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <h4 className="text-white font-extrabold text-xs leading-normal">{alert.titleEn}</h4>
                          <span className="text-[10px] text-slate-400 font-bold leading-tight">{alert.titleMy}</span>
                        </div>
                      </div>

                      {/* Description segment */}
                      <div className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-900/50 pt-2 flex flex-col gap-1.5">
                        <p>{alert.descEn}</p>
                        <p className="text-slate-400 text-[10px]">{alert.descMy}</p>
                      </div>

                      {/* Rule-Based action recommendations */}
                      <div className={`p-2.5 rounded-lg text-[10px] leading-normal font-sans border flex flex-col gap-1 text-left ${
                        isCritical 
                          ? 'bg-rose-500/5 border-rose-500/10 text-rose-300' 
                          : isWarning 
                          ? 'bg-amber-500/5 border-amber-500/10 text-amber-300' 
                          : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                      }`}>
                        <div className="flex items-center gap-1 font-bold">
                          <Zap className="w-3 h-3 shrink-0" />
                          <span>REQUIRED MITIGATION ACTION:</span>
                        </div>
                        <p className="font-medium">{alert.recommendationEn}</p>
                        <p className="opacity-90">{alert.recommendationMy}</p>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Interactive Discipline System Rules Quick Audit Checklist */}
            <div className="bg-slate-900/20 border border-slate-850/60 rounded-2xl p-5 flex flex-col gap-4 shadow-xl font-sans">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                Active Account Audit Rules
              </span>

              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    {weeklyStats.bestToDoRate >= 70 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">Rule 1: Best-to-Do Miss Guard</span>
                    <span className="text-[10px] text-slate-500">Maintain &ge; 70% core habit completions to prevent index liquidation.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 border-t border-slate-900 pt-2.5">
                  <div className="shrink-0 mt-0.5">
                    {drawdownPercent < 20 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">Rule 2: Point Capital Stop-Loss</span>
                    <span className="text-[10px] text-slate-500">Keep point drawdowns strictly under 20% to safeguard tier ranks.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 border-t border-slate-900 pt-2.5">
                  <div className="shrink-0 mt-0.5">
                    {(config.consecutiveAfkCount ?? 0) === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">Rule 3: Real-Time Sync Guard</span>
                    <span className="text-[10px] text-slate-500">Avoid retroactive logs. Set daily schedules to check active trade dates live.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 border-t border-slate-900 pt-2.5">
                  <div className="shrink-0 mt-0.5">
                    {weeklyStats.volatilityIndex < 25 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">Rule 4: Stability Benchmark</span>
                    <span className="text-[10px] text-slate-500">Keep daily routine volatility below 25% to stabilize portfolio swings.</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. MODAL FOR METRIC EXPLANATIONS */}
      <AnimatePresence>
        {showExplanationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowExplanationModal(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-4 font-sans text-left">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Info className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-extrabold text-sm uppercase">
                    {helpTexts[showExplanationModal]?.title}
                  </h3>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  {helpTexts[showExplanationModal]?.desc}
                </p>

                <button 
                  onClick={() => setShowExplanationModal(null)}
                  className="mt-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow"
                >
                  Understood (သိရှိပါပြီ)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
