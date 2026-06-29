import React, { useState } from 'react';
import { Habit, HabitCategory, HabitFrequency } from '../types';
import { getTodayDateString, addDays, formatDateLabel, getDatesInRange } from '../utils/dateHelpers';
import { Plus, Trash2, Calendar, Check, X, ShieldAlert, Award, Star, ListCollapse, Sliders, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { getHabitPoints, isHabitActiveOnDate, isHabitCompletedOnDate, getHabitProgressPercent } from '../utils/financeEngine';
import { motion, AnimatePresence } from 'motion/react';

interface HabitManagerProps {
  habits: Habit[];
  todayStr: string;
  onAddHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    importance: 'Low' | 'Medium' | 'High',
    isBestToDo: boolean,
    weight: number | undefined,
    penalty: number | undefined,
    riskLevel: 'Low' | 'Medium' | 'High',
    isActiveOnWeekends: boolean,
    selectiveDays: number[] | undefined,
    habitType?: 'binary' | 'quantitative',
    targetValue?: number,
    unit?: string
  ) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabit: (id: string, date: string) => void;
  onUpdateHabitValue?: (id: string, date: string, value: number) => void;
}

export default function HabitManager({ habits, todayStr, onAddHabit, onDeleteHabit, onToggleHabit, onUpdateHabitValue }: HabitManagerProps) {
  // Setup selected tracking date. Default is Today.
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  React.useEffect(() => {
    setSelectedDate(todayStr);
  }, [todayStr]);

  // Setup form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<HabitCategory>('Health');
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('Daily');
  
  // Custom frequency type selection
  const [newFreqType, setNewFreqType] = useState<'Daily' | 'Weekdays' | 'Selective'>('Daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // defaults to weekdays (Mon-Fri)
  
  // Custom difficulty & importance gamification parameters
  const [newDifficulty, setNewDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newImportance, setNewImportance] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newIsBestToDo, setNewIsBestToDo] = useState<boolean>(false);
  const [customPointOverride, setCustomPointOverride] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<number>(30);
  const [newPenalty, setNewPenalty] = useState<number>(30);
  
  const [newRiskLevel, setNewRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newIsActiveOnWeekends, setNewIsActiveOnWeekends] = useState<boolean>(true);
  
  // Quantitative settings state
  const [newHabitType, setNewHabitType] = useState<'binary' | 'quantitative'>('binary');
  const [newTargetValue, setNewTargetValue] = useState<number>(3);
  const [newUnit, setNewUnit] = useState<string>('litres');
  
  const [error, setError] = useState('');

  // Submission & animation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [launchedName, setLaunchedName] = useState('');

  const toggleDaySelection = (dayVal: number) => {
    setSelectedDays(prev => 
      prev.includes(dayVal) 
        ? prev.filter(d => d !== dayVal) 
        : [...prev, dayVal].sort()
    );
  };

  // Sliding 7-day calendar bar (counting back from today)
  const calendarDays = Array.from({ length: 7 }).map((_, idx) => {
    return addDays(todayStr, -idx);
  }).reverse(); // chronological order

  // Live points preview based on selected parameters
  const getPreviewPoints = () => {
    if (customPointOverride) {
      return { reward: newWeight, penalty: newPenalty };
    }
    const baseReward = newDifficulty === 'Easy' ? 15 : newDifficulty === 'Medium' ? 30 : 50;
    const importanceMult = newImportance === 'Low' ? 1.0 : newImportance === 'Medium' ? 1.5 : 2.0;
    const reward = Math.round(baseReward * importanceMult);
    
    const bestToDoMult = newIsBestToDo ? 2.0 : 1.0;
    const penalty = Math.round(baseReward * importanceMult * bestToDoMult);
    return { reward, penalty };
  };

  const preview = getPreviewPoints();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Please enter a habit name.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setLaunchedName(newName.trim());

    let activeWeekends = newIsActiveOnWeekends;
    let days: number[] | undefined = undefined;

    if (newFreqType === 'Daily') {
      activeWeekends = true;
      days = undefined;
    } else if (newFreqType === 'Weekdays') {
      activeWeekends = false;
      days = undefined;
    } else if (newFreqType === 'Selective') {
      activeWeekends = selectedDays.includes(0) || selectedDays.includes(6);
      days = selectedDays.length > 0 ? selectedDays : [1, 2, 3, 4, 5];
    }

    // Call callback
    onAddHabit(
      newName.trim(),
      newCategory,
      newFrequency,
      newDifficulty,
      newImportance,
      newIsBestToDo,
      customPointOverride ? newWeight : undefined,
      customPointOverride ? newPenalty : undefined,
      newRiskLevel,
      activeWeekends,
      days,
      newHabitType,
      newHabitType === 'quantitative' ? newTargetValue : undefined,
      newHabitType === 'quantitative' ? newUnit.trim() : undefined
    );

    // Trigger success state and animated reset
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Reset form fields
      setNewName('');
      setNewIsBestToDo(false);
      setCustomPointOverride(false);
      setNewWeight(30);
      setNewPenalty(30);
      setNewRiskLevel('Medium');
      setNewIsActiveOnWeekends(true);
      setNewHabitType('binary');
      setNewTargetValue(3);
      setNewUnit('litres');
      
      // Auto-dismiss success notification after 3.5s
      setTimeout(() => {
        setIsSuccess(false);
      }, 3500);
    }, 700);
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
      date => date >= habit.createdDate && date <= todayStr && isHabitCompletedOnDate(habit, date)
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
              const dateObj = new Date(dateStr + "T00:00:00Z");
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
              const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });

              // Calculate done ratio for this day (exclude archived if archived before selected day) and filter out off-schedule habits
              const activeOnDate = habits.filter(h => {
                const wasCreated = h.createdDate <= dateStr;
                const wasNotArchivedYet = !h.archived || !h.archivedDate || h.archivedDate > dateStr;
                return wasCreated && wasNotArchivedYet && isHabitActiveOnDate(h, dateStr);
              });
              const doneCount = activeOnDate.filter(h => isHabitCompletedOnDate(h, dateStr)).length;
              const totalCount = activeOnDate.length;
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
                {habits.filter(h => h.createdDate <= selectedDate && (!h.archived || !h.archivedDate || h.archivedDate > selectedDate) && isHabitActiveOnDate(h, selectedDate) && isHabitCompletedOnDate(h, selectedDate)).length} / {habits.filter(h => h.createdDate <= selectedDate && (!h.archived || !h.archivedDate || h.archivedDate > selectedDate) && isHabitActiveOnDate(h, selectedDate)).length}
              </span>
            </div>
          </div>

          {/* Habit checklist list */}
          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {habits.filter(h => h.createdDate <= selectedDate && (!h.archived || !h.archivedDate || h.archivedDate > selectedDate)).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 text-xs">
                <ShieldAlert className="w-8 h-8 stroke-slate-700 mb-2" />
                <p>No habits active on this date.</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Habits only count from their creation date onwards ({formatDateLabel(selectedDate, 'short')}).
                </p>
              </div>
            ) : (
              habits
                .filter(h => h.createdDate <= selectedDate && (!h.archived || !h.archivedDate || h.archivedDate > selectedDate))
                .map((habit) => {
                  const isChecked = isHabitCompletedOnDate(habit, selectedDate);
                  const isQuantitative = habit.habitType === 'quantitative';
                  const targetVal = habit.targetValue ?? 1;
                  const currentRecorded = typeof habit.history[selectedDate] === 'number'
                    ? (habit.history[selectedDate] as number)
                    : (habit.history[selectedDate] === true ? targetVal : 0);
                  const progressPercent = getHabitProgressPercent(habit, selectedDate);
                  const points = getHabitPoints(habit);
                  const isActiveToday = isHabitActiveOnDate(habit, selectedDate);

                  if (!isActiveToday) {
                    return (
                      <div 
                        key={habit.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 opacity-40 select-none cursor-not-allowed"
                        title="Rest Day: This habit is not active today according to its tracking frequency."
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-900 border border-slate-800 text-[10px] text-slate-600">
                            💤
                          </div>
                          <div className="flex flex-col">
                            <span className="font-sans text-xs font-medium text-slate-500 line-through">
                              {habit.name}
                            </span>
                            <span className="text-[8px] text-slate-600 font-mono font-bold tracking-wider uppercase mt-0.5">
                              Off-Schedule / Rest Day
                            </span>
                          </div>
                        </div>

                        <span className="text-[8px] font-mono bg-slate-900/50 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Off Day
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={habit.id}
                      className={`flex flex-col gap-3 p-3.5 rounded-xl border transition-all select-none ${
                        isChecked 
                          ? 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50 shadow-[inset_0_1px_3px_rgba(16,185,129,0.05)]' 
                          : 'bg-slate-900/20 border-slate-800/50 hover:bg-slate-900/40 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => onToggleHabit(habit.id, selectedDate)}
                        >
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
                              isChecked ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-200 font-bold'
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
                              {habit.isBestToDo && (
                                <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 font-bold uppercase">
                                  Best To Do ⭐️
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Score Impact Display */}
                        <div className="font-mono text-xs text-right flex flex-col items-end">
                          {isChecked ? (
                            <span className="text-emerald-400 font-bold font-mono text-sm flex items-center gap-0.5">
                              +{points.reward} <span className="text-[9px] text-emerald-500">PTS</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium font-mono text-xs flex items-center gap-0.5">
                              -{points.penalty} <span className="text-[9px] text-rose-500/80 font-mono">PTS</span>
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                            {habit.difficulty ?? 'Medium'} / {habit.importance ?? 'Medium'}
                          </span>
                        </div>
                      </div>

                      {/* Quantitative Progress Input Panel */}
                      {isQuantitative && onUpdateHabitValue && (
                        <div 
                          className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-900/60 flex flex-col gap-2 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-mono text-[10px] uppercase">
                              Target: <strong className="text-slate-200">{targetVal}</strong> {habit.unit || ''}
                            </span>
                            <span className="font-mono text-slate-300">
                              Logged: <strong className="text-emerald-400 text-sm font-bold">{currentRecorded}</strong> / {targetVal} {habit.unit || ''} ({progressPercent}%)
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const step = targetVal >= 10 ? 1 : 0.5;
                                const newVal = Math.max(0, parseFloat((currentRecorded - step).toFixed(1)));
                                onUpdateHabitValue(habit.id, selectedDate, newVal);
                              }}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-xs font-bold font-mono"
                            >
                              -
                            </button>

                            <input
                              type="range"
                              min="0"
                              max={Math.max(targetVal * 1.5, targetVal)}
                              step={targetVal >= 10 ? "1" : "0.5"}
                              value={currentRecorded}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                onUpdateHabitValue(habit.id, selectedDate, isNaN(val) ? 0 : val);
                              }}
                              className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const step = targetVal >= 10 ? 1 : 0.5;
                                const newVal = parseFloat((currentRecorded + step).toFixed(1));
                                onUpdateHabitValue(habit.id, selectedDate, newVal);
                              }}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-xs font-bold font-mono"
                            >
                              +
                            </button>
                            
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={currentRecorded}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                onUpdateHabitValue(habit.id, selectedDate, isNaN(val) ? 0 : val);
                              }}
                              className="w-14 px-1.5 py-0.5 text-center rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Beautiful Progress Track Indicator */}
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                isChecked ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, progressPercent)}%` }}
                            />
                          </div>
                        </div>
                      )}
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

            {/* Logging Mode Selection */}
            <div className="flex flex-col gap-1.5 border-t border-slate-900 pt-3">
              <label className="text-slate-400 text-xs font-semibold">Logging Mode (မှတ်တမ်းတင်မည့် ပုံစံ)</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'binary', label: 'Binary Checkmark' },
                  { id: 'quantitative', label: 'Quantitative Data' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setNewHabitType(mode.id as 'binary' | 'quantitative')}
                    className={`py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                      newHabitType === mode.id 
                        ? 'bg-slate-800 border-slate-600 text-white font-bold' 
                        : 'bg-slate-900/30 border-slate-900/60 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* If quantitative is selected, show target and unit controls */}
              {newHabitType === 'quantitative' && (
                <div className="grid grid-cols-2 gap-2 mt-1 p-2 bg-slate-950/40 rounded-lg border border-slate-900">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Daily Target Value</span>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={newTargetValue}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewTargetValue(isNaN(val) ? 1 : val);
                      }}
                      className="bg-slate-900 border border-slate-800 focus:border-slate-700 outline-none rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Measurement Unit</span>
                    <input
                      type="text"
                      placeholder="e.g. litres, times, hours"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="bg-slate-900 border border-slate-800 focus:border-slate-700 outline-none rounded-lg px-2.5 py-1 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}
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

            {/* Tracking Frequency Settings with Weekday/Selective Day options */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 text-xs font-semibold">Tracking Frequency (ခြေရာခံမည့်စနစ်)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Daily', label: 'Daily (နေ့စဉ်)' },
                  { id: 'Weekdays', label: 'Mon-Fri (Weekdays)' },
                  { id: 'Selective', label: 'Custom Days' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setNewFreqType(type.id as any);
                      setError('');
                    }}
                    className={`py-1.5 px-1 text-[9px] uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                      newFreqType === type.id
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-900/30 border-slate-900/60 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* If "Selective" is selected, show Mon-Sun selection buttons */}
              {newFreqType === 'Selective' && (
                <div className="flex flex-col gap-1.5 bg-slate-900/20 p-2.5 rounded-xl border border-slate-850 mt-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Select Active Days (ခြေရာခံမည့်ရက်များ)</span>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { label: 'S', value: 0, full: 'Sun' },
                      { label: 'M', value: 1, full: 'Mon' },
                      { label: 'T', value: 2, full: 'Tue' },
                      { label: 'W', value: 3, full: 'Wed' },
                      { label: 'T', value: 4, full: 'Thu' },
                      { label: 'F', value: 5, full: 'Fri' },
                      { label: 'S', value: 6, full: 'Sat' }
                    ].map((day) => {
                      const isActive = selectedDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDaySelection(day.value)}
                          className={`py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.25)] font-extrabold'
                              : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-400'
                          }`}
                          title={day.full}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic difficulty, importance, isBestToDo segment */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Score Setup</span>
              </div>

              {/* Toggle manual override */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300 text-[11px]">Manual Custom Overrides</span>
                <button
                  type="button"
                  onClick={() => setCustomPointOverride(!customPointOverride)}
                  className="text-slate-400 hover:text-white transition-all"
                >
                  {customPointOverride ? (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold">Enabled</span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded uppercase">Auto (Recommended)</span>
                  )}
                </button>
              </div>

              {!customPointOverride ? (
                <div className="flex flex-col gap-3">
                  {/* Difficulty */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Difficulty Level (အဆင့်သတ်မှတ်ချက်)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setNewDifficulty(diff)}
                          className={`py-1 text-[10px] uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                            newDifficulty === diff 
                              ? 'bg-slate-800 border-slate-500 text-white font-bold' 
                              : 'bg-slate-900/20 border-slate-900 text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Importance */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Importance Level (အရေးကြီးမှု)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Low', 'Medium', 'High'] as const).map((imp) => (
                        <button
                          key={imp}
                          type="button"
                          onClick={() => setNewImportance(imp)}
                          className={`py-1 text-[10px] uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                            newImportance === imp 
                              ? 'bg-slate-800 border-slate-500 text-white font-bold' 
                              : 'bg-slate-900/20 border-slate-900 text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          {imp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Best to do switch */}
                  <div className="flex items-center justify-between border-t border-slate-800/40 pt-2">
                    <div className="flex flex-col">
                      <span className="text-slate-200 text-xs font-semibold">Best To Do (အရေးကြီးဆုံးအလေ့အကျင့်)</span>
                      <span className="text-[9px] text-slate-500">Double miss penalty if failed (မလုပ်ဖြစ်ရင် အမှတ်ပိုနှုတ်မည်)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewIsBestToDo(!newIsBestToDo)}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                        newIsBestToDo ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform duration-200 ${
                        newIsBestToDo ? 'translate-x-4' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Custom positive points override */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-slate-400 font-semibold">Custom Reward (အောင်မြင်ရင်ရမည့်အမှတ်)</label>
                      <span className="text-emerald-400 font-mono font-bold">+{newWeight} PTS</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={newWeight}
                      onChange={(e) => setNewWeight(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border border-slate-800"
                    />
                  </div>

                  {/* Custom penalty points override */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-slate-400 font-semibold">Custom Penalty (မလုပ်ဖြစ်ရင်နှုတ်မည့်အမှတ်)</label>
                      <span className="text-rose-400 font-mono font-bold">-{newPenalty} PTS</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={newPenalty}
                      onChange={(e) => setNewPenalty(parseInt(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border border-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Real-time points preview card */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">COMPLETION GAIN</span>
                  <span className="text-emerald-400 font-mono text-sm font-black animate-pulse">+{preview.reward} PTS</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">MISS PENALTY</span>
                  <span className="text-rose-400 font-mono text-sm font-black">-{preview.penalty} PTS</span>
                </div>
              </div>
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
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting || isSuccess}
              type="submit"
              className={`font-bold py-2 rounded-xl text-sm transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : isSubmitting
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 cursor-wait'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3px] animate-bounce" />
                  Launched Successfully!
                </>
              ) : isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                  Laying Pipeline...
                </>
              ) : (
                'Add to Tracker Index'
              )}
            </motion.button>
          </form>
        </div>

        {/* ACTIVE ASSETS MANAGER TABLE */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex-1 flex flex-col gap-3">
          <h3 className="font-sans font-bold text-white text-lg flex items-center gap-2">
            <ListCollapse className="w-5 h-5 text-slate-400" />
            Sectors & Performance
          </h3>

          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {habits.filter(h => !h.archived).map((habit) => {
              const { rate } = calculateHabitStats(habit);
              const points = getHabitPoints(habit);
              
              return (
                <div 
                  key={habit.id}
                  className="bg-slate-900/20 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-700/80 transition-all"
                >
                  <div className="flex flex-col gap-0.5 truncate flex-1">
                    <span className="font-sans font-bold text-xs text-slate-200 truncate">
                      {habit.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`px-1 py-0.2 rounded text-[8px] font-medium border ${getCategoryColor(habit.category)}`}>
                        {habit.category}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 bg-slate-800/40 border border-slate-700/30 px-1 py-0.2 rounded uppercase">
                        {habit.selectiveDays && habit.selectiveDays.length > 0 
                          ? `Days: ${habit.selectiveDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(',')}`
                          : habit.isActiveOnWeekends === false 
                            ? 'Mon-Fri' 
                            : 'Everyday'}
                      </span>
                      <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1 py-0.2 rounded">
                        +{points.reward} PTS
                      </span>
                      <span className="text-[8px] font-mono text-rose-400 bg-rose-500/5 border border-rose-500/10 px-1 py-0.2 rounded">
                        -{points.penalty} PTS
                      </span>
                      {habit.isBestToDo && (
                        <span className="text-[8px] font-mono text-amber-400 bg-amber-500/5 border border-amber-500/10 px-1 py-0.2 rounded font-bold">
                          BEST TO DO ⭐️
                        </span>
                      )}
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded ${
                        habit.riskLevel === 'High' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20 font-semibold' :
                        habit.riskLevel === 'Low' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold' :
                        'text-slate-400 bg-slate-800/40 border border-slate-700/30'
                      }`}>
                        Risk: {habit.riskLevel || 'Medium'}
                      </span>
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

      {/* Toast Notification Container */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-950 border border-emerald-500/35 p-4 rounded-xl shadow-[0_12px_40px_rgba(16,185,129,0.18)] flex items-center gap-3.5 max-w-sm backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-sans font-bold text-xs text-white uppercase tracking-wider">Asset Deployed!</h5>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                <span className="text-emerald-400 font-bold">"{launchedName}"</span> is active in the Tracker Index.
              </p>
            </div>
            <button 
              onClick={() => setIsSuccess(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
