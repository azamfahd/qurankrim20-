
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import { EmotionForm } from './components/EmotionForm';
import { ResultCard } from './components/ResultCard';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { TasbihModal } from './components/TasbihModal';
import { BookmarksModal } from './components/BookmarksModal';
import { AdhkarModal } from './components/AdhkarModal';
import { NamesOfAllahModal } from './components/NamesOfAllahModal';
import { AboutModal } from './components/AboutModal';
import { FeedbackModal } from './components/FeedbackModal';
import { Toast, ToastType } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { DailyVerse } from './components/DailyVerse';
import { PrayerTimesWidget } from './components/PrayerTimesWidget';
import { HijriCalendarModal } from './components/HijriCalendarModal';
import { getCurrentHijriDate, getHijriReminders } from './utils/hijri';
import { QiblaModal } from './components/QiblaModal';
import { ZakatCalculatorModal } from './components/ZakatCalculatorModal';
import { InstallPrompt } from './components/InstallPrompt';
import { AgriculturalCalendarModal } from './components/AgriculturalCalendarModal';
import { QuranChatSession } from './services/geminiService';
import { SupabaseService } from './services/supabaseService';
import { SyncService } from './services/syncService';
import { ChatMessage, AppState, UserSettings, ChatSession, Bookmark, Verse } from './types';
import { AlertCircle, Plus, Menu, ArrowRight, ArrowLeft, WifiOff, BookOpen, Key, X, Compass, Calculator, Bookmark as BookmarkIcon, RefreshCw, Calendar, Leaf, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_MESSAGES = [
  "نغوص في أعماق آيات الذكر الحكيم...",
  "نستحضر السكينة من فيض الوحي لقلبك...",
  "نتدبر في لطائف الآيات ومقاصدها...",
  "نلتمس لك من نور القرآن هداية وشفاء...",
  "جاري صياغة رسالة النور لروحك..."
];

const DEFAULT_SETTINGS: UserSettings = {
  username: '',
  email: '',
  isLoggedIn: false,
  model: 'gemini-3-flash-preview', 
  creativityLevel: 0.5,
  apiKey: '',
  bookmarks: [],
  reciter: 'ar.alafasy'
};

// Generate a unique user ID for anonymous users
const generateUserId = (): string => {
  let userId = localStorage.getItem('anis_user_id');
  if (!userId) {
    userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anis_user_id', userId);
  }
  return userId;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const App: React.FC = () => {
  const userIdRef = useRef<string>(generateUserId());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // تحميل الرسائل النشطة من الذاكرة (الحفظ التلقائي)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('anis_active_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('anis_active_session_id');
  });

  const [state, setState] = useState<AppState>(() => {
    return (messages && messages.length > 0) ? AppState.SUCCESS : AppState.IDLE;
  });

  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineBannerDismissed, setIsOfflineBannerDismissed] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isAdhkarOpen, setIsAdhkarOpen] = useState(false);
  const [isNamesOfAllahOpen, setIsNamesOfAllahOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isZakatOpen, setIsZakatOpen] = useState(false);
  const [isHijriOpen, setIsHijriOpen] = useState(false);
  const [isAgriCalendarOpen, setIsAgriCalendarOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [hijriOffset, setHijriOffset] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anis_hijri_offset');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const todayHijri = getCurrentHijriDate(hijriOffset);
  const todayReminders = getHijriReminders(todayHijri);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('anis_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close all modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsHistoryOpen(false);
        setIsTasbihOpen(false);
        setIsBookmarksOpen(false);
        setIsAdhkarOpen(false);
        setIsNamesOfAllahOpen(false);
        setIsQiblaOpen(false);
        setIsZakatOpen(false);
        setIsAgriCalendarOpen(false);
        setIsAboutOpen(false);
        setIsFeedbackOpen(false);
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('anis_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });
  
  const chatSessionRef = useRef<QuranChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastSavedSettingsRef = useRef<string>('');

  // Supabase Auth and Sync
  useEffect(() => {
    const initLoad = async (uid: string, isLogged: boolean, user?: any) => {
      const loadedSettings = await SyncService.loadSettings(uid, settings);
      let finalSettings = { ...settings, isLoggedIn: isLogged, uid: isLogged ? uid : undefined };
      
      if (loadedSettings) {
        finalSettings = { ...finalSettings, ...loadedSettings };
        setSettings(finalSettings);
        lastSavedSettingsRef.current = JSON.stringify({ ...finalSettings, lastUpdated: undefined });
      } else if (isLogged) {
        // Initialize user doc if it doesn't exist (only for logged in users)
        finalSettings = {
          ...finalSettings,
          username: user?.user_metadata?.full_name || settings.username || 'مستخدم',
          email: user?.email || '',
          photoURL: user?.user_metadata?.avatar_url || '',
          lastUpdated: new Date().toISOString()
        };
        await SyncService.saveSettings(uid, finalSettings);
        setSettings(finalSettings);
        lastSavedSettingsRef.current = JSON.stringify({ ...finalSettings, lastUpdated: undefined });
      } else {
        // Just update the local state for anonymous
        setSettings(finalSettings);
      }

      const loadedSessions = await SyncService.loadSessions(uid, finalSettings);
      if (loadedSessions !== null) {
        setSessions(loadedSessions);
      }
      setIsLoadingData(false);
    };

    const { data: { subscription } } = SupabaseService.onAuthStateChange((user) => {
      setSupabaseUser(user); 
      
      if (user) {
        userIdRef.current = user.id;
        initLoad(user.id, true, user);
      } else {
        const guestId = generateUserId();
        userIdRef.current = guestId;
        initLoad(guestId, false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoadingData && !supabaseUser) {
      // Small delay to let auth settle
      const timer = setTimeout(() => setIsLoadingData(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [supabaseUser, isLoadingData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineBannerDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineBannerDismissed(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (state === AppState.LOADING) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingText(LOADING_MESSAGES[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [state]);

  // Save history to localStorage and Firestore
  useEffect(() => {
    localStorage.setItem('anis_history', JSON.stringify(sessions));
    
    // Also save to Firestore if logged in
    if (supabaseUser && isOnline) {
      // We handle individual session saves in saveCurrentSessionToHistory
    }
  }, [sessions, supabaseUser, isOnline]);

  // Save settings to localStorage and Backend
  useEffect(() => {
    chatSessionRef.current = null;
    localStorage.setItem('anis_settings', JSON.stringify(settings));
    
    // Also save to Backend
    if (isOnline && userIdRef.current) {
      const currentSettingsStr = JSON.stringify({ ...settings, lastUpdated: undefined });
      
      // Only save if settings actually changed from what we last saved or received
      if (currentSettingsStr !== lastSavedSettingsRef.current) {
        setIsSyncing(true);
        SyncService.saveSettings(userIdRef.current, settings)
          .then(() => {
            lastSavedSettingsRef.current = currentSettingsStr;
            setLastSynced(Date.now());
            setTimeout(() => setIsSyncing(false), 1000);
          })
          .catch(err => {
            console.error('Error saving settings to Backend:', err);
            setIsSyncing(false);
          });
      }
    }
  }, [settings, supabaseUser, isOnline]);

  // Track PWA Installation and User Registration
  useEffect(() => {
    const trackUser = async () => {
      if (!userIdRef.current) return;

      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone || 
                    document.referrer.includes('android-app://');

      const userMetadata = {
        uid: userIdRef.current,
        lastActive: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        isInstalled: isPWA,
        platform: (navigator as any).platform || 'unknown'
      };

      // Register/Update user in backend
      try {
        await SyncService.registerUser(userIdRef.current, userMetadata, settings);
      } catch (e) {
        console.error('Error registering user:', e);
      }
    };

    if (isOnline) {
      trackUser();
    }

    // Listen for the actual install event
    const handleAppInstalled = () => {
      if (userIdRef.current) {
        SyncService.updateUserInstallStatus(userIdRef.current, true).catch(console.error);
        showToast('شكراً لتثبيت التطبيق! يمكنك الآن الوصول إليه من شاشتك الرئيسية.', 'success');
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem('anis_active_chat', JSON.stringify(messages));
    if (currentSessionId) {
      localStorage.setItem('anis_active_session_id', currentSessionId);
    } else {
      localStorage.removeItem('anis_active_session_id');
    }
    
    if (messages.length > 0) {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, state, currentSessionId]);

  const saveCurrentSessionToHistory = (msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    const firstUserMsg = msgs.find(m => m.type === 'user');
    if (!firstUserMsg) return;
    
    let sessionToSave: ChatSession;
    if (currentSessionId) {
      const existingSession = sessions.find(s => s.id === currentSessionId);
      if (existingSession) {
        sessionToSave = { ...existingSession, messages: msgs };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? sessionToSave : s));
      } else {
        // Fallback if session not found in state
        const newId = currentSessionId;
        sessionToSave = {
          id: newId,
          date: Date.now(),
          preview: firstUserMsg.content.substring(0, 100) || "محادثة صوتية",
          messages: msgs
        };
        setSessions(prev => [sessionToSave, ...prev]);
      }
    } else {
      const newId = generateId();
      setCurrentSessionId(newId);
      
      sessionToSave = {
        id: newId,
        date: Date.now(),
        preview: firstUserMsg.content.substring(0, 100) || "محادثة صوتية",
        messages: msgs
      };
      
      setSessions(prev => [sessionToSave, ...prev]);
    }

    // Save to Backend
    if (isOnline && userIdRef.current && sessionToSave!) {
      setIsSyncing(true);
      SyncService.saveSession(userIdRef.current, sessionToSave, settings)
        .then(() => {
          setLastSynced(Date.now());
          setTimeout(() => setIsSyncing(false), 1000);
        })
        .catch(err => {
          console.error('Error saving session to Backend:', err);
          setIsSyncing(false);
        });
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setState(AppState.IDLE);
    setCurrentSessionId(null);
    chatSessionRef.current = null;
    localStorage.removeItem('anis_active_chat');
    localStorage.removeItem('anis_active_session_id');
  };

  const handleImportHistory = (newHistory: ChatSession[]) => {
    setSessions(newHistory);
  };

  const handleToggleBookmark = (verse: Verse) => {
    if (!verse.surahNumber || !verse.ayahNumber) {
      showToast('عذراً، لا يمكن حفظ هذه الآية لعدم توفر بيانات السورة والآية.', 'error');
      return;
    }

    setSettings(prev => {
      const isBookmarked = (prev.bookmarks || []).some(
        b => b.verse.surahNumber === verse.surahNumber && b.verse.ayahNumber === verse.ayahNumber
      );

      if (isBookmarked) {
        const bookmarkToRemove = (prev.bookmarks || []).find(
          b => b.verse.surahNumber === verse.surahNumber && b.verse.ayahNumber === verse.ayahNumber
        );
        
        const newBookmarks = (prev.bookmarks || []).filter(
          b => !(b.verse.surahNumber === verse.surahNumber && b.verse.ayahNumber === verse.ayahNumber)
        );

        const newSettings = { ...prev, bookmarks: newBookmarks };
        
        if (userIdRef.current && bookmarkToRemove) {
          SyncService.deleteBookmark(userIdRef.current, bookmarkToRemove.id, newSettings).catch(console.error);
        }

        showToast('تمت إزالة الآية من المحفوظات', 'info');
        return newSettings;
      } else {
        const newBookmark: Bookmark = {
          id: `${verse.surahNumber}-${verse.ayahNumber}-${generateId()}`,
          verse,
          dateAdded: Date.now()
        };
        
        const newBookmarks = [newBookmark, ...(prev.bookmarks || [])];
        const newSettings = { ...prev, bookmarks: newBookmarks };
        
        if (userIdRef.current) {
          SyncService.saveBookmark(userIdRef.current, newBookmark, newSettings).catch(console.error);
        }

        showToast('تم حفظ الآية في المحفوظات', 'success');
        return newSettings;
      }
    });
  };

  const handleEmotionSubmit = async (text: string) => {
    if (!isOnline) {
      setError("لا يمكن إرسال الرسائل في وضع عدم الاتصال.");
      return;
    }
    setState(AppState.LOADING);
    setLoadingText(LOADING_MESSAGES[0]);
    setError(null);

    // Re-instantiate session if needed (e.g., settings changed or first run)
    if (!chatSessionRef.current) {
      try {
        chatSessionRef.current = new QuranChatSession(settings);
      } catch (e: any) {
        setError(e.message || "حدث خطأ في الإعدادات.");
        setState(AppState.ERROR);
        return;
      }
    }

    const userMsg: ChatMessage = { id: generateId(), type: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const displayName = settings.username || (settings.email ? settings.email.split('@')[0] : undefined);
      
      const onProgressUpdate = (stage: string) => {
        const messagesMap: Record<string, string> = {
          'thinking': "نستلهم الحكمة من فيض الوحي لقلبك...",
          'mapping': "نغوص في أعماق آيات الذكر الحكيم...",
          'verifying': "نتثبّت من مرجعيات الآيات وسياقها...",
          'formatting': "نجلو لك المعاني في أبهى صورها..."
        };
        setLoadingText(messagesMap[stage] || LOADING_MESSAGES[0]);
      };

      const data = await chatSessionRef.current.sendMessage(text, displayName, messages, onProgressUpdate);
      const aiMsg: ChatMessage = { id: generateId(), type: 'ai', data: data };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      setState(AppState.SUCCESS);
      saveCurrentSessionToHistory(finalMessages);
    } catch (err: any) {
      console.error("FULL ERROR DETAILS:", err);
      let errorMessage = "عذراً، حدث خطأ غير متوقع أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
      if (err.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes("quota") || msg.includes("429")) {
          errorMessage = "يبدو أن هناك ضغطاً كبيراً على الخادم حالياً. يرجى المحاولة بعد قليل، أو إضافة مفتاح API الخاص بك في الإعدادات لتجربة أسرع.";
        } else if (msg.includes("api key not valid") || msg.includes("invalid api key") || msg.includes("403") || msg.includes("api_key")) {
          errorMessage = "مفتاح API الذي قمت بإدخاله غير صالح. يرجى التأكد من صحته في الإعدادات، أو مسحه لاستخدام الوضع التلقائي.";
        } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
          errorMessage = "يبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.";
        } else if (msg.includes("استجابة فارغة") || msg.includes("لم يتم العثور على استجابة")) {
          errorMessage = "لم نتمكن من صياغة إجابة مناسبة في الوقت الحالي. يرجى إعادة صياغة سؤالك والمحاولة مرة أخرى.";
        } else if (msg.includes("timeout") || msg.includes("فشل الاتصال")) {
          errorMessage = "استغرق الخادم وقتاً طويلاً للاستجابة. يرجى المحاولة مرة أخرى لاحقاً.";
        } else if (msg.includes("json") || err.name === "SyntaxError") {
          errorMessage = "حدث خطأ في تنسيق البيانات الواردة من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
        } else {
          // Show the actual error message to help identify the root cause
          errorMessage = `عذراً، حدث خطأ: ${err.message}`;
        }
      }
      setError(errorMessage);
      setState(AppState.ERROR);
    }
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setState(AppState.SUCCESS);
    setIsHistoryOpen(false);
  };

  const isChatStarted = messages.length > 0;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "طاب صباحك بكل خير";
    if (hour < 17) return "طاب مساؤك بالمسرات";
    return "ليلة هادئة ومطمئنة";
  };

  if (isLoadingData) {
    return (
      <div className="app-wrapper royal-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl">
          <div className="spin w-12 h-12 border-4 border-[var(--color-gold)] border-t-transparent rounded-full shadow-[0_0_20px_rgba(197,160,89,0.3)]"></div>
          <p className="text-[var(--color-gold-light)] font-bold text-xl animate-pulse">جاري تحميل الأنوار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper royal-gradient selection:bg-[var(--color-gold)] selection:text-white">
      <InstallPrompt />
      
      <AnimatePresence>
        {!isOnline && !isOfflineBannerDismissed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="offline-banner relative overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 py-2 px-8">
              <WifiOff size={16} className="animate-pulse" />
              <span className="text-sm">أنت في وضع عدم الاتصال. قد تكون بعض الميزات محدودة.</span>
              <button 
                onClick={() => setIsOfflineBannerDismissed(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        
        {isChatStarted ? (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg"
          >
             <div className="flex items-center gap-4">
               <button 
                 onClick={startNewChat} 
                 className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-sm border border-white/10 flex items-center justify-center" 
                 title="الرئيسية"
               >
                 <ArrowRight size={22} />
               </button>
               <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                   <BookOpen size={16} className="text-[var(--color-gold)] animate-pulse" />
                   <h1 className="text-xl font-black royal-text-gradient leading-tight tracking-tight">أنيس القلوب</h1>
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-gold-light)] font-semibold mt-0.5 opacity-80">
                   <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse"></span>
                   <span>محادثة نشطة</span>
                 </div>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
                <AnimatePresence>
                  {isSyncing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full border border-white/10"
                      title="جاري المزامنة..."
                    >
                      <RefreshCw size={12} className="text-[var(--color-gold)] animate-spin" />
                      <span className="text-[9px] text-white/70 font-bold">مزامنة</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="group flex items-center gap-3 pl-2 pr-1 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all shadow-sm hover:shadow-md"
                >
                  <span className="text-sm font-bold text-white group-hover:text-[var(--color-gold-light)] transition-colors hidden sm:block pr-2">{settings.username || 'ضيف'}</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                    <User size={18} />
                  </div>
                </button>

                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-sm border border-white/10 flex items-center justify-center"
                  aria-label="القائمة"
                >
                  <Menu size={22} />
                </button>
             </div>
          </motion.div>
        ) : (
           <Header 
             onOpenSidebar={() => setIsSidebarOpen(true)} 
             onOpenSettings={() => setIsSettingsOpen(true)}
             username={settings.username}
             isSyncing={isSyncing}
             lastSynced={lastSynced}
           />
        )}
        
        <main className={isChatStarted ? "w-full max-w-[1600px] mx-auto px-0 sm:px-4 flex flex-col" : "container flex flex-col"} style={{ 
            flexGrow: 1, 
            paddingBottom: isChatStarted ? '140px' : '2rem', 
            paddingTop: isChatStarted ? '0' : '1rem' 
        }}>
          
          <div className="flex flex-col gap-6 flex-1">
            {messages.map((msg, index) => (
              <div key={msg.id} className={`message-row ${msg.type} ${index === messages.length - 1 && msg.type === 'ai' ? 'flex-1 flex-col' : ''}`}>
                {msg.type === 'user' ? (
                  <div className="flex justify-end w-full animate-fade-in px-4 sm:px-0 mt-4">
                    <div className="chat-bubble">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  msg.data && (
                    <div className="w-full h-full flex flex-col flex-1">
                       <ResultCard 
                         data={msg.data} 
                         isOnline={isOnline} 
                         bookmarks={settings.bookmarks || []}
                         onToggleBookmark={handleToggleBookmark}
                         reciter={settings.reciter}
                         onShowToast={showToast}
                       />
                    </div>
                  )
                )}
              </div>
            ))}
            
            {state === AppState.LOADING && (
              <div className="flex justify-center py-8">
                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm flex items-center gap-4 border border-[var(--color-primary)]/10">
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <div className="absolute inset-0 border-2 border-[var(--color-primary)]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-[var(--color-primary)] border-t-transparent rounded-full spin"></div>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary-dark)] animate-pulse">{loadingText}</span>
                </div>
              </div>
            )}
            
            {state === AppState.ERROR && (
              <div className="flex justify-center mt-4 mb-4">
                <div className="bg-red-50/80 backdrop-blur-sm text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 border border-red-200/50 shadow-sm max-w-2xl w-full mx-4">
                  <AlertCircle size={22} className="shrink-0 mt-0.5 text-red-500" />
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-sm">عذراً، حدث خطأ</h4>
                    <p className="text-sm opacity-90 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {state === AppState.SUCCESS && (
               <div className="flex justify-center mt-4 mb-4">
                 <button onClick={startNewChat} className="btn-primary rounded-full px-6">
                   <Plus size={18} />
                   <span>موضوع جديد</span>
                 </button>
               </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {!isChatStarted && state !== AppState.LOADING && (
             <div className="mt-4 w-full animate-slide-up">
               {/* Prayer Times Widget */}
               <div className="mb-8 mx-auto max-w-2xl">
                 <PrayerTimesWidget 
                   settings={settings} 
                   onUpdateSettings={setSettings} 
                 />
               </div>

               <div className="mb-5 text-center relative">
                 {/* 3D Decorative Element */}
                 <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 opacity-30 pointer-events-none z-0 animate-float-3d perspective-1000">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] blur-2xl" style={{ transform: 'rotateX(12deg) rotateY(12deg)' }}></div>
                 </div>
                 
                 <div className="relative z-10 flex flex-col items-center">
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] sm:text-xs font-bold text-slate-300 backdrop-blur-md mb-2 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse"></span>
                      {getTimeBasedGreeting()} {settings.username ? `، ${settings.username}` : ''}
                   </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-normal leading-relaxed drop-shadow-md">كيف يمكنني أن أؤنس قلبك اليوم بآيات الله؟</h2>
                 </div>
               </div>

               {/* Primary Core Entry Control - Form & Prompt suggestions */}
               <div className="mb-6 max-w-3xl mx-auto w-full">
                 <EmotionForm onSubmit={handleEmotionSubmit} isLoading={false} isOnline={isOnline} variant="centered" />
                 
                 <div className="mt-3 flex flex-row flex-nowrap overflow-x-auto gap-2 max-w-2xl mx-auto px-4 w-full justify-start md:justify-center no-scrollbar pb-1 snap-x select-none">
                   {[
                     "أشعر بضيق في صدري",
                     "أريد آيات عن الصبر",
                     "كيف أتوكل على الله؟",
                     "أشعر بالقلق من المستقبل",
                     "آيات تجلب السكينة"
                   ].map((prompt, idx) => (
                     <button
                       key={idx}
                       onClick={() => handleEmotionSubmit(prompt)}
                       className="text-[10px] sm:text-[11px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/10 text-white/90 hover:border-[var(--color-gold)]/60 hover:text-[var(--color-gold)] transition-all duration-300 hover:shadow-[0_0_10px_rgba(197,160,89,0.25)] hover:bg-white/10 active:scale-95 shadow-sm shrink-0 snap-center select-none"
                     >
                       {prompt}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Professional Status Grid Panels */}
               <div className="max-w-2xl mx-auto my-8">
                 <DailyVerse />
               </div>

               <div className="mt-16 mb-10">
                 <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="h-px flex-1 bg-gradient-to-l from-[var(--color-border)] to-transparent"></div>
                    <h3 className="text-sm font-bold text-[var(--color-gold)] uppercase drop-shadow-sm">الوصول السريع</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent"></div>
                 </div>
                 
                 <div className="quick-actions-grid">
                   <div className="action-card hijri group" onClick={() => setIsHijriOpen(true)}>
                     <div className="action-card-icon group-hover:scale-110 transition-transform">
                       <Calendar size={18} />
                     </div>
                     <span className="action-card-title">التقويم الهجري</span>
                   </div>
                   <div className="action-card agri group" onClick={() => setIsAgriCalendarOpen(true)}>
                     <div className="action-card-icon group-hover:scale-110 transition-transform">
                       <Leaf size={18} />
                     </div>
                     <span className="action-card-title">التقويم الزراعي</span>
                   </div>
                   <div className="action-card adhkar group" onClick={() => setIsAdhkarOpen(true)}>
                     <div className="action-card-icon group-hover:rotate-12 transition-transform">
                       <BookOpen size={18} />
                     </div>
                     <span className="action-card-title">الأذكار</span>
                   </div>
                   <div className="action-card tasbih group" onClick={() => setIsTasbihOpen(true)}>
                     <div className="action-card-icon group-hover:scale-110 transition-transform">
                       <Plus size={18} />
                     </div>
                     <span className="action-card-title">المسبحة</span>
                   </div>
                   <div className="action-card qibla group" onClick={() => setIsQiblaOpen(true)}>
                     <div className="action-card-icon group-hover:rotate-45 transition-transform">
                       <Compass size={18} />
                     </div>
                     <span className="action-card-title">القبلة</span>
                   </div>
                   <div className="action-card zakat group" onClick={() => setIsZakatOpen(true)}>
                     <div className="action-card-icon group-hover:-translate-y-1 transition-transform">
                       <Calculator size={18} />
                     </div>
                     <span className="action-card-title">الزكاة</span>
                   </div>
                   <div className="action-card names group" onClick={() => setIsNamesOfAllahOpen(true)}>
                     <div className="action-card-icon group-hover:-rotate-12 transition-transform">
                       <Key size={18} />
                     </div>
                     <span className="action-card-title">أسماء الله</span>
                   </div>
                   <div className="action-card bookmarks group" onClick={() => setIsBookmarksOpen(true)}>
                     <div className="action-card-icon group-hover:translate-y-[-4px] transition-transform">
                       <BookmarkIcon size={18} />
                     </div>
                     <span className="action-card-title">المحفوظات</span>
                   </div>
                   <div className="action-card about group" onClick={() => setIsAboutOpen(true)}>
                     <div className="action-card-icon group-hover:scale-110 transition-transform">
                       <Sparkles size={18} />
                     </div>
                     <span className="action-card-title">لمحة عن البرنامج</span>
                   </div>
                 </div>
               </div>
             </div>
          )}
        </main>

        {isChatStarted && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
             <div style={{ height: '40px', background: 'linear-gradient(to bottom, transparent, var(--color-bg))', pointerEvents: 'none' }}></div>
             <div style={{ background: 'var(--color-bg)', padding: '0 1rem', paddingBottom: 'calc(1rem + var(--safe-area-bottom))' }}>
               <div className="max-w-3xl mx-auto w-full">
                 <EmotionForm onSubmit={handleEmotionSubmit} isLoading={state === AppState.LOADING} isOnline={isOnline} variant="bottom" />
               </div>
             </div>
          </div>
        )}
      </div>





      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewChat={startNewChat}
        onOpenTasbih={() => setIsTasbihOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenAdhkar={() => setIsAdhkarOpen(true)}
        onOpenNamesOfAllah={() => setIsNamesOfAllahOpen(true)}
        onOpenQibla={() => setIsQiblaOpen(true)}
        onOpenZakat={() => setIsZakatOpen(true)}
        onOpenHijri={() => setIsHijriOpen(true)}
        onOpenAgriCalendar={() => setIsAgriCalendarOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        userInfo={settings}
        onShowToast={showToast}
      />

      <TasbihModal 
        isOpen={isTasbihOpen} 
        onClose={() => setIsTasbihOpen(false)} 
      />

      <HijriCalendarModal
        isOpen={isHijriOpen}
        onClose={() => setIsHijriOpen(false)}
        hijriOffset={hijriOffset}
        setHijriOffset={setHijriOffset}
      />

      <QiblaModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <ZakatCalculatorModal
        isOpen={isZakatOpen}
        onClose={() => setIsZakatOpen(false)}
      />

      <AgriculturalCalendarModal
        isOpen={isAgriCalendarOpen}
        onClose={() => setIsAgriCalendarOpen(false)}
      />

      <AdhkarModal 
        isOpen={isAdhkarOpen} 
        onClose={() => setIsAdhkarOpen(false)} 
      />

      <NamesOfAllahModal
        isOpen={isNamesOfAllahOpen}
        onClose={() => setIsNamesOfAllahOpen(false)}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={settings.bookmarks || []}
        onRemoveBookmark={(id) => {
          setSettings(prev => {
            const newBookmarks = (prev.bookmarks || []).filter(b => b.id !== id);
            const newSettings = { ...prev, bookmarks: newBookmarks };
            
            showToast('تمت إزالة الآية من المحفوظات', 'info');
            
            // Explicitly sync deletion to backend
            if (userIdRef.current) {
              SyncService.deleteBookmark(userIdRef.current, id, newSettings).catch(console.error);
            }
            
            return newSettings;
          });
        }}
        isOnline={isOnline}
        reciter={settings.reciter}
        onShowToast={showToast}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
        onShowToast={showToast}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        onSelectSession={loadSession}
        onDeleteSession={(id, e) => {
          e.stopPropagation();
          setSessions(prev => prev.filter(s => s.id !== id));
          
          // Also delete from Backend
          if (isOnline && userIdRef.current) {
            SyncService.deleteSession(userIdRef.current, id, settings).catch(err => {
              console.error('Error deleting session from Backend:', err);
            });
          }
        }}
        onClearAll={() => {
          const sessionsToClear = [...sessions];
          setSessions([]);
          localStorage.removeItem('anis_history');
          
          // Also clear from Backend
          if (isOnline && userIdRef.current) {
            SyncService.clearAllSessions(userIdRef.current, sessionsToClear, settings).catch(err => {
              console.error('Error clearing sessions from Backend:', err);
            });
          }
        }}
      />

      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        onShowToast={showToast}
        userInfo={settings}
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
};

export default App;
