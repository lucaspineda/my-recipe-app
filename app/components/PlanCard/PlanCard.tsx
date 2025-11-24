import React from 'react';
import { Check } from 'lucide-react';
import { Plan } from '../../types';

interface PlanCardProps {
  plan: Plan;
  onSelectPlan: () => void;
  buttonText?: string;
}

export default function PlanCard({ plan, onSelectPlan, buttonText = 'Começar Agora' }: PlanCardProps) {
  return (
    <div
      className={`flex flex-col bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        plan.recommended ? 'ring-2 ring-secondary transform md:scale-105' : ''
      }`}
    >
      {plan.recommended && (
        <div className="bg-secondary text-white text-center py-2 font-semibold text-sm">🌟 Mais Popular</div>
      )}

      <div className="p-8 flex flex-col flex-1">
        <h3 className="text-2xl font-bold mb-2 text-gray-800">{plan.name}</h3>

        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">R$ {plan?.cost?.toString().replace('.', ',')}</span>
            <span className="text-gray-500 ml-2">/ mês</span>
          </div>
        </div>

        {plan.description && <p className="text-gray-600 mb-8 flex-1">{plan.description}</p>}

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-700">
              {plan.id === 3 ? 'Receitas ilimitadas' : `${plan.recipeCount} receitas por mês`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-700">Receitas personalizadas com IA</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-700">Salvar e compartilhar receitas favoritas</span>
          </div>
          {plan.id >= 2 && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700">Suporte prioritário</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={onSelectPlan}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
            plan.recommended
              ? 'bg-secondary text-white hover:shadow-lg transform hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
