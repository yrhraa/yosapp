import { useState, useEffect, useCallback } from 'react';

// BeforeInstallPromptEvent の型定義
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  // インストール
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  // オフライン
  isOffline: boolean;
  // 更新
  hasUpdate: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream: unknown }).MSStream;
    const isAndroid = /Android/.test(ua);
    // standalone = すでにPWAとしてインストール済み
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone: boolean }).standalone === true;

    return {
      canInstall: false,
      isInstalled,
      isIOS,
      isAndroid,
      isOffline: !navigator.onLine,
      hasUpdate: false,
    };
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    // ── インストールプロンプト (Android/Chrome) ────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(s => ({ ...s, canInstall: true }));
    };

    // ── インストール完了検知 ───────────────────────────────
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState(s => ({ ...s, canInstall: false, isInstalled: true }));
    };

    // ── オフライン/オンライン ─────────────────────────────
    const handleOffline = () => setState(s => ({ ...s, isOffline: true }));
    const handleOnline  = () => setState(s => ({ ...s, isOffline: false }));

    // ── SW 更新通知 ───────────────────────────────────────
    const handleUpdateAvailable = (e: Event) => {
      const { updateSW: fn } = (e as CustomEvent).detail;
      setUpdateSW(() => fn);
      setState(s => ({ ...s, hasUpdate: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  // ── アクション ──────────────────────────────────────────
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setState(s => ({ ...s, canInstall: false }));
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    updateSW?.();
    setState(s => ({ ...s, hasUpdate: false }));
  }, [updateSW]);

  return { state, install, applyUpdate };
}
