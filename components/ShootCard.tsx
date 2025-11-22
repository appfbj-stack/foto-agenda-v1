
import React from 'react';
import { Clock, MapPin, User, DollarSign, Package, Share2, Briefcase, Calendar, Palette, Scissors, AlignLeft, Bell } from 'lucide-react';
import { Shoot, Client, PaymentStatus, ShootStatus } from '../types';

interface ShootCardProps {
  shoot: Shoot;
  client?: Client;
  onClick?: () => void;
}

const getPackageColor = (pkg?: string) => {
    switch(pkg) {
        case 'Gold': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700';
        case 'Platinum': return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-400 dark:border-cyan-700';
        case 'Diamond': return 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/50 dark:text-violet-400 dark:border-violet-700';
        case 'Silver': return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
        case 'Básico': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700';
        default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
};

export const ShootCard: React.FC<ShootCardProps> = ({ shoot, client, onClick }) => {
  const isCompleted = shoot.status === ShootStatus.COMPLETED;
  const isCancelled = shoot.status === ShootStatus.CANCELLED;
  const isPersonal = shoot.isPersonal;
  
  // Definindo cores de fundo e borda para deixar o card "Colorido"
  let cardStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"; // Fallback
  let statusBorder = "border-l-4 border-slate-300";

  if (isCancelled) {
      cardStyle = "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75 grayscale";
      statusBorder = "border-l-4 border-red-400";
  } else if (isPersonal) {
      // Roxo para pessoal
      cardStyle = "bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-purple-900/20 dark:via-slate-900 dark:to-slate-900 border-purple-100 dark:border-purple-900/30";
      statusBorder = "border-l-4 border-purple-500";
  } else if (isCompleted || shoot.paymentStatus === PaymentStatus.PAID) {
      // Verde/Teal para coisas pagas/finalizadas (sucesso)
      cardStyle = "bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 dark:from-emerald-900/20 dark:via-slate-900 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/30";
      statusBorder = "border-l-4 border-emerald-500";
  } else {
      // Azul padrão para agendados de trabalho
      cardStyle = "bg-gradient-to-br from-blue-50 via-white to-sky-50/30 dark:from-blue-900/20 dark:via-slate-900 dark:to-slate-900 border-blue-100 dark:border-blue-900/30";
      statusBorder = "border-l-4 border-blue-500";
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPersonal) return;

    const phoneNumber = client?.phone.replace(/\D/g, '') || '';
    const firstName = client?.name.split(' ')[0] || 'Cliente';
    
    const lines = [
      `Olá, ${firstName}! 👋`,
      `Aqui estão os detalhes do seu agendamento:`,
      ``,
      `📸 *${shoot.title}*`,
    ];

    if (shoot.packageType) {
      lines.push(`📦 Pacote: *${shoot.packageType}*`);
    }

    const dateStr = new Date(shoot.date + 'T00:00:00').toLocaleDateString('pt-BR');

    lines.push(`📅 Data: ${dateStr} às ${shoot.time}`);
    lines.push(`📍 Local: ${shoot.location}`);
    
    // Extras info in WhatsApp
    if (shoot.makeupArtist) {
        lines.push(`💄 Maquiagem: ${shoot.makeupArtist} ${shoot.makeupPrice ? `(R$ ${shoot.makeupPrice})` : ''}`);
    }
    if (shoot.hairstylist) {
        lines.push(`💇‍♀️ Cabelo: ${shoot.hairstylist} ${shoot.hairstylistPrice ? `(R$ ${shoot.hairstylistPrice})` : ''}`);
    }

    lines.push(`💰 Valor Total: R$ ${shoot.price.toFixed(2)}`);
    
    if (shoot.deposit > 0) {
        lines.push(`💳 Sinal: R$ ${shoot.deposit.toFixed(2)}`);
    }
    
    if (shoot.notes) {
        lines.push(``);
        lines.push(`📝 Obs: ${shoot.notes}`);
    }

    lines.push(``);
    lines.push(`Qualquer dúvida, estou à disposição!`);

    const message = lines.join('\n');
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };

  return (
    <div 
      onClick={onClick}
      className={`rounded-xl p-4 shadow-sm mb-3 border ${cardStyle} ${statusBorder} active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden group`}
    >
        {/* Payment Status Badge - ONLY FOR WORK */}
        {!isPersonal && !isCancelled && (
            <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm
                ${shoot.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                shoot.paymentStatus === PaymentStatus.PARTIAL ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                {shoot.paymentStatus}
            </div>
        )}

        {/* Personal Badge */}
        {isPersonal && !isCancelled && (
            <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 uppercase tracking-wider shadow-sm">
                Pessoal
            </div>
        )}

        {/* Cancelled Badge */}
        {isCancelled && (
            <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 uppercase tracking-wider">
                Cancelado
            </div>
        )}

      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg pr-16 truncate">{shoot.title}</h4>
      
      {/* Package Badge - Only Work */}
      {shoot.packageType && !isPersonal && (
          <div className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border shadow-sm ${getPackageColor(shoot.packageType)}`}>
              <Package size={10} className="mr-1" />
              {shoot.packageType}
          </div>
      )}

      <div className="mt-3 space-y-2">
        {!isPersonal && (
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <User size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
                <span className="truncate font-medium">{client?.name || 'Cliente desconhecido'}</span>
            </div>
        )}
        
        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Clock size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
            <span>{new Date(shoot.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {shoot.time}</span>
            {shoot.reminderMinutes && shoot.reminderMinutes > 0 && (
                <Bell size={12} className="ml-2 text-blue-500 dark:text-blue-400" fill="currentColor" fillOpacity={0.2} />
            )}
        </div>
        
        {shoot.location && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
                <span className="truncate">{shoot.location}</span>
            </div>
        )}

        {/* Makeup and Hair Info Display */}
        {(!isPersonal && (shoot.makeupArtist || shoot.hairstylist)) && (
            <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                {shoot.makeupArtist && (
                    <div className="flex items-center text-xs text-pink-600 dark:text-pink-400 font-medium">
                        <Palette size={12} className="mr-1.5" />
                        <span>{shoot.makeupArtist}</span>
                    </div>
                )}
                {shoot.hairstylist && (
                    <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 font-medium">
                        <Scissors size={12} className="mr-1.5" />
                        <span>{shoot.hairstylist}</span>
                    </div>
                )}
            </div>
        )}
        
        {/* Notes Display */}
        {shoot.notes && (
            <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 italic flex items-start">
                <AlignLeft size={12} className="mr-1.5 mt-0.5 flex-shrink-0 text-slate-400" />
                <span className="line-clamp-2">{shoot.notes}</span>
            </div>
        )}

        {!isPersonal && (
            <div className="flex items-center text-sm text-slate-900 dark:text-slate-200 font-semibold mt-2">
                <DollarSign size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
                <span>R$ {shoot.price.toFixed(2)}</span>
                {shoot.deposit > 0 && shoot.deposit < shoot.price && (
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500 font-normal">
                        (Sinal: R$ {shoot.deposit})
                    </span>
                )}
            </div>
        )}
      </div>

      {/* WhatsApp Share Button - Only Work */}
      {!isPersonal && (
          <button
            onClick={handleShare}
            className="absolute bottom-3 right-3 p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md shadow-green-200 dark:shadow-green-900/20 transition-transform active:scale-90 z-10"
            title="Enviar detalhes no WhatsApp"
          >
            <Share2 size={18} strokeWidth={2.5} />
          </button>
      )}
    </div>
  );
};
