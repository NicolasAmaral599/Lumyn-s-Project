import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Sunset, Sparkles, Smile, MessageSquare, 
  Calendar, Award, Activity, CheckCircle, ChevronRight, Brain, Trash2,
  X, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useGamification } from '../contexts/GamificationContext';

interface MoodLog {
  id: string;
  mood: string; // 'exceptional' | 'good' | 'neutral' | 'tired' | 'stressed'
  note: string;
  createdAt: any;
}

const moodOptions = [
  { id: 'exceptional', emoji: '🤩', label: 'Incrível', color: 'from-amber-400 to-yellow-500', glow: 'rgba(245,158,11,0.3)' },
  { id: 'good', emoji: '🙂', label: 'Confortável', color: 'from-emerald-400 to-teal-500', glow: 'rgba(16,185,129,0.3)' },
  { id: 'neutral', emoji: '😐', label: 'Estável', color: 'from-blue-400 to-indigo-500', glow: 'rgba(59,130,246,0.3)' },
  { id: 'tired', emoji: '🥱', label: 'Esgotado', color: 'from-purple-400 to-indigo-600', glow: 'rgba(139,92,246,0.3)' },
  { id: 'stressed', emoji: '😠', label: 'Sob Carga', color: 'from-red-400 to-rose-600', glow: 'rgba(244,63,94,0.3)' },
];

export default function MentalHealth() {
  const [selectedMood, setSelectedMood] = useState('neutral');
  const [note, setNote] = useState('');
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New confirmation overlay state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { addXP, unlockAchievement, completeQuest } = useGamification();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'moodLogs'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodLog[];
      setMoodLogs(logs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/moodLogs`);
    });

    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Brazilian timestamp formatting
  const formatDate = (createdAt: any) => {
    if (!createdAt) return 'Recente';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt.seconds ? createdAt.seconds * 1000 : createdAt);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} — ${hours}:${minutes}`;
  };

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSaveMood = async (e: React.MouseEvent) => {
    const user = auth.currentUser;
    if (!user) return;

    // Securely grant XP only after real user confirmation overlay
    addXP(15, "Medioterapia de Humor Sincronizada! 💆", e);
    unlockAchievement('first_mood');
    completeQuest('quest_mood');

    try {
      await addDoc(collection(db, 'users', user.uid, 'moodLogs'), {
        userId: user.uid,
        mood: selectedMood,
        note: note.trim() || 'Estado verificado sem observações adicionais.',
        createdAt: serverTimestamp()
      });
      window.dispatchEvent(new CustomEvent('lumyn-mood-logged', {
        detail: { mood: selectedMood }
      }));
      setNote('');
      triggerToast("Estado emocional registrado nos seus registros neurais!");
    } catch (error) {
      console.error("Falha ao salvar humor:", error);
    }

    setShowConfirmModal(false);
  };

  const handleDeleteLog = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'moodLogs', logId));
      triggerToast("Registro histórico excluído.");
    } catch (error) {
      console.error("Falha ao deletar registro:", error);
    }
  };

  // Live intelligent emotional engine analysis
  const getEmotionalAnalysis = () => {
    if (moodLogs.length === 0) {
      return {
        title: "Consistência é Paz",
        subtitle: "Aguardando Registros",
        message: "Complete sua cronologia de humor para que a IA analise seus padrões biométricos recentes.",
        colorClass: "from-[#CD3B63] to-[#8B5CF6]",
        statusText: "Aguardando dados...",
        statusColor: "text-amber-300"
      };
    }

    // Sort logs: moodLogs is descending (index 0 is newest)
    const recentLogs = moodLogs.slice(0, 10);
    const totalCount = recentLogs.length;

    // Weight map
    const moodWeights: Record<string, number> = {
      exceptional: 3,
      good: 2,
      neutral: 1,
      tired: -2,
      stressed: -3,
    };

    // Calculate Recency Weighted Score
    // Newer logs weigh much more to allow responsive real-time feedback (index 0 is newest)
    let weightedSum = 0;
    let weightDivider = 0;
    recentLogs.forEach((log, index) => {
      const moodValue = log.mood;
      const weight = moodWeights[moodValue] !== undefined ? moodWeights[moodValue] : 1;
      
      // Decaying multiplier based on index (index 0 is newest)
      let multiplier = 1.0;
      if (index === 0) multiplier = 3.5;
      else if (index === 1) multiplier = 2.5;
      else if (index === 2) multiplier = 1.8;
      else if (index === 3) multiplier = 1.3;
      else multiplier = 1.0;

      weightedSum += weight * multiplier;
      weightDivider += multiplier;
    });

    const weightedScore = weightedSum / weightDivider;

    // Evaluate consecutive states
    let consecutiveStressed = 0;
    let consecutiveExceptional = 0;
    let hasTiredOrStressedRecently = false;

    for (let i = 0; i < totalCount; i++) {
      if (recentLogs[i].mood === 'stressed') {
        consecutiveStressed++;
      } else {
        break;
      }
    }

    for (let i = 0; i < totalCount; i++) {
      if (recentLogs[i].mood === 'exceptional') {
        consecutiveExceptional++;
      } else {
        break;
      }
    }

    // Check if there is any tired or stressed within the last 3 entries
    for (let i = 0; i < Math.min(3, totalCount); i++) {
      if (['tired', 'stressed'].includes(recentLogs[i].mood)) {
        hasTiredOrStressedRecently = true;
      }
    }

    // Calculate volatility (absolute score difference between adjacent chronological log updates)
    let volatility = 0;
    if (totalCount > 1) {
      let absoluteDiffSum = 0;
      for (let i = 0; i < totalCount - 1; i++) {
        const scoreA = moodWeights[recentLogs[i].mood] || 1;
        const scoreB = moodWeights[recentLogs[i + 1].mood] || 1;
        absoluteDiffSum += Math.abs(scoreA - scoreB);
      }
      volatility = absoluteDiffSum / (totalCount - 1);
    }

    const counts = {
      exceptional: recentLogs.filter(l => l.mood === 'exceptional').length,
      good: recentLogs.filter(l => l.mood === 'good').length,
      neutral: recentLogs.filter(l => l.mood === 'neutral').length,
      tired: recentLogs.filter(l => l.mood === 'tired').length,
      stressed: recentLogs.filter(l => l.mood === 'stressed').length,
    };

    // LOGIC MATCHING PATTERNS:

    // 1. Extreme consecutive overload / High stress score
    if (consecutiveStressed >= 3 || weightedScore <= -2.1) {
      return {
        title: "Estresse Persistente",
        subtitle: "ALERTA SEVERO DE RITMO",
        message: "Alerta Clínico: Um ciclo severo de pressões consecutivas foi mapeado. O estresse persistente debilita a retenção de foco em até 60%. Priorize o descanso imediatamente e evite tarefas de alta complexidade teórica.",
        colorClass: "from-red-950 via-rose-900 to-red-900 border border-red-500/20",
        statusText: "Alerta Severo 🔥",
        statusColor: "text-red-300"
      };
    }

    if (weightedScore < -1.1) {
      return {
        title: "Sobrecarga Cognitiva",
        subtitle: "SINAIS CRÍTICOS DE PRESSÃO",
        message: "Análise de rotina concluiu alto teor de sobrecarga cognitiva. Suas capacidades lógicas continuam sob fricção contínua. Desacelere as exigências do dia e use a IA para otimizar suas tarefas agora.",
        colorClass: "from-red-650 via-orange-650 to-red-650",
        statusText: "Sobrecarga Cognitiva 🚨",
        statusColor: "text-rose-100"
      };
    }

    if (weightedScore < -0.2) {
      return {
        title: "Alerta Emocional",
        subtitle: "ESGOTAMENTO MODERADO DETECTADO",
        message: "Seu registro emocional recente entrou em zona de alerta. O estresse e o esgotamento estão começando a pesar mais do que a recuperação biológica. Reduza as demandas de trabalho hoje.",
        colorClass: "from-orange-500 to-red-600",
        statusText: "Sob Pressão ⚠️",
        statusColor: "text-orange-200"
      };
    }

    // 2. High volatility / instability
    if (volatility >= 1.8 && totalCount >= 3) {
      return {
        title: "Oscilação Detectada",
        subtitle: "DIVERGÊNCIA RÁPIDA DE ENERGIA",
        message: "Identifiquei flutuações rápidas de energia mental nos seus registros recentes. Alternar picos de alta performance com cansaço súbito exige cuidado. Tente espaçar e planejar melhor os intervalos de trabalho.",
        colorClass: "from-indigo-650 via-purple-600 to-[#CD3B63]",
        statusText: "Oscilação Detectada ⚡",
        statusColor: "text-purple-200"
      };
    }

    if (weightedScore >= -0.2 && weightedScore < 0.8) {
      // Mixed state or mild fatigue
      if (counts.tired > counts.exceptional + counts.good) {
        return {
          title: "Fadiga Intermitente",
          subtitle: "DÉFICIT RESIDUAL DE REPOUSO",
          message: "Sinais de fadiga mental intermitente detectados. Seu foco e carga estão operando sob gasto contínuo de energia física. Considere programar pausas de 15 minutos adicionais no cronograma.",
          colorClass: "from-blue-600 via-indigo-700 to-[#CD3B63]",
          statusText: "Fadiga Intermitente 🥱",
          statusColor: "text-indigo-200"
        };
      }
      return {
        title: "Sobrecarga Parcial",
        subtitle: "EQUILÍBRIO EM TRANSIÇÃO",
        message: "Você está navegando em uma zona de equilíbrio tênue. Metade dos seus registros recentes indica cansaço residual ou flutuação de ânimo. Que tal reavaliar suas prioridades por algumas horas?",
        colorClass: "from-amber-500 to-orange-650",
        statusText: "Carga Flutuante 😐",
        statusColor: "text-amber-100"
      };
    }

    // 3. High positive states
    if (consecutiveExceptional >= 3 || (weightedScore >= 2.2 && !hasTiredOrStressedRecently)) {
      return {
        title: "Equilíbrio Elevado",
        subtitle: "DESEMPENHO IDEAL CONFIRMADO",
        message: "Seu padrão recente demonstra alto equilíbrio emocional e estabilidade cognitiva. O ritmo atual é ideal para focar em tarefas complexas e tomar decisões lógicas de alto nível. Continue com essa constância saudável!",
        colorClass: "from-emerald-500 to-teal-600",
        statusText: "Equilíbrio Elevado ✨",
        statusColor: "text-emerald-300"
      };
    }

    if (weightedScore >= 1.4) {
      return {
        title: "Mente em Harmonia",
        subtitle: "CONSISTÊNCIA COGNITIVA EXCELENTE",
        message: "Sua mente está operando em um estado altamente produtivo, calmo e harmonioso. Há uma consistência excelente que otimiza sua velocidade de aprendizado sem prejudicar sua energia vital.",
        colorClass: "from-[#4F7CFF] via-indigo-600 to-[#8B5CF6]",
        statusText: "Mente em Harmonia 💆",
        statusColor: "text-blue-200"
      };
    }

    return {
      title: "Fluxo Cognitivo Positivo",
      subtitle: "ESTABILIDADE INTELECTUAL",
      message: "Seus ciclos emocionais mostram consistência e evolução positiva recente. Continue colhendo picos de foco de maneira estruturada e inteligente.",
      colorClass: "from-[#3B82F6] to-[#10B981]",
      statusText: "Fluxo Positivo 🙂",
      statusColor: "text-emerald-300"
    };
  };

  const analysis = getEmotionalAnalysis();

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-16 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-24 right-6 z-[9999] bg-slate-900/95 border border-[#FF4F81]/30 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3"
          >
            <Heart className="text-[#FF4F81]" size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic">Foco & Bem-estar.</h2>
          <p className="text-slate-500 mt-0.5 text-[10px] sm:text-xs md:text-sm font-medium">Harmonize sua capacidade intelectual monitorando picos de energia e fadiga cognitiva.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Interaction Pane */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6 md:space-y-8">
           <div className="bento-card relative overflow-hidden border-white/5 bg-slate-900/30">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4F81]/5 rounded-full blur-2xl pointer-events-none" />
             
             <h3 className="font-display font-black text-xl text-white mb-6">Como está sua energia mental agora?</h3>
             
             {/* Emojis Selector Grid */}
             <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mb-6">
               {moodOptions.map((opt) => {
                 const isSelected = selectedMood === opt.id;
                 return (
                   <button 
                     key={opt.id}
                     onClick={() => setSelectedMood(opt.id)}
                     className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                       isSelected 
                         ? 'bg-gradient-to-br from-white/[0.04] to-transparent border-[#4F7CFF] scale-105' 
                         : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                     }`}
                     style={{ boxShadow: isSelected ? `0 0 20px ${opt.glow}` : 'none' }}
                   >
                     <span className="text-2.5xl sm:text-3.5xl mb-1 sm:mb-2">{opt.emoji}</span>
                     <span className={`text-[8.5px] sm:text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-500'}`}>{opt.label}</span>
                   </button>
                 );
               })}
             </div>

             {/* Personal logs note field */}
             <div className="space-y-3 mb-5">
                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observação Clínica / Resumo Rápido</label>
                <textarea 
                  className="w-full px-4 py-3.5 rounded-2xl sm:rounded-3xl bg-white/[0.04] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 text-slate-200 placeholder:text-slate-600 text-xs sm:text-sm font-medium h-20 sm:h-24 resize-none"
                  placeholder="Exemplo: Fiquei centrado durante o Deep Work, mas sinto leve peso nos ombros..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
             </div>

             <button 
               onClick={handleOpenConfirm}
               className="px-8 py-4 bg-[#4F7CFF] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center gap-2 cursor-pointer"
             >
               <Sunset size={14} /> Registrar Estado Mental
             </button>
           </div>

           {/* Historical logged records */}
           <div className="space-y-4">
              <h4 className="px-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">Registros de Estabilidade Recentes</h4>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-3 border-[#4F7CFF]/25 border-t-[#4F7CFF] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {moodLogs.length === 0 && (
                    <div className="bento-card text-center py-14 text-slate-500 text-xs italic">
                      Zero registros recentes identificados. Registre seu humor diário para preencher sua cronologia.
                    </div>
                  )}
                  {moodLogs.map((log) => {
                    const matchedOpt = moodOptions.find(o => o.id === log.mood) || moodOptions[2];
                    return (
                      <div key={log.id} className="glass p-5 rounded-3xl flex items-start gap-4 hover:border-white/10 transition-all border-white/5 relative group">
                        <span className="text-3.5xl filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">{matchedOpt.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9px] font-black text-[#FF4F81] uppercase tracking-widest">{matchedOpt.label}</span>
                            <span className="text-[9px] text-slate-500 font-bold font-mono">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed italic">{log.note}</p>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteLog(log.id, e)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 opacity-100 p-2 rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-400 active:scale-95 transition-all cursor-pointer absolute right-3 top-3"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
           </div>
        </div>

        {/* Dynamic Mental Health AI Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <div className={`bg-gradient-to-br ${analysis.colorClass} p-8 rounded-[2.5rem] text-white shadow-xl shadow-pink-500/10 relative overflow-hidden group transition-all duration-500`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/15">
                 <Heart size={24} className="text-white fill-white/10" />
              </div>
              
              <h3 className="text-2xl font-display font-black mb-1.5 leading-tight">{analysis.title}</h3>
              <p className="text-white/60 text-[9px] uppercase tracking-widest font-bold mb-4">{analysis.subtitle}</p>
              
              <p className="text-white/85 text-xs leading-relaxed mb-6 italic">
                "{analysis.message}"
              </p>
              
              <div className="p-4 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFF]">Equilíbrio Recente</span>
                <span className={`text-xs font-black ${analysis.statusColor}`}>{analysis.statusText}</span>
              </div>
           </div>

           <div className="bento-card bg-slate-900/30">
              <div className="flex items-center gap-2.5 mb-6">
                 <Activity className="text-rose-450" size={18} />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sinergia Emocional IA</span>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed italic">
                 "Ao associar seu humor em tempo de execução, correlacionamos cansaços com prazos acadêmicos para que o Mentor IA filtre metas agressivas à sua saúde intelectual."
              </p>
           </div>
        </div>
      </div>

      {/* Mood Entry Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden text-center bg-slate-900/60"
            >
              <div className="w-14 h-14 bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-4">
                <Smile size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-white">Validar Check-in Emocional?</h3>
                <p className="text-slate-450 text-xs font-medium leading-relaxed">
                  Deseja realmente registrar seu humor como <strong className="text-white">"{moodOptions.find(o => o.id === selectedMood)?.label}"</strong> agora no Lumyn?
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Incentivo ao Autoconhecimento</span>
                <span className="text-sm font-black font-mono text-amber-500">+15 XP ⭐</span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/2 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest hover:scale-101 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleConfirmSaveMood(e)}
                  className="w-1/2 py-3.5 rounded-xl bg-[#4F7CFF] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:scale-101 transition-all cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
