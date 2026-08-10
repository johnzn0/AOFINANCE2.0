import { useState, useEffect, useCallback } from 'react';

export interface UsePWAInstallReturn {
  deferredPrompt: any;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  installSuccess: boolean;
  showFallbackModal: boolean;
  triggerInstall: () => Promise<void>;
  closeFallbackModal: () => void;
  closeSuccessModal: () => void;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [showFallbackModal, setShowFallbackModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      if (isStandalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // 2. Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

    // 3. Listen for beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      setShowFallbackModal(false);
      localStorage.setItem('pwa_app_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (localStorage.getItem('pwa_app_installed') === 'true') {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    // If already installed, don't show prompt
    if (isInstalled) {
      return;
    }

    // Direct native install prompt if beforeinstallprompt event was captured
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setInstallSuccess(true);
          localStorage.setItem('pwa_app_installed', 'true');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Native install prompt error:', err);
      }
      return;
    }

    // Fallback for browsers that don't support beforeinstallprompt (iOS Safari or iframe preview)
    setShowFallbackModal(true);
  }, [deferredPrompt, isInstalled]);

  const closeFallbackModal = useCallback(() => {
    setShowFallbackModal(false);
  }, []);

  const closeSuccessModal = useCallback(() => {
    setInstallSuccess(false);
  }, []);

  return {
    deferredPrompt,
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    installSuccess,
    showFallbackModal,
    triggerInstall,
    closeFallbackModal,
    closeSuccessModal,
  };
}
