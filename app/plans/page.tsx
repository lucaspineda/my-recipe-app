'use client';
import React, { useEffect, useState } from 'react';
import PlansCard from '../components/Card/PlansCard';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db, useUserAuth } from '../hooks/userAuth';
import { Plan } from '../types';
import { useUserStore } from '../store/user';
import Modal from '../components/Modal/Modal';
import Button from '../components/Button/Button';
import { formatDate } from '../utils/date';
import { trackEvent, trackPageVisit } from '../lib/analytics';
import { billingErrorMessage, postBilling } from '../lib/billingApi';

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const { user } = useUserStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { getUser } = useUserAuth();

  useEffect(() => {
    trackPageVisit('plans-private');
  }, []);

  const getPlans = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'plans'));
      const localPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        localPlans.push(doc.data() as Plan);
      });
      localPlans.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
      checkUsersActivePlan(localPlans);
      setPlans(localPlans);
    } catch (e) {
      console.log('Error getting plans:', e);
    }
  };

  const checkUsersActivePlan = (localPlans: Plan[]) => {
    localPlans.forEach((plan) => {
      if (plan.id === user.plan.planId) {
        plan.active = true;
      }
    });
  };

  const handlePlanCanceling = async () => {
    setLoading(true);
    setCancelError(null);
    try {
      // Cancels in Stripe at the end of the paid period; the backend also marks plan.toBeCanceled.
      await postBilling<{ cancelAt: string | null }>('cancel');
      trackEvent('subscription_cancel_requested', { planId: user.plan.planId });
      await getUser();
      setModalOpen(false);
    } catch (e) {
      console.log('Error canceling plan:', e);
      setCancelError(
        billingErrorMessage(e, 'Não conseguimos cancelar agora. Tente de novo ou fale com o suporte no WhatsApp.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = formatDate(user?.plan.expiresAt as Timestamp);
  const premiumEndsOn = formatDate((user?.billing?.cancelAt ?? user?.plan.expiresAt) as Timestamp);

  useEffect(() => {
    if (user) {
      getPlans();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex justify-center min-h-screen">
      <main className="container flex flex-col px-4 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Planos</h1>
          <p className="text-lg text-gray-600 max-w-xl">Crie receitas com o plano certo para você</p>
          <p className="text-sm text-gray-400 mt-2">Cancele quando quiser • Sem taxas ocultas</p>
        </div>

        {/* Plans Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start mb-12">
          {plans.map((plan) => (
            <PlansCard key={plan.id} plan={plan} />
          ))}
        </section>

        {/* Cancel Plan Section */}
        {user.plan.planId !== 1 && !user.plan.toBeCanceled && (
          <div className="max-w-lg mx-auto w-full">
            <div className="bg-white rounded-2xl border border-red-100 p-6 text-center">
              <p className="font-medium text-gray-900 mb-2">Cancelar plano</p>
              <p className="text-sm text-gray-500 mb-4">
                Seu plano continua até o fim do período já pago. Depois disso, você volta para o plano Básico.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors underline underline-offset-2"
              >
                Cancelar meu plano
              </button>
            </div>
          </div>
        )}

        {user.plan.planId !== 1 && user.plan.toBeCanceled && (
          <div className="max-w-lg mx-auto w-full">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="font-medium text-gray-900 mb-1">Assinatura cancelada</p>
              <p className="text-sm text-gray-500">
                {premiumEndsOn
                  ? `Seu ${user.plan.name} continua até ${premiumEndsOn}. Depois disso, você volta para o plano Básico.`
                  : 'Você volta para o plano Básico no fim do período já pago.'}
              </p>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <p className="font-medium">Confirmar Cancelamento de Plano</p>
          <p className="font-normal mt-2">
            Tem certeza que deseja cancelar seu plano? Você ainda terá acesso as funcionalidades do seu plano até dia{' '}
            {formattedDate}
          </p>
          {cancelError && <p className="text-sm text-red-600 mt-3">{cancelError}</p>}
          <div className="flex gap-4 mt-4">
            <Button color="bg-red-500" loading={loading} onClick={handlePlanCanceling}>
              Cancelar Plano
            </Button>
            <Button onClick={() => setModalOpen(false)}>Voltar</Button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
