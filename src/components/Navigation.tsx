import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, LayoutDashboard, Brain, CheckCircle, GraduationCap, Heart, Settings, LogOut, Target, Flame, X, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamification } from '../contexts/GamificationContext';

export const STREAK_DAYS_CONFIG = [
  { day: 1, name: 'Brasa Inicial', color: '#F97316', label: '1 Dia', text: 'Laranja Vibrante', desc: 'Início da sua chama de foco diário.' },
  { day: 2, name: 'Chama Escarlate', color: '#EF4444', label: '2 Dias', text: 'Vermelho Quente', desc: 'A constância se torna visível!' },
  { day: 3, name: 'Brilho Violeta', color: '#EC4899', label: '3 Dias', text: 'Rosa Choque', desc: 'Alta energia cerebral!' },
  { day: 4, name: 'Néctar de Magenta', color: '#D946EF', label: '4 Dias', text: 'Magenta Neon', desc: 'Um hábito inabalável se forma!' },
  { day: 5, name: 'Trabalho Cósmico', color: '#A855F7', label: '5 Dias', text: 'Roxo Violeta', desc: 'Frequência cerebral elevada!' },
  { day: 6, name: 'Aura Holográfica', color: '#8B5CF6', label: '6 Dias', text: 'Roxo Índigo', desc: 'Mente e máquina em sinergia!' },
  { day: 7, name: 'Fogo Transcendental', color: '#7C3AED', label: '7+ Dias', text: 'Roxo Definitivo', desc: 'Status Lendário! Conexão mental pura.' }
];

export const getStreakColor = (day: number): string => {
  if (day <= 1) return '#F97316';
  if (day === 2) return '#EF4444';
  if (day === 3) return '#EC4899';
  if (day === 4) return '#D946EF';
  if (day === 5) return '#A855F7';
  if (day === 6) return '#8B5CF6';
  return '#7C3AED';
};

const AnimatedFlame = ({ color, size = 18 }: { color: string; size?: number }) => {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Floating Sparkles Embers */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ 
              backgroundColor: color, 
              width: size * 0.12, 
              height: size * 0.12,
              bottom: '15%',
              left: '50%'
            }}
            animate={{
              y: [0, -size * 1.3],
              x: [0, (i - 1) * (size * 0.22) + (Math.sin(i) * size * 0.08)],
              opacity: [0, 1, 0],
              scale: [0.6, 1.2, 0.2]
            }}
            transition={{
              duration: 1.1 + i * 0.2,
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* SVG Flame */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        {/* Outer path */}
        <motion.path
          d="M12 2C12 2 17.5 6.5 17.5 12.5C17.5 15.5 15 18.5 12 18.5C9 18.5 6.5 15.5 6.5 12.5C6.5 11 7 9 8.2 7.5C9.4 6 12 2 12 2Z"
          fill={color}
          opacity={0.85}
          animate={{
            scaleY: [1, 1.15, 0.93, 1.06, 1],
            scaleX: [1, 0.92, 1.08, 0.95, 1],
            skewX: [0, 2.5, -2.5, 1.2, 0],
            y: [0, -0.5, 0.5, -0.2, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }}
          style={{ transformOrigin: 'bottom center' }}
        />
        {/* Middle path */}
        <motion.path
          d="M12 5C12 5 15.5 8.5 15.5 12.5C15.5 14.5 13.9 16.5 12 16.5C10.1 16.5 8.5 14.5 8.5 12.5C8.5 11.5 8.8 10.3 9.5 9.2C10.2 8.1 12 5 12 5Z"
          fill="#FFEB99"
          opacity={0.9}
          animate={{
            scaleY: [1, 0.91, 1.12, 0.94, 1],
            scaleX: [1, 1.09, 0.91, 1.06, 1],
            skewX: [0, -1.8, 1.8, -0.9, 0],
            y: [0, 0.3, -0.3, 0.1, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.1,
            ease: "easeInOut"
          }}
          style={{ transformOrigin: 'bottom center' }}
        />
        {/* Inner core */}
        <motion.path
          d="M12 8C12 8 13.8 10.2 13.8 12.8C13.8 14 13 14.8 12 14.8C11 14.8 10.2 14 10.2 12.8C10.2 12 10.6 11.2 11 10.6C11.4 10 12 8 12 8Z"
          fill="#FFFFFF"
          animate={{
            scale: [0.91, 1.09, 0.91]
          }}
          transition={{
            repeat: Infinity,
            duration: 0.75,
            ease: "linear"
          }}
          style={{ transformOrigin: 'bottom center' }}
        />
      </svg>
    </div>
  );
};

interface NavigationProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Navigation({ isAuthenticated, onLogout }: NavigationProps) {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const { streak, level, xp, updateStreak } = useGamification();
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Navigation tabs for the mobile bottom bar
  const navTabs = [
    { icon: <LayoutDashboard size={20} />, label: "Geral", path: "/dashboard" },
    { icon: <Brain size={20} />, label: "IA", path: "/dashboard/ai" },
    { icon: <CheckCircle size={20} />, label: "Urgente", path: "/dashboard/productivity" },
    { icon: <GraduationCap size={20} />, label: "Estudos", path: "/dashboard/studies" },
    { icon: <Heart size={20} />, label: "Bem-estar", path: "/dashboard/wellness" },
    { icon: <Target size={20} />, label: "Decisões", path: "/dashboard/decisions" },
  ];

  return (
    <>
      {/* Top Main Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3.5 sm:px-6 md:px-10 py-2 sm:py-4 md:py-5 transition-all duration-450 ${
        isDashboard 
          ? 'bg-[#111827]/85 backdrop-blur-xl border-b border-white/5' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[#4F7CFF] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform">
            <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-lg sm:text-xl font-display font-black tracking-tight text-white">
            Lumyn
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          {!isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Recursos</a>
                <a href="#solutions" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Dopamina</a>
                <a href="#privacy" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Governança</a>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <Link to="/login" className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#4F7CFF] hover:text-white transition-colors">Entrar</Link>
                <Link to="/signup" className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 bg-white text-[#111827] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-xl hover:bg-[#EEF2FF] transition-all active:scale-95">
                  Fazer Parte
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
              {/* Gamification Indicator Widgets on the main navbar */}
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 mr-0.5 sm:mr-1 self-center bg-white/[0.03] border border-white/5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 md:px-4 md:py-2 rounded-xl sm:rounded-2xl backdrop-blur-md">
                {/* Daily Streak Flame button with glowing custom animate flame icon */}
                <button
                  onClick={() => setShowStreakModal(true)}
                  className="flex items-center gap-1 sm:gap-1.5 hover:bg-white/5 px-1 py-0.5 rounded-lg transition-all active:scale-95 text-left group cursor-pointer"
                  title="Ver espectro de sequência diária"
                >
                  <div className="relative">
                    <AnimatedFlame color={getStreakColor(streak)} size={15} />
                    <div 
                      className="absolute inset-0 blur-[6px] rounded-full scale-125 opacity-20 group-hover:opacity-50 transition-opacity" 
                      style={{ backgroundColor: getStreakColor(streak) }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs md:text-sm font-black font-mono text-white tracking-tighter flex items-center gap-0.5">
                    {streak}
                    <span 
                      className="text-[10px] sm:text-xs transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12 select-none"
                      style={{ color: getStreakColor(streak), textShadow: `0 0 8px ${getStreakColor(streak)}` }}
                    >
                      🔥
                    </span>
                  </span>
                </button>
                <div className="w-px h-2.5 bg-white/10" />
                {/* Target Level Badge */}
                <div className="flex items-center gap-1">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Nív</span>
                  <span className="text-[10px] sm:text-xs md:text-sm font-black text-amber-400 font-mono">
                    {level}⭐
                  </span>
                </div>
              </div>

              {/* Overview Button (hidden on mobile if isDashboard, to save space) */}
              <Link to="/dashboard" className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/5 transition-all text-[11px] font-bold uppercase tracking-widest bg-white/[0.03] hover:bg-white/10 ${
                location.pathname === '/dashboard' ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 hover:text-white'
              }`}>
                <LayoutDashboard size={14} />
                <span>Resumo</span>
              </Link>

              {/* Logout mechanism */}
              <button 
                onClick={onLogout}
                className="flex items-center justify-center p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 active:scale-95 transition-all cursor-pointer shadow-lg"
                title="Desconectar"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Streak Details Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
            onClick={() => setShowStreakModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative max-w-xl w-full bg-[#111827]/95 border border-white/10 rounded-[2.5rem] p-6 md:p-8 overflow-hidden shadow-2xl shadow-purple-500/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                    Sua Sequência Diária
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Acompanhe o espectro de cores da sua constância diária!
                  </p>
                </div>
                <button 
                  onClick={() => setShowStreakModal(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Focus Streak Banner */}
              <div className="mb-6 p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4 relative overflow-hidden">
                <div 
                  className="absolute -right-10 -bottom-10 w-32 h-32 blur-[40px] rounded-full opacity-25"
                  style={{ backgroundColor: getStreakColor(streak) }}
                />
                <div className="relative p-2.5 bg-slate-950/30 rounded-2xl border border-white/10 shrink-0">
                  <AnimatedFlame color={getStreakColor(streak)} size={48} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sequência Atual</div>
                  <div className="text-2xl md:text-3xl font-black text-white font-mono flex items-baseline gap-2 mt-0.5">
                    {streak} {streak === 1 ? 'Dia' : 'Dias'}
                    <span className="text-[10px] font-black border px-2 py-0.5 rounded-full uppercase tracking-wider font-sans ml-2" 
                          style={{ 
                            color: getStreakColor(streak), 
                            borderColor: `${getStreakColor(streak)}45`,
                            backgroundColor: `${getStreakColor(streak)}12`
                          }}>
                      {STREAK_DAYS_CONFIG[Math.min(streak - 1, STREAK_DAYS_CONFIG.length - 1)].name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Sua chama pessoal está brilhando em <strong style={{ color: getStreakColor(streak) }}>{STREAK_DAYS_CONFIG[Math.min(streak - 1, STREAK_DAYS_CONFIG.length - 1)].text}</strong>.
                  </p>
                </div>
              </div>

              {/* Days Spectrum Challenge */}
              <div className="space-y-3 mb-6">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Espectro Dinâmico (Progressão Diária de Cores)</span>
                <p className="text-[11px] text-slate-400">
                  A cor da sua chama evolui a cada login consecutivo, mudando em direção ao roxo cósmico definitivo. Não perca nenhum dia!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
                  {STREAK_DAYS_CONFIG.map((conf) => {
                    const isUnlocked = streak >= conf.day;
                    const isCurrent = streak === conf.day || (conf.day === STREAK_DAYS_CONFIG.length && streak >= STREAK_DAYS_CONFIG.length);
                    const isNext = conf.day === streak + 1;
                    
                    return (
                      <div 
                        key={conf.day}
                        className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all ${
                          isCurrent 
                            ? 'bg-white/[0.04] border-white/25 shadow-lg shadow-purple-500/5' 
                            : isUnlocked 
                              ? 'bg-white/[0.02] border-white/10' 
                              : 'bg-slate-950/20 border-white/5 opacity-40'
                        }`}
                      >
                        <div className="relative mb-2">
                          {isUnlocked ? (
                            <AnimatedFlame color={conf.color} size={28} />
                          ) : (
                            <div className="relative">
                              <div className="opacity-30 filter grayscale">
                                <AnimatedFlame color={conf.color} size={28} />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Lock size={12} className="text-slate-500" />
                              </div>
                            </div>
                          )}

                          {isCurrent && (
                            <div 
                              className="absolute -inset-1 blur-[6px] rounded-full scale-110 opacity-30 -z-10" 
                              style={{ backgroundColor: conf.color }}
                            />
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-white font-mono">{conf.label}</span>
                        <span className="text-[8px] font-medium text-slate-400 text-center uppercase tracking-widest mt-0.5 truncate max-w-full" title={conf.name}>
                          {isCurrent ? "Ativa" : isUnlocked ? "Concluído" : "Bloqueado"}
                        </span>
                        
                        {isNext && (
                          <div className="absolute -top-1.5 bg-gradient-to-r from-orange-500 to-purple-500 px-1.5 py-0.5 text-[7px] font-black text-white rounded-md whitespace-nowrap shadow-md uppercase tracking-wider scale-90 translate-y-0.5">
                            Amanhã
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync check & Simulator section */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex gap-2 items-start text-xs text-slate-400">
                  <AlertCircle size={14} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Sincronização Ativa & Real</span>
                    Sua sequência é persistida na nuvem. Acesse o aplicativo todos os dias para evoluir a cor e proteger sua mente!
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Ajuste Real (Simulação)</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        if (streak > 1) {
                          updateStreak(streak - 1);
                        }
                      }}
                      disabled={streak <= 1}
                      className="px-2 py-0.5 text-xs font-bold font-mono bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white rounded-lg border border-white/5 transition-colors disabled:cursor-not-allowed cursor-pointer"
                      title="Diminuir 1 dia no banco"
                    >
                      -1
                    </button>
                    <button 
                      onClick={() => {
                        updateStreak(streak + 1);
                      }}
                      className="px-2 py-0.5 text-xs font-bold font-mono bg-gradient-to-r from-orange-500 to-[#8B5CF6] hover:brightness-110 text-white rounded-lg transition-transform active:scale-95 cursor-pointer font-black"
                      title="Avançar 1 dia no banco"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Premium Mobile Bottom Navigation Bar (rendered on mobile if authenticated and inside dashboard) */}
      {isAuthenticated && isDashboard && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/90 border-t border-white/5 p-2 px-4 shadow-[0_-5px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl animate-slide-up">
          <div className="flex justify-between items-center max-w-lg mx-auto">
            {navTabs.map((tab) => {
              const isActive = (tab.path === '/dashboard' && location.pathname === '/dashboard') || 
                               (tab.path !== '/dashboard' && location.pathname.startsWith(tab.path));
              return (
                <Link 
                  key={tab.path} 
                  to={tab.path} 
                  className="flex flex-col items-center justify-center py-2 flex-1 relative"
                >
                  <div className={`p-2.5 rounded-2xl transition-all duration-300 relative ${
                    isActive 
                      ? 'bg-[#4F7CFF] text-white shadow-xl shadow-blue-500/25 scale-110 -translate-y-1.5' 
                      : 'text-slate-500 hover:text-white'
                  }`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 transition-all ${
                    isActive ? 'text-[#4F7CFF] font-black' : 'text-slate-500'
                  }`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
