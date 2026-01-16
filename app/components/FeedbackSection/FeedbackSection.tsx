'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../hooks/userAuth';
import { useToast } from '../../hooks/use-toast';

export enum FeedbackType {
  UP = 'up',
  DOWN = 'down'
}

interface FeedbackSectionProps {
  recipeId: string;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ recipeId }) => {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user already voted
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
    if (feedback === type) return; // Already selected this option

    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para avaliar.',
        variant: 'destructive',
      });
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
        // Remove previous feedback from user and add new one
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

      toast({
        title: 'Obrigado!',
        description: previousFeedback ? 'Seu feedback foi atualizado.' : 'Seu feedback foi registrado.',
      });

      // Track in Clarity if available
      if (typeof window !== 'undefined' && window.clarity) {
        window.clarity('event', 'recipe_feedback', type);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedback(previousFeedback);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar seu feedback. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-center text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
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
    </div>
  );
};
