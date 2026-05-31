import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Sparkles, Scale, Plus, Trash2, 
  HelpCircle, AlertCircle, TrendingUp, CheckCircle, ChevronRight, Brain 
} from 'lucide-react';
import { useGamification } from '../contexts/GamificationContext';

interface DecisionOption {
  name: string;
}

interface AnalysisResult {
  recommendation: string;
  options_analysis: {
    name: string;
    pros: string[];
    cons: string[];
    score: number;
  }[];
}

export default function Decisions() {
  const [problem, setProblem] = useState('');
  const [options, setOptions] = useState<DecisionOption[]>([
    { name: 'Investir tempo em Aprendizado Profundo' },
    { name: 'Empreender em um Projeto Paralelo' }
  ]);
  const [newOption, setNewOption] = useState('');
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { addXP, unlockAchievement, completeQuest } = useGamification();

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    setOptions(prev => [...prev, { name: newOption.trim() }]);
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async (e: React.MouseEvent) => {
    if (!problem.trim() || options.length < 2) {
      setError('Descreva seu cenário estratégico e insira pelo menos 2 caminhos alternativos.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysis(null);

    // Give strategic planning XP immediately!
    addXP(15, "Formulando Arquitetura de Risco! ⚖️", e);

    try {
      const response = await fetch('/api/ai/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          options: options.map(o => o.name)
        })
      });

      if (!response.ok) throw new Error('Falha na resposta do analisador');
      const data = (await response.json()) as AnalysisResult;

      setAnalysis(data);
      
      // Complete decision markers in gamification
      addXP(40, "Cenário de Análise Estruturado! 💎", e);
      unlockAchievement('first_decision');
      completeQuest('quest_decision');

    } catch (err) {
      console.error(err);
      setError('Não foi possível obter a simulação da IA. Verifique as credenciais do seu Gemini API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-16">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic">Simulador Estratégico.</h2>
          <p className="text-slate-500 mt-0.5 text-[10px] sm:text-xs md:text-sm font-medium">Equilibre suas escolhas pessoais ou corporativas estruturando probabilidade lógica guiada por IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Scenario Input and Option Creator */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
           <div className="bento-card border-white/5 bg-white/[0.02]">
              <h3 className="font-display font-black text-xl text-white mb-6 flex items-center gap-2">
                 <Scale size={18} className="text-[#4F7CFF]" /> Modelagem de Escolha
              </h3>

              {/* Scenario Description */}
              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qual o dilema estratégico correntemente analisado?</label>
                <textarea 
                  className="w-full px-5 py-4 rounded-2.5xl bg-white/[0.03] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 text-slate-200 placeholder:text-slate-650 text-xs md:text-sm font-medium h-24 resize-none leading-relaxed"
                  placeholder="Exemplo: Preciso priorizar entre focar nos estudos intensivos de computação no próximo semestre ou lançar uma startup MVP para testar mercado com investidores..."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                />
              </div>

              {/* Alternative Paths */}
              <div className="space-y-4">
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Caminhos Alternativos Mapeados</label>
                 
                 <div className="space-y-2.5">
                   <AnimatePresence initial={false}>
                     {options.map((opt, i) => (
                       <motion.div 
                         key={i}
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: 10 }}
                         className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all"
                       >
                         <span className="text-xs text-slate-300 font-semibold">{opt.name}</span>
                         <button 
                           onClick={() => handleRemoveOption(i)}
                           className="sm:opacity-0 sm:group-hover:opacity-100 opacity-100 p-2 text-slate-600 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer"
                         >
                           <Trash2 size={14} />
                         </button>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                 </div>

                 {/* Add alternative line */}
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Ex: Focar 100% no Mestrado..."
                     className="px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 text-xs text-slate-200 flex-1 placeholder:text-slate-650"
                     value={newOption}
                     onChange={(e) => setNewOption(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                   />
                   <button 
                     onClick={handleAddOption}
                     className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-xs font-bold"
                   >
                     <Plus size={16} />
                   </button>
                 </div>
              </div>

              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold flex items-center gap-2">
                   <AlertCircle size={14} />
                   <span>{error}</span>
                </div>
              )}

              {/* Simulate Button */}
              <button 
                onClick={(e) => handleAnalyze(e)}
                disabled={isLoading}
                className="w-full mt-8 py-4 bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/10 hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Brain size={16} /> Resolver Matriz com IA
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Dynamic Analysis Outcome Pane */}
        <div className="lg:col-span-7">
           <AnimatePresence mode="wait">
             {!analysis ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="h-full min-h-[400px] border border-dashed border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center text-slate-500"
               >
                 <Scale size={48} className="text-slate-700 mb-6 stroke-[1.2] animate-pulse" />
                 <h4 className="font-display font-black text-slate-400 text-lg mb-2">Simulador Aguardando Ordem</h4>
                 <p className="text-xs max-w-sm leading-relaxed">Filtre seus cenários e caminhos logicamente no lado esquerdo, e deixe nossa inteligência calcular vantagens, riscos e escores finais para cada escolha.</p>
               </motion.div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 className="space-y-6"
               >
                 {/* Top Recommendation Box */}
                 <div className="bento-card border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                      <Sparkles size={160} className="text-emerald-400" />
                    </div>
                    
                    <div className="flex items-center gap-2.5 mb-5">
                       <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <CheckCircle size={14} />
                       </div>
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Recomendação Lógica Decidida</span>
                    </div>

                    <h4 className="font-display font-black text-xl text-white mb-3">Síntese Estratégica</h4>
                    <p className="text-slate-205 text-sm leading-relaxed italic">{analysis.recommendation}</p>
                 </div>

                 {/* Breakdown Analysis Cards list */}
                 <div className="space-y-5">
                    <h5 className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Análise Comparativa Mapeada</h5>
                    {analysis.options_analysis.map((opt, i) => (
                      <div key={i} className="glass p-7 rounded-[2.5rem] border-white/5 space-y-6">
                        <div className="flex justify-between items-center bg-white/[0.02] -m-7 p-6 rounded-t-[2.5rem] border-b border-white/5">
                           <h3 className="text-base md:text-lg font-display font-black text-white">{opt.name}</h3>
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Score Lógico:</span>
                             <span className="text-sm font-black text-[#4F7CFF] font-mono">{opt.score}/100</span>
                           </div>
                        </div>

                        {/* Pros Cons Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                          <div className="space-y-3.5">
                             <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Pontos Positivos</span>
                             <ul className="space-y-2">
                               {opt.pros.map((p, idx) => (
                                 <li key={idx} className="text-xs text-slate-300 font-medium pl-3 border-l-2 border-emerald-400 py-0.5 leading-relaxed">
                                   {p}
                                 </li>
                               ))}
                             </ul>
                          </div>
                          
                          <div className="space-y-3.5">
                             <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Riscos e Contras</span>
                             <ul className="space-y-2">
                               {opt.cons.map((c, idx) => (
                                 <li key={idx} className="text-xs text-slate-300 font-medium pl-3 border-l-2 border-rose-400 py-0.5 leading-relaxed">
                                   {c}
                                 </li>
                               ))}
                             </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
