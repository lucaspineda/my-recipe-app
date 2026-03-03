'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../hooks/userAuth';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Separator } from '@radix-ui/react-separator';
import { ChefHat, Share2, Link, MessageCircle, ChevronDown, Sparkles, Lock, Send } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DialogHeader } from '../../ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useRecipeStore } from '../../store/recipe';
import { useUserStore } from '../../store/user';
import { FeedbackSection, useFeedback } from '../../components/FeedbackSection/FeedbackSection';
import { FeedbackModal } from '../../components/FeedbackSection/FeedbackModal';
import { trackPageVisit, trackEvent, generateRecipeImage } from '../../lib/utils';

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

const RecipePage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [recipes, setRecipes] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [chatFeatureDialogOpen, setChatFeatureDialogOpen] = useState(false);
  const [nutritionalInfoOpen, setNutritionalInfoOpen] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const imageGenerationTriggered = useRef(false);
  const { setShowRecipe, recipe } = useRecipeStore();
  const { user } = useUserStore();
  const sharedFeedback = useFeedback(params.id as string);

    useEffect(() => {
      trackPageVisit('recipe-details');
    }, []);
  
  // Check if user is on Pro plan (planId 2 or 3)
  const isPro = user?.plan?.planId >= 2;
  
  // Check if this is the current user's own recipe
  const isOwnRecipe = user?.uid && recipes?.userId === user.uid;

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
                {recipes.ingredients.map((ingredient: any, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#F57C00] rounded-full mt-2 shrink-0" />
                    <span className="text-[#5C5C5C]">
                      {ingredient.nome || ingredient.item} - {ingredient.quantidade}
                    </span>
                  </li>
                ))}
              </ul>
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
              {/* Seção de ajuda do Chefinho - Only show if user is logged in */}
              {user && (
                <div className="bg-secondary/10 border-2 border-secondary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-secondary flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-700">Refine sua receita</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: substituir manteiga, deixar mais saudável..."
                      className="flex-1 text-sm border border-secondary/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/50 bg-white placeholder:text-gray-400"
                      onFocus={() => setChatFeatureDialogOpen(true)}
                    />
                    <Button
                      className="h-auto min-h-[40px] px-3 bg-secondary text-white hover:bg-secondary/90 transition-colors flex items-center justify-center"
                      onClick={() => setChatFeatureDialogOpen(true)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Botões de compartilhar e gerar nova receita */}
              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  onClick={() => {
                    trackEvent('share_button_click');
                    setShareDialogOpen(true);
                  }}
                  className="flex-1 bg-[#F57C00] text-white font-semibold hover:bg-[#E64A19] transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>

                {user && (
                  <Button
                    variant="secondary"
                    className="flex-1 text-white font-semibold transition-colors"
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
              {user && isOwnRecipe && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-700 text-center">
                    ✓ Esta receita foi salva automaticamente. Para ver todas as suas receitas salvas, clique no botão abaixo.
                  </p>
                  <Button
                    onClick={() => {
                      trackEvent('view_saved_recipes');
                      router.push('/minhas-receitas');
                    }}
                    variant="outline"
                    className="w-full mt-3 border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 font-semibold"
                  >
                    Ver Receitas Salvas
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
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

        {/* Modal de funcionalidade de chat */}
        <Dialog open={chatFeatureDialogOpen} onOpenChange={setChatFeatureDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white text-black">
            <DialogHeader>
              <DialogTitle className="text-black">Nova Funcionalidade em Desenvolvimento</DialogTitle>
              <DialogDescription className="text-black/90">
                Estamos trabalhando nessa funcionalidade para você poder conversar com o Chefinho IA sobre suas receitas!
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-center text-gray-700 mb-6">
                Você pagaria por essa funcionalidade?
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => {
                    setChatFeatureDialogOpen(false);
                    trackEvent('chat_feature_feedback', { response: 'yes' });
                    toast({
                      title: 'Obrigado!',
                      description: 'Sua opinião é muito importante para nós. Vamos considerar isso no desenvolvimento.',
                    });
                  }}
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  Sim
                </Button>
                <Button
                  onClick={() => {
                    setChatFeatureDialogOpen(false);
                    trackEvent('chat_feature_feedback', { response: 'maybe' });
                    toast({
                      title: 'Obrigado!',
                      description: 'Sua opinião é muito importante para nós.',
                    });
                  }}
                  variant="outline"
                  className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                >
                  Talvez
                </Button>
                <Button
                  onClick={() => {
                    setChatFeatureDialogOpen(false);
                    trackEvent('chat_feature_feedback', { response: 'no' });
                    toast({
                      title: 'Obrigado!',
                      description: 'Sua opinião é muito importante para nós.',
                    });
                  }}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Não
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback modal - appears after 30s if user hasn't given feedback */}
        {user && <FeedbackModal recipeId={params.id as string} sharedFeedback={sharedFeedback} />}
      </>
    </div>
  );
};

export default RecipePage;
