'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useUserStore } from '../../store/user';
import { trackEvent } from '../../lib/analytics';
import { billingErrorMessage, postBilling, PIX_SUPPORT_WHATSAPP } from '../../lib/billingApi';

const PIX_MESSAGE = 'Olá, o pagamento do meu Premium falhou e quero pagar com Pix';

// Shown on every page while a renewal has failed and Stripe is still retrying (billing.status "past_due").
// The user keeps the plan meanwhile; without a new card or a Pix payment, Stripe ends the subscription.
export default function PaymentIssueBanner() {
  const { user } = useUserStore();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user?.billing?.status !== 'past_due') return null;

  const updateCard = async () => {
    setOpening(true);
    setError(null);
    trackEvent('payment_issue_update_card_click');
    try {
      const { url } = await postBilling<{ url: string }>('portal', { returnUrl: window.location.href });
      window.location.assign(url);
    } catch (err) {
      setError(billingErrorMessage(err, 'Não conseguimos abrir a página de pagamento. Tente de novo ou pague com Pix.'));
      setOpening(false);
    }
  };

  return (
    <div role="alert" className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm">
      <div className="max-w-6xl mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2 text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">Não conseguimos cobrar seu cartão.</span> Atualize o pagamento ou pague com
            Pix para continuar no Premium.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={updateCard}
            disabled={opening}
            className="bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-amber-700 transition-colors disabled:opacity-60"
          >
            {opening ? 'Abrindo…' : 'Atualizar cartão'}
          </button>
          <a
            href={`${PIX_SUPPORT_WHATSAPP}?text=${encodeURIComponent(PIX_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('payment_issue_pix_click')}
            className="border border-amber-600 text-amber-800 font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
          >
            Pagar com Pix
          </a>
        </div>
      </div>
      {error && <p className="max-w-6xl mx-auto text-red-600 mt-2">{error}</p>}
    </div>
  );
}
