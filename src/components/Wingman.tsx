import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Heart, HelpCircle, X, ChevronRight, Zap, Target, Smile, AlertCircle, PlayCircle, Trophy, Volume2
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Mascot speech database
const IDLE_COGNITIVE_PHRASES = [
  "Estou monitorando seu desempenho mental! 🧐",
  "Já tomou água hoje? Conexão neural precisa de hidratação! 💧",
  "Sua cognição está afiada hoje. Vamos esmagar essas metas! 🧠",
  "Foco é treinar recusar outras 100 boas ideias. O que atacamos agora? 🎯",
  "Preparado para destravar mais XP? Eu dou cobertura! 🚀",
  "Lembre-se: pequenas consistências geram legados gigantes. ✨",
  "Quer testar meu raciocínio rápido? Clique em mim para brincar! 👾",
  "Gostando do fluxo de trabalho? Não esqueça de mapear seus logs! 💆",
];

const STRESSED_COMPANION_PHRASES = [
  "Ei... percebi que você está operando em zona crítica de estresse. Faça uma pausa de 10 minutos! 🧘",
  "Pressão alta prejudica a retenção teórica. Respire fundo comigo. Inspira... expira... ❤️",
  "Não se cobre tanto. Descansar também faz parte do plano de mestre. Estarei aqui te dando apoio! 🫂",
  "Que tal fechar os olhos e beber um chá? Sua saúde vem antes da linha de código. ☕",
];

const HEAVENLY_HAPPY_PHRASES = [
  "Incrível! Padrão cognitivo em harmonia profunda. Voa, desbravador! 🤩",
  "Aproveite essa dopamina extra e monte um cronograma ambicioso! 🔥",
  "Sua mente está brilhando hoje! Sentimento maravilhoso, né? 🌟",
  "Foco excelente, estado de espírito ideal. Vamos masterizar essa semana! 🚀",
];

const TASK_CELEBRATION_PHRASES = [
  "META CONCLUÍDA! Você é simplesmente espetacular! 🏆",
  "Bateu no alvo! Mais um objetivo riscado da lista! 🎯",
  "Que ritmo sensacional! O caminho estratégico está garantido! ⭐",
  "Perfeito! Mais um passo rumo à maestria! 👑",
];

export default function Wingman() {
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'sad' | 'sleepy' | 'dizzy' | 'surprised'>('neutral');
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  
  // Positioning and motion coordinates
  const [mascotPos, setMascotPos] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [currentTone, setCurrentTone] = useState('Acolhedor e Tecnológico');

  // Custom pet stats
  const [happiness, setHappiness] = useState(80);
  const [showGame, setShowGame] = useState(false);
  const [isMinimized, setIsMinimized] = useState(window.innerWidth < 768);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMascotDragging, setIsMascotDragging] = useState(false);

  // References for layout tracking
  const mascotRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dizzyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse pupil look coordinates
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  // Load user tone settings on load (Customizer profile database)
  useEffect(() => {
    const checkUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
          const snap = await getDoc(profileRef);
          if (snap.exists() && snap.data().companionTone) {
            setCurrentTone(snap.data().companionTone);
          }
        } catch (e) {
          // Fallback safely
        }
      }
    };
    
    // Always run the cinematic onboarding/welcome intro in the center of the screen on load
    setIsIntroActive(true);
    setExpression('happy');

    checkUserProfile();

    // Listen to global custom events dispatched from other pages
    const handleXPGained = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      triggerWingmanReaction('happy', `+XP OBTIDO! ✨ ${detail.reason || ''} (+${detail.amount} XP) Mandou ver!`, 5500);
      setHappiness(prev => Math.min(100, prev + 8));
    };

    const handleTaskCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const rPhrase = TASK_CELEBRATION_PHRASES[Math.floor(Math.random() * TASK_CELEBRATION_PHRASES.length)];
      triggerWingmanReaction('happy', `🏆 "${detail.title}" concluída! ${rPhrase}`, 6000);
      setHappiness(prev => Math.min(100, prev + 12));
    };

    const handleMoodLogged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const moodId = detail.mood;
      if (moodId === 'exceptional' || moodId === 'good') {
        const rPhrase = HEAVENLY_HAPPY_PHRASES[Math.floor(Math.random() * HEAVENLY_HAPPY_PHRASES.length)];
        triggerWingmanReaction('happy', `💆 Estado Sincronizado! ${rPhrase}`, 6000);
        setHappiness(prev => Math.min(100, prev + 15));
      } else if (moodId === 'stressed' || moodId === 'tired') {
        const rPhrase = STRESSED_COMPANION_PHRASES[Math.floor(Math.random() * STRESSED_COMPANION_PHRASES.length)];
        triggerWingmanReaction('sad', `⚠️ Alerta Clínico: ${rPhrase}`, 7000);
        setHappiness(prev => Math.max(20, prev - 10));
      } else {
        triggerWingmanReaction('neutral', "Sentimento documentado no diário biográfico. Estou monitorando seus padrões vitais! 📈", 5000);
      }
    };

    const handleChatSent = () => {
      triggerWingmanReaction('surprised', "Análise cognitiva em andamento pela IA central externa! 🧩 Estou aprendendo com suas heurísticas!", 5000);
    };

    window.addEventListener('lumyn-xp-gained', handleXPGained);
    window.addEventListener('lumyn-task-completed', handleTaskCompleted);
    window.addEventListener('lumyn-mood-logged', handleMoodLogged);
    window.addEventListener('lumyn-chat-sent', handleChatSent);

    // Dynamic mouse move listener for pupil tracking
    const handleMouseMove = (mouseEvent: MouseEvent) => {
      setCursorPos({ x: mouseEvent.clientX, y: mouseEvent.clientY });
      
      if (mascotRef.current && expression === 'neutral') {
        const rect = mascotRef.current.getBoundingClientRect();
        const mascotX = rect.left + rect.width / 2;
        const mascotY = rect.top + rect.height / 2;

        const dx = mouseEvent.clientX - mascotX;
        const dy = mouseEvent.clientY - mascotY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
          const maxLook = 4.5; // Max pupil offset in px
          setPupilOffset({
            x: (dx / distance) * maxLook,
            y: (dy / distance) * maxLook
          });
        } else {
          setPupilOffset({ x: 0, y: 0 });
        }
      }
      
      // Reset idle timer whenever user moves mouse inside app
      resetIdleTimer();
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Start initial idle triggers
    resetIdleTimer();

    return () => {
      window.removeEventListener('lumyn-xp-gained', handleXPGained);
      window.removeEventListener('lumyn-task-completed', handleTaskCompleted);
      window.removeEventListener('lumyn-mood-logged', handleMoodLogged);
      window.removeEventListener('lumyn-chat-sent', handleChatSent);
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if (dizzyTimeoutRef.current) clearTimeout(dizzyTimeoutRef.current);
    };
  }, []);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // If not in sleep/intro state, schedule going to sleep after 40s of total system inactivity
    idleTimerRef.current = setTimeout(() => {
      if (expression !== 'sleepy' && !isIntroActive) {
        setExpression('sleepy');
        saySomething("Zzz... Sistema em economia de energia neural. Toque em mim para acordar! 🥱");
      }
    }, 45000);
  };

  const triggerWingmanReaction = (exp: 'neutral' | 'happy' | 'sad' | 'sleepy' | 'dizzy' | 'surprised', text: string, duration = 5000) => {
    setExpression(exp);
    saySomething(text, duration);
  };

  const saySomething = (text: string, duration = 4000) => {
    setBubbleText(text);
    setShowBubble(true);
    setHasInteracted(true);

    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    speakTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
      // Revert from extreme expression (like surprised or happy) to neutral eventually
      setTimeout(() => {
        setExpression(prev => (prev === 'happy' || prev === 'surprised' || prev === 'dizzy' ? 'neutral' : prev));
      }, 500);
    }, duration);
  };

  const handleDragStart = () => {
    setIsMascotDragging(true);
    if (expression !== 'dizzy') {
      setExpression('happy');
      const cuteCarryPhrases = [
        "Hummm! Voando alto! ☁️",
        "Que divertido! Para onde vamos? 🛩️",
        "Me levando para passear? Adorei! 🥰",
        "Segura firme! 🎢"
      ];
      saySomething(cuteCarryPhrases[Math.floor(Math.random() * cuteCarryPhrases.length)], 2000);
    }
  };

  const handleDrag = (_event: any, info: any) => {
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    if (speed > 850) {
      if (expression !== 'dizzy') {
        setExpression('dizzy');
        const dizzyPhrases = [
          "Uuuuuuiiii... Pára! Vou vomitar! 😵‍💫💫",
          "Que tonturaaa! Socorro! 🥺🌀",
          "Tudo girando... 🐦💫",
          "AI AI AI... Que parque de diversões radical é esse?! 🎢🌀"
        ];
        saySomething(dizzyPhrases[Math.floor(Math.random() * dizzyPhrases.length)], 4000);
      }
      
      if (dizzyTimeoutRef.current) clearTimeout(dizzyTimeoutRef.current);
      dizzyTimeoutRef.current = setTimeout(() => {
        setExpression('neutral');
      }, 4000);
    } else {
      if (expression !== 'dizzy' && expression !== 'happy') {
        setExpression('happy');
      }
    }
  };

  const handleDragEnd = () => {
    setIsMascotDragging(false);
    if (expression === 'dizzy') {
      const dizzyComplainPhrases = [
        "Minha cabeça está dando voltas... 🌀",
        "Olha os passarinhos... 🐦💫",
        "Acho que preciso de um minuto... 🩺"
      ];
      saySomething(dizzyComplainPhrases[Math.floor(Math.random() * dizzyComplainPhrases.length)], 4000);
      
      if (dizzyTimeoutRef.current) clearTimeout(dizzyTimeoutRef.current);
      dizzyTimeoutRef.current = setTimeout(() => {
        setExpression('neutral');
        saySomething("Ufa... Já passou! De volta ao trabalho! ⚡", 3000);
      }, 5000);
    } else {
      setExpression('happy');
      saySomething("Lar doce lar! Adorei a viagem! 🚀", 3000);
      if (dizzyTimeoutRef.current) clearTimeout(dizzyTimeoutRef.current);
      dizzyTimeoutRef.current = setTimeout(() => {
        setExpression('neutral');
      }, 3000);
    }
  };

  // Skip introduction sequence
  const handleSkipIntro = () => {
    setIsIntroActive(false);
    localStorage.setItem('lumyn_wingman_intro_seen', 'true');
    setExpression('neutral');
    saySomething("Introdução sincronizada! Estarei sempre aqui embaixo para te guiar. 💛", 4000);
  };

  // Cinematic Intro Dialogue workflow steps
  const runIntroStep = () => {
    const nextStep = introStep + 1;
    setIntroStep(nextStep);
    
    if (nextStep === 1) {
      triggerWingmanReaction('happy', "Vou te ajudar a masterizar sua rotina, ganhar XP, criar consistência e mapear sua fadiga! 📈", 4500);
    } else if (nextStep === 2) {
      triggerWingmanReaction('surprised', "Se você concluir tarefas, eu comemoro! Se logar cansaço extremo, eu te lembro de repousar e fazer alongamentos! 🧘", 5000);
    } else if (nextStep === 3) {
      triggerWingmanReaction('happy', "Sempre que precisar de um incentivo, basta clicar em mim. Vamos decolar juntos rumo à maestria cognitiva! 🚀", 5500);
    } else {
      setIsIntroActive(false);
      localStorage.setItem('lumyn_wingman_intro_seen', 'true');
      setExpression('neutral');
      saySomething("Sincronização concluída! Pronto para detonar? ⭐", 4000);
    }
  };

  // Feed the pet or click interactions
  const handleMascotPoke = () => {
    if (expression === 'sleepy') {
      triggerWingmanReaction('surprised', "Opa! Acordei! Coordenadas neurais online! ⚡ Vamos focar!", 4000);
      setHappiness(prev => Math.min(100, prev + 5));
      return;
    }

    // Set a dizzy spinner reaction on spam poking
    const pokeReactions = [
      () => triggerWingmanReaction('happy', "Ai! Isso cócegas! Hahaha! 😄", 3000),
      () => triggerWingmanReaction('surprised', "Uau! Algum insight extraordinário? Mande no chat da IA! 🧠", 3500),
      () => {
        setExpression('dizzy');
        saySomething("Uuuuiii... Fiquei tonto de tanto clique! 💫", 4000);
        setHappiness(prev => Math.max(10, prev - 3));
      },
      () => triggerWingmanReaction('happy', "Sabia que você está indo muito bem? Mantenha sua constância! ⭐", 4000),
      () => triggerWingmanReaction('neutral', "Estou de olho! O mouse está bem rastreável sob meu visor. 🧐", 3000)
    ];

    const randomFn = pokeReactions[Math.floor(Math.random() * pokeReactions.length)];
    randomFn();
  };

  // Get SVG eyes path based on expression state
  const renderEyes = () => {
    switch (expression) {
      case 'happy':
        // Happy arcs ^ ^ centered inside the purple mask
        return (
          <g>
            <path d="M 13 20 Q 17 14 21 20" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 29 20 Q 33 14 37 20" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        );
      case 'sad':
        // Concerned diagonal slants
        return (
          <g>
            <path d="M 13 18 L 21 21" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 37 18 L 29 21" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Soft sweat drop */}
            <motion.ellipse 
              animate={{ y: [0, 8, 12], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              cx="42" cy="18" rx="2" ry="3.5" fill="#38BDF8" 
            />
          </g>
        );
      case 'sleepy':
        // Sleepy flat closed lines - - y=20
        return (
          <g>
            <line x1="13" y1="20" x2="21" y2="20" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="29" y1="20" x2="37" y2="20" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" />
            {/* Bubble "Zzz..." particles */}
            <motion.g
              initial={{ scale: 0.3, y: 0, opacity: 0 }}
              animate={{ scale: [0.6, 1.2, 0.7], y: [-5, -25, -35], x: [0, 10, -5], opacity: [0, 0.9, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
              className="font-mono text-cyan-400 font-black"
            >
              <text x="44" y="5" fontSize="9">Z</text>
            </motion.g>
            <motion.g
              initial={{ scale: 0.3, y: 0, opacity: 0 }}
              animate={{ scale: [0.5, 1, 0.6], y: [-5, -15, -25], x: [10, -5, 5], opacity: [0, 0.9, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, delay: 1.8 }}
              className="font-mono text-cyan-500 font-bold"
            >
              <text x="40" y="-5" fontSize="7">z</text>
            </motion.g>
          </g>
        );
      case 'dizzy':
        // Cross x x eyes
        return (
          <g>
            <path d="M 13 16 L 21 24 M 21 16 L 13 24" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 29 16 L 37 24 M 37 16 L 29 24" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      case 'surprised':
        // Big white glowing round circles 😮
        return (
          <g>
            <circle cx="17" cy="20" r="4.5" fill="#FFFFFF" />
            <circle cx="33" cy="20" r="4.5" fill="#FFFFFF" />
            <circle cx="16" cy="18.5" r="1.5" fill="#FFFFFF" className="brightness-150" />
            <circle cx="32" cy="18.5" r="1.5" fill="#FFFFFF" className="brightness-150" />
          </g>
        );
      default:
        // Normal interactive tracking pupils!
        return (
          <g>
            {/* Eye socket bases - White glowing eyes */}
            <circle cx="17" cy="20" r="4.8" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="1" />
            <circle cx="33" cy="20" r="4.8" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="1" />
            {/* Pupil tracking with smooth math offsets */}
            <motion.circle 
              animate={{ x: pupilOffset.x, y: pupilOffset.y }}
              transition={{ type: 'spring', stiffness: 220, damping: 15 }}
              cx="17" cy="20" r="2.8" fill="#1E1B4B" 
            />
            <motion.circle 
              animate={{ x: pupilOffset.x, y: pupilOffset.y }}
              transition={{ type: 'spring', stiffness: 220, damping: 15 }}
              cx="33" cy="20" r="2.8" fill="#1E1B4B" 
            />
            {/* Gloss reflections */}
            <circle cx="15.5" cy="18.5" r="0.9" fill="#FFFFFF" />
            <circle cx="31.5" cy="18.5" r="0.9" fill="#FFFFFF" />
          </g>
        );
    }
  };

  // Get SVG mouth path
  const renderMouth = () => {
    switch (expression) {
      case 'happy':
        return <path d="M 21 26 Q 25 32 29 26" fill="#CD3B63" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />;
      case 'sad':
        return <path d="M 22 28 Q 25 24 28 28" stroke="#1E1B4B" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case 'sleepy':
        return <line x1="23" y1="26" x2="27" y2="26" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />;
      case 'dizzy':
        return <path d="M 20 27 Q 22 25 24 27 Q 26 29 28 27" stroke="#1E1B4B" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case 'surprised':
        return <circle cx="25" cy="27" r="2.5" fill="#1E1B4B" />;
      default:
        return <path d="M 22 27 H 28" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />;
    }
  };

  // Interact Rock Paper Scissors with the pet!
  const playInteractionChallenge = (choice: string) => {
    const comOptions = ['✊', '✋', '✌️'];
    const wingmanChoice = comOptions[Math.floor(Math.random() * comOptions.length)];
    
    let result = '';
    let exp: 'happy' | 'sad' | 'neutral' | 'surprised' = 'neutral';
    
    if (choice === wingmanChoice) {
      result = `Empatamos! Eu joguei ${wingmanChoice}. Sinergia espetacular! 🤝`;
      exp = 'surprised';
    } else if (
      (choice === '✊' && wingmanChoice === '✌️') ||
      (choice === '✋' && wingmanChoice === '✊') ||
      (choice === '✌️' && wingmanChoice === '✋')
    ) {
      result = `Você venceu! Eu joguei ${wingmanChoice}. Seus reflexos cognitivos estão ótimos! 🏆`;
      exp = 'sad';
      setHappiness(prev => Math.min(100, prev + 5));
    } else {
      result = `Woohoo! Eu ganhei! Joguei ${wingmanChoice}! Mais foco na próxima! 🥳`;
      exp = 'happy';
    }

    triggerWingmanReaction(exp, result, 6000);
    setShowGame(false);
  };

  // Ask for manual custom advice
  const requestFocoIncentive = () => {
    const isUnderStressedMode = expression === 'sad';
    const arr = isUnderStressedMode ? STRESSED_COMPANION_PHRASES : IDLE_COGNITIVE_PHRASES;
    const rPhrase = arr[Math.floor(Math.random() * arr.length)];
    
    triggerWingmanReaction(
      isUnderStressedMode ? 'sad' : 'happy',
      `💡 Conselho de Amigo: ${rPhrase}`,
      6500
    );
  };

  return (
    <>
      {/* 1. KINETIC INTROSPECTIVE OVERLAY (CINEMATIC ONBOARDING WRAPPER) */}
      <AnimatePresence>
        {isIntroActive && (
          <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-[10001]">
              <button 
                onClick={handleSkipIntro}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-500 text-white font-black text-[9px] sm:text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 focus:outline-none shadow-lg shadow-red-600/20 cursor-pointer"
              >
                Pular / Fechar Wingman <X size={12} className="stroke-[3] sm:w-[15px] sm:h-[15px]" />
              </button>
            </div>

            <div className="absolute top-1/4 h-2/5 w-[280px] sm:w-[500px] bg-gradient-to-tr from-[#FFDF54]/15 to-[#06B6D4]/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="flex flex-col items-center space-y-4 sm:space-y-8 select-none max-w-xl text-center z-10 my-auto">
              
              {/* Massive Center Companion Mascot frame */}
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1.1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 10 }}
                className="w-24 h-24 sm:w-40 sm:h-40 relative filter drop-shadow-[0_12px_24px_rgba(253,224,71,0.25)] shrink-0"
              >
                {/* SVG representing high-fidelity Gekko's Wingman mascot character */}
                <svg viewBox="0 0 50 50" className="w-full h-full">
                  <defs>
                    <linearGradient id="wingBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF275" />
                      <stop offset="50%" stopColor="#FBCC14" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <linearGradient id="wingMaskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#B194FA" />
                      <stop offset="100%" stopColor="#6345D9" />
                    </linearGradient>
                    <linearGradient id="wingArmorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4A403A" />
                      <stop offset="50%" stopColor="#2E2520" />
                      <stop offset="100%" stopColor="#1C1512" />
                    </linearGradient>
                  </defs>

                  {/* Dark armor backpack plate/shell behind body */}
                  <path d="M 9 20 C 5 24, 5 34, 9 38 L 41 38 C 45 34, 45 24, 41 20 Z" fill="url(#wingArmorGrad)" stroke="#1E1B4B" strokeWidth="1" />

                  {/* Large ears/horns on each side */}
                  <g>
                    {/* Left ear */}
                    <path d="M 12 12 Q 2 4 4 14 Q 9 16 12 12" fill="url(#wingArmorGrad)" stroke="#1E1B4B" strokeWidth="1" />
                    <path d="M 11 13 Q 1 6 5 15 C 8 16, 10 15, 11 13" fill="url(#wingBodyGrad)" stroke="#1E1B4B" strokeWidth="1" />
                  </g>
                  <g>
                    {/* Right ear */}
                    <path d="M 38 12 Q 48 4 46 14 Q 41 16 38 12" fill="url(#wingArmorGrad)" stroke="#1E1B4B" strokeWidth="1" />
                    <path d="M 39 13 Q 49 6 45 15 C 42 16, 40 15, 39 13" fill="url(#wingBodyGrad)" stroke="#1E1B4B" strokeWidth="1" />
                  </g>

                  {/* Chubby round Gekko companion main body body shape */}
                  <rect x="9" y="10" width="32" height="31" rx="15" fill="url(#wingBodyGrad)" stroke="#1E1B4B" strokeWidth="1.5" />

                  {/* Thigh armored scales on the sides */}
                  <path d="M 9 32 Q 6 35 10 38" stroke="#1E1B4B" strokeWidth="1.2" fill="url(#wingArmorGrad)" />
                  <path d="M 41 32 Q 44 35 40 38" stroke="#1E1B4B" strokeWidth="1.2" fill="url(#wingArmorGrad)" />

                  {/* Dark Crown/Crest armor helmet scales on forehead */}
                  <path d="M 16 12 Q 25 7 34 12 Q 25 18 16 12 Z" fill="url(#wingArmorGrad)" stroke="#1E1B4B" strokeWidth="1.2" />
                  <path d="M 21 11 L 25 15 L 29 11 L 25 9 Z" fill="#5F5148" />

                  {/* Purple facemark mask around eyes */}
                  <path d="M 11 20 C 11 15, 19 16, 25 18 C 31 16, 39 15, 39 20 C 39 25, 31 26, 25 24 C 19 26, 11 25, 11 20 Z" fill="url(#wingMaskGrad)" stroke="#1E1B4B" strokeWidth="1.2" />

                  {/* Face facial attributes */}
                  {renderEyes()}
                  {renderMouth()}

                  {/* Left wing arm with purple/black highlights */}
                  <g>
                    <path d="M 10 26 C 2 24, 0 32, 8 33 Z" fill="url(#wingBodyGrad)" stroke="#1E1B4B" strokeWidth="1" />
                    <path d="M 6 27 C 1 27, 1 31, 5 32 Z" fill="#8B5CF6" />
                    <circle cx="2" cy="29" r="1.2" fill="url(#wingArmorGrad)" />
                  </g>

                  {/* Right wing arm with purple/black highlights */}
                  <g>
                    <path d="M 40 26 C 48 24, 50 32, 42 33 Z" fill="url(#wingBodyGrad)" stroke="#1E1B4B" strokeWidth="1" />
                    <path d="M 44 27 C 49 27, 49 31, 45 32 Z" fill="#8B5CF6" />
                    <circle cx="48" cy="29" r="1.2" fill="url(#wingArmorGrad)" />
                  </g>

                  {/* Feet with blocky armored boot claws */}
                  <path d="M 13 41 L 19 41 L 17 43.5 Z" fill="url(#wingArmorGrad)" stroke="#1E1B4B" strokeWidth="1" />
                  <path d="M 31 41 L 37 41 L 35 43.5 Z" fill="url(#wingArmorGrad)" stroke="#1E1B4B" strokeWidth="1" />
                </svg>
                
                {/* Floating shine particles */}
                <Sparkles size={16} className="absolute -top-1.5 -right-1.5 text-yellow-300 animate-spin-slow sm:w-[24px] sm:h-[24px]" />
              </motion.div>

              {/* Onboarding Dialog Frame */}
              <div className="space-y-2 sm:space-y-4 shrink-0 px-2">
                <span className="text-[8px] sm:text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] leading-none inline-block">
                  Apresentando: Wingman 👾
                </span>
                
                <h2 className="text-lg sm:text-3xl md:text-4.5xl font-display font-black text-white leading-tight">
                  Seu Mascote de Foco <span className="text-yellow-400">Vivo</span> no Lumyn
                </h2>
                
                <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm max-w-xs sm:max-w-md mx-auto leading-relaxed font-semibold italic">
                  Evoluir e se organizar não precisa ser um fardo sério e frio. O Wingman se conecta com seus micro-hábitos diários para impulsionar suas conquistas com muito humor!
                </p>
              </div>

              {/* Animated Cinematic bubble text display for speech block */}
              <div className="w-full max-w-xs sm:max-w-md pt-2 sm:pt-5 px-3 shrink-0">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={introStep}
                  className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 relative shadow-2xl bg-slate-900/40"
                >
                  <p className="text-xs sm:text-sm font-black text-yellow-250 leading-relaxed">
                    {bubbleText || "Olá, eu sou o Wingman! Seu novo parceiro de inteligência e produtividade do Lumyn!"}
                  </p>
                </motion.div>
              </div>

              <div className="pt-2 sm:pt-4 flex items-center justify-center gap-4 shrink-0">
                <button 
                  onClick={runIntroStep}
                  className="px-5 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-[#111827] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] rounded-xl sm:rounded-2xl hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer shadow-lg shadow-yellow-500/10"
                >
                  {introStep >= 3 ? "Acessar Lumyn!" : "Seguinte"} <ChevronRight size={14} />
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. PERSISTENT FLOATING CORNER MASCOT ELEMENT (SLIDING DRAWER) */}
      <div className="fixed bottom-6 right-0 z-[999] select-none pointer-events-none flex flex-col items-end">
        <div className="relative flex items-center justify-end">
          
          {/* Balloon Speech Bubble if active */}
          <AnimatePresence>
            {showBubble && bubbleText && !isIntroActive && !isMinimized && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="absolute right-24 bottom-6 bg-slate-900/95 border border-white/10 p-4 rounded-2.5xl max-w-[250px] shadow-2xl pointer-events-auto filter backdrop-blur-md z-[1000] mr-2"
              >
                {/* Bubble text styling */}
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest mb-1 select-none">
                  Wingman diz:
                </span>
                <p className="text-xs text-white leading-relaxed font-semibold">
                  {bubbleText}
                </p>

                {/* Triangle overlay */}
                <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-3 h-3 bg-slate-900 border-r border-t border-white/10 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Pet Management Dashboard sheet */}
          <AnimatePresence>
            {showGame && !isMinimized && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 30 }}
                className="absolute right-24 bottom-6 mb-2 bg-slate-900/98 border border-white/10 rounded-[2rem] p-6 w-[280px] shadow-2xl pointer-events-auto filter backdrop-blur-md space-y-4 z-[998] mr-2"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <Smile size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Painel do Wingman</span>
                  </div>
                  <button 
                    onClick={() => setShowGame(false)}
                    className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Happiness stats bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Humor / Conexão</span>
                    <span className="text-yellow-400">{happiness}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500" 
                      style={{ width: `${happiness}%` }}
                    />
                  </div>
                </div>

                {/* Mini-Actions Buttons */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <button 
                    onClick={requestFocoIncentive}
                    className="p-3 bg-white/[0.03] border border-white/5 hover:border-yellow-500/20 rounded-xl text-slate-300 font-bold hover:text-white transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <AlertCircle size={14} className="text-yellow-400" />
                    <span>Conselho</span>
                  </button>
                  <button 
                    onClick={() => {
                      const phrases = [
                        "Estou respirando no mesmo compasso que você! 🧘",
                        "Adorando esse tema escuro do Lumyn! Elegante! 🖤",
                        "A cada meta concluída, nosso nível em conjunto progride! 🏆",
                      ];
                      triggerWingmanReaction('happy', phrases[Math.floor(Math.random() * phrases.length)], 4000);
                    }}
                    className="p-3 bg-white/[0.03] border border-white/5 hover:border-yellow-500/20 rounded-xl text-slate-300 font-bold hover:text-white transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Smile size={14} className="text-[#CD3B63]" />
                    <span>Sensações</span>
                  </button>
                </div>

                {/* Rock Paper Scissors Game */}
                <div className="space-y-2 border-t border-white/5 pt-3.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Jogar Pedrar-Papel-Tesoura</span>
                  <div className="flex justify-between gap-1">
                    {['✊', '✋', '✌️'].map((item) => (
                      <button
                        key={item}
                        onClick={() => playInteractionChallenge(item)}
                        className="w-1/3 py-2 bg-slate-800 hover:bg-yellow-500 hover:text-slate-900 border border-white/5 focus:outline-none transition-all rounded-xl text-base cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status footer with user tone */}
                <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest text-center border-t border-white/5 pt-3">
                  Tom da IA: <span className="text-yellow-400">{currentTone}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsible Drawer Slider Wrapper */}
          <motion.div
            layout
            className="flex items-center pointer-events-none relative z-[999]"
          >
            <AnimatePresence mode="wait">
              {isMinimized ? (
                /* Sleek vertical side drawer handle attached to the screens edge */
                <motion.div
                  key="drawer-handle"
                  initial={{ x: 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 80, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                  onClick={() => setIsMinimized(false)}
                  className="pointer-events-auto bg-gradient-to-l from-yellow-500/30 to-slate-900 border-l border-y border-yellow-500/40 hover:border-yellow-400 pl-3.5 pr-4 py-3 rounded-l-2xl shadow-[0_10px_30px_rgba(0,0,0,0.7)] group transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  {/* Glowing alert dot */}
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  
                  {/* Mini visual indicator */}
                  <span className="text-xs">👾</span>
                  
                  {/* Sideway/Drawer title text */}
                  <span className="text-[10px] font-extrabold tracking-[0.2em] text-yellow-350 group-hover:text-yellow-300 transition-colors uppercase font-mono">
                    WINGMAN
                  </span>
                  
                  <ChevronRight size={14} className="text-yellow-500/70 group-hover:text-yellow-300 group-hover:translate-x-[-2px] transition-transform rotate-180" />
                </motion.div>
              ) : (
                /* Full open mascot inside drawer frame */
                <motion.div
                  key="drawer-content"
                  initial={{ x: 120, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 120, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 25 }}
                  className="pointer-events-auto mr-6 flex items-center gap-3 relative"
                >
                  <motion.div 
                    ref={mascotRef}
                    drag
                    dragMomentum={false}
                    dragElastic={0.08}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    whileHover={{ scale: 1.06 }}
                    onClick={handleMascotPoke}
                    className={`pointer-events-auto relative w-20 h-20 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center justify-center group select-none ${
                      isMascotDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  >
                    {/* Animated orbiting dizzy cartoon birds */}
                    {expression === 'dizzy' && (
                      <div className="absolute -top-7 left-0 right-0 h-8 pointer-events-none select-none z-[1000] flex justify-center items-center">
                        {/* Bird 1 */}
                        <motion.div
                          animate={{
                            x: [0, 24, 0, -24, 0],
                            y: [-4, -8, -4, 0, -4],
                            scale: [0.8, 1.1, 0.8, 0.6, 0.8],
                            rotate: [0, 15, 0, -15, 0],
                            zIndex: [1000, 1000, 990, 990, 1000]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "linear"
                          }}
                          className="absolute text-sm select-none"
                        >
                          🐤
                        </motion.div>
                        {/* Bird 2 */}
                        <motion.div
                          animate={{
                            x: [0, -24, 0, 24, 0],
                            y: [-4, 0, -4, -8, -4],
                            scale: [0.8, 0.6, 0.8, 1.1, 0.8],
                            rotate: [0, -15, 0, 15, 0],
                            zIndex: [990, 990, 1000, 1000, 990]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "linear",
                            delay: 0.6
                          }}
                          className="absolute text-sm select-none"
                        >
                          🐤
                        </motion.div>
                        {/* Sparkle */}
                        <motion.div
                          animate={{
                            x: [10, -10, -10, 10, 10],
                            y: [-8, -1, -8, -8, -8],
                            scale: [0.7, 1.0, 0.7, 0.7, 0.7],
                            rotate: [-10, 10, -10, -10, -10],
                            zIndex: [995, 995, 995, 995, 995]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "linear",
                            delay: 1.2
                          }}
                          className="absolute text-xs select-none"
                        >
                          ✨
                        </motion.div>
                      </div>
                    )}

                    {/* Micro menu indicators visible on hover */}
                    <div className="absolute inset-0 bg-transparent rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="absolute -top-6 bg-slate-950 border border-white/10 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-[#FFEA6C] shadow-md z-50 whitespace-nowrap">
                        Arraste ou Clique!
                      </div>
                    </div>

                    <div className="absolute top-0 left-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowGame(prev => !prev);
                        }}
                        className="w-5 h-5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-white/10 flex items-center justify-center focus:outline-none shadow-md"
                        title="Configuração do Mascote"
                      >
                        <HelpCircle size={10} />
                      </button>
                    </div>
                    
                    {/* Highly visible closing/minimizing action button */}
                    <div className="absolute -top-1 -right-1 z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMinimized(true);
                          setShowGame(false);
                          setShowBubble(false);
                        }}
                        className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-full border border-slate-950 flex items-center justify-center focus:outline-none shadow-xl transition-all scale-100 hover:scale-110 active:scale-95 duration-200 cursor-pointer pointer-events-auto"
                        title="Recolher Wingman"
                      >
                        <X size={12} className="stroke-[3]" />
                      </button>
                    </div>

                    {/* Living floating motion inside corner */}
                    <motion.div
                      animate={{
                        y: expression === 'sleepy' ? [1, 2, 1] : [-2, 2, -2],
                        scaleX: expression === 'sleepy' ? [1.02, 0.98, 1.02] : [0.99, 1.01, 0.99],
                        scaleY: expression === 'sleepy' ? [0.97, 1.01, 0.97] : [1.01, 0.99, 1.01],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: expression === 'sleepy' ? 4 : 2.5,
                        ease: 'easeInOut',
                      }}
                      className="w-full h-full relative"
                    >
                      <svg viewBox="0 0 50 50" className="w-full h-full">
                        <defs>
                          <linearGradient id="wingBodyGradPersistent" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF275" />
                            <stop offset="50%" stopColor="#FBCC14" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                          <linearGradient id="wingMaskGradPersistent" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#B194FA" />
                            <stop offset="100%" stopColor="#6345D9" />
                          </linearGradient>
                          <linearGradient id="wingArmorGradPersistent" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4A403A" />
                            <stop offset="50%" stopColor="#2E2520" />
                            <stop offset="100%" stopColor="#1C1512" />
                          </linearGradient>
                        </defs>

                        {/* Dark armor backpack plate/shell behind body */}
                        <path d="M 9 20 C 5 24, 5 34, 9 38 L 41 38 C 45 34, 45 24, 41 20 Z" fill="url(#wingArmorGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />

                        {/* Large ears/horns on each side */}
                        <g>
                          {/* Left ear */}
                          <path d="M 12 12 Q 2 4 4 14 Q 9 16 12 12" fill="url(#wingArmorGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                          <path d="M 11 13 Q 1 6 5 15 C 8 16, 10 15, 11 13" fill="url(#wingBodyGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                        </g>
                        <g>
                          {/* Right ear */}
                          <path d="M 38 12 Q 48 4 46 14 Q 41 16 38 12" fill="url(#wingArmorGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                          <path d="M 39 13 Q 49 6 45 15 C 42 16, 40 15, 39 13" fill="url(#wingBodyGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                        </g>

                        {/* Chubby round Gekko companion main body body shape */}
                        <rect x="9" y="10" width="32" height="31" rx="15" fill="url(#wingBodyGradPersistent)" stroke="#1E1B4B" strokeWidth="1.5" />

                        {/* Thigh armored scales on the sides */}
                        <path d="M 9 32 Q 6 35 10 38" stroke="#1E1B4B" strokeWidth="1.2" fill="url(#wingArmorGradPersistent)" />
                        <path d="M 41 32 Q 44 35 40 38" stroke="#1E1B4B" strokeWidth="1.2" fill="url(#wingArmorGradPersistent)" />

                        {/* Dark Crown/Crest armor helmet scales on forehead */}
                        <path d="M 16 12 Q 25 7 34 12 Q 25 18 16 12 Z" fill="url(#wingArmorGradPersistent)" stroke="#1E1B4B" strokeWidth="1.2" />
                        <path d="M 21 11 L 25 15 L 29 11 L 25 9 Z" fill="#5F5148" />

                        {/* Purple facemark mask around eyes */}
                        <path d="M 11 20 C 11 15, 19 16, 25 18 C 31 16, 39 15, 39 20 C 39 25, 31 26, 25 24 C 19 26, 11 25, 11 20 Z" fill="url(#wingMaskGradPersistent)" stroke="#1E1B4B" strokeWidth="1.2" />

                        {/* Facial elements based on current expression status */}
                        {renderEyes()}
                        {renderMouth()}

                        {/* Left wing arm with purple/black highlights */}
                        <g>
                          <path d="M 10 26 C 2 24, 0 32, 8 33 Z" fill="url(#wingBodyGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                          <path d="M 6 27 C 1 27, 1 31, 5 32 Z" fill="#8B5CF6" />
                          <circle cx="2" cy="29" r="1.2" fill="url(#wingArmorGradPersistent)" />
                        </g>

                        {/* Right wing arm with purple/black highlights */}
                        <g>
                          <path d="M 40 26 C 48 24, 50 32, 42 33 Z" fill="url(#wingBodyGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                          <path d="M 44 27 C 49 27, 49 31, 45 32 Z" fill="#8B5CF6" />
                          <circle cx="48" cy="29" r="1.2" fill="url(#wingArmorGradPersistent)" />
                        </g>

                        {/* Feet with blocky armored boot claws */}
                        <path d="M 13 41 L 19 41 L 17 43.5 Z" fill="url(#wingArmorGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                        <path d="M 31 41 L 37 41 L 35 43.5 Z" fill="url(#wingArmorGradPersistent)" stroke="#1E1B4B" strokeWidth="1" />
                      </svg>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </>
  );
}
