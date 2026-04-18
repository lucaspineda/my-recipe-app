'use client';

import { Plan } from '../../types';
import { Check, Crown, Star, Zap } from 'lucide-react';

interface OrderSummaryProps {
  plan: Plan;
}

export default function OrderSummary({ plan }: OrderSummaryProps) {
  const PlanIcon = plan.id === 1 ? Star : plan.id === 2 ? Zap : Crown;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumo</h2>

      {/* Plan info */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
          <PlanIcon className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{plan.name}</p>
          <p className="text-sm text-gray-500">Assinatura mensal</p>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-gray-100 pt-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Inclui:</p>
        <ul className="space-y-2">
          {plan.description?.split(',').map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">{feature.trim()}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Total */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total mensal</span>
          <span className="text-xl font-bold text-gray-900">
            R${plan.cost.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Cancele quando quiser. Sem taxas ocultas.</p>
      </div>
    </div>
  );
}
