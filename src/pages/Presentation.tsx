import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Play, RefreshCw, Terminal, CheckCircle2, ChevronRight, ChevronLeft, 
  Users, Layers, Award, FileText, Code2, Sparkles, Send, Layout, HelpCircle,
  Download, FileSpreadsheet, ShieldAlert, Check, Filter, ListFilter, TrendingUp, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

// Preset queries so the group can click and show how SQL pulls analytics from BigQuery
const BigQueryPresets = [
  {
    id: 'user_efficacy',
    title: 'Análise de Eficácia Mental por Nível',
    sql: `SELECT 
  level, 
  AVG(xp) AS avg_xp_gained, 
  COUNT(DISTINCT user_id) AS total_users,
  ROUND(AVG(streak), 1) AS avg_consecutive_days
FROM \`lumyn_analytics.cognition.user_snapshots\`
GROUP BY level
ORDER BY level DESC;`,
    headers: ['level', 'avg_xp_gained', 'total_users', 'avg_consecutive_days'],
    rows: [
      { level: 'Level 5 (Elite)', avg_xp_gained: 680, total_users: 12, avg_consecutive_days: 7.2 },
      { level: 'Level 4 (Avançado)', avg_xp_gained: 450, total_users: 28, avg_consecutive_days: 5.1 },
      { level: 'Level 3 (Constante)', avg_xp_gained: 310, total_users: 54, avg_consecutive_days: 3.4 },
      { level: 'Level 2 (Iniciante)', avg_xp_gained: 150, total_users: 110, avg_consecutive_days: 1.8 }
    ]
  },
  {
    id: 'habit_picos',
    title: 'Picos Horários de Hábitos Saudáveis',
    sql: `SELECT 
  EXTRACT(HOUR FROM timestamp) AS hour_of_day, 
  habit_name, 
  COUNT(*) AS times_completed,
  AVG(cognitive_energy_level) AS avg_energy
FROM \`lumyn_analytics.cognition.habit_logs\`
WHERE status = 'completed'
GROUP BY hour_of_day, habit_name
HAVING times_completed > 5
ORDER BY times_completed DESC
LIMIT 5;`,
    headers: ['hour_of_day', 'habit_name', 'times_completed', 'avg_energy'],
    rows: [
      { hour_of_day: 8, habit_name: 'Trabalho Profundo', times_completed: 142, avg_energy: '87%' },
      { hour_of_day: 7, habit_name: 'Meditação Mindfulness', times_completed: 98, avg_energy: '90%' },
      { hour_of_day: 14, habit_name: 'Hidratação & Foco', times_completed: 87, avg_energy: '65%' },
      { hour_of_day: 10, habit_name: 'Exercício Mental', times_completed: 54, avg_energy: '80%' },
      { hour_of_day: 19, habit_name: 'Análise Reflexiva', times_completed: 41, avg_energy: '73%' }
    ]
  },
  {
    id: 'etl_status',
    title: 'Resumo de Carga Diária do Pipeline ETL',
    sql: `SELECT 
  DATE(timestamp) AS data_carga,
  action_type, 
  COUNT(*) AS total_records_loaded,
  SUM(xp_accrued) AS total_accumulated_xp,
  ROUND(AVG(response_time_ms), 2) AS avg_latency_ms
FROM \`lumyn_analytics.etl.job_runs\`
GROUP BY data_carga, action_type
ORDER BY data_carga DESC;`,
    headers: ['data_carga', 'action_type', 'total_records_loaded', 'total_accumulated_xp', 'avg_latency_ms'],
    rows: [
      { data_carga: '2026-05-29', action_type: 'UPDATE_PROFILE', total_records_loaded: 342, total_accumulated_xp: 34200, avg_latency_ms: 124.5 },
      { data_carga: '2026-05-29', action_type: 'COMPLETE_QUEST', total_records_loaded: 189, total_accumulated_xp: 18900, avg_latency_ms: 98.2 },
      { data_carga: '2026-05-28', action_type: 'UPDATE_PROFILE', total_records_loaded: 412, total_accumulated_xp: 41200, avg_latency_ms: 110.1 },
      { data_carga: '2026-05-28', action_type: 'COMPLETE_QUEST', total_records_loaded: 231, total_accumulated_xp: 23100, avg_latency_ms: 102.4 }
    ]
  }
];

// High-fidelity real-world academic analytical records
const defaultAcademicRecords = [
  { id: 'rec-1', tipo: 'Tarefa', nome: 'Estruturação do Canvas de Negócio', metrica: 'Alta', status: 'Concluída', priority: 'Alta', extra: 'Canal de Monetização e Segmento de Clientes', data: '2026-05-28', energy: 8 },
  { id: 'rec-2', tipo: 'Tarefa', nome: 'Análise Concorrencial de BI Móvel', metrica: 'Normal', status: 'Concluída', priority: 'Alta', extra: 'Benchmark com 4 aplicações internacionais', data: '2026-05-28', energy: 7 },
  { id: 'rec-3', tipo: 'Tarefa', nome: 'Modelagem Física BigQuery Prototipado', metrica: 'Crítica', status: 'Concluída', priority: 'Crítica', extra: 'Normalização do dataset lumyn_analytics', data: '2026-05-29', energy: 9 },
  { id: 'rec-4', tipo: 'Tarefa', nome: 'Conectar Looker Studio via Sheets', metrica: 'Crítica', status: 'Pendente', priority: 'Alta', extra: 'Alinhamento de tabelas dinâmicas secundárias', data: '2026-05-29', energy: 6 },
  { id: 'rec-5', tipo: 'Tarefa', nome: 'Minimização de Leituras do Firestore', metrica: 'Normal', status: 'Pendente', priority: 'Baixa', extra: 'Criação de índices para consultas eficientes', data: '2026-05-29', energy: 5 },
  { id: 'rec-6', tipo: 'Humor', nome: 'Altamente Focado e Atento', metrica: 'Energia 9/10', status: 'Ativo', priority: 'Normal', extra: 'Foco excelente durante a modelagem das regras de dados', data: '2026-05-28', energy: 9 },
  { id: 'rec-7', tipo: 'Humor', nome: 'Ansioso - Cafeína Excessiva', metrica: 'Energia 7/10', status: 'Ativo', priority: 'Alta', extra: 'Agitação moderada pós-validação técnica no Slack', data: '2026-05-28', energy: 7 },
  { id: 'rec-8', tipo: 'Humor', nome: 'Inspirado e Colaborativo', metrica: 'Energia 9/10', status: 'Ativo', priority: 'Alta', extra: 'Ideias ricas integrando dashboard de telemetria analítica', data: '2026-05-29', energy: 9 },
  { id: 'rec-9', tipo: 'Humor', nome: 'Fadiga Pós-Apresentação', metrica: 'Energia 4/10', status: 'Ativo', priority: 'Média', extra: 'Sintomas de desgaste acumulado por esforço crítico', data: '2026-05-29', energy: 4 },
  { id: 'rec-10', tipo: 'Matéria', nome: 'Engenharia de Métricas de BI', metrica: '95% de Progresso', status: 'Cursando', priority: 'Alta', extra: 'Código: BI-902 | Prof. Dr. Francisco', data: '2026-05-29', energy: 9 },
  { id: 'rec-11', tipo: 'Matéria', nome: 'Arquitetura de Data Lakes', metrica: '100% de Progresso', status: 'Concluída', priority: 'Alta', extra: 'Código: ADL-410 | Prof. Dr. Alan', data: '2026-05-29', energy: 10 },
  { id: 'rec-12', tipo: 'Matéria', nome: 'Design de Interação Estocástica', metrica: '40% de Progresso', status: 'Cursando', priority: 'Normal', extra: 'Código: DIE-332 | Profª Dra. Ada', data: '2026-05-29', energy: 6 }
];

export default function Presentation() {
  const [activeTab, setActiveTab] = useState<'bigquery' | 'docs'>('bigquery');

  // Real-time statistical counters
  const [realtimeRows, setRealtimeRows] = useState(4812);
  const [realtimeBytes, setRealtimeBytes] = useState(124.52);

  // BI interactive states
  const [biRecords, setBiRecords] = useState<any[]>(defaultAcademicRecords);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('TODOS');
  const [activePriorityFilter, setActivePriorityFilter] = useState<string>('TODOS');
  const [isLoadingBI, setIsLoadingBI] = useState(false);

  const loadBIDataFromFirestore = async () => {
    setIsLoadingBI(true);
    try {
      const user = auth.currentUser;
      const loaded: any[] = [];
      if (user) {
        // Load real Firestore records
        // Tasks
        try {
          const tasksRef = collection(db, 'users', user.uid, 'tasks');
          const snap = await getDocs(tasksRef);
          snap.forEach(doc => {
            const d = doc.data();
            loaded.push({
              id: doc.id,
              tipo: 'Tarefa',
              nome: d.title || 'Sem título',
              metrica: d.difficulty || 'Normal',
              status: d.completed ? 'Concluída' : 'Pendente',
              priority: d.priority || 'Normal',
              extra: `Categoria: ${d.category || 'Geral'}`,
              data: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              energy: d.priority === 'Alta' || d.priority === 'Crítica' ? 8 : 6
            });
          });
        } catch (e) {
          console.warn("Erro ao buscar tarefas do Firestore:", e);
        }

        // Mood logs
        try {
          const moodRef = collection(db, 'users', user.uid, 'moodLogs');
          const snap = await getDocs(moodRef);
          snap.forEach(doc => {
            const d = doc.data();
            loaded.push({
              id: doc.id,
              tipo: 'Humor',
              nome: d.mood || 'Estável',
              metrica: `Energia: ${d.energy || 5}/10`,
              status: 'Ativo',
              priority: d.energy && d.energy > 7 ? 'Alta' : 'Normal',
              extra: `Fadiga: ${d.fatigue || 5}/10 | Social: ${d.socialTime || 0}h`,
              data: d.timestamp ? new Date(d.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              energy: d.energy || 5
            });
          });
        } catch (e) {
          console.warn("Erro ao buscar registros de humor do Firestore:", e);
        }

        // Courses
        try {
          const coursesRef = collection(db, 'users', user.uid, 'courses');
          const snap = await getDocs(coursesRef);
          snap.forEach(doc => {
            const d = doc.data();
            loaded.push({
              id: doc.id,
              tipo: 'Matéria',
              nome: d.name || 'Sem nome',
              metrica: `Progresso: ${d.progress || 0}%`,
              status: d.grade ? 'Concluída' : 'Cursando',
              priority: 'Alta',
              extra: `Código: ${d.code || 'S/C'} | Prof: ${d.teacher || 'S/P'}`,
              data: new Date().toISOString().split('T')[0],
              energy: d.progress ? Math.min(10, Math.ceil(d.progress / 10)) : 6
            });
          });
        } catch (e) {
          console.warn("Erro ao buscar matérias do Firestore:", e);
        }
      }

      if (loaded.length > 0) {
        setBiRecords(loaded);
      } else {
        setBiRecords(defaultAcademicRecords);
      }
    } catch (err) {
      console.error("Erro geral de carregamento BI:", err);
    } finally {
      setIsLoadingBI(false);
    }
  };

  // Sync BI data on authentication triggers or page mount
  useEffect(() => {
    loadBIDataFromFirestore();
    const unsubscribe = auth.onAuthStateChanged(() => {
      loadBIDataFromFirestore();
    });
    return () => unsubscribe();
  }, []);

  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const exportToCSV = async () => {
    setIsExportingCSV(true);
    try {
      const dataRows = [];

      // Add Headers showing proper dimensions and metrics expected by BI engines
      dataRows.push([
        'Tipo_Registro',
        'Nome_Identificador',
        'Metrica_Valor',
        'Status_Estado',
        'Prioridade_Relevancia',
        'Detalhes_Extras',
        'Nivel_Energia_Foco',
        'Data_Registro'
      ]);

      // Direct, real-time export from the verified biRecords state (which contains either Firestore data or the robust mock BI dataset)
      biRecords.forEach(rec => {
        dataRows.push([
          rec.tipo || 'Desconhecido',
          rec.nome || 'Sem identificador',
          rec.metrica || 'N/A',
          rec.status || 'Ativo',
          rec.priority || 'Normal',
          rec.extra || '',
          rec.energy !== undefined ? String(rec.energy) : '6',
          rec.data || new Date().toISOString().split('T')[0]
        ]);
      });

      // Convert array of arrays to CSV text with proper semicolon separators and UTF-8 BOM
      // Crucial: No double-escaping here to avoid injecting string literal text into the spreadsheet file.
      const csvContent = "\uFEFF" + dataRows.map(row => 
        row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")
      ).join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `lumyn_analytics_firestore_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (err) {
      console.error("Erro ao exportar CSV:", err);
    } finally {
      setIsExportingCSV(false);
    }
  };

  // BigQuery-related state
  const [sqlQuery, setSqlQuery] = useState(BigQueryPresets[0].sql);
  const [activePreset, setActivePreset] = useState('user_efficacy');
  const [queryResult, setQueryResult] = useState<any>(BigQueryPresets[0]);
  const [isQueryExecuting, setIsQueryExecuting] = useState(false);

  // ETL Simulator live logs state
  const [etlLogs, setEtlLogs] = useState<Array<{ timestamp: string; type: string; message: string }>>([
    { timestamp: '22:15:20', type: 'INFO', message: 'Iniciando módulo de rastreamento do Lumyn...' },
    { timestamp: '22:15:22', type: 'SUCCESS', message: 'Conectado ao Firebase Firestore (users/tasks)' },
    { timestamp: '22:15:24', type: 'INFO', message: 'Aguardando gatilhos de eventos clínicos' }
  ]);
  const [isEtlRunning, setIsEtlRunning] = useState(false);

  // Automatic real-time ticker simulating microtransaction updates every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly increment rows and processed size
      const addedLogs = Math.floor(Math.random() * 3) + 1; // 1-3 rows
      const addedSize = Number((Math.random() * 0.14).toFixed(3));

      setRealtimeRows(prev => prev + addedLogs);
      setRealtimeBytes(prev => Number((prev + addedSize).toFixed(2)));

      const systemMessages = [
        { type: 'SUCCESS', message: `Mapeado Firestore: Novo log USER_GAINED_XP (+${Math.floor(Math.random() * 30) + 10}XP) -> Streamed no BigQuery` },
        { type: 'SUCCESS', message: 'Mapeado Firestore: Alteração acadêmica em TAREFAS -> Coletado e ingerido pelo pipeline' },
        { type: 'PROCESS', message: 'ETL Sinc: Executando rotina de normalização estrutural de logs cognitivos diários...' },
        { type: 'SUCCESS', message: 'Gatilho: LOG_HUMOR gravado por usuário ativo -> Replicado em tables.snap_logs' },
        { type: 'INFO', message: 'Sincronizador OLTP estável. Latência média medida em nuvem: 108ms' }
      ];

      const activeMsg = systemMessages[Math.floor(Math.random() * systemMessages.length)];
      setEtlLogs(prev => {
        const item = {
          timestamp: new Date().toLocaleTimeString(),
          type: activeMsg.type,
          message: activeMsg.message
        };
        // Keep logs historical window compact
        return [...prev.slice(-14), item];
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Run a manual scheduled ETL simulation
  const runEtlSimulation = () => {
    if (isEtlRunning) return;
    setIsEtlRunning(true);
    
    const newLogs = [
      { timestamp: new Date().toLocaleTimeString(), type: 'PROCESS', message: 'Iniciando ingestão em massa (Bulk ETL): Replicando coleções Firestore...' },
      { timestamp: new Date().toLocaleTimeString(), type: 'DATA', message: 'Localizado: 26 registros de progresso e 8 logs agregados de humor clínico.' },
      { timestamp: new Date().toLocaleTimeString(), type: 'TRANSFORM', message: 'Calculando vetores de estresse cognitivo acumulado (Transform)...' },
      { timestamp: new Date().toLocaleTimeString(), type: 'LOAD', message: 'Persistindo em massa no dataset lumyn_analytics.cognition.habit_logs' },
      { timestamp: new Date().toLocaleTimeString(), type: 'SUCCESS', message: 'Replicação agendada com sucesso! +120 linhas carregadas nas partições BigQuery.' }
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < newLogs.length) {
        setEtlLogs(prev => [...prev, newLogs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsEtlRunning(false);
        setRealtimeRows(prev => prev + 120);
        setRealtimeBytes(prev => Number((prev + 3.14).toFixed(2)));
      }
    }, 1000);
  };

  // Run BigQuery simulated query
  const executeBigQuery = () => {
    setIsQueryExecuting(true);
    setTimeout(() => {
      // Find preset matching or generic result
      const match = BigQueryPresets.find(p => p.sql.trim() === sqlQuery.trim() || sqlQuery.includes(p.id));
      if (match) {
        setQueryResult(match);
      } else {
        setQueryResult({
          title: 'Resultado Customizado',
          headers: ['coluna_1', 'coluna_2', 'records_found'],
          rows: [
            { coluna_1: 'Análise Geral', coluna_2: 'Sincronizado', records_found: String(realtimeRows) },
            { coluna_1: 'Métricas Inteligentes', coluna_2: 'Ativo', records_found: '189' }
          ]
        });
      }
      setIsQueryExecuting(false);
    }, 1000);
  };

  const handleApplyPreset = (preset: typeof BigQueryPresets[0]) => {
    setActivePreset(preset.id);
    setSqlQuery(preset.sql);
    setQueryResult(preset);
  };

  const chartData = [
    { name: 'Seg', 'Registros ETL': 150, 'SQLs Executados': 40 },
    { name: 'Ter', 'Registros ETL': 320, 'SQLs Executados': 85 },
    { name: 'Qua', 'Registros ETL': 480, 'SQLs Executados': 120 },
    { name: 'Qui', 'Registros ETL': 390, 'SQLs Executados': 95 },
    { name: 'Sex', 'Registros ETL': 680, 'SQLs Executados': 180 },
    { name: 'Sab', 'Registros ETL': 250, 'SQLs Executados': 60 },
    { name: 'Dom', 'Registros ETL': 190, 'SQLs Executados': 55 },
  ];

  // BI Dynamic Calculations
  const filteredRecords = biRecords.filter(rec => {
    const matchesType = activeTypeFilter === 'TODOS' || rec.tipo.toUpperCase() === activeTypeFilter.toUpperCase();
    const matchesPriority = activePriorityFilter === 'TODOS' || rec.priority.toUpperCase() === activePriorityFilter.toUpperCase();
    return matchesType && matchesPriority;
  });

  // KPI calculations
  const kpiTotalRecords = filteredRecords.length;

  const moodRecords = filteredRecords.filter(r => r.tipo === 'Humor');
  const kpiAvgEnergy = moodRecords.length > 0
    ? (moodRecords.reduce((acc, curr) => acc + (curr.energy || 5), 0) / moodRecords.length).toFixed(1)
    : '8.3';

  const tasksList = filteredRecords.filter(r => r.tipo === 'Tarefa');
  const completedTasksList = tasksList.filter(r => r.status === 'Concluída');
  const kpiTaskCompletionRate = tasksList.length > 0
    ? `${Math.round((completedTasksList.length / tasksList.length) * 100)}%`
    : '60%';

  const activeSubjects = filteredRecords.filter(r => r.tipo === 'Matéria' && r.status === 'Cursando').length;

  // Pie chart calculation
  const typeCounts = filteredRecords.reduce((acc: any, curr) => {
    acc[curr.tipo] = (acc[curr.tipo] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(typeCounts).map(key => ({
    name: key,
    value: typeCounts[key]
  })).filter(item => item.value > 0);

  const PIE_COLORS: Record<string, string> = {
    'Tarefa': '#3B82F6',   // Blue
    'Humor': '#10B981',    // Emerald
    'Matéria': '#8B5CF6'   // Purple
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] bg-[#4F7CFF]/15 border border-[#4F7CFF]/30 text-[#4F7CFF] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest leading-none inline-block mb-3">
            Módulo de Engenharia e BI Real-Time
          </span>
          <h1 className="text-xl sm:text-3xl md:text-4.5xl font-display font-black text-white leading-tight">
            Console de Engenharia <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#4F7CFF] to-[#8B5CF6]">BigQuery & ETL</span>
          </h1>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm font-medium">
            Monitor analítico integrado para validação com: <strong className="text-white">Nicolas, Isaac, Sara e Marcela</strong>.
          </p>
        </div>

        {/* Presenter Tabs Selector */}
        <div className="flex bg-slate-900/50 p-1 border border-white/5 rounded-2xl shrink-0 self-start md:self-center">
          <button 
            onClick={() => setActiveTab('bigquery')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'bigquery' 
                ? 'bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database size={14} /> BigQuery SQL & ETL
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'docs' 
                ? 'bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={14} /> Documentação Técnica
          </button>
        </div>
      </div>

      {/* Real-Time Telemetry Counters Row */}
      {activeTab === 'bigquery' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4.5 animate-in fade-in duration-300">
          <div className="px-5 py-4 bg-slate-900/40 border border-white/5 rounded-2.5xl space-y-1 relative overflow-hidden backdrop-blur-sm">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Registros Ingeridos (Hoje)</span>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="font-mono text-xl sm:text-2.5xl font-bold font-black text-emerald-400 select-all">{realtimeRows}</span>
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
            </div>
          </div>
          
          <div className="px-5 py-4 bg-slate-900/40 border border-white/5 rounded-2.5xl space-y-1 relative overflow-hidden backdrop-blur-sm">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Volume Total do Dataset</span>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="font-mono text-xl sm:text-2.5xl font-bold font-black text-cyan-400 select-all">{realtimeBytes} MB</span>
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-900/40 border border-white/5 rounded-2.5xl space-y-1 relative overflow-hidden backdrop-blur-sm">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Status do Pipeline</span>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-wider font-sans">ATIVO & ONLINE</span>
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-900/40 border border-white/5 rounded-2.5xl space-y-1 relative overflow-hidden backdrop-blur-sm">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Sincronizador OLAP</span>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-xs sm:text-sm font-black text-[#8B5CF6] font-bold uppercase tracking-wide">FIRESTORE SINC</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab content switch */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: ELIMINATED PRESENTATION SLIDES - TAB 2 IS NOW DIRECT CONTEXT */}
        {activeTab === 'bigquery' && (
          <motion.div 
            key="bigquery"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Live pipeline simulator and SQL prompt block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Simulated ETL Engine */}
              <div className="lg:col-span-5 bento-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4.5 mb-5">
                    <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Terminal size={14} className="text-[#4F7CFF]" /> Pipeline ETL de logs (Firestore ➡️ BigQuery)
                    </span>
                    
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>

                  <p className="text-slate-450 text-[11px] font-semibold leading-relaxed mb-6">
                    Módulos transacionais rápidos gravam no **Firebase Firestore** do app. No entanto, para fins analíticos refinados de BI, o simulador de Pipeline **ETL** coleta os dados transacionais de tarefas, níveis e diários de hábitos brutos e os converte em linhas limpas de registros dentro do data warehouse analítico do **Google BigQuery**.
                  </p>

                  {/* Terminal Log Console */}
                  <div className="bg-black/90 p-4 rounded-2xl border border-white/5 font-mono h-48 overflow-y-auto space-y-2 no-scrollbar text-[10px] md:text-xs">
                    {etlLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-1.5 leading-normal">
                        <span className="text-slate-600">[{log.timestamp}]</span>
                        <span className={`font-black ${
                          log.type === 'SUCCESS' ? 'text-emerald-400' : 
                          log.type === 'TRANSFORM' ? 'text-purple-400' :
                          log.type === 'LOAD' ? 'text-[#4F7CFF]' : 'text-amber-400'
                        }`}>{log.type}</span>
                        <span className="text-slate-350">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-3">
                   <span className="text-[10px] font-mono text-slate-500">ETL Engine v1.0.0</span>
                   
                   <button 
                     onClick={runEtlSimulation}
                     disabled={isEtlRunning}
                     className="px-5 py-3 bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] disabled:from-slate-800 disabled:to-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-95 active:scale-97 transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:cursor-not-allowed"
                   >
                     {isEtlRunning ? (
                       <>
                         <RefreshCw className="animate-spin" size={12} /> Transformando...
                       </>
                     ) : (
                       <>
                         <Play size={12} fill="currentColor" /> Executar Carga ETL
                       </>
                     )}
                   </button>
                </div>
              </div>

              {/* Right Column: Interactive BigQuery SQL Terminal */}
              <div className="lg:col-span-7 bento-card space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-4.5 mb-2">
                    <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Database size={14} className="text-yellow-400" /> Console Analítico do Google BigQuery
                    </span>
                    
                    {/* Presets badges */}
                    <div className="flex gap-2.5">
                      {BigQueryPresets.map(preset => (
                        <button 
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                            activePreset === preset.id 
                              ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' 
                              : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          Q{preset.id === 'user_efficacy' ? '1' : preset.id === 'habit_picos' ? '2' : '3'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SQL Input Area */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Query SQL (Padrão ANSI)</span>
                      <span className="text-[9.5px] font-black text-yellow-400 uppercase font-mono">Dataset: lumyn_analytics.cognition</span>
                    </div>
                    
                    <div className="relative font-mono bg-slate-950 p-4 rounded-xl border border-white/5 shadow-inner">
                      <textarea 
                        className="w-full bg-transparent text-slate-300 text-xs md:text-sm font-semibold select-all font-mono border-none focus:outline-none focus:ring-0 resize-none h-28"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* SQL Action */}
                  <div className="flex justify-between items-center mt-3 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">✨ Selecione os presets rápidos mudando os botões de Q1 a Q3</span>
                    
                    <button 
                      onClick={executeBigQuery}
                      disabled={isQueryExecuting}
                      className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      {isQueryExecuting ? 'Processando...' : 'Rodar Query SQL'}
                    </button>
                  </div>
                </div>

                {/* Database result rows rendering */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado da Query: {queryResult.title}</h4>
                    <span className="text-[9px] font-mono text-green-400 font-black">Processamento: 0.04s | 12.4 MB processados</span>
                  </div>

                  {isQueryExecuting ? (
                    <div className="h-28 flex flex-col items-center justify-center text-slate-500 font-medium text-xs">
                      <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mb-3" />
                      Espere: Executando no BigQuery virtual...
                    </div>
                  ) : (
                    <div className="overflow-x-auto select-none rounded-xl border border-white/5 bg-black/40">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="bg-white/[0.04] border-b border-white/10 text-slate-400">
                            {queryResult.headers.map((h: string) => (
                              <th key={h} className="px-4 py-2 font-black uppercase text-[10px] tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                              {queryResult.headers.map((h: string) => (
                                <td key={h} className="px-4 py-2.5 font-semibold text-slate-300">{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Simulated BI Telemetry Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 bento-card">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                     <Layers className="text-[#8B5CF6]" /> Volume do Pipeline Analítico (ETL vs SQL)
                   </h3>
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Atualizado com a banca</span>
                 </div>

                 <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                       <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                       <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} />
                       <Legend wrapperStyle={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }} />
                       <Bar dataKey="Registros ETL" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="SQLs Executados" fill="#4F7CFF" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               <div className="lg:col-span-4 bg-gradient-to-br from-[#111827] via-slate-900 to-slate-950 p-8 rounded-[2.5rem] border border-white/5 text-white flex flex-col justify-between">
                 <div className="space-y-4">
                   <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">Grounding Analítico</span>
                   <h3 className="font-display font-black text-lg leading-tight text-white">Por que o BigQuery é essencial em nossa arquitetura de BI?</h3>
                   <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                     Geralmente as bancas avaliadoras de tecnologia valorizam a divisão de **OLTP (On-line Transactional Processing)** e **OLAP (On-line Analytical Processing)**. 
                   </p>
                   <ul className="text-[11px] text-slate-450 space-y-1.5 list-disc list-inside font-medium border-l border-white/10 pl-3">
                     <li><strong>Firestore</strong>: Usado para operações transacionais instantâneas por sua atomicidade e latência ínfima.</li>
                     <li><strong>BigQuery</strong>: Armazena terabytes de logs convertidos pelo ETL para rodar algoritmos pesados de ML e BI sem sobrecarregar o app ativo.</li>
                   </ul>
                 </div>
                 <span className="text-[10px] text-slate-500 font-bold block pt-4 text-right">Lumyn Analytics Architecture 💡</span>
               </div>
            </div>

          </motion.div>
        )}

        {/* TAB 3: COMPLETE REUSABLE APP DOCUMENTATION */}
        {activeTab === 'docs' && (
          <motion.div 
            key="docs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bento-card p-6 md:p-10 space-y-8 select-all"
          >
            <div className="border-b border-white/5 pb-4.5">
              <h2 className="text-xl md:text-2.5xl font-display font-black text-white">Documentação do Lumyn</h2>
              <p className="text-slate-400 text-xs md:text-sm">Trilha detalhada de especificações, diagramas de dados e arquitetura de software.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm">
              <div className="space-y-5">
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#4F7CFF] rounded-full" /> 🛡️ 1. Governança e Regras do Firestore
                  </h4>
                  <p className="text-slate-450 leading-relaxed font-medium">
                    O Firestore está resguardado sob regras declarativas estritas de isolamento definidas de forma que cada usuário possua acesso unicamente à sua própria subcoleção, o que cumpre as normativas de LGPD.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#4F7CFF] rounded-full" /> 📦 2. Modelo Relacional e Tabelas
                  </h4>
                  <p className="text-slate-450 leading-relaxed font-medium">
                    Cada entidade do Firestore possui um mapeamento de types dedicados em nosso codebase. O pipeline de ETL simula a extração de <code className="bg-slate-900 border border-white/5 px-1 py-0.5 rounded text-[11px] text-pink-400">tasks</code>, <code className="bg-slate-900 border border-white/5 px-1 py-0.5 rounded text-[11px] text-pink-400">logs_mental</code>, e <code className="bg-slate-900 border border-white/5 px-1 py-0.5 rounded text-[11px] text-pink-400">xp_snapshots</code>.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full" /> 🤖 3. Inteligência Artificial do Assistente
                  </h4>
                  <p className="text-slate-450 leading-relaxed font-medium">
                    As simulações de IA do Lumyn consultam o backend com requisições proxy estruturadas para o SDK <code className="text-[#8B5CF6]">@google/genai</code>, alimentando dinamicamente o robô de foco estratégico e a análise preditiva.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full" /> 📊 4. Visualização de Telemetria
                  </h4>
                  <p className="text-slate-450 leading-relaxed font-medium">
                    Com charts inteligentes fornecidos pelo Recharts, nós transformamos os dados analíticos de banco em visuais interativos que mostram oscilações comportamentais diárias do cliente de forma intuitiva.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 font-mono text-[11px] text-slate-400 mt-4 leading-relaxed space-y-2">
              <span className="text-[#4F7CFF] font-black font-semibold">// Exemplo conceitual do script Node.js do Pipeline de Streaming ETL</span>
              <div>
                <span className="text-pink-400">const</span> <span className="text-cyan-400">streamToBigQuery</span> = <span className="text-pink-400">async</span> (<span className="text-yellow-300">row</span>) =&gt; &#123;
              </div>
              <div className="pl-6">
                <span className="text-pink-400">const</span> BigQuery = <span className="text-cyan-400">require</span>(<span className="text-orange-300">'@google-cloud/bigquery'</span>);
              </div>
              <div className="pl-6">
                <span className="text-pink-400">const</span> bq = <span className="text-pink-400">new</span> <span className="text-yellow-400">BigQuery</span>();
              </div>
              <div className="pl-6">
                <span className="text-pink-400">await</span> bq.<span className="text-yellow-400">dataset</span>(<span className="text-orange-300">'lumyn_analytics'</span>).<span className="text-yellow-400">table</span>(<span className="text-orange-300">'usage_logs'</span>).<span className="text-yellow-400">insert</span>([row]);
              </div>
              <div className="pl-6">
                console.<span className="text-yellow-400">log</span>(<span className="text-orange-300">'[ETL] Row successfully streamed to Google BigQuery'</span>);
              </div>
              <div>&#125;</div>
            </div>

            {/* PAINEL INTERATIVO DE BI - PROTÓTIPO LOOKER STUDIO DIRECT LINK */}
            <div className="bg-slate-900/95 p-6 sm:p-10 rounded-[2.5rem] border border-cyan-500/30 space-y-8 mt-8 shadow-2xl shadow-cyan-500/5">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Looker Studio Live Playground
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 100% Sincronizado com o Banco (OLAP)
                    </span>
                  </div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white">Painel de BI Interativo: Comportamento & Produtividade</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl font-medium">
                    Simulação em tempo real de altíssima fidelidade de um painel integrado no <strong className="text-white">Looker Studio</strong>. O professor e a banca podem filtrar dados, analisar os principais indicadores de desempenho (KPIs) recalibrados dinamicamente e verificar a volumetria através do gráfico de pizza.
                  </p>
                </div>

                {/* CSV Download Button */}
                <button
                  onClick={exportToCSV}
                  disabled={isExportingCSV}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 shrink-0 self-start sm:self-center"
                >
                  {isExportingCSV ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processando...
                    </>
                  ) : exportComplete ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Planilha de BI Baixada!
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Exportar Planilha (.CSV)
                    </>
                  )}
                </button>
              </div>

              {/* FILTERS PANEL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-white/5">
                
                {/* FILTER 1: TIPO DE REGISTRO */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 font-mono">
                    <Filter className="w-3 h-3 text-cyan-400" /> Filtro de Dimensão: Categoria de Registro
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['TODOS', 'TAREFA', 'HUMOR', 'MATÉRIA'].map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                          activeTypeFilter === type 
                            ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-400' 
                            : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                        }`}
                      >
                        {type === 'TODOS' ? 'Todos os Registros' : type + 's'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FILTER 2: PRIORIDADE */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 font-mono">
                    <ListFilter className="w-3 h-3 text-cyan-400" /> Filtro de Métrica: Escopo de Prioridade / Relevância
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['TODOS', 'CRÍTICA', 'ALTA', 'MÉDIA', 'BAIXA', 'NORMAL'].map(priority => (
                      <button
                        key={priority}
                        onClick={() => setActivePriorityFilter(priority)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                          activePriorityFilter === priority 
                            ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-400' 
                            : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                        }`}
                      >
                        {priority === 'TODOS' ? 'Todas Prioridades' : priority}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* KPI INDICATORS SECTION */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Indicator 1 */}
                <div className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Volumetria Ativa</span>
                  <div className="pt-2">
                    <span className="font-mono text-2.5xl sm:text-3xl font-black text-cyan-400">{kpiTotalRecords}</span>
                    <span className="text-[10px] text-slate-400 block font-semibold">Linhas no Dataset</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full absolute top-4 right-4" />
                </div>

                {/* Indicator 2 */}
                <div className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Eficácia Cognitiva Geral</span>
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="font-mono text-2.5xl sm:text-3xl font-black text-emerald-400">{kpiAvgEnergy}</span>
                    <span className="text-xs text-emerald-500 font-bold">/10</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Foco Clínico Médio</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute top-4 right-4 animate-pulse" />
                </div>

                {/* Indicator 3 */}
                <div className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Eficácia de Entrega (Tasks)</span>
                  <div className="pt-2">
                    <span className="font-mono text-2.5xl sm:text-3xl font-black text-blue-400">{kpiTaskCompletionRate}</span>
                    <span className="text-[10px] text-slate-400 block font-semibold">Proporção Concluída</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full absolute top-4 right-4" />
                </div>

                {/* Indicator 4 */}
                <div className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Disciplinas Acadêmicas</span>
                  <div className="pt-2">
                    <span className="font-mono text-2.5xl sm:text-3xl font-black text-purple-400">{activeSubjects}</span>
                    <span className="text-[10px] text-slate-400 block font-semibold">Matérias Cursando</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full absolute top-4 right-4" />
                </div>

              </div>

              {/* PIE CHART AND FILTERED GRID SIDE-BY-SIDE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* PIE CHART AREA */}
                <div className="lg:col-span-5 bg-slate-950/40 p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px]">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans mb-1">
                      Gráfico de Setor (Com composição de Registros de BI)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold font-sans">Distribuição da volumetria no dataset selecionado</p>
                  </div>

                  {pieData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <p>Nenhum registro corresponde aos filtros.</p>
                    </div>
                  ) : (
                    <div className="h-44 w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#64748B'} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Floating Indicator in center */}
                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-mono font-black text-white">{kpiTotalRecords}</span>
                        <span className="text-[8px] uppercase tracking-widest text-slate-500 font-extrabold">Total</span>
                      </div>
                    </div>
                  )}

                  {/* Legends */}
                  <div className="flex justify-center flex-wrap gap-4 pt-2 border-t border-white/5 text-[10px] font-black uppercase tracking-wider">
                    {pieData.map(item => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: PIE_COLORS[item.name] }} />
                        <span className="text-slate-400 font-semibold">{item.name}s</span>
                        <span className="text-white font-mono bg-white/[0.05] px-1.5 py-0.5 rounded text-[9px]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DETAILED DRILL-DOWN DATAGRID */}
                <div className="lg:col-span-7 bg-slate-950/40 p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px]">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans mb-1">
                      Visualização Analítica Detalhada (Drill-Down)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold font-sans font-medium">Lista de linhas sincronizadas em tempo real</p>
                  </div>

                  <div className="overflow-y-auto max-h-[180px] rounded-xl border border-white/5 bg-black/30 mt-4 no-scrollbar">
                    {filteredRecords.length === 0 ? (
                      <div className="p-8 text-center text-slate-550 text-xs">
                        Nenhum registro para exibir sob as condições aplicadas.
                      </div>
                    ) : (
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead>
                          <tr className="bg-white/[0.04] text-slate-400 uppercase text-[9px] tracking-wider border-b border-white/10">
                            <th className="px-3 py-2 font-black">Tipo</th>
                            <th className="px-3 py-2 font-black">Nome_Identificador</th>
                            <th className="px-3 py-2 font-black">Metrica_Valor</th>
                            <th className="px-3 py-2 font-black">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] text-slate-300">
                              <td className="px-3 py-2">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase" style={{
                                  backgroundColor: (PIE_COLORS[item.tipo] || '#64748B') + '15',
                                  color: PIE_COLORS[item.tipo] || '#64748B',
                                  border: `1px solid ${(PIE_COLORS[item.tipo] || '#64748B')}25`
                                }}>
                                  {item.tipo}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-semibold text-white max-w-[160px] truncate" title={item.nome}>
                                {item.nome}
                              </td>
                              <td className="px-3 py-2 text-slate-400 font-semibold">{item.metrica}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  item.status === 'Concluída' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                                  item.status === 'Pendente' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/24'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 text-[9.5px] text-slate-400 font-semibold flex justify-between items-center">
                    <span>Dataset: {filteredRecords.length} de {biRecords.length} linhas</span>
                    <span className="flex items-center gap-1 text-cyan-400"><Info className="w-3.5 h-3.5 shrink-0" /> Explore livremente clicando nos seletores de dimensão superiores!</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

function PresenterBadge({ name, role, task, color }: { name: string; role: string; task: string; color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5 hover:border-white/10 transition-colors">
      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${color} uppercase font-black text-xs flex items-center justify-center shrink-0`}>
         {name[0]}
      </div>
      <div className="space-y-1">
         <span className="text-xs font-black text-white">{name} <span className="text-[10px] text-slate-500 font-medium font-sans">({role})</span></span>
         <p className="text-[10px] text-slate-400 leading-normal font-semibold">Tópicos: <span className="text-[#4F7CFF] font-black">{task}</span></p>
      </div>
    </div>
  );
}
