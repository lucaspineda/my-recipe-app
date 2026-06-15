'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../hooks/userAuth';
import { useToast } from '../../../hooks/use-toast';
import { trackEvent } from '../../../lib/analytics';
import {
  MEAL_SLOT_LABELS,
  MealSlotKey,
  buildEmptyWeekSlots,
  formatDayLabel,
  getMealPlanDocumentId,
  getWeekDayOptions,
  getWeekEndDate,
  getWeekStartDate,
  toDateKey,
} from '../../../planejamento/shared';

interface UseRecipeMealPlannerFlowParams {
  recipeId: string;
  recipeTitle?: string;
  user: { uid: string } | null;
}

export function useRecipeMealPlannerFlow({ recipeId, recipeTitle, user }: UseRecipeMealPlannerFlowParams) {
  const router = useRouter();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<MealSlotKey>('almoco');
  const [servings, setServings] = useState('2');
  const [note, setNote] = useState('');
  const [savingMeal, setSavingMeal] = useState(false);

  const weekStart = useMemo(() => getWeekStartDate(), []);
  const weekStartDate = useMemo(() => toDateKey(weekStart), [weekStart]);
  const weekEndDate = useMemo(() => toDateKey(getWeekEndDate(weekStart)), [weekStart]);
  const weekDayOptions = useMemo(() => getWeekDayOptions(weekStartDate), [weekStartDate]);

  const resetFlow = () => {
    setSelectedDateKey(weekDayOptions[0]?.dateKey || '');
    setSelectedSlot('almoco');
    setServings('2');
    setNote('');
    setSavingMeal(false);
  };

  const openModal = () => {
    if (!user?.uid) {
      trackEvent('meal_planner_recipe_login_redirect', {
        recipeId,
        source: 'recipe_ingredients',
      });
      router.push('/login');
      return;
    }

    if (!recipeTitle) {
      toast({
        title: 'Receita indisponível',
        description: 'Não foi possível carregar os dados da receita para planejar.',
        variant: 'destructive',
      });
      return;
    }

    resetFlow();
    setModalOpen(true);
    trackEvent('meal_planner_recipe_modal_opened', {
      recipeId,
      source: 'recipe_ingredients',
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    resetFlow();
  };

  const savePlannedMeal = async () => {
    if (!user?.uid || !recipeTitle || !selectedDateKey || !selectedSlot) {
      return;
    }

    const nextServings = Number(servings);

    if (!Number.isFinite(nextServings) || nextServings <= 0) {
      toast({
        title: 'Porções inválidas',
        description: 'Digite um número de porções maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    const planId = getMealPlanDocumentId(user.uid, weekStartDate);
    const planRef = doc(db, 'mealPlans', planId);
    setSavingMeal(true);

    try {
      const planSnapshot = await getDoc(planRef);

      if (!planSnapshot.exists()) {
        await setDoc(planRef, {
          userId: user.uid,
          weekStartDate,
          weekEndDate,
          slots: buildEmptyWeekSlots(weekStartDate),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await updateDoc(planRef, {
        [`slots.${selectedDateKey}.${selectedSlot}`]: {
          recipeId,
          recipeTitle,
          servings: nextServings,
          note: note.trim() || null,
          addedFrom: 'recipe-page',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      trackEvent('meal_planner_recipe_saved', {
        recipeId,
        source: 'recipe_ingredients',
        slot: selectedSlot,
      });

      toast({
        title: 'Refeição planejada',
        description: `${recipeTitle} foi adicionada em ${formatDayLabel(selectedDateKey)} no ${MEAL_SLOT_LABELS[selectedSlot].toLowerCase()}.`,
      });

      closeModal();
    } catch (error) {
      console.error('Error saving planned meal from recipe:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a receita ao planejamento.',
        variant: 'destructive',
      });
    } finally {
      setSavingMeal(false);
    }
  };

  const viewPlanner = () => {
    router.push('/planejamento');
  };

  return {
    modalOpen,
    weekDayOptions,
    selectedDateKey,
    selectedSlot,
    servings,
    note,
    savingMeal,
    openModal,
    closeModal,
    setSelectedDateKey,
    setSelectedSlot,
    setServings,
    setNote,
    savePlannedMeal,
    viewPlanner,
  };
}