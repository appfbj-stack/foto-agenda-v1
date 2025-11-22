import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtext, trend }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-start mb-2">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">{title}</p>
        <div className="text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg">
            {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
};