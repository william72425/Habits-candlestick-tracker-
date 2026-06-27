import React from 'react';
import { DashboardMetrics } from '../types';
import { TrendingUp, TrendingDown, Flame, Percent, Activity, AlertCircle, Award, Shield } from 'lucide-react';

interface DashboardOverviewProps {
  metrics: DashboardMetrics;
}

export default function DashboardOverview({ metrics }: DashboardOverviewProps) {
  const isPositive = metrics.scoreChange >= 0;
  
  // Custom rating for Sharpe ratio
  const getConsistencyRating = (sharpe: number) => {
    if (sharpe >= 2.0) return { label: 'Excellent', color: 'text-emerald-400' };
    if (sharpe >= 1.0) return { label: 'Good', color: 'text-teal-400' };
    if (sharpe >= 0.0) return { label: 'Moderate', color: 'text-amber-400' };
    return { label: 'Volatile', color: 'text-rose-400' };
  };

  const rating = getConsistencyRating(metrics.sharpeRatio);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" id="dashboard_metrics_grid">
      
      {/* CARD 1: PERFORMANCE INDEX */}
      <div className="bg-slate-950/50 rounded-xl p-4.5 border border-slate-800/40 flex items-center gap-3.5 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0 border border-slate-800/60">
          <Activity className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Habit Index</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-white tracking-tight">{metrics.currentScore.toFixed(0)}</span>
            <span className="text-[8px] text-slate-600 font-mono">PTS</span>
          </div>
          <div className={`flex items-center gap-0.5 text-[9px] font-mono mt-0.5 ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span>{isPositive ? '▲' : '▼'} {Math.abs(metrics.scoreChange).toFixed(0)}</span>
            <span className="text-[8px] text-slate-600 ml-1">({isPositive ? '+' : ''}{metrics.scoreChangePercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* CARD 2: STREAKS */}
      <div className="bg-slate-950/50 rounded-xl p-4.5 border border-slate-800/40 flex items-center gap-3.5 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 shrink-0 border border-slate-800/60">
          <Flame className={`w-4.5 h-4.5 ${metrics.currentStreak > 0 ? 'animate-pulse' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Current Streak</p>
          <p className="text-lg font-bold mt-0.5 text-white tracking-tight">{metrics.currentStreak} Days</p>
          <p className="text-[8px] font-mono text-slate-600 mt-0.5 flex items-center gap-1">
            Max Streak: {metrics.longestStreak}d
          </p>
        </div>
      </div>

      {/* CARD 3: WIN RATE */}
      <div className="bg-slate-950/50 rounded-xl p-4.5 border border-slate-800/40 flex items-center gap-3.5 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 shrink-0 border border-slate-800/60">
          <Percent className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Win Rate</p>
          <p className="text-lg font-bold mt-0.5 text-white tracking-tight">{metrics.totalWinRate.toFixed(1)}%</p>
          
          <div className="w-full bg-slate-900 rounded-full h-1 mt-1 overflow-hidden border border-slate-800/30">
            <div 
              className="bg-emerald-500 h-1 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${metrics.totalWinRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* CARD 4: SHARPE RATIO (CONSISTENCY SCORE) */}
      <div className="bg-slate-950/50 rounded-xl p-4.5 border border-slate-800/40 flex items-center gap-3.5 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-teal-400 shrink-0 border border-slate-800/60">
          <Award className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Sharpe Ratio</p>
          <p className="text-lg font-bold mt-0.5 text-white tracking-tight">{metrics.sharpeRatio.toFixed(2)}</p>
          <p className={`text-[8px] font-mono font-semibold mt-0.5 ${rating.color}`}>
            Rating: {rating.label}
          </p>
        </div>
      </div>

      {/* CARD 5: MAX DRAWDOWN */}
      <div className="bg-slate-950/50 rounded-xl p-4.5 border border-slate-800/40 flex items-center gap-3.5 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-rose-400 shrink-0 border border-slate-800/60">
          <TrendingDown className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Max Drawdown</p>
          <p className="text-lg font-bold mt-0.5 text-rose-400 tracking-tight">-{metrics.maxDrawdown.toFixed(1)}%</p>
          <p className="text-[8px] font-mono text-slate-600 mt-0.5">
            Worst drawdown risk
          </p>
        </div>
      </div>

      {/* CARD 6: VOLATILITY */}
      <div className="bg-slate-950/50 rounded-xl p-4.5 border border-emerald-500/30 flex items-center gap-3.5 transition-all duration-300 hover:bg-slate-900/60 hover:border-emerald-500/50">
        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0 border border-slate-800/60 animate-pulse">
          <AlertCircle className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1 text-slate-200">
          <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Top Volatility</p>
          <p className="text-sm font-bold truncate leading-tight mt-0.5" title={metrics.mostVolatileHabitName}>
            {metrics.mostVolatileHabitName}
          </p>
          <p className="text-[8px] font-mono text-slate-500 mt-0.5">
            {metrics.mostVolatileHabitSwitches} flips
          </p>
        </div>
      </div>

    </div>
  );
}
