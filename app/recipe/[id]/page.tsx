'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../hooks/userAuth';
import axios from 'axios';
import { getIdToken } from 'firebase/auth';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Separator } from '@radix-ui/react-separator';
import { ChefHat, Share2, Link, MessageCircle, ChevronDown, Sparkles, Lock, Wand2, ShoppingCart, CalendarRange } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DialogHeader } from '../../ui/dialog';
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
import { getRecipeIngredientDisplayText } from './shopping-list/utils';
import { useRecipeShoppingListFlow } from './shopping-list/useRecipeShoppingListFlow';
import RecipeShoppingListModal from './shopping-list/RecipeShoppingListModal';
import { useRecipeMealPlannerFlow } from './meal-planner/useRecipeMealPlannerFlow';
import RecipeMealPlannerModal from './meal-planner/RecipeMealPlannerModal';

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

const RecipePage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [recipes, setRecipes] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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
  const shoppingListFlow = useRecipeShoppingListFlow({
    recipeId: params.id as string,
    recipeTitle: recipes?.title,
    recipeIngredients: recipes?.ingredients,
    user,
    isOwnRecipe: Boolean(isOwnRecipe),
  });
  const mealPlannerFlow = useRecipeMealPlannerFlow({
    recipeId: params.id as string,
    recipeTitle: recipes?.title,
    user,
  });

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
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={shoppingListFlow.openModal}
                    className="w-full bg-[#F57C00] text-white font-semibold hover:bg-[#E64A19]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Adicionar a lista de compras
                  </Button>
                  <Button
                    variant="outline"
                    onClick={mealPlannerFlow.openModal}
                    className="w-full border-[#F57C00]/30 bg-white text-[#F57C00] font-semibold hover:bg-[#FFF1E6]"
                  >
                    <CalendarRange className="w-4 h-4" />
                    Planejar refeição
                  </Button>
                </div>
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

        <RecipeShoppingListModal
          isOpen={shoppingListFlow.modalOpen}
          step={shoppingListFlow.step}
          loadingLists={shoppingListFlow.loadingLists}
          lists={shoppingListFlow.lists}
          selectedList={shoppingListFlow.selectedList}
          showCreateList={shoppingListFlow.showCreateList}
          listName={shoppingListFlow.listName}
          savingList={shoppingListFlow.savingList}
          preparingItems={shoppingListFlow.preparingItems}
          draftItems={shoppingListFlow.draftItems}
          savingItems={shoppingListFlow.savingItems}
          saveResult={shoppingListFlow.saveResult}
          onClose={shoppingListFlow.closeModal}
          onSelectList={shoppingListFlow.setSelectedList}
          onShowCreateList={() => shoppingListFlow.setShowCreateList(true)}
          onHideCreateList={() => {
            shoppingListFlow.setShowCreateList(false);
            shoppingListFlow.setListName('');
          }}
          onListNameChange={shoppingListFlow.setListName}
          onCreateList={shoppingListFlow.createList}
          onContinueToConfirm={() => {
            if (shoppingListFlow.selectedList) {
              shoppingListFlow.prepareItems(shoppingListFlow.selectedList);
            }
          }}
          onToggleDraftItem={shoppingListFlow.toggleDraftItem}
          onBack={() => shoppingListFlow.setStep('select-list')}
          onSaveItems={shoppingListFlow.saveItems}
          onContinueViewingRecipe={shoppingListFlow.continueViewingRecipe}
          onViewList={shoppingListFlow.viewShoppingList}
        />

        <RecipeMealPlannerModal
          isOpen={mealPlannerFlow.modalOpen}
          savingMeal={mealPlannerFlow.savingMeal}
          selectedDateKey={mealPlannerFlow.selectedDateKey}
          selectedSlot={mealPlannerFlow.selectedSlot}
          servings={mealPlannerFlow.servings}
          note={mealPlannerFlow.note}
          recipeTitle={recipes?.title}
          weekDayOptions={mealPlannerFlow.weekDayOptions}
          onClose={mealPlannerFlow.closeModal}
          onSelectedDateChange={mealPlannerFlow.setSelectedDateKey}
          onSelectedSlotChange={mealPlannerFlow.setSelectedSlot}
          onServingsChange={mealPlannerFlow.setServings}
          onNoteChange={mealPlannerFlow.setNote}
          onSave={mealPlannerFlow.savePlannedMeal}
          onViewPlanner={mealPlannerFlow.viewPlanner}
        />

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
