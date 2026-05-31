import { motion } from 'motion/react';
import { Sparkles, Brain, Shield, BarChart3, Clock, Zap, ArrowRight, Play, CheckCircle2, ChevronRight, GraduationCap, Heart, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  const features = [
    {
      icon: <Brain className="text-[#4F7CFF]" size={28} />,
      title: "IA Auto-Aprendente",
      description: "O Lumyn evolui com o seu comportamento diário, deduzindo seus picos de produtividade cognitiva e gatilhos emocionais."
    },
    {
      icon: <CheckCircle2 className="text-[#8B5CF6]" size={28} />,
      title: "Produtividade Inteligente",
      description: "Muito além de meras listas de tarefas. Nossa IA reordena sua agenda dinamicamente com base na sua energia e urgência."
    },
    {
      icon: <BarChart3 className="text-[#06B6D4]" size={28} />,
      title: "Análises de Alta Fidelidade",
      description: "Visualização profunda de dados pessoais. Acompanhe progresso, humor, foco acadêmico e conquistas com gráficos de nível executivo."
    }
  ];

  return (
    <div className="overflow-x-hidden bg-[#111827] text-[#F8FAFC] min-h-screen selection:bg-[#4F7CFF] selection:text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16">
        {/* Background Ambient Glows and Tech Noise */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-[-25%] left-[-15%] w-[700px] h-[700px] bg-[#4F7CFF]/20 rounded-full blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#8B5CF6]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-[35%] right-[25%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.07] mix-blend-overlay brightness-110" />
          
          {/* Neon grid subtle lines */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="col-span-12 lg:col-span-5 flex flex-col justify-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mb-4 sm:mb-8 shadow-inner backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-slate-300">Inteligência v2.1 Ativa</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants} 
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold tracking-tight text-white leading-tight sm:leading-[1.05]"
            >
              Seu Assistente de Vida <span className="gradient-text drop-shadow-[0_2px_20px_rgba(79,124,255,0.15)]">Premium</span> com IA.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="mt-4 sm:mt-8 text-xs sm:text-base md:text-lg text-slate-400 leading-relaxed max-w-lg">
              Produtividade orientada por IA, bem-estar emocional, gamificação Duolingo de alta dopamina e tomada de decisões lógicas unificados em um só ecossistema de elite.
            </motion.p>
            
            <motion.div variants={itemVariants} className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
              <Link to="/signup" className="flex items-center justify-center gap-2 px-5 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] rounded-xl sm:rounded-2xl font-black text-white shadow-xl shadow-[#4F7CFF]/20 hover:scale-105 transition-all text-[11px] sm:text-sm uppercase tracking-widest relative overflow-hidden group">
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                Começar Agora <ArrowRight size={14} className="sm:w-[18px] sm:h-[18px]" />
              </Link>
              <a href="#features" className="px-5 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-[11px] sm:text-sm uppercase tracking-widest">
                <Play size={12} className="fill-white text-white sm:w-[16px] sm:h-[16px]" /> Ver Recursos
              </a>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-8 sm:mt-12 flex items-center gap-3.5 sm:gap-6 text-slate-500 border-t border-white/5 pt-6 sm:pt-8 w-full">
              <div className="flex -space-x-2.5 sm:-space-x-3.5 shrink-0">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#111827] bg-slate-800 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-slate-400 overflow-hidden shadow-lg">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=avatar_${i + 22}`} alt="User" />
                  </div>
                ))}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#111827] bg-gradient-to-tr from-[#4F7CFF] to-[#8B5CF6] flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white italic">
                  +12k
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest">Amado por +12.000 profissionais</p>
                <div className="flex gap-0.5 mt-0.5 text-amber-500">
                  {"★★★★★".split("").map((s, i) => <span key={i} className="text-[9px] sm:text-xs">★</span>)}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Interactive Bento Dashboard Preview with dopamine visual cues */}
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-7 grid grid-cols-6 grid-rows-4 gap-3 sm:gap-4"
          >
            {/* Greeting & Interactive Streak Progress */}
            <div className="col-span-6 md:col-span-4 row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-white/20 transition-all duration-500 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F7CFF]/10 rounded-full blur-2xl" />
              
              <div className="z-10 flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-widest">Bem-vindo de volta, Atleta cognitivo</p>
                  <h3 className="text-base sm:text-xl md:text-2.5xl lg:text-3xl font-display font-black text-white mt-1">Sua sequência de foco</h3>
                </div>
                {/* Streak flame with high glowing effect */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.15)] shrink-0">
                  <span className="text-sm sm:text-lg animate-bounce duration-1000">🔥</span>
                  <span className="text-xs sm:text-sm font-black font-mono">7 Dias</span>
                </div>
              </div>
              
              <div className="my-4 sm:my-6">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  <span>Sua Meta de XP Hoje</span>
                  <span className="text-[#4F7CFF]">85 / 120 XP ✨</span>
                </div>
                <div className="h-2.5 sm:h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                  <div className="h-full bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.5)] w-[70%]" />
                </div>
              </div>

              <div className="flex items-end gap-1.5 h-10 sm:h-16 pointer-events-none">
                <div className="w-1/7 h-5 sm:h-8 bg-white/5 rounded-md sm:rounded-lg" />
                <div className="w-1/7 h-7 sm:h-11 bg-white/5 rounded-md sm:rounded-lg" />
                <div className="w-1/7 h-9 sm:h-14 bg-white/5 rounded-md sm:rounded-lg" />
                <div className="w-1/7 h-[70%] bg-gradient-to-t from-[#4F7CFF]/10 to-[#4F7CFF]/40 rounded-md sm:rounded-lg" />
                <div className="w-1/7 h-[45%] bg-white/5 rounded-md sm:rounded-lg" />
                <div className="w-1/7 h-[90%] bg-gradient-to-t from-[#8B5CF6]/10 to-[#8B5CF6]/50 rounded-md sm:rounded-lg" />
                <div className="w-1/7 h-[60%] bg-[#06B6D4]/30 rounded-md sm:rounded-lg" />
              </div>
            </div>

            {/* Premium AI Spark Card */}
            <div className="col-span-6 md:col-span-2 row-span-2 bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay" />
              <div className="absolute -right-5 -top-5 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              
              <div className="relative z-10">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/15 rounded-xl sm:rounded-2xl backdrop-blur-md flex items-center justify-center mb-4 sm:mb-6 shadow-xl border border-white/10">
                  <Sparkles size={18} className="text-white animate-spin-slow" />
                </div>
                <h4 className="text-base sm:text-lg md:text-xl font-display font-black leading-tight text-white5 px-1">Insight Dinâmico</h4>
                <p className="text-[10px] sm:text-xs text-white/95 mt-2 sm:mt-3 italic leading-relaxed">
                  "Você absorve lógica 35% mais rápido às sextas de manhã. Agendamos seu foco para as 9h."
                </p>
              </div>
              <button className="w-full py-2.5 sm:py-3 bg-white text-[#4F7CFF] text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl uppercase tracking-widest mt-4 sm:mt-6 shadow-lg hover:bg-slate-50 active:scale-95 transition-all">
                Falar com Lumyn
              </button>
            </div>

            {/* Equilibrium Circle Visual */}
            <div className="col-span-3 md:col-span-2 row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 group hover:border-white/20 transition-all shadow-2xl">
              <div className="relative w-14 h-14 sm:w-20 sm:h-20 transform group-hover:scale-105 transition-transform duration-300">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5 sm:hidden"/>
                  <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="140" strokeDashoffset="31" className="text-purple-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] sm:hidden" />
                  
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5 hidden sm:block"/>
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="200" strokeDashoffset="45" className="text-purple-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] hidden sm:block" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="text-sm sm:text-lg font-black text-white">88%</span>
                  <span className="text-[6px] sm:text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Estável</span>
                </div>
              </div>
              <p className="text-[8px] sm:text-[9px] text-purple-400 font-bold uppercase tracking-[0.2em] text-center">Foco & Saúde Mental</p>
              <span className="text-[10px] sm:text-xs text-slate-500 italic">Equilíbrio Ativo</span>
            </div>

            {/* Strategic Decision Hub */}
            <div className="col-span-3 md:col-span-2 row-span-2 bg-[#1E293B]/40 backdrop-blur-md border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-5 md:p-7 flex flex-col justify-between hover:border-white/10 transition-all shadow-2xl">
              <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                 <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Matriz de Decisão</span>
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-200 leading-relaxed border-l-2 border-cyan-500 pl-2 sm:pl-3 py-0.5 sm:py-1 my-2 sm:my-3 italic">
                Cenário Alfa: Investir no aprendizado gera 4.2x mais retorno...
              </p>
              <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-auto">
                <span>Simulação</span>
                <ChevronRight size={12} />
              </div>
            </div>

            {/* Interactive Protocols */}
            <div className="col-span-6 md:col-span-2 row-span-2 bg-slate-900/60 border border-white/5 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-[2.5rem] flex flex-col justify-center shadow-lg hover:border-white/10 transition-all">
               <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/10 rounded-lg sm:rounded-2xl flex items-center justify-center border border-green-500/20 text-green-400 shrink-0">
                    <Shield size={16} className="sm:w-[20px] sm:h-[20px]" />
                 </div>
                 <div>
                    <span className="text-[8px] sm:text-[9px] uppercase text-slate-500 font-bold tracking-widest">Protocolo</span>
                    <h5 className="text-xs sm:text-sm font-bold text-white tracking-tight">Segurança Total</h5>
                 </div>
               </div>
               <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">Criptografia de nível militar garante privacidade total dos seus dados de rotina.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid with High Polish UI */}
      <section id="features" className="py-16 sm:py-24 md:py-32 relative bg-[#0F172A] border-t border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-[-10%] w-[500px] h-[500px] bg-[#4F7CFF]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-black mb-4 sm:mb-6 text-white leading-tight">Projetado para quem busca excelência.</h2>
            <p className="text-sm sm:text-lg text-slate-400 font-medium">A única plataforma que harmoniza ferramentas de ultra-produtividade diária com profunda análise de humor.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -8, borderColor: 'rgba(79, 124, 255, 0.3)', boxShadow: '0 10px 30px rgba(79, 124, 255, 0.1)' }}
                className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] bg-white/[0.02] backdrop-blur-sm border border-white/10 transition-all duration-300 flex flex-col"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2.5xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 sm:mb-8 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-2xl font-display font-bold mb-2 sm:mb-4 text-white">{feature.title}</h3>
                <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed flex-1">{feature.description}</p>
                <button className="mt-6 sm:mt-8 flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#4F7CFF] uppercase tracking-wider group w-fit cursor-pointer">
                  Saiba mais <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Conversational Agent Pitch */}
      <section className="py-16 sm:py-24 md:py-32 bg-[#111827] overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-[#8B5CF6]/10 rounded-full blur-[140px] opacity-40 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-20 items-center">
          <div>
            <span className="text-[#4F7CFF] text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-2 sm:mb-4 block">Assistente de Diálogo Avançado</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black mb-4 sm:mb-8 text-white leading-tight">Converse com sua inteligência e otimize sua rotina.</h2>
            
            <div className="space-y-2 sm:space-y-4">
              {[
                "Organize meu fluxo de tarefas para a próxima semana.",
                "Por que eu estava me sentindo cansado ontem cedo?",
                "Sugira um plano de aprendizado para algoritmos de IA.",
                "Simule os prós e contras de abrir uma nova startup."
              ].map((text, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between group hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer shadow-lg"
                >
                  <span className="text-slate-300 font-medium italic text-xs sm:text-sm">"{text}"</span>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#4F7CFF] group-hover:text-white text-[#4F7CFF] transition-all shrink-0 ml-4">
                    <ArrowRight size={14} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="relative">
             <div className="glass p-1 rounded-2xl sm:rounded-[3rem] relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent z-10" />
               <img 
                src="https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1974&auto=format&fit=crop" 
                className="w-full aspect-square object-cover rounded-xl sm:rounded-[2.8rem] opacity-45 grayscale scale-105 hover:scale-100 transition-transform duration-700"
                alt="AI Interface premium"
               />
             </div>
             {/* Gamification Floating Badge Overlay on visual side */}
             <div className="absolute -bottom-3 -right-3 sm:-bottom-6 sm:-right-6 bg-gradient-to-tr from-[#4F7CFF] to-[#8B5CF6] p-4 sm:p-8 rounded-xl sm:rounded-[2rem] shadow-2xl shadow-blue-500/20 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-sm sm:text-2xl mb-1 sm:mb-2 animate-pulse">
                  🔥
                </div>
                <span className="text-[8px] sm:text-[10px] font-black text-white/80 uppercase tracking-widest">Nível 5 Ativo</span>
                <span className="text-xs sm:text-sm font-extrabold text-white">Consistência Máxima</span>
             </div>
          </div>
        </div>
      </section>

      {/* Ultimate Premium CTA Block */}
      <section className="py-16 sm:py-24 md:py-32 bg-[#0F172A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="bento-card p-8 sm:p-16 md:p-24 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none" />
            <div className="absolute top-[-40%] left-[-20%] w-[500px] h-[500px] bg-[#4F7CFF]/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-40%] right-[-20%] w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[100px]" />

            <h2 className="text-2xl sm:text-4xl md:text-6xl font-display font-black text-white mb-4 sm:mb-8 relative z-10 leading-tight">Eleve sua mente para <br />o próximo patamar hoje.</h2>
            <p className="text-slate-400 text-xs sm:text-base md:text-xl mb-6 sm:mb-12 relative z-10 max-w-2xl mx-auto leading-relaxed">Junte-se ao ciclo fechado de pensadores de alta performance que operam com produtividade gamificada avançada.</p>
            
            <div className="flex justify-center gap-4 relative z-10">
               <Link to="/signup" className="px-6 py-3.5 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] text-[#111827] font-black text-xs sm:text-sm uppercase tracking-widest hover:scale-105 active:scale-98 transition-all shadow-2xl hover:bg-slate-150">
                 Registrar Novo Setor
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#111827] relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F7CFF] to-[#8B5CF6] flex items-center justify-center shadow-lg">
              <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-xl font-display font-bold text-white tracking-tight">Lumyn</span>
          </div>
          <div className="flex flex-wrap gap-8 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] justify-center">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Segurança</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Lumyn AI. Silicon Valley powered.</p>
        </div>
      </footer>
    </div>
  );
}
