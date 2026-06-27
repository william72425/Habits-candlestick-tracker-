export type HabitCategory = 'Health' | 'Work' | 'Learning' | 'Life';
export type HabitFrequency = 'Daily' | 'Weekly';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  createdDate: string; // YYYY-MM-DD format
  history: Record<string, boolean>; // key is YYYY-MM-DD, value is completion status
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
  rawDate: string; // Base date (e.g., start of week, month, or exact day)
}

export interface DashboardMetrics {
  currentScore: number;
  previousScore: number;
  scoreChange: number;
  scoreChangePercent: number;
  totalWinRate: number; // completed / total opportunities (%)
  longestStreak: number; // consecutive days with at least 1 habit completed (or all habits completed)
  currentStreak: number;
  mostVolatileHabitName: string;
  mostVolatileHabitSwitches: number;
}
