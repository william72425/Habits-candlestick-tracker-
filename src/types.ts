export type HabitCategory = 'Health' | 'Work' | 'Learning' | 'Life';
export type HabitFrequency = 'Daily' | 'Weekly';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  createdDate: string; // YYYY-MM-DD format
  archivedDate?: string; // YYYY-MM-DD format if archived
  archived?: boolean; // archived flag so deleted habits keep past data
  history: Record<string, boolean | number>; // key is YYYY-MM-DD, value is completion status or progress value
  weight?: number; // Custom positive point override (optional)
  penalty?: number; // Custom negative point override (optional)
  difficulty?: 'Easy' | 'Medium' | 'Hard'; // Auto point multiplier
  importance?: 'Low' | 'Medium' | 'High'; // Auto weight multiplier
  isBestToDo?: boolean; // Double penalty multiplier if missed
  riskLevel?: 'Low' | 'Medium' | 'High'; // Custom risk weight affecting intraday volatility
  isActiveOnWeekends?: boolean; // Custom tracking days
  selectiveDays?: number[]; // Custom selective days (0 = Sunday, 1 = Monday, etc.)
  
  // Quantitative Additions
  habitType?: 'binary' | 'quantitative'; // Tracking mode
  targetValue?: number; // Target number (e.g. 3, 20, 100)
  unit?: string; // Unit (e.g. "litres", "pushups", "hours", etc.)
}

export interface PaperTradePosition {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  shares: number;
  leverage: number;
}

export interface PredictionTrade {
  id: string;
  entryDate: string;
  targetDate: string;
  entryIndexPrice: number;
  targetIndexPrice: number;
  wagerPoints: number;
  payoutPoints: number;
  status: 'PENDING' | 'WON' | 'LOST';
  growthRequired: number; // e.g. 2, 5, 10 (%)
  durationDays: number;
  leverage?: number;
}

export interface PointsHistoryItem {
  id: string;
  date: string;
  type: 'HABIT_COMPLETE' | 'HABIT_MISS' | 'PREDICTION_WAGER' | 'PREDICTION_WIN' | 'BONUS_REWARD' | 'INITIAL';
  description: string;
  points: number; // positive or negative
}

export interface PromotionTrialState {
  status: 'NONE' | 'ELIGIBLE' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  targetTier: string;
  targetPoints: number;
  activationDate?: string;
  startDate?: string;
  endDate?: string;
  dailyPerformance?: {
    [date: string]: {
      completedCount: number;
      totalActiveCount: number;
      pointsEarned: number;
      totalPointsPossible: number;
      percentage: number;
      passed: boolean;
    };
  };
}

export interface UserTerminalConfig {
  leverage: number; // e.g. 1x, 2x, 5x, 10x
  startCapital: number; // default 10000
  paperTradingBalance: number; // current liquid cash
  positions: PaperTradePosition[];
  stopLossPrice: number;
  takeProfitPrice: number;
  showIndicators: boolean;
  smaPeriod: number;
  emaPeriod: number;
  themePreset: 'standard' | 'emerald' | 'cyber' | 'amber' | 'gold';
  ignoreWeekends: boolean;
  tradingActive: boolean;
  
  // Gamified additions
  totalPoints: number;
  predictions: PredictionTrade[];
  pointsHistory: PointsHistoryItem[];

  // Promotion Match Addition
  promotion?: PromotionTrialState;

  // Timezone and AFK anti-exploit settings
  timezone?: string;
  timezoneOffset?: number;
  nightOwlOffset?: number;
  lastActiveDate?: string;
  consecutiveAfkCount?: number;
  afkHistory?: string[];
  leaderboardUnlocked?: boolean;
}

export interface Candle {
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // Number of completed habits in the period
  totalActive: number; // Number of total active habits in the period
  isGreen: boolean;
  changePercent: number;
  rawDate: string; // Base date
  // Technical indicator overlays
  sma?: number;
  ema?: number;
}

export interface DashboardMetrics {
  currentScore: number;
  previousScore: number;
  scoreChange: number;
  scoreChangePercent: number;
  totalWinRate: number; // completed / total opportunities (%)
  longestStreak: number; // consecutive days
  currentStreak: number;
  mostVolatileHabitName: string;
  mostVolatileHabitSwitches: number;
  // Premium performance analytics
  maxDrawdown: number; // Max peak-to-trough drop (%)
  sharpeRatio: number; // Performance vs volatility consistency metric
  totalProfitLoss?: number; // Current paper trade portfolio PnL
}


