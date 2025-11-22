import React from 'react';
import { Home, Calendar, Users, History, Plus } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onAddClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, onAddClick }) => {
  const navItems: { view: ViewState; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Início', icon: Home },
    { view: 'calendar', label: 'Agenda', icon: Calendar },
    { view: 'clients', label: 'Clientes', icon: Users },
    { view: 'history', label: 'Histórico', icon: History },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 transition-colors duration-300">
      <div className="flex justify-between items-end pb-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`flex flex-col items-center w-16 py-1 transition-colors ${
              currentView === item.view 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <item.icon size={22} strokeWidth={currentView === item.view ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </button>
        ))}
        
        <button
            onClick={onAddClick}
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full p-4 shadow-lg shadow-blue-600/30 dark:shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95"
        >
            <Plus size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};