'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, X, Send } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../hooks/userAuth';
import { toast } from 'react-toastify';
import { trackEvent } from '../../lib/utils';

export enum FeedbackType {
  UP = 'up',
  DOWN = 'down'
}

export const DISLIKE_REASONS = [
  'Receita muito complicada',
  'Não gostei da combinação',
  'Demorada demais',
  'Ingredientes difíceis',
  'Não era o que eu queria',
];

// ─── Shared feedback logic hook ───
export function useFeedback(recipeId: string) {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);

  useEffect(() => {
    const checkExistingFeedback = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const recipeRef = doc(db, 'recipes', recipeId);
        const recipeSnap = await getDoc(recipeRef);

        if (recipeSnap.exists()) {
          const data = recipeSnap.data();
          const existingFeedback = data.feedback?.find(
            (f: { userId: string; type: string }) => f.userId === userId
          );

          if (existingFeedback) {
            setFeedback(existingFeedback.type as FeedbackType);
          }
        }
      } catch (error) {
        console.error('Error checking existing feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingFeedback();
  }, [recipeId]);

  const handleFeedback = async (type: FeedbackType) => {
    if (isSubmitting) return;
    if (feedback === type) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast.error('Você precisa estar logado para avaliar.');
      return;
    }

    setIsSubmitting(true);
    const previousFeedback = feedback;
    setFeedback(type);

    try {
      const recipeRef = doc(db, 'recipes', recipeId);
      const recipeSnap = await getDoc(recipeRef);

      if (recipeSnap.exists()) {
        const data = recipeSnap.data();
        const updatedFeedback = (data.feedback || []).filter(
          (f: { userId: string }) => f.userId !== userId
        );
        updatedFeedback.push({
          type,
          userId,
          timestamp: new Date().toISOString(),
        });

        await updateDoc(recipeRef, {
          feedback: updatedFeedback,
        });
      }

      if (type === FeedbackType.UP) {
        trackEvent('feedback_gostei', { recipeId });
      } else if (type === FeedbackType.DOWN) {
        trackEvent('feedback_nao_gostei', { recipeId });
        setShowReasonPicker(true);
      } else {
        toast.success('Obrigado pelo feedback!');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedback(previousFeedback);
      toast.error('Não foi possível registrar seu feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReason = async () => {
    const reason = selectedReason === 'Outro' ? customReason.trim() : selectedReason;
    if (!reason) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setIsSubmittingReason(true);

    try {
      const recipeRef = doc(db, 'recipes', recipeId);
      const recipeSnap = await getDoc(recipeRef);

      if (recipeSnap.exists()) {
        const data = recipeSnap.data();
        const updatedFeedback = (data.feedback || []).map(
          (f: { userId: string; type: string; timestamp: string; reason?: string }) => {
            if (f.userId === userId && f.type === FeedbackType.DOWN) {
              return { ...f, reason };
            }
            return f;
          }
        );

        await updateDoc(recipeRef, {
          feedback: updatedFeedback,
        });
      }

      toast.success('Obrigado pelo feedback! Sua opinião nos ajuda a melhorar as receitas.');

      setShowReasonPicker(false);
      setSelectedReason(null);
      setCustomReason('');
    } catch (error) {
      console.error('Error submitting reason:', error);
      toast.error('Não foi possível enviar o motivo. Tente novamente.');
    } finally {
      setIsSubmittingReason(false);
    }
  };

  const handleSkipReason = () => {
    setShowReasonPicker(false);
    setSelectedReason(null);
    setCustomReason('');
    toast.success('Obrigado pelo feedback!');
  };

  return {
    feedback,
    isSubmitting,
    isLoading,
    showReasonPicker,
    selectedReason,
    setSelectedReason,
    customReason,
    setCustomReason,
    isSubmittingReason,
    handleFeedback,
    handleSubmitReason,
    handleSkipReason,
  };
}

export type UseFeedbackReturn = ReturnType<typeof useFeedback>;

// ─── Shared feedback UI ───
interface FeedbackContentProps {
  feedback: FeedbackType | null;
  isSubmitting: boolean;
  showReasonPicker: boolean;
  selectedReason: string | null;
  setSelectedReason: (reason: string | null) => void;
  customReason: string;
  setCustomReason: (reason: string) => void;
  isSubmittingReason: boolean;
  handleFeedback: (type: FeedbackType) => void;
  handleSubmitReason: () => void;
  handleSkipReason: () => void;
}

export const FeedbackContent: React.FC<FeedbackContentProps> = ({
  feedback,
  isSubmitting,
  showReasonPicker,
  selectedReason,
  setSelectedReason,
  customReason,
  setCustomReason,
  isSubmittingReason,
  handleFeedback,
  handleSubmitReason,
  handleSkipReason,
}) => {
  return (
    <>
      {!showReasonPicker ? (
        <>
          <p className="text-center text-sm font-semibold text-[#2B2B2B] mb-3">
            Você gostou da receita?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleFeedback(FeedbackType.UP)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                feedback === FeedbackType.UP
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
              disabled={isSubmitting}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="font-medium">Gostei</span>
            </button>
            <button
              onClick={() => handleFeedback(FeedbackType.DOWN)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                feedback === FeedbackType.DOWN
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
              disabled={isSubmitting}
            >
              <ThumbsDown className="w-5 h-5" />
              <span className="font-medium">Não gostei</span>
            </button>
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#2B2B2B]">
              😕 O que não ficou bom?
            </p>
            <button
              onClick={handleSkipReason}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-3">
            {DISLIKE_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => {
                  setSelectedReason(reason);
                  setCustomReason('');
                }}
                className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
                  selectedReason === reason
                    ? 'bg-secondary text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-secondary/50'
                }`}
              >
                {reason}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedReason('Outro');
              }}
              className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
                selectedReason === 'Outro'
                  ? 'bg-secondary text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-secondary/50'
              }`}
            >
              Outro
            </button>
          </div>

          {selectedReason === 'Outro' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Conte-nos o que podemos melhorar..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:border-secondary transition-colors mb-3"
              rows={3}
            />
          )}

          <button
            onClick={handleSubmitReason}
            disabled={
              isSubmittingReason ||
              !selectedReason ||
              (selectedReason === 'Outro' && !customReason.trim())
            }
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Enviar
          </button>
        </div>
      )}
    </>
  );
};

// ─── Inline feedback section (existing) ───
interface FeedbackSectionProps {
  recipeId: string;
  sharedFeedback?: UseFeedbackReturn;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ recipeId, sharedFeedback }) => {
  const localFeedback = useFeedback(recipeId);
  const feedbackProps = sharedFeedback || localFeedback;

  if (feedbackProps.isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-center text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <FeedbackContent {...feedbackProps} />
    </div>
  );
};
