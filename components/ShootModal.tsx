import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, Bell, Package, Briefcase, User, Stethoscope, Users, Palette, Scissors, AlignLeft, Plus, UserPlus } from 'lucide-react';
import { Shoot, Client, ShootStatus, PaymentStatus } from '../types';

interface ShootModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shoot: Shoot) => void;
  clients: Client[];
  existingShoot?: Shoot | null;
  onAddClient: () => void;
}

export const ShootModal: React.FC<ShootModalProps> = ({ isOpen, onClose, onSave, clients, existingShoot, onAddClient }) => {
  const [isPersonal, setIsPersonal] = useState(false);
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [packageType, setPackageType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // New Fields
  const [makeupArtist, setMakeupArtist] = useState('');
  const [makeupPrice, setMakeupPrice] = useState<number | ''>('');
  const [hairstylist, setHairstylist] = useState('');
  const [hairstylistPrice, setHairstylistPrice] = useState<number | ''>('');

  const [price, setPrice] = useState<number | ''>('');
  const [deposit, setDeposit] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [status, setStatus] = useState<ShootStatus>(ShootStatus.SCHEDULED);
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);

  // Logic to detect new client added and select it
  const [prevClientsLength, setPrevClientsLength] = useState(clients.length);

  useEffect(() => {
    if (clients.length > prevClientsLength) {
      // If a client was added while modal is open, select the last one
      const newClient = clients[clients.length - 1];
      if (newClient) {
        setClientId(newClient.id);
      }
    }
    setPrevClientsLength(clients.length);
  }, [clients]);

  const reminderOptions = [
    { value: 0, label: 'Sem lembrete' },
    { value: 15, label: '15 min antes' },
    { value: 30, label: '30 min antes' },
    { value: 60, label: '1 hora antes' },
    { value: 120, label: '2 horas antes' },
    { value: 1440, label: '1 dia antes' },
  ];

  const packageOptions = [
    { 
      id: 'Básico', 
      label: 'Básico', 
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
      ring: 'ring-emerald-400'
    },
    { 
      id: 'Silver', 
      label: 'Silver', 
      color: 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300',
      ring: 'ring-slate-400'
    },
    { 
      id: 'Gold', 
      label: 'Gold', 
      color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
      ring: 'ring-amber-400'
    },
    { 
      id: 'Platinum', 
      label: 'Platinum', 
      color: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-400',
      ring: 'ring-cyan-400'
    },
    { 
      id: 'Diamond', 
      label: 'Diamond', 
      color: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400',
      ring: 'ring-violet-400'
    },
  ];

  const personalTags = [
      { label: 'Consulta Médica', icon: Stethoscope },
      { label: 'Reunião', icon: Users },
      { label: 'Pessoal', icon: User },
  ];

  const getLocalDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (existingShoot) {
        setIsPersonal(!!existingShoot.isPersonal);
        setClientId(existingShoot.clientId);
        setTitle(existingShoot.title);
        setPackageType(existingShoot.packageType || '');
        setDate(existingShoot.date);
        setTime(existingShoot.time);
        setLocation(existingShoot.location);
        setNotes(existingShoot.notes || '');
        
        setMakeupArtist(existingShoot.makeupArtist || '');
        setMakeupPrice(existingShoot.makeupPrice || '');
        setHairstylist(existingShoot.hairstylist || '');
        setHairstylistPrice(existingShoot.hairstylistPrice || '');

        setPrice(existingShoot.price);
        setDeposit(existingShoot.deposit);
        setPaymentStatus(existingShoot.paymentStatus);
        setStatus(existingShoot.status);
        setReminderMinutes(existingShoot.reminderMinutes || 0);
      } else {
        // Defaults
        setIsPersonal(false);
        setClientId(clients.length > 0 ? clients[0].id : '');
        setTitle('');
        setPackageType('');
        setDate(getLocalDateString());
        setTime('09:00');
        setLocation('');
        setNotes('');
        
        setMakeupArtist('');
        setMakeupPrice('');
        setHairstylist('');
        setHairstylistPrice('');

        setPrice('');
        setDeposit('');
        setPaymentStatus(PaymentStatus.PENDING);
        setStatus(ShootStatus.SCHEDULED);
        setReminderMinutes(0);
      }
    }
  }, [isOpen, existingShoot]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPersonal && !clientId) {
      // Double check just in case, though button is disabled
      onAddClient();
      return;
    }

    if (reminderMinutes > 0 && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    const newShoot: Shoot = {
      id: existingShoot ? existingShoot.id : Date.now().toString(),
      clientId: isPersonal ? 'personal' : clientId,
      title,
      isPersonal,
      packageType: isPersonal ? undefined : packageType,
      date,
      time,
      location,
      notes,
      
      makeupArtist: isPersonal ? undefined : makeupArtist,
      makeupPrice: isPersonal ? undefined : Number(makeupPrice),
      hairstylist: isPersonal ? undefined : hairstylist,
      hairstylistPrice: isPersonal ? undefined : Number(hairstylistPrice),

      price: isPersonal ? 0 : Number(price),
      deposit: isPersonal ? 0 : Number(deposit),
      paymentStatus: isPersonal ? PaymentStatus.PAID : paymentStatus,
      status,
      reminderMinutes,
      reminderSent: false 
    };
    onSave(newShoot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 transition-colors">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{existingShoot ? 'Editar Evento' : 'Novo Evento'}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-4 no-scrollbar flex-grow">
            
          {/* Type Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex mb-4">
              <button 
                type="button"
                onClick={() => setIsPersonal(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${!isPersonal ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  <Briefcase size={16} className="mr-2" /> Trabalho
              </button>
              <button 
                type="button"
                onClick={() => setIsPersonal(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${isPersonal ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  <User size={16} className="mr-2" /> Pessoal
              </button>
          </div>

          <form id="shoot-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Personal Tags */}
            {isPersonal && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {personalTags.map(tag => (
                        <button
                            key={tag.label}
                            type="button"
                            onClick={() => setTitle(tag.label)}
                            className="flex-shrink-0 flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-full text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        >
                            <tag.icon size={12} className="mr-1.5"/> {tag.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Client Selection (Only for Work) */}
            {!isPersonal && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cliente</label>
                    
                    {clients.length === 0 ? (
                        <button
                            type="button"
                            onClick={onAddClient}
                            className="w-full p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                        >
                            <UserPlus size={20} className="mr-2" />
                            Cadastrar Primeiro Cliente
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <select
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                >
                                    <option value="" disabled>Selecione o cliente</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                                    <User size={16} />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onAddClient}
                                className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-12 flex-shrink-0 flex items-center justify-center rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                title="Novo Cliente"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{isPersonal ? 'Título do Evento' : 'Título do Ensaio'}</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isPersonal ? "Ex: Médico, Reunião..." : "Ex: Ensaio Gestante Externo"}
              />
            </div>

            {/* Packages (Only for Work) */}
            {!isPersonal && (
                <div>
                    <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        <Package size={14} className="mr-1.5 text-purple-500"/> Pacote
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {packageOptions.map((pkg) => (
                            <button
                                key={pkg.id}
                                type="button"
                                onClick={() => setPackageType(pkg.id === packageType ? '' : pkg.id)}
                                className={`
                                    py-2 px-1 text-[10px] font-bold rounded-lg border transition-all duration-200 uppercase
                                    ${packageType === pkg.id 
                                        ? `${pkg.color} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ${pkg.ring}`
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }
                                `}
                            >
                                {pkg.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        <Calendar size={12} className="mr-1"/> Data
                    </label>
                    <input
                        required
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        <Clock size={12} className="mr-1"/> Horário
                    </label>
                    <input
                        required
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                <MapPin size={12} className="mr-1"/> Local
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Consultório, Escritório"
              />
            </div>

            {/* Production Team (Only for Work) */}
            {!isPersonal && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                     <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Produção / Extras
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        {/* Makeup */}
                        <div className="flex gap-2">
                             <div className="relative flex-grow">
                                <Palette size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" />
                                <input
                                    value={makeupArtist}
                                    onChange={(e) => setMakeupArtist(e.target.value)}
                                    className="w-full pl-9 p-2 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="Nome Maquiadora"
                                />
                             </div>
                             <div className="w-24 relative">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs">R$</span>
                                <input
                                    type="number"
                                    value={makeupPrice}
                                    onChange={(e) => setMakeupPrice(Number(e.target.value))}
                                    className="w-full pl-7 p-2 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="0.00"
                                />
                             </div>
                        </div>

                         {/* Hair */}
                         <div className="flex gap-2">
                             <div className="relative flex-grow">
                                <Scissors size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500" />
                                <input
                                    value={hairstylist}
                                    onChange={(e) => setHairstylist(e.target.value)}
                                    className="w-full pl-9 p-2 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Nome Cabeleireira"
                                />
                             </div>
                             <div className="w-24 relative">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs">R$</span>
                                <input
                                    type="number"
                                    value={hairstylistPrice}
                                    onChange={(e) => setHairstylistPrice(Number(e.target.value))}
                                    className="w-full pl-7 p-2 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="0.00"
                                />
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reminder */}
            <div className="pt-1 pb-2">
              <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <Bell size={14} className="mr-1.5 text-blue-500 dark:text-blue-400"/> Notificações
              </label>
              <div className="grid grid-cols-3 gap-2">
                {reminderOptions.map((option) => {
                  const isSelected = reminderMinutes === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReminderMinutes(option.value)}
                      className={`
                        py-2 px-1 text-xs font-bold rounded-lg border transition-all duration-200
                        ${isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-[1.02] dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Finances (Only for Work) */}
            {!isPersonal && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
                        <DollarSign size={16} className="mr-1 text-green-600 dark:text-green-400"/> Financeiro
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Total (R$)</label>
                            <input
                                required={!isPersonal}
                                type="number"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full p-2 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Sinal (R$)</label>
                            <input
                                type="number"
                                min="0"
                                value={deposit}
                                onChange={(e) => setDeposit(Number(e.target.value))}
                                className="w-full p-2 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Status Pagamento</label>
                        <div className="flex space-x-2">
                            {(Object.values(PaymentStatus) as PaymentStatus[]).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setPaymentStatus(st)}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors border ${
                                        paymentStatus === st 
                                        ? 'bg-green-600 dark:bg-green-500 text-white border-green-600 dark:border-green-500' 
                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

             {/* Status & Notes */}
             <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ShootStatus)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(ShootStatus).map(st => (
                            <option key={st} value={st}>{st}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        <AlignLeft size={12} className="mr-1"/> Observações
                    </label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        placeholder="Detalhes importantes, referências, equipamentos..."
                    />
                </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
             <button 
                type="submit" 
                form="shoot-form"
                disabled={!isPersonal && clients.length === 0}
                className="w-full bg-blue-600 dark:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-200 dark:shadow-none active:scale-95 transition-all"
            >
              {existingShoot ? 'Salvar Alterações' : isPersonal ? 'Criar Compromisso' : 'Agendar Ensaio'}
            </button>
        </div>

      </div>
    </div>
  );
};