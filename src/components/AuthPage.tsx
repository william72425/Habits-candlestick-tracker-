import React, { useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup
} from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Chrome, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Terminal,
  Globe,
  User,
  ArrowLeft
} from 'lucide-react';
import { AUTH_LOCALIZATION } from '../utils/localization';

interface AuthPageProps {
  onSuccess: () => void;
  onGuestMode: () => void;
  onBackToLanding: () => void;
  lang?: 'en' | 'my';
  setLang?: (lang: 'en' | 'my') => void;
}

export default function AuthPage({ 
  onSuccess, 
  onGuestMode, 
  onBackToLanding,
  lang: propLang,
  setLang: propSetLang
}: AuthPageProps) {
  // States for error/success/loading feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<{ en: string; my: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ en: string; my: string } | null>(null);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  // Language setting
  const [localLang, setLocalLang] = useState<'en' | 'my'>('my');
  const lang = propLang || localLang;
  const setLang = propSetLang || setLocalLang;

  const t = AUTH_LOCALIZATION[lang];

  // Detect iframe environment
  React.useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  // Google Provider Authentication
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage({ en: t.successSignIn, my: t.successSignIn });
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage({
          en: "Authentication window was closed before completion.",
          my: "အကောင့်ဝင်ရန် ဖွင့်ထားသော Window ပိတ်သွားခဲ့သည်။"
        });
      } else if (err.code === "auth/popup-blocked") {
        setErrorMessage({
          en: "The sign-in popup was blocked by your browser. Please allow popups or use Guest Mode.",
          my: "အကောင့်ဝင်ရန် Popup ကို browser က ပိတ်ထားပါသည်။ Popup browser settings တွင် ခွင့်ပြုပေးပါ သို့မဟုတ် Guest Mode သုံးပါ။"
        });
      } else {
        setErrorMessage({ en: t.googleError, my: t.googleError });
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_view_root" className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden text-slate-200">
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* FLOATING PARTICLES ACCENT */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* TOP BAR ACTION CONTROLS - Highly mobile responsive layout */}
      <div className="w-full max-w-lg flex items-center justify-between gap-4 mb-4 sm:mb-0 sm:absolute sm:top-6 sm:left-6 sm:right-6 sm:max-w-none sm:px-6">
        {/* BACK TO INTRO NAVIGATION */}
        <button 
          onClick={onBackToLanding}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>{t.backToLanding}</span>
        </button>

        {/* LANGUAGE TOGGLE */}
        <button 
          onClick={() => setLang(lang === 'en' ? 'my' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-all select-none"
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'en' ? 'မြန်မာ' : 'English'}</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="bg-slate-900/80 border-2 border-slate-800 hover:border-emerald-500/20 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-200"
      >
        
        {/* Glow Line Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

        {/* HEADER BRAND */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-mono text-[10px] tracking-widest text-emerald-400 font-extrabold uppercase">
              PORTAL: SECURE TERMINAL v2.1
            </span>
          </div>
        </div>

        {/* TITLE BLOCK */}
        <div className="flex flex-col gap-1.5 text-center sm:text-left mb-6">
          <h2 className="text-white text-xl md:text-2xl font-sans font-black uppercase tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            {t.title}
          </h2>
          <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm mx-auto sm:mx-0">
            {t.subtitle}
          </p>
        </div>

        {/* FEEDBACK STATUS ALERTS */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl mb-5 flex items-start gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex flex-col text-left text-xs leading-relaxed text-rose-300">
                <span className="font-bold">{t.securityWarning}:</span>
                <p>{lang === 'en' ? errorMessage.en : errorMessage.my}</p>
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl mb-5 flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex flex-col text-left text-xs leading-relaxed text-emerald-300">
                <span className="font-bold">{t.accessGranted}:</span>
                <p>{lang === 'en' ? successMessage.en : successMessage.my}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IFRAME POPUP BLOCKER WARNING */}
        {isIframe && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl mb-5 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex flex-col text-left text-xs leading-relaxed text-amber-300">
              <span className="font-bold">
                {lang === 'en' ? '⚠️ Iframe Browser Constraint' : '⚠️ Browser လုံခြုံရေး သတိပေးချက်'}
              </span>
              <p className="mt-0.5">
                {lang === 'en' 
                  ? "Since you are viewing inside an iframe, Google popup authentication may get blocked. For the best experience, click 'Open in New Tab' at the top right, or use Guest Mode." 
                  : "ဤ app ကို iframe အတွင်း ကြည့်ရှုနေသောကြောင့် Google Sign-in popup ကို browser မှ ပိတ်ထားနိုင်ပါသည်။ အဆင်ပြေပြေ သုံးနိုင်ရန် ညာဘက်အပေါ်ထောင့်ရှိ 'Open in New Tab' ကို နှိပ်၍သော်လည်းကောင်း၊ Guest Mode ဖြင့်သော်လည်းကောင်း ဆောင်ရွက်ပါ။"
                }
              </p>
            </div>
          </div>
        )}

        {/* GOOGLE AUTHENTICATION BUTTON - Now Primary Action */}
        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleGoogleAuth}
            disabled={loading}
            type="button"
            className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>{t.loadingText}</span>
              </>
            ) : (
              <>
                <Chrome className="w-4 h-4 text-slate-950" />
                <span>{t.googleBtn}</span>
              </>
            )}
          </motion.button>
        </div>

        {/* BYPASS TO GUEST MODE (LOCAL) */}
        <div className="mt-6 border-t border-slate-800/60 pt-4 flex flex-col gap-2.5">
          <button 
            type="button"
            onClick={onGuestMode}
            disabled={loading}
            className="text-amber-400 hover:text-amber-300 text-xs font-black uppercase tracking-wide cursor-pointer hover:underline flex items-center justify-center gap-1.5 transition-colors"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>{t.guestBtn}</span>
          </button>
          <div className="flex items-start gap-1.5 max-w-sm mx-auto bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-normal text-left">
              {t.guestWarning}
            </p>
          </div>
        </div>

        {/* FOOTER WATERMARK */}
        <div className="mt-6 text-center">
          <span className="text-[8px] font-mono text-slate-600 font-bold uppercase tracking-widest">
            {t.by}
          </span>
        </div>

      </motion.div>
    </div>
  );
}
