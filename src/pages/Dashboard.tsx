import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Brain, CheckCircle, GraduationCap, 
  Heart, BarChart3, Settings, HelpCircle, Search, 
  Bell, User, ChevronRight, Zap, Target, BookOpen, Crown, Flame,
  Database
} from 'lucide-react';
import DashboardHome from './DashboardHome';
import AIChat from './AIChat';
import Productivity from './Productivity';
import Studies from './Studies';
import MentalHealth from './MentalHealth';
import Decisions from './Decisions';
import Presentation from './Presentation';
import { useGamification } from '../contexts/GamificationContext';
import { auth } from '../lib/firebase';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const location = useLocation();
  const { xp, level, achievements, streak } = useGamification();
  const [displayName, setDisplayName] = useState('Atleta');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setDisplayName(user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Atleta');
    } else {
      setDisplayName('Atleta');
    }
  }, []);

  const sidebarItems = [
    { icon: <LayoutDashboard size={18} />, label: "Visão Geral", path: "/dashboard", desc: "Seu cockpit" },
    { icon: <Brain size={18} />, label: "Assistente IA", path: "/dashboard/ai", desc: "Núcleo neural" },
    { icon: <CheckCircle size={18} />, label: "Minhas Tarefas", path: "/dashboard/productivity", desc: "Objetivos diários" },
    { icon: <GraduationCap size={18} />, label: "Estudos & Maestria", path: "/dashboard/studies", desc: "Unidades acadêmicas" },
    { icon: <Heart size={18} />, label: "Foco & Bem-estar", path: "/dashboard/wellness", desc: "Equilíbrio emocional" },
    { icon: <Target size={18} />, label: "Decisões Estratégicas", path: "/dashboard/decisions", desc: "Matrizes lógicas" },
    { icon: <Database size={18} className="text-yellow-400 font-bold" />, label: "Apresentação & BI", path: "/dashboard/presentation", desc: "Slides & BigQuery" },
  ];

  // Calculate stats
  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="flex h-screen bg-[#111827] text-[#F8FAFC] pt-14 md:pt-20 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="w-80 bg-white/[0.02] backdrop-blur-xl border-r border-white/5 hidden lg:flex flex-col p-6 overflow-y-auto no-scrollbar">
        {/* User Stats Card Header */}
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#4F7CFF]/10 rounded-full blur-xl" />
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Desempenho Geral</p>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xl font-display font-black text-white">{displayName}</span>
              <p className="text-[9px] font-bold text-[#4F7CFF] uppercase tracking-widest mt-0.5">Membro Ativo</p>
            </div>
            <div className="flex flex-col items-center justify-center h-10 w-10 bg-gradient-to-tr from-[#4F7CFF] to-[#8B5CF6] rounded-xl font-display font-black text-white text-xs shadow-lg shadow-indigo-505/20">
              <span className="text-[7px] text-white/70">LVL</span>
              <span>{level}</span>
            </div>
          </div>
          
          <div className="space-y-2.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Nível de XP {level}</span>
              <span>{xp} / {level * 150} XP</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
              <div 
                className="h-full bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] rounded-full shadow-[0_0_8px_rgba(79,124,255,0.4)] transition-all duration-500"
                style={{ width: `${(xp / (level * 150)) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase mt-2">
              <Crown size={12} className="text-[#8B5CF6]" />
              <span>{unlockedAchievementsCount} de {achievements.length} conquistas</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="space-y-1 mb-8">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">Módulos de Controle</p>
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-white/10 text-white border-l-4 border-[#4F7CFF] shadow-xl shadow-[#4F7CFF]/5 font-black' 
                    : 'text-slate-400 border-l-4 border-transparent hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#4F7CFF] text-white' : 'bg-transparent text-slate-400'}`}>
                  {item.icon}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-black tracking-tight">{item.label}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:block">{item.desc}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Achievements Miniature list in sidebar */}
        <div className="p-5 rounded-3xl border border-[#8B5CF6]/20 bg-gradient-to-br from-[#8B5CF6]/5 to-[#4F7CFF]/5 mt-auto relative overflow-hidden group shadow-lg">
           <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#8B5CF6]/15 rounded-full blur-xl group-hover:opacity-40 transition-opacity" />
           <p className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest mb-1.5">Acelerar Próximo Nível</p>
           <h4 className="font-display font-black text-sm text-white leading-tight mb-2">Desafios Premium</h4>
           <p className="text-xs text-slate-400 leading-snug mb-5">Obtenha acesso a simulações de IA sem limites e mentorias mentais.</p>
           
           <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] text-white hover:opacity-90 font-black text-[9px] uppercase tracking-widest transition-transform hover:scale-102 cursor-pointer shadow-lg shadow-indigo-500/10">
             Adquirir Lumyn Pro
           </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col h-full bg-[#111827]">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#111827]/85 backdrop-blur-xl px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-4 flex items-center justify-between border-b border-white/5">
          <div className="relative w-96 max-w-[55%] sm:max-w-[60%] md:max-w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Consultar ou pesquisar..." 
              className="w-full pl-9 pr-3 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 text-white text-[10px] sm:text-xs placeholder:text-slate-550 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Notification indicator */}
            <button className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer">
              <Bell size={16} />
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white tracking-tight">{displayName}</p>
                <p className="text-[8px] font-bold text-[#4F7CFF] uppercase tracking-widest mt-0.5">Seção Principal</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 overflow-hidden border border-white/15">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Container: Padding pb-28 solves mobile bottom menu clipping */}
        <div className="p-3 sm:p-6 md:p-10 max-w-7xl mx-auto w-full flex-1 overflow-x-hidden pb-24 md:pb-12">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/ai" element={<AIChat />} />
            <Route path="/productivity" element={<Productivity />} />
            <Route path="/studies" element={<Studies />} />
            <Route path="/wellness" element={<MentalHealth />} />
            <Route path="/decisions" element={<Decisions />} />
            <Route path="/presentation" element={<Presentation />} />
            <Route path="*" element={<div className="flex flex-col items-center justify-center h-80 text-slate-500 font-black uppercase tracking-widest text-xs italic">Setor inexistente no grid atual. Retorne ao início.</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
