import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Circle, Clock, Tag, Plus, Filter, 
  Calendar, Zap, Brain, ChevronRight, CheckCircle, Trash2, 
  X, Sparkles, AlertCircle, FileText, BarChart
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useGamification } from '../contexts/GamificationContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'ai-suggested';
  status: 'todo' | 'in-progress' | 'completed' | 'archived';
  userId: string;
  dueDate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  xpReward?: number;
}

export default function Productivity() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('Geral');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [customXpReward, setCustomXpReward] = useState(30);

  // Focus & optimization states (premium simulated flow)
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStatus, setOptimizationStatus] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);

  // Confirmation Modal states
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  
  // Custom premium Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  const { addXP, unlockAchievement, completeQuest } = useGamification();

  // Dynamically calculate recommended XP reward based on difficulty & priority
  useEffect(() => {
    let base = 20;
    if (newTaskDifficulty === 'easy') base = 15;
    if (newTaskDifficulty === 'medium') base = 30;
    if (newTaskDifficulty === 'hard') base = 50;

    if (newTaskPriority === 'high') base += 10;
    if (newTaskPriority === 'low') base -= 5;
    
    setCustomXpReward(Math.max(10, base));
  }, [newTaskDifficulty, newTaskPriority]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      where('status', '!=', 'archived')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(taskList);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`);
    });

    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleToggleClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'completed') {
      // Unchecking doesn't need confirmation & doesn't give XP (prevents exploits)
      updateTaskStatus(task, 'todo');
    } else {
      // Opening structured completion confirmation
      setTaskToComplete(task);
    }
  };

  const confirmTaskCompletion = async (e: React.MouseEvent) => {
    if (!taskToComplete) return;
    const user = auth.currentUser;
    if (!user) return;

    const xpAmount = taskToComplete.xpReward || 25;
    
    // Grant XP securely only after real manual user confirmation!
    addXP(xpAmount, `Objetivo Validado: ${taskToComplete.title}! 🎯`, e);
    unlockAchievement('first_task');
    
    if (taskToComplete.priority === 'high') {
      completeQuest('quest_task');
    }

    await updateTaskStatus(taskToComplete, 'completed');
    window.dispatchEvent(new CustomEvent('lumyn-task-completed', {
      detail: { title: taskToComplete.title }
    }));
    triggerToast(`Meta "${taskToComplete.title}" concluída! +${xpAmount} XP obtido.`, 'success');
    setTaskToComplete(null);
  };

  const updateTaskStatus = async (task: Task, newStatus: 'todo' | 'completed') => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
      await updateDoc(taskRef, {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/tasks/${task.id}`);
    }
  };

  const handleOpenCreateModal = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskCategory('Geral');
    setNewTaskDueDate('');
    setNewTaskDifficulty('medium');
    setShowCreateModal(true);
  };

  const handleCreateTask = async (e: React.MouseEvent) => {
    const user = auth.currentUser;
    if (!user || !newTaskTitle.trim()) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        userId: user.uid,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || 'Sem descrição adicional.',
        category: newTaskCategory,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || 'Sem prazo definido',
        difficulty: newTaskDifficulty,
        xpReward: customXpReward,
        status: "todo",
        createdAt: serverTimestamp()
      });
      
      // Educational reward for organizing
      addXP(5, "Planejamento Efetuado! 🧠", e);
      
      triggerToast(`Meta "${newTaskTitle.trim()}" ativada no seu grid!`, 'success');
      setShowCreateModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/tasks`);
    }
  };

  const handleDelete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
      triggerToast("Meta removida com sucesso.", "info");
    } catch (error) {
      console.error("Falha ao remover tarefa:", error);
    }
  };

  // Premium Simulated Foco Optimization (replaces the click-to-get-infinite-XP exploit)
  const runFocusOptimization = () => {
    setIsOptimizing(true);
    setOptimizationStatus('Analisando tarefas pendentes...');
    setTimeout(() => {
      setOptimizationStatus('Priorizando blocos cognitivos...');
      setTimeout(() => {
        setOptimizationStatus('Sincronizando janelas ótimas de foco...');
        setTimeout(() => {
          setIsOptimizing(false);
          setOptimizationStatus('');
          triggerToast('Fluxo de Foco Otimizado via IA! Janelas de atenção profunda recalibradas.', 'success');
        }, 1200);
      }, 1000);
    }, 1000);
  };

  // Premium Simulated Report (replaces click-to-get-infinite-XP exploit)
  const runGenerateReport = () => {
    setIsGeneratingReport(true);
    setReportResult(null);
    setTimeout(() => {
      setIsGeneratingReport(false);
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setReportResult(`Seu índice de consecução cognitiva é de de ${rate}%. Sua melhor categoria é "${tasks[0]?.category || 'Estudos'}". Picos de foco detectados no período da manhã.`);
    }, 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-16 relative">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-24 right-6 z-[9999] px-6 py-4 rounded-2.5xl shadow-2xl border text-xs font-bold uppercase tracking-wider flex items-center gap-3 ${
              toastType === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-900/95 border-white/10 text-slate-300'
            }`}
          >
            <Sparkles size={16} className="text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and inputs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic">Objetivos Neurais.</h2>
          <p className="text-slate-500 mt-0.5 text-[10px] sm:text-xs md:text-sm font-medium">Sua agenda de performance diária está <span className="text-[#4F7CFF] font-black uppercase tracking-widest text-xs">Ativa</span>.</p>
        </div>
        
        {/* Trigger Premium Modal Button */}
        <button 
          onClick={handleOpenCreateModal}
          className="w-full xl:w-auto px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Adicionar Nova Meta Premium
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Task lists panels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">
              <Filter size={12} /> Painel Filtrado: Grade Ativa
            </div>
            
            <div className="text-[10px] text-[#4F7CFF] font-black uppercase">
              {tasks.filter(t => t.status === 'completed').length} de {tasks.length} Objetivos Concluídos
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#4F7CFF]/20 border-t-[#4F7CFF] rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode='popLayout'>
                {tasks.length === 0 && (
                  <div className="bento-card text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                    Nenhuma meta localizada na grade. Adicione prioridades clicando no botão acima.
                  </div>
                )}
                
                {tasks.map(task => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id}
                    className={`group glass p-5 rounded-3xl flex items-start gap-5 cursor-pointer border border-white/5 hover:border-[#4F7CFF]/30 transition-all ${
                      task.status === 'completed' ? 'opacity-35 grayscale-[40%]' : ''
                    }`}
                    onClick={(e) => handleToggleClick(task, e)}
                  >
                    {/* Visual Check box */}
                    <button className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                      task.status === 'completed' 
                        ? 'bg-gradient-to-tr from-[#4F7CFF] to-blue-600 border-none shadow-md' 
                        : 'border-white/10 group-hover:border-[#4F7CFF]'
                    }`}>
                      {task.status === 'completed' ? (
                        <CheckCircle size={14} className="text-white" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4F7CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          task.priority === 'high' 
                            ? 'text-red-400 border-red-500/20 bg-red-500/5' 
                            : task.priority === 'ai-suggested'
                            ? 'text-purple-400 border-purple-500/20 bg-purple-500/5'
                            : 'text-slate-500 border-white/10 bg-white/5'
                        }`}>
                           {task.priority === 'high' ? 'Alta Prioridade 🔥' : task.priority === 'low' ? 'Baixa prioridade' : 'Média Prioridade'}
                        </span>
                        
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          {task.category || 'Geral'}
                        </span>

                        {task.difficulty && (
                          <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
                            task.difficulty === 'hard' 
                              ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' 
                              : task.difficulty === 'easy'
                              ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-450 border border-blue-500/20'
                          }`}>
                            DF: {task.difficulty}
                          </span>
                        )}

                        <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
                          +{task.xpReward || 25} XP
                        </span>
                      </div>
                      
                      <h4 className={`text-base md:text-lg font-bold text-slate-200 group-hover:text-white transition-colors tracking-tight ${
                        task.status === 'completed' ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-450 leading-relaxed font-semibold max-w-2xl">{task.description}</p>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1">
                          <Clock size={12} className="text-slate-600" />
                          <span>Prazo: {task.dueDate}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Trash Delete button */}
                    <button 
                      onClick={(e) => handleDelete(task.id, e)}
                      className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-400 active:scale-95 transition-all cursor-pointer mt-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-6">
               <Brain size={24} className="text-white animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Otimizador de Rotina</span>
             </div>
             
             <h3 className="text-2xl font-display font-black mb-4 tracking-tight leading-none">
                {tasks.filter(t => t.status === 'todo').length} Metas Pendentes.
             </h3>
             
             <p className="text-white/80 text-xs md:text-sm leading-relaxed mb-8 italic">
                "Sincronização de hábitos concluída. Suas próximas horas mostram janelas ótimas de desempenho cognitivo profundo."
             </p>
             
             <div className="space-y-4">
                <button 
                  onClick={runFocusOptimization}
                  disabled={isOptimizing}
                  className="w-full py-3.5 rounded-xl bg-white text-[#4F7CFF] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isOptimizing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#4F7CFF] border-t-transparent rounded-full animate-spin" />
                      <span>{optimizationStatus}</span>
                    </>
                  ) : (
                    <>
                      <Zap size={12} />
                      <span>Otimizar Fluxo de Foco</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={runGenerateReport}
                  disabled={isGeneratingReport}
                  className="w-full py-3.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando Analytics...</span>
                    </>
                  ) : (
                    <>
                      <BarChart size={12} />
                      <span>Gerar Relatório de Insights</span>
                    </>
                  )}
                </button>

                {reportResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl bg-black/25 text-[11px] font-semibold text-slate-200 border border-white/5 leading-relaxed"
                  >
                    <div className="flex items-center gap-1.5 mb-2.5 text-amber-400 uppercase font-black tracking-widest text-[9px]">
                      <Sparkles size={12} />
                      <span>Sintese Cognitiva</span>
                    </div>
                    {reportResult}
                  </motion.div>
                )}
             </div>
          </div>

          <div className="bento-card">
             <div className="flex items-center gap-3 mb-8">
               <Zap size={18} className="text-yellow-500 fill-yellow-500 animate-bounce" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Potencial de Concentração</span>
             </div>
             
             <div className="flex items-end gap-2 mb-3 leading-none">
               <span className="text-4xl font-display font-black text-white tracking-tight">14.5 h</span>
               <span className="text-xs font-bold text-green-400 mb-1 uppercase tracking-widest font-mono">+24% Rendimento</span>
             </div>
             
             <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
               Janelas de atenção profunda mapeadas no ciclo de 7 dias. Complete seus afazeres para faturar ainda mais XP!
             </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Component */}
      <AnimatePresence>
        {taskToComplete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden text-center bg-slate-900/60"
            >
              <div className="w-14 h-14 bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-4">
                <CheckCircle2 size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-white">Confirmar Conclusão?</h3>
                <p className="text-slate-450 text-xs font-medium leading-relaxed">
                  Deseja realmente arquivar e concluir a meta: <br />
                  <strong className="text-white text-sm font-black italic block mt-2">"{taskToComplete.title}"</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recompensa Estimada</span>
                <span className="text-sm font-black font-mono text-amber-400 font-bold">+{taskToComplete.xpReward || 25} XP ⭐</span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTaskToComplete(null)}
                  className="w-1/2 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest hover:scale-101 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmTaskCompletion}
                  className="w-1/2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:scale-101 transition-all cursor-pointer"
                >
                  Sim, Concluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Create Modal Component */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="max-w-xl w-full glass p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6 relative bg-slate-900/40 my-8"
            >
              {/* Absolutes styling */}
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Sparkles size={120} className="text-[#4F7CFF]" />
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 text-[#4F7CFF] flex items-center justify-center font-black">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-display font-black text-2xl text-white">Criar Meta Neural</h3>
                  <p className="text-slate-500 text-xs font-semibold">Formule seu objetivo diário com inteligência quantificável.</p>
                </div>
              </div>

              {/* Form elements */}
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Nome do Objetivo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Concluir estudo de neurociência profunda..."
                    className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 text-sm font-semibold"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Descrição da Execução</label>
                  <textarea
                    placeholder="Especifique ações lógicas necessárias para a satisfação deste objetivo..."
                    className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-200 placeholder:text-slate-655 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 text-xs font-semibold h-20 resize-none"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Categoria</label>
                    <select
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-350 focus:outline-none text-xs font-bold"
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                    >
                      <option className="bg-[#111827]" value="Geral">Geral</option>
                      <option className="bg-[#111827]" value="Estudos">Estudos</option>
                      <option className="bg-[#111827]" value="Trabalho">Trabalho</option>
                      <option className="bg-[#111827]" value="Saúde">Saúde</option>
                      <option className="bg-[#111827]" value="Finanças">Finanças</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Prioridade Neural</label>
                    <select
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-350 focus:outline-none text-xs font-bold"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    >
                      <option className="bg-[#111827]" value="low">Baixa Eficácia</option>
                      <option className="bg-[#111827]" value="medium">Média Prioridade</option>
                      <option className="bg-[#111827]" value="high">Alta Prioridade 🔥</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Prazo de Resolução</label>
                    <input
                      type="text"
                      placeholder="Ex: Hoje às 18h, Dia 28/05..."
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 text-xs font-semibold"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Dificuldade Estimada</label>
                    <select
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-350 focus:outline-none text-xs font-bold"
                      value={newTaskDifficulty}
                      onChange={(e) => setNewTaskDifficulty(e.target.value as any)}
                    >
                      <option className="bg-[#111827]" value="easy">Fácil (Rápida Absorção)</option>
                      <option className="bg-[#111827]" value="medium">Média (Atenção Padrão)</option>
                      <option className="bg-[#111827]" value="hard">Difícil (Deep Work Coeso)</option>
                    </select>
                  </div>
                </div>

                {/* Simulated Reward Indicator */}
                <div className="p-4 rounded-xl bg-[#4F7CFF]/5 border border-[#4F7CFF]/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block mb-0.5">Dopamina Estimulada</span>
                    <span className="text-white text-xs font-extrabold">Esta meta renderá recompensa para sua progressão</span>
                  </div>
                  <span className="text-sm font-black text-amber-400 font-mono">+{customXpReward} XP ⭐</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-4 rounded-xl border border-white/10 text-slate-450 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest active:scale-98 transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateTask(e)}
                  className="w-1/2 py-4 rounded-xl bg-[#4F7CFF] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-98 transition-all cursor-pointer hover:bg-blue-600 border border-blue-500/30"
                >
                  Confirmar Criação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
