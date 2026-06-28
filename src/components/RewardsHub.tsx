import React from 'react';
import { UserTerminalConfig, PredictionTrade, PointsHistoryItem, Habit } from '../types';
import { 
  Award, 
  TrendingUp, 
  History, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Crown, 
  Trophy,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

interface RewardsHubProps {
  config: UserTerminalConfig;
  currentIndexPrice: number;
  onPlacePrediction: (wager: number, growthRequired: number, durationDays: number) => void;
  habits?: Habit[];
}

export default function RewardsHub({ config, currentIndexPrice, onPlacePrediction, habits = [] }: RewardsHubProps) {
  const { totalPoints = 1000, predictions = [], pointsHistory = [] } = config || {};

  // PUBG-style tier calculation helper
  const getTierInfo = (points: number) => {
    if (points >= 12000) {
      return {
        name: 'Conqueror (ဂုဏ်သရေရှိအနိုင်ရသူ)',
        color: 'text-amber-400 border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        badge: '👑',
        nextPoints: Infinity,
        prevPoints: 12000,
        desc: 'Ultimate rank. Top tier consistency master.'
      };
    } else if (points >= 8000) {
      return {
        name: 'Ace (ကြယ်ပွင့်ပညာရှင်)',
        color: 'text-rose-400 border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
        badge: '⭐️ Ace',
        nextPoints: 12000,
        prevPoints: 8000,
        desc: 'Elite discipline level. Unstoppable momentum.'
      };
    } else if (points >= 5000) {
      return {
        name: 'Crown (သရဖူအဆင့်)',
        color: 'text-violet-400 border-violet-500 bg-violet-500/10',
        badge: '💎 Crown',
        nextPoints: 8000,
        prevPoints: 5000,
        desc: 'Sovereign tier tracking. Mindset locked.'
      };
    } else if (points >= 3000) {
      return {
        name: 'Diamond (စိန်အဆင့်)',
        color: 'text-sky-400 border-sky-500 bg-sky-500/10',
        badge: '💠 Diamond',
        nextPoints: 5000,
        prevPoints: 3000,
        desc: 'Brilliant habit consistency and predictions.'
      };
    } else if (points >= 1500) {
      return {
        name: 'Platinum (ပလက်တီနမ်အဆင့်)',
        color: 'text-teal-400 border-teal-500 bg-teal-500/10',
        badge: '🛡️ Plat',
        nextPoints: 3000,
        prevPoints: 1500,
        desc: 'Strong foundational discipline established.'
      };
    } else if (points >= 500) {
      return {
        name: 'Silver (ငွေရောင်အဆင့်)',
        color: 'text-slate-300 border-slate-400 bg-slate-400/5',
        badge: '🥈 Silver',
        nextPoints: 1500,
        prevPoints: 500,
        desc: 'Rising consistent action-taker.'
      };
    } else {
      return {
        name: 'Bronze (ကြေးဝါအဆင့်)',
        color: 'text-amber-600 border-amber-700 bg-amber-700/5',
        badge: '🥉 Bronze',
        nextPoints: 500,
        prevPoints: 0,
        desc: 'Discipline apprentice. Keep building active assets.'
      };
    }
  };

  const currentTier = getTierInfo(totalPoints);
  const nextTierProgress = currentTier.nextPoints === Infinity 
    ? 100 
    : Math.min(100, Math.max(0, ((totalPoints - currentTier.prevPoints) / (currentTier.nextPoints - currentTier.prevPoints)) * 100));

  // Tiers definition for rank showcase cards
  const tiersShowcase = [
    { name: 'Bronze', req: '0+ PTS', badge: '🥉', color: 'border-amber-700/30 text-amber-600 bg-amber-700/5' },
    { name: 'Silver', req: '500+ PTS', badge: '🥈', color: 'border-slate-700 text-slate-300 bg-slate-400/5' },
    { name: 'Platinum', req: '1,500+ PTS', badge: '🛡️', color: 'border-teal-700/40 text-teal-400 bg-teal-500/5' },
    { name: 'Diamond', req: '3,000+ PTS', badge: '💠', color: 'border-sky-700/40 text-sky-400 bg-sky-500/5' },
    { name: 'Crown', req: '5,000+ PTS', badge: '💎', color: 'border-violet-700/40 text-violet-400 bg-violet-500/5' },
    { name: 'Ace', req: '8,000+ PTS', badge: '⭐️', color: 'border-rose-700/40 text-rose-400 bg-rose-500/5' },
    { name: 'Conqueror', req: '12,000+ PTS', badge: '👑', color: 'border-amber-500/40 text-amber-400 bg-amber-500/5' },
  ];

  // Prediction win count
  const wonPredictions = predictions.filter(p => p.status === 'WON').length;
  const totalCompletedPredictions = predictions.filter(p => p.status !== 'PENDING').length;
  const winRatio = totalCompletedPredictions > 0 
    ? Math.round((wonPredictions / totalCompletedPredictions) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: POINT TOTALS & LONG PREDICTORS PORTFOLIO (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* HERO STATUS HUD */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-6 rounded-xl relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -z-10"></div>
          
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">INDEX PORTFOLIO POINTS</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl font-black text-white tracking-tight leading-none">
                  {totalPoints.toLocaleString()}
                </span>
                <span className="text-emerald-400 font-bold font-sans text-xs tracking-wide">PTS AVAILABLE</span>
              </div>
            </div>

            {/* Visual rank badge */}
            <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 ${currentTier.color} transition-all`}>
              <span className="text-2xl">{currentTier.badge.split(' ')[0]}</span>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-wider">CURRENT RANK</span>
                <span className="font-sans font-bold text-xs">{currentTier.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Progress bar to next rank */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>PROGRESS TO NEXT TIER</span>
              <span>
                {currentTier.nextPoints === Infinity 
                  ? 'MAX TIER REACHED' 
                  : `${totalPoints.toLocaleString()} / ${currentTier.nextPoints.toLocaleString()} PTS`}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full border border-slate-800/80 overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                style={{ width: `${nextTierProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              "{currentTier.desc}"
            </p>
          </div>
        </div>

        {/* FUTURE BETS TERMINAL HAS BEEN MOVED UNDER THE MAIN CHART */}
        <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-xl flex flex-col gap-2.5">
          <h4 className="text-white text-xs font-bold uppercase tracking-wider">
            Future Predictor Terminal Moved
          </h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The Interactive Future Betting Terminal has been moved to the bottom of the main Candlestick Chart on the **Dashboard** for an integrated trading and tracking experience. Bet directly on your index performance!
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: QUARTERLY TIER RANKINGS & BADGES (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* DISCIPLINE GUARD & ANTI-EXPLOIT SYSTEM */}
        <div className="bg-slate-950/50 border border-emerald-500/30 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          
          <div className="border-b border-slate-800/60 pb-2 flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="font-sans font-bold text-emerald-400 text-sm flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Integrity Shield (စနစ်တကျထိန်းချုပ်မှုစနစ်)
              </h3>
              <span className="text-[9px] text-slate-500 block mt-0.5">Rank & Points Anti-Exploit Guard</span>
            </div>
            <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
              ACTIVE
            </span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Rankings and points are secured against cheat vectors (such as adding multiple dummy habits or manually inflating points) with the following real-time rule layers:
          </p>

          <div className="flex flex-col gap-3.5 mt-1">
            {/* 1. Weekly Discipline Consistency (KD Style) */}
            {(() => {
              const todayStr = pointsHistory[0]?.date ?? new Date().toISOString().split('T')[0];
              let totalOpportunities = 0;
              let totalCompletions = 0;
              for (let i = 0; i < 7; i++) {
                const checkDateObj = new Date();
                checkDateObj.setDate(checkDateObj.getDate() - i);
                const checkDateStr = checkDateObj.toISOString().split('T')[0];
                const activeHabits = habits.filter(h => h.createdDate <= checkDateStr && (!h.archived || !h.archivedDate || h.archivedDate > checkDateStr));
                activeHabits.forEach(h => {
                  totalOpportunities++;
                  if (h.history[checkDateStr] === true) {
                    totalCompletions++;
                  }
                });
              }
              const consistency = totalOpportunities === 0 ? 100 : Math.round((totalCompletions / totalOpportunities) * 100);
              const isBonus = consistency >= 90;
              const isPenalty = consistency < 50;

              return (
                <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-800/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                      Weekly consistency (K/D Win-rate)
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isBonus ? 'bg-emerald-500/10 text-emerald-400' :
                      isPenalty ? 'bg-red-500/10 text-red-400 animate-pulse' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {consistency}% K/D
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isBonus && <span className="text-emerald-400 font-bold block">🔥 1.2x Win-streak Bonus is Active! (+20% reward points)</span>}
                    {isPenalty && <span className="text-red-400 font-bold block">⚠️ 1.5x Loss-streak Penalty is Active! (+50% point deducts on slips)</span>}
                    {(!isBonus && !isPenalty) && "Maintain >90% for a 1.2x points bonus streak. Dropping under 50% consistency inflicts a 1.5x penalty."}
                  </p>
                </div>
              );
            })()}

            {/* 2. Tier-Based Miss Penalty Factor */}
            {(() => {
              const getTierPenaltyMultiplier = (pts: number) => {
                if (pts < 500) return { name: 'Bronze', mult: '30%', desc: 'Newbie Protection' };
                if (pts < 1500) return { name: 'Silver', mult: '30%', desc: 'Newbie Protection' };
                if (pts < 3000) return { name: 'Platinum', mult: '80%', desc: 'Standard Rank' };
                if (pts < 5000) return { name: 'Diamond', mult: '80%', desc: 'High Standard' };
                if (pts < 8000) return { name: 'Crown', mult: '120%', desc: 'Elite Rank Penalty' };
                if (pts < 12000) return { name: 'Ace', mult: '130%', desc: 'Extreme Rank Penalty' };
                return { name: 'Conqueror', mult: '150%', desc: 'Legendary Rank Penalty' };
              };
              const penaltyInfo = getTierPenaltyMultiplier(totalPoints);

              return (
                <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-800/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-violet-400" />
                      Tier-Based Miss Penalty Factor
                    </span>
                    <span className="text-[10px] font-mono bg-violet-500/10 text-violet-400 font-bold px-1.5 py-0.5 rounded">
                      {penaltyInfo.mult} Penalty ({penaltyInfo.name})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Higher seasonal ranks face heavier penalties. Bronze/Silver only lose 30% on misses, while Crown/Ace/Conqueror suffer 120%-150% drops!
                  </p>
                </div>
              );
            })()}

            {/* 3. Maximum Risk Exposure Gauge */}
            {(() => {
              const activeCount = habits.filter(h => !h.archived).length;
              let riskLevel = 'Low Risk';
              let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
              let gaugePercent = 30;
              if (activeCount >= 8) {
                riskLevel = 'Extreme High Volatility';
                riskColor = 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse';
                gaugePercent = 100;
              } else if (activeCount >= 5) {
                riskLevel = 'Moderate Risk';
                riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                gaugePercent = 65;
              }

              return (
                <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-800/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Maximum Risk Exposure Gauge
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${riskColor}`}>
                      {riskLevel} ({activeCount} Habits)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800/50 mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeCount >= 8 ? 'bg-gradient-to-r from-amber-500 to-red-500' :
                        activeCount >= 5 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' :
                        'bg-emerald-400'
                      }`}
                      style={{ width: `${gaugePercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Farming points by adding too many active habits (8+) triggers extreme risk. While index growth is rapid, any single missed habit will cause catastrophic drops!
                  </p>
                </div>
              );
            })()}

            {/* 4. Daily Cap & spec limit */}
            <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-800/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Daily Points Cap (တစ်နေ့တာအမှတ် ကန့်သတ်ချက်)
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {Math.min(250, pointsHistory.filter(p => p.date === (pointsHistory[0]?.date ?? '') && p.type === 'HABIT_COMPLETE').reduce((sum, p) => sum + p.points, 0))} / 250 PTS
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-800/50">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (pointsHistory.filter(p => p.date === (pointsHistory[0]?.date ?? '') && p.type === 'HABIT_COMPLETE').reduce((sum, p) => sum + p.points, 0) / 250) * 100)}%` 
                  }}
                ></div>
              </div>
              <span className="text-[9px] text-slate-500 font-sans italic">
                * Limits maximum points earned from checklists to **250 PTS per day** to stop dummy habit farming.
              </span>
            </div>
          </div>
        </div>

        {/* PUBG RANKING TIER LIST */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex flex-col gap-4">
          <div className="border-b border-slate-800/60 pb-2">
            <h3 className="font-sans font-bold text-white text-md flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Gamified Seasonal Rankings (PUBG-Style)
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">Quarterly Rank Badges & Rewards</span>
          </div>

          <div className="flex flex-col gap-2">
            {tiersShowcase.map((t) => {
              const isCurrentRank = currentTier.name.includes(t.name);
              const pointsNeeded = parseInt(t.req.replace(/\D/g, ''));
              const isUnlocked = totalPoints >= pointsNeeded;

              return (
                <div 
                  key={t.name}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrentRank 
                      ? 'bg-slate-800/40 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                      : isUnlocked 
                        ? 'border-slate-800/80 bg-slate-900/10 opacity-75' 
                        : 'border-slate-900 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.badge}</span>
                    <div className="flex flex-col">
                      <span className={`font-sans text-xs font-bold ${isCurrentRank ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {t.name} Tier {isCurrentRank && '(Current)'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Requires {t.req}</span>
                    </div>
                  </div>

                  <div>
                    {isCurrentRank ? (
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
                    ) : isUnlocked ? (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">Unlocked</span>
                    ) : (
                      <span className="text-[9px] text-slate-600 uppercase">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT POINTS TRANSACTION LOG */}
        <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md p-5 rounded-xl flex-1 flex flex-col gap-4">
          <div className="border-b border-slate-800/60 pb-2 flex justify-between items-center">
            <h3 className="font-sans font-bold text-white text-md flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Points Transaction History (မှတ်တမ်း)
            </h3>
            <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold">LIVE STREAM</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {pointsHistory.map((item) => {
              const isPositive = item.points >= 0;

              return (
                <div 
                  key={item.id}
                  className="bg-slate-900/15 border border-slate-900/50 p-2.5 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-0.5 truncate flex-1">
                    <span className="text-slate-200 font-sans text-[11px] font-medium leading-tight truncate">
                      {item.description}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {item.date} • {item.type}
                    </span>
                  </div>

                  <span className={`font-mono text-xs font-bold shrink-0 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{item.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
