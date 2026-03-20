import React, { useState, useEffect } from 'react';
import { X, Calculator, Calendar as CalendarIcon } from 'lucide-react';

interface PregnancyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PregnancyCalculatorModal: React.FC<PregnancyCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [weeks, setWeeks] = useState<number | ''>('');
  const [referenceDate, setReferenceDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [bestPeriod, setBestPeriod] = useState<Date | null>(null);
  const [limitDate, setLimitDate] = useState<Date | null>(null);
  const [weeklyCalendar, setWeeklyCalendar] = useState<{week: number, date: Date}[]>([]);

  useEffect(() => {
    if (weeks !== '' && referenceDate) {
      const refDate = new Date(referenceDate + 'T12:00:00');
      const weeksNum = Number(weeks);
      
      // Calculate conception date (0 weeks)
      const daysPregnant = weeksNum * 7;
      const conceptionDate = new Date(refDate.getTime() - daysPregnant * 24 * 60 * 60 * 1000);

      // Best period: 30 weeks (210 days)
      const best = new Date(conceptionDate.getTime() + 210 * 24 * 60 * 60 * 1000);
      setBestPeriod(best);

      // Limit date: 33 weeks (231 days)
      const limit = new Date(conceptionDate.getTime() + 231 * 24 * 60 * 60 * 1000);
      setLimitDate(limit);

      // Weekly calendar (29 to 31 weeks)
      const calendar = [];
      for (let w = 29; w <= 31; w++) {
        const weekDate = new Date(conceptionDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
        // Ensure we don't have timezone offset issues by setting hours to 12
        weekDate.setHours(12, 0, 0, 0);
        calendar.push({
          week: w,
          date: weekDate
        });
      }
      setWeeklyCalendar(calendar);
    } else {
      setBestPeriod(null);
      setLimitDate(null);
      setWeeklyCalendar([]);
    }
  }, [weeks, referenceDate]);

  if (!isOpen) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Calculator size={20} className="text-blue-500" />
            <h2 className="font-bold text-lg">Calculadora Gestante</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Número de Semanas
              </label>
              <input
                type="number"
                min="1"
                max="42"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 29"
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Data de Referência
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {bestPeriod && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Data do Melhor período (30 sem)</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">{formatDate(bestPeriod)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Data Limite (33 sem)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{formatDate(limitDate)}</span>
              </div>
              
              {weeklyCalendar.length > 0 && (
                <div className="pt-3 mt-3 border-t border-blue-200 dark:border-blue-800/50">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block text-center">
                    Calendário Semanal para Ensaio
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {weeklyCalendar.map((item) => (
                      <div key={item.week} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.week} Semanas</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatDate(item.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-blue-500/20"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
