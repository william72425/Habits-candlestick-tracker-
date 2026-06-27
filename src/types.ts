export type HabitCategory = 'Health' | 'Work' | 'Learning' | 'Life';
export type HabitFrequency = 'Daily' | 'Weekly';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  createdDate: string; // YYYY-MM-DD format
  history: Record<string, boolean>; // key is YYYY-MM-DD, value is completion status
  weight?: number; // Custom positive point impact (e.g. +10 to +100 PTS)
  penalty?: number; // Custom negative point penalty (e.g. -10 to -100 PTS)
  riskLevel?: 'Low' | 'Medium' | 'High'; // Custom risk weight affecting intraday volatility
  isActiveOnWeekends?: boolean; // Custom tracking days
}

export interface PaperTradePosition {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  shares: number;
  leverage: number;
}

export interface UserTerminalConfig {
  leverage: number; // e.g. 1x, 2x, 5x, 10x, 20x, 50x, 100x
  startCapital: number; // default 10000
  paperTradingBalance: number; // current liquid cash
  positions: PaperTradePosition[];
  stopLossPrice: number; // automatic exit or alarm
  takeProfitPrice: number; // automatic exit or alarm
  showIndicators: boolean; // toggle SMA & EMA
  smaPeriod: number; // e.g. 5
  emaPeriod: number; // e.g. 10
  themePreset: 'standard' | 'emerald' | 'cyber' | 'amber' | 'gold';
  ignoreWeekends: boolean; // ignore Saturdays/Sundays
  tradingActive: boolean; // toggle paper trading simulation panel
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

