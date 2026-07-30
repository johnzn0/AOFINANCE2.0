import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check, Share, PlusSquare, Sparkles } from 'lucide-react';

interface PWAInstallBannerProps {
  forceShowModal?: boolean;
  onCloseModal?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  forceShowModal = false,
  onCloseModal,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

    // Listen for BeforeInstallPrompt event (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setShowInstallModal(false);
      setInstallSuccess(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-show banner on mobile if not dismissed
    const dismissed = localStorage.getItem('pwa_banner_dismissed_v2');
    if (!dismissed) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (forceShowModal) {
      setShowInstallModal(true);
    }
  }, [forceShowModal]);

  const triggerNativeInstall = async () => {
    if (isIOS) {
      setShowInstallModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallSuccess(true);
          setShowBanner(false);
          setShowInstallModal(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // Fallback modal with quick instructions
      setShowInstallModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed_v2', 'true');
  };

  const handleCloseModal = () => {
    setShowInstallModal(false);
    if (onCloseModal) onCloseModal();
  };

  if (installed) return null;

  return (
    <>
      {/* Top Floating Notification Banner */}
      {showBanner && !showInstallModal && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 border-b border-blue-500/30 text-white px-4 py-3 relative z-30 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-serif font-black text-white text-sm shadow-md shrink-0">
                AO
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>Instale o App AO FINANCE no seu Celular</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-medium">
                    Instalação Direta 1-Clique
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Acesse com 1 toque na tela inicial, funciona offline sem precisar de loja de aplicativos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={triggerNativeInstall}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora</span>
              </button>

              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                title="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Direct Installation Popup Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-amber-500 to-blue-400 flex items-center justify-center mx-auto text-white font-serif font-black text-2xl shadow-xl shadow-blue-600/20">
                AO
              </div>
              <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                Instalar AO FINANCE
              </h3>
              <p className="text-xs text-slate-400">
                Aplicativo Multiplataforma para Android, iOS e Computador
              </p>
            </div>

            {/* Benefits pill */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Vantagens do Aplicativo Instalado:</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Acesso instantâneo pela Tela Inicial do celular</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Carregamento rápido com suporte e cache Offline</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Navegação sem barra do navegador (Tela Cheia)</span>
                </li>
              </ul>
            </div>

            {/* Direct Action or Platform Guide */}
            {deferredPrompt ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={triggerNativeInstall}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500 hover:from-blue-500 hover:to-amber-400 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 active:scale-98"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar Aplicativo com 1 Clique</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center">
                  Seu navegador suporta instalação direta e automática.
                </p>
              </div>
            ) : isIOS ? (
              <div className="space-y-3">
                <div className="bg-blue-950/50 p-4 rounded-2xl border border-blue-500/30 text-xs text-slate-200 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center gap-2">
                    <Share className="w-4 h-4" />
                    <span>Instalação no iPhone / Safari:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
                    <li>Toque no botão <strong>Compartilhar</strong> <Share className="w-3 h-3 inline text-amber-400" /> do Safari.</li>
                    <li>Role e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3 h-3 inline text-amber-400" />.</li>
                    <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
                >
                  Entendi
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p className="font-bold text-blue-400">Como criar atalho direto:</p>
                  <p className="text-[11px] leading-relaxed">
                    Abra o menu do seu navegador <strong>(três pontos ⋮)</strong> e toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à Tela Inicial"</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal Notification */}
      {installSuccess && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-white">Aplicativo Instalado!</h3>
              <p className="text-xs text-slate-300">
                O AO FINANCE foi adicionado com sucesso à tela inicial do seu celular.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setInstallSuccess(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition"
            >
              Excelente!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
