'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../hooks/userAuth';
import Link from 'next/link';
import { Card } from '../ui/card';
import { ChefHat, Clock, ArrowRight, CalendarRange } from 'lucide-react';
import { useRecipeStore } from '../store/recipe';
import { useUserStore } from '../store/user';
import { trackPageVisit } from '../lib/analytics';
import { Button } from '../ui/button';
import Modal from '../components/Modal/Modal';
import { Input } from '../ui/input';
import { useToast } from '../hooks/use-toast';
import {
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ORDER,
  MealSlotKey,
  buildEmptyWeekSlots,
  formatDayLabel,
  formatWeekdayLabel,
  getMealPlanDocumentId,
  getWeekDayOptions,
  getWeekEndDate,
  getWeekStartDate,
  toDateKey,
} from '../planejamento/shared';

interface Recipe {
  id: string;
  title: string;
  introduction: string;
  createdAt?: any;
  ingredients?: any[];
  preparationMethod?: string[];
  userId: string;
}

export default function MinhasReceitas() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plannerModalOpen, setPlannerModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<MealSlotKey>('almoco');
  const [servings, setServings] = useState('2');
  const [note, setNote] = useState('');
  const [savingMeal, setSavingMeal] = useState(false);
  const { user } = useUserStore();
  const { setShowRecipe } = useRecipeStore();
  const { toast } = useToast();
  const weekStartDate = toDateKey(getWeekStartDate());
  const weekEndDate = toDateKey(getWeekEndDate(getWeekStartDate()));
  const weekDayOptions = getWeekDayOptions(weekStartDate);

  useEffect(() => {
    trackPageVisit('minhas-receitas');
  }, []);

  const handleRedirect = async () => {
    setShowRecipe(false);
  };

  const openPlannerModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSelectedDateKey(weekDayOptions[0]?.dateKey || '');
    setSelectedSlot('almoco');
    setServings('2');
    setNote('');
    setPlannerModalOpen(true);
  };

  const handleSavePlannedMeal = async () => {
    if (!user?.uid || !selectedRecipe || !selectedDateKey || !selectedSlot) {
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
          recipeId: selectedRecipe.id,
          recipeTitle: selectedRecipe.title,
          servings: nextServings,
          note: note.trim() || null,
          addedFrom: 'my-recipes',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Receita planejada',
        description: `${selectedRecipe.title} foi adicionada em ${formatDayLabel(selectedDateKey)} no ${MEAL_SLOT_LABELS[selectedSlot].toLowerCase()}.`,
      });

      setPlannerModalOpen(false);
      setSelectedRecipe(null);
    } catch (saveError) {
      console.error('Error saving planned meal:', saveError);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a receita ao planejamento.',
        variant: 'destructive',
      });
    } finally {
      setSavingMeal(false);
    }
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user?.uid) {
        return;
      }

      try {
        const recipesRef = collection(db, 'recipes');
        const q = query(
          recipesRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const fetchedRecipes: Recipe[] = [];
        querySnapshot.forEach((doc) => {
          const recipeData = doc.data();
          fetchedRecipes.push({
            id: doc.id,
            title: recipeData.title,
            introduction: recipeData.introduction,
            createdAt: recipeData.createdAt,
            ingredients: recipeData.ingredients || [],
            preparationMethod: recipeData.preparationMethod || [],
            userId: recipeData.userId
          });
        });

        setRecipes(fetchedRecipes);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError('Erro ao carregar receitas');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-tertiary mx-auto animate-bounce" />
          <p className="mt-4 text-gray-600 font-medium animate-pulse">
            Preparando suas receitas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 rounded-xl shadow-lg border border-tertiary/50 bg-white">
          <div className="text-red-500 mb-4">
            <ChefHat className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <main className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <ChefHat className="w-6 h-6 text-secondary" />
            <h1 className="text-3xl font-bold text-secondary">Minhas Receitas</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore sua coleção pessoal de receitas deliciosas. Cada uma delas foi criada especialmente
            para tornar seus momentos na cozinha ainda mais especiais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.length === 0 ? (
            <div className="col-span-full">
              <div className="rounded-2xl p-12 text-center shadow-sm border border-tertiary/50 bg-white">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-tertiary">
                  <ChefHat className="w-10 h-10 text-tertiary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma receita ainda</h3>
                <p className="text-gray-500">
                  Que tal criar sua primeira receita deliciosa?
                </p>
              </div>
            </div>
          ) : (
            recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="group flex h-full flex-col overflow-hidden border border-tertiary/30 bg-white transition-all duration-300 hover:border-tertiary hover:shadow-xl"
              >
                <Link href={`/recipe/${recipe.id}`} className="flex-1 p-6 no-underline">
                  <div className="flex h-full flex-col">
                    <div className="flex-1">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-tertiary transition-colors">
                          {recipe.title}
                        </h2>
                        <p className="text-gray-600 line-clamp-2 mb-6">
                          {recipe.introduction}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <ChefHat className="w-4 h-4 text-tertiary" />
                            <span>{recipe.ingredients?.length || 0} ingredientes</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4 text-tertiary" />
                            <span>{recipe.preparationMethod?.length || 0} passos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="outline"
                      className="w-full border-secondary/25 text-secondary hover:bg-secondary/5 sm:w-auto"
                      onClick={() => openPlannerModal(recipe)}
                    >
                      <CalendarRange className="h-4 w-4" />
                      Planejar refeição
                    </Button>
                    <Link
                      href={`/recipe/${recipe.id}`}
                      className="inline-flex items-center gap-2 font-medium text-tertiary no-underline transition-colors hover:text-secondary"
                    >
                      <span>Ver receita</span>
                      <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/recipe"
            onClick={handleRedirect}
            className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-lg hover:bg-secondary/90 transition-colors shadow-md hover:shadow-lg no-underline"
          >
            <ChefHat className="w-5 h-5" />
            <span className="font-medium">Criar Nova Receita</span>
          </Link>
        </div>

        <Modal isOpen={plannerModalOpen} onClose={() => setPlannerModalOpen(false)}>
          <div className="mx-auto max-w-lg text-left">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-secondary">Planejamento da semana</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-800">🎉 Adicionar ao planejamento</h2>
              <p className="mt-2 text-sm text-gray-500">
                {selectedRecipe ? `Escolha quando você quer cozinhar ${selectedRecipe.title}.` : 'Escolha o dia e a refeição.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Dia da semana</label>
                <select
                  value={selectedDateKey}
                  onChange={(event) => setSelectedDateKey(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="" disabled>
                    Selecione um dia
                  </option>
                  {weekDayOptions.map((option) => (
                    <option key={option.dateKey} value={option.dateKey}>
                      {formatWeekdayLabel(option.dateKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Refeição</label>
                <select
                  value={selectedSlot}
                  onChange={(event) => setSelectedSlot(event.target.value as MealSlotKey)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {MEAL_SLOT_ORDER.map((slotKey) => (
                    <option key={slotKey} value={slotKey}>
                      {MEAL_SLOT_LABELS[slotKey]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Porções</label>
                <Input value={servings} onChange={(event) => setServings(event.target.value)} inputMode="numeric" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Observação opcional</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Ex: dobrar no jantar de sexta"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" className="text-gray-600 hover:bg-gray-100" onClick={() => setPlannerModalOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-secondary text-white hover:bg-secondary/90" onClick={handleSavePlannedMeal} disabled={savingMeal}>
                {savingMeal ? 'Salvando...' : 'Salvar no planejamento'}
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}