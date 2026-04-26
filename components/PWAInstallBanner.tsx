
import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen for the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not seen before
      if (!sessionStorage.getItem('pwa_banner_seen')) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
      // On iOS we show instructions after a delay or scroll
      if (!sessionStorage.getItem('pwa_banner_seen')) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    handleClose();
  };

  const handleClose = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_seen', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-4">
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Download size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Instalar FotoAgenda Pro</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
              {platform === 'ios' ? (
                <span className="flex items-center gap-1 flex-wrap">
                  Toque em <Share size={14} className="text-blue-500 inline" /> e depois em 
                  <span className="font-bold">"Adicionar à Tela de Início"</span> para instalar.
                </span>
              ) : (
                "Instale para acesso rápido offline e melhor experiência."
              )}
            </p>
          </div>
        </div>

        {platform !== 'ios' ? (
          <button 
            onClick={handleInstallClick}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
          >
            <PlusSquare size={14} /> Instalar Agora
          </button>
        ) : null}
      </div>
    </div>
  );
};
