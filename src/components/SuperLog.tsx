import React, { useState } from 'react';
import { Habit, Candle } from '../types';
import { formatDateLabel, getDatesInRange } from '../utils/dateHelpers';
import { Search, Calendar, ChevronRight, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';

interface SuperLogProps {
  habits: Habit[];
  dailyCandles: Candle[];
  onSelectBacktrackDate: (date: string) => void;
}

export default function SuperLog({ habits, dailyCandles, onSelectBacktrackDate }: SuperLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Green' | 'Red'>('All');

  // Reverse-chronological ledger (newest days first)
  const sortedCandles = [...dailyCandles].reverse();

  // Filter & Search candles
  const filteredCandles = sortedCandles.filter((candle) => {
    // 1. Filter by Candle color
    if (filterType === 'Green' && !candle.isGreen) return false;
    if (filterType === 'Red' && candle.isGreen) return false;

    // 2. Filter by search term (search for habits completed on this day)
    if (searchTerm.trim() !== '') {
      const activeCompletedHabitsOnDay = habits.filter(
        h => h.createdDate <= candle.rawDate && h.history[candle.rawDate] === true
      );
      const matchesHabitName = activeCompletedHabitsOnDay.some(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesDateStr = formatDateLabel(candle.rawDate, 'long').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesHabitName || matchesDateStr;
    }

    return true;
  });

  // Get list of habit names completed on a specific day
  const getCompletionsOnDay = (dateStr: string) => {
    return habits.filter(h => h.createdDate <= dateStr && h.history[dateStr] === true);
  };

  // Get list of active habits missed on a specific day
  const getMissesOnDay = (dateStr: string) => {
    return habits.filter(h => h.createdDate <= dateStr && h.history[dateStr] !== true);
  };

  return (
    <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-6 rounded-xl flex flex-col gap-6" id="super_details_log_panel">
      
      {/* HEADER SECTION WITH FILTER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h3 className="font-sans font-bold text-white text-lg flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-slate-400" />
            Super Details Index Ledger
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Browse complete audit history of everyday's index scores, OHLC prices, and recorded habits.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date or completed habit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-slate-700 outline-none rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-sans w-56 transition-all"
            />
          </div>

          {/* Candle Type Toggle Buttons */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800/60">
            {(['All', 'Green', 'Red'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                  filterType === type 
                    ? type === 'Green' 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : type === 'Red'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HISTORICAL LOG TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800/40 text-[10px] uppercase font-mono tracking-wider text-slate-500">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Open</th>
              <th className="py-3 px-4 text-right">High</th>
              <th className="py-3 px-4 text-right">Low</th>
              <th className="py-3 px-4 text-right">Close</th>
              <th className="py-3 px-4 text-center">Trend (Candle)</th>
              <th className="py-3 px-4">Daily Completions</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 font-sans">
            {filteredCandles.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-600 text-sm">
                  No tracking records found matching the filters.
                </td>
              </tr>
            ) : (
              filteredCandles.map((candle) => {
                const completions = getCompletionsOnDay(candle.rawDate);
                const misses = getMissesOnDay(candle.rawDate);
                const isGreen = candle.isGreen;
                
                return (
                  <tr 
                    key={candle.rawDate} 
                    className="hover:bg-slate-900/10 transition-all text-xs"
                  >
                    {/* DATE COLUMN */}
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      <div className="flex flex-col">
                        <span>{formatDateLabel(candle.rawDate, 'long')}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{candle.rawDate}</span>
                      </div>
                    </td>

                    {/* OHLC COLUMNS */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {candle.open.toFixed(0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {candle.high.toFixed(0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {candle.low.toFixed(0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                      {candle.close.toFixed(0)}
                    </td>

                    {/* TREND BADGE */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                        isGreen 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {isGreen ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{candle.changePercent.toFixed(1)}%
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {candle.changePercent.toFixed(1)}%
                          </>
                        )}
                      </span>
                    </td>

                    {/* COMPLETIONS LIST WITH DYNAMIC CAPSULES */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="flex flex-wrap gap-1">
                        {completions.length === 0 ? (
                          <span className="text-[10px] text-slate-600 bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40">
                            Zero Completions
                          </span>
                        ) : (
                          completions.map((h) => (
                            <span 
                              key={h.id} 
                              className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 hover:border-emerald-500/20 transition-all cursor-help"
                              title={`${h.name} - Completed`}
                            >
                              {h.name}
                            </span>
                          ))
                        )}

                        {/* Missed habits shown with lower opacity */}
                        {misses.map((h) => (
                          <span 
                            key={h.id} 
                            className="inline-flex items-center text-[10px] text-slate-500 bg-slate-900/10 px-2 py-0.5 rounded border border-slate-800/30 hover:border-slate-700/30 transition-all cursor-help line-through decoration-slate-800"
                            title={`${h.name} - Missed`}
                          >
                            {h.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* ACTION LINK */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectBacktrackDate(candle.rawDate)}
                        className="p-2 inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-emerald-400 rounded-lg transition-all cursor-pointer"
                        title="Backtrack and adjust habit completions for this day"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
