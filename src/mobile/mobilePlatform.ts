/**
 * Mobile Platform Helper & Device Detection Layer
 * Compatible with Web, Android (PWA/TWA/Capacitor) and iOS (Safari/PWA)
 */

export interface MobilePlatformInfo {
  isMobileDevice: boolean;
  isAndroid: boolean;
  isiOS: boolean;
  isStandalonePWA: boolean;
  canShare: boolean;
  hasTouchSupport: boolean;
}

export function detectMobilePlatform(): MobilePlatformInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobileDevice: false,
      isAndroid: false,
      isiOS: false,
      isStandalonePWA: false,
      canShare: false,
      hasTouchSupport: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isiOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobileDevice = isAndroid || isiOS || /Mobile|Tablet|Android/i.test(ua);

  const isStandalonePWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  const canShare = typeof navigator.share === 'function';
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    isMobileDevice,
    isAndroid,
    isiOS,
    isStandalonePWA,
    canShare,
    hasTouchSupport,
  };
}

/**
 * Triggers light haptic feedback if supported on native mobile
 */
export function triggerHapticFeedback(pattern: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (pattern === 'light') navigator.vibrate(10);
      else if (pattern === 'medium') navigator.vibrate(25);
      else if (pattern === 'heavy') navigator.vibrate(50);
    } catch {
      // Ignore vibration errors
    }
  }
}

/**
 * Native mobile sharing helper
 */
export async function shareMobileContent(data: { title: string; text?: string; url?: string }): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      console.warn('Mobile share cancelled or failed:', err);
      return false;
    }
  }
  return false;
}
