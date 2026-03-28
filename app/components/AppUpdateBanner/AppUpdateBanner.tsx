'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

export default function AppUpdateBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  };

  if (dismissed) return null;

  // Don't show on Android if the prompt isn't ready yet
  if (!isIOS && !deferredPrompt) return null;

  return (
    <>
      <div className="lg:hidden w-full bg-secondary text-white px-4 py-3 flex flex-col gap-2 text-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-snug">
            🎉 Novidade! Baixe Chefinho IA direto no seu celular.
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white transition-colors p-0.5 shrink-0 mt-0.5"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={isIOS ? () => setShowIOSGuide(true) : handleInstall}
          className="self-start flex items-center gap-1.5 bg-white text-secondary font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-white/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {isIOS ? 'Como instalar' : 'Adicionar à tela inicial'}
        </button>
      </div>

      {/* iOS install guide modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60" onClick={() => setShowIOSGuide(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Instalar no iPhone</h2>
              <button onClick={() => setShowIOSGuide(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white font-bold text-xs shrink-0 mt-0.5">1</span>
                <span>Toque no ícone de <strong>Compartilhar</strong> na barra inferior do Safari <Share className="inline w-4 h-4 text-blue-500 mx-0.5" /></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white font-bold text-xs shrink-0 mt-0.5">2</span>
                <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white font-bold text-xs shrink-0 mt-0.5">3</span>
                <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full bg-secondary text-white font-semibold py-2.5 rounded-xl text-sm"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
