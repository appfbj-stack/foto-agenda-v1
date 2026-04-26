
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from './services/storageService';
import { Client, Shoot, ViewState, ShootStatus, PaymentStatus } from './types';
import { BottomNav } from './components/BottomNav';
import { StatCard } from './components/StatCard';
import { ShootCard } from './components/ShootCard';
import { ClientModal } from './components/ClientModal';
import { ShootModal } from './components/ShootModal';
import { PregnancyCalculatorModal } from './components/PregnancyCalculatorModal';
import { CalendarMonthView } from './components/CalendarMonthView';
import { Toast } from './components/Toast';
import { LandingPage } from './components/LandingPage';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { 
  Calendar as CalendarIcon, 
  Users, 
  DollarSign, 
  TrendingUp,
  Search,
  Phone,
  Moon,
  Sun,
  ArrowRight,
  LogOut,
  Plus,
  Loader2,
  Calculator
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [showLanding, setShowLanding] = useState(() => {
    const hasVisited = localStorage.getItem('fotoagenda_intro_seen');
    return !hasVisited;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isShootModalOpen, setIsShootModalOpen] = useState(false);
  const [isPregnancyCalculatorOpen, setIsPregnancyCalculatorOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'list' | 'month'>('list');
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fotoagenda_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('fotoagenda_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('fotoagenda_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Data Loading & Migration
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        await storageService.migrateFromLocalStorage();
        const loadedClients = await storageService.getClients();
        const loadedShoots = await storageService.getShoots();
        setClients(loadedClients);
        setShoots(loadedShoots);
      } catch (error) {
        console.error("Failed to load IndexedDB:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Reminder Logic
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkReminders();
    }, 60000);
    checkReminders();
    return () => clearInterval(intervalId);
  }, [shoots]); 

  const checkReminders = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    let updatesNeeded = false;
    const updatedShoots = [...shoots];

    for (let i = 0; i < shoots.length; i++) {
        const shoot = shoots[i];
        if (
            shoot.status === ShootStatus.SCHEDULED && 
            shoot.reminderMinutes && 
            shoot.reminderMinutes > 0 && 
            !shoot.reminderSent
        ) {
            const shootDate = new Date(`${shoot.date}T${shoot.time}`);
            const reminderTime = new Date(shootDate.getTime() - shoot.reminderMinutes * 60000);

            if (now >= reminderTime && now <= shootDate) {
                try {
                    new Notification('Lembrete 📸', {
                        body: `O evento "${shoot.title}" começa em ${shoot.reminderMinutes} minutos!`,
                        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjMgMTlhMiAyIDAgMCAxLTIgMkgzYTIgMiAwIDAgMS0yLTJWOGEyIDIgMCAwIDEgMi0yaDRsMi0zaDZsMiAzaDRhMiAyIDAgMCAxIDIgMnoiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEzIiByPSI0Ii8+PC9zdmc+'
                    });
                } catch (e) {
                    console.error("Notification failed", e);
                }
                updatedShoots[i] = { ...shoot, reminderSent: true };
                await storageService.saveShoot(updatedShoots[i]);
                updatesNeeded = true;
            }
        }
    }

    if (updatesNeeded) {
        setShoots(updatedShoots);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleAddClient = async (newClient: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = {
      ...newClient,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    await storageService.saveClient(client);
    setClients(await storageService.getClients()); 
    showToast('Cliente cadastrado com sucesso!');
  };

  const handleSaveShoot = async (shoot: Shoot) => {
    try {
        await storageService.saveShoot(shoot);
        setShoots(await storageService.getShoots()); 
        setEditingShoot(null);
        showToast('Compromisso salvo com sucesso!');
    } catch (error) {
        showToast('Erro ao salvar compromisso.', 'error');
        console.error(error);
    }
  };

  const handleEditShoot = (shoot: Shoot) => {
    setEditingShoot(shoot);
    setIsShootModalOpen(true);
  };

  const openNewShootModal = () => {
    setEditingShoot(null);
    setIsShootModalOpen(true);
  };

  const handleEnterApp = () => {
    localStorage.setItem('fotoagenda_intro_seen', 'true');
    setShowLanding(false);
  };

  const handleExit = () => {
    localStorage.removeItem('fotoagenda_intro_seen');
    setShowLanding(true);
  };

  const upcomingShoots = useMemo(() => {
    return shoots
      .filter(s => s.status === ShootStatus.SCHEDULED)
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [shoots]);

  const historyShoots = useMemo(() => {
     return shoots
      .filter(s => s.status !== ShootStatus.SCHEDULED)
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [shoots]);

  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    return shoots.reduce((acc, shoot) => {
      const shootDate = new Date(shoot.date);
      if (
        !shoot.isPersonal && 
        shootDate.getMonth() === now.getMonth() && 
        shootDate.getFullYear() === now.getFullYear() && 
        shoot.status !== ShootStatus.CANCELLED
      ) {
        return acc + shoot.price;
      }
      return acc;
    }, 0);
  }, [shoots]);

  const pendingPayments = useMemo(() => {
      return shoots.reduce((acc, shoot) => {
          if(!shoot.isPersonal && shoot.paymentStatus !== PaymentStatus.PAID && shoot.status !== ShootStatus.CANCELLED) {
              return acc + (shoot.price - shoot.deposit);
          }
          return acc;
      }, 0);
  }, [shoots]);

  const chartData = useMemo(() => {
      const data = [];
      for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthKey = d.toLocaleString('pt-BR', { month: 'short' });
          
          const total = shoots
            .filter(s => {
                const sd = new Date(s.date);
                return !s.isPersonal && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear() && s.status !== ShootStatus.CANCELLED;
            })
            .reduce((acc, curr) => acc + curr.price, 0);
            
          data.push({ name: monthKey, total });
      }
      return data;
  }, [shoots]);

  const groupShootsByMonth = (list: Shoot[]) => {
    const groups: { month: string; items: Shoot[] }[] = [];
    list.forEach(shoot => {
        const d = new Date(shoot.date + 'T00:00:00');
        const monthRaw = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const monthStr = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
        let group = groups.find(g => g.month === monthStr);
        if (!group) {
            group = { month: monthStr, items: [] };
            groups.push(group);
        }
        group.items.push(shoot);
    });
    return groups;
  };

  if (showLanding) {
    return <LandingPage onEnter={handleEnterApp} />;
  }

  if (isLoading) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
            <p className="font-bold text-sm uppercase tracking-widest animate-pulse">Carregando Banco de Dados...</p>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar w-full max-w-md mx-auto">
            {view === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Olá, Fotógrafo</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Resumo da sua agenda inteligente.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleDarkMode} className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button onClick={handleExit} className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-red-500 dark:text-red-400 border border-slate-300 dark:border-slate-700">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard title="Faturamento (Mês)" value={`R$ ${currentMonthRevenue}`} icon={<TrendingUp size={16} />} subtext="Receita projetada" />
                        <StatCard title="A Receber" value={`R$ ${pendingPayments}`} icon={<DollarSign size={16} />} subtext="Saldos pendentes" />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => setIsPregnancyCalculatorOpen(true)} className="flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Calculator size={18} className="text-blue-500" />
                            Calculadora Gestante
                        </button>
                    </div>

                    {upcomingShoots.length > 0 ? (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">Próximos Compromissos</h2>
                                <button onClick={() => setView('calendar')} className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                                    Ver todos <ArrowRight size={12} className="ml-1"/>
                                </button>
                            </div>
                            <div className="space-y-3">
                                {upcomingShoots.slice(0, 5).map(shoot => (
                                    <ShootCard key={shoot.id} shoot={shoot} client={shoot.isPersonal ? undefined : clients.find(c => c.id === shoot.clientId)} onClick={() => handleEditShoot(shoot)} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center border border-slate-100 dark:border-slate-800">
                            <CalendarIcon className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhum compromisso agendado.</p>
                            <button onClick={openNewShootModal} className="mt-3 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wide">+ Agendar Novo</button>
                        </div>
                    )}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                         <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Histórico de Faturamento</h3>
                         <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                                    <Tooltip cursor={{fill: darkMode ? '#1e293b' : '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: darkMode ? '1px solid #1e293b' : 'none', backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f8fafc' : '#0f172a'}} />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            )}
            {view === 'calendar' && (
                <div className="space-y-4 animate-in fade-in duration-300 pb-24">
                   <div className="sticky top-0 bg-slate-50 dark:bg-slate-950 pt-1 pb-4 z-10">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Agenda</h1>
                      
                      <div className="flex gap-2 mb-4 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
                          <button 
                              onClick={() => setCalendarMode('list')} 
                              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${calendarMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                              Lista
                          </button>
                          <button 
                              onClick={() => setCalendarMode('month')} 
                              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${calendarMode === 'month' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                              Mês
                          </button>
                      </div>

                      {calendarMode === 'list' && (
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                              <input type="text" placeholder="Buscar eventos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                      )}
                   </div>
                  
                  {calendarMode === 'list' ? (
                      groupShootsByMonth(upcomingShoots.filter(s => (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 ? (
                           <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                               <CalendarIcon size={48} className="mx-auto mb-3 opacity-20" />
                               <p>Nenhum evento futuro encontrado.</p>
                           </div>
                      ) : (
                          <div className="space-y-6">
                              {groupShootsByMonth(upcomingShoots.filter(s => (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()))).map((group) => (
                                  <div key={group.month}>
                                       <div className="sticky top-32 z-[5] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm py-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                                           <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{group.month}</h3>
                                       </div>
                                       <div className="space-y-0">
                                          {group.items.map(shoot => (
                                              <div key={shoot.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2 pb-4 last:pb-0">
                                                  <div className={`absolute -left-[5px] top-6 w-2.5 h-2.5 rounded-full ring-4 ring-slate-50 dark:ring-slate-950 ${shoot.isPersonal ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase">
                                                      {new Date(shoot.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
                                                  </p>
                                                  <ShootCard shoot={shoot} client={shoot.isPersonal ? undefined : clients.find(c => c.id === shoot.clientId)} onClick={() => handleEditShoot(shoot)} />
                                              </div>
                                          ))}
                                       </div>
                                  </div>
                              ))}
                          </div>
                      )
                  ) : (
                      <CalendarMonthView shoots={shoots} clients={clients} onEditShoot={handleEditShoot} />
                  )}
                </div>
            )}
            {view === 'clients' && (
                <div className="space-y-4 animate-in fade-in duration-300 pb-24">
                  <div className="sticky top-0 bg-slate-50 dark:bg-slate-950 pt-1 pb-4 z-10">
                      <div className="flex justify-between items-center mb-4">
                          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
                          <button onClick={() => setIsClientModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-md shadow-blue-500/20">
                              <Plus size={18} className="mr-2" /> Novo Cliente
                          </button>
                      </div>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" placeholder="Buscar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                  </div>
                  {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                      <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                          <Users size={48} className="mx-auto mb-3 opacity-20" />
                          <p>Nenhum cliente encontrado.</p>
                      </div>
                  ) : (
                      <div className="grid gap-3">
                          {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
                              <div key={client.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                  <div className="flex items-center overflow-hidden">
                                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold mr-3 flex-shrink-0">
                                          {client.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="truncate">
                                          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{client.name}</h4>
                                          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                              <Phone size={10} className="mr-1" />
                                              <span className="mr-3">{client.phone}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-2 text-green-600 dark:text-green-500">
                                      <Phone size={20} />
                                  </a>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
            )}
            {view === 'history' && (
                <div className="space-y-4 animate-in fade-in duration-300 pb-24">
                  <div className="sticky top-0 bg-slate-50 dark:bg-slate-950 pt-1 pb-4 z-10">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Histórico</h1>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" placeholder="Buscar no histórico..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                  </div>
                  {groupShootsByMonth(historyShoots.filter(s => (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 ? (
                       <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                           <History size={48} className="mx-auto mb-3 opacity-20" />
                           <p>Nenhum trabalho realizado ainda.</p>
                       </div>
                  ) : (
                       <div className="space-y-6">
                          {groupShootsByMonth(historyShoots.filter(s => (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()))).map(group => (
                              <div key={group.month}>
                                  <div className="sticky top-16 z-[5] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm py-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{group.month}</h3>
                                   </div>
                                   <div className="space-y-3">
                                      {group.items.map(shoot => (
                                          <ShootCard key={shoot.id} shoot={shoot} client={shoot.isPersonal ? undefined : clients.find(c => c.id === shoot.clientId)} onClick={() => handleEditShoot(shoot)} />
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
            )}
        </main>

        <BottomNav currentView={view} onChangeView={setView} onAddClick={openNewShootModal} />

        <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSave={handleAddClient} />

        <ShootModal 
            isOpen={isShootModalOpen} 
            onClose={() => setIsShootModalOpen(false)} 
            onSave={handleSaveShoot} 
            clients={clients} 
            existingShoot={editingShoot} 
            onAddClient={() => setIsClientModalOpen(true)} 
        />

        <PregnancyCalculatorModal 
            isOpen={isPregnancyCalculatorOpen} 
            onClose={() => setIsPregnancyCalculatorOpen(false)} 
        />

        <PWAInstallBanner />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
  );
}

export default App;
