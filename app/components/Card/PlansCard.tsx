'use client';

import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../hooks/userAuth';
import { Plan } from '../../types';
import { useUserStore } from '../../store/user';
import { formatDate } from '../../utils/date';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Check, Crown, Loader2, Star, Zap } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';

interface PlansCardProps {
  plan: Plan;
}

export default function PlansCard({ plan }: PlansCardProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();
  const router = useRouter();
  const expirationDate = formatDate(user?.plan.expiresAt as Timestamp);

  const notify = () => toast.error('Ocorreu um erro ao assinar o plano');

  const subscribe = async () => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const token = await auth.currentUser.getIdToken();
    const response = await axios.post(
      process.env.NEXT_PUBLIC_SERVER_BASE_URL + '/subscribe',
      {
        plan,
        uid: auth.currentUser.uid,
      },
      {
        headers: {
          Authorization: token,
        },
      },
    );
    return response.data;
  };

  const handlePlanSelecting = async () => {
    try {
      setLoading(true);
      trackEvent('select_plan_btn_clicked', { planId: plan.id, planName: plan.name, planCost: plan.cost });
      router.push(`/checkout/${plan.id}`);
    } catch (error) {
      notify();
      setLoading(false);
    }
  };

  const isPlanToBeExpired = plan.active && user.plan.toBeCanceled;
  const isUpgradable = !plan.active && plan.id > user.plan.planId;
  const isCurrentPlan = plan.active;

  const planIcon = plan.id === 1 ? Star : plan.id === 2 ? Zap : Crown;
  const PlanIcon = planIcon;

  return (
    <div
      className={`relative flex flex-col rounded-2xl transition-all duration-300 overflow-hidden ${
        plan.recommended
          ? 'bg-white ring-2 ring-secondary shadow-2xl md:scale-105 z-10'
          : 'bg-white shadow-lg hover:shadow-xl'
      }`}
    >
      {/* Recommended badge */}
      {plan.recommended && !isCurrentPlan && user.plan.planId !== 3 && (
        <div className="bg-secondary text-white text-center py-2.5 font-semibold text-sm tracking-wide">
          🌟 Mais Popular
        </div>
      )}

      {/* Active plan badge */}
      {isCurrentPlan && (
        <div className="bg-tertiary text-white text-center py-2.5 font-semibold text-sm tracking-wide">
          ✓ Plano Atual
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        {/* Plan icon & name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              plan.recommended ? 'bg-secondary/10' : 'bg-gray-100'
            }`}
          >
            <PlanIcon className={`w-5 h-5 ${plan.recommended ? 'text-secondary' : 'text-gray-500'}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            {plan.cost === 0 ? (
              <span className="text-4xl font-extrabold text-gray-900">Grátis</span>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-500">R$</span>
                <span className="text-4xl font-extrabold text-gray-900">
                  {plan?.cost?.toString().replace('.', ',')}
                </span>
                <span className="text-gray-500 text-sm font-medium">/ mês</span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          {plan.description}
          {user.plan.planId !== 3 && isCurrentPlan && (
            <span className="block mt-1 text-secondary font-medium">
              {user.plan.recipeCount} receitas restantes
            </span>
          )}
        </p>

        {/* Recipe count highlight */}
        <div
          className={`rounded-xl py-3 px-4 mb-6 flex items-center justify-center gap-2 ${
            plan.recommended ? 'bg-secondary/10' : 'bg-gray-50'
          }`}
        >
          <span className={`text-2xl font-bold leading-none ${plan.recommended ? 'text-secondary' : 'text-gray-900'}`}>
            {plan.id === 3 ? '∞' : plan.recipeCount}
          </span>
          <span className={`text-sm leading-none ${plan.recommended ? 'text-secondary/70' : 'text-gray-500'}`}>
            {plan.id === 3 ? 'receitas ilimitadas' : 'receitas / mês'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6" />

        {/* Features */}
        <div className="space-y-3 mb-8 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-700 text-sm">Receitas personalizadas com IA</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-700 text-sm">Salvar e compartilhar receitas favoritas</span>
          </div>
          {plan.id >= 2 && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700 text-sm">Geração de imagem na receita</span>
            </div>
          )}
          {plan.id >= 2 && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700 text-sm">Suporte prioritário</span>
            </div>
          )}
          {plan.id >= 2 && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700 text-sm">Gerar mais opções de receitas parecidas</span>
            </div>
          )}
          {plan.id >= 2 && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700 text-sm">Refinar receitas com IA</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        {isUpgradable && (
          <button
            disabled={loading}
            onClick={handlePlanSelecting}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              plan.recommended
                ? 'bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/25 hover:-translate-y-0.5'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Escolher Plano
          </button>
        )}

        {isCurrentPlan && !isPlanToBeExpired && (
          <div className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-center bg-gray-50 text-gray-400 border border-gray-200">
            Plano Ativo
          </div>
        )}

        {isPlanToBeExpired && (
          <div className="w-full py-3.5 px-6 rounded-xl text-sm text-center bg-red-50 text-red-600 font-medium border border-red-200">
            Expira em {expirationDate}
          </div>
        )}
      </div>
    </div>
  );
}
