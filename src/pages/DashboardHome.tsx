import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Clock, Heart, Brain, ChevronRight, 
  Target, CheckCircle2, TrendingUp, AlertCircle, Sparkles, Trophy, Award, Star, Flame, Smile,
  User, Image, Sliders, RefreshCw, Trash2, Camera, Compass, MessageSquareCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useGamification } from '../contexts/GamificationContext';

const productivityData = [
  { name: 'Seg', foco: 65, energia: 80 },
  { name: 'Ter', foco: 75, energia: 70 },
  { name: 'Qua', foco: 85, energia: 90 },
  { name: 'Qui', foco: 60, energia: 65 },
  { name: 'Sex', foco: 95, energia: 85 },
  { name: 'Sab', foco: 50, energia: 60 },
  { name: 'Dom', foco: 65, energia: 72 },
];

const habits = [
  { name: 'Trabalho Profundo', progress: 80, color: '#4F7CFF' },
  { name: 'Meditação Mindfulness', progress: 55, color: '#8B5CF6' },
  { name: 'Hidratação & Foco', progress: 95, color: '#06B6D4' },
];

const presetAvatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?q=80&w=250&auto=format&fit=crop"
];

export default function DashboardHome() {
  const [userName, setUserName] = useState('');
  const [taskCount, setTaskCount] = useState({ active: 0, completed: 0 });
  
  const { xp, level, streak, achievements, dailyQuests, completeQuest, resetGamification } = useGamification();

  // Profile Form States
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(presetAvatars[0]);
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1.2);
  const [primaryObjective, setPrimaryObjective] = useState('Maximizar Produtividade');
  const [companionTone, setCompanionTone] = useState('Acolhedor e Tecnológico');

  // Confirmation Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Success animations check-markers
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Desbravador');
      setDisplayNameInput(user.displayName || user.email?.split('@')[0] || '');

      // Load extended settings from Firestore
      const loadProfile = async () => {
        try {
          const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            if (data.bio) setBioInput(data.bio);
            if (data.photoUrl) setSelectedPhoto(data.photoUrl);
            if (data.cropZoom) setCropZoom(data.cropZoom);
            if (data.primaryObjective) setPrimaryObjective(data.primaryObjective);
            if (data.companionTone) setCompanionTone(data.companionTone);
          }
        } catch (e) {
          console.error("Error loading profile configuration:", e);
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}/profile/info`);
        }
      };
      
      loadProfile();

      // Load task metrics realtime
      const q = query(collection(db, 'users', user.uid, 'tasks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let active = 0;
        let completed = 0;
        snapshot.docs.forEach((doc) => {
          const stats = doc.data().status;
          if (stats === 'completed') {
            completed += 1;
          } else if (stats === 'todo' || stats === 'in-progress') {
            active += 1;
          }
        });
        setTaskCount({ active, completed });
      }, (error) => {
        console.error('Error fetching tasks:', error);
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`);
      });
      return () => unsubscribe();
    }
  }, []);

  // Base64 file uploader reader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setUploadBase64(resultStr);
        setSelectedPhoto(resultStr);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setProfileSavedFeedback(true);
      
      // 1. Update firebase baseline Auth parameters
      // Prevent "photoURL too long" error if the photo is a large base64 data URL (Firebase Auth limit is 2048 chars)
      const authUpdates: { displayName?: string; photoURL?: string } = {
        displayName: displayNameInput.trim()
      };
      
      if (selectedPhoto && !selectedPhoto.startsWith('data:') && selectedPhoto.length <= 2048) {
        authUpdates.photoURL = selectedPhoto;
      }
      
      await updateProfile(user, authUpdates);

      // Update local quick name to render
      setUserName(displayNameInput.trim().split(' ')[0] || 'Desbravador');

      // 2. Persist extended attributes to firestore database
      const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
      await setDoc(profileRef, {
        displayName: displayNameInput.trim(),
        bio: bioInput.trim(),
        photoUrl: selectedPhoto,
        cropZoom,
        primaryObjective,
        companionTone,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setTimeout(() => {
        setProfileSavedFeedback(false);
      }, 3500);
    } catch (e) {
      console.error("Erro ao sincronizar informações do desbravador:", e);
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/profile/info`);
    }
  };

  const triggerResetProgression = async () => {
    setIsResetting(true);
    await resetGamification();
    setIsResetting(false);
    setShowResetModal(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3 sm:gap-4.5">
          {/* Beautiful Crop Avatar inside Home Frame Header */}
          <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#4F7CFF] shadow-inner flex items-center justify-center bg-slate-930 shrink-0">
            <img 
              referrerPolicy="no-referrer"
              src={selectedPhoto} 
              alt="Avatar Cropped"
              className="w-full h-full object-cover"
              style={{ transform: `scale(${cropZoom})` }}
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-3.5xl md:text-3xl lg:text-4xl font-display font-black text-white">Excelente dia, {userName}! 👋</h1>
            <p className="text-slate-400 mt-0.5 text-[10px] sm:text-xs md:text-sm font-medium italic">Sua cognição está <span className="text-[#4F7CFF] font-black">75% mais eficiente</span>. Mantenha o impulso!</p>
          </div>
        </div>
        
        {/* Streak & Active indicators */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
          <div className="glass px-3.5 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl flex flex-col justify-center border-white/5 relative overflow-hidden">
             <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Ranking Global</span>
             <span className="text-xs sm:text-lg font-display font-black text-white mt-0.5 sm:mt-1">Top 3% 🔥</span>
          </div>
          <div className="bg-[#4F7CFF] text-white px-3.5 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl flex flex-col justify-center shadow-lg shadow-blue-500/20 relative overflow-hidden">
             <span className="text-[8px] sm:text-[10px] font-black text-white/70 uppercase tracking-widest leading-none">Meta Ativa</span>
             <span className="text-xs sm:text-lg font-display font-black mt-0.5 sm:mt-1">{taskCount.active} Primárias</span>
          </div>
        </div>
      </div>

      {/* Gamification Core row: Daily Quests and Trophy Case */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Daily Quests Container with high gamified look */}
        <div className="col-span-12 lg:col-span-7 bento-card border border-amber-500/10 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Trophy size={160} className="text-amber-400 stroke-[0.3]" />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400 animate-pulse" size={20} />
              <h3 className="text-xl font-display font-black text-white">Missões Diárias de Foco</h3>
            </div>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
              XP Dobrado Hoje
            </span>
          </div>

          <div className="space-y-3.5">
            {dailyQuests.map((quest) => (
              <div 
                key={quest.id} 
                className={`flex items-center justify-between p-4.5 rounded-2xl border transition-all cursor-pointer ${
                  quest.completed 
                    ? 'bg-emerald-500/10 border-emerald-500/20 opacity-70' 
                    : 'bg-white/[0.03] border-white/5 hover:border-amber-500/30 hover:bg-white/[0.05]'
                }`}
                onClick={() => !quest.completed && completeQuest(quest.id)}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    quest.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
                  }`}>
                    {quest.completed && <CheckCircle2 size={14} className="text-[#111827]" />}
                  </div>
                  <span className={`text-xs font-semibold ${quest.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                    {quest.text}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black font-mono ${quest.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    +{quest.xp} XP
                  </span>
                  <Sparkles size={12} className={quest.completed ? 'text-emerald-400' : 'text-amber-400'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trophies achievements quick display */}
        <div className="col-span-12 lg:col-span-5 bento-card text-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-display font-black text-white flex items-center gap-2">
              <Award className="text-purple-400" size={20} /> Suas Conquistas
            </h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estágio {level}</span>
          </div>

          <p className="text-slate-400 text-xs mb-6">Complete tarefas lógicas e metas biométricas para desbloquear as seguintes medalhas premium:</p>
          
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((ach) => (
              <div 
                key={ach.id} 
                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all relative group border ${
                  ach.unlocked 
                    ? 'bg-[#1E1B4B]/35 border-[#8B5CF6]/30 shadow-md shadow-[#8B5CF6]/5 animate-pulse-glow' 
                    : 'bg-white/[0.02] border-white/5 opacity-40'
                }`}
                title={ach.description}
              >
                <span className="text-2.5xl mb-2 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
                {ach.id === 'first_task' ? '🏅' : 
                 ach.id === 'first_mood' ? '💆' :
                 ach.id === 'first_decision' ? '⚖️' :
                 ach.id === 'first_chat' ? '🧩' :
                 ach.id === 'first_mastery' ? '🎓' : '🔥'}
                </span>
                
                <span className="text-[8px] font-black text-white truncate max-w-full uppercase tracking-wider">{ach.title}</span>
                <span className={`text-[8px] font-black mt-1 uppercase ${ach.unlocked ? 'text-green-400' : 'text-slate-500'}`}>
                  {ach.unlocked ? 'Descoberto' : 'Bloqueado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics and Advice Core */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Performance Chart with PT-BR configs */}
        <div className="lg:col-span-2 bento-card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-[#4F7CFF]" size={18} />
              <h3 className="text-xl font-display font-black text-white">Análise Dinâmica de Performance</h3>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorFoco" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F7CFF" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#4F7CFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEnergia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#4F7CFF' }}
                />
                <Area type="monotone" name="Foco" dataKey="foco" stroke="#4F7CFF" strokeWidth={4} fillOpacity={1} fill="url(#colorFoco)" />
                <Area type="monotone" name="Carga" dataKey="energia" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergia)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Neural Core Advisor dynamic panel */}
        <div className="bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] p-8 rounded-[2.5rem] text-white flex flex-col shadow-xl shadow-blue-500/10 justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-xl border border-white/10">
              <Brain className="text-white" />
            </div>
            <h3 className="text-xl font-display font-black mb-4 flex items-center gap-1">Previsão Neural <Sparkles size={16} /></h3>
            <p className="text-white/85 text-sm leading-relaxed mb-6 italic">
              "Análise de rotina concluída. Seus picos de dopamina em atividades intelectuais ocorrem tradicionalmente nas manhãs de sexta-feira. Agende suas tarefas lógicas difíceis hoje."
            </p>
          </div>
          
          <div className="space-y-4">
             <div className="p-4 rounded-xl bg-white/10 border border-white/10 flex items-center gap-3">
               <TrendingUp size={18} className="text-white" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-white">Velocidade +15% acima da média</span>
              </div>
              <Link to="/dashboard/ai" className="w-full py-4 rounded-xl bg-white text-[#4F7CFF] font-black text-xs uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform block text-center shadow-lg">
                Sincronizar Roteiro
              </Link>
          </div>
        </div>
      </div>

      {/* Modules Row widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
        <Widget 
          icon={<Heart size={20} className="text-[#FF4F81]" />}
          title="Foco Corrente" 
          value="Equilibrado"
          subtitle="Ciclo Estável de 3d"
        />
        <Widget 
          icon={<Clock size={20} className="text-[#F59E0B]" />}
          title="Carga Cognitiva" 
          value="4.5 h"
          subtitle="Trabalho Focado Diário"
        />
        <Widget 
          icon={<CheckCircle2 size={20} className="text-[#10B981]" />}
          title="Progresso de Metas" 
          value={`${taskCount.completed} concluídas`}
          subtitle="Falta pouco para progredir"
        />
        <Widget 
          icon={<AlertCircle size={20} className="text-[#8B5CF6]" />}
          title="Simulações Lógicas" 
          value="Ativo"
          subtitle="Tomada de Decisão"
        />
      </div>

      {/* Profile & Logic Synchronization (FULL SETTINGS AND RESET SECTION) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        
        {/* User Profile settings panel */}
        <div className="xl:col-span-8 bento-card space-y-6 relative overflow-hidden bg-slate-900/30">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4.5">
            <div className="w-10 h-10 rounded-xl bg-[#4F7CFF]/10 text-[#4F7CFF] flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-white">Perfil do Desbravador</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sincronize sua identidade intelectual</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Avatar management crop simulator */}
            <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white/[0.02] border border-white/5 text-center space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Avatar & Crop</span>
              
              {/* Circular circular preview crop viewer */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#4F7CFF]/30 select-none flex items-center justify-center bg-black/20 relative group">
                <img 
                  src={selectedPhoto} 
                  alt="Crop Preview" 
                  className="w-full h-full object-cover transition-transform" 
                  style={{ transform: `scale(${cropZoom})` }}
                />
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-opacity">
                   <Camera size={16} className="mr-1.5" /> Enviar
                   <input 
                     type="file" 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handlePhotoUpload} 
                   />
                </label>
              </div>

              {/* Crop Zoom slider simulations */}
              <div className="w-full space-y-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 block">Zoom de Enquadramento: {cropZoom.toFixed(1)}x</span>
                <input 
                  type="range" 
                  min="1.0" 
                  max="2.5" 
                  step="0.1" 
                  className="w-full accent-[#4F7CFF]"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                />
              </div>

              {/* Instant presets */}
              <div className="space-y-1 w-full text-center">
                <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-widest">Presets Rápidos</span>
                <div className="flex justify-center gap-1.5 pt-1">
                  {presetAvatars.map((url, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedPhoto(url)}
                      className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${selectedPhoto === url ? 'border-[#4F7CFF] scale-105' : 'border-white/10 opacity-75'}`}
                    >
                      <img src={url} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Editing inputs form attributes */}
            <div className="md:col-span-2 space-y-4">
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Alcunha / Nome de Exibição</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-black/30 border border-white/5 focus:border-[#4F7CFF] text-white rounded-xl text-xs font-semibold focus:outline-none"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Objetivo Principal de IA</label>
                    <select
                      className="w-full px-4 py-2.5 bg-black/40 border border-[#FFF]/5 focus:border-[#4F7CFF] text-slate-350 rounded-xl text-xs font-bold focus:outline-none"
                      value={primaryObjective}
                      onChange={(e) => setPrimaryObjective(e.target.value)}
                    >
                      <option className="bg-[#111827]">Maximizar Produtividade</option>
                      <option className="bg-[#111827]">Sincronia Acadêmica Máxima</option>
                      <option className="bg-[#111827]">Consistência Biométrica</option>
                      <option className="bg-[#111827]">Trabalho Focado Profundo</option>
                    </select>
                  </div>
               </div>

                <div className="space-y-2">
                 <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Seu Biotipo / Biografia de Performance</label>
                 <textarea 
                   rows={2}
                   placeholder="Mapeie o que estimula sua performance acadêmica ou vital..."
                   className="w-full px-4 py-3 bg-black/30 border border-white/5 focus:border-[#4F7CFF] text-white rounded-xl text-xs font-semibold focus:outline-none resize-none"
                   value={bioInput}
                   onChange={(e) => setBioInput(e.target.value)}
                 />
                </div>

               <div className="space-y-2">
                 <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Tom de Comunicação da IA Favorito</label>
                 <select
                   className="w-full px-4 py-2.5 bg-black/40 border border-[#FFF]/5 focus:border-[#4F7CFF] text-slate-350 rounded-xl text-xs font-bold focus:outline-none"
                   value={companionTone}
                   onChange={(e) => setCompanionTone(e.target.value)}
                 >
                   <option className="bg-[#111827]">Acolhedor e Tecnológico</option>
                   <option className="bg-[#111827]">Puramente Acadêmico e Pragmático</option>
                   <option className="bg-[#111827]">Estilo Mentor Corporativo Ativo</option>
                 </select>
               </div>

               <div className="flex items-center justify-between pt-2">
                 <button 
                   onClick={handleSaveProfile}
                   className="px-6 py-3.5 bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] text-white text-[10px] uppercase font-black tracking-widest rounded-xl hover:opacity-90 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                 >
                   Sincronizar Informações
                 </button>
                 
                 <AnimatePresence>
                   {profileSavedFeedback && (
                     <motion.span 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       exit={{ opacity: 0 }} 
                       className="text-[10px] text-green-400 font-extrabold uppercase animate-pulse"
                     >
                       Sincronizado via Banco! ✨  
                     </motion.span>
                   )}
                 </AnimatePresence>
               </div>

            </div>
          </div>
        </div>

        {/* Global Progress Control Settings Section */}
        <div className="xl:col-span-4 bento-card border border-red-500/10 flex flex-col justify-between relative overflow-hidden bg-slate-900/30">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Trash2 size={120} className="text-red-500" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-500">
               <Sliders size={18} className="animate-spin-slow" />
               <span className="text-[10px] font-black uppercase tracking-widest">Painel Clínico de Progressão</span>
            </div>
            
            <h3 className="text-lg font-display font-black text-white leading-tight">Configuração de Desenvolvimento</h3>
            
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
               Deseja redefinir todo o progresso do seu perfil no Lumyn? Isso retornará seus níveis, XP total das missões e conquistas adquiridas para o zero de baseline, sem apagar sua conta ou tarefas.
            </p>
          </div>

          <div className="pt-6">
             <button 
               onClick={() => setShowResetModal(true)}
               className="w-full py-4 rounded-xl bg-red-950/20 hover:bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] uppercase font-black tracking-widest hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/30"
             >
               <RefreshCw size={12} className="text-red-400" /> Resetar Toda a Progressão
             </button>
          </div>
        </div>

      </div>

      {/* Extreme Warn of Progression Reset Popup */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full glass p-8 rounded-[2.5rem] border border-red-500/20 shadow-2xl space-y-6 relative overflow-hidden text-center bg-slate-900/90"
            >
              <div className="w-14 h-14 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-4">
                <AlertCircle size={28} className="animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-red-400">Restaurar toda a Progressão?</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Isso redefinirá seu nível para <strong className="text-white">Nível 1</strong>, zerará seus marcos de XP e reverterá suas conquistas. Esta operação é irreversível.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nível Atual</span>
                <span className="text-sm font-black font-mono text-red-400">Nível {level} ➡️ Nível 1</span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setShowResetModal(false)}
                  className="w-1/2 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest hover:scale-101 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={triggerResetProgression}
                  className="w-1/2 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/10 hover:scale-101 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isResetting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Sim, Resetar Agora"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function Widget({ icon, title, value, subtitle }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      className="bento-card flex flex-col justify-between hover:border-white/10"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-8 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1.5">{title}</p>
        <p className="text-2.5xl font-display font-black text-white tracking-tight">{value}</p>
        <p className="text-[9px] font-bold text-slate-600 mt-2.5 uppercase tracking-widest">{subtitle}</p>
      </div>
    </motion.div>
  );
}
