import React from 'react';
import { Camera, Calendar, DollarSign, Users, ArrowRight, CheckCircle2, Star, User, Briefcase } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 text-white transition-colors duration-500 no-scrollbar relative flex flex-col">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 bg-slate-950/50">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <Camera size={20} fill="currentColor" fillOpacity={0.2} />
            </div>
            <span className="font-bold text-lg tracking-tight">FotoAgenda<span className="text-blue-400">Pro</span></span>
          </div>
          <button 
            onClick={onEnter}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-6 pt-24 pb-8 relative z-10 w-full">
        
        {/* Hero Section */}
        <div className="text-center w-full animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 text-[10px] font-bold uppercase tracking-widest mb-6 border border-white/10 shadow-sm">
            <Star size={10} className="fill-yellow-400 text-yellow-400" />
            <span>Profissional & Pessoal</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black leading-[1.1] mb-4 tracking-tight">
            Sua rotina completa <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-pulse-slow">
              em um só lugar.
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-[300px] mx-auto">
            Organize seus ensaios, controle suas finanças e não esqueça seus compromissos pessoais.
          </p>

          {/* Botão Principal de Ação */}
          <button 
            onClick={onEnter}
            className="group relative w-full bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-2xl shadow-[0_20px_40px_-15px_rgba(37,99,235,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="bg-gradient-to-b from-white/20 to-transparent absolute inset-0 rounded-2xl pointer-events-none" />
            <div className="relative flex items-center justify-center gap-3 bg-slate-900/20 h-14 rounded-xl border border-white/10 backdrop-blur-sm">
                <span className="font-bold text-lg">Começar Agora</span>
                <div className="bg-white text-blue-600 p-1 rounded-full group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={16} strokeWidth={3} />
                </div>
            </div>
          </button>
        </div>

        {/* Visual Floating Cards */}
        <div className="mt-14 w-full relative h-40 animate-float opacity-90">
             
             {/* Card 1: Work (Left) */}
            <div className="absolute left-0 top-0 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-blue-500/30 shadow-xl shadow-blue-900/20 w-40 transform -rotate-6 z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400"><Briefcase size={14} /></div>
                    <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wide">Trabalho</span>
                </div>
                <div className="h-2 w-24 bg-slate-700 rounded-full mb-1.5"></div>
                <div className="h-2 w-16 bg-slate-800 rounded-full"></div>
            </div>

            {/* Card 2: Personal (Right) */}
            <div className="absolute right-0 top-8 bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-purple-500/30 shadow-xl shadow-purple-900/20 w-40 transform rotate-6 z-20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400"><User size={14} /></div>
                    <span className="text-[10px] font-bold text-purple-100 uppercase tracking-wide">Pessoal</span>
                </div>
                <div className="flex items-center gap-2">
                     <div className="h-2 w-20 bg-slate-600 rounded-full"></div>
                </div>
            </div>
        </div>

        {/* Feature List */}
        <div className="w-full mt-10 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/10 hover:bg-white/5 transition-colors">
                <Calendar size={20} className="text-blue-400" />
                <span className="font-medium text-slate-200 text-sm">Ensaios & Eventos</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/10 hover:bg-white/5 transition-colors">
                <User size={20} className="text-purple-400" />
                <span className="font-medium text-slate-200 text-sm">Agenda Pessoal Integrada</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/10 hover:bg-white/5 transition-colors">
                <DollarSign size={20} className="text-green-400" />
                <span className="font-medium text-slate-200 text-sm">Controle Financeiro</span>
            </div>
        </div>

      </div>
      
      {/* Footer */}
      <div className="py-6 text-center text-slate-600 text-[10px] font-medium border-t border-white/5">
        <p>Feito para fotógrafos organizados.</p>
      </div>
    </div>
  );
};