'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { getPlatform, isRunningAsPWA, Platform } from '../../lib/utils';
import { trackEvent } from '../../lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface AppInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppInstallNudgeModalProps {
  isOpen: boolean;
  isIOS: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function useAppInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const detectedPlatform = getPlatform();
    const runningAsPwa = isRunningAsPWA();

    setPlatform(detectedPlatform);
    setIsInstallable(!runningAsPwa && (detectedPlatform === 'ios' || detectedPlatform === 'android'));

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const isIOS = platform === 'ios';
  const canOfferInstall = isInstallable && (isIOS || Boolean(deferredPrompt));

  const openInstallFlow = async (source: string) => {
    if (!canOfferInstall) return null;

    if (isIOS) {
      trackEvent('pwa_ios_guide_opened', { source });
      setShowIOSGuide(true);
      return 'ios-guide-opened';
    }

    if (!deferredPrompt) return null;

    trackEvent('pwa_install_prompt_triggered', { source });
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    trackEvent('pwa_install_prompt_result', { outcome, source });
    setDeferredPrompt(null);
    return outcome;
  };

  return {
    platform,
    isIOS,
    canOfferInstall,
    showIOSGuide,
    setShowIOSGuide,
    openInstallFlow,
  };
}

export function AppInstallGuideModal({ isOpen, onClose }: AppInstallGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 mb-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Instalar no iPhone</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ol className="space-y-4 text-sm text-gray-700">
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white font-bold text-xs shrink-0 mt-0.5">1</span>
            <span>Toque no ícone de <strong>Compartilhar</strong> <Share className="inline w-4 h-4 text-blue-500 mx-0.5" /> na barra do navegador</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white font-bold text-xs shrink-0 mt-0.5">2</span>
            <span>Role para baixo e toque em <strong>Adicionar à Tela de Início</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white font-bold text-xs shrink-0 mt-0.5">3</span>
            <span>Toque em <strong>Adicionar</strong> no canto superior direito</span>
          </li>
        </ol>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-secondary text-white font-semibold py-2.5 rounded-xl text-sm"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}

export function AppInstallNudgeModal({ isOpen, isIOS, onClose, onConfirm }: AppInstallNudgeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl p-6 z-50 w-full max-w-sm animate-fade-in relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">Chefinho IA no seu celular</p>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Quer baixar o app?</h3>
          <p className="text-sm text-gray-600 mb-5">
            Instale o Chefinho IA para abrir mais rápido e usar como app direto na tela inicial.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-white font-semibold py-3 rounded-xl text-sm"
          >
            <Download className="w-4 h-4" />
            {isIOS ? 'Ver como instalar' : 'Adicionar à tela inicial'}
          </button>
          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}