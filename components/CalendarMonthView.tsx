import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Shoot, Client } from '../types';
import { ShootCard } from './ShootCard';

interface CalendarMonthViewProps {
  shoots: Shoot[];
  clients: Client[];
  onEditShoot: (shoot: Shoot) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ shoots, clients, onEditShoot }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const shootsByDate = useMemo(() => {
    const map = new Map<string, Shoot[]>();
    shoots.forEach(shoot => {
      const dateStr = shoot.date; // YYYY-MM-DD
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(shoot);
    });
    return map;
  }, [shoots]);

  const renderDays = () => {
    const days = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-16 border border-transparent"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayShoots = shootsByDate.get(dateStr) || [];
      
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth && 
        selectedDate.getFullYear() === currentYear;

      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === currentMonth && 
        new Date().getFullYear() === currentYear;

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
          className={`h-12 sm:h-16 border border-slate-100 dark:border-slate-800 rounded-lg flex flex-col items-center justify-start pt-1 cursor-pointer transition-colors relative
            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
          `}
        >
          <span className={`text-xs sm:text-sm font-medium ${isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>
            {day}
          </span>
          <div className="flex gap-1 mt-1 flex-wrap justify-center px-1">
            {dayShoots.slice(0, 3).map((shoot, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${shoot.isPersonal ? 'bg-purple-500' : 'bg-blue-500'}`}
              />
            ))}
            {dayShoots.length > 3 && (
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400" />
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateStr = selectedDate 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;

  const selectedShoots = selectedDateStr ? shootsByDate.get(selectedDateStr) || [] : [];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 capitalize">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
      </div>

      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          
          {selectedShoots.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum evento neste dia.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedShoots.map(shoot => (
                <ShootCard 
                  key={shoot.id} 
                  shoot={shoot} 
                  client={shoot.isPersonal ? undefined : clients.find(c => c.id === shoot.clientId)} 
                  onClick={() => onEditShoot(shoot)} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
