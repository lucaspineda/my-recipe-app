import React from 'react';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { Plan } from '../../types';

interface PlanCardProps {
  plan: Plan;
  onSelectPlan: () => void;
  buttonText?: string;
}

export default function PlanCard({ plan, onSelectPlan, buttonText = 'Começar Agora' }: PlanCardProps) {
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
      {plan.recommended && (
        <div className="bg-secondary text-white text-center py-2.5 font-semibold text-sm tracking-wide">
          🌟 Mais Popular
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
        {plan.description && (
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{plan.description}</p>
        )}

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
        </div>

        {/* CTA Button */}
        <button
          onClick={onSelectPlan}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
            plan.recommended
              ? 'bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/25 hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
