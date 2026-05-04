'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../hooks/userAuth';
import axios from 'axios';
import { getIdToken } from 'firebase/auth';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Separator } from '@radix-ui/react-separator';
import { ChefHat, Share2, Link, MessageCircle, ChevronDown, Sparkles, Lock, Wand2, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DialogHeader } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { useToast } from '../../hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useRecipeStore } from '../../store/recipe';
import { useUserStore } from '../../store/user';
import { FeedbackSection, FeedbackType, useFeedback } from '../../components/FeedbackSection/FeedbackSection';
import { FeedbackModal } from '../../components/FeedbackSection/FeedbackModal';
import { generateRecipeImage } from '../../lib/utils';
import { trackPageVisit, trackEvent } from '../../lib/analytics';
import { AppInstallGuideModal, AppInstallNudgeModal, useAppInstallPrompt } from '../../components/Pwa/AppInstallPrompt';
import RecipeOptionsModal from '../../components/RecipeOptions/RecipeOptionsModal';
import RecipeRefiningLoader from '../../components/RecipeOptions/RecipeRefiningLoader';
import RecipeLimitModal from '../../components/SurveyReward/RecipeLimitModal';
import SurveyRewardModal from '../../components/SurveyReward/SurveyRewardModal';
import Modal from '../../components/Modal/Modal';
import { ShoppingItem, ShoppingList, sortLists } from '../../lista-de-compras/shared';

declare global {
  interface Window {
    clarity: (type: string, event: string, value?: string) => void;
  }
}

interface Recipe {
  title: string;
  introduction: string;
  ingredients: string[];
  preparationMethod: string[];
  observations: string[];
  nutritionalInfo?: {
    calorias: string;
    proteinas: string;
    carboidratos: string;
    gorduras: string;
    fibras: string;
  };
  imageUrl?: string;
  userId: string;
  createdAt: any;
}

interface RecipeOption {
  titulo: string;
  introducao: string;
  ingredientes: Array<{ nome?: string; item?: string; quantidade?: string } | string>;
  modoDePreparo: string[];
  observacoes: string[];
  informacoesNutricionais?: {
    calorias: string;
    proteinas: string;
    carboidratos: string;
    gorduras: string;
    fibras: string;
  } | null;
}

type ShoppingListFlowStep = 'select-list' | 'confirm-items' | 'success';

interface RecipeShoppingDraftItem {
  id: string;
  name: string;
  quantityText: string | null;
  normalizedName: string;
  selected: boolean;
  alreadyInList: boolean;
}

const RecipePage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [recipes, setRecipes] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shoppingListModalOpen, setShoppingListModalOpen] = useState(false);
  const [assistantActionsOpen, setAssistantActionsOpen] = useState(false);
  const [nutritionalInfoOpen, setNutritionalInfoOpen] = useState(true);
  const [refineText, setRefineText] = useState('');
  const [refining, setRefining] = useState(false);
  const [refiningMsgIndex, setRefiningMsgIndex] = useState(0);
  const refiningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showRecipeOptionsModal, setShowRecipeOptionsModal] = useState(false);
  const [recipeOptionsLoading, setRecipeOptionsLoading] = useState(false);
  const [recipeOptionsLoadingMsgIndex, setRecipeOptionsLoadingMsgIndex] = useState(0);
  const [savingRecipeOption, setSavingRecipeOption] = useState(false);
  const [recipeOptions, setRecipeOptions] = useState<RecipeOption[]>([]);
  const recipeOptionsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refineTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [feedbackResetKey, setFeedbackResetKey] = useState(0);
  const [showInstallNudgeModal, setShowInstallNudgeModal] = useState(false);
  const [showRecipeLimitModal, setShowRecipeLimitModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [shoppingListStep, setShoppingListStep] = useState<ShoppingListFlowStep>('select-list');
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [shoppingListsLoading, setShoppingListsLoading] = useState(false);
  const [selectedShoppingList, setSelectedShoppingList] = useState<ShoppingList | null>(null);
  const [showCreateShoppingList, setShowCreateShoppingList] = useState(false);
  const [shoppingListName, setShoppingListName] = useState('');
  const [savingShoppingList, setSavingShoppingList] = useState(false);
  const [preparingShoppingListItems, setPreparingShoppingListItems] = useState(false);
  const [shoppingListDraftItems, setShoppingListDraftItems] = useState<RecipeShoppingDraftItem[]>([]);
  const [savingShoppingListItems, setSavingShoppingListItems] = useState(false);
  const [shoppingListSaveResult, setShoppingListSaveResult] = useState<{
    addedCount: number;
    listId: string;
    listName: string;
  } | null>(null);
  const feedbackResetDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedResetFeedbackTimer = () => {
    if (feedbackResetDebounceRef.current) clearTimeout(feedbackResetDebounceRef.current);
    feedbackResetDebounceRef.current = setTimeout(() => {
      setFeedbackResetKey((k) => k + 1);
    }, 1000);
  };

  const refiningMessages = [
    { title: '🔍 Analisando sua receita...', subtitle: 'O Chefinho está lendo cada detalhe' },
    { title: '✏️ Aplicando as mudanças...', subtitle: 'Ajustando ingredientes e preparo' },
    { title: '✨ Finalizando os ajustes...', subtitle: 'Garantindo que tudo ficará perfeito' },
  ];

  const recipeOptionsLoadingMessages = [
    { title: '🍳 Criando novas opções...', subtitle: 'O Chefinho está pensando em 4 variações para você' },
    { title: '🥕 Analisando os ingredientes...', subtitle: 'Entendendo o que faz sentido reaproveitar na próxima receita' },
    { title: '🧠 Buscando combinações gostosas...', subtitle: 'Misturando sabores, texturas e possibilidades' },
    { title: '🧾 Ajustando os detalhes...', subtitle: 'Combinando ingredientes e preparo para ficar parecido' },
    { title: '⏱️ Calculando o preparo...', subtitle: 'Equilibrando praticidade e resultado final' },
    { title: '🌿 Refinando o estilo da receita...', subtitle: 'Deixando cada opção com uma proposta diferente' },
    { title: '📋 Organizando as melhores opções...', subtitle: 'Selecionando as variações mais promissoras para você' },
    { title: '✨ Finalizando as sugestões...', subtitle: 'Quase pronto para você escolher sua próxima receita' },
  ];

  useEffect(() => {
    if (refining) {
      setRefiningMsgIndex(0);
      refiningIntervalRef.current = setInterval(() => {
        setRefiningMsgIndex((prev) =>
          prev < refiningMessages.length - 1 ? prev + 1 : prev
        );
      }, 2500);
    } else {
      if (refiningIntervalRef.current) {
        clearInterval(refiningIntervalRef.current);
        refiningIntervalRef.current = null;
      }
    }
    return () => {
      if (refiningIntervalRef.current) clearInterval(refiningIntervalRef.current);
    };
  }, [refining]);

  useEffect(() => {
    if (recipeOptionsLoading) {
      setRecipeOptionsLoadingMsgIndex(0);
      recipeOptionsIntervalRef.current = setInterval(() => {
        setRecipeOptionsLoadingMsgIndex((prev) =>
          prev < recipeOptionsLoadingMessages.length - 1 ? prev + 1 : prev
        );
      }, 2500);
    } else if (recipeOptionsIntervalRef.current) {
      clearInterval(recipeOptionsIntervalRef.current);
      recipeOptionsIntervalRef.current = null;
    }

    return () => {
      if (recipeOptionsIntervalRef.current) {
        clearInterval(recipeOptionsIntervalRef.current);
        recipeOptionsIntervalRef.current = null;
      }
    };
  }, [recipeOptionsLoading]);
  const [imageLoading, setImageLoading] = useState(true);
  const imageGenerationTriggered = useRef(false);
  const installPromptTriggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFeedbackRef = useRef<FeedbackType | null>(null);
  const { setShowRecipe, recipe } = useRecipeStore();
  const { user } = useUserStore();
  const sharedFeedback = useFeedback(params.id as string);
  const { isIOS, canOfferInstall, showIOSGuide, setShowIOSGuide, openInstallFlow } = useAppInstallPrompt();

    useEffect(() => {
      trackPageVisit('recipe-details');
    }, []);

  useEffect(() => {
    const previousFeedback = previousFeedbackRef.current;
    previousFeedbackRef.current = sharedFeedback.feedback;

    if (sharedFeedback.isLoading) return;
    if (!canOfferInstall) return;
    if (previousFeedback === FeedbackType.UP || sharedFeedback.feedback !== FeedbackType.UP) return;

    try {
      const promptAlreadyShown = sessionStorage.getItem(`feedback_install_prompt_${params.id}`) === 'true';
      if (promptAlreadyShown) return;
    } catch {}

    installPromptTriggerTimeoutRef.current = setTimeout(() => {
      setShowInstallNudgeModal(true);
      try {
        sessionStorage.setItem(`feedback_install_prompt_${params.id}`, 'true');
      } catch {}
      trackEvent('feedback_install_prompt_opened', { recipeId: params.id });
    }, 650);

    return () => {
      if (installPromptTriggerTimeoutRef.current) {
        clearTimeout(installPromptTriggerTimeoutRef.current);
        installPromptTriggerTimeoutRef.current = null;
      }
    };
  }, [sharedFeedback.feedback, sharedFeedback.isLoading, canOfferInstall, params.id]);

  useEffect(() => {
    return () => {
      if (installPromptTriggerTimeoutRef.current) {
        clearTimeout(installPromptTriggerTimeoutRef.current);
      }
    };
  }, []);
  
  // Check if user is on Pro plan (planId 2 or 3)
  const isPro = user?.plan?.planId >= 2;
  
  // Check if this is the current user's own recipe
  const isOwnRecipe = user?.uid && recipes?.userId === user.uid;
  const canManageRecipe = Boolean(user && isOwnRecipe);

  const inferMealOption = () => {
    const recipeText = `${recipes?.title || ''} ${recipes?.introduction || ''}`.toLowerCase();

    if (/(bolo|brigadeiro|mousse|torta|sobremesa|doce|pudim|brownie|cookie|sorvete)/.test(recipeText)) {
      return 'sobremesa';
    }

    if (/(cafe da manha|café da manhã|panqueca|omelete|torrada|pao|pão|toast|iogurte|granola)/.test(recipeText)) {
      return 'cafe';
    }

    if (/(lanche|sanduiche|sanduíche|wrap|hamburguer|hambúrguer|burger|tapioca)/.test(recipeText)) {
      return 'lanche';
    }

    if (/(janta|jantar|sopa|caldo)/.test(recipeText)) {
      return 'janta';
    }

    return 'almoco';
  };

  const getRecipeIngredientsText = () => {
    if (!recipes?.ingredients?.length) return '';

    return recipes.ingredients
      .map((ingredient: any) => ingredient?.nome || ingredient?.item || ingredient)
      .filter(Boolean)
      .join(', ');
  };

  const normalizeShoppingItemName = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const getRecipeIngredientParts = (ingredient: any) => {
    if (typeof ingredient === 'string') {
      return {
        name: ingredient.trim(),
        quantityText: null,
      };
    }

    const name = `${ingredient?.nome || ingredient?.item || ''}`.trim();
    const quantityText = ingredient?.quantidade == null ? null : `${ingredient.quantidade}`.trim();

    return {
      name,
      quantityText: quantityText || null,
    };
  };

  const getRecipeIngredientDisplayText = (ingredient: any) => {
    const { name, quantityText } = getRecipeIngredientParts(ingredient);

    if (!name) return '';
    return quantityText ? `${name} - ${quantityText}` : name;
  };

  const getRecipeShoppingDraftItems = () => {
    if (!recipes?.ingredients?.length) return [] as RecipeShoppingDraftItem[];

    const draftItems = new Map<string, RecipeShoppingDraftItem>();

    recipes.ingredients.forEach((ingredient: any, index: number) => {
      const { name, quantityText } = getRecipeIngredientParts(ingredient);
      const normalizedName = normalizeShoppingItemName(name);

      if (!name || !normalizedName) return;

      const existingItem = draftItems.get(normalizedName);
      if (existingItem) {
        if (!existingItem.quantityText && quantityText) {
          draftItems.set(normalizedName, {
            ...existingItem,
            quantityText,
          });
        }
        return;
      }

      draftItems.set(normalizedName, {
        id: `${normalizedName}-${index}`,
        name,
        quantityText,
        normalizedName,
        selected: true,
        alreadyInList: false,
      });
    });

    return Array.from(draftItems.values());
  };

  const resetShoppingListFlow = () => {
    setShoppingListStep('select-list');
    setSelectedShoppingList(null);
    setShowCreateShoppingList(false);
    setShoppingListName('');
    setPreparingShoppingListItems(false);
    setShoppingListDraftItems([]);
    setSavingShoppingListItems(false);
    setShoppingListSaveResult(null);
  };

  const saveRecipeOption = async (recipeOption: RecipeOption, imageUrl?: string) => {
    return addDoc(collection(db, 'recipes'), {
      title: recipeOption.titulo,
      introduction: recipeOption.introducao,
      ingredients: recipeOption.ingredientes,
      preparationMethod: recipeOption.modoDePreparo,
      observations: recipeOption.observacoes,
      nutritionalInfo: recipeOption.informacoesNutricionais || null,
      imageUrl: imageUrl || null,
      userId: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
    });
  };

  const handleCloseRecipeOptionsModal = () => {
    if (recipeOptionsLoading || savingRecipeOption) return;
    trackEvent('recipe_options_modal_dismissed', { recipeId: params.id });
    setShowRecipeOptionsModal(false);
    setRecipeOptions([]);
  };

  const handleSelectRecipeOption = async (recipeOption: RecipeOption) => {
    try {
      setSavingRecipeOption(true);

      const savedRecipe = await saveRecipeOption(recipeOption);

      setShowRecipeOptionsModal(false);
      setRecipeOptions([]);
      router.push(`/recipe/${savedRecipe.id}`);

      if (isPro) {
        generateRecipeImage(savedRecipe.id, recipeOption);
      }
    } catch (selectionError) {
      console.error('Error saving selected recipe option:', selectionError);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a receita selecionada. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSavingRecipeOption(false);
    }
  };

  const handleChangeIngredients = () => {
    const currentIngredients = recipes?.ingredients
      ?.map((ingredient: any) => ingredient?.nome || ingredient?.item || ingredient)
      .filter(Boolean);

    if (currentIngredients?.length) {
      localStorage.setItem('ingredients', JSON.stringify(currentIngredients));
    }

    trackEvent('change_ingredients_from_recipe_options', { recipeId: params.id });
    setShowRecipeOptionsModal(false);
    setRecipeOptions([]);
    setShowRecipe(false);
    router.push('/recipe');
  };

  const generateMoreRecipeOptions = async (refinementInstruction?: string) => {
    if (!auth.currentUser || !recipes) return;

    const remainingRecipes = user?.plan?.recipeCount;
    if (remainingRecipes === 0) {
      trackEvent('recipe_limit_modal_opened', { recipeId: params.id, source: 'generate_options' });
      setShowRecipeLimitModal(true);
      return;
    }

    const token = await getIdToken(auth.currentUser);
    if (!token) return;

    setShowRecipeOptionsModal(true);
    setRecipeOptionsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/gemini/recipe-options`,
        {
          optionMeal: inferMealOption(),
          ingredients: getRecipeIngredientsText(),
          ingredientMode: 'suggest',
          prepTime: 0,
          cookingLevel: 'intermediario',
          count: 4,
          refinementInstruction: refinementInstruction?.trim(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        },
      );

      const parsedResponse = response.data.response;
      const nextRecipeOptions = Array.isArray(parsedResponse)
        ? parsedResponse
        : Array.isArray(parsedResponse?.receitas)
          ? parsedResponse.receitas
          : [];

      if (!nextRecipeOptions.length) {
        throw new Error('No recipe options returned');
      }

      setRecipeOptions(nextRecipeOptions);

      if (typeof remainingRecipes === 'number') {
        const newRecipeCount = Math.max(remainingRecipes - 1, 0);
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'plan.recipeCount': newRecipeCount,
        });
        useUserStore.getState().updateRecipesCount(newRecipeCount);
      }

      trackEvent('generate_more_recipe_options', { recipeId: params.id, hasRefinement: Boolean(refinementInstruction?.trim()) });
    } catch (generationError) {
      console.error('Error generating recipe options:', generationError);
      trackEvent('generate_more_recipe_options_failed', {
        recipeId: params.id,
        hasRefinement: Boolean(refinementInstruction?.trim()),
      });
      setShowRecipeOptionsModal(false);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar novas opções agora. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRecipeOptionsLoading(false);
    }
  };

  // Trigger image generation for Pro users viewing their own recipes without an image
  useEffect(() => {
    const generateImageForExistingRecipe = async () => {
      // Only trigger if:
      // - Recipe exists and has no image
      // - User is Pro
      // - It's their own recipe
      // - We haven't already triggered generation
      if (
        recipes &&
        !recipes.imageUrl &&
        isPro &&
        isOwnRecipe &&
        !imageGenerationTriggered.current &&
        !loading
      ) {
        imageGenerationTriggered.current = true;
        setImageLoading(true);

        const imageUrl = await generateRecipeImage(params.id as string, recipes);
        
        if (!imageUrl) {
          setImageLoading(false);
        }
        // If imageUrl is returned, the Firestore listener will update the UI
      } else if (recipes && !recipes.imageUrl && !isPro) {
        // Not a Pro user, don't show loading spinner
        setImageLoading(false);
      }
    };

    generateImageForExistingRecipe();
  }, [recipes, isPro, isOwnRecipe, loading, params.id]);

  const handleShare = async (platform: string) => {
    try {
      setShareDialogOpen(false);
      if (platform === 'whatsapp') {
        const currentUrl = window.location.href;
        const message = `Veja esta receita que criei no Chefinho IA: ${recipes.title}\n\nPara ver a receita clique no link: ${currentUrl}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      if (platform === 'link') {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Link copiado',
          description: 'O link da receita foi copiado para a área de transferência.',
        });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível compartilhar a receita.',
        variant: 'destructive',
      });
    }
  };

  const handleShoppingListClick = () => {
    if (!user) {
      trackEvent('shopping_list_recipe_login_redirect', {
        recipeId: params.id,
        source: 'recipe_ingredients',
      });
      router.push('/login');
      return;
    }

    const nextDraftItems = getRecipeShoppingDraftItems();
    if (!nextDraftItems.length) {
      toast({
        title: 'Sem ingredientes',
        description: 'Não encontramos ingredientes suficientes para montar a lista.',
        variant: 'destructive',
      });
      return;
    }

    resetShoppingListFlow();
    trackEvent('shopping_list_cta_click', {
      recipeId: params.id,
      source: 'recipe_ingredients',
      isLoggedIn: Boolean(user),
      isOwnRecipe: Boolean(isOwnRecipe),
    });
    trackEvent('shopping_list_recipe_modal_opened', {
      recipeId: params.id,
      source: 'recipe_ingredients',
      ingredientCount: nextDraftItems.length,
    });
    setShoppingListModalOpen(true);
  };

  const handleShoppingListModalChange = (open: boolean) => {
    if (!open && shoppingListModalOpen) {
      trackEvent('shopping_list_modal_closed', {
        recipeId: params.id,
        source: 'recipe_ingredients',
        step: shoppingListStep,
      });
      resetShoppingListFlow();
    }

    setShoppingListModalOpen(open);
  };

  const handlePrepareShoppingListItems = async (list: ShoppingList) => {
    const nextDraftItems = getRecipeShoppingDraftItems();

    if (!nextDraftItems.length) {
      toast({
        title: 'Sem ingredientes',
        description: 'Não encontramos ingredientes suficientes para adicionar.',
        variant: 'destructive',
      });
      return;
    }

    setPreparingShoppingListItems(true);

    try {
      const existingItemsSnapshot = await getDocs(collection(db, 'shoppingLists', list.id, 'items'));
      const existingItemNames = new Set(
        existingItemsSnapshot.docs
          .map((snapshotDoc) => (snapshotDoc.data() as Omit<ShoppingItem, 'id'>).name)
          .map((name) => normalizeShoppingItemName(name || ''))
          .filter(Boolean),
      );

      const nextItems = nextDraftItems.map((item) => {
        const alreadyInList = existingItemNames.has(item.normalizedName);

        return {
          ...item,
          alreadyInList,
          selected: alreadyInList ? false : item.selected,
        };
      });

      setSelectedShoppingList(list);
      setShoppingListDraftItems(nextItems);
      setShoppingListStep('confirm-items');
      setShowCreateShoppingList(false);

      trackEvent('shopping_list_recipe_list_selected', {
        recipeId: params.id,
        source: 'recipe_ingredients',
        listId: list.id,
        listName: list.name,
      });
    } catch (shoppingListError) {
      console.error('Error preparing shopping list items:', shoppingListError);
      toast({
        title: 'Erro',
        description: 'Não foi possível preparar os ingredientes agora.',
        variant: 'destructive',
      });
    } finally {
      setPreparingShoppingListItems(false);
    }
  };

  const handleCreateShoppingList = async () => {
    const trimmedName = shoppingListName.trim();

    if (!user?.uid || !trimmedName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a lista.',
        variant: 'destructive',
      });
      return;
    }

    setSavingShoppingList(true);

    try {
      const listRef = await addDoc(collection(db, 'shoppingLists'), {
        userId: user.uid,
        name: trimmedName,
        status: 'active',
        itemCount: 0,
        pendingItemCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const nextList: ShoppingList = {
        id: listRef.id,
        userId: user.uid,
        name: trimmedName,
        status: 'active',
        itemCount: 0,
        pendingItemCount: 0,
      };

      setShoppingListName('');
      setSelectedShoppingList(nextList);
      trackEvent('shopping_list_recipe_list_created', {
        recipeId: params.id,
        source: 'recipe_ingredients',
        listId: listRef.id,
      });

      await handlePrepareShoppingListItems(nextList);
    } catch (shoppingListError) {
      console.error('Error creating shopping list from recipe:', shoppingListError);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a lista agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingShoppingList(false);
    }
  };

  const handleToggleDraftShoppingItem = (draftItemId: string) => {
    setShoppingListDraftItems((currentDraftItems) =>
      currentDraftItems.map((draftItem) => {
        if (draftItem.id !== draftItemId || draftItem.alreadyInList) {
          return draftItem;
        }

        return {
          ...draftItem,
          selected: !draftItem.selected,
        };
      }),
    );
  };

  const handleSaveRecipeToShoppingList = async () => {
    if (!selectedShoppingList || !recipes) return;

    const itemsToAdd = shoppingListDraftItems.filter((item) => item.selected && !item.alreadyInList);
    setSavingShoppingListItems(true);

    try {
      const batch = writeBatch(db);
      const shoppingListRef = doc(db, 'shoppingLists', selectedShoppingList.id);

      itemsToAdd.forEach((item) => {
        const itemRef = doc(collection(db, 'shoppingLists', selectedShoppingList.id, 'items'));
        batch.set(itemRef, {
          name: item.name,
          quantityText: item.quantityText,
          checked: false,
          sourceType: 'recipe',
          sourceRecipeId: params.id as string,
          sourceRecipeTitle: recipes.title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      if (itemsToAdd.length > 0) {
        batch.update(shoppingListRef, {
          itemCount: (selectedShoppingList.itemCount ?? 0) + itemsToAdd.length,
          pendingItemCount: (selectedShoppingList.pendingItemCount ?? 0) + itemsToAdd.length,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.update(shoppingListRef, {
          updatedAt: serverTimestamp(),
        });
      }

      trackEvent('shopping_list_recipe_items_confirmed', {
        recipeId: params.id,
        source: 'recipe_ingredients',
        listId: selectedShoppingList.id,
        selectedCount: itemsToAdd.length,
        skippedCount: shoppingListDraftItems.length - itemsToAdd.length,
      });

      await batch.commit();

      setShoppingListSaveResult({
        addedCount: itemsToAdd.length,
        listId: selectedShoppingList.id,
        listName: selectedShoppingList.name,
      });
      setShoppingListStep('success');

      trackEvent('shopping_list_recipe_items_added', {
        recipeId: params.id,
        source: 'recipe_ingredients',
        listId: selectedShoppingList.id,
        addedCount: itemsToAdd.length,
      });
    } catch (shoppingListError) {
      console.error('Error saving recipe ingredients to shopping list:', shoppingListError);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a lista agora.',
        variant: 'destructive',
      });
    } finally {
      setSavingShoppingListItems(false);
    }
  };

  const handleRefineRecipe = async () => {
    if (!refineText.trim() || refining || !auth.currentUser) return;
    const token = await getIdToken(auth.currentUser);
    if (!token) return;

    setRefining(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const recipeForApi = {
        titulo: recipes.title,
        introducao: recipes.introduction,
        ingredientes: recipes.ingredients,
        modoDePreparo: recipes.preparationMethod,
        observacoes: recipes.observations,
        informacoesNutricionais: recipes.nutritionalInfo || null,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/gemini/refine-recipes`,
        { recipes: [recipeForApi], refinementInstruction: refineText.trim() },
        { headers: { 'Content-Type': 'application/json', Authorization: token } },
      );

      const parsed = response.data.response;
      const refined = Array.isArray(parsed) ? parsed[0] : parsed.receitas?.[0];
      if (!refined) throw new Error('No refined recipe returned');

      await updateDoc(doc(db, 'recipes', params.id as string), {
        title: refined.titulo,
        introduction: refined.introducao,
        ingredients: refined.ingredientes,
        preparationMethod: refined.modoDePreparo,
        observations: refined.observacoes,
        nutritionalInfo: refined.informacoesNutricionais || null,
        imageUrl: null,
      });

      trackEvent('refine_recipe', { refinement: refineText.trim(), recipeId: params.id });
      setRefineText('');
      if (refineTextareaRef.current) refineTextareaRef.current.style.height = 'auto';
      toast({ title: 'Receita refinada!', description: 'Sua receita foi atualizada com sucesso.' });

      if (isPro) {
        setImageLoading(true);
        imageGenerationTriggered.current = false;
        generateRecipeImage(params.id as string, refined);
      }
    } catch (error) {
      console.error('Error refining recipe:', error);
      toast({ title: 'Erro', description: 'Não foi possível refinar a receita. Tente novamente.', variant: 'destructive' });
    } finally {
      setRefining(false);
    }
  };

  const handleGetOtherRecipe = async () => {
    try {
      setShowRecipe(false);
      trackEvent('generate_another_recipe');
      router.push('/recipe');
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível obter outra receita.',
        variant: 'destructive',
      });
    }
  };

  const handleInstallPromptDismiss = (reason: 'close_button' | 'dismiss_button' | 'backdrop') => {
    trackEvent('feedback_install_prompt_dismissed', {
      recipeId: params.id,
      reason,
    });
    setShowInstallNudgeModal(false);
  };

  const handleConfirmInstallNudge = async () => {
    setShowInstallNudgeModal(false);
    trackEvent('feedback_install_prompt_confirmed', {
      recipeId: params.id,
      platform: isIOS ? 'ios' : 'android',
    });
    await openInstallFlow('feedback_positive');
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const recipeId = params.id as string;
        const recipeRef = doc(db, 'recipes', recipeId);
        
        // Setup real-time listener with error handler
        const unsubscribe = onSnapshot(
          recipeRef, 
          (recipeSnap) => {
            if (recipeSnap.exists()) {
              const recipeData = recipeSnap.data() as Recipe;
              setRecipes(recipeData);
              
              // If image exists, we're done loading
              if (recipeData.imageUrl) {
                setImageLoading(false);
              }
            } else {
              setError('Recipe not found');
            }
            setLoading(false);
          },
          (err) => {
            // Handle Firestore permission errors
            console.error('Error fetching recipe:', err);
            setError('Erro ao carregar receita');
            setLoading(false);
          }
        );
        
        return () => unsubscribe();
      } catch (err) {
        setError('Error fetching recipe');
        console.error('Error fetching recipe:', err);
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id]);

  useEffect(() => {
    if (!shoppingListModalOpen || !user?.uid) {
      if (!shoppingListModalOpen) {
        setShoppingLists([]);
        setShoppingListsLoading(false);
      }
      return;
    }

    setShoppingListsLoading(true);

    const listsQuery = query(
      collection(db, 'shoppingLists'),
      where('userId', '==', user.uid),
    );

    const unsubscribe = onSnapshot(
      listsQuery,
      (snapshot) => {
        const nextLists = sortLists(
          snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...(snapshotDoc.data() as Omit<ShoppingList, 'id'>),
          })),
        );

        setShoppingLists(nextLists);
        setShoppingListsLoading(false);
        setSelectedShoppingList((currentSelectedList) => {
          if (currentSelectedList) {
            return nextLists.find((list) => list.id === currentSelectedList.id) ?? currentSelectedList;
          }

          return nextLists[0] ?? null;
        });
      },
      (shoppingListError) => {
        console.error('Error loading shopping lists from recipe:', shoppingListError);
        setShoppingListsLoading(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar suas listas agora.',
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [shoppingListModalOpen, toast, user?.uid]);

  if (loading) {
    return <div className="flex justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex justify-center">
      <>
        <Card className="w-full max-w-4xl mx-auto bg-white border border-gray-200 shadow-md rounded-2xl">
          {refining ? (
            <RecipeRefiningLoader messages={refiningMessages} msgIndex={refiningMsgIndex} />
          ) : (
            <>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-[#2B2B2B] mb-2">{recipes.title}</CardTitle>
                <p className="text-[#5C5C5C] leading-relaxed">{recipes.introduction}</p>
              </div>
            </div>
            <div className="!mt-6 relative w-full h-[300px] sm:h-[350px] md:h-[400px] rounded-lg overflow-hidden">
              {recipes.imageUrl ? (
                // Show image if it exists (for everyone)
                <Image
                  src={recipes.imageUrl}
                  alt={recipes.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                />
              ) : isOwnRecipe && !isPro ? (
                // Locked state for free users viewing their own recipe without image
                <div className="absolute inset-0">
                  {/* Background image with blur */}
                  <Image
                    src="/images/avocado-toast.jpg"
                    alt="Premium feature"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover blur-sm scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  {/* Content overlay */}
                  <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
                    <div className="text-center w-full">
                      <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-4 rounded-full bg-gradient-to-br from-[#F57C00] to-[#FF9800] flex items-center justify-center shadow-lg">
                        <Lock className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="bg-white/95 backdrop-blur rounded-xl p-3 sm:p-6 shadow-xl mx-2 sm:mx-auto sm:max-w-xs">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                          <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-[#F57C00]" />
                          <span className="text-[9px] sm:text-xs font-semibold text-[#F57C00] uppercase tracking-wide">Recurso Premium</span>
                        </div>
                        <h3 className="text-sm sm:text-lg font-bold text-[#2B2B2B] mb-1">
                          Imagens de receita com IA
                        </h3>
                        <p className="text-[11px] sm:text-sm text-gray-600 mb-2 sm:mb-4 leading-tight">
                          Visualize suas receitas com imagens geradas por IA
                        </p>
                        <Button
                          onClick={() => router.push('/plans')}
                          className="w-full bg-gradient-to-r from-[#F57C00] to-[#FF9800] hover:from-[#E64A19] hover:to-[#F57C00] text-white font-semibold py-2 sm:py-3 text-xs sm:text-base rounded-lg shadow-md transition-all hover:shadow-lg hover:scale-105"
                        >
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Fazer upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isOwnRecipe && isPro && imageLoading ? (
                // Loading state for Pro users waiting for image generation
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F57C00] mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Gerando imagem da receita...</p>
                  </div>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />

            {/* Ingredientes */}
            <div>
              <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#F57C00]" />
                Ingredientes:
              </h3>
              <ul className="space-y-2">
                {recipes.ingredients.map((ingredient: any, index: number) => {
                  const ingredientLabel = getRecipeIngredientDisplayText(ingredient);

                  if (!ingredientLabel) return null;

                  return (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-[#F57C00] rounded-full mt-2 shrink-0" />
                      <span className="text-[#5C5C5C]">{ingredientLabel}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 rounded-xl border border-[#F57C00]/20 bg-[#FFF7F0] p-4">
                <Button
                  onClick={handleShoppingListClick}
                  className="w-full bg-[#F57C00] text-white font-semibold hover:bg-[#E64A19]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar a lista de compras
                </Button>
              </div>
            </div>

            <Separator />

            {/* Modo de preparo */}
            <div>
              <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3">Modo de Preparo:</h3>
              <ol className="space-y-3">
                {recipes.preparationMethod.map((step: string, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-[#F57C00] text-white rounded-full text-sm font-semibold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-[#5C5C5C] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Observações */}
            {recipes.observations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold text-[#2B2B2B] mb-3">Observações:</h3>
                  <ul className="space-y-2">
                    {recipes.observations.map((obs: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-[#4CAF50] rounded-full mt-2 shrink-0" />
                        <span className="text-[#2E7D32] italic">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Informações Nutricionais */}
            {recipes.nutritionalInfo && (
              <>
                <Separator />
                <Collapsible
                  open={nutritionalInfoOpen}
                  onOpenChange={setNutritionalInfoOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger
                    onClick={() => {
                      trackEvent('collapsible_toggle', { state: nutritionalInfoOpen ? 'collapsed' : 'expanded' });
                      setNutritionalInfoOpen(!nutritionalInfoOpen);
                    }}
                    className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <h3 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
                        Informações Nutricionais
                      </h3>
                      <p className="text-xs text-[#5C5C5C] mt-1">Valores aproximados por porção</p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#F57C00] transition-transform duration-200 ${
                        nutritionalInfoOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5C5C] font-medium">Calorias:</span>
                        <span className="text-[#2B2B2B] font-semibold">{recipes.nutritionalInfo.calorias}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5C5C] font-medium">Proteínas:</span>
                        <span className="text-[#2B2B2B] font-semibold">{recipes.nutritionalInfo.proteinas}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5C5C] font-medium">Carboidratos:</span>
                        <span className="text-[#2B2B2B] font-semibold">{recipes.nutritionalInfo.carboidratos}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5C5C] font-medium">Gorduras:</span>
                        <span className="text-[#2B2B2B] font-semibold">{recipes.nutritionalInfo.gorduras}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5C5C] font-medium">Fibras:</span>
                        <span className="text-[#2B2B2B] font-semibold">{recipes.nutritionalInfo.fibras}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#5C5C5C] italic mt-3">
                      * Valores aproximados que podem variar de acordo com os ingredientes utilizados.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            <Separator />

            {/* Feedback da receita - Only show if user is logged in */}
            {user && (
              <>
                <FeedbackSection recipeId={params.id as string} sharedFeedback={sharedFeedback} />
                <Separator />
              </>
            )}

            {/* Botões principais */}
            <div className="flex flex-col gap-3 pt-2">
              {canManageRecipe && (
                <Collapsible
                  open={assistantActionsOpen}
                  onOpenChange={(open) => {
                    setAssistantActionsOpen(open);
                    trackEvent('recipe_actions_toggle', { recipeId: params.id, state: open ? 'expanded' : 'collapsed' });
                  }}
                  className="rounded-lg border border-secondary/20 bg-secondary/5"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-auto w-full items-start justify-between whitespace-normal border-0 bg-transparent px-4 py-4 text-left text-secondary hover:bg-secondary/10"
                    >
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-1 pr-3">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold leading-tight">
                          <Sparkles className="w-4 h-4" />
                          Melhorar com o Chefinho
                        </span>
                        <span className="text-xs font-normal leading-snug text-gray-600">
                          Gere novas versões ou ajuste esta receita do seu jeito.
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${assistantActionsOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t border-secondary/10 px-4 py-4">
                    <div className="flex flex-col gap-4">
                      <div className="rounded-lg border border-secondary/15 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-secondary flex-shrink-0" />
                          <p className="text-sm font-semibold text-gray-700">Gerar mais opções parecidas</p>
                        </div>
                        <p className="mb-3 text-sm text-gray-500">
                          Útil quando você gostou da ideia geral da receita, mas quer outras variações.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            trackEvent('generate_more_recipe_options_click', { recipeId: params.id });
                            generateMoreRecipeOptions();
                          }}
                          disabled={recipeOptionsLoading || savingRecipeOption}
                          className="w-full border-secondary/30 bg-white text-secondary font-semibold"
                        >
                          <Sparkles className="w-4 h-4" />
                          {recipeOptionsLoading ? 'Gerando opções...' : 'Gerar opções'}
                        </Button>
                      </div>

                      <div className="rounded-lg border border-secondary/15 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wand2 className="w-4 h-4 text-secondary flex-shrink-0" />
                          <p className="text-sm font-semibold text-gray-700">Refinar esta receita</p>
                        </div>
                        <p className="mb-3 text-sm text-gray-500">
                          Peça um ajuste direto, como deixar mais leve, sem glúten ou trocar algum ingrediente.
                        </p>
                        <div className="flex flex-col gap-2">
                          <textarea
                            ref={refineTextareaRef}
                            rows={2}
                            value={refineText}
                            onFocus={debouncedResetFeedbackTimer}
                            onChange={(e) => {
                              setRefineText(e.target.value);
                              const el = e.target;
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                              debouncedResetFeedbackTimer();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleRefineRecipe();
                              }
                            }}
                            placeholder="Ex: substituir manteiga, deixar mais saudável, remover glúten..."
                            disabled={refining || !isPro}
                            className="w-full text-sm border border-secondary/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/50 bg-white placeholder:text-gray-400 resize-none overflow-hidden disabled:opacity-50"
                          />
                          {isPro ? (
                            <Button
                              className="w-full sm:w-auto sm:self-end bg-secondary text-white hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                              onClick={handleRefineRecipe}
                              disabled={!refineText.trim() || refining}
                            >
                              <Wand2 className="w-4 h-4" />
                              {refining ? 'Refinando...' : 'Refinar receita'}
                            </Button>
                          ) : (
                            <Button
                              className="w-full sm:w-auto sm:self-end bg-gradient-to-r from-[#F57C00] to-[#FF9800] hover:from-[#E64A19] hover:to-[#F57C00] text-white font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:scale-105"
                              onClick={() => {
                                trackEvent('premium_gate_refine_upgrade_click');
                                router.push('/plans');
                              }}
                            >
                              <Lock className="w-4 h-4" />
                              Fazer upgrade para refinar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Botões de compartilhar e gerar nova receita */}
              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  onClick={() => {
                    trackEvent('share_button_click');
                    setShareDialogOpen(true);
                  }}
                  variant={canManageRecipe ? 'outline' : 'default'}
                  className={`flex-1 font-semibold transition-colors ${
                    canManageRecipe
                      ? 'border-[#F57C00]/30 text-[#F57C00] hover:bg-[#F57C00]/5'
                      : 'bg-[#F57C00] text-white hover:bg-[#E64A19]'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>

                {user && (
                  <Button
                    variant={canManageRecipe ? 'ghost' : 'secondary'}
                    className={`flex-1 font-semibold transition-colors ${
                      canManageRecipe ? 'text-gray-700 hover:bg-gray-100' : 'text-white'
                    }`}
                    onClick={handleGetOtherRecipe}
                  >
                    Gerar outra receita
                  </Button>
                )}
              </div>

              {/* Login CTA for non-logged users */}
              {!user && (
                <div className="bg-primary border border-tertiary rounded-lg p-4 text-center">
                  <p className="text-sm text-[#2B2B2B] mb-3">
                    Gostou da receita? Crie sua conta para gerar sua própria receita personalizada!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => {
                        trackEvent('signup_button_click');
                        router.push('/signup');
                      }}
                      className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-semibold"
                    >
                      Criar conta grátis
                    </Button>
                    <Button
                      onClick={() => {
                        trackEvent('login_button_click');
                        router.push('/login');
                      }}
                      variant="outline"
                      className="flex-1 border-secondary text-secondary hover:bg-secondary hover:text-white font-semibold"
                    >
                      Já tenho conta
                    </Button>
                  </div>
                </div>
              )}

              {/* Disclaimer de receita salva - only for logged users viewing their own recipe */}
              {canManageRecipe && (
                <div className="pt-1 text-center">
                  <p className="text-sm text-gray-500">
                    Esta receita já foi salva automaticamente.
                  </p>
                  <Button
                    onClick={() => {
                      trackEvent('view_saved_recipes');
                      router.push('/minhas-receitas');
                    }}
                    variant="link"
                    className="h-auto p-0 text-sm font-semibold text-green-700 hover:text-green-800"
                  >
                    Ver minhas receitas salvas
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
            </>
          )}
        </Card>

        {/* Modal de compartilhar */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white text-black">
            <DialogHeader>
              <DialogTitle className="text-black">Compartilhar Receita</DialogTitle>
              <DialogDescription className="text-black/90">
                Escolha como você deseja compartilhar esta receita deliciosa.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-4">
              {/* Copiar link */}
              <Button
                onClick={() => {
                  trackEvent('share_modal_action', { platform: 'link' });
                  handleShare('link');
                }}
                className="bg-gray-200 text-recipe-brown hover:bg-gray-300 flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                Copiar Link
              </Button>

              {/* WhatsApp */}
              <Button
                onClick={() => {
                  trackEvent('share_modal_action', { platform: 'whatsapp' });
                  handleShare('whatsapp');
                }}
                className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Modal isOpen={shoppingListModalOpen} onClose={() => handleShoppingListModalChange(false)}>
          <div className="mx-auto w-full max-w-lg text-left text-black">
            {shoppingListStep === 'select-list' && (
              <>
                <div className="mb-4 space-y-1.5 text-left">
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-black">Adicionar em uma lista</h2>
                  <p className="text-sm text-black/90">
                    Escolha uma lista para receber os ingredientes desta receita ou crie uma nova agora.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {shoppingListsLoading ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      Carregando suas listas...
                    </div>
                  ) : showCreateShoppingList || shoppingLists.length === 0 ? (
                    <div className="space-y-3 rounded-xl border border-secondary/15 bg-secondary/5 p-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Criar nova lista</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Dê um nome para organizar os ingredientes desta receita.
                        </p>
                      </div>
                      <Input
                        value={shoppingListName}
                        onChange={(event) => setShoppingListName(event.target.value)}
                        placeholder="Ex: Jantar da semana"
                        disabled={savingShoppingList || preparingShoppingListItems}
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        {shoppingLists.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowCreateShoppingList(false);
                              setShoppingListName('');
                            }}
                            disabled={savingShoppingList || preparingShoppingListItems}
                            className="text-gray-700 hover:bg-gray-100"
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={handleCreateShoppingList}
                          disabled={savingShoppingList || preparingShoppingListItems}
                          className="bg-secondary text-white hover:bg-secondary/90"
                        >
                          {savingShoppingList || preparingShoppingListItems ? 'Criando...' : 'Criar e continuar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {shoppingLists.map((list) => {
                          const isSelected = selectedShoppingList?.id === list.id;

                          return (
                            <button
                              key={list.id}
                              type="button"
                              onClick={() => setSelectedShoppingList(list)}
                              className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
                                isSelected
                                  ? 'border-secondary bg-secondary/10'
                                  : 'border-gray-200 bg-white hover:border-secondary/40 hover:bg-secondary/5'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-800">{list.name}</p>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {list.pendingItemCount ?? 0} pendentes de {list.itemCount ?? 0} itens
                                  </p>
                                </div>
                                {isSelected && (
                                  <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-white">
                                    Selecionada
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateShoppingList(true)}
                        className="w-full border-secondary text-secondary hover:bg-secondary/10"
                      >
                        <Plus className="h-4 w-4" />
                        Criar nova lista
                      </Button>

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleShoppingListModalChange(false)}
                          className="text-gray-700 hover:bg-gray-100"
                        >
                          Fechar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => selectedShoppingList && handlePrepareShoppingListItems(selectedShoppingList)}
                          disabled={!selectedShoppingList || preparingShoppingListItems}
                          className="bg-secondary text-white hover:bg-secondary/90"
                        >
                          {preparingShoppingListItems ? 'Preparando ingredientes...' : 'Continuar'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {shoppingListStep === 'confirm-items' && selectedShoppingList && (
              <>
                <div className="mb-4 space-y-1.5 text-left">
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-black">Confirmar ingredientes</h2>
                  <p className="text-sm text-black/90">
                    Revise o que vai entrar em <span className="font-semibold text-gray-900">{selectedShoppingList.name}</span>. Você pode remover o que não quiser adicionar agora.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-secondary/10 px-3 py-1 font-semibold text-secondary">
                      {shoppingListDraftItems.filter((item) => item.selected && !item.alreadyInList).length} para adicionar
                    </span>
                    {shoppingListDraftItems.some((item) => item.alreadyInList) && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
                        {shoppingListDraftItems.filter((item) => item.alreadyInList).length} já estavam na lista
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {shoppingListDraftItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                          item.selected ? 'border-secondary/25 bg-secondary/5' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium ${item.selected ? 'text-gray-800' : 'text-gray-500'} ${!item.selected && !item.alreadyInList ? 'line-through' : ''}`}>
                            {item.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                            {item.quantityText && <span className="text-gray-500">{item.quantityText}</span>}
                            {item.alreadyInList && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                Já está na lista
                              </span>
                            )}
                          </div>
                        </div>

                        {item.alreadyInList ? (
                          <Button
                            type="button"
                            variant="ghost"
                            disabled
                            className="text-gray-400"
                          >
                            Na lista
                          </Button>
                        ) : item.selected ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleToggleDraftShoppingItem(item.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleToggleDraftShoppingItem(item.id)}
                            className="text-secondary hover:bg-secondary/10"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShoppingListStep('select-list')}
                      disabled={savingShoppingListItems}
                      className="text-gray-700 hover:bg-gray-100"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveRecipeToShoppingList}
                      disabled={savingShoppingListItems}
                      className="bg-secondary text-white hover:bg-secondary/90"
                    >
                      {savingShoppingListItems ? 'Atualizando lista...' : 'Confirmar ingredientes'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {shoppingListStep === 'success' && shoppingListSaveResult && (
              <>
                <div className="mb-4 space-y-1.5 text-left">
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-black">Sua lista foi atualizada</h2>
                  <p className="text-sm text-black/90">
                    {shoppingListSaveResult.addedCount > 0
                      ? `${shoppingListSaveResult.addedCount} ingrediente${shoppingListSaveResult.addedCount > 1 ? 's foram adicionados' : ' foi adicionado'} em ${shoppingListSaveResult.listName}.`
                      : `${shoppingListSaveResult.listName} já tinha todos os ingredientes selecionados.`}
                  </p>
                </div>

                <div className="grid gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      trackEvent('shopping_list_recipe_success_continue_recipe', {
                        recipeId: params.id,
                        listId: shoppingListSaveResult.listId,
                      });
                      handleShoppingListModalChange(false);
                    }}
                    className="w-full bg-secondary text-white hover:bg-secondary/90"
                  >
                    Continuar vendo a receita
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      trackEvent('shopping_list_recipe_success_view_list', {
                        recipeId: params.id,
                        listId: shoppingListSaveResult.listId,
                      });
                      handleShoppingListModalChange(false);
                      router.push(`/lista-de-compras/${shoppingListSaveResult.listId}`);
                    }}
                    className="w-full border-secondary text-secondary hover:bg-secondary/10"
                  >
                    Ver lista
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

        <RecipeOptionsModal
          isOpen={showRecipeOptionsModal}
          onClose={handleCloseRecipeOptionsModal}
          loading={recipeOptionsLoading}
          savingRecipe={savingRecipeOption}
          loadingMsgIndex={recipeOptionsLoadingMsgIndex}
          loadingMessages={recipeOptionsLoadingMessages}
          recipeOptions={recipeOptions}
          onSelectRecipe={handleSelectRecipeOption}
          onRefresh={() => generateMoreRecipeOptions()}
          onChangeIngredients={handleChangeIngredients}
          onRefine={generateMoreRecipeOptions}
          refining={recipeOptionsLoading}
        />

        <RecipeLimitModal
          isOpen={showRecipeLimitModal}
          surveyAlreadyCompleted={!!user?.surveyCompletedAt}
          onClose={() => {
            trackEvent('recipe_limit_dismissed');
            setShowRecipeLimitModal(false);
          }}
          onStartSurvey={() => {
            setShowRecipeLimitModal(false);
            setShowSurveyModal(true);
          }}
          onUpgrade={() => {
            setShowRecipeLimitModal(false);
            router.push('/plans');
          }}
        />

        <SurveyRewardModal
          isOpen={showSurveyModal}
          onClose={() => {
            trackEvent('survey_dismissed');
            setShowSurveyModal(false);
          }}
          onComplete={() => {
            setShowSurveyModal(false);
            toast({
              title: 'Pronto! +5 receitas adicionadas 🎉',
              description: 'Obrigado pelo seu feedback!',
            });
          }}
        />

        <AppInstallNudgeModal
          isOpen={showInstallNudgeModal}
          isIOS={isIOS}
          onCloseButton={() => handleInstallPromptDismiss('close_button')}
          onDismissButton={() => handleInstallPromptDismiss('dismiss_button')}
          onBackdropClose={() => handleInstallPromptDismiss('backdrop')}
          onConfirm={handleConfirmInstallNudge}
        />

        <AppInstallGuideModal
          isOpen={showIOSGuide}
          onClose={() => {
            trackEvent('pwa_ios_guide_dismissed', { source: 'feedback_positive' });
            setShowIOSGuide(false);
          }}
        />


        {/* Feedback modal - appears after 30s if user hasn't given feedback */}
        {user && <FeedbackModal recipeId={params.id as string} sharedFeedback={sharedFeedback} resetKey={feedbackResetKey} />}
      </>
    </div>
  );
};

export default RecipePage;
