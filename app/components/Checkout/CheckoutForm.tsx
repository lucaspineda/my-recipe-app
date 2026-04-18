'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { auth } from '../../hooks/userAuth';
import { Plan, User } from '../../types';
import { trackEvent } from '../../lib/analytics';
import { Loader2, Lock } from 'lucide-react';

interface CheckoutFormProps {
  plan: Plan;
  user: User;
}

export default function CheckoutForm({ plan, user }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Usuário não autenticado');

      trackEvent('checkout_started', { planId: plan.id, planName: plan.name });

      // Step 1: Create SetupIntent + Customer
      const setupResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/subscription/setup-intent`,
        { uid: auth.currentUser!.uid },
        { headers: { Authorization: token } },
      );

      const { clientSecret, customerId } = setupResponse.data;

      // Step 2: Confirm card with Stripe
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user.email,
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Erro ao processar o cartão');
        trackEvent('checkout_card_error', { error: stripeError.message });
        setLoading(false);
        return;
      }

      // Step 3: Confirm subscription on backend
      const confirmResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/subscription/confirm-subscription`,
        {
          customerId,
          paymentMethodId: setupIntent.payment_method,
          plan,
        },
        { headers: { Authorization: token } },
      );

      trackEvent('checkout_completed', {
        planId: plan.id,
        planName: plan.name,
        subscriptionId: confirmResponse.data.subscriptionId,
      });

      router.push('/plans/thank-you');
    } catch (err: any) {
      console.error('Checkout error:', err);
      const message = err?.response?.data?.message || 'Erro ao processar pagamento. Tente novamente.';
      setError(message);
      trackEvent('checkout_error', { error: message });
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Dados do pagamento</h2>

      <form onSubmit={handleSubmit}>
        {/* Card Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cartão de crédito</label>
          <div className="border border-gray-300 rounded-lg p-4 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    '::placeholder': { color: '#9ca3af' },
                  },
                  invalid: { color: '#ef4444' },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-secondary text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            `Assinar por R$${plan.cost.toFixed(2).replace('.', ',')}/mês`
          )}
        </button>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs">Pagamento seguro processado pelo Stripe</span>
        </div>
      </form>

      {/* PIX option */}
      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Prefere pagar com PIX?{' '}
          <a
            href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20pagar%20com%20PIX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary font-semibold hover:underline"
          >
            Entre em contato com nosso suporte
          </a>
        </p>
      </div>
    </div>
  );
}
