'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { auth, db } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';
import { Plan } from '../../types';
import { trackPageVisit } from '../../lib/analytics';
import CheckoutForm from '../../components/Checkout/CheckoutForm';
import OrderSummary from '../../components/Checkout/OrderSummary';
import { ArrowLeft } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { user } = useUserStore();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageVisit('checkout');
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'plans'));
        const plans: Plan[] = [];
        querySnapshot.forEach((doc) => {
          plans.push(doc.data() as Plan);
        });
        const found = plans.find((p) => p.id === Number(planId));
        if (found) {
          setPlan(found);
        } else {
          router.push('/plans');
        }
      } catch (e) {
        console.error('Error fetching plan:', e);
        router.push('/plans');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPlan();
    }
  }, [user, planId, router]);

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => router.push('/plans')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar para planos</span>
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Finalizar assinatura</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Checkout Form - 3 cols */}
          <div className="md:col-span-3">
            <Elements stripe={stripePromise}>
              <CheckoutForm plan={plan} user={user} />
            </Elements>
          </div>

          {/* Order Summary - 2 cols */}
          <div className="md:col-span-2">
            <OrderSummary plan={plan} />
          </div>
        </div>
      </div>
    </div>
  );
}
