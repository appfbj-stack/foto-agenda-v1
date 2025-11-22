import React, { useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[80] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
        type === 'success' 
          ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900' 
          : 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900'
      }`}>
        {type === 'success' ? <Check size={18} strokeWidth={3} /> : <AlertCircle size={18} strokeWidth={3} />}
        <span className="font-bold text-sm">{message}</span>
      </div>
    </div>
  );
};