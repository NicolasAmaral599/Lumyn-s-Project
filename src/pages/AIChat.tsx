import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Brain, User, MoreVertical, Paperclip, Mic, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { auth } from '../lib/firebase';
import { useGamification } from '../contexts/GamificationContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const [displayName, setDisplayName] = useState('');
  const { addXP, unlockAchievement, completeQuest } = useGamification();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! Analisei seu fluxo de hábitos cognitivos recentes. Como posso ajudar você a refinar seu foco estratégico hoje?`,
      timestamp: new Date()
    }
  ]);

  useEffect(() => {
    const user = auth.currentUser;
    let name = '';
    if (user) {
      name = ' ' + (user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Atleta');
      setDisplayName(name);
    } else {
      setDisplayName('');
    }
    setMessages([
      {
        role: 'assistant',
        content: `Olá${name}! Analisei seu fluxo de hábitos cognitivos recentes. Como posso ajudar você a refinar seu foco estratégico hoje?`,
        timestamp: new Date()
      }
    ]);
  }, []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Trigger Gamification milestones
    unlockAchievement('first_chat');
    completeQuest('quest_ai');
    addXP(10, "Colaboração Cognitiva com IA! 🧠");

    window.dispatchEvent(new CustomEvent('lumyn-chat-sent', {
      detail: { text: input }
    }));

    const userMessage: Message = { 
      role: 'user', 
      content: input, 
      timestamp: new Date() 
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          context: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Desculpe pelo imprevisto de conexão neural. Por favor, verifique se seu e-mail e chave do Gemini de teste estão devidamente configurados no painel de segredos do AI Studio.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-210px)] animate-in fade-in duration-700">
      {/* Chat Title and Status */}
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] flex items-center justify-center shadow-xl shadow-blue-500/10 shrink-0">
            <Brain size={20} className="text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-display font-black text-white flex items-center gap-1.5 tracking-tight">
              Mentor Lumyn <Sparkles className="text-amber-400 w-3.5 h-3.5" />
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-ping" />
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Núcleo Neural Conectado</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 text-[#4F7CFF] text-[8px] font-black uppercase tracking-widest items-center gap-1.5">
             <Shield size={12} /> Criptografia Ponta a Ponta
           </div>
           <button className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/5 text-slate-500 hover:text-white transition-all cursor-pointer">
             <MoreVertical size={16} />
           </button>
        </div>
      </div>

      {/* Messages Logs with fine bubbles */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 sm:space-y-6 md:space-y-8 pb-4 pr-1 sm:pr-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 14 }}
              className={`flex gap-3 sm:gap-4.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-tr from-[#4F7CFF] to-blue-600 text-white' 
                  : 'bg-white/[0.04] border border-white/5 text-[#4F7CFF]'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Brain size={14} />}
              </div>
              
              <div className={`max-w-[85%] rounded-2xl sm:rounded-3xl px-4 py-2.5 sm:px-6 sm:py-4 shadow-xl relative text-xs sm:text-sm md:text-md leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#4F7CFF] text-white rounded-tr-none' 
                  : 'bg-white/[0.03] border border-white/5 rounded-tl-none backdrop-blur-md'
              }`}>
                <div className="prose prose-sm prose-invert max-w-none text-slate-100 font-medium">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className={`text-[8px] mt-3 font-black uppercase tracking-widest opacity-40 ${
                  msg.role === 'user' ? 'text-right text-slate-100' : 'text-left text-slate-500'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow animate-pulse">
              <Brain size={16} className="text-[#4F7CFF]" />
            </div>
            
            <div className="bg-white/[0.03] border border-white/5 p-4.5 rounded-[1.5rem] rounded-tl-none flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-2 h-2 bg-[#4F7CFF] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-[#4F7CFF] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-[#4F7CFF] rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <form onSubmit={handleSend} className="relative mt-4">
        <div className="bg-white/[0.03] backdrop-blur-2xl p-2 rounded-[2.5rem] flex items-center gap-2 shadow-2xl border border-white/10 group-focus-within:border-[#4F7CFF]/50 transition-all">
          <button type="button" className="w-11 h-11 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center cursor-pointer">
            <Paperclip size={18} />
          </button>
          
          <input 
            type="text" 
            placeholder="Pergunte ao Mentor Lumyn..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white font-medium px-2 py-3 placeholder:text-slate-600 text-xs sm:text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          
          <div className="flex items-center gap-2 pr-1">
            <button type="button" className="w-11 h-11 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center hidden sm:flex cursor-pointer">
              <Mic size={18} />
            </button>
            
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 disabled:opacity-30 disabled:scale-100 cursor-pointer ${
                input.trim() 
                  ? 'bg-gradient-to-tr from-[#4F7CFF] to-indigo-600 text-white shadow-blue-500/20' 
                  : 'bg-white/10 text-slate-600'
              }`}
            >
              <Send size={16} className={input.trim() ? 'translate-x-0.5' : ''} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
