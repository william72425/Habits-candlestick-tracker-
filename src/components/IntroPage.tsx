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
import { User } from '../utils/firebase';
import { INTRO_LOCALIZATION } from '../utils/localization';

interface IntroPageProps {
  onClose: () => void;
  currentPoints: number;
  onNavigateToAuth: () => void;
  currentUser?: User | null;
  isGuestMode?: boolean;
  lang?: 'en' | 'my';
  setLang?: (lang: 'en' | 'my') => void;
}

export default function IntroPage({ 
  onClose, 
  currentPoints,
  onNavigateToAuth,
  currentUser,
  isGuestMode,
  lang: propLang,
  setLang: propSetLang
}: IntroPageProps) {
  const [localLang, setLocalLang] = useState<'en' | 'my'>('my');
  const lang = propLang || localLang;
  const setLang = propSetLang || setLocalLang;
  const [activeFeatureTab, setActiveFeatureTab] = useState<'chart' | 'predictions' | 'rankings' | 'schedule'>('chart');
  
  // Showcase all available ranks dynamically
  const showcasePoints = [0, 600, 2000, 3500, 6000, 9000, 13000];
  const allTiers = showcasePoints.map(p => getTierInfo(p));

  const t = INTRO_LOCALIZATION[lang];

  // Framer motion variants - Premium performance settings with spring kinetics
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 180, damping: 18 }
    }
  };

  // Hero section custom entrance variants
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const heroChildVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 140, damping: 16 }
    }
  };

  // Features detail transition parameters
  const featurePanelVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 180,
        damping: 20,
        staggerChildren: 0.08
      }
    },
    exit: { 
      opacity: 0, 
      y: -15, 
      scale: 0.98,
      transition: { duration: 0.15 } 
    }
  };

  const featureChildVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 }
    }
  };

  // Progression grid scroll animation variants
  const progressionContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const progressionItemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.92 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 160, damping: 18 }
    }
  };

  // Roadmap list container animation variants
  const roadmapContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const roadmapItemVariants = {
    hidden: { opacity: 0, x: -25, scale: 0.97 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 180, damping: 18 }
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
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.9, 0.6],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
          x: [0, -40, 0],
          y: [0, 30, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-[800px] right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.7, 0.4],
          x: [20, -20, 20],
          y: [-10, 20, -10]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"
      />

      {/* STICKY TOP FLOATING NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-900/60 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-amber-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-sans font-black text-xs sm:text-sm tracking-widest text-white uppercase leading-none">
                BET ON ME
              </h1>
              <span className="font-mono text-[8px] sm:text-[9px] text-emerald-400 tracking-wider uppercase font-extrabold mt-0.5 leading-none">
                The Gamified Asset Terminal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Selector Button with globe icon */}
            <button
              onClick={() => setLang(lang === 'en' ? 'my' : 'en')}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-[11px] sm:text-xs font-semibold cursor-pointer select-none"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? 'မြန်မာ' : 'English'}</span>
            </button>

            {/* Exit/Enter button shown ONLY if user is already logged in or in guest mode */}
            {(currentUser || isGuestMode) && (
              <button 
                onClick={onClose}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] sm:text-xs text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer group"
              >
                <X className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-300 text-emerald-400" />
                <span className="font-bold">{lang === 'en' ? 'Enter' : 'ပြန်ထွက်မည်'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <motion.section 
        variants={heroContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative px-4 sm:px-6 pt-12 pb-10 sm:pt-20 sm:pb-16 text-center max-w-4xl mx-auto flex flex-col items-center gap-5 sm:gap-6"
      >
        <motion.div 
          variants={heroChildVariants}
          className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] sm:text-[10px] font-mono uppercase tracking-widest font-black"
        >
          <Sparkles className="w-3 h-3 text-amber-400" /> {t.heroTag}
        </motion.div>

        <motion.h2 
          variants={heroChildVariants}
          className="font-sans font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] max-w-3xl"
        >
          {t.heroTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300">{t.heroTitleHighlight}</span>
        </motion.h2>

        <motion.p 
          variants={heroChildVariants}
          className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mt-1"
        >
          {t.heroDesc}
        </motion.p>

        <motion.div 
          variants={heroChildVariants}
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2 sm:mt-4 w-full sm:w-auto px-4 sm:px-0"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (currentUser || isGuestMode) {
                onClose();
              } else {
                onNavigateToAuth();
              }
            }}
            className="relative overflow-hidden group/btn w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
          >
            <motion.div 
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ repeat: Infinity, repeatType: "loop", duration: 1, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 pointer-events-none"
            />
            {t.startBtn}
          </motion.button>
          
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center cursor-pointer"
          >
            {t.seeHowBtn}
          </motion.a>
        </motion.div>
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
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              borderColor: "rgba(16, 185, 129, 0.4)",
              boxShadow: "0 10px 30px -10px rgba(16, 185, 129, 0.15)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-slate-900/35 border border-slate-850/80 p-6 rounded-2xl flex flex-col gap-3.5 relative overflow-hidden group cursor-pointer shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all duration-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base font-sans group-hover:text-emerald-400 transition-colors">{t.pillar1Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              {t.pillar1Desc}
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              borderColor: "rgba(245, 158, 11, 0.4)",
              boxShadow: "0 10px 30px -10px rgba(245, 158, 11, 0.15)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-slate-900/35 border border-slate-850/80 p-6 rounded-2xl flex flex-col gap-3.5 relative overflow-hidden group cursor-pointer shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl w-fit group-hover:scale-110 group-hover:bg-amber-500/25 transition-all duration-300">
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-white font-bold text-base font-sans group-hover:text-amber-400 transition-colors">{t.pillar2Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              {t.pillar2Desc}
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              borderColor: "rgba(6, 182, 212, 0.4)",
              boxShadow: "0 10px 30px -10px rgba(6, 182, 212, 0.15)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-slate-900/35 border border-slate-850/80 p-6 rounded-2xl flex flex-col gap-3.5 relative overflow-hidden group cursor-pointer shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl w-fit group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all duration-300">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base font-sans group-hover:text-cyan-400 transition-colors">{t.pillar3Title}</h3>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Feature Buttons Selector */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3.5">
            {[
              { id: 'chart', enKey: 'tabChart', myKey: 'tabChart', enDescKey: 'tabChartDesc', icon: LineChart },
              { id: 'predictions', enKey: 'tabPredict', myKey: 'tabPredict', enDescKey: 'tabPredictDesc', icon: Coins },
              { id: 'rankings', enKey: 'tabRanks', myKey: 'tabRanks', enDescKey: 'tabRanksDesc', icon: Award },
              { id: 'schedule', enKey: 'tabRules', myKey: 'tabRules', enDescKey: 'tabRulesDesc', icon: Clock },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = activeFeatureTab === f.id;
              return (
                <motion.button
                  key={f.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveFeatureTab(f.id as any)}
                  className={`text-left p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5 relative overflow-hidden h-full ${
                    isSelected 
                      ? 'bg-slate-900 border-emerald-500/40 text-emerald-400 shadow-md ring-1 ring-emerald-500/20' 
                      : 'bg-slate-950/20 border-slate-900 hover:border-slate-800/80 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {isSelected && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 hidden sm:block"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {isSelected && (
                    <motion.div 
                      layoutId="activeTabIndicatorMobile"
                      className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500 sm:hidden"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className={`text-[10px] sm:text-xs font-black font-sans uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {t[f.enKey as keyof typeof t]}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold leading-tight mt-0.5">
                      {t[f.enDescKey as keyof typeof t]}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right Detailed Panel View */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-850 p-4 sm:p-6 rounded-2xl flex flex-col gap-5 min-h-[320px] lg:min-h-[380px] justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-slate-800/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <AnimatePresence mode="wait">
              {activeFeatureTab === 'chart' && (
                <motion.div 
                  key="chart"
                  variants={featurePanelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col gap-4"
                >
                  <motion.div variants={featureChildVariants} className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black">MODULE 01</span>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-white font-sans font-black text-sm sm:text-lg">
                        {t.feat1Title}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-slate-300 text-xs leading-relaxed font-sans">
                        {t.feat1Desc}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={featureChildVariants} className="bg-slate-950/60 p-3 sm:p-4 rounded-xl border border-slate-900 flex flex-col gap-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-500 border-b border-slate-800/80 pb-2">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Habit Completion' : 'အလေ့အကျင့် ပြီးမြောက်မှု'}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-right">{lang === 'en' ? 'Index Output' : 'အကျိုးသက်ရောက်မှု'}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-[11px] gap-1 sm:gap-4">
                      <div className="flex flex-col shrink-0">
                        <span className="text-emerald-400 flex items-center gap-1.5 font-bold">🟢 {t.feat1Sub1}</span>
                      </div>
                      <div className="flex flex-col sm:text-right pl-5 sm:pl-0">
                        <span className="text-slate-200">{t.feat1Sub1Desc.split(': ')[1] || t.feat1Sub1Desc}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-[11px] gap-1 sm:gap-4 border-t border-slate-900 pt-2">
                      <div className="flex flex-col shrink-0">
                        <span className="text-amber-400 flex items-center gap-1.5 font-bold">🟡 {t.feat1Sub2}</span>
                      </div>
                      <div className="flex flex-col sm:text-right pl-5 sm:pl-0">
                        <span className="text-slate-200">{t.feat1Sub2Desc.split(': ')[1] || t.feat1Sub2Desc}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-[11px] gap-1 sm:gap-4 border-t border-slate-900 pt-2">
                      <div className="flex flex-col shrink-0">
                        <span className="text-rose-400 flex items-center gap-1.5 font-bold">🔴 {t.feat1Sub3}</span>
                      </div>
                      <div className="flex flex-col sm:text-right pl-5 sm:pl-0">
                        <span className="text-rose-450">{t.feat1Sub3Desc.split(': ')[1] || t.feat1Sub3Desc}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={featureChildVariants} className="flex gap-2.5 items-start text-[10px] text-slate-500 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span>{t.feat1Tip}</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeFeatureTab === 'predictions' && (
                <motion.div 
                  key="predictions"
                  variants={featurePanelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col gap-4"
                >
                  <motion.div variants={featureChildVariants} className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-black">MODULE 02</span>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-white font-sans font-black text-sm sm:text-lg">
                        {t.feat2Title}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-slate-300 text-xs leading-relaxed font-sans">
                        {t.feat2Desc}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={featureChildVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.03, y: -4, borderColor: "rgba(16, 185, 129, 0.4)" }}
                      className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-900 flex flex-col gap-1.5 text-center relative group transition-colors"
                    >
                      <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400 font-black tracking-wider uppercase">
                        {t.feat2Low}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className="text-xs text-white font-black">{t.feat2LowTitle}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-slate-900 pt-1.5 mt-1">
                        <span className="text-[9px] text-slate-400 leading-snug">{t.feat2LowDesc}</span>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.03, y: -4, borderColor: "rgba(6, 182, 212, 0.4)" }}
                      className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-900 flex flex-col gap-1.5 text-center relative group transition-colors"
                    >
                      <span className="text-[8px] sm:text-[9px] font-mono text-cyan-400 font-black tracking-wider uppercase">
                        {t.feat2Med}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className="text-xs text-white font-black">{t.feat2MedTitle}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-slate-900 pt-1.5 mt-1">
                        <span className="text-[9px] text-slate-400 leading-snug">{t.feat2MedDesc}</span>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.03, y: -4, borderColor: "rgba(245, 158, 11, 0.4)" }}
                      className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-900 flex flex-col gap-1.5 text-center relative group transition-colors"
                    >
                      <span className="text-[8px] sm:text-[9px] font-mono text-amber-400 font-black tracking-wider uppercase">
                        {t.feat2High}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className="text-xs text-white font-black">{t.feat2HighTitle}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-slate-900 pt-1.5 mt-1">
                        <span className="text-[9px] text-slate-400 leading-snug">{t.feat2HighDesc}</span>
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.div variants={featureChildVariants} className="flex gap-2.5 items-start text-[10px] text-slate-500 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse mt-0.5" />
                    <div className="flex flex-col">
                      <span>{t.feat2Tip}</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeFeatureTab === 'rankings' && (
                <motion.div 
                  key="rankings"
                  variants={featurePanelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col gap-4"
                >
                  <motion.div variants={featureChildVariants} className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono text-violet-400 uppercase tracking-widest font-black">MODULE 03</span>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-white font-sans font-black text-sm sm:text-lg">
                        {t.feat3Title}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-slate-300 text-xs leading-relaxed font-sans">
                        {t.feat3Desc}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={featureChildVariants} className="bg-slate-950/60 p-2.5 sm:p-4 rounded-xl border border-slate-900 flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                    <div className="hidden sm:grid sm:grid-cols-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 pb-2 mb-1">
                      <span>{lang === 'en' ? 'Rank & Badge' : 'အဆင့်နှင့် တံဆိပ်'}</span>
                      <span>{lang === 'en' ? 'Max Bet & Leverage' : 'အများဆုံးလောင်းကြေးနှင့် Leverage'}</span>
                      <span>{lang === 'en' ? 'Miss Penalty Multiplier' : 'ပျက်ကွက်ဒဏ်ကြေး'}</span>
                      <span>{lang === 'en' ? 'Points Bracket' : 'ရမှတ်အပိုင်းအခြား'}</span>
                    </div>
                    
                    {[
                      { rankEn: "Bronze", rankMy: "ကြေးဝါ", badge: "🥉", limits: "100 PTS / 1x", penalty: "30% Penalty", range: "0 - 499 PTS", color: "text-amber-600" },
                      { rankEn: "Silver", rankMy: "ငွေ", badge: "🥈", limits: "300 PTS / 2x", penalty: "40% Penalty", range: "500 - 1,199 PTS", color: "text-slate-300" },
                      { rankEn: "Gold", rankMy: "ရွှေ", badge: "🥇", limits: "500 PTS / 3x", penalty: "50% Penalty", range: "1,200 - 1,999 PTS", color: "text-amber-500" },
                      { rankEn: "Platinum", rankMy: "ပလက်တီနမ်", badge: "💎", limits: "1,000 PTS / 4x", penalty: "60% Penalty", range: "2,000 - 2,999 PTS", color: "text-cyan-400" },
                      { rankEn: "Diamond", rankMy: "စိန်", badge: "💠", limits: "1,500 PTS / 5x", penalty: "80% Penalty", range: "3,000 - 4,999 PTS", color: "text-sky-400" },
                      { rankEn: "Crown", rankMy: "သရဖူ", badge: "👑", limits: "3,000 PTS / 8x", penalty: "100% Penalty", range: "5,000 - 11,999 PTS", color: "text-amber-450 font-extrabold" },
                      { rankEn: "Conqueror", rankMy: "အနိုင်ရသူ", badge: "🌟", limits: "12,000 PTS / 15x", penalty: "150% Penalty", range: "12,000+ PTS", color: "text-emerald-400 font-black animate-pulse" },
                    ].map((row, rIdx) => (
                      <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-4 items-center text-[11px] gap-1.5 sm:gap-2 py-2 border-b border-slate-900/40 last:border-0 hover:bg-slate-900/30 px-1.5 rounded-lg transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{row.badge}</span>
                          <div className="flex flex-row sm:flex-col items-center sm:items-start gap-1 sm:gap-0">
                            <span className={`${row.color} font-black`}>
                              {lang === 'en' ? row.rankEn : `${row.rankEn} (${row.rankMy})`}
                            </span>
                          </div>
                        </div>
                        <div className="flex sm:block justify-between text-slate-300">
                          <span className="sm:hidden text-slate-500 text-[9px] uppercase font-bold">{lang === 'en' ? 'Max Bet/Lev:' : 'အများဆုံးလောင်းကြေး/Lev:'}</span>
                          <span className="font-semibold">{row.limits}</span>
                        </div>
                        <div className="flex sm:block justify-between text-rose-450">
                          <span className="sm:hidden text-slate-500 text-[9px] uppercase font-bold">{lang === 'en' ? 'Penalty:' : 'ဒဏ်ကြေး:'}</span>
                          <span>{row.penalty}</span>
                        </div>
                        <div className="flex sm:block justify-between text-slate-500">
                          <span className="sm:hidden text-slate-500 text-[9px] uppercase font-bold">{lang === 'en' ? 'Points Bracket:' : 'ရမှတ်အပိုင်းအခြား:'}</span>
                          <span>{row.range}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div variants={featureChildVariants} className="flex gap-2.5 items-start text-[10px] text-slate-500 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900">
                    <Award className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span>{t.feat3Tip}</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeFeatureTab === 'schedule' && (
                <motion.div 
                  key="schedule"
                  variants={featurePanelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col gap-4"
                >
                  <motion.div variants={featureChildVariants} className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-black">MODULE 04</span>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-white font-sans font-black text-sm sm:text-lg">
                        {t.feat4Title}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-slate-300 text-xs leading-relaxed font-sans">
                        {t.feat4Desc}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={featureChildVariants} className="bg-slate-950/60 p-3 sm:p-4 rounded-xl border border-slate-900 flex flex-col gap-3.5 font-sans text-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h5 className="text-white font-bold text-[11px]">{t.feat4OwlTitle}</h5>
                        <p className="text-slate-400 text-[10px] leading-normal mt-0.5">{t.feat4OwlDesc}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 border-t border-slate-900/60 pt-3">
                      <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h5 className="text-white font-bold text-[11px]">{t.feat4WeekendTitle}</h5>
                        <p className="text-slate-400 text-[10px] leading-normal mt-0.5">{t.feat4WeekendDesc}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-t border-slate-900/60 pt-3">
                      <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h5 className="text-white font-bold text-[11px]">{t.feat4SelectiveTitle}</h5>
                        <p className="text-slate-400 text-[10px] leading-normal mt-0.5">{t.feat4SelectiveDesc}</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-slate-800/40 pt-4 mt-2 flex justify-between items-center text-[10px] text-slate-500">
              <span>Bet On Me Terminal - Professional Consistency & Discipline System</span>
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

        <motion.div 
          variants={progressionContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
        >
          {allTiers.map((tier, idx) => {
            const isUserTier = currentPoints >= tier.prevPoints && currentPoints < tier.nextPoints;
            const badgeLabel = badgeNameMap[tier.name] || tier.name;
            
            return (
              <motion.div 
                key={tier.name}
                variants={progressionItemVariants}
                whileHover={{ 
                  y: -8,
                  scale: 1.03,
                  borderColor: isUserTier ? "rgba(245,158,11,0.6)" : "rgba(16,185,129,0.35)",
                  boxShadow: isUserTier 
                    ? "0 15px 30px -10px rgba(245,158,11,0.25)"
                    : "0 15px 30px -10px rgba(16,185,129,0.08)"
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`p-4 rounded-2xl border flex flex-col justify-between text-center gap-4 transition-all relative ${
                  isUserTier 
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30 z-10'
                    : 'border-slate-900 bg-slate-900/10 hover:border-slate-850 hover:bg-slate-900/20'
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

                <div className="flex flex-col gap-1 border-t border-slate-800/40 pt-2.5 text-[9px] font-mono text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase text-[8px] font-bold tracking-wider">Penalty</span>
                    <span className="text-slate-300 font-extrabold">{tier.multiplier * 100}%</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold tracking-wider">Max Bet</span>
                    <span className="text-amber-400 font-extrabold">{tier.maxBet} PTS</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold tracking-wider">Leverage</span>
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
        </motion.div>
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

        <motion.div 
          variants={roadmapContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left"
        >
          {[
            { step: '01', title: t.step1Title, desc: t.step1Desc },
            { step: '02', title: t.step2Title, desc: t.step2Desc },
            { step: '03', title: t.step3Title, desc: t.step3Desc },
            { step: '04', title: t.step4Title, desc: t.step4Desc },
          ].map((r, i) => (
            <motion.div 
              key={r.step} 
              variants={roadmapItemVariants}
              whileHover={{ 
                y: -4, 
                scale: 1.02, 
                borderColor: "rgba(16, 185, 129, 0.3)",
                boxShadow: "0 10px 20px -10px rgba(16, 185, 129, 0.05)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex flex-col gap-2 relative overflow-hidden cursor-pointer"
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
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.1 }}
          className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 mt-4 text-left max-w-3xl mx-auto shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              {t.readyTitle}
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              {t.readyDesc}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (currentUser || isGuestMode) {
                onClose();
              } else {
                onNavigateToAuth();
              }
            }}
            className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer shrink-0"
          >
            {t.startBtn}
          </motion.button>
        </motion.div>
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
