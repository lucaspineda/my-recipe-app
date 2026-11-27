'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';
import { trackEvent } from '../../lib/analytics';
import { Plan } from '../../types';

const PREMIUM_PLAN_ID = 2;
// paywall_* events name the paywall in `source`; this one is the recipe-limit screen.
const PAYWALL_SOURCE = 'limit';

// Where the screen was opened from. recipe_limit_modal_opened uses the same names.
export type RecipeLimitEntry = 'meal_form' | 'meal_form_banner' | 'generate_options';

type PaywallOption = 'premium' | 'plans';
type DismissMethod = 'agora_nao' | 'close_button' | 'backdrop';

// The price comes from the `plans` catalog, like /plans and /checkout read it, so this screen
// always shows what checkout charges. One request per page load.
let premiumPlanRequest: Promise<Plan | null> | null = null;

function loadPremiumPlan(): Promise<Plan | null> {
  if (!premiumPlanRequest) {
    premiumPlanRequest = getDocs(collection(db, 'plans'))
      .then((snapshot) => {
        const plan = snapshot.docs.map((d) => d.data() as Plan).find((p) => Number(p.id) === PREMIUM_PLAN_ID);
        return plan ?? null;
      })
      .catch((error) => {
        console.error('Error loading the Premium plan:', error);
        premiumPlanRequest = null; // try again the next time the screen opens
        return null;
      });
  }
  return premiumPlanRequest;
}

const formatPrice = (cost: number) => `R$${Number(cost).toFixed(2).replace('.', ',')}`;

interface RecipeLimitModalProps {
  isOpen: boolean;
  entry: RecipeLimitEntry;
  onClose: () => void;
}

const RecipeLimitModal = ({ isOpen, entry, onClose }: RecipeLimitModalProps) => {
  const { user } = useUserStore();
  const [premiumPlan, setPremiumPlan] = useState<Plan | null>(null);
  const [planStatus, setPlanStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const viewTracked = useRef(false);

  const planId = Number(user?.plan?.planId) || 1;
  const isPremium = planId >= PREMIUM_PLAN_ID;
  const outOfRecipes = user?.plan?.recipeCount === 0;

  // Start loading the price once the user is out of recipes, so it's there when the screen opens.
  useEffect(() => {
    if (!isOpen && !outOfRecipes) return;
    let active = true;
    loadPremiumPlan().then((plan) => {
      if (!active) return;
      setPremiumPlan(plan);
      setPlanStatus(plan ? 'ready' : 'failed');
    });
    return () => {
      active = false;
    };
  }, [isOpen, outOfRecipes]);

  useEffect(() => {
    if (!isOpen) {
      viewTracked.current = false;
      return;
    }
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackEvent('paywall_viewed', { source: PAYWALL_SOURCE, entry, planId });
  }, [isOpen, entry, planId]);

  if (!isOpen) return null;

  const dismiss = (method: DismissMethod) => {
    trackEvent('recipe_limit_dismissed', { method, entry });
    onClose();
  };

  const selectOption = (option: PaywallOption) => {
    // Kept so the series goes on: before this screen, its one paid option was an "upgrade" button.
    trackEvent('recipe_limit_upgrade_chosen', { option, entry });
    trackEvent('paywall_option_selected', { source: PAYWALL_SOURCE, option, entry, planId });
    onClose();
  };

  const price = premiumPlan ? formatPrice(premiumPlan.cost) : null;
  const premiumRecipeCount = Number(premiumPlan?.recipeCount) || null;

  // Only what Premium unlocks today: the recipes it refills each billing period, the photo
  // (isPro in the recipe page) and refining a recipe. "Mais opções" is open to every plan.
  const premiumBenefits = [
    premiumRecipeCount ? `${premiumRecipeCount} receitas por mês` : 'Mais receitas todo mês',
    'Foto de cada receita, feita por IA',
    'Refinar a receita: mais leve, sem glúten ou trocando um ingrediente',
  ];

  return (
    <div
      className="p-4 fixed inset-0 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-limit-title"
    >
      <div className="fixed inset-0 bg-black opacity-80" onClick={() => dismiss('backdrop')} />
      <div className="bg-white rounded-2xl shadow-lg z-50 w-full max-w-md relative flex flex-col max-h-[calc(100dvh-2rem)]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => dismiss('close_button')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto min-h-0 px-6 pt-6">
          <div className="text-center mb-5 px-4">
            <span className="text-4xl" aria-hidden="true">
              🍳
            </span>
            <h3 id="recipe-limit-title" className="text-xl font-bold text-[#2B2B2B] mt-2">
              {isPremium ? 'Você usou todas as receitas do seu plano' : 'Suas 3 receitas grátis acabaram'}
            </h3>
            {!isPremium && (
              <p className="text-sm text-[#5C5C5C] mt-1">Continue criando receitas com o que você tem em casa.</p>
            )}
          </div>

          {!isPremium && (
            <div className="rounded-xl border-2 border-[#F57C00] bg-[#FFF7F0] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="flex items-center gap-1.5 text-base font-bold text-[#2B2B2B]">
                  <Sparkles className="w-4 h-4 text-[#F57C00]" />
                  Premium
                </span>
                {price ? (
                  <span className="text-[#2B2B2B] whitespace-nowrap">
                    <span className="text-lg font-extrabold">{price}</span>
                    <span className="text-sm text-[#5C5C5C]">/mês</span>
                  </span>
                ) : planStatus === 'loading' ? (
                  <span className="h-6 w-24 rounded bg-[#F57C00]/15 animate-pulse" aria-hidden="true" />
                ) : null}
              </div>

              <ul className="space-y-2 mb-4">
                {premiumBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-[#2B2B2B]">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#F57C00]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout/${PREMIUM_PLAN_ID}`}
                onClick={() => selectOption('premium')}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white no-underline bg-gradient-to-r from-[#F57C00] to-[#FF9800] hover:from-[#E64A19] hover:to-[#F57C00] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Assinar Premium
              </Link>
              <p className="text-xs text-center text-[#5C5C5C] mt-2">Cancele quando quiser</p>
            </div>
          )}
        </div>

        <div className="px-6 pt-3 pb-4 flex flex-col items-center">
          <Link
            href="/plans"
            onClick={() => selectOption('plans')}
            className={
              isPremium
                ? 'w-full py-3 rounded-xl font-semibold text-sm text-center text-white no-underline bg-[#F57C00] hover:bg-[#E64A19] transition-colors'
                : 'py-2 text-sm font-semibold text-[#F57C00] hover:text-[#E64A19] underline underline-offset-2 transition-colors'
            }
          >
            Ver todos os planos
          </Link>
          <button
            type="button"
            onClick={() => dismiss('agora_nao')}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeLimitModal;
