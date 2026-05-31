import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface DailyQuest {
  id: string;
  text: string;
  xp: number;
  completed: boolean;
}

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  achievements: Achievement[];
  dailyQuests: DailyQuest[];
}

interface XPFeedback {
  id: string;
  amount: number;
  reason: string;
  x: number;
  y: number;
}

interface GamificationContextType {
  xp: number;
  level: number;
  streak: number;
  achievements: Achievement[];
  dailyQuests: DailyQuest[];
  xpFeedbacks: XPFeedback[];
  showLevelUp: boolean;
  addXP: (amount: number, reason: string, event?: React.MouseEvent | { x: number; y: number }) => void;
  unlockAchievement: (id: string) => void;
  completeQuest: (id: string) => void;
  closeLevelUp: () => void;
  recheckStreak: () => void;
  resetGamification: () => Promise<void>;
  updateStreak: (newStreak: number) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', title: 'Primeiro Passo', description: 'Concluiu sua primeira tarefa no Lumyn', icon: 'CheckCircle2', xpReward: 50, unlocked: false },
  { id: 'first_mood', title: 'Autoconhecimento', description: 'Registrou sua primeira análise de humor', icon: 'Smile', xpReward: 40, unlocked: false },
  { id: 'first_decision', title: 'Mestre da Estratégia', description: 'Simulou uma decisão complexa com a IA', icon: 'Scale', xpReward: 60, unlocked: false },
  { id: 'first_chat', title: 'Explorador da Mente', description: 'Iniciou seu primeiro chat com o assistente de IA', icon: 'Brain', xpReward: 30, unlocked: false },
  { id: 'first_mastery', title: 'Início da Jornada', description: 'Adicionou sua primeira matéria para estudos', icon: 'GraduationCap', xpReward: 50, unlocked: false },
  { id: 'streak_3', title: 'Hábito Inabalável', description: 'Alcançou uma sequência de 3 dias ativos', icon: 'Zap', xpReward: 100, unlocked: false },
];

const INITIAL_QUESTS: DailyQuest[] = [
  { id: 'quest_task', text: 'Concluir uma tarefa de alta prioridade', xp: 30, completed: false },
  { id: 'quest_mood', text: 'Registrar o seu humor e estado de espírito', xp: 20, completed: false },
  { id: 'quest_ai', text: 'Conversar com a IA para obter um insight diário', xp: 25, completed: false },
];

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(1);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(INITIAL_QUESTS);
  
  const [xpFeedbacks, setXpFeedbacks] = useState<XPFeedback[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [loading, setLoading] = useState(true);

  // Anti-exploit trigger registry to prevent duplicate rapid spamming
  const triggerTimesRef = React.useRef<{ [reason: string]: number }>({});
  
  // Load from Firebase on Auth state change
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLoading(true);
        try {
          const docRef = doc(db, 'users', user.uid, 'gamification', 'status');
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as GamificationState;
            setXp(data.xp ?? 0);
            setLevel(data.level ?? 1);
            setStreak(data.streak ?? 1);
            setLastActiveDate(data.lastActiveDate ?? null);
            
            // Merge achievements
            const fetchedAchievements = data.achievements ?? [];
            const mergedAchievements = INITIAL_ACHIEVEMENTS.map(initial => {
              const found = fetchedAchievements.find(f => f.id === initial.id);
              return found ? { ...initial, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : initial;
            });
            setAchievements(mergedAchievements);

            // Merge quests (reset if it's a new day)
            const todayStr = new Date().toISOString().split('T')[0];
            const fetchedQuests = data.dailyQuests ?? [];
            if (data.lastActiveDate !== todayStr) {
              setDailyQuests(INITIAL_QUESTS);
            } else {
              const mergedQuests = INITIAL_QUESTS.map(initial => {
                const found = fetchedQuests.find(f => f.id === initial.id);
                return found ? { ...initial, completed: found.completed } : initial;
              });
              setDailyQuests(mergedQuests);
            }
          } else {
            // New user gamification setup
            const firstDate = new Date().toISOString().split('T')[0];
            const initialData = {
              xp: 0,
              level: 1,
              streak: 1,
              lastActiveDate: firstDate,
              achievements: INITIAL_ACHIEVEMENTS,
              dailyQuests: INITIAL_QUESTS
            };
            await setDoc(docRef, initialData);
            setXp(0);
            setLevel(1);
            setStreak(1);
            setLastActiveDate(firstDate);
            setAchievements(INITIAL_ACHIEVEMENTS);
            setDailyQuests(INITIAL_QUESTS);
          }
          
          // Verify streak logic on login
          verifyStreakOnLoad(user.uid, docSnap.exists() ? docSnap.data() : null);
        } catch (error) {
          console.error("Erro ao carregar gamificação:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Clear local state if logged out
        setXp(0);
        setLevel(1);
        setStreak(1);
        setLastActiveDate(null);
        setAchievements(INITIAL_ACHIEVEMENTS);
        setDailyQuests(INITIAL_QUESTS);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const verifyStreakOnLoad = async (uid: string, fetchedData: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = fetchedData?.streak ?? 1;
    let lastActive = fetchedData?.lastActiveDate ?? null;

    if (lastActive) {
      if (lastActive === todayStr) {
        // Already active today, streak safe
      } else if (lastActive === yesterdayStr) {
        // Last active was yesterday, streak preserved. We update lastActive to today.
        currentStreak += 1;
        lastActive = todayStr;
      } else {
        // Streak broken
        currentStreak = 1;
        lastActive = todayStr;
      }
    } else {
      lastActive = todayStr;
      currentStreak = 1;
    }

    try {
      const docRef = doc(db, 'users', uid,'gamification', 'status');
      await updateDoc(docRef, {
        streak: currentStreak,
        lastActiveDate: lastActive
      });
      setStreak(currentStreak);
      setLastActiveDate(lastActive);

      // Check streak achievements
      if (currentStreak >= 3) {
        unlockAchievement('streak_3');
      }
    } catch (e) {
      // If document wasn't fully created, write it on updateDoc failure
    }
  };

  const syncToFirebase = async (updatedXp: number, updatedLevel: number, updatedStreak: number, updatedAch: Achievement[], updatedQuests: DailyQuest[]) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'users', user.uid, 'gamification', 'status');
      await setDoc(docRef, {
        xp: updatedXp,
        level: updatedLevel,
        streak: updatedStreak,
        lastActiveDate: todayStr,
        achievements: updatedAch,
        dailyQuests: updatedQuests
      }, { merge: true });
    } catch (e) {
      console.warn("Falha no sync do Firebase:", e);
    }
  };

  const recheckStreak = () => {
    const user = auth.currentUser;
    if (user) {
      verifyStreakOnLoad(user.uid, { streak, lastActiveDate });
    }
  };

  const addXP = (amount: number, reason: string, event?: React.MouseEvent | { x: number; y: number }) => {
    // Anti-exploit check: prevent rapid submission of identical XP triggers within 4 seconds
    const now = Date.now();
    const lastTrigger = triggerTimesRef.current[reason] || 0;
    if (now - lastTrigger < 4000) {
      console.warn(`[ANTI-EXPLOIT] Throttling duplicate XP event: "${reason}"`);
      return;
    }
    triggerTimesRef.current[reason] = now;

    // Determine click position for visual feedback
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2 - 100;
    
    if (event) {
      if ('clientX' in event) {
        x = event.clientX;
        y = event.clientY;
      } else {
        x = event.x;
        y = event.y;
      }
    }

    // Add visual feedback item
    const feedbackId = Math.random().toString(36).substring(2, 9);
    setXpFeedbacks(prev => [...prev, { id: feedbackId, amount, reason, x, y }]);
    
    // Dispatch global event for interactive mascot (Wingman)
    window.dispatchEvent(new CustomEvent('lumyn-xp-gained', {
      detail: { amount, reason }
    }));

    // Auto-remove feedback after animation
    setTimeout(() => {
      setXpFeedbacks(prev => prev.filter(fb => fb.id !== feedbackId));
    }, 2000);

    // Calculate new levels (each level requires Level * 100 XP)
    let newXp = xp + amount;
    let currentLevel = level;
    let leveledUp = false;

    // Formula: level 1 is 0-100, level 2 is 101-250, level 3 is 251-450, etc. (Level * 150)
    const xpNeededForNextLevel = (lvl: number) => lvl * 150;

    while (newXp >= xpNeededForNextLevel(currentLevel)) {
      newXp -= xpNeededForNextLevel(currentLevel);
      currentLevel += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      setShowLevelUp(true);
    }

    setXp(newXp);
    setLevel(currentLevel);
    
    // Trigger sync
    syncToFirebase(newXp, currentLevel, streak, achievements, dailyQuests);
  };

  const unlockAchievement = (id: string) => {
    let unlockedReward = 0;
    const updatedAchievements = achievements.map(ach => {
      if (ach.id === id && !ach.unlocked) {
        unlockedReward = ach.xpReward;
        return {
          ...ach,
          unlocked: true,
          unlockedAt: new Date().toLocaleDateString('pt-BR')
        };
      }
      return ach;
    });

    if (unlockedReward > 0) {
      setAchievements(updatedAchievements);
      
      const achTitle = INITIAL_ACHIEVEMENTS.find(a => a.id === id)?.title || '';
      window.dispatchEvent(new CustomEvent('lumyn-achievement-unlocked', {
        detail: { id, title: achTitle }
      }));

      // Give the feedback & XP!
      addXP(unlockedReward, `Conquista: ${achTitle}! 🏆`);
    }
  };

  const completeQuest = (id: string) => {
    let questReward = 0;
    const updatedQuests = dailyQuests.map(q => {
      if (q.id === id && !q.completed) {
        questReward = q.xp;
        return { ...q, completed: true };
      }
      return q;
    });

    if (questReward > 0) {
      setDailyQuests(updatedQuests);
      
      const qText = INITIAL_QUESTS.find(q => q.id === id)?.text || '';
      window.dispatchEvent(new CustomEvent('lumyn-quest-completed', {
        detail: { id, text: qText }
      }));

      addXP(questReward, `Missão Diária Concluída! 🎯`);
      syncToFirebase(xp, level, streak, achievements, updatedQuests);
    }
  };

  const resetGamification = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'users', user.uid, 'gamification', 'status');
      
      const resetAchievements = INITIAL_ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: false,
        unlockedAt: undefined
      }));
      
      const resetQuests = INITIAL_QUESTS.map(q => ({
        ...q,
        completed: false
      }));

      const initialData = {
        xp: 0,
        level: 1,
        streak: 1,
        lastActiveDate: todayStr,
        achievements: resetAchievements,
        dailyQuests: resetQuests
      };

      await setDoc(docRef, initialData);
      
      setXp(0);
      setLevel(1);
      setStreak(1);
      setLastActiveDate(todayStr);
      setAchievements(resetAchievements);
      setDailyQuests(resetQuests);
      
      // Wipe the throttle registry to clean state
      triggerTimesRef.current = {};
    } catch (e) {
      console.error("Erro ao resetar gamificação:", e);
    }
  };

  const updateStreak = async (newStreak: number) => {
    if (newStreak < 1) return;
    setStreak(newStreak);
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'gamification', 'status');
        await updateDoc(docRef, {
          streak: newStreak
        });
      } catch (e) {
        console.warn("Falha no sync do updateStreak:", e);
      }
    }
  };

  const closeLevelUp = () => setShowLevelUp(false);

  return (
    <GamificationContext.Provider value={{
      xp,
      level,
      streak,
      achievements,
      dailyQuests,
      xpFeedbacks,
      showLevelUp,
      addXP,
      unlockAchievement,
      completeQuest,
      closeLevelUp,
      recheckStreak,
      resetGamification,
      updateStreak
    }}>
      {/* Floating XP Feedbacks */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {xpFeedbacks.map(fb => (
          <div
            key={fb.id}
            style={{
              position: 'absolute',
              left: fb.x,
              top: fb.y,
              transform: 'translate(-50%, -50%)',
            }}
            className="flex flex-col items-center animate-fade-up pointer-events-none"
          >
            <span className="text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]">
              +{fb.amount} XP
            </span>
            <span className="text-xs font-bold text-white bg-slate-900 border border-white/10 px-2 py-0.5 rounded-lg shadow-lg max-w-[200px] text-center">
              {fb.reason}
            </span>
          </div>
        ))}
      </div>

      {/* Level Up Overlay Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          {/* Neon Starburst Visual behind */}
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-[#4F7CFF]/30 to-[#8B5CF6]/30 rounded-full blur-[100px]" />
          
          <div className="relative max-w-md w-full glass p-10 rounded-[3rem] border border-white/20 shadow-2xl text-center bg-slate-900/40 relative overflow-hidden">
            {/* Ambient sparks floating in */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#4F7CFF]/10 to-transparent" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20 text-white text-5xl mb-6 transform scale-110 animate-bounce">
                ⭐
              </div>
              
              <h2 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-500 mb-2 leading-tight">
                SUBIU DE NÍVEL!
              </h2>
              <p className="text-slate-400 text-sm font-semibold mb-6">
                Você evoluiu para o nível superior da inteligência
              </p>

              <div className="py-6 px-8 rounded-2xl bg-white/5 border border-white/5 mb-8 inline-block">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-widest mb-1">Seu Novo Nível</span>
                <span className="text-5xl font-display font-black text-white">{level}</span>
              </div>

              <p className="text-xs text-slate-400 italic mb-8 max-w-xs mx-auto">
                "O progresso não é um acidente, é o resultado de foco e refinada cognição diária."
              </p>

              <button
                onClick={closeLevelUp}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:scale-102 transition-transform cursor-pointer"
              >
                Incrível! Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification deve ser usado com um GamificationProvider');
  }
  return context;
}
