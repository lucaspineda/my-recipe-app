'use client';

import { doc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { auth, db } from '../../hooks/userAuth';
import Button from '../Button/Button';
import { Plan, User } from '../../types';
import { useUserStore } from '../../store/user';
import { formatDate } from '../../utils/date';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface PlansCardProps {
  plan: Plan;
}

export default function PlansCard({ plan }: PlansCardProps) {
  const [loading, setLoading] = useState(false);
  const { setUser, user } = useUserStore();
  const router = useRouter();
  const expirationDate = formatDate(user?.plan.expiresAt as Timestamp);

  const notify = () => toast.error('Ocorreu um erro ao assinar o plano');

  const subscribe = async () => {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_SERVER_BASE_URL + '/subscribe',
      {
        plan,
        uid: auth.currentUser.uid,
      },
      {
        headers: {
          Authorization: (await auth.currentUser.getIdToken()).toString(),
        },
      },
    );
    return response.data;
  };

  const handlePlanSelecting = async () => {
    try {
      setLoading(true);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      const response = await subscribe();
      const redirectLink = response.url;
      router.push(redirectLink);
    } catch (error) {
      notify();
    } finally {
      setLoading(false);
    }
  };

  const isPlanToBeExpired = plan.active && user.plan.toBeCanceled;
  return (
    <>
      <div className="flex flex-col bg-white rounded-md py-4 px-8">
        <div className="flex content-center mb-2 justify-between">
          <h3 className="">{plan.name}</h3>
          {plan.recommended && !plan.active && user.plan.planId !== 3 && (
            <span
              className="bg-white border-secondary border text-secondary px-1 w-min rounded-md
              self-center text-sm"
            >
              Recomendado
            </span>
          )}
          {plan.active && (
            <span
              className="bg-white border-secondary border text-secondary px-1 w-min rounded-md
              self-center text-sm"
            >
              Atual
            </span>
          )}
        </div>
        <div>
          <span className="text-2xl font-semibold">R$ {plan?.cost?.toString().replace('.', ',')}</span>
          <span>/ Mês</span>
        </div>
        <p className="mb-6 mt-2 font-normal">
          {plan.description}
          {user.plan.planId !== 3 && plan.active && (
            <span className=""> ({user.plan.recipeCount} receitas restantes)</span>
          )}
        </p>
        {!plan.active && plan.id > user.plan.planId && (
          <Button
            loading={loading}
            className="py-2 px-4 w-min text-white rounded-md
        border-none shadow-lg self-center"
            onClick={handlePlanSelecting}
          >
            Escolher
          </Button>
        )}
        {isPlanToBeExpired && <div>Expira em {expirationDate}</div>}
      </div>
    </>
  );
}
