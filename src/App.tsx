import { useState, useEffect } from 'react';
import { Habit, Candle, DashboardMetrics, UserTerminalConfig, PaperTradePosition } from './types';
import { getMockHabits } from './utils/mockData';
import { getTodayDateString, addDays } from './utils/dateHelpers';
import { calculateDailyCandles, aggregateCandles, calculateMetrics, injectIndicators } from './utils/financeEngine';

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
  Info,
  Sliders,
  Wallet,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'habit_candlestick_tracker_data';
const LOCAL_STORAGE_KEY_CONFIG = 'habit_candlestick_tracker_config';

const DEFAULT_TERMINAL_CONFIG: UserTerminalConfig = {
  leverage: 1,
  startCapital: 10000,
  paperTradingBalance: 10000,
  positions: [],
  stopLossPrice: 0,
  takeProfitPrice: 0,
  showIndicators: true,
  smaPeriod: 5,
  emaPeriod: 10,
  themePreset: 'standard',
  ignoreWeekends: false,
  tradingActive: true,
};

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Habits' | 'Ledger'>('Dashboard');
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [config, setConfig] = useState<UserTerminalConfig>(DEFAULT_TERMINAL_CONFIG);
  const [appInitialized, setAppInitialized] = useState(false);

  // 1. Initialize State from LocalStorage or Fallback Mock Data
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHabits(parsed);
        } else {
          setHabits(getMockHabits());
        }
      } else {
        setHabits(getMockHabits());
      }

      const cachedConfig = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
      if (cachedConfig) {
        setConfig(JSON.parse(cachedConfig));
      }
      
      setAppInitialized(true);
    } catch (e) {
      console.error('Error parsing local storage cached habits:', e);
      setHabits(getMockHabits());
      setAppInitialized(true);
    }
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

  // 3. Persist Config Changes to LocalStorage
  useEffect(() => {
    if (!appInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving config to local storage:', e);
    }
  }, [config, appInitialized]);

  // 4. Reset to Initial State (Convenience action for demo)
  const handleResetData = () => {
    if (window.confirm('This will restore the 30-day mock history, clear trades, and reset custom weights. Continue?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_KEY_CONFIG);
      setHabits(getMockHabits());
      setConfig(DEFAULT_TERMINAL_CONFIG);
    }
  };

  // 5. Calculate Financial Candlestick Data over a fixed 30-day window
  const today = getTodayDateString();
  const startDate = addDays(today, -29); // 30-day window to ensure solid visual density

  // Daily candlesticks (raw performance index timeline)
  const dailyCandles = calculateDailyCandles(habits, startDate, today, {
    leverage: config.leverage,
    ignoreWeekends: config.ignoreWeekends
  });

  // Timeframe-aggregated candles for chart display
  const aggregatedCandles = aggregateCandles(dailyCandles, timeframe);

  // Inject technical indicator overlays
  injectIndicators(aggregatedCandles, config.smaPeriod, config.emaPeriod);

  // Calculate high-level performance metrics
  const metrics = calculateMetrics(habits, dailyCandles);

  // Current index Close price
  const currentIndexPrice = dailyCandles.length > 0 ? dailyCandles[dailyCandles.length - 1].close : 1000;

  // Paper Trading Position Math
  const activePosition = config.positions[0] || null;
  const unrealizedPnL = activePosition 
    ? activePosition.type === 'BUY'
      ? activePosition.shares * (currentIndexPrice - activePosition.entryPrice) * activePosition.leverage
      : activePosition.shares * (activePosition.entryPrice - currentIndexPrice) * activePosition.leverage
    : 0;

  const netLiquidity = config.paperTradingBalance + unrealizedPnL;
  const portfolioPnL = netLiquidity - config.startCapital;

  // Enrich metrics with portfolio profit & loss
  const enrichedMetrics: DashboardMetrics = {
    ...metrics,
    totalProfitLoss: portfolioPnL
  };

  // 6. Global Actions
  const handleAddHabit = (
    name: string,
    category: any,
    frequency: any,
    weight: number,
    penalty: number,
    riskLevel: 'Low' | 'Medium' | 'High',
    isActiveOnWeekends: boolean
  ) => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name,
      category,
      frequency,
      createdDate: addDays(today, -1), // Set creation to yesterday so it is immediately active today
      history: {},
      weight,
      penalty,
      riskLevel,
      isActiveOnWeekends
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
    const element = document.getElementById('habit_manager_panel');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 7. Paper Trading Actions
  const handleOpenTrade = (type: 'BUY' | 'SELL', capitalToInvest: number) => {
    if (config.positions.length > 0) {
      alert('You already have an active trade. Close your current position to open a new one.');
      return;
    }
    if (capitalToInvest > config.paperTradingBalance) {
      alert('Insufficient liquid cash balance.');
      return;
    }

    const shares = capitalToInvest / currentIndexPrice;
    const newPosition: PaperTradePosition = {
      id: `pos_${Date.now()}`,
      date: today,
      type,
      entryPrice: currentIndexPrice,
      shares,
      leverage: config.leverage,
    };

    setConfig(prev => ({
      ...prev,
      paperTradingBalance: prev.paperTradingBalance - capitalToInvest,
      positions: [newPosition],
    }));
  };

  const handleCloseTrade = () => {
    if (!activePosition) return;

    // Credit back investment amount + final PnL outcome
    const originalCapital = activePosition.shares * activePosition.entryPrice;
    const returnedCapital = originalCapital + unrealizedPnL;

    setConfig(prev => ({
      ...prev,
      paperTradingBalance: prev.paperTradingBalance + returnedCapital,
      positions: [],
    }));
  };

  const handleResetTradeAccount = () => {
    if (window.confirm('Reset your paper trading balance to $10,000 and close active positions?')) {
      setConfig(prev => ({
        ...prev,
        paperTradingBalance: 10000,
        startCapital: 10000,
        positions: [],
      }));
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
            <DashboardOverview metrics={enrichedMetrics} />

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
              <CandlestickChart candles={aggregatedCandles} timeframe={timeframe} config={config} />
            </div>

            {/* Dual Panel: Settings / Customization & Paper Trading Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PANEL 1: CONFIGURATION & TECHNICAL INDICATORS PANEL */}
              <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <h3 className="font-sans font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    Terminal Controls & Overlays
                  </h3>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">SYSTEM PRESETS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Theme Presets */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold">Candle Theme Aesthetic</label>
                    <select
                      value={config.themePreset}
                      onChange={(e) => setConfig(prev => ({ ...prev, themePreset: e.target.value as any }))}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-slate-700 cursor-pointer"
                    >
                      <option value="standard">Emerald & Rose (Standard)</option>
                      <option value="cyber">Cyan & Magenta (Cyberpunk)</option>
                      <option value="amber">Pink & Orange (Amber)</option>
                      <option value="gold">Gold & Purple (Golden Gate)</option>
                    </select>
                  </div>

                  {/* Leverage multiplier */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                      Trading Leverage
                      <span className="text-[10px] text-amber-400 font-mono font-bold">({config.leverage}x)</span>
                    </label>
                    <select
                      value={config.leverage}
                      onChange={(e) => setConfig(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-slate-700 cursor-pointer"
                    >
                      <option value="1">1x (Conservative)</option>
                      <option value="2">2x (Moderate)</option>
                      <option value="5">5x (Aggressive)</option>
                      <option value="10">10x (High Risk)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-800/40 pt-4 flex flex-col gap-3">
                  {/* Indicators Visibility */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-slate-200 text-xs font-semibold">Technical Indicators Overlay</span>
                      <span className="text-[9px] text-slate-500">Enable/Disable moving average lines on chart</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, showIndicators: !prev.showIndicators }))}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                        config.showIndicators ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform duration-200 ${
                        config.showIndicators ? 'translate-x-4' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>

                  {config.showIndicators && (
                    <div className="grid grid-cols-2 gap-4 mt-1 bg-slate-900/30 p-3 rounded-lg border border-slate-900/50">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-medium">SMA Period</span>
                          <span className="text-blue-400 font-mono font-bold">{config.smaPeriod}D</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="20"
                          value={config.smaPeriod}
                          onChange={(e) => setConfig(prev => ({ ...prev, smaPeriod: parseInt(e.target.value) }))}
                          className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-medium">EMA Period</span>
                          <span className="text-amber-400 font-mono font-bold">{config.emaPeriod}D</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="20"
                          value={config.emaPeriod}
                          onChange={(e) => setConfig(prev => ({ ...prev, emaPeriod: parseInt(e.target.value) }))}
                          className="w-full accent-amber-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-800/40 pt-3">
                    <div className="flex flex-col">
                      <span className="text-slate-200 text-xs font-semibold">Weekend Trading Penalty Exclusion</span>
                      <span className="text-[9px] text-slate-500">Exclude Saturdays/Sundays from uncompleted misses</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, ignoreWeekends: !prev.ignoreWeekends }))}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                        config.ignoreWeekends ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform duration-200 ${
                        config.ignoreWeekends ? 'translate-x-4' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* PANEL 2: INSTITUTIONAL PAPER TRADING TERMINAL */}
              <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <h3 className="font-sans font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Interactive Paper Trading Desk
                  </h3>
                  <button 
                    onClick={handleResetTradeAccount}
                    className="text-[9px] font-mono text-slate-400 hover:text-rose-400 uppercase flex items-center gap-1 border border-slate-800 px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Account
                  </button>
                </div>

                {/* Account Liquid Balance details */}
                <div className="grid grid-cols-3 gap-3 bg-slate-900/30 p-3.5 rounded-xl border border-slate-900/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-mono">PORTFOLIO VALUE</span>
                    <span className={`text-sm font-mono font-black ${portfolioPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${netLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-mono">LIQUID BALANCE</span>
                    <span className="text-slate-200 text-sm font-mono font-bold">
                      ${config.paperTradingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-mono">UNREALIZED P&L</span>
                    <span className={`text-sm font-mono font-extrabold flex items-center gap-0.5 ${
                      unrealizedPnL > 0 ? 'text-emerald-400' : unrealizedPnL < 0 ? 'text-rose-400' : 'text-slate-500'
                    }`}>
                      {unrealizedPnL > 0 ? '+' : ''}
                      ${unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Active Trading Operations */}
                {activePosition ? (
                  <div className="flex-1 flex flex-col justify-between border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute right-3 top-3 opacity-10">
                      <Play className="w-16 h-16 text-emerald-400 stroke-2" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          activePosition.type === 'BUY' ? 'bg-emerald-500/25 text-emerald-300' : 'bg-rose-500/25 text-rose-300'
                        }`}>
                          {activePosition.type === 'BUY' ? 'LONG' : 'SHORT'} ACTIVE
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Leverage: {activePosition.leverage}x</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">Entry Price</span>
                          <span className="font-mono text-slate-200 font-semibold">{activePosition.entryPrice.toFixed(0)} PTS</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">Current Index</span>
                          <span className="font-mono text-slate-200 font-semibold">{currentIndexPrice.toFixed(0)} PTS</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">Simulated Shares</span>
                          <span className="font-mono text-slate-300">{activePosition.shares.toFixed(4)} Units</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">Total Return</span>
                          <span className={`font-mono font-bold ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {((unrealizedPnL / (activePosition.shares * activePosition.entryPrice)) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseTrade}
                      className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2 rounded-lg text-xs mt-4 transition-all hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] cursor-pointer"
                    >
                      Close Active Position & Realize Profits/Losses
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center gap-4 py-2">
                    <p className="text-slate-400 text-xs text-center leading-relaxed">
                      Trade simulated capital against the live index score of your habits! Open a **LONG** if you believe your habits will improve, or a **SHORT** to protect against future missed habits.
                    </p>

                    <div className="flex flex-col gap-3.5 bg-slate-900/20 border border-slate-800/80 p-3 rounded-xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Investment Margin Allocation</span>
                        <span className="text-slate-200 font-mono font-bold">$5,000.00</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenTrade('BUY', 5000)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Go Long (BUY)
                        </button>
                        <button
                          onClick={() => handleOpenTrade('SELL', 5000)}
                          className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                        >
                          <XCircle className="w-4 h-4" /> Go Short (SELL)
                        </button>
                      </div>
                      <span className="text-[9px] text-slate-500 text-center block">
                        Trades open at the current index of <strong className="text-slate-400 font-mono">{currentIndexPrice.toFixed(0)} PTS</strong> with active {config.leverage}x leverage.
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
