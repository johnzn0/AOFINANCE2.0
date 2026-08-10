import React, { useState, useEffect } from 'react';
import { Download, X, Check, Share, PlusSquare, Sparkles, Smartphone } from 'lucide-react';
import { UsePWAInstallReturn } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  pwa: UsePWAInstallReturn;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ pwa }) => {
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('pwa_banner_dismissed_v3');
    if (isDismissed) {
      setDismissedBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    setDismissedBanner(true);
    localStorage.setItem('pwa_banner_dismissed_v3', 'true');
  };

  // If already installed, don't show top notification banner
  const showTopBanner = !pwa.isInstalled && !dismissedBanner && !pwa.showFallbackModal;

  return (
    <>
      {/* Top Floating Notification Banner */}
      {showTopBanner && (
        <div className="bg-slate-900 bg-gradient-to-r from-blue-900/30 via-slate-900 to-amber-900/30 border-b border-blue-500/30 text-white px-4 py-3 relative z-30 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-serif font-black text-white text-sm shadow-md shrink-0">
                AO
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>Instale o AO FINANCE no seu Dispositivo</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-medium">
                    Aplicativo Oficial (PWA)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Acesso rápido pela tela inicial, funcionamento em tela cheia e suporte offline.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => pwa.triggerInstall()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar aplicativo</span>
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

      {/* Discrete Fallback Modal for unsupported browser prompts (iOS Safari or iframe preview) */}
      {pwa.showFallbackModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            {/* Close button */}
            <button
              type="button"
              onClick={pwa.closeFallbackModal}
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
                Instalação do aplicativo web no seu celular ou computador
              </p>
            </div>

            {pwa.isIOS ? (
              <div className="space-y-4">
                <div className="bg-blue-950/50 p-4 rounded-2xl border border-blue-500/30 text-xs text-slate-200 space-y-3">
                  <div className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                    <Share className="w-4 h-4" />
                    <span>Instalação no iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                    <li>Toque no ícone <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-amber-400" /> no menu do Safari.</li>
                    <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-400" />.</li>
                    <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={pwa.closeFallbackModal}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition"
                >
                  Entendi
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2.5">
                  <p className="font-bold text-blue-400 text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Instalação de Aplicativo
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Se você estiver navegando dentro do preview do sistema, clique para abrir o site em uma <strong>Nova Aba do Navegador</strong> e clique novamente em <strong>“Baixar aplicativo”</strong>.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    No Google Chrome ou Edge, você também pode acessar o menu <strong>(⋮)</strong> e selecionar <strong>"Instalar aplicativo"</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={pwa.closeFallbackModal}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal Notification */}
      {pwa.installSuccess && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-white">Aplicativo instalado ✓</h3>
              <p className="text-xs text-slate-300">
                O AO FINANCE foi instalado com sucesso! Você já pode acessá-lo direto da tela inicial.
              </p>
            </div>

            <button
              type="button"
              onClick={pwa.closeSuccessModal}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition"
            >
              Concluído
            </button>
          </div>
        </div>
      )}
    </>
  );
};
