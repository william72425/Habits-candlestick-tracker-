import { useState, useEffect } from 'react';
import { Habit, Candle, DashboardMetrics } from './types';
import { getMockHabits } from './utils/mockData';
import { getTodayDateString, addDays } from './utils/dateHelpers';
import { calculateDailyCandles, aggregateCandles, calculateMetrics } from './utils/financeEngine';

// Components
import DashboardOverview from './components/DashboardOverview';
import CandlestickChart from './components/CandlestickChart';
import HabitManager from './components/HabitManager';
import SuperLog from './components/SuperLog';

// Icons
import { 
  TrendingUp, 
  LayoutDashboard, 
  Activity, 
  ListTodo, 
  History, 
  HelpCircle,
  Database,
  RefreshCw,
  Flame,
  Info
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'habit_candlestick_tracker_data';

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Habits' | 'Ledger'>('Dashboard');
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [appInitialized, setAppInitialized] = useState(false);

  // 1. Initialize State from LocalStorage or Fallback Mock Data
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHabits(parsed);
          setAppInitialized(true);
          return;
        }
      }
    } catch (e) {
      console.error('Error parsing local storage cached habits:', e);
    }

    // Default to mock data on first load
    setHabits(getMockHabits());
    setAppInitialized(true);
  }, []);

  // 2. Persist State Changes to LocalStorage
  useEffect(() => {
    if (!appInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error('Error saving habits state to local storage:', e);
    }
  }, [habits, appInitialized]);

  // 3. Reset to Initial State (Convenience action for demo)
  const handleResetData = () => {
    if (window.confirm('This will restore the 30-day mock history and overwrite your current completions. Continue?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setHabits(getMockHabits());
    }
  };

  // 4. Calculate Financial Candlestick Data over a fixed 30-day window
  const today = getTodayDateString();
  const startDate = addDays(today, -29); // 30-day window to ensure solid visual density

  // Daily candlesticks (raw performance index timeline)
  const dailyCandles = calculateDailyCandles(habits, startDate, today);

  // Timeframe-aggregated candles for chart display
  const aggregatedCandles = aggregateCandles(dailyCandles, timeframe);

  // Calculate high-level performance metrics
  const metrics = calculateMetrics(habits, dailyCandles);

  // 5. Global Actions
  const handleAddHabit = (name: string, category: any, frequency: any) => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name,
      category,
      frequency,
      createdDate: addDays(today, -1), // Set creation to yesterday so it is immediately active today
      history: {}
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit and all its historical tracking?')) {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleToggleHabit = (id: string, date: string) => {
    setHabits(prev => prev.map((habit) => {
      if (habit.id === id) {
        const currentVal = habit.history[date] === true;
        return {
          ...habit,
          history: {
            ...habit.history,
            [date]: !currentVal
          }
        };
      }
      return habit;
    }));
  };

  // Backtrack deep-link: select date and switch to Habit management tab
  const handleSelectBacktrackDate = (date: string) => {
    setActiveTab('Habits');
    // We let the manager know which date to open by focusing on the same state if we route it
    const element = document.getElementById('habit_manager_panel');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col antialiased">
      
      {/* GLOBAL HUD HEADER / DESK */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
        
        {/* Brand logo & live tracker badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-sans font-extrabold text-sm tracking-widest text-white uppercase">
              HABIT/CANDLE
            </h1>
            <span className="font-mono text-[9px] text-emerald-400 tracking-wider uppercase font-bold">
              Live Index Terminal
            </span>
          </div>
        </div>

        {/* Global tab routing */}
        <nav className="flex items-center bg-slate-900/60 p-1 rounded-lg border border-slate-800/60">
          {[
            { id: 'Dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'Habits', label: 'Assets', icon: ListTodo },
            { id: 'Ledger', label: 'Ledger', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-800 text-white font-black border border-slate-700/60 shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Quick streak capsule */}
          <div className="hidden md:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 font-mono text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{metrics.currentStreak}D STREAK</span>
          </div>

          {/* Reset Mock Data Action */}
          <button
            onClick={handleResetData}
            title="Restore default mock history"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CORE VIEWPORT CARRIER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* TAB VIEW 1: OVERVIEW & CHARTING */}
        {activeTab === 'Dashboard' && (
          <div className="flex flex-col gap-6">
            
            {/* Terminal Notice / Educational Header */}
            <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">How to Trade:</strong> Your habit performance drives the index score. 
                Each completed habit increases the index by <span className="text-emerald-400 font-mono font-bold">+50 PTS</span>, 
                and missed habits drag the market down by <span className="text-rose-400 font-mono font-bold">-50 PTS</span>. 
                Aggregations (Daily, Weekly, Monthly) group daily Close index results to calculate financial Candlesticks (OHLC) representing your consistency swings!
              </div>
            </div>

            {/* Main Stats Desk */}
            <DashboardOverview metrics={metrics} />

            {/* Candlestick Analytics Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-sans font-extrabold text-lg tracking-wider text-white uppercase flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  Consistency Candlestick Chart
                </h2>
                
                {/* Timeframe Toggles */}
                <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/60">
                  {['Daily', 'Weekly', 'Monthly'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf as any)}
                      className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${
                        timeframe === tf 
                          ? 'bg-slate-800 text-white border border-slate-700/60 shadow-md'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive interactive chart */}
              <CandlestickChart candles={aggregatedCandles} timeframe={timeframe} />
            </div>

            {/* Quick check-in shortcut (mini widget) */}
            <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-sans font-bold text-white text-sm">
                  Record Today's Progress ({today})
                </h4>
                <p className="text-slate-400 text-xs">
                  Review and mark habit accomplishments to build positive stock momentum.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('Habits')}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs uppercase tracking-wider font-bold border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
              >
                <span>Open Check-in Terminal</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB VIEW 2: HABIT ASSETS & TRACKING */}
        {activeTab === 'Habits' && (
          <HabitManager 
            habits={habits}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleHabit={handleToggleHabit}
          />
        )}

        {/* TAB VIEW 3: LEDGER DEEP AUDIT */}
        {activeTab === 'Ledger' && (
          <SuperLog 
            habits={habits}
            dailyCandles={dailyCandles}
            onSelectBacktrackDate={handleSelectBacktrackDate}
          />
        )}

      </main>

      {/* FOOTER AUDIT STAMP */}
      <footer className="border-t border-slate-800/50 bg-slate-950/40 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-slate-600" />
          <span>LOCAL PERSISTENCE SECURE / LIVE CANDLESTICK ENGINE ACTIVE</span>
        </div>
        <div>
          <span>LAST UPDATED: {today} | SYSTEM SECURE</span>
        </div>
      </footer>

    </div>
  );
}
