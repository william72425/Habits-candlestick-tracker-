import React, { useState } from 'react';
import { Habit, HabitCategory, HabitFrequency } from '../types';
import { getTodayDateString, addDays, formatDateLabel, getDatesInRange } from '../utils/dateHelpers';
import { Plus, Trash2, Calendar, Check, X, ShieldAlert, Award, Star, ListCollapse, ChevronLeft, ChevronRight } from 'lucide-react';

interface HabitManagerProps {
  habits: Habit[];
  onAddHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    weight: number,
    penalty: number,
    riskLevel: 'Low' | 'Medium' | 'High',
    isActiveOnWeekends: boolean
  ) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabit: (id: string, date: string) => void;
}

export default function HabitManager({ habits, onAddHabit, onDeleteHabit, onToggleHabit }: HabitManagerProps) {
  // Setup selected tracking date. Default is Today.
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Setup form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<HabitCategory>('Health');
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('Daily');
  const [newWeight, setNewWeight] = useState<number>(1.0);
  const [newPenalty, setNewPenalty] = useState<number>(1.0);
  const [newRiskLevel, setNewRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newIsActiveOnWeekends, setNewIsActiveOnWeekends] = useState<boolean>(true);
  const [error, setError] = useState('');

  // Sliding 7-day calendar bar (counting back from today)
  const calendarDays = Array.from({ length: 7 }).map((_, idx) => {
    return addDays(todayStr, -idx);
  }).reverse(); // chronological order

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Please enter a habit name.');
      return;
    }
    onAddHabit(
      newName.trim(),
      newCategory,
      newFrequency,
      newWeight,
      newPenalty,
      newRiskLevel,
      newIsActiveOnWeekends
    );
    setNewName('');
    setNewWeight(1.0);
    setNewPenalty(1.0);
    setNewRiskLevel('Medium');
    setNewIsActiveOnWeekends(true);
    setError('');
  };

  // Category Color mapping helper
  const getCategoryColor = (cat: HabitCategory) => {
    switch (cat) {
      case 'Health': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Work': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Learning': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Life': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    }
  };

  // Calculate stats for each habit (individual win rate, total active days)
  const calculateHabitStats = (habit: Habit) => {
    const dates = getDatesInRange(habit.createdDate, todayStr);
    const totalDays = dates.length;
    const completions = Object.keys(habit.history).filter(
      date => date >= habit.createdDate && date <= todayStr && habit.history[date] === true
    ).length;
    const rate = totalDays === 0 ? 100 : (completions / totalDays) * 100;
    return { completions, totalDays, rate };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="habit_manager_panel">
      
      {/* LEFT COLUMN: INTERACTIVE DAILY CHECK-IN GRID (7 SPAN) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Dynamic Check-in Header & Sliding Calendar Dock */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Daily Check-in Terminal
            </h3>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60">
              BACKTRACK ACTIVE
            </span>
          </div>

          <p className="text-slate-400 text-xs">
            Toggle daily completions to trigger live stock candlesticks recalculation. Select a past day to record backlog sessions.
          </p>

          {/* Sliding 7-day Dock */}
          <div className="grid grid-cols-7 gap-2 pt-2">
            {calendarDays.map((dateStr) => {
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;
              const dateObj = new Date(dateStr + "T00:00:00");
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
              const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });

              // Calculate done ratio for this day
              const activeHabits = habits.filter(h => h.createdDate <= dateStr);
              const doneCount = activeHabits.filter(h => h.history[dateStr] === true).length;
              const totalCount = activeHabits.length;
              const isPerfectDay = totalCount > 0 && doneCount === totalCount;
              const hasCompletions = doneCount > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-700 text-white shadow-lg scale-[1.03] ring-1 ring-slate-600'
                      : 'bg-slate-950/40 border-slate-800/50 hover:bg-slate-900 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60">
                    {dayName}
                  </span>
                  <span className="text-sm font-bold font-sans my-0.5">
                    {dayNum}
                  </span>
                  
                  {/* Micro completion bubble indicator */}
                  <div className="mt-1">
                    {totalCount === 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                    ) : isPerfectDay ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    ) : hasCompletions ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500/40"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklists for the Selected Date */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Tracking Date</span>
              <h4 className="font-sans font-bold text-sm text-slate-200">
                {formatDateLabel(selectedDate, 'long')} {selectedDate === todayStr && "(Today)"}
              </h4>
            </div>
            
            {/* Completion fraction */}
            <div className="text-right">
              <span className="text-slate-500 text-[10px] font-mono block">COMPLETED</span>
              <span className="font-mono text-xs text-slate-300 font-semibold">
                {habits.filter(h => h.createdDate <= selectedDate && h.history[selectedDate] === true).length} / {habits.filter(h => h.createdDate <= selectedDate).length}
              </span>
            </div>
          </div>

          {/* Habit checklist list */}
          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {habits.filter(h => h.createdDate <= selectedDate).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 text-xs">
                <ShieldAlert className="w-8 h-8 stroke-slate-700 mb-2" />
                <p>No habits active on this date.</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Habits only count from their creation date onwards ({formatDateLabel(selectedDate, 'short')}).
                </p>
              </div>
            ) : (
              habits
                .filter(h => h.createdDate <= selectedDate)
                .map((habit) => {
                  const isChecked = habit.history[selectedDate] === true;
                  return (
                    <div 
                      key={habit.id}
                      onClick={() => onToggleHabit(habit.id, selectedDate)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50' 
                          : 'bg-slate-900/20 border-slate-800/50 hover:bg-slate-900/40 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Interactive custom checkbox */}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                            : 'border border-slate-700 text-transparent hover:border-slate-500'
                        }`}>
                          {isChecked ? <Check className="w-4 h-4 stroke-[3px]" /> : <Check className="w-3.5 h-3.5" />}
                        </div>

                        {/* Title & Category Tag */}
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-sans text-sm font-medium transition-colors ${
                            isChecked ? 'text-emerald-50/90 line-through decoration-slate-600' : 'text-slate-200'
                          }`}>
                            {habit.name}
                          </span>
                          
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${getCategoryColor(habit.category)}`}>
                              {habit.category}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">
                              {habit.frequency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Impact Display */}
                      <div className="font-mono text-xs text-right flex flex-col items-end">
                        {isChecked ? (
                          <span className="text-emerald-400 font-bold font-mono">
                            +{(50 * (habit.weight || 1)).toFixed(0)} <span className="text-[9px] text-emerald-500">PTS</span>
                          </span>
                        ) : (
                          <span className="text-rose-500 font-medium font-mono">
                            -{(50 * (habit.penalty || 1)).toFixed(0)} <span className="text-[9px] text-rose-500 font-mono">PTS</span>
                          </span>
                        )}
                        <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                          W:{(habit.weight || 1.0).toFixed(1)}x P:{(habit.penalty || 1.0).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CREATION FORM & MANAGE TABLE (5 SPAN) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* INLINE HABIT CREATION FORM */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl">
          <h3 className="font-sans font-bold text-white text-lg flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-slate-400" />
            Launch New Habit
          </h3>
          
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-xs font-semibold">Habit Asset Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. 5K Running, Code Practice"
                className="bg-slate-900 border border-slate-800 focus:border-slate-700 outline-none rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 transition-all font-sans"
              />
            </div>

            {/* Category Select Pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-semibold">Category Sector</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Health', 'Work', 'Learning', 'Life'] as HabitCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                      newCategory === cat 
                        ? 'bg-slate-800 border-slate-600 text-white font-bold' 
                        : 'bg-slate-900/30 border-slate-900/60 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency Settings */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-semibold">Tracking Frequency</label>
              <div className="flex gap-2">
                {(['Daily', 'Weekly'] as HabitFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setNewFrequency(freq)}
                    className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                      newFrequency === freq 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-slate-900/30 border-slate-900/60 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Weight Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-400 font-semibold">Impact Weight (Positive Multiplier)</label>
                <span className="text-emerald-400 font-mono font-bold">{newWeight.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border border-slate-800"
              />
              <span className="text-[10px] text-slate-500">How much this completes drives index gains</span>
            </div>

            {/* Penalty Factor Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-400 font-semibold">Miss Penalty (Drawdown Multiplier)</label>
                <span className="text-rose-400 font-mono font-bold">{newPenalty.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={newPenalty}
                onChange={(e) => setNewPenalty(parseFloat(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border border-slate-800"
              />
              <span className="text-[10px] text-slate-500">How severe missing this habit harms index drawdowns</span>
            </div>

            {/* Simulated Risk Level Segment */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-semibold">Simulated Volatility (Risk Sector)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNewRiskLevel(lvl)}
                    className={`py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                      newRiskLevel === lvl 
                        ? lvl === 'High' ? 'bg-rose-500/20 border-rose-500 text-rose-300' :
                          lvl === 'Low' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' :
                          'bg-slate-800 border-slate-600 text-white font-bold'
                        : 'bg-slate-900/30 border-slate-900/60 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekend Checkin Toggle */}
            <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
              <div className="flex flex-col">
                <label className="text-slate-200 text-xs font-semibold">Active on Weekends</label>
                <span className="text-[9px] text-slate-500">Disable to avoid weekend missing penalties</span>
              </div>
              <button
                type="button"
                onClick={() => setNewIsActiveOnWeekends(!newIsActiveOnWeekends)}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer duration-200 ${
                  newIsActiveOnWeekends ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform duration-200 ${
                  newIsActiveOnWeekends ? 'translate-x-4' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-rose-400 text-xs font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-sm transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer mt-1"
            >
              Add to Tracker Index
            </button>
          </form>
        </div>

        {/* ACTIVE ASSETS MANAGER TABLE */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex-1 flex flex-col gap-3">
          <h3 className="font-sans font-bold text-white text-lg flex items-center gap-2">
            <ListCollapse className="w-5 h-5 text-slate-400" />
            Sectors & Performance
          </h3>

          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {habits.map((habit) => {
              const { rate } = calculateHabitStats(habit);
              
              return (
                <div 
                  key={habit.id}
                  className="bg-slate-900/20 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-700/80 transition-all"
                >
                  <div className="flex flex-col gap-0.5 truncate flex-1">
                    <span className="font-sans font-medium text-xs text-slate-200 truncate">
                      {habit.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`px-1 py-0.2 rounded text-[8px] font-medium border ${getCategoryColor(habit.category)}`}>
                        {habit.category}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">
                        {habit.frequency}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.2 rounded">
                        Weight: {(habit.weight || 1).toFixed(1)}x
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.2 rounded">
                        Penalty: {(habit.penalty || 1).toFixed(1)}x
                      </span>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded ${
                        habit.riskLevel === 'High' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20 font-semibold' :
                        habit.riskLevel === 'Low' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold' :
                        'text-slate-400 bg-slate-800/40 border border-slate-700/30'
                      }`}>
                        Risk: {habit.riskLevel || 'Medium'}
                      </span>
                      {!habit.isActiveOnWeekends && (
                        <span className="text-[8px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                          No Weekend Penalty
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Performance Rate Score */}
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block font-mono">WIN RATE</span>
                      <span className={`font-mono text-[11px] font-bold ${
                        rate >= 75 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-rose-500'
                      }`}>
                        {rate.toFixed(0)}%
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 bg-slate-900/60 border border-slate-800/80 hover:border-rose-950 rounded-lg transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Remove habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
