import { useState } from 'react';
import { 
  TrendingUp, 
  Award, 
  Zap, 
  Clock, 
  Shield, 
  Activity, 
  Flame, 
  Sparkles, 
  X, 
  ChevronRight, 
  Coins, 
  BarChart3, 
  Target, 
  BookOpen,
  CheckCircle2,
  LineChart,
  Info,
  Globe,
  Calendar
} from 'lucide-react';
import { getTierInfo } from '../utils/financeEngine';
import { motion, AnimatePresence } from 'motion/react';

interface IntroPageProps {
  onClose: () => void;
  currentPoints: number;
}

// Comprehensive professional-grade bilingual dictionary
const translations = {
  en: {
    heroTag: "🚀 REIMAGINING PERSONAL ACCOUNTABILITY",
    heroTitle: "BET ON YOURSELF WITH",
    heroTitleHighlight: "ABSOLUTE DISCIPLINE",
    heroDesc: "Bet On Me is the first Gamified Habit Terminal that transforms your daily consistency into tradeable equity index. Watch your habits chart like real stock tickers, predict your growth margins, apply custom leverage, and unlock premium PUBG-style ranks.",
    startBtn: "Start Habit Trading Now",
    seeHowBtn: "See Core Mechanics",
    closeTour: "Close System Tour",
    
    pillar1Title: "100% Habit Candlestick Charts",
    pillar1Desc: "Your daily execution forms real financial candlesticks (Open, High, Low, Close). Checking off habits creates a massive Bullish green surge; missing them triggers a Bearish red gap.",
    
    pillar2Title: "Interactive Predictor Terminal",
    pillar2Desc: "Wager points on your 1, 3, or 7-day habit streaks. Amplify rewards by selecting up to 15x leverage multipliers, but manage risk to prevent portfolio liquidation.",
    
    pillar3Title: "Rank Promotion Challenges",
    pillar3Desc: "Uniquely designed PUBG-style ranks (Bronze to Conqueror). Leveling up unlocks high leverage and limits, but demands intense accountability with higher penalty rates.",
    
    featuresTitle: "System Operations & Protocols",
    featuresSub: "A detailed breakdown of the custom algorithms governing your terminal account.",
    
    tabChart: "1. Candlestick Index Price",
    tabChartDesc: "Asset weights, Doji & Bullish candle calculations",
    tabPredict: "2. Predictor & Leverage",
    tabPredictDesc: "Staking contracts, target thresholds, & margin calls",
    tabRanks: "3. PUBG-Style Rank Levels",
    tabRanksDesc: "Unlockable leverage, wager limits, & penalty rates",
    tabRules: "4. Localized Schedule Graces",
    tabRulesDesc: "Night Owl offsets, Weekend mode, & Custom Days",
    
    // Feature detailed panels
    feat1Title: "Real-Time Habit Index Asset Engine",
    feat1Desc: "Every habit you declare acts as a high-fidelity 'Habit Asset' in your index. They carry custom risk levels (Low, Medium, High) affecting daily index volatility. Checking off a 'Best To Do' asset results in a massive price spike, while neglecting key responsibilities triggers an immediate margin collapse.",
    feat1Sub1: "All Habits Completed (100% Consistency)",
    feat1Sub1Desc: "🟢 Bullish Candle: Intense close price surge + dynamic daily points bonus credited.",
    feat1Sub2: "Partial Habits Completed (40% - 80% Consistency)",
    feat1Sub2Desc: "🟡 Doji / Sideways Candle: Minimal price fluctuations, standard market balance.",
    feat1Sub3: "Zero Habits Completed (0% Consistency)",
    feat1Sub3Desc: "🔴 Bearish Candle: Heavy intraday market dump + automatic Miss Penalty deduction.",
    feat1Tip: "You can toggle technical overlay indicators like SMA (Simple Moving Average) and EMA (Exponential Moving Average) directly in your Settings tab.",
    
    feat2Title: "Interactive Predictor Terminal with Custom Leverage",
    feat2Desc: "Do you trust your consistency? Put real skin in the game! Stake points on your own execution over selected timeframes. Apply high leverage multipliers to scale up rewards, but be careful—falling below target triggers immediate margin liquidation.",
    feat2Low: "LOW RISK",
    feat2LowTitle: "1-Day Quick Scalp",
    feat2LowDesc: "1% Growth Target / +15% Base Bonus / Low leverage cap",
    feat2Med: "MED RISK",
    feat2MedTitle: "3-Day Swing Trade",
    feat2MedDesc: "4% Growth Target / +45% Base Bonus / Perfect risk-reward balance",
    feat2High: "HIGH RISK",
    feat2HighTitle: "7-Day Ultimate Run",
    feat2HighDesc: "10% Growth Target / +150% Base Bonus / Ultimate commitment",
    feat2Tip: "Liquidation events automatically write off wagered points and log transactions inside your Account Ledger.",
    
    feat3Title: "PUBG-Style Rank Tiers & Miss Penalties",
    feat3Desc: "Your points represent your ultimate trading capital. Accumulating points moves you up the ranks. High ranks grant elite terminal rights, including increased max bet limits and leverage multipliers. However, high-tier traders face strict scrutiny: the penalty percentage multiplier for missed habits scales significantly.",
    feat3ColRank: "Rank & Status",
    feat3ColLimits: "Max Bet / Leverage",
    feat3ColPenalty: "Penalty Multiplier",
    feat3ColRange: "Points Bracket",
    feat3Bronze: "🥉 Bronze (ကြေးဝါ)",
    feat3Silver: "🥈 Silver (ငွေ)",
    feat3Gold: "🥇 Gold (ရွှေ)",
    feat3Plat: "💎 Platinum (ပလက်တီနမ်)",
    feat3Diamond: "💠 Diamond (စိန်)",
    feat3Crown: "👑 Crown (သရဖူ)",
    feat3Conq: "🌟 Conqueror (အနိုင်ရသူ)",
    feat3Tip: "Reaching the end of a tier locks your points and triggers a 3-Day Promotion Match. You must maintain 75% consistency for 3 days to confirm rank promotion.",
    
    feat4Title: "Localized Schedule Controls for Real Lifestyles",
    feat4Desc: "Your terminal adapts to your life, not the other way around. Configure advanced scheduling controls to protect your streak score during intense weeks.",
    feat4OwlTitle: "Night Owl Grace Hour Offset",
    feat4OwlDesc: "Shift your daily day boundary from 12:00 AM up to 4:00 AM. Keep logging habits past midnight without breaking your daily streak.",
    feat4WeekendTitle: "Weekend Protection Mode",
    feat4WeekendDesc: "Exclude Saturday and Sunday from missed-habit penalty audits. Ideal for maintaining a healthy rest-work balance.",
    feat4SelectiveTitle: "Selective Custom Days",
    feat4SelectiveDesc: "Configure habits to trigger only on specific days (e.g., gym on Mon/Wed/Fri). Days off are automatically treated as rest periods without penalizing your score.",
    
    progTitle: "Progression Ladder & Rewards",
    progSub: "Compare your current standing with the elite ranks. Can you reach the Conqueror tier?",
    yourRank: "Your Active Rank",
    
    guideTitle: "Four Steps to Master the Terminal",
    guideSub: "Quick start roadmap to build financial-style discipline.",
    step1Title: "1. Asset Deployment",
    step1Desc: "Go to the Assets Tab and declare your habits. Configure risk levels, custom days, and points weightings.",
    step2Title: "2. Daily Execution",
    step2Desc: "Carry out your routine. Mark habits on the live checklist in the Overview tab before your day boundary closes.",
    step3Title: "3. Chart Auditing",
    step3Desc: "Analyze your performance on the Candlestick Chart. Monitor market trends, moving averages, and index volatility.",
    step4Title: "4. Leveraged Betting",
    step4Desc: "Wager points in the Predictor Terminal. Boost consistency through real skin-in-the-game stakes.",
    
    readyTitle: "System Online & Authorized",
    readyDesc: "Take control of your execution. Put skin in the game, trade your habits, and maximize your performance portfolio today.",
  },
  my: {
    heroTag: "🚀 စည်းကမ်းကို နည်းပညာအသွင်ပြောင်းလဲခြင်း",
    heroTitle: "ကိုယ့်ကိုယ်ကိုယ် ပြန်လည်",
    heroTitleHighlight: "လောင်းကြေးထပ်ပါ",
    heroDesc: "Bet On Me သည် သင့်လုပ်ဆောင်ရမည့် နေ့စဉ်အလေ့အကျင့်များကို အဖိုးတန် Asset ရှယ်ယာများအဖြစ် ပြောင်းလဲပေးသည့် ပထမဆုံး Gamified Habit Terminal ဖြစ်သည်။ စတော့ရှယ်ယာဈေးကွက်ပုံစံ Candlestick ဇယားများဖြင့် performance အတက်အကျကို စောင့်ကြည့်ပြီး၊ ရရှိလာသည့် points များကို Leverage တင်ကာ ခန့်မှန်းချက်များဖြင့် တိုးပွားအောင် ကစားနိုင်မည်ဖြစ်သည်။",
    startBtn: "စတင်အသုံးပြုမည်",
    seeHowBtn: "လုပ်ဆောင်ပုံအသေးစိတ်",
    closeTour: "လမ်းညွှန်ပိတ်မည်",
    
    pillar1Title: "100% Habit Candlestick Charts",
    pillar1Desc: "နေ့စဉ် checklist ပြီးမြောက်မှုများကို စတော့ရှယ်ယာများကဲ့သို့ Open, High, Low, Close ဇယားများဖြင့် ပြသပေးသည်။ ပြီးမြောက်ပါက အစိမ်းရောင် Bullish Candle တက်မည်ဖြစ်ပြီး ပျက်ကွက်ပါက အနီရောင် Bearish ဖြစ်သွားပါမည်။",
    
    pillar2Title: "Interactive Predictor Terminal",
    pillar2Desc: "သင့်ရဲ့ အနာဂတ်စည်းကမ်းအပေါ် Points များဖြင့် လောင်းကြေးထပ်ပါ။ Leverage ကို ၁၅ ဆအထိ တိုးမြှင့်တင်ပြီး Predictor Terminal တွင် Bonus Points ဆုများကို ဆတိုး တိုးမြင့်ရယူနိုင်ပါသည်။",
    
    pillar3Title: "Rank Promotion Challenges",
    pillar3Desc: "ရမှတ်စုဆောင်းပြီး Bronze မှ Conqueror အဆင့်အထိ တက်လှမ်းပါ။ Rank မြင့်လာပါက Max Bet ပမာဏနှင့် Leverage Multipliers များ ပိုမိုရရှိမည်ဖြစ်သော်လည်း Miss Penalty ဒဏ်ကြေး ပိုများလာပါမည်။",
    
    featuresTitle: "System Operations & Protocols",
    featuresSub: "Habit Terminal ၏ လုပ်ဆောင်ပုံစနစ်တစ်ခုချင်းစီကို အသေးစိတ် ဖော်ပြပေးထားပါသည်။",
    
    tabChart: "၁။ Candlestick Index Price",
    tabChartDesc: "Asset ဈေးနှုန်းနှင့် Doji & Bullish Candle တွက်ချက်ပုံ",
    tabPredict: "၂။ Predictor & Leverage",
    tabPredictDesc: "Points စုဆောင်းမှုနှင့် Risk Level စီမံခန့်ခွဲမှု",
    tabRanks: "၃။ PUBG-Style Rank Tiers",
    tabRanksDesc: "Bronze မှ Conqueror အဆင့်သတ်မှတ်ချက်များ",
    tabRules: "၄။ Night Owl & Custom Days",
    tabRulesDesc: "အိပ်ချိန်နောက်ကျသူများနှင့် သီးသန့်ရက်ရွေးချယ်မှု",
    
    // Feature detailed panels
    feat1Title: "Real-Time Habit Index Asset Engine",
    feat1Desc: "သင့်ရဲ့ အလေ့အကျင့်တစ်ခုစီဟာ ရိုးရိုးသက်သက် checklist မဟုတ်တော့ပါဘူး။ ၎င်းတို့ဟာ နေ့စဥ် ဈေးနှုန်းတက်လှမ်းစေမည့် အဖိုးတန် Asset များဖြစ်ကြသည်။ အလေ့အကျင့်တစ်ခုချင်းစီ၏ Risk Level (Low, Medium, High) ပေါ်မူတည်၍ Intraday Volatility (ဈေးနှုန်းအတက်အကျ) အား သက်ရောက်စေမည်ဖြစ်သည်။ အရေးကြီးသော 'Best To Do' အလေ့အကျင့် ပျက်ကွက်ပါက Margin Crash ကဲ့သို့ ဈေးနှုန်းထိုးကျသွားစေမည်။",
    feat1Sub1: "အလေ့အကျင့်အားလုံး ပြီးမြောက်ပါက (100% Consistency)",
    feat1Sub1Desc: "🟢 Bullish Candle: ဈေးနှုန်းအဆမတန်မြင့်တက်ပြီး Bonus Points များ ရရှိပါမည်။",
    feat1Sub2: "၄၀% မှ ၈၀% အထိ ပြီးမြောက်ပါက",
    feat1Sub2Desc: "🟡 Doji / Sideways Candle: ဈေးနှုန်းငြိမ်နေပြီး အပြောင်းအလဲနည်းပါးမည်။",
    feat1Sub3: "လုံးဝ ပျက်ကွက်ပါက (0% Consistency)",
    feat1Sub3Desc: "🔴 Bearish Candle: ဈေးနှုန်းထိုးကျပြီး Miss Penalty ဒဏ်ကြေး နုတ်ယူခြင်းခံရမည်။",
    feat1Tip: "Settings tab ထဲတွင် SMA (Simple Moving Average) နှင့် EMA (Exponential Moving Average) ကဲ့သို့သော အဆင့်မြင့် Technical Indicators များကို ဖွင့်ပိတ်နိုင်ပါသည်။",
    
    feat2Title: "Interactive Predictor Terminal with Custom Leverage",
    feat2Desc: "ကိုယ့်ရဲ့ အလေ့အကျင့် လိုက်နာနိုင်စွမ်းပေါ်မှာ ယုံကြည်မှုရှိလား? Predictor Terminal တွင် ၁ ရက်၊ ၃ ရက် သို့မဟုတ် ၇ ရက်အထိ consistency growth ခန့်မှန်းချက်များကို points များဖြင့် လောင်းကြေးထပ်ပါ။ Leverage (အကြွေးမြှောက်ဖော်ကိန်း) ကို တိုးမြှင့်အသုံးပြုပြီး ရရှိမည့် အပို bonus points ဆုများကို အဆပေါင်းများစွာ တိုးမြင့်ရယူနိုင်သည်။ Target မပြည့်ပါက Liquidate ဖြစ်ပြီး points ဆုံးရှုံးပါမည်။",
    feat2Low: "LOW RISK",
    feat2LowTitle: "1-Day Quick Scalp",
    feat2LowDesc: "1% Target / +15% Base Bonus / Leverage အနိမ့်ဆုံး",
    feat2Med: "MEDIUM RISK",
    feat2MedTitle: "3-Day Swing Trade",
    feat2MedDesc: "4% Target / +45% Base Bonus / အကောင်းဆုံးမျှတမှုရှိသောစနစ်",
    feat2High: "HIGH RISK",
    feat2HighTitle: "7-Day Ultimate Run",
    feat2HighDesc: "10% Target / +150% Base Bonus / ခြေရာခံမှုအပြည့်အဝဖြင့် တာဝန်ခံမှုအမြင့်ဆုံး",
    feat2Tip: "Liquidate ဖြစ်သွားသော points များအား Account Ledger (ငွေစာရင်း) ထဲတွင် ချက်ချင်းမှတ်တမ်းတင် နုတ်ယူသွားပါမည်။",
    
    feat3Title: "PUBG-Style Rank Tiers & Miss Penalties",
    feat3Desc: "သင့်ရဲ့စုစုပေါင်းရမှတ်များသည် သင့်၏ Account Rank အဆင့်ကို ဆုံးဖြတ်သည်။ Rank Level မြင့်မားလာပါက Predictor တွင် Max Bet ပိုတင်နိုင်ပြီး Leverage ပိုသုံးနိုင်မည်ဖြစ်သော်လည်း၊ တာဝန်ယူမှုပိုမိုရှိလာစေရန် အလေ့အကျင့်ပျက်ကွက်မှုအတွက် Miss Penalty factor ပိုများလာမည်ဖြစ်သည်။",
    feat3ColRank: "Rank & Badge",
    feat3ColLimits: "Max Bet / Leverage",
    feat3ColPenalty: "Penalty Multiplier",
    feat3ColRange: "ရမှတ်အပိုင်းအခြား",
    feat3Bronze: "🥉 Bronze Tier (ကြေးဝါ)",
    feat3Silver: "🥈 Silver Tier (ငွေ)",
    feat3Gold: "🥇 Gold Tier (ရွှေ)",
    feat3Plat: "💎 Platinum Tier (ပလက်တီနမ်)",
    feat3Diamond: "💠 Diamond Tier (စိန်)",
    feat3Crown: "👑 Crown Tier (သရဖူ)",
    feat3Conq: "🌟 Conqueror Tier (အနိုင်ရသူ)",
    feat3Tip: "အဆင့်တစ်ခု၏ အမြင့်ဆုံးရမှတ်သို့ ရောက်ရှိပါက၊ နောက်တစ်ဆင့်သို့တက်လှမ်းရန် ၃ ရက်ကြာ ၇၅% consistency ကျော်လွန်ရမည့် Rank Promotion Match ကို ဖြတ်ကျော်ရပါမည်။ ရမှတ်များ ခဏ lock ဖြစ်နေပါမည်။",
    
    feat4Title: "Localized Schedule Controls for Real Lifestyles",
    feat4Desc: "လူတိုင်းသည် အချိန်ဇယားတစ်ခုတည်းနှင့် အသက်ရှင်သည်မဟုတ်ပါ။ သင့်နေ့စဉ်လူနေမှုဘဝနှင့် လိုက်လျောညီထွေဖြစ်စေရန် timing control စနစ်များကို ထည့်သွင်းပေးထားပါသည်။",
    feat4OwlTitle: "Night Owl Grace Hour Offset",
    feat4OwlDesc: "မနက်မိုးလင်းခါနီးအထိ ယမန်နေ့အတွက် tick ပေးနိုင်ရန် နေ့အကူးအပြောင်းအချိန်ကို 12 AM မှ 4 AM အထိ ရွှေ့ဆိုင်းသတ်မှတ်နိုင်သည်။ Streak မပြတ်စေရန် ကာကွယ်ပေးသည်။",
    feat4WeekendTitle: "Weekend Protection Mode",
    feat4WeekendDesc: "စနေ၊ တနင်္ဂနွေရက်များတွင် အပန်းဖြေအနားယူနိုင်ရန် Miss Penalty ဒဏ်ကြေး သက်ရောက်မှုမရှိအောင် ပိတ်ထားနိုင်သည်။",
    feat4SelectiveTitle: "Selective Custom Days",
    feat4SelectiveDesc: "အလေ့အကျင့်တစ်ခုချင်းစီကို သတ်မှတ်ထားသောနေ့များတွင်သာ စစ်ဆေးရန် ရွေးချယ်နိုင်သည်။ (ဥပမာ - Gym အား Mon/Wed/Fri သာဆော့ရန်)။ ကျန်ရက်များတွင် rest day အဖြစ် အလိုအလျောက် သတ်မှတ်ပေးသည်။",
    
    progTitle: "Progression Ladder & Rewards",
    progSub: "သင့်ရဲ့ လက်ရှိ Rank နှင့် ရှေ့ဆက်တက်လှမ်းရမည့် အဆင့်များကို နှိုင်းယှဉ်လေ့လာပါ။",
    yourRank: "သင့်လက်ရှိ Rank",
    
    guideTitle: "၁-၂-၃-၄ လွယ်ကူသော စတင်မှုလမ်းညွှန်",
    guideSub: "Habit Terminal အား ကျွမ်းကျင်စွာ အသုံးပြုနိုင်ရန် အခြေခံလမ်းညွှန်ချက်များ။",
    step1Title: "၁။ Asset သတ်မှတ်ရန်",
    step1Desc: "Assets Tab သို့သွားပြီး ခြေရာခံလိုသော Habits များကို ထည့်သွင်းပါ။ Risk Levels နှင့် Active Days များကို လွတ်လပ်စွာ သတ်မှတ်ပါ။",
    step2Title: "၂။ နေ့စဉ် လုပ်ဆောင်ရန်",
    step2Desc: "သတ်မှတ်ထားသောအလေ့အကျင့်များကို လုပ်ဆောင်ပြီး Overview Tab ရှိ live checklist တွင် ပြီးမြောက်ကြောင်း mark ပေးပါ။",
    step3Title: "၃။ ဇယားများ စောင့်ကြည့်ရန်",
    step3Desc: "Candlestick Chart တွင် သင့်တိုးတက်မှု အပိတ်ဈေးအတက်အကျ၊ SMA/EMA indicators များနှင့် trends များကို လေ့လာပါ။",
    step4Title: "၄။ Predict Option စမ်းသပ်ရန်",
    step4Desc: "ရရှိလာသော Points များကို အသုံးပြု၍ Predictor တွင် စိန်ခေါ်မှုများရယူပြီး bonus points များ အဆမတန် စုဆောင်းပါ။",
    
    footerTxt: "Bet On Me Terminal • Professional Consistency System v1.5.0 • Crafted for high-performance builders.",
    readyTitle: "စနစ် အဆင်သင့်ဖြစ်ပါပြီ",
    readyDesc: "ကိုယ့်ကိုယ်ကိုယ် တာဝန်ယူမှုအပြည့်ဖြင့် ရင်းနှီးမြှုပ်နှံလိုက်ပါ။ ယနေ့မှစတင်၍ သင်၏ Habits များကို စတင်ပြီးမြောက်အောင် လုပ်ဆောင်ပါ။",
  }
};

export default function IntroPage({ onClose, currentPoints }: IntroPageProps) {
  const [lang, setLang] = useState<'en' | 'my'>('my');
  const [activeFeatureTab, setActiveFeatureTab] = useState<'chart' | 'predictions' | 'rankings' | 'schedule'>('chart');
  
  // Showcase all available ranks dynamically
  const showcasePoints = [0, 600, 2000, 3500, 6000, 9000, 13000];
  const allTiers = showcasePoints.map(p => getTierInfo(p));

  const t = translations[lang];

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  const badgeNameMap = {
    'Bronze (ကြေးဝါအဆင့်)': t.feat3Bronze,
    'Silver (ငွေရောင်အဆင့်)': t.feat3Silver,
    'Gold (ရွှေရောင်အဆင့်)': t.feat3Gold,
    'Platinum (ပလက်တီနမ်အဆင့်)': t.feat3Plat,
    'Diamond (စိန်အဆင့်)': t.feat3Diamond,
    'Crown (သရဖူအဆင့်)': t.feat3Crown,
    'Conqueror (အနိုင်ရသူအဆင့်)': t.feat3Conq,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl overflow-y-auto text-slate-200 antialiased font-sans flex flex-col pb-12">
      {/* GLOWING AMBIENT BACKGROUNDS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[800px] right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* STICKY TOP FLOATING NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-amber-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-sans font-black text-sm tracking-widest text-white uppercase">
                BET ON ME
              </h1>
              <span className="font-mono text-[9px] text-emerald-400 tracking-wider uppercase font-extrabold">
                The Gamified Asset Terminal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Bilingual Switcher Widget */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  lang === 'en'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('my')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  lang === 'my'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                မြန်မာ
              </button>
            </div>

            <button 
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/30 text-xs text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer group"
            >
              <X className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-300" />
              <span className="font-bold">{t.closeTour}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-6 pt-16 pb-14 text-center max-w-4xl mx-auto flex flex-col items-center gap-6"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-mono uppercase tracking-widest font-black animate-pulse">
          <Sparkles className="w-3 h-3 text-amber-400" /> {t.heroTag}
        </div>

        <h2 className="font-sans font-black text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] max-w-3xl">
          {t.heroTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300">{t.heroTitleHighlight}</span>
        </h2>

        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mt-1">
          {t.heroDesc}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
          >
            {t.startBtn}
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center cursor-pointer"
          >
            {t.seeHowBtn}
          </motion.a>
        </div>
      </motion.section>

      {/* THREE EXCLUSIVE PILLARS HERO BANNER */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="px-6 py-8 max-w-7xl w-full mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base font-sans">{t.pillar1Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              {t.pillar1Desc}
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl w-fit">
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-white font-bold text-base font-sans">{t.pillar2Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              {t.pillar2Desc}
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-cyan-500/30 transition-all shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl w-fit">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base font-sans">{t.pillar3Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              {t.pillar3Desc}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* CORE FEATURES DETAILED SHOWCASE */}
      <section id="how-it-works" className="px-6 py-12 max-w-7xl w-full mx-auto border-t border-slate-900/80 scroll-mt-20">
        <div className="flex flex-col items-center text-center gap-2 mb-10">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black">App Protocols</span>
          <h2 className="font-sans font-black text-2xl md:text-3xl text-white">
            {t.featuresTitle}
          </h2>
          <p className="text-slate-400 text-xs max-w-lg leading-relaxed">
            {t.featuresSub}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Feature Buttons Selector */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            {[
              { id: 'chart', title: t.tabChart, desc: t.tabChartDesc, icon: LineChart },
              { id: 'predictions', title: t.tabPredict, desc: t.tabPredictDesc, icon: Coins },
              { id: 'rankings', title: t.tabRanks, desc: t.tabRanksDesc, icon: Award },
              { id: 'schedule', title: t.tabRules, desc: t.tabRulesDesc, icon: Clock },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = activeFeatureTab === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeatureTab(f.id as any)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 relative overflow-hidden ${
                    isSelected 
                      ? 'bg-slate-900 border-emerald-500/40 text-emerald-400 shadow-md ring-1 ring-emerald-500/20' 
                      : 'bg-slate-950/20 border-slate-900 hover:border-slate-800/80 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {isSelected && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black font-sans uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {f.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Panel View */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col gap-5 min-h-[380px] justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-slate-800/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <AnimatePresence mode="wait">
              {activeFeatureTab === 'chart' && (
                <motion.div 
                  key="chart"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black">MODULE 01</span>
                    <h3 className="text-white font-sans font-black text-lg">
                      {t.feat1Title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">
                      {t.feat1Desc}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 flex flex-col gap-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Habit Completion Level' : 'အလေ့အကျင့် ပြီးမြောက်မှု အတိုင်းအတာ'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Index Candlestick Output' : 'ဈေးကွက်တန်ဖိုး အကျိုးသက်ရောက်မှု'}</span>
                    </div>
                    
                    <div className="flex justify-between items-start text-[11px] gap-4">
                      <span className="text-emerald-400 flex items-center gap-1.5 shrink-0">🟢 {t.feat1Sub1}</span>
                      <span className="text-emerald-400 font-medium text-right">{t.feat1Sub1Desc}</span>
                    </div>
                    <div className="flex justify-between items-start text-[11px] gap-4 border-t border-slate-900 pt-2">
                      <span className="text-amber-400 flex items-center gap-1.5 shrink-0">🟡 {t.feat1Sub2}</span>
                      <span className="text-slate-300 font-medium text-right">{t.feat1Sub2Desc}</span>
                    </div>
                    <div className="flex justify-between items-start text-[11px] gap-4 border-t border-slate-900 pt-2">
                      <span className="text-rose-400 flex items-center gap-1.5 shrink-0">🔴 {t.feat1Sub3}</span>
                      <span className="text-rose-400 font-medium text-right">{t.feat1Sub3Desc}</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start text-[10px] text-slate-500 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{t.feat1Tip}</span>
                  </div>
                </motion.div>
              )}

              {activeFeatureTab === 'predictions' && (
                <motion.div 
                  key="predictions"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-black">MODULE 02</span>
                    <h3 className="text-white font-sans font-black text-lg">
                      {t.feat2Title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">
                      {t.feat2Desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 flex flex-col gap-1.5 text-center relative group hover:border-emerald-500/30 transition-colors">
                      <span className="text-[9px] font-mono text-emerald-400 font-black tracking-wider uppercase">{t.feat2Low}</span>
                      <span className="text-xs text-white font-black">{t.feat2LowTitle}</span>
                      <span className="text-[10px] text-slate-500 leading-normal mt-0.5">{t.feat2LowDesc}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 flex flex-col gap-1.5 text-center relative group hover:border-cyan-500/30 transition-colors">
                      <span className="text-[9px] font-mono text-cyan-400 font-black tracking-wider uppercase">{t.feat2Med}</span>
                      <span className="text-xs text-white font-black">{t.feat2MedTitle}</span>
                      <span className="text-[10px] text-slate-500 leading-normal mt-0.5">{t.feat2MedDesc}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 flex flex-col gap-1.5 text-center relative group hover:border-amber-500/30 transition-colors">
                      <span className="text-[9px] font-mono text-amber-400 font-black tracking-wider uppercase">{t.feat2High}</span>
                      <span className="text-xs text-white font-black">{t.feat2HighTitle}</span>
                      <span className="text-[10px] text-slate-500 leading-normal mt-0.5">{t.feat2HighDesc}</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start text-[10px] text-slate-500 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse mt-0.5" />
                    <span>{t.feat2Tip}</span>
                  </div>
                </motion.div>
              )}

              {activeFeatureTab === 'rankings' && (
                <motion.div 
                  key="rankings"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-violet-400 uppercase tracking-widest font-black">MODULE 03</span>
                    <h3 className="text-white font-sans font-black text-lg">
                      {t.feat3Title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">
                      {t.feat3Desc}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 grid grid-cols-2 gap-2 text-xs font-mono max-h-[220px] overflow-y-auto">
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">{t.feat3ColRank}</span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{t.feat3ColLimits}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">{t.feat3ColPenalty}</span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{t.feat3ColRange}</span>
                    </div>
                    
                    <div className="flex justify-between text-[11px]">
                      <span className="text-amber-600 font-bold">{t.feat3Bronze}</span>
                      <span className="text-slate-300 font-bold">100 PTS / 1x</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-rose-400">30% Weight</span>
                      <span className="text-slate-500">0 - 499 PTS</span>
                    </div>

                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-slate-300 font-bold">🥈 Silver Tier</span>
                      <span className="text-slate-300 font-bold">300 PTS / 2x</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-rose-450">40% Penalty</span>
                      <span className="text-slate-500">500 - 1,199 PTS</span>
                    </div>

                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-amber-500 font-bold">🥇 Gold Tier</span>
                      <span className="text-slate-300 font-bold">500 PTS / 3x</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-rose-450">50% Penalty</span>
                      <span className="text-slate-500">1,200 - 1,999 PTS</span>
                    </div>

                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-sky-400 font-bold">{t.feat3Diamond}</span>
                      <span className="text-slate-300 font-bold">1,500 PTS / 5x</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-rose-400">80% Penalty</span>
                      <span className="text-slate-500">3,000 - 4,999 PTS</span>
                    </div>

                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-amber-400 font-black">{t.feat3Conq}</span>
                      <span className="text-slate-300 font-bold">12,000 PTS / 15x</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-t border-slate-950/60 pt-1">
                      <span className="text-emerald-400 font-bold">150% Penalty</span>
                      <span className="text-slate-500">12,000+ PTS</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start text-[10px] text-slate-500 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900">
                    <Award className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <span>{t.feat3Tip}</span>
                  </div>
                </motion.div>
              )}

              {activeFeatureTab === 'schedule' && (
                <motion.div 
                  key="schedule"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-black">MODULE 04</span>
                    <h3 className="text-white font-sans font-black text-lg">
                      {t.feat4Title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">
                      {t.feat4Desc}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 flex flex-col gap-3 font-sans text-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-[11px]">{t.feat4OwlTitle}</h5>
                        <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">{t.feat4OwlDesc}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 border-t border-slate-900 pt-2.5">
                      <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-[11px]">{t.feat4WeekendTitle}</h5>
                        <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">{t.feat4WeekendDesc}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-t border-slate-900 pt-2.5">
                      <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-[11px]">{t.feat4SelectiveTitle}</h5>
                        <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">{t.feat4SelectiveDesc}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-slate-800/40 pt-4 mt-2 flex justify-between items-center text-[10px] text-slate-500">
              <span>Bet On Me - Built for absolute self-accountability.</span>
              <span className="font-mono text-emerald-400 font-bold">Status: Terminal Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* FULL VISUAL LEVEL SHOWCASE */}
      <section className="px-6 py-12 max-w-7xl w-full mx-auto border-t border-slate-900/80">
        <div className="flex flex-col items-center text-center gap-2 mb-10">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black font-extrabold">Progression System</span>
          <h2 className="font-sans font-black text-2xl md:text-3xl text-white">
            {t.progTitle}
          </h2>
          <p className="text-slate-400 text-xs max-w-md leading-relaxed">
            {t.progSub}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {allTiers.map((tier, idx) => {
            const isUserTier = currentPoints >= tier.prevPoints && currentPoints < tier.nextPoints;
            const badgeLabel = badgeNameMap[tier.name] || tier.name;
            
            return (
              <motion.div 
                key={tier.name}
                whileHover={{ y: -4 }}
                className={`p-4 rounded-2xl border flex flex-col justify-between text-center gap-4 transition-all relative ${
                  isUserTier 
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30 scale-102 z-10'
                    : 'border-slate-900 bg-slate-900/10 hover:border-slate-800 hover:bg-slate-900/20'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">{tier.badge.split(' ')[0]}</span>
                  <h4 className="text-white text-[11px] font-black uppercase tracking-tight font-sans line-clamp-1">
                    {badgeLabel.split(' ')[1] || badgeLabel}
                  </h4>
                  <span className="text-[9px] font-mono text-slate-500 font-semibold">
                    &gt;={tier.prevPoints} PTS
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-t border-slate-800/40 pt-2.5 text-[9px] font-mono">
                  <div>
                    <span className="text-slate-500 block uppercase text-[8px] font-bold tracking-wider">Penalty</span>
                    <span className="text-slate-300 font-extrabold">{tier.multiplier * 100}%</span>
                  </div>
                  <div className="mt-1.5">
                    <span className="text-slate-500 block uppercase text-[8px] font-bold tracking-wider">Max Bet</span>
                    <span className="text-amber-400 font-extrabold">{tier.maxBet} PTS</span>
                  </div>
                  <div className="mt-1.5">
                    <span className="text-slate-500 block uppercase text-[8px] font-bold tracking-wider">Leverage</span>
                    <span className="text-emerald-400 font-extrabold">{tier.maxLeverage}x</span>
                  </div>
                </div>

                {isUserTier ? (
                  <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-widest mx-auto shadow-md">
                    {t.yourRank}
                  </span>
                ) : (
                  <div className="h-[14px]"></div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ROADMAP / HOW TO START ROAD */}
      <section id="how-to-start" className="px-6 py-12 max-w-4xl mx-auto border-t border-slate-900/80 text-center flex flex-col gap-8">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black">Fast-track Guide</span>
          <h2 className="font-sans font-black text-2xl text-white">
            {t.guideTitle}
          </h2>
          <p className="text-slate-400 text-xs max-w-sm">
            {t.guideSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          {[
            { step: '01', title: t.step1Title, desc: t.step1Desc },
            { step: '02', title: t.step2Title, desc: t.step2Desc },
            { step: '03', title: t.step3Title, desc: t.step3Desc },
            { step: '04', title: t.step4Title, desc: t.step4Desc },
          ].map((r, i) => (
            <motion.div 
              key={r.step} 
              whileHover={{ y: -2 }}
              className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex flex-col gap-2 relative overflow-hidden"
            >
              <span className="absolute -top-3.5 -left-1 text-3xl font-black font-mono text-slate-800/10 select-none">{r.step}</span>
              <h4 className="text-white text-xs font-black uppercase tracking-wider font-sans mt-1">
                {r.title}
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                {r.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 mt-4 text-left max-w-3xl mx-auto shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {t.readyTitle}
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              {t.readyDesc}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer shrink-0"
          >
            {t.startBtn}
          </motion.button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-900/80 bg-slate-950/40 py-8 px-6 text-center text-[10px] text-slate-600 font-mono tracking-wider">
        <p className="max-w-md mx-auto leading-relaxed">
          {t.footerTxt}
        </p>
      </footer>
    </div>
  );
}
