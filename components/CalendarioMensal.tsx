import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Camera, User } from 'lucide-react';
import { Shoot, Client, ShootStatus } from '../types';

interface Props {
  shoots: Shoot[];
  clients: Client[];
  onShootClick: (shoot: Shoot) => void;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PACKAGE_COLORS: Record<string, string> = {
  'Básico':    'bg-slate-400',
  'Silver':    'bg-slate-300',
  'Gold':      'bg-yellow-400',
  'Platinum':  'bg-cyan-400',
  'Diamond':   'bg-purple-400',
};

function getDotColor(shoot: Shoot) {
  if (shoot.status === ShootStatus.CANCELLED) return 'bg-red-400';
  if (shoot.isPersonal) return 'bg-purple-500';
  return PACKAGE_COLORS[shoot.packageType || ''] || 'bg-blue-500';
}

export const CalendarioMensal: React.FC<Props> = ({ shoots, clients, onShootClick }) => {
  const today = new Date();
  const [mesRef, setMesRef] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const ano  = mesRef.getFullYear();
  const mes  = mesRef.getMonth();

  // primeiro dia da semana do mês
  const primeiroDia  = new Date(ano, mes, 1).getDay();
  const diasNoMes    = new Date(ano, mes + 1, 0).getDate();

  // monta grid: células vazias + dias
  const celulas: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  // garante múltiplo de 7
  while (celulas.length % 7 !== 0) celulas.push(null);

  // índice shoots por data
  const shootsPorDia: Record<string, Shoot[]> = {};
  shoots.forEach(s => {
    if (!shootsPorDia[s.date]) shootsPorDia[s.date] = [];
    shootsPorDia[s.date].push(s);
  });

  function dataStr(dia: number) {
    return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  function isHoje(dia: number) {
    return dia === today.getDate() && mes === today.getMonth() && ano === today.getFullYear();
  }

  const mesMostrado = mesRef.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const mesFmt = mesMostrado.charAt(0).toUpperCase() + mesMostrado.slice(1);

  const shootsDia = diaSelecionado ? (shootsPorDia[diaSelecionado] || []) : [];
  const diaSel = diaSelecionado ? parseInt(diaSelecionado.split('-')[2]) : null;
  const diaNomeSel = diaSelecionado
    ? new Date(diaSelecionado + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="space-y-3">
      {/* navegação de mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setMesRef(new Date(ano, mes - 1, 1)); setDiaSelecionado(null); }}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{mesFmt}</span>
        <button
          onClick={() => { setMesRef(new Date(ano, mes + 1, 1)); setDiaSelecionado(null); }}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* cabeçalho dias da semana */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* células */}
        <div className="grid grid-cols-7">
          {celulas.map((dia, i) => {
            if (!dia) return (
              <div key={`empty-${i}`} className="aspect-square border-b border-r border-slate-50 dark:border-slate-800/50 last:border-r-0" />
            );

            const ds = dataStr(dia);
            const shootsNoDia = shootsPorDia[ds] || [];
            const selecionado = diaSelecionado === ds;
            const hoje = isHoje(dia);
            const temEnsaio = shootsNoDia.length > 0;

            return (
              <button
                key={ds}
                onClick={() => setDiaSelecionado(selecionado ? null : ds)}
                className={`aspect-square flex flex-col items-center justify-start pt-1.5 pb-1 border-b border-r border-slate-50 dark:border-slate-800/50 transition-all relative
                  ${selecionado ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                  ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}
                `}
              >
                {/* número do dia */}
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                  ${hoje ? 'bg-blue-600 text-white' : ''}
                  ${selecionado && !hoje ? 'text-blue-600 dark:text-blue-400' : ''}
                  ${!hoje && !selecionado ? 'text-slate-700 dark:text-slate-300' : ''}
                `}>
                  {dia}
                </span>

                {/* pontos de ensaios */}
                {temEnsaio && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1 max-w-full">
                    {shootsNoDia.slice(0, 3).map(s => (
                      <span key={s.id} className={`w-1.5 h-1.5 rounded-full ${getDotColor(s)}`} />
                    ))}
                    {shootsNoDia.length > 3 && (
                      <span className="text-[8px] text-slate-400 leading-none">+{shootsNoDia.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* legenda */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Cliente</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Pessoal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Gold</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Cancelado</span>
      </div>

      {/* painel do dia selecionado */}
      {diaSelecionado && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* cabeçalho */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm capitalize">{diaNomeSel}</p>
              <p className="text-xs text-slate-400">
                {shootsDia.length === 0
                  ? 'Nenhum compromisso'
                  : `${shootsDia.length} compromisso${shootsDia.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setDiaSelecionado(null)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* lista de shoots do dia */}
          {shootsDia.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-600">
              <Camera size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Dia livre</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {shootsDia
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(shoot => {
                  const client = shoot.isPersonal ? null : clients.find(c => c.id === shoot.clientId);
                  const cancelado = shoot.status === ShootStatus.CANCELLED;
                  return (
                    <button
                      key={shoot.id}
                      onClick={() => onShootClick(shoot)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                      {/* hora */}
                      <div className={`text-center min-w-[44px] rounded-lg py-1 px-1 ${shoot.isPersonal ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                        <p className={`text-xs font-bold ${shoot.isPersonal ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {shoot.time}
                        </p>
                      </div>

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${cancelado ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {shoot.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {client && (
                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                              <User size={10} />
                              {client.name}
                            </span>
                          )}
                          {shoot.isPersonal && (
                            <span className="text-xs text-purple-500 dark:text-purple-400">Pessoal</span>
                          )}
                          {shoot.location && (
                            <span className="text-xs text-slate-400 truncate">· {shoot.location}</span>
                          )}
                        </div>
                      </div>

                      {/* package / status */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {cancelado ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Cancelado</span>
                        ) : shoot.packageType ? (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {shoot.packageType}
                          </span>
                        ) : null}
                        {!shoot.isPersonal && !cancelado && (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            R$ {shoot.price}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
