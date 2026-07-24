import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check, Share, PlusSquare } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

    // Listen for BeforeInstallPrompt event (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show banner on mobile devices if not dismissed before
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (ios && !dismissed) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Para instalar no seu celular Android, abra o menu do navegador (⋮) e toque em "Adicionar à Tela de Início".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (installed || !showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 border-b border-blue-500/30 text-white px-4 py-3 relative z-30 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-serif font-bold text-white text-sm shadow-md shrink-0">
            AO
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Instale o aplicativo AO FINANCE no seu Celular</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                PWA Grátis
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Acesso rápido da tela inicial, funciona como aplicativo nativo sem precisar de loja de apps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Smartphone className="w-4 h-4" />
            <span>{isIOS ? 'Como Instalar no iPhone' : 'Instalar App Agora'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
              <Share className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Instalar no iPhone / iPad</h3>

            <ol className="text-xs text-slate-300 text-left space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">1.</span>
                <span>Toque no botão de <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-blue-400" /> na barra do navegador Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">2.</span>
                <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline text-blue-400" />.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">3.</span>
                <span>Toque em <strong>Adicionar</strong> no canto superior direito.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
