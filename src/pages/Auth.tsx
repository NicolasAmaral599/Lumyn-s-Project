import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Github, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useGamification } from '../contexts/GamificationContext';

interface AuthProps {
  type: 'login' | 'signup';
  onAuthSuccess: () => void;
}

export default function Auth({ type, onAuthSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(type);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addXP } = useGamification();

  // Sync mode state when type prop updates from routing
  useEffect(() => {
    setMode(type);
  }, [type]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user profile if it doesn't exist
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: serverTimestamp(),
        onboarding: true
      }, { merge: true });

      // Give welcome XP!
      addXP(50, "Criação de Conexão com Google! 🌐");

      onAuthSuccess();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message) {
        if (err.message.includes('auth/popup-closed-by-user')) {
          setError('A janela de login do Google foi fechada antes de concluir.');
        } else {
          setError('Falha na sincronização via Google: ' + err.message);
        }
      } else {
        setError('Falha ao autenticar com Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          createdAt: serverTimestamp(),
          onboarding: true
        });
        
        // Give new user sign up XP
        addXP(100, "Conexão Inicial efetuada com sucesso! ✨");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Login XP
        addXP(20, "Acesso Diário Restabelecido! 🔥");
      }
      onAuthSuccess();
      navigate('/dashboard');
    } catch (err: any) {
      let formattedError = 'Ocorreu um erro ao processar seu acesso.';
      if (err.code === 'auth/email-already-in-use') {
        formattedError = 'Este endereço de e-mail já está sendo utilizado.';
      } else if (err.code === 'auth/weak-password') {
        formattedError = 'A senha precisa conter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        formattedError = 'Credenciais inválidas. Verifique seu protocolo de acesso.';
      } else if (err.message) {
        formattedError = err.message;
      }
      setError(formattedError);
    } finally {
      setIsLoading(false);
    }
  };

  const shiftMode = (targetMode: 'login' | 'signup') => {
    setMode(targetMode);
    navigate(targetMode === 'login' ? '/login' : '/signup', { replace: true });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#111827]">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#4F7CFF]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 14 }}
        className="max-w-md w-full bento-card shadow-2xl relative z-10 border-white/5 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6]" />
        
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4F7CFF] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform">
              <div className="w-7 h-7 bg-white rounded-md rotate-45" />
            </div>
          </Link>
          
          <h1 className="text-3.5xl font-display font-black text-white tracking-tight">
            {mode === 'login' ? 'Entrada Neural' : 'Registro de Novo Node'}
          </h1>
          <p className="text-slate-500 mt-2 text-xs font-bold uppercase tracking-[0.2em] leading-loose">
            {mode === 'login' ? 'Acesse seu ecossistema pessoal de inteligência.' : 'Inicialize sua sincronização cognitiva.'}
          </p>
        </div>

        {/* Dynamic sliding segmented control tabs */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-1 mb-8 relative">
          <button
            type="button"
            onClick={() => shiftMode('login')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
              mode === 'login' ? 'text-[#111827]' : 'text-slate-400 hover:text-white'
            }`}
          >
            {mode === 'login' && (
              <motion.div
                layoutId="activeAuthTab"
                className="absolute inset-0 bg-white rounded-xl"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10">Entrar</span>
          </button>
          
          <button
            type="button"
            onClick={() => shiftMode('signup')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
              mode === 'signup' ? 'text-[#111827]' : 'text-slate-400 hover:text-white'
            }`}
          >
            {mode === 'signup' && (
              <motion.div
                layoutId="activeAuthTab"
                className="absolute inset-0 bg-white rounded-xl"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10 font-black">Criar Conta</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-2.5 uppercase tracking-widest">Identificador Lógico (E-mail)</label>
            <input 
              type="email" 
              required
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 transition-all font-medium text-sm"
              placeholder="seu-id@lumyn.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-2.5 uppercase tracking-widest">Código de Autenticação (Senha)</label>
            <input 
              type="password" 
              required
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/50 transition-all font-medium text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4.5 rounded-2xl bg-white text-[#111827] font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:bg-slate-50 active:scale-97 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#111827]/30 border-t-[#111827] rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sincronizar' : 'Inicializar Mente'} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Conexão Externa</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4">
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-97 transition-all font-extrabold text-[10px] text-slate-300 uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            <Mail size={16} className="text-rose-500" /> Acessar com Conta Google
          </button>
        </div>

        <p className="mt-10 text-center text-slate-500 text-[10px] font-extrabold uppercase tracking-widest leading-loose">
          {mode === 'login' ? (
            <>Novo no Lumyn? <button type="button" onClick={() => shiftMode('signup')} className="text-white hover:underline hover:text-[#4F7CFF] transition-colors ml-1 font-black cursor-pointer bg-transparent border-none p-0 inline">Criar uma conta</button></>
          ) : (
            <>Já é usuário? <button type="button" onClick={() => shiftMode('login')} className="text-white hover:underline hover:text-[#4F7CFF] transition-colors ml-1 font-black cursor-pointer bg-transparent border-none p-0 inline">Acessar Conta</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
}
