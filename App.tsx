
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from './services/storageService';
import {
  apiLogin, apiRegister, apiMe, apiModules, apiGetClients, apiSaveClient, apiDeleteClient,
  apiGetShoots, apiSaveShoot, apiDeleteShoot, apiHermesChat,
  adminListTenants, adminUpdateTenant, adminToggleModule,
  adminGetHermesUsage, adminSetHermesPlan, adminResetHermesUsage,
  setToken, clearToken, isLoggedIn,
} from './services/api';
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
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authStudio, setAuthStudio] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [modules, setModules] = useState<Record<string,boolean>>({});
  const [suspended, setSuspended] = useState(false);
  const [showHermes, setShowHermes] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [hermesMessages, setHermesMessages] = useState<{role:string;content:string}[]>([]);
  const [hermesInput, setHermesInput] = useState('');
  const [hermesLoading, setHermesLoading] = useState(false);
  const [hermesUsage, setHermesUsage] = useState<any>(null);
  const [adminTenants, setAdminTenants] = useState<any[]>([]);
  const [adminHermesUsage, setAdminHermesUsage] = useState<Record<number,any>>({});
  const [adminSaving, setAdminSaving] = useState<string|null>(null);

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
        // Load from API if logged in, fallback to local
        if (isLoggedIn()) {
          try {
            const [userMe, userMods] = await Promise.all([
              apiMe().catch((e:any) => { if(e?.status===402){setSuspended(true);}  return null; }),
              apiModules().catch(() => null),
            ]);
            if (userMe) { setMe(userMe); }
            if (userMods) { setModules(userMods); }
            const [apiClients, apiShoots] = await Promise.all([
              apiGetClients().catch(() => null),
              apiGetShoots().catch(() => null),
            ]);
            if (apiClients) { setClients(apiClients); setIsLoading(false); return; }
            if (apiShoots) { setShoots(apiShoots); }
          } catch {}
        } else {
          setShowAuth(true); setIsLoading(false); return;
        }
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
                    new Notification('Lembrete ð¸', {
                        body: `O evento "${shoot.title}" comeÃ§a em ${shoot.reminderMinutes} minutos!`,
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
    if (isLoggedIn()) { await apiSaveClient(client).catch(()=>null); }
    else { await storageService.saveClient(client); }
    setClients(isLoggedIn() ? await apiGetClients().catch(()=>storageService.getClients()) : await storageService.getClients()); 
    showToast('Cliente cadastrado com sucesso!');
  };

  const handleSaveShoot = async (shoot: Shoot) => {
    try {
        if (isLoggedIn()) { await apiSaveShoot(shoot).catch(()=>null); }
        else { await storageService.saveShoot(shoot); }
        setShoots(isLoggedIn() ? await apiGetShoots().catch(()=>storageService.getShoots()) : await storageService.getShoots()); 
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

  const handleLogin = async () => {
    setAuthLoading(true); setAuthError('');
    try {
      const res = await apiLogin(authEmail, authPass);
      setToken(res.access_token);
      setShowAuth(false); setIsLoading(true);
      const [userMe, mods] = await Promise.all([apiMe(), apiModules().catch(()=>null)]);
      setMe(userMe); if(mods) setModules(mods);
      const [cls, shs] = await Promise.all([apiGetClients(), apiGetShoots()]);
      setClients(cls); setShoots(shs); setIsLoading(false);
    } catch(e:any) {
      const message = e?.message || 'Erro';
      setAuthError(
        message.includes('Falha de conexÃ£o com a API')
          ? 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique o backend e a URL pÃºblica da API.'
          : message
      );
    }
    finally { setAuthLoading(false); }
  };

  const handleRegister = async () => {
    setAuthLoading(true); setAuthError('');
    try {
      const res = await apiRegister({ name:authName, email:authEmail, password:authPass, studio_name:authStudio });
      setToken(res.access_token);
      setShowAuth(false); setIsLoading(true);
      const [userMe, mods] = await Promise.all([apiMe(), apiModules().catch(()=>null)]);
      setMe(userMe); if(mods) setModules(mods);
      setClients([]); setShoots([]); setIsLoading(false);
    } catch(e:any) {
      const message = e?.message || 'Erro';
      setAuthError(
        message.includes('Falha de conexÃ£o com a API')
          ? 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique o backend e a URL pÃºblica da API.'
          : message
      );
    }
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => { clearToken(); setMe(null); setClients([]); setShoots([]); setShowAuth(true); };

  const sendHermesMsg = async () => {
    const text = hermesInput.trim(); if(!text || hermesLoading) return;
    const msg = {role:'user',content:text};
    setHermesMessages(prev=>[...prev,msg]); setHermesInput(''); setHermesLoading(true);
    try {
      const res = await apiHermesChat(text, [...hermesMessages, msg]);
      setHermesMessages(prev=>[...prev,{role:'assistant',content:res.reply}]);
      setHermesUsage({used:res.messages_used, limit:res.messages_limit, plan:res.plan});
    } catch(e:any) {
      const msg429 = e?.status===429 ? 'ð« Limite de mensagens atingido este mÃªs. Contate o administrador.' : `Erro: ${e.message}`;
      setHermesMessages(prev=>[...prev,{role:'assistant',content:msg429}]);
    } finally { setHermesLoading(false); }
  };

  if (suspended) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8 text-center">
      <div className="text-6xl mb-6">ð</div>
      <h1 className="text-2xl font-black mb-2">Acesso Suspenso</h1>
      <p className="text-slate-400 mb-6 max-w-xs">Sua assinatura estÃ¡ suspensa. Entre em contato com o administrador.</p>
      <a href={`https://wa.me/5541999999999?text=Preciso%20regularizar%20minha%20assinatura.`}
        className="bg-[#25D366] text-white font-bold px-6 py-3 rounded-2xl">ð¬ WhatsApp</a>
      <button onClick={()=>{setSuspended(false);setIsLoading(true);}} className="mt-4 text-slate-500 text-sm underline">Tentar novamente</button>
    </div>
  );

  if (showAuth) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">ð·</div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">FotoAgenda</h1>
          <p className="text-slate-500 text-sm mt-1">{authMode==='login'?'Entre na sua conta':'Crie sua conta grÃ¡tis'}</p>
        </div>
        {authError && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-xl mb-4">{authError}</div>}
        <div className="space-y-3">
          {authMode==='register' && (
            <>
              <input placeholder="Seu nome" value={authName} onChange={e=>setAuthName(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"/>
              <input placeholder="Nome do estÃºdio" value={authStudio} onChange={e=>setAuthStudio(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"/>
            </>
          )}
          <input type="email" placeholder="Email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"/>
          <input type="password" placeholder="Senha" value={authPass} onChange={e=>setAuthPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&(authMode==='login'?handleLogin():handleRegister())}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"/>
          <button onClick={authMode==='login'?handleLogin:handleRegister} disabled={authLoading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
            {authLoading?'Aguarde...':(authMode==='login'?'Entrar':'Criar conta')}
          </button>
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">
          {authMode==='login'?'NÃ£o tem conta? ':'JÃ¡ tem conta? '}
          <button onClick={()=>{setAuthMode(authMode==='login'?'register':'login');setAuthError('');}}
            className="text-rose-500 font-semibold">{authMode==='login'?'Cadastre-se':'Entrar'}</button>
        </p>
      </div>
    </div>
  );

  if (showHermes) return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button onClick={()=>setShowHermes(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="w-9 h-9 bg-rose-500/10 rounded-xl flex items-center justify-center">ð¤</div>
        <div><p className="font-bold text-sm text-slate-800 dark:text-white">Assistente IA</p>
          {hermesUsage && <p className="text-xs text-slate-400">{hermesUsage.used}/{hermesUsage.limit} msgs â¢ {hermesUsage.plan}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
        {hermesMessages.length===0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pt-10 px-4">
            <div className="text-5xl mb-4">ð¤</div>
            <p className="font-bold text-lg text-slate-700 dark:text-slate-200">OlÃ¡! Sou seu assistente</p>
            <p className="text-sm text-slate-400 mb-6">Posso ajudar com sessÃµes, clientes, agenda e dÃºvidas.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['ð PrÃ³ximas sessÃµes','ð° Pagamentos','ð Tarefas do dia','â Tirar dÃºvida'].map(c=>(
                <button key={c} onClick={()=>setHermesInput(c.slice(3))}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
        {hermesMessages.map((m,i)=>(
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role==='user'?'bg-rose-500 text-white rounded-br-none':'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {hermesLoading && <div className="flex justify-start"><div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3"><div className="flex gap-1">{[0,150,300].map(d=><span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div></div></div>}
      </div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <input className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 dark:text-white"
          placeholder="Digite sua mensagem..." value={hermesInput} onChange={e=>setHermesInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&sendHermesMsg()} disabled={hermesLoading}/>
        <button onClick={sendHermesMsg} disabled={hermesLoading||!hermesInput.trim()}
          className="bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 transition-all">â</button>
      </div>
    </div>
  );

  if (showAdmin) return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-slate-800 border-b border-white/10 px-4 py-3.5 flex items-center gap-3 shadow-lg">
        <button onClick={()=>setShowAdmin(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-base">🛡️</div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wide">Admin Master</h1>
          <p className="text-xs text-slate-400">Módulos por cliente</p>
        </div>
      </div>
      <div className="px-4 pt-4 pb-8 space-y-4">
        {adminTenants.filter(t=>t.id!==0).map(tenant=>(
          <div key={tenant.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-white/8 shadow-xl">
            <div className="px-4 py-3 bg-slate-700/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-white">{tenant.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tenant.slug}</p>
              </div>
              <button onClick={async()=>{
                setAdminSaving(`active-${tenant.id}`);
                await adminUpdateTenant(tenant.id,{active:!tenant.active});
                const fresh=await adminListTenants(); setAdminTenants(fresh);
                setAdminSaving(null);
              }} disabled={!!adminSaving} className="flex items-center gap-2.5 focus:outline-none disabled:opacity-50">
                <div className={`w-12 h-6 rounded-full relative transition-all duration-200 ${tenant.active?'bg-green-500':'bg-slate-600'}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${tenant.active?'translate-x-6':'translate-x-0.5'}`}/>
                </div>
                <span className={`text-xs font-semibold min-w-[52px] ${tenant.active?'text-green-400':'text-slate-500'}`}>
                  {adminSaving===`active-${tenant.id}`?'...' : tenant.active?'ativo':'bloqueado'}
                </span>
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {['hermes','financeiro','relatorios','calendario'].map(mod=>{
                const enabled=tenant.modules?.[mod]??false;
                const label = mod==='hermes'?'Hermes IA':mod==='financeiro'?'Financeiro':mod==='relatorios'?'Relatórios':'Calendário';
                return (
                  <div key={mod} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-slate-200 font-medium">{label}</span>
                    <button onClick={async()=>{
                      setAdminSaving(`${tenant.id}-${mod}`);
                      await adminToggleModule(tenant.id,mod,!enabled);
                      const fresh=await adminListTenants(); setAdminTenants(fresh);
                      setAdminSaving(null);
                    }} disabled={!!adminSaving} className="focus:outline-none disabled:opacity-50">
                      {adminSaving===`${tenant.id}-${mod}`
                        ?<span className="text-xs text-slate-500 w-12 block text-center">...</span>
                        :<div className={`w-12 h-6 rounded-full relative transition-all duration-200 ${enabled?'bg-rose-500':'bg-slate-600'}`}>
                           <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${enabled?'translate-x-6':'translate-x-0.5'}`}/>
                         </div>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
            {adminHermesUsage[tenant.id] && (
              <div className="px-4 py-4 border-t border-white/8 bg-slate-900/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">HERMES — CONSUMO</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${adminHermesUsage[tenant.id].percent>=90?'bg-red-500/20 text-red-400':adminHermesUsage[tenant.id].percent>=70?'bg-amber-500/20 text-amber-400':'bg-rose-500/20 text-rose-400'}`}>
                    {adminHermesUsage[tenant.id].percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">{adminHermesUsage[tenant.id].messages_used} / {adminHermesUsage[tenant.id].messages_limit} msgs</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full transition-all ${adminHermesUsage[tenant.id].percent>=90?'bg-red-500':adminHermesUsage[tenant.id].percent>=70?'bg-amber-500':'bg-rose-500'}`}
                    style={{width:`${adminHermesUsage[tenant.id].percent}%`}}/>
                </div>
                <div className="flex gap-2">
                  <select value={adminHermesUsage[tenant.id].plan}
                    onChange={async e=>{const u=await adminSetHermesPlan(tenant.id,e.target.value);setAdminHermesUsage(prev=>({...prev,[tenant.id]:u}));}}
                    className="flex-1 text-xs rounded-xl border border-white/10 bg-slate-700 text-slate-200 px-3 py-2 focus:outline-none focus:border-rose-500/50">
                    <option value="teste">🧪 Teste — 100</option>
                    <option value="basico">🦋 Básico — 1.000</option>
                    <option value="pro">🚀 Pro — 5.000</option>
                    <option value="ilimitado">♾️ Ilimitado</option>
                  </select>
                  <button onClick={async()=>{const u=await adminResetHermesUsage(tenant.id);setAdminHermesUsage(prev=>({...prev,[tenant.id]:u}));}}
                    className="text-xs bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-red-400 border border-white/10 px-3 py-2 rounded-xl transition-colors">🔄 Zerar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );  if (showLanding) {
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
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">OlÃ¡, FotÃ³grafo</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Resumo da sua agenda inteligente.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleDarkMode} className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            {modules?.hermes && (
                              <button onClick={()=>setShowHermes(true)} title="Assistente IA"
                                className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 border border-rose-200 dark:border-rose-800">
                                ð¤
                              </button>
                            )}
                            {me?.role==='super_admin' && (
                              <button onClick={async()=>{
                                  const ts=await adminListTenants(); setAdminTenants(ts);
                                  ts.forEach(async(t:any)=>{
                                    if(t.id!==0){const u=await adminGetHermesUsage(t.id).catch(()=>null); if(u) setAdminHermesUsage(prev=>({...prev,[t.id]:u}));}
                                  });
                                  setShowAdmin(true);
                                }} title="Admin Master"
                                className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 border border-indigo-200 dark:border-indigo-800">
                                ð¡ï¸
                              </button>
                            )}
                            <button onClick={handleLogout} className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-red-500 dark:text-red-400 border border-slate-300 dark:border-slate-700">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard title="Faturamento (MÃªs)" value={`R$ ${currentMonthRevenue}`} icon={<TrendingUp size={16} />} subtext="Receita projetada" />
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
                                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">PrÃ³ximos Compromissos</h2>
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
                         <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">HistÃ³rico de Faturamento</h3>
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
                              MÃªs
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
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">HistÃ³rico</h1>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" placeholder="Buscar no histÃ³rico..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

        <BottomNav currentView={view} onChangeView={setView} onAddClick={openNewShootModal} hasHermes={!!modules?.hermes} isAdmin={me?.role==='super_admin'||me?.role==='admin'} onHermesClick={()=>setShowHermes(true)} onAdminClick={async()=>{const ts=await adminListTenants();setAdminTenants(ts);ts.forEach(async(t:any)=>{if(t.id!==0){const u=await adminGetHermesUsage(t.id).catch(()=>null);if(u)setAdminHermesUsage(prev=>({...prev,[t.id]:u}));}});setShowAdmin(true);}} />

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
