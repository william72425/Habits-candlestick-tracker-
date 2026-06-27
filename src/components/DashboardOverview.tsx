import React from 'react';
import { DashboardMetrics } from '../types';
import { TrendingUp, TrendingDown, Flame, Percent, Activity, AlertCircle, Award } from 'lucide-react';

interface DashboardOverviewProps {
  metrics: DashboardMetrics;
}

export default function DashboardOverview({ metrics }: DashboardOverviewProps) {
  const isPositive = metrics.scoreChange >= 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard_metrics_grid">
      
      {/* CARD 1: PERFORMANCE INDEX */}
      <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/40 flex items-center gap-4 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0 border border-slate-800/60">
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Habit Index</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-white tracking-tight">{metrics.currentScore.toFixed(0)}</span>
            <span className="text-[9px] text-slate-600 font-mono">PTS</span>
          </div>
          <div className={`flex items-center gap-0.5 text-[10px] font-mono mt-0.5 ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span>{isPositive ? '▲' : '▼'} {metrics.scoreChange.toFixed(0)}</span>
            <span className="text-[9px] text-slate-600 ml-1">({isPositive ? '+' : ''}{metrics.scoreChangePercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* CARD 2: STREAKS */}
      <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/40 flex items-center gap-4 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 shrink-0 border border-slate-800/60">
          <Flame className={`w-5 h-5 ${metrics.currentStreak > 0 ? 'animate-pulse' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Current Streak</p>
          <p className="text-xl font-bold mt-0.5 text-white tracking-tight">{metrics.currentStreak} Days</p>
          <p className="text-[9px] font-mono text-slate-600 mt-1 flex items-center gap-1">
            <Award className="w-3 h-3 text-slate-700" />
            Max: {metrics.longestStreak} days
          </p>
        </div>
      </div>

      {/* CARD 3: WIN RATE */}
      <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/40 flex items-center gap-4 transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-800/80">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 shrink-0 border border-slate-800/60">
          <Percent className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Win Rate</p>
          <p className="text-xl font-bold mt-0.5 text-white tracking-tight">{metrics.totalWinRate.toFixed(1)}%</p>
          
          <div className="w-full bg-slate-900 rounded-full h-1 mt-1.5 overflow-hidden border border-slate-800/30">
            <div 
              className="bg-emerald-500 h-1 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${metrics.totalWinRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* CARD 4: VOLATILITY */}
      <div className="bg-emerald-500 rounded-xl p-5 flex items-center gap-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:shadow-emerald-500/20">
        <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-emerald-400 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1 text-slate-950">
          <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">Highest Volatility</p>
          <p className="text-lg font-black truncate leading-tight mt-0.5" title={metrics.mostVolatileHabitName}>
            {metrics.mostVolatileHabitName}
          </p>
          <p className="text-[9px] font-bold font-mono opacity-70 mt-1">
            {metrics.mostVolatileHabitSwitches} Swapping events
          </p>
        </div>
      </div>

    </div>
  );
}
