'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { ArrowRight, CalendarRange, ChefHat, Clock3, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { trackPageVisit } from '../lib/analytics';
import { db } from '../hooks/userAuth';
import { useUserStore } from '../store/user';
import { useToast } from '../hooks/use-toast';
import { RecipeIngredientInput, buildRecipeShoppingDraftItems } from '../lista-de-compras/shared';
import {
  MealPlanWeek,
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ORDER,
  createEmptyMealPlanWeek,
  formatWeekdayLabel,
  formatWeekRangeLabel,
  getMealPlanDocumentId,
  getPlannedMealsCount,
  getWeekDayOptions,
  getWeekEndDate,
  getWeekStartDate,
  toDateKey,
} from './shared';

export default function PlanejamentoPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { toast } = useToast();
  const [plan, setPlan] = useState<MealPlanWeek | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [removingSlotId, setRemovingSlotId] = useState<string | null>(null);
  const [generatingShoppingList, setGeneratingShoppingList] = useState(false);

  const weekStartDate = useMemo(() => toDateKey(getWeekStartDate()), []);
  const weekEndDate = useMemo(() => toDateKey(getWeekEndDate(getWeekStartDate())), []);
  const weekDayOptions = useMemo(() => getWeekDayOptions(weekStartDate), [weekStartDate]);
  const currentPlanId = user?.uid ? getMealPlanDocumentId(user.uid, weekStartDate) : null;

  useEffect(() => {
    trackPageVisit('meal-planner');
  }, []);

  useEffect(() => {
    if (!user?.uid || !currentPlanId) {
      setPlan(null);
      setLoadingPlan(false);
      return;
    }

    setLoadingPlan(true);

    const planRef = doc(db, 'mealPlans', currentPlanId);

    const unsubscribe = onSnapshot(
      planRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setPlan({
            id: currentPlanId,
            ...createEmptyMealPlanWeek(user.uid, weekStartDate),
          });
          setLoadingPlan(false);
          return;
        }

        setPlan({
          id: snapshot.id,
          ...(snapshot.data() as Omit<MealPlanWeek, 'id'>),
        });
        setLoadingPlan(false);
      },
      (error) => {
        console.error('Error loading meal planner:', error);
        setLoadingPlan(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seu planejamento da semana.',
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [currentPlanId, toast, user?.uid, weekStartDate]);

  const handleRemoveMeal = async (dateKey: string, slotKey: (typeof MEAL_SLOT_ORDER)[number]) => {
    if (!currentPlanId) return;

    const slotId = `${dateKey}-${slotKey}`;
    setRemovingSlotId(slotId);

    try {
      await updateDoc(doc(db, 'mealPlans', currentPlanId), {
        [`slots.${dateKey}.${slotKey}`]: null,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Refeição removida',
        description: 'O slot foi liberado no seu planejamento.',
      });
    } catch (error) {
      console.error('Error removing planned meal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover essa refeição agora.',
        variant: 'destructive',
      });
    } finally {
      setRemovingSlotId(null);
    }
  };

  const handleGenerateWeeklyShoppingList = async () => {
    if (!user?.uid || !plan) return;

    const plannedMeals = Object.values(plan.slots).flatMap((daySlots) =>
      MEAL_SLOT_ORDER.map((slotKey) => daySlots?.[slotKey]).filter(Boolean),
    );

    if (!plannedMeals.length) {
      toast({
        title: 'Semana vazia',
        description: 'Adicione pelo menos uma receita antes de gerar a lista da semana.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingShoppingList(true);

    try {
      const uniqueMeals = new Map(
        plannedMeals.map((meal) => [meal!.recipeId, { recipeId: meal!.recipeId, recipeTitle: meal!.recipeTitle }]),
      );

      const recipeSnapshots = await Promise.all(
        Array.from(uniqueMeals.values()).map(async (meal) => ({
          ...meal,
          snapshot: await getDoc(doc(db, 'recipes', meal.recipeId)),
        })),
      );

      const draftItemsByName = new Map<
        string,
        {
          name: string;
          quantityText: string | null;
          sourceRecipeId: string;
          sourceRecipeTitle: string;
        }
      >();

      recipeSnapshots.forEach(({ recipeId, recipeTitle, snapshot }) => {
        if (!snapshot.exists()) return;

        const recipeData = snapshot.data() as { ingredients?: RecipeIngredientInput[] };
        const recipeItems = buildRecipeShoppingDraftItems(recipeData.ingredients || []);

        recipeItems.forEach((item) => {
          const existingItem = draftItemsByName.get(item.normalizedName);
          if (existingItem) {
            if (!existingItem.quantityText && item.quantityText) {
              draftItemsByName.set(item.normalizedName, {
                ...existingItem,
                quantityText: item.quantityText,
              });
            }
            return;
          }

          draftItemsByName.set(item.normalizedName, {
            name: item.name,
            quantityText: item.quantityText,
            sourceRecipeId: recipeId,
            sourceRecipeTitle: recipeTitle,
          });
        });
      });

      const itemsToAdd = Array.from(draftItemsByName.values());

      if (!itemsToAdd.length) {
        toast({
          title: 'Sem ingredientes',
          description: 'Não encontramos ingredientes suficientes nas receitas planejadas.',
          variant: 'destructive',
        });
        return;
      }

      const newListRef = doc(collection(db, 'shoppingLists'));
      const batch = writeBatch(db);

      batch.set(newListRef, {
        userId: user.uid,
        name: `Lista da semana ${formatWeekRangeLabel(weekStartDate, weekEndDate)}`,
        status: 'active',
        itemCount: itemsToAdd.length,
        pendingItemCount: itemsToAdd.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      itemsToAdd.forEach((item) => {
        const itemRef = doc(collection(db, 'shoppingLists', newListRef.id, 'items'));
        batch.set(itemRef, {
          name: item.name,
          quantityText: item.quantityText,
          checked: false,
          sourceType: 'recipe',
          sourceRecipeId: item.sourceRecipeId,
          sourceRecipeTitle: item.sourceRecipeTitle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      toast({
        title: 'Lista criada',
        description: `${itemsToAdd.length} itens foram adicionados na sua lista da semana.`,
      });

      router.push(`/lista-de-compras/${newListRef.id}`);
    } catch (error) {
      console.error('Error generating weekly shopping list:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a lista da semana agora.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingShoppingList(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen py-12">
        <main className="container mx-auto max-w-4xl px-0">
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-tertiary/40 bg-primary">
                <CalendarRange className="h-10 w-10 text-tertiary" />
              </div>
              <h1 className="mb-3 text-2xl font-semibold text-gray-800">Faça login para planejar sua semana</h1>
              <p className="mx-auto mb-8 max-w-xl text-gray-600">
                Salve receitas na semana atual e organize o que você vai cozinhar nos próximos dias.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 font-medium text-white no-underline transition-colors hover:bg-secondary/90"
              >
                Entrar
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <main className="container mx-auto max-w-6xl px-0">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-3">
              <CalendarRange className="h-6 w-6 text-secondary" />
              <h1 className="text-3xl font-bold text-secondary">Planejamento da Semana</h1>
            </div>
            <p className="max-w-2xl text-gray-600">
              Organize sua semana de segunda a domingo em café, almoço e jantar. Adicione receitas pela página da receita ou por Minhas Receitas.
            </p>
            <p className="mt-2 text-sm text-secondary/80">
              Semana de {formatWeekRangeLabel(weekStartDate, weekEndDate)}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary hover:text-white"
            >
              <Link href="/minhas-receitas">
                <ChefHat className="h-4 w-4" />
                Escolher receitas
              </Link>
            </Button>
            <Button
              variant="secondary"
              className="bg-secondary/80 text-white hover:bg-secondary"
              onClick={handleGenerateWeeklyShoppingList}
              disabled={generatingShoppingList || getPlannedMealsCount(plan) === 0}
            >
              {generatingShoppingList ? 'Gerando lista...' : 'Gerar lista da semana'}
            </Button>
          </div>
        </div>

        {loadingPlan ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="font-medium text-gray-600">Carregando o planejamento da semana...</p>
            </div>
          </Card>
        ) : getPlannedMealsCount(plan) === 0 ? (
          <Card className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-tertiary/40 bg-primary">
                <Clock3 className="h-10 w-10 text-tertiary" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold text-gray-800">Sua semana ainda está vazia</h2>
              <p className="mx-auto mb-8 max-w-2xl text-gray-600">
                Comece adicionando uma receita em qualquer dia. Esse sera o primeiro passo para gerar a lista de compras da semana.
              </p>
              <Link
                href="/minhas-receitas"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 font-medium text-white no-underline transition-colors hover:bg-secondary/90"
              >
                <ChefHat className="h-4 w-4" />
                Adicionar primeira receita
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {weekDayOptions.map(({ dateKey }) => {
              const daySlots = plan?.slots?.[dateKey];

              return (
              <Card key={dateKey} className="rounded-2xl border border-tertiary/30 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-wide text-secondary">{formatWeekdayLabel(dateKey)}</p>
                    <p className="text-sm text-gray-500">Planejamento do dia</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {MEAL_SLOT_ORDER.map((slotKey) => {
                    const slot = daySlots?.[slotKey];
                    const slotId = `${dateKey}-${slotKey}`;

                    return (
                      <div key={slotId} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-700">{MEAL_SLOT_LABELS[slotKey]}</span>
                          {slot ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto px-2 py-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveMeal(dateKey, slotKey)}
                              disabled={removingSlotId === slotId}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </Button>
                          ) : null}
                        </div>

                        {slot ? (
                          <div className="space-y-2">
                            <Link
                              href={`/recipe/${slot.recipeId}`}
                              className="inline-flex items-center gap-2 font-semibold text-secondary no-underline hover:underline"
                            >
                              {slot.recipeTitle}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                            <p className="text-sm text-gray-500">{slot.servings} porções planejadas</p>
                            {slot.note ? <p className="text-sm text-gray-600">{slot.note}</p> : null}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-tertiary/30 bg-primary/20 px-3 py-3 text-sm text-gray-500">
                            Nenhuma receita planejada ainda.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );})}
          </div>
        )}
      </main>
    </div>
  );
}