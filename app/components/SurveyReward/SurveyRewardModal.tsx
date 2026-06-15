'use client';

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';
import { trackEvent } from '../../lib/analytics';

interface SurveyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const BONUS_RECIPES = 5;

const SurveyRewardModal = ({ isOpen, onClose, onComplete }: SurveyRewardModalProps) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [wouldPay, setWouldPay] = useState<boolean | null>(null);
  const [wouldPayWhyNot, setWouldPayWhyNot] = useState('');

  // Step 2
  const [desiredFeature, setDesiredFeature] = useState('');

  // Step 3
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Step 4
  const [whatsapp, setWhatsapp] = useState('');

  const { user } = useUserStore();

  if (!isOpen) return null;

  const canAdvanceStep1 = wouldPay === true || (wouldPay === false && wouldPayWhyNot.trim().length > 0);
  const canAdvanceStep2 = desiredFeature.trim().length > 0;
  const canAdvanceStep3 = rating > 0 && ratingComment.trim().length > 0;

  const handleNext = () => {
    trackEvent('survey_step_completed', {
      step,
      ...(step === 1 && { wouldPay, wouldPayWhyNot: wouldPayWhyNot.trim() || undefined }),
      ...(step === 2 && { desiredFeature: desiredFeature.trim() }),
      ...(step === 3 && { rating, ratingComment: ratingComment.trim() }),
    });
    setStep((s) => s + 1);
  };

  const handleSubmit = async (skipWhatsapp: boolean) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await addDoc(collection(db, 'survey_responses'), {
        userId,
        wouldPay,
        wouldPayWhyNot: wouldPay === false ? wouldPayWhyNot.trim() : null,
        desiredFeature: desiredFeature.trim(),
        rating,
        ratingComment: ratingComment.trim(),
        whatsapp: !skipWhatsapp && whatsapp.trim() ? whatsapp.trim() : null,
        createdAt: serverTimestamp(),
      });

      const currentCount = user?.plan?.recipeCount ?? 0;
      const newCount = currentCount + BONUS_RECIPES;

      await updateDoc(doc(db, 'users', userId), {
        surveyCompletedAt: serverTimestamp(),
        'plan.recipeCount': newCount,
      });

      useUserStore.getState().updateRecipesCount(newCount);

      trackEvent('survey_completed', {
        bonusRecipes: BONUS_RECIPES,
        hasWhatsapp: !skipWhatsapp && !!whatsapp.trim(),
      });

      if (!skipWhatsapp && whatsapp.trim()) {
        trackEvent('survey_step_completed', { step: 4, hasWhatsapp: true });
      }

      onComplete();
    } catch (err) {
      console.error('Error submitting survey:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-80" />
      <div className="bg-white rounded-2xl shadow-lg p-6 z-50 w-full max-w-md max-h-[85vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#F57C00]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#2B2B2B]">Pergunta 1 de 3</h3>
              <p className="text-[#5C5C5C] mt-1">
                Você pagaria para receber mais créditos para gerar receitas?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setWouldPay(true)}
                className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-colors ${
                  wouldPay === true
                    ? 'border-[#F57C00] bg-[#F57C00]/10 text-[#F57C00]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Sim
              </button>
              <button
                onClick={() => setWouldPay(false)}
                className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-colors ${
                  wouldPay === false
                    ? 'border-[#F57C00] bg-[#F57C00]/10 text-[#F57C00]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Não
              </button>
            </div>

            {wouldPay === false && (
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] block mb-1">
                  Por quê? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={wouldPayWhyNot}
                  onChange={(e) => setWouldPayWhyNot(e.target.value)}
                  placeholder="Conte pra gente o motivo..."
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F57C00]/50 resize-none"
                />
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!canAdvanceStep1}
              className="w-full py-3 rounded-lg font-semibold text-white bg-[#F57C00] hover:bg-[#E64A19] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#2B2B2B]">Pergunta 2 de 3</h3>
              <p className="text-[#5C5C5C] mt-1">
                Qual outra funcionalidade você gostaria de ver no Chefinho?
              </p>
            </div>

            <textarea
              value={desiredFeature}
              onChange={(e) => setDesiredFeature(e.target.value)}
              placeholder="Ex: lista de compras, receitas em vídeo, plano alimentar..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F57C00]/50 resize-none"
            />

            <button
              onClick={handleNext}
              disabled={!canAdvanceStep2}
              className="w-full py-3 rounded-lg font-semibold text-white bg-[#F57C00] hover:bg-[#E64A19] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#2B2B2B]">Pergunta 3 de 3</h3>
              <p className="text-[#5C5C5C] mt-1">
                No geral, o que está achando do Chefinho?
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-[#F57C00] text-[#F57C00]'
                        : 'fill-none text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-[#2B2B2B] block mb-1">
                Conte mais sobre sua experiência <span className="text-red-500">*</span>
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="O que você mais gosta? O que podemos melhorar?"
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F57C00]/50 resize-none"
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!canAdvanceStep3}
              className="w-full py-3 rounded-lg font-semibold text-white bg-[#F57C00] hover:bg-[#E64A19] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Step 4 - Thank you + optional WhatsApp */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-4xl">🙏</span>
              <h3 className="text-lg font-bold text-[#2B2B2B] mt-2">Obrigado pelo seu feedback!</h3>
              <p className="text-[#5C5C5C] mt-1 text-sm">
                Seria de muita ajuda se você estiver disposto(a) a participar de uma entrevista rápida para nos ajudar a melhorar o Chefinho.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-[#2B2B2B] block mb-1">
                WhatsApp (opcional)
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F57C00]/50"
              />
            </div>

            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="w-full py-3 rounded-lg font-semibold text-white bg-[#F57C00] hover:bg-[#E64A19] disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Enviando...' : 'Enviar e ganhar receitas'}
            </button>

            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Pular e ganhar receitas
            </button>

            <button
              onClick={() => setStep(3)}
              disabled={submitting}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyRewardModal;
