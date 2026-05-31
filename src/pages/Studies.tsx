import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Calendar, Award, GraduationCap, ChevronRight, 
  BookOpen, Star, Sparkles, CheckCircle2, Bookmark, BarChart2, Trash2,
  X, Clock, Target, ShieldCheck
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useGamification } from '../contexts/GamificationContext';

interface Course {
  id: string;
  name: string;
  subject?: string;
  category: string;
  progress: number; // 0 to 100
  totalLessons: number;
  completedLessons: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  duration?: string;
  studyGoal?: string;
}

export default function Studies() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom premium modal configurations
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSubject, setNewCourseSubject] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Tecnologia');
  const [newCourseLessons, setNewCourseLessons] = useState(10);
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newDuration, setNewDuration] = useState('');
  const [newStudyGoal, setNewStudyGoal] = useState('');

  // Confirmation state
  const [courseToAdvance, setCourseToAdvance] = useState<Course | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { addXP, unlockAchievement } = useGamification();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'courses')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(courseList);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/courses`);
    });

    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setNewCourseName('');
    setNewCourseSubject('');
    setNewCourseCategory('Tecnologia');
    setNewCourseLessons(10);
    setNewDifficulty('medium');
    setNewDuration('');
    setNewStudyGoal('');
    setShowCreateModal(true);
  };

  const addCourse = async (e: React.MouseEvent) => {
    const user = auth.currentUser;
    if (!user || !newCourseName.trim()) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'courses'), {
        userId: user.uid,
        name: newCourseName.trim(),
        subject: newCourseSubject.trim() || 'Matéria Geral',
        category: newCourseCategory,
        progress: 0,
        totalLessons: Number(newCourseLessons) || 10,
        completedLessons: 0,
        difficulty: newDifficulty,
        duration: newDuration.trim() || 'Duração variável',
        studyGoal: newStudyGoal.trim() || 'Aprimoramento contínuo',
        createdAt: serverTimestamp()
      });

      // Educational planning XP reward
      addXP(15, "Nova Disciplina Mapeada! 🎓", e);
      triggerToast(`Curso "${newCourseName.trim()}" integrado à sua grade!`);
      setShowCreateModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/courses`);
    }
  };

  const handleAdvanceClick = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (course.completedLessons >= course.totalLessons) {
      triggerToast("Este curso já foi completamente dominado!");
      return;
    }
    setCourseToAdvance(course);
  };

  const confirmAdvanceLesson = async (e: React.MouseEvent) => {
    if (!courseToAdvance) return;
    const user = auth.currentUser;
    if (!user) return;

    const nextCompleted = Math.min(courseToAdvance.completedLessons + 1, courseToAdvance.totalLessons);
    const nextProgress = Math.round((nextCompleted / courseToAdvance.totalLessons) * 100);
    
    // Grant XP securely only after real manual user confirmation!
    addXP(25, "Lição Concluída! 🧑‍🎓", e);
    
    if (nextProgress === 100) {
      addXP(100, "Curso Masterizado! 🏆", e);
      unlockAchievement('first_mastery');
    }

    try {
      const courseRef = doc(db, 'users', user.uid, 'courses', courseToAdvance.id);
      await updateDoc(courseRef, {
        completedLessons: nextCompleted,
        progress: nextProgress
      });
      triggerToast(`Lição registrada em "${courseToAdvance.name}"! +25 XP.`);
    } catch (error) {
      console.error("Falha ao atualizar curso:", error);
    }

    setCourseToAdvance(null);
  };

  const handleDelete = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'courses', courseId));
      triggerToast("Trilha educacional removida.");
    } catch (error) {
      console.error("Falha ao deletar curso:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-16 relative">
      
      {/* Dynamic Toast Popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-[9999] bg-slate-900/95 border border-[#8B5CF6]/30 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3"
          >
            <Sparkles className="text-amber-400" size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic">Grade Intelectual.</h2>
          <p className="text-slate-500 mt-0.5 text-[10px] sm:text-xs md:text-sm font-medium">Eleve suas habilidades técnicas mapeando novas unidades de conhecimento.</p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="w-full xl:w-auto px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#4F7CFF] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/10 hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Planejar Novo Aprendizado Premium
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Course cards panel */}
        <div className="lg:col-span-8 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#4F7CFF]/20 border-t-[#4F7CFF] rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {courses.length === 0 && (
                <div className="bento-card text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                  Nenhuma disciplina em andamento. Crie sua primeira trilha clicando no botão acima para começar.
                </div>
              )}
              
              {courses.map(course => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={course.id}
                  onClick={(e) => handleAdvanceClick(course, e)}
                  className="bento-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer border-white/5 hover:border-[#4F7CFF]/30 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-start gap-4.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8B5CF6]/15 to-blue-500/5 border border-purple-500/20 text-[#8B5CF6] flex items-center justify-center font-display font-black group-hover:scale-105 transition-transform mt-0.5">
                      <BookOpen size={20} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{course.category}</span>
                        {course.subject && (
                          <span className="text-[8px] font-black text-[#8B5CF6] uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded">
                            {course.subject}
                          </span>
                        )}
                        {course.difficulty && (
                          <span className="text-[7.5px] font-black uppercase text-amber-500 tracking-widest">
                             DF: {course.difficulty}
                          </span>
                        )}
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                           {course.progress === 100 ? '⭐ Mestre' : 'Em Progresso'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-display font-black text-slate-200 group-hover:text-white transition-colors leading-snug">{course.name}</h3>
                      
                      {course.studyGoal && (
                        <p className="text-xs text-slate-450 font-semibold leading-relaxed line-clamp-2 max-w-xl italic">"{course.studyGoal}"</p>
                      )}

                      {course.duration && (
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block pt-1">Duração Estimada: {course.duration}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="text-right flex flex-col justify-center min-w-[100px]">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progresso Mapeado</span>
                      <span className="text-sm font-black font-mono text-slate-100 mt-1">
                        {course.completedLessons} / {course.totalLessons} Lições
                      </span>
                      {/* Course progress bar */}
                      <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden mt-2 ml-auto">
                        <div 
                          className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#4F7CFF] rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick increment interaction button */}
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={(e) => handleAdvanceClick(course, e)}
                         className="px-3.5 py-2 hover:bg-[#8B5CF6] hover:text-white border border-[#8B5CF6]/25 text-[#8B5CF6] text-[8px] font-black uppercase tracking-widest rounded-xl transition-all h-fit shadow-lg"
                       >
                          +1 Lição
                       </button>
                       <button 
                         onClick={(e) => handleDelete(course.id, e)}
                         className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-400 active:scale-95 transition-all cursor-pointer"
                       >
                         <Trash2 size={15} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Sidebar statistics */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-gradient-to-br from-[#8B5CF6] to-[#4F7CFF] p-8 rounded-[2.5rem] text-white shadow-xl shadow-purple-500/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/15">
                 <GraduationCap size={24} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-display font-black mb-3 leading-tight">Mente Absorbente</h3>
              <p className="text-white/80 text-xs leading-relaxed mb-6 italic">
                 Estudar novos cursos aumenta sua plasticidade neurológica. A cada lição finalizada, obtenha generosos pontos de XP para faturar novas divisões de prestígio!
              </p>
              
              <div className="p-4 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Plasticidade Cognitiva</span>
                 <span className="text-xs font-black font-mono text-emerald-300">Alta 🧠</span>
              </div>
           </div>

           <div className="bento-card">
              <div className="flex items-center gap-2.5 mb-6">
                 <Award className="text-amber-500 animate-pulse" size={18} />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maestria Intelectual</span>
              </div>
              
              <div className="space-y-4">
                 {[
                   { name: "Criptogama Lógico", xp: "+100 XP" },
                   { name: "Sistemas Distribuídos", xp: "+150 XP" },
                   { name: "Linguística e Dialética", xp: "+80 XP" }
                 ].map((unit, i) => (
                   <div key={i} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <span className="text-xs font-semibold text-slate-300">{unit.name}</span>
                      <span className="text-[10px] font-black text-amber-400 uppercase font-mono">{unit.xp}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Confirmation of Lesson Advancement Modal */}
      <AnimatePresence>
        {courseToAdvance && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden text-center bg-slate-900/60"
            >
              <div className="w-14 h-14 bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-4">
                <ShieldCheck size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-white">Concluir Lição de Estudo?</h3>
                <p className="text-slate-450 text-xs font-medium leading-relaxed">
                  Deseja realmente registrar a conclusão de 1 lição em: <br />
                  <strong className="text-white text-sm font-black italic block mt-2">"{courseToAdvance.name}"</strong>
                </p>
                <div className="text-[10px] text-slate-500 font-bold uppercase pt-1">
                  Progresso subirá para {Math.min(courseToAdvance.completedLessons + 1, courseToAdvance.totalLessons)} / {courseToAdvance.totalLessons} lições.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recompensa Acadêmica</span>
                <span className="text-sm font-black font-mono text-amber-400">+25 XP ⭐</span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCourseToAdvance(null)}
                  className="w-1/2 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest hover:scale-101 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmAdvanceLesson}
                  className="w-1/2 py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#4F7CFF] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/10 hover:scale-101 transition-all cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Creation Premium Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="max-w-xl w-full glass p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6 relative bg-slate-900/40 my-8"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center font-black">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="font-display font-black text-2xl text-white">Criar Trilha Intelectual</h3>
                  <p className="text-slate-500 text-xs font-semibold">Incorpore um novo curso ou habilidade ao seu repertório cognitivo.</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Course Name */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Nome do Curso / Competência</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Machine Learning Avançado..."
                    className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 text-sm font-semibold"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Matéria / Disciplina</label>
                    <input
                      type="text"
                      placeholder="Ex: Engenharia de Software..."
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 text-xs font-semibold"
                      value={newCourseSubject}
                      onChange={(e) => setNewCourseSubject(e.target.value)}
                    />
                  </div>

                  {/* Area/Category */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Área de Estudo</label>
                    <select
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-350 focus:outline-none text-xs font-bold"
                      value={newCourseCategory}
                      onChange={(e) => setNewCourseCategory(e.target.value)}
                    >
                      <option className="bg-[#111827]" value="Tecnologia">Tecnologia</option>
                      <option className="bg-[#111827]" value="Exatas">Exatas</option>
                      <option className="bg-[#111827]" value="Humanas">Humanas</option>
                      <option className="bg-[#111827]" value="Saúde">Saúde</option>
                      <option className="bg-[#111827]" value="Idiomas">Idiomas</option>
                    </select>
                  </div>
                </div>

                {/* Study goal */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Sua Meta Principal de Estudo</label>
                  <input
                    type="text"
                    placeholder="Ex: Obter proficiência para arquitetar redes neurais autônomas..."
                    className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 text-xs font-semibold"
                    value={newStudyGoal}
                    onChange={(e) => setNewStudyGoal(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Lessons */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Total de Lições/Aulas</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-250 focus:outline-none text-xs font-bold text-center"
                      value={newCourseLessons}
                      onChange={(e) => setNewCourseLessons(Number(e.target.value) || 1)}
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Duração Estimada</label>
                    <input
                      type="text"
                      placeholder="Ex: 40 horas, 3 semanas..."
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-200 placeholder:text-slate-650 focus:outline-none text-xs font-semibold text-center"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-520 uppercase tracking-widest">Grau de Complexidade</label>
                    <select
                      className="w-full px-5 py-3 rounded-xl bg-[#131926]/70 border border-white/10 text-slate-350 focus:outline-none text-xs font-bold"
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value as any)}
                    >
                      <option className="bg-[#111827]" value="easy">Iniciante</option>
                      <option className="bg-[#111827]" value="medium">Intermediário</option>
                      <option className="bg-[#111827]" value="hard">Doutorado/Avançado</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 block tracking-widest uppercase">Crédito Intelectual Garantido</span>
                    <span className="text-xs text-slate-400">Cada lição concluída neste curso confere recompensa imediata</span>
                  </div>
                  <span className="text-sm font-black text-amber-500 font-mono">25 XP / aula ⭐</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-4 rounded-xl border border-white/10 text-slate-450 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest active:scale-98 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addCourse}
                  className="w-1/2 py-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#4F7CFF] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-98 transition-all cursor-pointer hover:opacity-90 font-bold border border-purple-500/20"
                >
                  Sincronizar Trilha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
