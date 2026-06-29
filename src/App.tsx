import { useState, useEffect } from 'react';
import { Habit, Candle, DashboardMetrics, UserTerminalConfig, PaperTradePosition } from './types';
import { getMockHabits } from './utils/mockData';
import { getTodayDateString, addDays, getDatesInRange, getAdjustedTodayDateString, formatDateLabel } from './utils/dateHelpers';
import { calculateDailyCandles, aggregateCandles, calculateMetrics, injectIndicators, getHabitPoints, getTierInfo, getWeeklyConsistency, getNextTierThreshold, auditPromotionState } from './utils/financeEngine';
import { APP_LOCALIZATION } from './utils/localization';

// Firebase Integrations
import { auth, signOut, onAuthStateChanged, User, saveUserData, loadUserData, getRedirectResult } from './utils/firebase';

// Components
import DashboardOverview from './components/DashboardOverview';
import CandlestickChart from './components/CandlestickChart';
import HabitManager from './components/HabitManager';
import SuperLog from './components/SuperLog';
import RewardsHub from './components/RewardsHub';
import IntroPage from './components/IntroPage';
import ReportHub from './components/ReportHub';
import AuthPage from './components/AuthPage';

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
  AlertTriangle,
  Award,
  Clock,
  Settings,
  FileText
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
  totalPoints: 1000,
  predictions: [],
  pointsHistory: [
    {
      id: 'init',
      date: getTodayDateString(),
      type: 'INITIAL',
      points: 1000,
      description: 'Initial reward for activating Index Portfolio account',
    }
  ],
  timezone: 'MMT',
  timezoneOffset: 6.5,
  nightOwlOffset: 0,
  consecutiveAfkCount: 0,
  afkHistory: [],
};



export default function App() {
  const [lang, setLang] = useState<'en' | 'my'>(() => {
    return (localStorage.getItem('terminal_lang') as 'en' | 'my') || 'my';
  });

  const handleSetLang = (newLang: 'en' | 'my') => {
    setLang(newLang);
    localStorage.setItem('terminal_lang', newLang);
  };

  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Habits' | 'Rewards' | 'Ledger' | 'Report' | 'Settings'>('Dashboard');
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [config, setConfig] = useState<UserTerminalConfig>(DEFAULT_TERMINAL_CONFIG);
  const [appInitialized, setAppInitialized] = useState(false);

  // Authentication State Variables
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [checkingRedirect, setCheckingRedirect] = useState<boolean>(() => {
    try {
      const isIframe = window.self !== window.top;
      return !isIframe;
    } catch (e) {
      return true;
    }
  });
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);

  // Call getRedirectResult at the root level so that Vercel redirects are always resolved
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (err) {
        console.error("Root level getRedirectResult error:", err);
      } finally {
        setCheckingRedirect(false);
      }
    };
    
    let isIframe = false;
    try {
      isIframe = window.self !== window.top;
    } catch (e) {
      isIframe = true;
    }

    if (!isIframe) {
      handleRedirect();
    } else {
      setCheckingRedirect(false);
    }
  }, []);

  // Future Betting States
  const [betWager, setBetWager] = useState<number>(100);
  const [betTemplateId, setBetTemplateId] = useState<'low' | 'med' | 'high'>('med');
  const [betLeverage, setBetLeverage] = useState<number>(1);

  // Tour/Intro Overlay State
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const [showPromoTermsModal, setShowPromoTermsModal] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState<boolean>(false);

  // Sync /intropage subroute dynamically
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, "");
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const isIntro = path === '/intropage' || hash === '#/intropage' || params.get('page') === 'intropage' || params.get('route') === 'intropage';
      
      if (isIntro) {
        setShowIntroOverlay(true);
      }
    };
    
    checkPath();
    
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  // 1. Unified Firebase Authentication & Data Synchronization Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        setIsGuestMode(false);
        try {
          // Fetch cloud user document with a 3.5s timeout fallback to avoid long loading screen hangs
          const result = await Promise.race([
            loadUserData(user.uid).then(data => ({ data, isTimeout: false })),
            new Promise<{ data: null; isTimeout: boolean }>((resolve) => 
              setTimeout(() => resolve({ data: null, isTimeout: true }), 3500)
            )
          ]);

          if (result.data) {
            // Document exists - load from cloud
            const cloudData = result.data;
            if (Array.isArray(cloudData.habits)) {
              setHabits(cloudData.habits);
            } else {
              setHabits(getMockHabits());
            }
            if (cloudData.config) {
              setConfig({
                ...DEFAULT_TERMINAL_CONFIG,
                ...cloudData.config,
                predictions: cloudData.config.predictions ?? DEFAULT_TERMINAL_CONFIG.predictions,
                pointsHistory: cloudData.config.pointsHistory ?? DEFAULT_TERMINAL_CONFIG.pointsHistory,
                totalPoints: cloudData.config.totalPoints ?? DEFAULT_TERMINAL_CONFIG.totalPoints,
                timezone: cloudData.config.timezone ?? DEFAULT_TERMINAL_CONFIG.timezone,
                timezoneOffset: cloudData.config.timezoneOffset ?? DEFAULT_TERMINAL_CONFIG.timezoneOffset,
                nightOwlOffset: cloudData.config.nightOwlOffset ?? DEFAULT_TERMINAL_CONFIG.nightOwlOffset,
                lastActiveDate: cloudData.config.lastActiveDate ?? DEFAULT_TERMINAL_CONFIG.lastActiveDate,
                consecutiveAfkCount: cloudData.config.consecutiveAfkCount ?? DEFAULT_TERMINAL_CONFIG.consecutiveAfkCount,
                afkHistory: cloudData.config.afkHistory ?? DEFAULT_TERMINAL_CONFIG.afkHistory,
              });
            } else {
              setConfig(DEFAULT_TERMINAL_CONFIG);
            }
          } else {
            // New Firebase user - inherit current local storage progress or fallback to defaults
            const cachedHabits = localStorage.getItem(LOCAL_STORAGE_KEY);
            const cachedConfig = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
            
            const initialHabits = cachedHabits ? JSON.parse(cachedHabits) : getMockHabits();
            let initialConfig = DEFAULT_TERMINAL_CONFIG;
            if (cachedConfig) {
              try {
                const parsed = JSON.parse(cachedConfig);
                initialConfig = {
                  ...DEFAULT_TERMINAL_CONFIG,
                  ...parsed,
                };
              } catch (e) {
                console.error("Error parsing cached config on initial signup:", e);
              }
            }

            setHabits(initialHabits);
            setConfig(initialConfig);
            
            // Only back up/save to the cloud if this was a legitimate new user signup (no document found),
            // and NOT a slow network timeout fallback, protecting existing cloud data from getting overwritten!
            if (!result.isTimeout) {
              await saveUserData(user.uid, initialHabits, initialConfig);
            }
          }
        } catch (err) {
          console.error("Error fetching or initializing user document from Firestore:", err);
          setHabits(getMockHabits());
          setConfig(DEFAULT_TERMINAL_CONFIG);
        }
        setAppInitialized(true);
      } else {
        setCurrentUser(null);
        // Check if guest mode was manually flagged
        const guestFlag = localStorage.getItem('guest_mode_active') === 'true';
        setIsGuestMode(guestFlag);

        // Fallback load from localStorage
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
            const parsed = JSON.parse(cachedConfig);
            setConfig({
              ...DEFAULT_TERMINAL_CONFIG,
              ...parsed,
            });
          } else {
            setConfig(DEFAULT_TERMINAL_CONFIG);
          }
        } catch (e) {
          console.error("Error loading offline local storage:", e);
          setHabits(getMockHabits());
          setConfig(DEFAULT_TERMINAL_CONFIG);
        }
        setAppInitialized(true);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Persist State Changes to LocalStorage and Firebase Firestore
  useEffect(() => {
    if (!appInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(habits));
      if (currentUser) {
        saveUserData(currentUser.uid, habits, config);
      }
    } catch (e) {
      console.error('Error saving habits state:', e);
    }
  }, [habits, appInitialized, currentUser]);

  // 3. Persist Config Changes to LocalStorage and Firebase Firestore
  useEffect(() => {
    if (!appInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
      if (currentUser) {
        saveUserData(currentUser.uid, habits, config);
      }
    } catch (e) {
      console.error('Error saving config state:', e);
    }
  }, [config, appInitialized, currentUser]);

  const [unmarkedDayToReconcile, setUnmarkedDayToReconcile] = useState<string | null>(null);
  const [afkCheckedHabits, setAfkCheckedHabits] = useState<Record<string, boolean>>({});

  const getUnmarkedDates = (currentHabits: Habit[], startDateStr: string, endDateStr: string): string[] => {
    const dates = getDatesInRange(startDateStr, endDateStr);
    return dates.filter(date => {
      const activeHabits = currentHabits.filter(h => h.createdDate <= date && (!h.archived || !h.archivedDate || h.archivedDate > date));
      if (activeHabits.length === 0) return false;
      return activeHabits.every(h => h.history[date] === undefined);
    });
  };

  const getFirstUnmarkedDay = (currentHabits: Habit[], lastDate: string, currentDate: string) => {
    if (!lastDate || lastDate >= currentDate) return null;
    const startCheck = addDays(lastDate, 1);
    const endCheck = addDays(currentDate, -1);
    if (startCheck > endCheck) return null;
    
    const unmarked = getUnmarkedDates(currentHabits, startCheck, endCheck);
    return unmarked.length > 0 ? unmarked[0] : null;
  };

  // 4. Trigger AFK check on mount and timezone changes
  useEffect(() => {
    if (!appInitialized) return;
    
    const tzOffset = config.timezoneOffset ?? 6.5;
    const noOffset = config.nightOwlOffset ?? 0;
    const currentToday = getAdjustedTodayDateString(tzOffset, noOffset);
    
    if (!config.lastActiveDate) {
      setConfig(prev => ({
        ...prev,
        lastActiveDate: currentToday
      }));
      return;
    }
    
    if (currentToday > config.lastActiveDate) {
      const nextUnmarked = getFirstUnmarkedDay(habits, config.lastActiveDate, currentToday);
      if (nextUnmarked) {
        setUnmarkedDayToReconcile(nextUnmarked);
        const activeHabits = habits.filter(h => h.createdDate <= nextUnmarked && (!h.archived || !h.archivedDate || h.archivedDate > nextUnmarked));
        const initialChecklist: Record<string, boolean> = {};
        activeHabits.forEach(h => {
          initialChecklist[h.id] = false;
        });
        setAfkCheckedHabits(initialChecklist);
      } else {
        setConfig(prev => ({
          ...prev,
          lastActiveDate: currentToday
        }));
      }
    }
  }, [appInitialized, habits, config.lastActiveDate, config.timezoneOffset, config.nightOwlOffset]);

  // 4. Reset to Initial State (Convenience action for demo)
  const handleResetData = () => {
    if (window.confirm('This will restore the 30-day mock history, clear trades, and reset custom weights. Continue?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_KEY_CONFIG);
      setHabits(getMockHabits());
      setConfig(DEFAULT_TERMINAL_CONFIG);
    }
  };

  // Sign Out Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('guest_mode_active');
      setIsGuestMode(false);
      setCurrentUser(null);
      // Reset state to force the landing page cleanly
      setHabits(getMockHabits());
      setConfig(DEFAULT_TERMINAL_CONFIG);
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  // 5. Calculate Financial Candlestick Data over a fixed 30-day window
  const tzOffset = config.timezoneOffset ?? 6.5;
  const noOffset = config.nightOwlOffset ?? 0;
  const today = getAdjustedTodayDateString(tzOffset, noOffset);

  // Promotion Audit Effect
  useEffect(() => {
    if (!appInitialized) return;
    const audited = auditPromotionState(today, config, habits);
    if (JSON.stringify(audited.nextConfig) !== JSON.stringify(config)) {
      setConfig(audited.nextConfig);
    }
  }, [today, habits, appInitialized, config.promotion]);

  const handleActivatePromotion = () => {
    const promo = config.promotion;
    if (!promo || promo.status !== 'ELIGIBLE') return;

    const activationDate = today;
    const startDate = addDays(activationDate, 1);
    const endDate = addDays(startDate, 2);

    setConfig(prev => ({
      ...prev,
      promotion: {
        ...prev.promotion!,
        status: 'SCHEDULED',
        activationDate,
        startDate,
        endDate,
        dailyPerformance: {}
      },
      pointsHistory: [
        {
          id: `promo_act_${Date.now()}`,
          date: today,
          type: 'BONUS_REWARD' as const,
          description: `⚡ Activated Promotion Trials to ${promo.targetTier}! The 3-day challenge starts tomorrow (${startDate}). Get ready!`,
          points: 0
        },
        ...(prev.pointsHistory || [])
      ]
    }));
  };

  const handleAcknowledgePromotionResult = () => {
    setConfig(prev => ({
      ...prev,
      promotion: {
        status: 'NONE',
        targetTier: '',
        targetPoints: 0,
        dailyPerformance: {}
      }
    }));
  };

  const startDate = addDays(today, -29); // 30-day window to ensure solid visual density

  // Daily candlesticks (raw performance index timeline)
  const dailyCandles = calculateDailyCandles(habits, startDate, today, {
    leverage: config.leverage,
    ignoreWeekends: config.ignoreWeekends,
    totalPoints: config.totalPoints
  });

  // Timeframe-aggregated candles for chart display
  const aggregatedCandles = aggregateCandles(dailyCandles, timeframe);

  // Inject technical indicator overlays
  injectIndicators(aggregatedCandles, config.smaPeriod, config.emaPeriod);

  // Calculate high-level performance metrics
  const metrics = calculateMetrics(habits, dailyCandles);

  // Current index Close price
  const currentIndexPrice = dailyCandles.length > 0 ? dailyCandles[dailyCandles.length - 1].close : 1000;

  // Automatically resolve pending predictions
  useEffect(() => {
    if (!appInitialized || !config.predictions || config.predictions.length === 0) return;

    let pointsAwarded = 0;
    const resolvedHistory: any[] = [];
    const updatedPredictions = config.predictions.map(pred => {
      if (pred.status !== 'PENDING') return pred;

      // Check if we have passed or reached the target date
      if (today >= pred.targetDate) {
        // Find close price on the target date
        const candleAtDate = dailyCandles.find(c => c.timeLabel === pred.targetDate);
        const finalPrice = candleAtDate ? candleAtDate.close : currentIndexPrice;
        const targetGoal = pred.entryIndexPrice * (1 + pred.growthRequired / 100);
        
        const didWin = finalPrice >= targetGoal;
        if (didWin) {
          pointsAwarded += pred.payoutPoints;
          resolvedHistory.push({
            id: `pred_win_${pred.id}`,
            date: today,
            type: 'PREDICTION_WIN',
            description: `Prediction WIN! Index reached ${finalPrice.toFixed(0)} PTS (Goal: ${targetGoal.toFixed(0)} PTS). Reward +${pred.payoutPoints} pts!`,
            points: pred.payoutPoints
          });
          return {
            ...pred,
            targetIndexPrice: finalPrice,
            status: 'WON' as const
          };
        } else {
          resolvedHistory.push({
            id: `pred_lose_${pred.id}`,
            date: today,
            type: 'HABIT_MISS', // fall back to generic miss
            description: `Prediction lost. Index finished at ${finalPrice.toFixed(0)} PTS (Needed: ${targetGoal.toFixed(0)} PTS). Wager lost.`,
            points: 0
          });
          return {
            ...pred,
            targetIndexPrice: finalPrice,
            status: 'LOST' as const
          };
        }
      }
      return pred;
    });

    // Check if any predictions were actually resolved
    const wasUpdated = updatedPredictions.some((pred, i) => pred.status !== config.predictions[i].status);
    if (wasUpdated) {
      setConfig(prev => {
        const promo = prev.promotion || { status: 'NONE' as const, targetTier: '', targetPoints: 0, dailyPerformance: {} };
        let finalPoints = prev.totalPoints;
        let newPromoState = { ...promo };

        if (pointsAwarded > 0) {
          if (promo.status === 'ELIGIBLE' || promo.status === 'SCHEDULED' || promo.status === 'ACTIVE') {
            finalPoints = Math.min(prev.totalPoints, promo.targetPoints - 1);
          } else {
            const nextThreshold = getNextTierThreshold(prev.totalPoints);
            if (nextThreshold && (prev.totalPoints + pointsAwarded) >= nextThreshold.points) {
              finalPoints = nextThreshold.points - 1;
              newPromoState = {
                status: 'ELIGIBLE' as const,
                targetTier: nextThreshold.name,
                targetPoints: nextThreshold.points,
                dailyPerformance: {}
              };
            } else {
              finalPoints = prev.totalPoints + pointsAwarded;
            }
          }
        }

        return {
          ...prev,
          totalPoints: finalPoints,
          promotion: newPromoState,
          predictions: updatedPredictions,
          pointsHistory: [...resolvedHistory, ...prev.pointsHistory]
        };
      });
    }
  }, [dailyCandles, today, appInitialized, config.predictions]);

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
    difficulty: 'Easy' | 'Medium' | 'Hard',
    importance: 'Low' | 'Medium' | 'High',
    isBestToDo: boolean,
    weight: number | undefined,
    penalty: number | undefined,
    riskLevel: 'Low' | 'Medium' | 'High',
    isActiveOnWeekends: boolean,
    selectiveDays: number[] | undefined
  ) => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name,
      category,
      frequency,
      createdDate: today, // Start exactly from today
      history: {},
      difficulty,
      importance,
      isBestToDo,
      weight,
      penalty,
      riskLevel,
      isActiveOnWeekends,
      selectiveDays
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Are you sure you want to archive this habit? Past completion history will be kept, but it will no longer show up on future daily checklists.')) {
      setHabits(prev => prev.map(h => {
        if (h.id === id) {
          return {
            ...h,
            archived: true,
            archivedDate: today
          };
        }
        return h;
      }));
    }
  };

  const handleToggleHabit = (id: string, date: string) => {
    setHabits(prev => {
      // 7-day retrospective completion rate (KD Style)
      const weeklyConsistency = getWeeklyConsistency(prev, date);

      return prev.map((habit) => {
        if (habit.id === id) {
          const currentVal = habit.history[date] === true;
          const nextVal = !currentVal;
          
          // Dynamic points calculation
          const points = getHabitPoints(habit);
          const isCreatedToday = habit.createdDate === date;
          const basePointsToAward = isCreatedToday ? Math.round(points.reward * 0.5) : points.reward;

          if (nextVal) {
            // Apply 1.2x multiplier for >= 90% consistency
            const isBonusStreak = weeklyConsistency >= 90;
            const multiplier = isBonusStreak ? 1.2 : 1.0;
            const pointsToAward = Math.round(basePointsToAward * multiplier);

            const promo = config.promotion || { status: 'NONE' as const, targetTier: '', targetPoints: 0, dailyPerformance: {} };
            let finalPointsToAward = pointsToAward;
            let showCappedMessage = false;
            let showThresholdTrigger = false;
            let newPromoState = { ...promo };

            if (promo.status === 'ELIGIBLE' || promo.status === 'SCHEDULED' || promo.status === 'ACTIVE') {
              finalPointsToAward = 0;
              showCappedMessage = true;
            } else {
              const nextThreshold = getNextTierThreshold(config.totalPoints);
              if (nextThreshold && (config.totalPoints + pointsToAward) >= nextThreshold.points) {
                finalPointsToAward = nextThreshold.points - 1 - config.totalPoints;
                showThresholdTrigger = true;
                newPromoState = {
                  status: 'ELIGIBLE' as const,
                  targetTier: nextThreshold.name,
                  targetPoints: nextThreshold.points,
                  dailyPerformance: {}
                };
              }
            }

            let rewardDescription = `Completed: ${habit.name} (+${finalPointsToAward} pts)`;
            if (isBonusStreak) {
              rewardDescription += ` [1.2x Consistency Bonus streak]`;
            }
            if (isCreatedToday) {
              rewardDescription += ` [50% New-Habit Warm-Up]`;
            }
            if (showCappedMessage) {
              rewardDescription = `Completed: ${habit.name} (+0 pts) [Points Locked - Promotion Trials Pending]`;
            } else if (showThresholdTrigger) {
              rewardDescription = `Completed: ${habit.name} (+${finalPointsToAward} pts) - Reached ${newPromoState.targetTier} Threshold! Activate Promotion Trials to level up!`;
            }

            setConfig(prevConfig => ({
              ...prevConfig,
              totalPoints: prevConfig.totalPoints + finalPointsToAward,
              promotion: newPromoState,
              pointsHistory: [
                {
                  id: `earn_${Date.now()}_${habit.id}`,
                  date: date,
                  type: 'HABIT_COMPLETE',
                  description: rewardDescription,
                  points: finalPointsToAward
                },
                ...(prevConfig.pointsHistory || [])
              ]
            }));
          } else {
            // Unchecking a habit
            const matchedHistoryItem = (config.pointsHistory || [])
              .find(item => item.date === date && item.id.includes(`_${habit.id}`));
            
            // Apply 1.5x penalty if on loss streak (<50% consistency)
            const isLossStreak = weeklyConsistency < 50;
            const penaltyMultiplier = isLossStreak ? 1.5 : 1.0;
            
            let pointsToDeduct = matchedHistoryItem ? matchedHistoryItem.points : basePointsToAward;
            if (isLossStreak) {
              pointsToDeduct = Math.round(pointsToDeduct * penaltyMultiplier);
            }

            const proposedPoints = Math.max(0, config.totalPoints - pointsToDeduct);
            const promo = config.promotion || { status: 'NONE' as const, targetTier: '', targetPoints: 0, dailyPerformance: {} };
            let newPromoState = { ...promo };

            if (promo.status === 'ELIGIBLE' && proposedPoints < (promo.targetPoints - 1)) {
              newPromoState = {
                status: 'NONE' as const,
                targetTier: '',
                targetPoints: 0,
                dailyPerformance: {}
              };
            }

            let description = `Unmarked: ${habit.name} (-${pointsToDeduct} pts)`;
            if (isLossStreak) {
              description += ` [1.5x Loss-Streak Penalty applied]`;
            }

            setConfig(prevConfig => ({
              ...prevConfig,
              totalPoints: proposedPoints,
              promotion: newPromoState,
              pointsHistory: [
                {
                  id: `uncheck_${Date.now()}_${habit.id}`,
                  date: date,
                  type: 'HABIT_MISS',
                  description,
                  points: -pointsToDeduct
                },
                ...(prevConfig.pointsHistory || [])
              ]
            }));
          }

          return {
            ...habit,
            history: {
              ...habit.history,
              [date]: nextVal
            }
          };
        }
        return habit;
      });
    });
  };

  const handleReconcileAFK = (isChecked: boolean) => {
    if (!unmarkedDayToReconcile) return;
    
    const targetDate = unmarkedDayToReconcile;
    const activeHabits = habits.filter(h => h.createdDate <= targetDate && (!h.archived || !h.archivedDate || h.archivedDate > targetDate));

    if (isChecked) {
      // 1. AFK Choice - retrospective log
      const currentConsecutive = config.consecutiveAfkCount ?? 0;
      const nextConsecutive = currentConsecutive + 1;
      
      // Calculate flat points penalty
      const flatPenalty = Math.min(200, nextConsecutive * 50);
      
      // Calculate reward multiplier
      const multiplier = Math.max(0.5, 1 - (nextConsecutive * 0.15));
      
      let totalEarnedPoints = 0;
      const newPointsHistory: any[] = [];
      
      // Update habit history
      const updatedHabits = habits.map(habit => {
        const isActive = habit.createdDate <= targetDate && (!habit.archived || !habit.archivedDate || habit.archivedDate > targetDate);
        if (isActive) {
          const completed = afkCheckedHabits[habit.id] === true;
          
          if (completed) {
            const points = getHabitPoints(habit);
            const rawReward = habit.createdDate === targetDate ? Math.round(points.reward * 0.5) : points.reward;
            const pointsAwarded = Math.round(rawReward * multiplier);
            totalEarnedPoints += pointsAwarded;
            
            newPointsHistory.push({
              id: `earn_afk_${Date.now()}_${habit.id}`,
              date: targetDate,
              type: 'HABIT_COMPLETE' as const,
              description: `Completed (AFK Retroactive): ${habit.name} (+${pointsAwarded} pts - ${Math.round(multiplier * 100)}% reward applied)`,
              points: pointsAwarded
            });
          }
          
          return {
            ...habit,
            history: {
              ...habit.history,
              [targetDate]: completed
            }
          };
        }
        return habit;
      });
      
      setHabits(updatedHabits);
      
      // Add flat penalty history
      newPointsHistory.push({
        id: `afk_penalty_${Date.now()}`,
        date: targetDate,
        type: 'HABIT_MISS' as const,
        description: `AFK Penalty (Day ${targetDate}) - Consecutive AFK #${nextConsecutive} (-${flatPenalty} pts)`,
        points: -flatPenalty
      });
      
      const netImpact = totalEarnedPoints - flatPenalty;
      const promo = config.promotion || { status: 'NONE' as const, targetTier: '', targetPoints: 0, dailyPerformance: {} };
      let finalTotalPoints = config.totalPoints;
      let newPromoState = { ...promo };

      if (netImpact > 0) {
        if (promo.status === 'ELIGIBLE' || promo.status === 'SCHEDULED' || promo.status === 'ACTIVE') {
          finalTotalPoints = Math.min(config.totalPoints, promo.targetPoints - 1);
        } else {
          const nextThreshold = getNextTierThreshold(config.totalPoints);
          if (nextThreshold && (config.totalPoints + netImpact) >= nextThreshold.points) {
            finalTotalPoints = nextThreshold.points - 1;
            newPromoState = {
              status: 'ELIGIBLE' as const,
              targetTier: nextThreshold.name,
              targetPoints: nextThreshold.points,
              dailyPerformance: {}
            };
          } else {
            finalTotalPoints = config.totalPoints + netImpact;
          }
        }
      } else if (netImpact < 0) {
        finalTotalPoints = Math.max(0, config.totalPoints + netImpact);
        if (promo.status === 'ELIGIBLE' && finalTotalPoints < (promo.targetPoints - 1)) {
          newPromoState = {
            status: 'NONE' as const,
            targetTier: '',
            targetPoints: 0,
            dailyPerformance: {}
          };
        }
      }

      // Update config
      const nextUnmarked = getFirstUnmarkedDay(updatedHabits, targetDate, getAdjustedTodayDateString(config.timezoneOffset ?? 6.5, config.nightOwlOffset ?? 0));
      
      setConfig(prev => ({
        ...prev,
        totalPoints: finalTotalPoints,
        promotion: newPromoState,
        pointsHistory: [...newPointsHistory, ...(prev.pointsHistory || [])],
        consecutiveAfkCount: nextConsecutive,
        afkHistory: [...(prev.afkHistory || []), targetDate],
        lastActiveDate: nextUnmarked ? prev.lastActiveDate : getAdjustedTodayDateString(prev.timezoneOffset ?? 6.5, prev.nightOwlOffset ?? 0)
      }));
      
      setUnmarkedDayToReconcile(nextUnmarked);
      if (nextUnmarked) {
        // Init next checklist
        const nextActive = updatedHabits.filter(h => h.createdDate <= nextUnmarked && (!h.archived || !h.archivedDate || h.archivedDate > nextUnmarked));
        const initialChecklist: Record<string, boolean> = {};
        nextActive.forEach(h => {
          initialChecklist[h.id] = false;
        });
        setAfkCheckedHabits(initialChecklist);
      }
    } else {
      // 2. Just didn't do anything - mark all as false and lock
      const updatedHabits = habits.map(habit => {
        const isActive = habit.createdDate <= targetDate && (!habit.archived || !habit.archivedDate || habit.archivedDate > targetDate);
        if (isActive) {
          return {
            ...habit,
            history: {
              ...habit.history,
              [targetDate]: false
            }
          };
        }
        return habit;
      });
      
      setHabits(updatedHabits);
      
      const nextUnmarked = getFirstUnmarkedDay(updatedHabits, targetDate, getAdjustedTodayDateString(config.timezoneOffset ?? 6.5, config.nightOwlOffset ?? 0));
      
      setConfig(prev => ({
        ...prev,
        consecutiveAfkCount: 0,
        lastActiveDate: nextUnmarked ? prev.lastActiveDate : getAdjustedTodayDateString(prev.timezoneOffset ?? 6.5, prev.nightOwlOffset ?? 0),
        pointsHistory: [
          {
            id: `zero_active_${Date.now()}`,
            date: targetDate,
            type: 'HABIT_MISS' as const,
            description: `Locked Zero-Progress Day ${targetDate}. All habits marked incomplete, standard miss penalties applied.`,
            points: 0
          },
          ...(prev.pointsHistory || [])
        ]
      }));
      
      setUnmarkedDayToReconcile(nextUnmarked);
      if (nextUnmarked) {
        // Init next checklist
        const nextActive = updatedHabits.filter(h => h.createdDate <= nextUnmarked && (!h.archived || !h.archivedDate || h.archivedDate > nextUnmarked));
        const initialChecklist: Record<string, boolean> = {};
        nextActive.forEach(h => {
          initialChecklist[h.id] = false;
        });
        setAfkCheckedHabits(initialChecklist);
      }
    }
  };

  const handlePlacePrediction = (wager: number, growthRequired: number, durationDays: number, customPayout?: number, leverage: number = 1) => {
    if (config.totalPoints < wager) {
      alert('Insufficient points balance! Complete more habits to earn points first.');
      return;
    }

    const pendingPredictions = (config.predictions || []).filter(p => p.status === 'PENDING');
    if (pendingPredictions.length >= 5) {
      alert('Maximum 5 active predictions allowed concurrently to prevent high-frequency speculation!');
      return;
    }

    const targetDate = addDays(today, durationDays);
    const payout = Math.round(customPayout || (wager * (1 + (growthRequired * leverage) / 100)));

    const newPrediction = {
      id: `pred_${Date.now()}`,
      entryDate: today,
      targetDate,
      entryIndexPrice: currentIndexPrice,
      targetIndexPrice: currentIndexPrice,
      wagerPoints: wager,
      payoutPoints: payout,
      status: 'PENDING' as const,
      growthRequired,
      durationDays,
      leverage
    };

    setConfig(prev => {
      const proposedPoints = Math.max(0, prev.totalPoints - wager);
      const promo = prev.promotion || { status: 'NONE' as const, targetTier: '', targetPoints: 0, dailyPerformance: {} };
      let newPromoState = { ...promo };

      if (promo.status === 'ELIGIBLE' && proposedPoints < (promo.targetPoints - 1)) {
        newPromoState = {
          status: 'NONE' as const,
          targetTier: '',
          targetPoints: 0,
          dailyPerformance: {}
        };
      }

      return {
        ...prev,
        totalPoints: proposedPoints,
        promotion: newPromoState,
        predictions: [newPrediction, ...(prev.predictions || [])],
        pointsHistory: [
          {
            id: `pred_wager_${Date.now()}`,
            date: today,
            type: 'PREDICTION_WAGER',
            description: `Wagered ${wager} points with ${leverage}x leverage on +${growthRequired}% Index Growth prediction (${durationDays} days). Potential Payout: +${payout} PTS.`,
            points: -wager
          },
          ...(prev.pointsHistory || [])
        ]
      };
    });
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

  if (authLoading || checkingRedirect) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 antialiased font-mono gap-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-black text-white uppercase tracking-widest">BET ON ME TERMINAL</p>
          <p className="text-[10px] text-slate-500">BOOTING SECURITY COMPLIANCE MODULES...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !isGuestMode) {
    if (showAuthPage) {
      return (
        <AuthPage 
          onSuccess={() => {
            setShowAuthPage(false);
          }}
          onGuestMode={() => {
            setIsGuestMode(true);
            localStorage.setItem('guest_mode_active', 'true');
            setShowAuthPage(false);
          }}
          onBackToLanding={() => {
            setShowAuthPage(false);
          }}
          lang={lang}
          setLang={handleSetLang}
        />
      );
    }

    return (
      <IntroPage 
        onClose={() => {
          setIsGuestMode(true);
          localStorage.setItem('guest_mode_active', 'true');
        }}
        currentPoints={config.totalPoints || 0}
        onNavigateToAuth={() => {
          setShowAuthPage(true);
        }}
        currentUser={currentUser}
        isGuestMode={isGuestMode}
        lang={lang}
        setLang={handleSetLang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col antialiased pb-28">
      
      {/* GLOBAL HUD HEADER / DESK */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
        
        {/* Brand logo & live tracker badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-sans font-extrabold text-sm tracking-widest text-white uppercase">
              BET ON ME
            </h1>
            <span className="font-mono text-[9px] text-emerald-400 tracking-wider uppercase font-bold">
              HABIT INDEX TERMINAL
            </span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* User info capsule */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.email}</span>
              <span className="sm:hidden">Sync ✅</span>
            </div>
          ) : isGuestMode ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-mono text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>GUEST</span>
            </div>
          ) : null}

          {/* Quick streak capsule */}
          <div className="hidden md:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 font-mono text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{metrics.currentStreak}D STREAK</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => handleSetLang(lang === 'en' ? 'my' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] font-mono font-bold rounded-lg cursor-pointer transition-all text-slate-300"
            title={lang === 'en' ? "မြန်မာဘာသာသို့ ပြောင်းရန်" : "Switch to English"}
          >
            <span className="text-emerald-400 text-xs">🌐</span>
            <span>{lang === 'en' ? 'MY' : 'EN'}</span>
          </button>

          {/* Reset Mock Data Action */}
          <button
            onClick={handleResetData}
            title="Restore default mock history"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Log out option */}
          {(currentUser || isGuestMode) && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/30 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-rose-400 text-xs font-black uppercase"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* CORE VIEWPORT CARRIER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* TAB VIEW 1: OVERVIEW & CHARTING */}
        {activeTab === 'Dashboard' && (
          <div className="flex flex-col gap-6">

            {/* PROMOTION TRIAL NOTICE BANNERS */}
            {(() => {
              const promo = config.promotion;
              if (!promo || promo.status === 'NONE') return null;

              if (promo.status === 'ELIGIBLE') {
                return (
                  <div className="bg-gradient-to-r from-amber-600/20 via-yellow-600/15 to-transparent border-2 border-amber-500/50 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                        <Award className="w-8 h-8 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-md tracking-wider">PROMOTION MATCH</span>
                          <h4 className="text-white font-extrabold text-base md:text-lg">Rank Up Available! ({promo.targetTier})</h4>
                        </div>
                        <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                          သင့်ရမှတ်သည် {promo.targetPoints} PTS ပြည့်မီသွားပြီဖြစ်သဖြင့် <strong>{promo.targetTier}</strong> သို့ ရာထူးတိုးမြှင့်ရန် စံတော်ချိန် ၃ ရက်စိန်ခေါ်မှုကို စတင်နိုင်ပါပြီ။ စတင်ခြင်းမပြုမီအထိ သင့်ရမှတ်များအား ယာယီပိတ်ထားပါမည်။
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPromoTermsModal(true)}
                      className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md shrink-0 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Start Promotion</span>
                    </button>
                  </div>
                );
              }

              if (promo.status === 'SCHEDULED') {
                return (
                  <div className="bg-gradient-to-r from-cyan-600/20 via-blue-600/10 to-transparent border border-cyan-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                        <Clock className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase rounded-md tracking-wider">SCHEDULED</span>
                          <h4 className="text-white font-bold text-base">Trials starting tomorrow!</h4>
                        </div>
                        <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                          <strong>{promo.targetTier}</strong> ရာထူးတိုးစံတော်ချိန်စိန်ခေါ်မှုသည် <strong>မနက်ဖြန် ({promo.startDate})</strong> တွင် စတင်ပါမည်။ ၃ ရက်ဆက်တိုက် စံတော်ချိန်အတွင်း အနည်းဆုံး ၇၅% နေ့စဉ်ပြီးမြောက်အောင် ပြင်ဆင်ထားပါ။
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPromoTermsModal(true)}
                      className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      View Trial Info
                    </button>
                  </div>
                );
              }

              if (promo.status === 'ACTIVE') {
                const dates = getDatesInRange(promo.startDate!, promo.endDate!);
                return (
                  <div className="bg-gradient-to-r from-emerald-600/25 via-teal-600/15 to-transparent border-2 border-emerald-500/40 p-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                            <Flame className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded-md tracking-wider animate-pulse">TRIALS ACTIVE</span>
                              <h4 className="text-white font-extrabold text-base">Promotion Match to {promo.targetTier}</h4>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">
                              စံတော်ချိန်ကာလ: {promo.startDate} မှ {promo.endDate} အထိ။ နေ့စဉ် ပြီးမြောက်မှု ၇၅% ကျော်စီ ရရှိရပါမည်။
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPromoTermsModal(true)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer self-start md:self-center"
                        >
                          View Guidelines
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {dates.map((day, idx) => {
                          const record = promo.dailyPerformance?.[day];
                          const isPastDay = day < today;
                          const isCurrentDay = day === today;

                          let statusBg = "bg-slate-950/40 border-slate-900 text-slate-500";
                          let statusLabel = "Future Day";
                          let statusIcon = <Clock className="w-4 h-4 text-slate-600" />;

                          if (isCurrentDay) {
                            const activeOnDay = habits.filter(h => h.createdDate <= day && (!h.archived || !h.archivedDate || h.archivedDate > day));
                            const completedOnDay = activeOnDay.filter(h => h.history[day] === true);
                            const pointsEarned = completedOnDay.reduce((sum, h) => sum + getHabitPoints(h).reward, 0);
                            const totalPointsPossible = activeOnDay.reduce((sum, h) => sum + getHabitPoints(h).reward, 0);
                            const percentage = totalPointsPossible === 0 ? 100 : Math.round((pointsEarned / totalPointsPossible) * 100);
                            const currentPassed = percentage >= 75;

                            statusBg = "bg-emerald-500/5 border-emerald-500/30 text-emerald-400";
                            statusLabel = `Today: ${percentage}% (${currentPassed ? 'PASSED' : 'FAILING'})`;
                            statusIcon = <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />;
                          } else if (isPastDay) {
                            if (record) {
                              if (record.passed) {
                                statusBg = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300";
                                statusLabel = `Day ${idx + 1} (${record.percentage}%): PASSED`;
                                statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                              } else {
                                statusBg = "bg-rose-500/10 border-rose-500/40 text-rose-300";
                                statusLabel = `Day ${idx + 1} (${record.percentage}%): FAILED`;
                                statusIcon = <XCircle className="w-4 h-4 text-rose-400" />;
                              }
                            } else {
                              statusBg = "bg-rose-500/5 border-rose-500/20 text-rose-400";
                              statusLabel = `Day ${idx + 1}: NOT RECONCILED / FAILED`;
                              statusIcon = <XCircle className="w-4 h-4 text-rose-400" />;
                            }
                          }

                          return (
                            <div key={day} className={`border p-3 rounded-xl flex items-center justify-between ${statusBg}`}>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase text-slate-500 font-mono">Day {idx + 1} • {day}</span>
                                <span className="text-xs font-black mt-0.5">{statusLabel}</span>
                              </div>
                              {statusIcon}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
            })()}

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

            {/* FUTURE BETTING TERMINAL (UNDER CHART) */}
            <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-6 rounded-2xl flex flex-col gap-5">
              <div className="border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold tracking-wider text-xs font-mono uppercase">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Interactive Predictor Terminal</span>
                </div>
                <h3 className="font-sans font-black text-white text-lg md:text-xl mt-1 tracking-tight">
                  This chart depends 100% on you. Wanna bet on your future?
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  သင့်ရဲ့ အလေ့အကျင့် ဇယားဟာ သင့်အပေါ်မှာသာ ၁၀၀% မူတည်နေပါတယ်။ အနာဂတ် ရမှတ်တက်လှမ်းမှုတွေအပေါ် ကိုယ်ပိုင် points တွေနဲ့ လောင်းကြေးထပ်ပြီး အထူး bonus ရမှတ်တွေ ဆွတ်ခူးလိုက်ပါ။
                </p>
              </div>

              {(() => {
                const userTier = getTierInfo(config.totalPoints);
                
                // Templates list:
                const templates = [
                  {
                    id: 'low',
                    name: 'Low Risk (1-Day Quick Bet)',
                    growth: 1,
                    days: 1,
                    baseBonus: 15,
                    desc: 'Easy momentum bet. Ideal for daily streaks.',
                    color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                  },
                  {
                    id: 'med',
                    name: 'Medium Risk (3-Day Volatile Swing)',
                    growth: 4,
                    days: 3,
                    baseBonus: 45,
                    desc: 'Balanced swing. Great for consistent weekend tracking.',
                    color: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5'
                  },
                  {
                    id: 'high',
                    name: 'High Risk (7-Day Ultimate Discipline)',
                    growth: 10,
                    days: 7,
                    baseBonus: 150,
                    desc: 'High-stakes long-term discipline marathon.',
                    color: 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                  }
                ];

                const currentTemplate = templates.find(t => t.id === betTemplateId) || templates[1];
                
                // Keep the wager within bounds: 10 to Min(totalPoints, userTier.maxBet)
                const maxBetAmount = Math.min(config.totalPoints, userTier.maxBet);
                const safeWager = Math.max(10, Math.min(betWager, maxBetAmount));
                
                // Max leverage determined by Rank
                const maxLev = userTier.maxLeverage;
                const safeLeverage = Math.min(betLeverage, maxLev);

                // Goal price & payoff math
                const targetGoalPrice = currentIndexPrice * (1 + currentTemplate.growth / 100);
                const payoutMultiplier = 1 + (currentTemplate.baseBonus * safeLeverage) / 100;
                const potentialPayout = Math.round(safeWager * payoutMultiplier);
                const potentialProfit = potentialPayout - safeWager;

                const canAfford = config.totalPoints >= safeWager && safeWager >= 10;
                const pendingPredictionsCount = (config.predictions || []).filter(p => p.status === 'PENDING').length;

                return (
                  <div className="flex flex-col gap-6">
                    {/* Rank Badge Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{userTier.badge}</span>
                        <div>
                          <div className="text-[10px] text-slate-500 font-mono uppercase">Your Account Rank</div>
                          <div className={`text-xs font-bold ${userTier.color}`}>{userTier.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-500">Max Bet:</span> <span className="text-amber-400 font-bold">{userTier.maxBet} PTS</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Max Leverage:</span> <span className="text-emerald-400 font-bold">{userTier.maxLeverage}x</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Select Risk Template */}
                    <div className="flex flex-col gap-2">
                      <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-1">
                        <span>၁။ Choose Bet Template & Duration</span>
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {templates.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setBetTemplateId(t.id as any)}
                            className={`border text-left p-4 rounded-xl flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                              betTemplateId === t.id
                                ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                                : 'border-slate-800/70 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/35'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-black">
                                +{t.baseBonus}% Base Bonus
                              </span>
                              <h4 className="text-white text-sm font-black font-sans mt-0.5">
                                {t.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                                {t.desc}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/60 pt-2.5 mt-1">
                              <span className="text-slate-500">Target Index:</span>
                              <span className="text-emerald-400 font-bold">+{t.growth}% Close</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2 & 3: Bet sizing slider & Leverage selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Bet size slider */}
                      <div className="bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-xs font-semibold font-mono uppercase">၂။ Bet Point Amount</span>
                          <span className="text-xs text-amber-400 font-mono font-bold">
                            {safeWager} / {maxBetAmount} PTS
                          </span>
                        </div>

                        <input
                          type="range"
                          min="10"
                          max={maxBetAmount}
                          step="10"
                          value={safeWager}
                          onChange={(e) => setBetWager(Math.min(parseInt(e.target.value) || 10, maxBetAmount))}
                          className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />

                        {/* Quick select percentages */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[0.25, 0.5, 0.75, 1].map((p) => {
                            const val = Math.floor(maxBetAmount * p);
                            const roundedVal = Math.max(10, Math.round(val / 10) * 10);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setBetWager(Math.min(roundedVal, maxBetAmount))}
                                className="bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white py-1 rounded transition-colors cursor-pointer"
                              >
                                {p * 100}%
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-[9px] text-slate-500 leading-relaxed font-sans">
                          * သင်လောင်းကြေးထပ်နိုင်သော အများဆုံး points ပမာဏသည် သင့်လက်ရှိ points နှင့် Tier Limit ပေါ်မူတည်သည်။
                        </span>
                      </div>

                      {/* Leverage selector */}
                      <div className="bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-xs font-semibold font-mono uppercase">Prediction Leverage Multiplier</span>
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            {safeLeverage}x / {maxLev}x
                          </span>
                        </div>

                        <input
                          type="range"
                          min="1"
                          max={maxLev}
                          step="1"
                          value={safeLeverage}
                          onChange={(e) => setBetLeverage(Math.min(parseInt(e.target.value) || 1, maxLev))}
                          className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />

                        {/* Leverage level indicators */}
                        <div className="flex justify-between text-[9px] font-mono text-slate-500">
                          <span>1x (Base)</span>
                          {maxLev > 1 && <span>{Math.floor(maxLev / 2)}x</span>}
                          <span>{maxLev}x Max</span>
                        </div>
                        <span className="text-[9px] text-slate-500 leading-relaxed font-sans">
                          * Leverage ကိုတိုးမြှင့်ခြင်းဖြင့် ရရှိနိုင်သော အပို bonus points ဆုများကို အဆပေါင်းများစွာ တိုးမြင့်စေပါမည်။
                        </span>
                      </div>

                    </div>

                    {/* Step 4: Estimated Payout & Trigger Bet button */}
                    <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">ENTRY PRICE</span>
                          <span className="font-mono text-slate-200 font-bold">{currentIndexPrice.toFixed(0)} PTS</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">GOAL CLOSE PRICE</span>
                          <span className="font-mono text-emerald-400 font-extrabold">{targetGoalPrice.toFixed(0)} PTS</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">RISK ESTIMATION</span>
                          <span className={`font-mono font-bold ${
                            safeLeverage >= 8 ? 'text-rose-400' : safeLeverage >= 3 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {safeLeverage}x ({(currentTemplate.growth * safeLeverage).toFixed(0)}% VOL)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">POTENTIAL PAYOUT</span>
                          <span className="font-mono text-amber-400 font-extrabold">
                            +{potentialPayout} PTS <span className="text-[9px] text-slate-400">(+{potentialProfit} Bonus)</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handlePlacePrediction(safeWager, currentTemplate.growth, currentTemplate.days, potentialPayout, safeLeverage);
                          alert(`Prediction placed successfully! Wagered ${safeWager} PTS with ${safeLeverage}x leverage. Reach Goal Price of ${targetGoalPrice.toFixed(0)} PTS within ${currentTemplate.days} days to win.`);
                        }}
                        disabled={!canAfford || pendingPredictionsCount >= 5}
                        className={`px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          canAfford && pendingPredictionsCount < 5
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        {pendingPredictionsCount >= 5 ? 'Max Active Bets' : 'Lock Future Bet'}
                      </button>
                    </div>

                    {/* Active Prediction bets list */}
                    {(config.predictions || []).length > 0 && (
                      <div className="border-t border-slate-800/40 pt-5 mt-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-slate-300 text-xs font-semibold font-mono uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-amber-500" />
                            Active & Historical Future Predictions (ခန့်မှန်းချက် မှတ်တမ်း)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {pendingPredictionsCount} Active / 5 Max
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                          {(config.predictions || []).map((pred) => {
                            const goalPrice = pred.entryIndexPrice * (1 + pred.growthRequired / 100);
                            const daysLeft = Math.max(0, addDays(pred.entryDate, pred.durationDays) >= today 
                              ? Math.ceil((new Date(pred.targetDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24))
                              : 0);

                            return (
                              <div
                                key={pred.id}
                                className={`border p-3.5 rounded-xl flex flex-col gap-2.5 transition-all ${
                                  pred.status === 'WON'
                                    ? 'border-emerald-500/20 bg-emerald-950/5'
                                    : pred.status === 'LOST'
                                    ? 'border-rose-500/15 bg-rose-950/5'
                                    : 'border-slate-800/60 bg-slate-900/30'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      pred.status === 'WON'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : pred.status === 'LOST'
                                        ? 'bg-rose-500/20 text-rose-400'
                                        : 'bg-amber-500/10 text-amber-400 animate-pulse'
                                    }`}>
                                      {pred.status}
                                    </span>
                                    {pred.leverage && (
                                      <span className="text-[9px] font-mono text-slate-500">
                                        Leverage: {pred.leverage}x
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {pred.status === 'PENDING' ? `${daysLeft} days left` : `Resolved`}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                                  <div>
                                    <span className="text-slate-500 block text-[8px] uppercase">Entry Index</span>
                                    <span className="text-slate-300 font-bold">{pred.entryIndexPrice.toFixed(0)} PTS</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[8px] uppercase">Goal Index</span>
                                    <span className="text-emerald-400 font-black">{goalPrice.toFixed(0)} PTS</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[8px] uppercase">Wager / Payout</span>
                                    <span className="text-amber-400 font-bold">{pred.wagerPoints} / +{pred.payoutPoints}</span>
                                  </div>
                                </div>

                                <div className="text-[9px] text-slate-500 border-t border-slate-800/40 pt-1.5 flex justify-between items-center font-sans">
                                  <span>Start: {pred.entryDate}</span>
                                  <span>End: {pred.targetDate}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
            todayStr={today}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleHabit={handleToggleHabit}
          />
        )}

        {/* TAB VIEW 3: REWARDS, RANKINGS AND PREDICTIONS */}
        {activeTab === 'Rewards' && (
          <RewardsHub 
            config={config}
            currentIndexPrice={currentIndexPrice}
            onPlacePrediction={handlePlacePrediction}
            habits={habits}
          />
        )}

        {/* TAB VIEW 4: LEDGER DEEP AUDIT */}
        {activeTab === 'Ledger' && (
          <SuperLog 
            habits={habits}
            dailyCandles={dailyCandles}
            onSelectBacktrackDate={handleSelectBacktrackDate}
          />
        )}

        {/* TAB VIEW 5: WEEKLY PERFORMANCE AUDIT REPORT & ALERTS */}
        {activeTab === 'Report' && (
          <ReportHub 
            habits={habits}
            config={config}
            dailyCandles={dailyCandles}
            metrics={enrichedMetrics}
            today={today}
          />
        )}

        {/* TAB VIEW 5: SYSTEM TERMINAL CONFIGURATION & SETTINGS */}
        {activeTab === 'Settings' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header info card */}
            <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-sans font-black text-white text-lg flex items-center gap-2 uppercase tracking-wider">
                  <Settings className="w-5 h-5 text-emerald-400 animate-spin-slow" />
                  Terminal Controls & Game Rules
                </h2>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  မန္တလေးစံတော်ချိန် (Myanmar Time UTC+6:30) နှင့် ညဉ့်နက်အိပ်သူများ (Night Owls) အတွက် နေ့စဥ်သတ်မှတ်ချက်များ၊ ဈေးကွက်လီဗာရေ့ဂျ်များနှင့် စနစ်စည်းကမ်းများကို ဤနေရာတွင် စိတ်ကြိုက်ပြင်ဆင်နိုင်ပါသည်။
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/60 px-4 py-2 rounded-xl text-xs font-mono">
                <span className="text-slate-500">Calculated Trade Date:</span>
                <span className="text-emerald-400 font-bold">{today}</span>
              </div>
            </div>

            {/* Account Management Card */}
            <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-extrabold uppercase tracking-wider">Cloud Data Persistence Sync</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {currentUser 
                      ? `စနစ်ထဲသို့ ${currentUser.email} ဖြင့် လုံခြုံစွာဝင်ရောက်ထားပြီးဖြစ်၍ သင့်ဒေတာများကို Cloud ပေါ်တွင်အမြဲ Sync လုပ်ပေးနေပါသည်။` 
                      : 'သင်သည် Guest Mode ဖြင့်အသုံးပြုနေပါသည်။ စက်ပစ္စည်းပြောင်းလဲသည့်အခါ ဒေတာများမဆုံးရှုံးစေရန် Google သို့မဟုတ် Email ဖြင့် အကောင့်ဖွင့်ပါရန် အကြံပြုအပ်ပါသည်။'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Sign Out Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      localStorage.removeItem('guest_mode_active');
                      setIsGuestMode(false);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Go To Authentication
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Controls (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Section A: Localization Settings */}
                <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <h3 className="font-sans font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      1. Localization & Schedule
                    </h3>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase">Time Sync</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timezone selection */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 text-xs font-semibold">Local Time Zone (စံတော်ချိန်)</label>
                      <select
                        value={config.timezone || 'MMT'}
                        onChange={(e) => {
                          const tz = e.target.value;
                          const offsets: Record<string, number> = {
                            MMT: 6.5,
                            UTC: 0.0,
                            SGT: 8.0,
                            ICT: 7.0,
                            CET: 1.0,
                            GMT: 0.0,
                            EST: -5.0,
                            PST: -8.0
                          };
                          setConfig(prev => ({
                            ...prev,
                            timezone: tz,
                            timezoneOffset: offsets[tz]
                          }));
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-slate-700 cursor-pointer"
                      >
                        <option value="MMT">Myanmar Time (MMT, UTC+6:30) - Default</option>
                        <option value="UTC">Coordinated Universal (UTC+0:00)</option>
                        <option value="SGT">Singapore/Malaysia (SGT, UTC+8:00)</option>
                        <option value="ICT">Indochina Time (ICT, UTC+7:00)</option>
                        <option value="CET">Central European (CET, UTC+1:00)</option>
                        <option value="GMT">Greenwich Mean (GMT, UTC+0:00)</option>
                        <option value="EST">Eastern Standard (EST, UTC-5:00)</option>
                        <option value="PST">Pacific Standard (PST, UTC-8:00)</option>
                      </select>
                    </div>

                    {/* Night Owl hour boundary */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 text-xs font-semibold flex items-center justify-between">
                        <span>Night Owl Day-Boundary (အိပ်ချိန်နောက်ကျသူများ)</span>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          +{config.nightOwlOffset || 0} hrs
                        </span>
                      </label>
                      <select
                        value={config.nightOwlOffset || 0}
                        onChange={(e) => setConfig(prev => ({ ...prev, nightOwlOffset: parseInt(e.target.value) }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-slate-700 cursor-pointer"
                      >
                        <option value="0">12:00 AM Midnight (Default)</option>
                        <option value="1">1:00 AM (Extra 1 hr grace)</option>
                        <option value="2">2:00 AM (Extra 2 hrs grace)</option>
                        <option value="3">3:00 AM (Extra 3 hrs grace)</option>
                        <option value="4">4:00 AM (Extra 4 hrs grace)</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-800/40">
                    * <strong>Myanmar Time</strong> ကို အသုံးပြုပါက standard Myanmar GMT offset (+6.5) အား အလိုအလျောက် သတ်မှတ်ပေးပါမည်။ ညဉ့်နက်မှ အလေ့အကျင့်မှတ်တမ်းတင်လေ့ရှိသူများ (Night Owls) အတွက် <strong>Day-Boundary</strong> ကို ၁ နာရီမှ ၄ နာရီအထိ ရွှေ့ဆိုင်းထားနိုင်ပြီး နောက်တစ်နေ့ မနက်မတိုင်ခင်အထိ ယမန်နေ့အတွက် အလေ့အကျင့်များကို အပြစ်ပေးခံရခြင်းမရှိဘဲ mark ပြုလုပ်ခွင့်ရရှိစေမည်ဖြစ်သည်။
                  </p>
                </div>

                {/* Section B: Chart overlays & Aesthetics */}
                <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <h3 className="font-sans font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      2. Terminal Aesthetics & Leverage
                    </h3>
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase">Aesthetic Controls</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Theme preset dropdown */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 text-xs font-semibold">Candle Theme Preset</label>
                      <select
                        value={config.themePreset}
                        onChange={(e) => setConfig(prev => ({ ...prev, themePreset: e.target.value as any }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-slate-700 cursor-pointer"
                      >
                        <option value="standard">Emerald & Rose (Standard)</option>
                        <option value="cyber">Cyan & Magenta (Cyberpunk)</option>
                        <option value="amber">Pink & Orange (Amber)</option>
                        <option value="gold">Gold & Purple (Golden Gate)</option>
                      </select>
                    </div>

                    {/* Trading Leverage dropdown */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 text-xs font-semibold flex items-center gap-1">
                        <span>Simulated Leverage Multiplier</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">({config.leverage}x)</span>
                      </label>
                      <select
                        value={config.leverage}
                        onChange={(e) => setConfig(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-slate-700 cursor-pointer"
                      >
                        <option value="1">1x (Conservative - Low Volatility)</option>
                        <option value="2">2x (Moderate - Balanced)</option>
                        <option value="5">5x (Aggressive - High Gains/Losses)</option>
                        <option value="10">10x (High Risk - Liquidation Prone)</option>
                      </select>
                    </div>
                  </div>

                  {/* Technical indicators overlay toggle */}
                  <div className="border-t border-slate-800/40 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-slate-200 text-xs font-semibold">Technical Moving Average Overlays</span>
                        <span className="text-[10px] text-slate-500">Enable SMA and EMA indicators on the Candlestick charts</span>
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
                      <div className="grid grid-cols-2 gap-4 bg-slate-900/30 p-3 rounded-lg border border-slate-900/50">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-medium">SMA Period</span>
                            <span className="text-blue-400 font-mono font-bold">{config.smaPeriod} Days</span>
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
                            <span className="text-amber-400 font-mono font-bold">{config.emaPeriod} Days</span>
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

                    {/* Weekend Skip Toggle */}
                    <div className="flex items-center justify-between border-t border-slate-800/40 pt-3">
                      <div className="flex flex-col">
                        <span className="text-slate-200 text-xs font-semibold">Weekend Penalty Exclusion (စနေ/တနင်္ဂနွေ ပိတ်ရက်ဖယ်ထုတ်ရန်)</span>
                        <span className="text-[10px] text-slate-500">Exclude Saturdays and Sundays from generating retroactive missed day penalties</span>
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

                {/* Section C: Master Database Control Center */}
                <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <h3 className="font-sans font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                      <Database className="w-4 h-4 text-rose-400" />
                      3. Master Database Control Center
                    </h3>
                    <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold uppercase">Danger Zone</span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Use these commands to wipe, adjust, or seed your simulated stock account and local cache values:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Action 1: Reset Trading Capital */}
                    <button
                      onClick={handleResetTradeAccount}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700/80 p-3 rounded-lg text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-500 mt-0.5 group-hover:rotate-180 transition-transform duration-500" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Reset Trading Balance</span>
                        <span className="text-[10px] text-slate-500">Restore balance to $10,000 & close trades</span>
                      </div>
                    </button>

                    {/* Action 2: Reset entire DB to defaults */}
                    <button
                      onClick={handleResetData}
                      className="bg-slate-950/40 hover:bg-slate-900 border border-slate-900 hover:border-rose-950 p-3 rounded-lg text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-rose-500 mt-0.5 group-hover:animate-spin" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-rose-400">Complete Master Reset</span>
                        <span className="text-[10px] text-slate-500">Revert habits, history & configs to defaults</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section D: Developer Promotion Testing & Debugging (Temporary) */}
                <div className="bg-slate-950/40 border border-amber-500/40 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <h3 className="font-sans font-bold text-amber-400 text-sm flex items-center gap-2 uppercase tracking-wider">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      🧪 Dev Sandbox (Promotion Trials Tester)
                    </h3>
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase">Sandbox Mode</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-normal">
                    စံတော်ချိန် ရာထူးတိုးစိန်ခေါ်မှု (Rank Promotion Match) များကို low rank ရမှတ်အနည်းငယ်ဖြင့် စမ်းသပ်ကြည့်နိုင်ရန် တည်ဆောက်ထားသော debug console ဖြစ်ပါသည်။ (လွှင့်တင်မီ ဤကဒ်ကို ပြန်ဖျက်ပါမည်)
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2 mt-1">
                    {/* Trigger Eligible */}
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          totalPoints: 499,
                          promotion: {
                            status: 'ELIGIBLE',
                            targetTier: 'Silver (ငွေရောင်အဆင့်)',
                            targetPoints: 500,
                            dailyPerformance: {}
                          },
                          pointsHistory: [
                            {
                              id: `dev_elig_${Date.now()}`,
                              date: today,
                              type: 'BONUS_REWARD',
                              description: `🧪 [DEBUG] Sandbox forced Rank Promotion Eligibility for Silver. (Total points set to 499)`,
                              points: 0
                            },
                            ...(prev.pointsHistory || [])
                          ]
                        }));
                      }}
                      className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 p-2.5 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="text-[11px] font-black text-amber-400">1. Trigger Eligible (Silver)</div>
                      <div className="text-[9px] text-slate-400 mt-1">ရမှတ် ၄၉၉ သို့ညှိပြီး 'Start Promotion' ခလုတ်ကို ချက်ချင်းစမ်းသပ်ရန်။</div>
                    </button>

                    {/* Trigger Scheduled */}
                    <button
                      onClick={() => {
                        const startDate = addDays(today, 1);
                        const endDate = addDays(startDate, 2);
                        setConfig(prev => ({
                          ...prev,
                          totalPoints: 499,
                          promotion: {
                            status: 'SCHEDULED',
                            targetTier: 'Silver (ငွေရောင်အဆင့်)',
                            targetPoints: 500,
                            activationDate: today,
                            startDate,
                            endDate,
                            dailyPerformance: {}
                          },
                          pointsHistory: [
                            {
                              id: `dev_sched_${Date.now()}`,
                              date: today,
                              type: 'BONUS_REWARD',
                              description: `🧪 [DEBUG] Sandbox scheduled Silver promotion trial starting tomorrow (${startDate}).`,
                              points: 0
                            },
                            ...(prev.pointsHistory || [])
                          ]
                        }));
                      }}
                      className="bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/50 p-2.5 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="text-[11px] font-black text-cyan-400">2. Trigger Scheduled (Tomorrow)</div>
                      <div className="text-[9px] text-slate-400 mt-1">မနက်ဖြန်စတင်မည့် စိန်ခေါ်မှုစောင့်ဆိုင်းနေသော အခြေအနေကို စမ်းသပ်ရန်။</div>
                    </button>

                    {/* Trigger Active */}
                    <button
                      onClick={() => {
                        const yesterday = addDays(today, -1);
                        const startDate = yesterday;
                        const endDate = addDays(startDate, 2);
                        setConfig(prev => ({
                          ...prev,
                          totalPoints: 499,
                          promotion: {
                            status: 'ACTIVE',
                            targetTier: 'Silver (ငွေရောင်အဆင့်)',
                            targetPoints: 500,
                            activationDate: addDays(today, -2),
                            startDate,
                            endDate,
                            dailyPerformance: {
                              [yesterday]: {
                                completedCount: 3,
                                totalActiveCount: 3,
                                pointsEarned: 30,
                                totalPointsPossible: 30,
                                percentage: 100,
                                passed: true
                              }
                            }
                          },
                          pointsHistory: [
                            {
                              id: `dev_active_${Date.now()}`,
                              date: today,
                              type: 'BONUS_REWARD',
                              description: `🧪 [DEBUG] Sandbox forced ACTIVE Silver promotion trials with Day 1 passed successfully!`,
                              points: 0
                            },
                            ...(prev.pointsHistory || [])
                          ]
                        }));
                      }}
                      className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 p-2.5 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="text-[11px] font-black text-emerald-400">3. Trigger Active (In Progress)</div>
                      <div className="text-[9px] text-slate-400 mt-1">ယမန်နေ့အောင်မြင်မှုအပါအဝင် တက်ကြွနေသောစိန်ခေါ်မှု status ကိုစမ်းသပ်ရန်။</div>
                    </button>

                    {/* Direct Points Tweaker */}
                    <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-1.5">
                      <div className="text-[11px] font-black text-slate-300">4. Manual Points Override</div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              totalPoints: 495,
                              promotion: { status: 'NONE', targetTier: '', targetPoints: 0, dailyPerformance: {} }
                            }));
                          }}
                          className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono rounded font-bold cursor-pointer transition-colors"
                        >
                          495 PTS
                        </button>
                        <button
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              totalPoints: 1495,
                              promotion: { status: 'NONE', targetTier: '', targetPoints: 0, dailyPerformance: {} }
                            }));
                          }}
                          className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono rounded font-bold cursor-pointer transition-colors"
                        >
                          1495 PTS
                        </button>
                        <button
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              totalPoints: 2995,
                              promotion: { status: 'NONE', targetTier: '', targetPoints: 0, dailyPerformance: {} }
                            }));
                          }}
                          className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono rounded font-bold cursor-pointer transition-colors"
                        >
                          2995 PTS
                        </button>
                      </div>
                    </div>

                    {/* Trigger Success Celebrate */}
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          totalPoints: Math.max(prev.totalPoints + 100, 600),
                          pointsHistory: [
                            {
                              id: `promo_success_sandbox_${Date.now()}`,
                              date: today,
                              type: 'BONUS_REWARD',
                              description: `👑 [Sandbox] Rank Promotion Match Successful! Promoted to Silver (ငွေရောင်အဆင့်)! Awarded +100 PTS Champion bonus!`,
                              points: 100
                            },
                            ...(prev.pointsHistory || [])
                          ],
                          promotion: {
                            status: 'COMPLETED',
                            targetTier: 'Silver (ငွေရောင်အဆင့်)',
                            targetPoints: 500,
                            dailyPerformance: {}
                          }
                        }));
                      }}
                      className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/40 p-2.5 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="text-[11px] font-black text-emerald-400">👑 Instant Promotion Success</div>
                      <div className="text-[9px] text-slate-400 mt-1">စိန်ခေါ်မှုအောင်မြင်ပြီး ရာထူးတိုးမြှင့်ခြင်း အောင်ပွဲခံမှုစခရင်ကို ချက်ချင်းစမ်းသပ်ရန်။</div>
                    </button>

                    {/* Trigger Failure Penalty */}
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          totalPoints: Math.max(0, prev.totalPoints - 50),
                          pointsHistory: [
                            {
                              id: `promo_fail_sandbox_${Date.now()}`,
                              date: today,
                              type: 'HABIT_MISS',
                              description: `❌ [Sandbox] Promotion Trials to Silver (ငွေရောင်အဆင့်) Failed. You did not meet the 75% consistency requirement. Penalty: -50 PTS.`,
                              points: -50
                            },
                            ...(prev.pointsHistory || [])
                          ],
                          promotion: {
                            status: 'FAILED',
                            targetTier: 'Silver (ငွေရောင်အဆင့်)',
                            targetPoints: 500,
                            dailyPerformance: {}
                          }
                        }));
                      }}
                      className="bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/40 p-2.5 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="text-[11px] font-black text-rose-400">❌ Instant Promotion Failure</div>
                      <div className="text-[9px] text-slate-400 mt-1">စိန်ခေါ်မှုကျရှုံးပြီး နှုတ်ယူပြစ်ဒဏ်စခရင်ကို ချက်ချင်းစမ်းသပ်ရန်။</div>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Game Rules & System Engine Audit (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Rulebook card */}
                <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
                  <div className="border-b border-slate-800/60 pb-3 flex items-center justify-between">
                    <h3 className="font-sans font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      Discipline Consistency Engine
                    </h3>
                    <span className="text-[9px] font-mono text-emerald-400">RULES AUDIT</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    စနစ်ထဲတွင် ထည့်သွင်းသတ်မှတ်ပေးထားသော ဉာဏ်ရည်ထက်မြက်သည့် အထူးဂိမ်းစည်းကမ်းများ၏ လက်ရှိသတ်မှတ်ချက်များ-
                  </p>

                  <div className="flex flex-col gap-3.5">
                    
                    {/* Feature 1: Discipline Multiplier */}
                    <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-lg flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">၁။ KD-Style Consistency Multiplier</span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        အပတ်စဥ် အောင်မြင်မှုရာခိုင်နှုန်းပေါ်မူတည်ပြီး အထူးမြှောက်ဖော်ကိန်း သက်ရောက်စေသည်-
                      </p>
                      <ul className="text-[10px] text-slate-500 list-disc list-inside space-y-0.5 font-mono">
                        <li>Week Consistency &gt;= 90%: <span className="text-emerald-400 font-bold">+1.2x Point Boost</span></li>
                        <li>Week Consistency &lt; 50%: <span className="text-rose-400 font-bold">-1.5x Penalty Slip</span></li>
                      </ul>
                    </div>

                    {/* Feature 2: Tier Based Miss Penalty */}
                    <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-lg flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">၂။ Tier-Based Miss Penalty Factor</span>
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        ဂိမ်းကစားသကဲ့သို့ Tier (PUBG Ranks) တက်လာသည်နှင့်အမျှ တာဝန်ယူစိတ် ပိုမိုမြင့်မားလာစေရန် Miss Penalty အပြစ်ပေးရမှတ် ပိုများလာပါမည်-
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono text-slate-500">
                        <span className="flex items-center justify-between"><span>Bronze/Silver:</span> <span className="text-slate-300 font-bold">30% (30pts)</span></span>
                        <span className="flex items-center justify-between"><span>Gold/Platinum:</span> <span className="text-slate-300 font-bold">50% (50pts)</span></span>
                        <span className="flex items-center justify-between"><span>Diamond/Crown:</span> <span className="text-slate-300 font-bold">80% (80pts)</span></span>
                        <span className="flex items-center justify-between"><span>Ace/Conqueror:</span> <span className="text-emerald-400 font-bold">150% (150pts)</span></span>
                      </div>
                    </div>

                    {/* Feature 3: Max Risk Exposure Gauge */}
                    <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">၃။ Habit Volatility Exposure Gauge</span>
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase">Dynamic</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        တစ်ရက်တည်းတွင် အလေ့အကျင့်အများကြီး (၈ ခုနှင့်အထက်) ကို ထည့်သွင်းထားပါက portfolio volatility မြင့်မားသွားမည်ဖြစ်ပြီး risk gauge နီလာပါမည်။
                      </p>
                      
                      {/* Visual gauge bar */}
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                          <span>Exposure Level:</span>
                          <span className={`font-bold ${
                            habits.length >= 8 ? 'text-rose-400' : habits.length >= 5 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {habits.length} Habits ({habits.length >= 8 ? 'CRITICAL RISK' : habits.length >= 5 ? 'MODERATE RISK' : 'STABLE'})
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              habits.length >= 8 ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : habits.length >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (habits.length / 10) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Feature 4: No-Check Penalty */}
                    <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-lg flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">၄။ Retroactive AFK Audit System</span>
                        <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        စနစ်သို့ မဝင်ရောက်ဖြစ်ဘဲ လွတ်သွားသော ရက်များရှိပါက Reconciliation Center modal က အလိုအလျောက် ပေါ်လာမည်ဖြစ်ပြီး AFK ဒဏ်ကြေး သို့မဟုတ် standard Miss penalty ရွေးချယ်စေကာ စာရင်းစစ်ဆေးပေးပါမည်။
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* PRODUCT INTRO TOUR FLOATING CARD */}
            <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-white font-bold text-sm">Bet On Me - Exclusive Features Tour</h4>
                  <p className="text-slate-500 text-xs leading-normal mt-0.5">
                    လောင်းကြေးထပ်စနစ်၊ အဆင့်သတ်မှတ်ချက်များနှင့် စံတော်ချိန်စည်းကမ်းများ၏ အသေးစိတ်လမ်းညွှန်ချက်ကို ဖတ်ရှုပါ။
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowIntroOverlay(true);
                  window.history.pushState({}, '', '/intropage');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Launch App Tour</span>
              </button>
            </div>

          </div>
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

      {/* AFK RECONCILIATION MODAL POPUP */}
      {unmarkedDayToReconcile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header banner */}
            <div className="bg-slate-950 p-6 border-b border-slate-800/60 relative overflow-hidden flex items-start gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-sans font-black text-white text-base uppercase tracking-wider">
                  Reconciliation Center (လွတ်သွားသောနေ့ စစ်ဆေးခြင်း)
                </h3>
                <span className="text-xs text-amber-400 font-mono font-bold mt-1">
                  Missed Date: {formatDateLabel(unmarkedDayToReconcile, 'long')} ({unmarkedDayToReconcile})
                </span>
              </div>
            </div>

            {/* Scrollable contents */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
              <p className="text-slate-400 text-xs leading-relaxed">
                We detected no activity or habit markings recorded on <strong className="text-slate-200">{unmarkedDayToReconcile}</strong>. To safeguard the integrity of the quarterly leaderboards, please specify the nature of this missed day:
              </p>

              {/* TWO CHOICE INTERFACE */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* CHOICE 1: AFK Retroactive Log */}
                <div className="bg-slate-950/40 border border-slate-800 hover:border-slate-700/60 p-4 rounded-xl flex flex-col gap-3 transition-all">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="afk_choice" 
                      name="reconcile_type" 
                      defaultChecked 
                      className="accent-amber-500 w-4 h-4"
                      onChange={() => {}} 
                    />
                    <label htmlFor="afk_choice" className="font-sans font-bold text-white text-xs uppercase cursor-pointer flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      I was AFK / Busy (ခရီးသွား/အလုပ်ရှုပ်နေခဲ့သည်)
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed ml-6">
                    Retroactively mark habits completed on this date. Rewards will be subject to a consecutive penalty and warm-up offset deduction.
                  </p>

                  {/* CHECKLIST OF HABITS FOR RETROACTIVE LOG */}
                  <div className="ml-6 bg-slate-950 border border-slate-900 rounded-lg p-3 flex flex-col gap-2.5 max-h-40 overflow-y-auto">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-900 pb-1.5">
                      Check completed habits:
                    </span>
                    {habits.filter(h => h.createdDate <= unmarkedDayToReconcile && (!h.archived || !h.archivedDate || h.archivedDate > unmarkedDayToReconcile)).map(habit => (
                      <label key={habit.id} className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={afkCheckedHabits[habit.id] === true}
                          onChange={(e) => {
                            setAfkCheckedHabits(prev => ({
                              ...prev,
                              [habit.id]: e.target.checked
                            }));
                          }}
                          className="accent-emerald-500 rounded border-slate-800 bg-slate-950"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{habit.name}</span>
                          <span className="text-[9px] text-slate-500">{habit.difficulty} • {habit.importance} Importance</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* PENALTY LIVE METRIC BOX */}
                  <div className="ml-6 bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex flex-col gap-1 text-[10px] text-amber-400/90 font-mono">
                    <div className="flex justify-between">
                      <span>AFK STREAK TIER:</span>
                      <span className="font-bold">Tier {Math.min(3, (config.consecutiveAfkCount || 0) + 1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FLAT POINT DEDUCTION:</span>
                      <span className="font-bold">-{Math.min(200, ((config.consecutiveAfkCount || 0) + 1) * 50)} PTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>REWARD RETRIEVAL RATE:</span>
                      <span className="font-bold">{Math.round(Math.max(0.5, 1 - (((config.consecutiveAfkCount || 0) + 1) * 0.15)) * 100)}%</span>
                    </div>
                    <span className="text-[8px] text-slate-500 leading-normal mt-1 block">
                      * Multiple consecutive AFKs scale punishments and decrease reward rates to prevent platform exploitation.
                    </span>
                  </div>

                  <button
                    onClick={() => handleReconcileAFK(true)}
                    className="ml-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all uppercase tracking-wider self-start px-4 cursor-pointer"
                  >
                    Save Retroactive Logs & Face Penalty
                  </button>
                </div>

                {/* CHOICE 2: LOCK AS INCOMPLETE */}
                <div className="bg-slate-950/20 border border-slate-800/40 p-4 rounded-xl flex flex-col gap-3 transition-all">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="fail_choice" 
                      name="reconcile_type" 
                      className="accent-rose-500 w-4 h-4"
                      onChange={() => {}} 
                    />
                    <label htmlFor="fail_choice" className="font-sans font-bold text-slate-400 text-xs uppercase cursor-pointer flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      No, I completed nothing (ဘာမှမလုပ်ဖြစ်ခဲ့ပါ)
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed ml-6">
                    Declare this day as a standard missed period. Standard incomplete habit penalties will drop your portfolio index points and lower rankings automatically.
                  </p>
                  
                  <button
                    onClick={() => handleReconcileAFK(false)}
                    className="ml-6 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold py-2 rounded-lg text-xs transition-all uppercase tracking-wider self-start px-4 cursor-pointer"
                  >
                    Lock Day as Missed (0 Progress)
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* MOBILE APP STYLE STICKY BOTTOM TABS */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 py-3.5 px-4 flex justify-around items-center sm:justify-center sm:gap-14 shadow-[0_-8px_32px_rgba(0,0,0,0.65)]">
        {[
          { id: 'Dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'Habits', label: 'Assets', icon: ListTodo },
          { id: 'Rewards', label: 'Rank & Prediction', icon: Award },
          { id: 'Report', label: 'Audits', icon: FileText },
          { id: 'Ledger', label: 'Ledger', icon: History },
          { id: 'Settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer relative ${
                isActive 
                  ? 'text-emerald-400 font-extrabold scale-105'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-emerald-500/10' : 'hover:bg-slate-900/50'}`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-sans font-bold tracking-wide">{tab.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* DETAILED EXCLUSIVE APP TOUR OVERLAY */}
      {showIntroOverlay && (
        <IntroPage 
          onClose={() => {
            setShowIntroOverlay(false);
            const path = window.location.pathname.toLowerCase().replace(/\/$/, "");
            const hash = window.location.hash.toLowerCase();
            const params = new URLSearchParams(window.location.search);
            if (path === '/intropage' || hash === '#/intropage' || params.get('page') === 'intropage' || params.get('route') === 'intropage') {
              window.history.pushState({}, '', '/');
            }
          }} 
          currentPoints={config.totalPoints || 0} 
          onNavigateToAuth={() => {
            setShowIntroOverlay(false);
            setShowAuthPage(true);
          }}
          currentUser={currentUser}
          isGuestMode={isGuestMode}
          lang={lang}
          setLang={handleSetLang}
        />
      )}

      {/* PROMOTION TERMS & ACTIVATION MODAL */}
      {showPromoTermsModal && config.promotion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setShowPromoTermsModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center pb-5 border-b border-slate-800/60">
              <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 mb-3 animate-bounce">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-white font-sans font-black text-xl tracking-tight uppercase">
                Rank Promotion Trials
              </h3>
              <p className="text-amber-400 font-mono text-xs font-semibold tracking-wider mt-1">
                ROAD TO {config.promotion.targetTier.toUpperCase()}
              </p>
            </div>

            {/* Content & Rules */}
            <div className="py-5 flex flex-col gap-4">
              <h4 className="text-slate-200 text-xs font-bold uppercase tracking-wider">စံတော်ချိန် ရာထူးတိုး စည်းမျဉ်းစည်းကမ်းများ</h4>
              
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                  <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold shrink-0 mt-0.5">01</span>
                  <div className="flex flex-col text-xs text-slate-300 leading-normal">
                    <strong className="text-white font-extrabold mb-0.5">3 Consecutive Days</strong>
                    ရာထူးတိုးမြှင့်ရန်အတွက် ၃ ရက်ဆက်တိုက် နေ့စဉ် စံတော်ချိန် စိန်ခေါ်မှုကို ကျော်ဖြတ်ရပါမည်။
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                  <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold shrink-0 mt-0.5">02</span>
                  <div className="flex flex-col text-xs text-slate-300 leading-normal">
                    <strong className="text-white font-extrabold mb-0.5">75% Daily Point Consistency</strong>
                    စံတော်ချိန်ကာလအတွင်း တစ်ရက်လျှင် သတ်မှတ်ထားသော active အလေ့အကျင့်အားလုံး၏ အနည်းဆုံး <strong>၇၅%</strong> (point weight အချိုး) အောင်မြင်အောင် ပြီးမြောက်ရပါမည်။
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                  <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold shrink-0 mt-0.5">03</span>
                  <div className="flex flex-col text-xs text-slate-300 leading-normal">
                    <strong className="text-white font-extrabold mb-0.5">Points Frozen (ယာယီရမှတ်ပိတ်သိမ်းခြင်း)</strong>
                    Promotion အရည်အချင်းပြည့်မီချိန်မှစတင်ကာ စိန်ခေါ်မှုမပြီးမချင်း သင့်ရမှတ်သည် Cap ဖြစ်နေပြီး အလေ့အကျင့်ပြီးမြောက်မှုများအတွက် အပိုရမှတ်များ ရရှိမည်မဟုတ်ပါ။
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                  <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold shrink-0 mt-0.5">04</span>
                  <div className="flex flex-col text-xs text-slate-300 leading-normal">
                    <strong className="text-white font-extrabold mb-0.5">1-Day Advance Activation</strong>
                    Promotion Trial အား ဒီနေ့ activate လုပ်ပါက မနက်ဖြန်မှစတင်၍ နောက် ၃ ရက်အတွင်း စိန်ခေါ်မှုကစားရပါမည် (မအားသောရက်များကို ရှောင်ရှားနိုင်ရန် ကိုယ်တိုင်ရွေးချယ်ခွင့် ပေးထားပါသည်)။
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                  <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold shrink-0 mt-0.5">05</span>
                  <div className="flex flex-col text-xs text-slate-300 leading-normal">
                    <strong className="text-white font-extrabold mb-0.5">Promotion Outcomes</strong>
                    စိန်ခေါ်မှုအောင်မြင်ပါက တရားဝင် ရာထူးတိုးမြှင့်ခံရပြီး <strong>+100 PTS</strong> Champion Bonus ရရှိမည်။ ကျရှုံးပါက <strong>-50 PTS</strong> လျော့နည်းသွားပြီး ပြန်လည်အရည်အချင်းစစ်ရပါမည်။
                  </div>
                </li>
              </ul>
            </div>

            {/* Action Section */}
            <div className="border-t border-slate-800/60 pt-5 flex flex-col gap-3">
              {config.promotion.status === 'ELIGIBLE' && (
                <button
                  type="button"
                  onClick={() => {
                    handleActivatePromotion();
                    setShowPromoTermsModal(false);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md text-center"
                >
                  Confirm & Activate (Starts Tomorrow)
                </button>
              )}

              {config.promotion.status === 'SCHEDULED' && (
                <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                  <p className="text-cyan-400 font-bold text-xs">Trials Scheduled! Starts tomorrow ({config.promotion.startDate})</p>
                </div>
              )}

              {config.promotion.status === 'ACTIVE' && (
                <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <p className="text-emerald-400 font-bold text-xs">Trials Active! Keep your habits checked daily!</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPromoTermsModal(false)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer text-center"
              >
                Close Guidelines
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PROMOTION SUCCESS OVERLAY */}
      {config.promotion && config.promotion.status === 'COMPLETED' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-emerald-500 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <div className="inline-flex p-4 bg-emerald-500/10 border-2 border-emerald-500 rounded-full text-emerald-400 mb-4 animate-bounce">
              <Award className="w-12 h-12" />
            </div>
            
            <h3 className="text-white font-sans font-black text-2xl tracking-tight uppercase">
              RANK PROMOTED!
            </h3>
            <p className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase mt-1">
              {config.promotion.targetTier}
            </p>

            <div className="my-6 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-left">
              <p className="text-slate-300 text-xs leading-relaxed">
                ဂုဏ်ယူပါသည်! သင်သည် ၃ ရက်ဆက်တိုက် ၇၅% ကျော် အလေ့အကျင့်စံတော်ချိန်ကို အောင်မြင်စွာ ဖြတ်ကျော်နိုင်ခဲ့ပြီး <strong>{config.promotion.targetTier}</strong> ရာထူးတိုးမြှင့်ခြင်း ခံရပါသည်။
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                <span className="text-slate-500">Champion Reward:</span>
                <span className="text-emerald-400 font-bold font-mono">+100 PTS Bonus</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcknowledgePromotionResult}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md"
            >
              Claim Rank Badge & Reward
            </button>
          </div>
        </div>
      )}

      {/* PROMOTION FAILURE OVERLAY */}
      {config.promotion && config.promotion.status === 'FAILED' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <div className="inline-flex p-4 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400 mb-4">
              <XCircle className="w-12 h-12" />
            </div>
            
            <h3 className="text-white font-sans font-black text-2xl tracking-tight uppercase">
              TRIALS FAILED
            </h3>
            <p className="text-rose-400 font-mono text-sm font-bold tracking-widest uppercase mt-1">
              PROMOTION FAILED
            </p>

            <div className="my-6 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-left">
              <p className="text-slate-300 text-xs leading-relaxed">
                စိတ်မကောင်းပါဘူး! သင်သည် ၃ ရက်ဆက်တိုက် ၇၅% ပြီးမြောက်မှုရရှိရန် လိုအပ်ချက်ကို မပြည့်မီခဲ့ပါ။ စံတော်ချိန်စည်းကမ်းအရ ရမှတ်များ လျော့နည်းသွားမည်ဖြစ်ပြီး နောက်တစ်ကြိမ် အရည်အချင်းပြန်လည်စစ်ဆေးရပါမည်။
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                <span className="text-slate-500">Rank Penalty:</span>
                <span className="text-rose-400 font-bold font-mono">-50 PTS</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcknowledgePromotionResult}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md"
            >
              Try Again Later
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
