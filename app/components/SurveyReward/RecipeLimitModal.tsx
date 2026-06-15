'use client';

import React from 'react';
import { Sparkles, X, MessageSquareText } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';

interface RecipeLimitModalProps {
  isOpen: boolean;
  surveyAlreadyCompleted: boolean;
  onClose: () => void;
  onStartSurvey: () => void;
  onUpgrade: () => void;
}

const RecipeLimitModal = ({
  isOpen,
  surveyAlreadyCompleted,
  onClose,
  onStartSurvey,
  onUpgrade,
}: RecipeLimitModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="p-4 fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-80" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-lg p-6 z-50 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-4xl">🎉</span>
          <h3 className="text-xl font-bold text-[#2B2B2B] mt-2">
            Você atingiu o limite de receitas!
          </h3>
        </div>

        <div className="space-y-3">
          {!surveyAlreadyCompleted && (
            <>
              <div className="bg-[#F57C00]/5 border border-[#F57C00]/20 rounded-xl p-4">
                <p className="text-sm text-[#2B2B2B] font-medium mb-1">
                  Quer ganhar +5 receitas extras?
                </p>
                <p className="text-xs text-[#5C5C5C] mb-3">
                  Nos ajude a melhorar respondendo 3 perguntas rápidas (30 segundos)
                </p>
                <button
                  onClick={() => {
                    trackEvent('recipe_limit_survey_chosen');
                    onStartSurvey();
                  }}
                  className="w-full py-3 rounded-lg font-semibold text-sm text-white bg-[#F57C00] hover:bg-[#E64A19] transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquareText className="w-4 h-4" />
                  Responder e ganhar 5 receitas
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          <button
            onClick={() => {
              trackEvent('recipe_limit_upgrade_chosen');
              onUpgrade();
            }}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#F57C00] to-[#FF9800] hover:from-[#E64A19] hover:to-[#F57C00] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade pra Premium — R$9,90/mês
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeLimitModal;
