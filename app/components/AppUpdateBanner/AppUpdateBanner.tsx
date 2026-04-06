'use client';

import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import { AppInstallGuideModal, useAppInstallPrompt } from '../Pwa/AppInstallPrompt';

export default function AppUpdateBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { isIOS, canOfferInstall, showIOSGuide, setShowIOSGuide, openInstallFlow } = useAppInstallPrompt();

  const handleInstall = async () => {
    await openInstallFlow('banner');
    if (!isIOS) {
      setDismissed(true);
    }
  };

  if (dismissed) return null;

  if (!canOfferInstall) return null;

  return (
    <>
      <div className="lg:hidden w-full bg-secondary text-white px-4 py-3 flex flex-col gap-2 text-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-snug">
            🎉 Novidade! Baixe Chefinho IA direto no seu celular.
          </p>
          <button
            onClick={() => { trackEvent('pwa_banner_dismissed'); setDismissed(true); }}
            className="text-white/70 hover:text-white transition-colors p-0.5 shrink-0 mt-0.5"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="self-start flex items-center gap-1.5 bg-white text-secondary font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-white/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {isIOS ? 'Como instalar' : 'Adicionar à tela inicial'}
        </button>
      </div>

      <AppInstallGuideModal
        isOpen={showIOSGuide}
        onClose={() => {
          trackEvent('pwa_ios_guide_dismissed', { source: 'banner' });
          setShowIOSGuide(false);
        }}
      />
    </>
  );
}
